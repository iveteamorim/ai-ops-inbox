import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { enforceSameOrigin } from "@/lib/security/request-origin";
import { getWorkspaceMember } from "@/lib/workspace-access";

type Body = {
  waba_id?: string;
  phone_number_id?: string;
  display_phone_number?: string;
  business_name?: string;
  code?: string;
};

type ChannelRow = {
  id: string;
  config: Record<string, unknown> | null;
};

function cleanString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export async function POST(request: Request) {
  const originError = enforceSameOrigin(request);
  if (originError) return originError;

  const body = (await request.json().catch(() => ({}))) as Body;
  const wabaId = cleanString(body.waba_id);
  const phoneNumberId = cleanString(body.phone_number_id);
  const displayPhoneNumber = cleanString(body.display_phone_number);
  const businessName = cleanString(body.business_name);
  const authCodeReceived = Boolean(cleanString(body.code));

  if (!wabaId || !phoneNumberId) {
    return NextResponse.json({ ok: false, error: "missing_embedded_signup_data" }, { status: 400 });
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

  const admin = createAdminClient();
  let profile;
  try {
    profile = await getWorkspaceMember(user);
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "workspace_bootstrap_failed" },
      { status: 500 },
    );
  }

  const connectedAt = new Date().toISOString();
  const embeddedConfig = {
    connection_method: "meta_embedded_signup",
    waba_id: wabaId,
    phone_number_id: phoneNumberId,
    display_phone_number: displayPhoneNumber,
    business_name: businessName,
    authorization_code_received: authCodeReceived,
    connected_at: connectedAt,
    connected_by_user_id: user.id,
  };

  const { data: existingChannel, error: existingChannelError } = await admin
    .from("channels")
    .select("id, config")
    .eq("company_id", profile.company_id)
    .eq("type", "whatsapp")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle<ChannelRow>();

  if (existingChannelError) {
    return NextResponse.json({ ok: false, error: existingChannelError.message }, { status: 500 });
  }

  const payload = {
    external_account_id: phoneNumberId,
    is_active: true,
    config: {
      ...(existingChannel?.config ?? {}),
      ...embeddedConfig,
    },
  };

  if (existingChannel) {
    const { error: updateError } = await admin
      .from("channels")
      .update(payload)
      .eq("id", existingChannel.id);

    if (updateError) {
      const message = updateError.message.toLowerCase().includes("duplicate")
        ? "phone_number_already_connected"
        : updateError.message;
      return NextResponse.json({ ok: false, error: message }, { status: 500 });
    }
  } else {
    const { error: insertError } = await admin.from("channels").insert({
      company_id: profile.company_id,
      type: "whatsapp",
      ...payload,
    });

    if (insertError) {
      const message = insertError.message.toLowerCase().includes("duplicate")
        ? "phone_number_already_connected"
        : insertError.message;
      return NextResponse.json({ ok: false, error: message }, { status: 500 });
    }
  }

  await admin
    .from("setup_requests")
    .update({
      status: "completed",
      notes: [
        displayPhoneNumber ? `WhatsApp number: ${displayPhoneNumber}` : "",
        "Connected via Meta Embedded Signup",
        `WABA ID: ${wabaId}`,
        `Phone number ID: ${phoneNumberId}`,
      ]
        .filter(Boolean)
        .join("\n"),
    })
    .eq("company_id", profile.company_id)
    .eq("channel", "whatsapp")
    .in("status", ["requested", "in_progress"]);

  return NextResponse.json({
    ok: true,
    channel: {
      type: "whatsapp",
      external_account_id: phoneNumberId,
      display_phone_number: displayPhoneNumber,
      business_name: businessName,
      connection_method: "meta_embedded_signup",
    },
  });
}
