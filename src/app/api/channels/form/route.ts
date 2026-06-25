import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { getPublicAppUrl } from "@/lib/app-url";
import { buildFormEmbedSnippet, buildFormPublicUrl } from "@/lib/messaging/form";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { enforceSameOrigin } from "@/lib/security/request-origin";
import { canManageWorkspace, getWorkspaceMember } from "@/lib/workspace-access";

type ChannelRow = {
  id: string;
  external_account_id: string | null;
  is_active: boolean;
  config: Record<string, unknown> | null;
};

function createFormToken() {
  return randomBytes(24).toString("base64url");
}

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
    .eq("type", "form")
    .maybeSingle<ChannelRow>();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const token = channel?.is_active ? channel.external_account_id : null;
  const appUrl = getPublicAppUrl(request);

  return NextResponse.json({
    ok: true,
    active: Boolean(channel?.is_active && token),
    token,
    website_link: token ? buildFormPublicUrl(appUrl, token) : null,
    endpoint: `${appUrl}/api/leads/form`,
    embed: token ? buildFormEmbedSnippet(appUrl, token) : null,
  });
}

export async function POST(request: Request) {
  const originError = enforceSameOrigin(request);
  if (originError) return originError;

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
  const body = (await request.json().catch(() => ({}))) as { regenerate?: boolean };
  const shouldRegenerate = body.regenerate === true;

  const { data: existingChannel, error: existingError } = await admin
    .from("channels")
    .select("id, external_account_id, is_active, config")
    .eq("company_id", profile.company_id)
    .eq("type", "form")
    .maybeSingle<ChannelRow>();

  if (existingError) {
    return NextResponse.json({ ok: false, error: existingError.message }, { status: 500 });
  }

  const token =
    existingChannel?.external_account_id && !shouldRegenerate
      ? existingChannel.external_account_id
      : createFormToken();

  if (existingChannel?.id) {
    const { error: updateError } = await admin
      .from("channels")
      .update({
        external_account_id: token,
        is_active: true,
        config: {
          ...(existingChannel.config ?? {}),
          connection_method: "web_form",
          activated_at: now,
          activated_by_user_id: user.id,
        },
      })
      .eq("id", existingChannel.id);

    if (updateError) {
      return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });
    }
  } else {
    const { error: insertError } = await admin.from("channels").insert({
      company_id: profile.company_id,
      type: "form",
      external_account_id: token,
      is_active: true,
      config: {
        connection_method: "web_form",
        activated_at: now,
        activated_by_user_id: user.id,
      },
    });

    if (insertError) {
      return NextResponse.json({ ok: false, error: insertError.message }, { status: 500 });
    }
  }

  return NextResponse.json({
    ok: true,
    token,
    website_link: buildFormPublicUrl(appUrl, token),
    endpoint: `${appUrl}/api/leads/form`,
    embed: buildFormEmbedSnippet(appUrl, token),
  });
}
