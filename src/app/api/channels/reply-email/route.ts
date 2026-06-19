import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { enforceSameOrigin } from "@/lib/security/request-origin";
import { isValidEmailAddress, normalizeEmailAddress } from "@/lib/messaging/email-config";
import {
  buildPendingEmailVerification,
  isPendingVerificationValid,
  type PendingEmailVerification,
} from "@/lib/messaging/email-platform";
import {
  emailReplyConfigStateToChannelConfig,
  parseEmailReplyConfigState,
  pendingVerificationToChannelConfig,
} from "@/lib/messaging/email-reply-state";
import { isEmailSendingConfigured, sendVerificationEmail } from "@/lib/messaging/email-send";
import { canManageWorkspace, getWorkspaceMember } from "@/lib/workspace-access";

type ChannelType = "form" | "email";

type ChannelRow = {
  id: string;
  config: Record<string, unknown> | null;
  is_active?: boolean;
};

function parseChannelType(value: unknown): ChannelType | null {
  return value === "form" || value === "email" ? value : null;
}

async function loadChannel(admin: ReturnType<typeof createAdminClient>, companyId: string, channelType: ChannelType) {
  return admin
    .from("channels")
    .select("id, config, is_active")
    .eq("company_id", companyId)
    .eq("type", channelType)
    .maybeSingle<ChannelRow>();
}

function readPendingVerification(config: Record<string, unknown> | null | undefined): PendingEmailVerification | null {
  const raw = config?.reply_email_pending;
  if (!raw || typeof raw !== "object") return null;

  const pending = raw as Record<string, unknown>;
  const email = typeof pending.email === "string" ? normalizeEmailAddress(pending.email) : "";
  const code = typeof pending.code === "string" ? pending.code.trim() : "";
  const expiresAt = typeof pending.expires_at === "string" ? pending.expires_at : "";
  const fromName =
    typeof pending.from_name === "string" && pending.from_name.trim() ? pending.from_name.trim() : null;

  if (!email || !code || !expiresAt) return null;
  return { email, code, expires_at: expiresAt, from_name: fromName };
}

export async function POST(request: Request) {
  const originError = enforceSameOrigin(request);
  if (originError) return originError;

  const body = (await request.json().catch(() => ({}))) as {
    channel?: string;
    action?: string;
    email?: string;
    code?: string;
    from_name?: string;
  };

  const channelType = parseChannelType(body.channel);
  const action = body.action === "confirm" ? "confirm" : body.action === "verify" ? "verify" : null;

  if (!channelType || !action) {
    return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
  }

  const email = normalizeEmailAddress(body.email);
  if (!email || !isValidEmailAddress(email)) {
    return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 });
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
  const { data: loadedChannel, error: channelError } = await loadChannel(admin, profile.company_id, channelType);

  if (channelError) {
    return NextResponse.json({ ok: false, error: channelError.message }, { status: 500 });
  }

  let channel = loadedChannel;

  if (!channel?.id) {
    if (channelType === "form") {
      return NextResponse.json({ ok: false, error: "channel_not_active" }, { status: 400 });
    }

    const fromName =
      typeof body.from_name === "string" && body.from_name.trim() ? body.from_name.trim() : null;
    const pending = buildPendingEmailVerification(email, fromName);
    const nextConfig = pendingVerificationToChannelConfig(pending);

    const { data: inserted, error: insertError } = await admin
      .from("channels")
      .insert({
        company_id: profile.company_id,
        type: "email",
        external_account_id: email,
        is_active: false,
        config: nextConfig,
      })
      .select("id, config")
      .single<ChannelRow>();

    if (insertError || !inserted?.id) {
      return NextResponse.json({ ok: false, error: insertError?.message ?? "channel_create_failed" }, { status: 500 });
    }

    channel = inserted;
  } else if (channelType === "form" && !channel.is_active) {
    return NextResponse.json({ ok: false, error: "channel_not_active" }, { status: 400 });
  }

  if (action === "verify") {
    if (!isEmailSendingConfigured()) {
      return NextResponse.json({ ok: false, error: "email_provider_not_configured" }, { status: 503 });
    }

    const fromName =
      typeof body.from_name === "string" && body.from_name.trim() ? body.from_name.trim() : null;
    const pending = buildPendingEmailVerification(email, fromName);

    const nextConfig = {
      ...(channel.config ?? {}),
      ...pendingVerificationToChannelConfig(pending),
    };

    const { error: updateError } = await admin.from("channels").update({ config: nextConfig }).eq("id", channel.id);
    if (updateError) {
      return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });
    }

    try {
      await sendVerificationEmail({
        to: email,
        code: pending.code,
        businessName: fromName,
      });
    } catch (error) {
      return NextResponse.json(
        {
          ok: false,
          error: error instanceof Error ? error.message : "verification_email_failed",
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      ok: true,
      verification_sent: true,
      email,
    });
  }

  const code = typeof body.code === "string" ? body.code.trim() : "";
  if (!code) {
    return NextResponse.json({ ok: false, error: "code_required" }, { status: 400 });
  }

  const pending = readPendingVerification(channel.config);
  if (!isPendingVerificationValid(pending, email, code)) {
    return NextResponse.json({ ok: false, error: "invalid_verification_code" }, { status: 400 });
  }

  const verifiedConfig = emailReplyConfigStateToChannelConfig({
    from_email: email,
    from_name: pending?.from_name ?? null,
    reply_to: email,
    verified: true,
  });

  const nextConfig: Record<string, unknown> = {
    ...(channel.config ?? {}),
    ...verifiedConfig,
  };
  delete nextConfig.reply_email_pending;

  const { error: updateError } = await admin.from("channels").update({ config: nextConfig }).eq("id", channel.id);

  if (updateError) {
    return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });
  }

  if (channelType === "email" && !channel.is_active) {
    await admin
      .from("channels")
      .update({
        external_account_id: email,
        is_active: true,
      })
      .eq("id", channel.id);
  }

  return NextResponse.json({
    ok: true,
    verified: true,
    reply: parseEmailReplyConfigState(nextConfig),
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const channelType = parseChannelType(searchParams.get("channel"));

  if (!channelType) {
    return NextResponse.json({ ok: false, error: "invalid_channel" }, { status: 400 });
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

  const admin = createAdminClient();
  const { data: channel, error } = await loadChannel(admin, profile.company_id, channelType);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    reply: parseEmailReplyConfigState(channel?.config ?? null),
    pending: Boolean(readPendingVerification(channel?.config ?? null)),
  });
}
