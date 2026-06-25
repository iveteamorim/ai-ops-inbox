import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { enforceSameOrigin } from "@/lib/security/request-origin";
import {
  normalizeGoogleFormsActionUrl,
  parseGoogleFormsBackupConfig,
  type GoogleFormsBackupConfig,
} from "@/lib/messaging/google-forms-backup";
import { canManageWorkspace, getWorkspaceMember } from "@/lib/workspace-access";

type ChannelRow = {
  id: string;
  config: Record<string, unknown> | null;
};

type PatchBody = {
  action_url?: string;
  entry_name?: string;
  entry_email?: string;
  entry_phone?: string;
  entry_message?: string;
  enabled?: boolean;
};

function buildBackupConfig(body: PatchBody): GoogleFormsBackupConfig | null {
  if (body.enabled === false) {
    return null;
  }

  const actionUrl = normalizeGoogleFormsActionUrl(body.action_url ?? "");
  const name = body.entry_name?.trim() ?? "";
  const message = body.entry_message?.trim() ?? "";
  const email = body.entry_email?.trim() ?? "";
  const phone = body.entry_phone?.trim() ?? "";

  if (!actionUrl || !name.startsWith("entry.") || !message.startsWith("entry.")) {
    return null;
  }

  return {
    action_url: actionUrl,
    fields: {
      name,
      message,
      ...(email.startsWith("entry.") ? { email } : {}),
      ...(phone.startsWith("entry.") ? { phone } : {}),
    },
  };
}

export async function PATCH(request: Request) {
  const originError = enforceSameOrigin(request);
  if (originError) return originError;

  const body = (await request.json().catch(() => ({}))) as PatchBody;

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

  const backup = buildBackupConfig(body);
  if (body.enabled !== false && !backup) {
    return NextResponse.json({ ok: false, error: "invalid_google_forms_backup" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: channel, error: channelError } = await admin
    .from("channels")
    .select("id, config")
    .eq("company_id", profile.company_id)
    .eq("type", "form")
    .maybeSingle<ChannelRow>();

  if (channelError) {
    return NextResponse.json({ ok: false, error: channelError.message }, { status: 500 });
  }

  if (!channel?.id) {
    return NextResponse.json({ ok: false, error: "form_channel_not_active" }, { status: 400 });
  }

  const nextConfig = { ...(channel.config ?? {}) };
  if (backup) {
    nextConfig.google_forms_backup = backup;
  } else {
    delete nextConfig.google_forms_backup;
  }

  const { error: updateError } = await admin
    .from("channels")
    .update({ config: nextConfig })
    .eq("id", channel.id);

  if (updateError) {
    return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    google_forms_backup: parseGoogleFormsBackupConfig(nextConfig),
  });
}
