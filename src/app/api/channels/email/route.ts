import { NextResponse } from "next/server";
import { getPublicAppUrl } from "@/lib/app-url";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { enforceSameOrigin } from "@/lib/security/request-origin";
import {
  buildEmailReplyConfigPatch,
  emailReplyConfigToChannelConfig,
  isValidEmailAddress,
  normalizeEmailAddress,
  parseEmailReplyConfig,
} from "@/lib/messaging/email-config";
import { canManageWorkspace, getWorkspaceMember } from "@/lib/workspace-access";

type ChannelRow = {
  id: string;
  external_account_id: string | null;
  is_active: boolean;
  config: Record<string, unknown> | null;
};

export async function GET(request: Request) {
  let supabase;
  try {
    supabase = await createClient();
  } catch {
    return NextResponse.json({ ok: false, error: "supabase_not_configured" }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const profile = await getWorkspaceMember(user).catch(() => null);
  if (!profile) {
    return NextResponse.json({ ok: false, error: "workspace_not_found" }, { status: 404 });
  }

  const admin = createAdminClient();
  const { data: channel, error } = await admin
    .from("channels")
    .select("id, external_account_id, is_active, config")
    .eq("company_id", profile.company_id)
    .eq("type", "email")
    .maybeSingle<ChannelRow>();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const appUrl = getPublicAppUrl(request);
  const reply = parseEmailReplyConfig(channel?.config ?? null);

  return NextResponse.json({
    ok: true,
    active: Boolean(channel?.is_active && channel.external_account_id),
    inbound_address: channel?.external_account_id ?? null,
    reply,
    webhook_url: `${appUrl}/api/webhooks/email`,
  });
}

export async function POST(request: Request) {
  const originError = enforceSameOrigin(request);
  if (originError) return originError;

  const body = (await request.json().catch(() => ({}))) as {
    inbound_address?: string;
    from_email?: string;
    from_name?: string;
    reply_to?: string;
  };

  const inboundAddress = normalizeEmailAddress(body.inbound_address);
  if (!inboundAddress || !isValidEmailAddress(inboundAddress)) {
    return NextResponse.json({ ok: false, error: "invalid_inbound_address" }, { status: 400 });
  }

  const parsedReply = buildEmailReplyConfigPatch({
    from_email: body.from_email,
    from_name: body.from_name,
    reply_to: body.reply_to,
  });

  if (!parsedReply.ok) {
    return NextResponse.json({ ok: false, error: parsedReply.error }, { status: 400 });
  }

  let supabase;
  try {
    supabase = await createClient();
  } catch {
    return NextResponse.json({ ok: false, error: "supabase_not_configured" }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const profile = await getWorkspaceMember(user).catch(() => null);
  if (!profile) {
    return NextResponse.json({ ok: false, error: "workspace_not_found" }, { status: 404 });
  }

  if (!canManageWorkspace(profile.role)) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();
  const now = new Date().toISOString();
  const appUrl = getPublicAppUrl(request);

  const { data: existingChannel, error: existingError } = await admin
    .from("channels")
    .select("id, config")
    .eq("company_id", profile.company_id)
    .eq("type", "email")
    .maybeSingle<ChannelRow>();

  if (existingError) {
    return NextResponse.json({ ok: false, error: existingError.message }, { status: 500 });
  }

  const nextConfig = {
    ...(existingChannel?.config ?? {}),
    ...emailReplyConfigToChannelConfig(parsedReply.value),
    connection_method: "resend_inbound",
    activated_at: now,
    activated_by_user_id: user.id,
  };

  if (existingChannel?.id) {
    const { error: updateError } = await admin
      .from("channels")
      .update({
        external_account_id: inboundAddress,
        is_active: true,
        config: nextConfig,
      })
      .eq("id", existingChannel.id);

    if (updateError) {
      return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });
    }
  } else {
    const { error: insertError } = await admin.from("channels").insert({
      company_id: profile.company_id,
      type: "email",
      external_account_id: inboundAddress,
      is_active: true,
      config: nextConfig,
    });

    if (insertError) {
      return NextResponse.json({ ok: false, error: insertError.message }, { status: 500 });
    }
  }

  return NextResponse.json({
    ok: true,
    inbound_address: inboundAddress,
    reply: parseEmailReplyConfig(nextConfig),
    webhook_url: `${appUrl}/api/webhooks/email`,
  });
}
