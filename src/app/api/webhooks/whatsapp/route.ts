import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { extractInboundMessages } from "@/lib/messaging/whatsapp";
import { persistWhatsAppInbound } from "@/lib/messaging/repository";

function verifyWhatsAppSignature(rawBody: string, signatureHeader: string | null): boolean {
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (!appSecret || !signatureHeader || !signatureHeader.startsWith("sha256=")) {
    return false;
  }

  const received = signatureHeader.slice("sha256=".length);
  if (!/^[a-fA-F0-9]{64}$/.test(received)) {
    return false;
  }

  const expected = createHmac("sha256", appSecret).update(rawBody).digest("hex");

  try {
    return timingSafeEqual(Buffer.from(received, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");
  const verifyTokens = [process.env.WHATSAPP_VERIFY_TOKEN].filter((value): value is string => Boolean(value));

  if (mode === "subscribe" && token && challenge && verifyTokens.includes(token)) {
    return new Response(challenge, { status: 200 });
  }

  return NextResponse.json({ ok: false, error: "verification_failed" }, { status: 403 });
}

export async function POST(request: Request) {
  if (!process.env.WHATSAPP_APP_SECRET) {
    return NextResponse.json({ ok: false, error: "whatsapp_app_secret_not_configured" }, { status: 503 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256");

  if (!verifyWhatsAppSignature(rawBody, signature)) {
    return NextResponse.json({ ok: false, error: "invalid_signature" }, { status: 401 });
  }

  let payload: unknown = null;
  try {
    payload = JSON.parse(rawBody || "null");
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
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
