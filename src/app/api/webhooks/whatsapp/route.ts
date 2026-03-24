import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { extractInboundMessages } from "@/lib/messaging/whatsapp";
import { persistWhatsAppInbound } from "@/lib/messaging/repository";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (
    mode === "subscribe" &&
    token &&
    challenge &&
    token === process.env.WHATSAPP_VERIFY_TOKEN
  ) {
    return new Response(challenge, { status: 200 });
  }

  return NextResponse.json({ ok: false, error: "verification_failed" }, { status: 403 });
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const inboundMessages = extractInboundMessages(payload);

  if (inboundMessages.length === 0) {
    return NextResponse.json({ ok: true, processed: 0, note: "no_inbound_text_messages" });
  }

  let supabase;
  try {
    supabase = createAdminClient();
  } catch {
    return NextResponse.json(
      {
        ok: true,
        processed: 0,
        note: "supabase_not_configured",
      },
      { status: 202 },
    );
  }

  const results = [];
  for (const message of inboundMessages) {
    try {
      const saved = await persistWhatsAppInbound(supabase, message);
      results.push({ id: message.externalMessageId, ...saved });
    } catch (error) {
      results.push({
        id: message.externalMessageId,
        saved: false,
        reason: error instanceof Error ? error.message : "unknown_error",
      });
    }
  }

  const processed = results.filter((r) => r.saved).length;
  return NextResponse.json({ ok: true, processed, results });
}
