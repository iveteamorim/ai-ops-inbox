import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { enforceSameOrigin } from "@/lib/security/request-origin";
import {
  buildEmailReplyConfigPatch,
  emailReplyConfigToChannelConfig,
  parseEmailReplyConfig,
} from "@/lib/messaging/email-config";
import { canManageWorkspace, getWorkspaceMember } from "@/lib/workspace-access";

type ChannelRow = {
  id: string;
  config: Record<string, unknown> | null;
};

export async function GET() {
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
    .select("id, config, is_active")
    .eq("company_id", profile.company_id)
    .eq("type", "form")
    .maybeSingle<ChannelRow & { is_active: boolean }>();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const reply = parseEmailReplyConfig(channel?.config ?? null);

  return NextResponse.json({
    ok: true,
    active: Boolean(channel?.is_active),
    reply,
  });
}

export async function PATCH(request: Request) {
  const originError = enforceSameOrigin(request);
  if (originError) return originError;

  const body = (await request.json().catch(() => ({}))) as {
    from_email?: string;
    from_name?: string;
    reply_to?: string;
  };

  const parsed = buildEmailReplyConfigPatch(body);
  if (!parsed.ok) {
    return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
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
  const { data: channel, error: channelError } = await admin
    .from("channels")
    .select("id, config, is_active")
    .eq("company_id", profile.company_id)
    .eq("type", "form")
    .maybeSingle<ChannelRow & { is_active: boolean }>();

  if (channelError) {
    return NextResponse.json({ ok: false, error: channelError.message }, { status: 500 });
  }

  if (!channel?.id || !channel.is_active) {
    return NextResponse.json({ ok: false, error: "form_channel_not_active" }, { status: 400 });
  }

  const nextConfig = {
    ...(channel.config ?? {}),
    ...emailReplyConfigToChannelConfig(parsed.value),
  };

  const { error: updateError } = await admin
    .from("channels")
    .update({ config: nextConfig })
    .eq("id", channel.id);

  if (updateError) {
    return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    reply: parseEmailReplyConfig(nextConfig),
  });
}
