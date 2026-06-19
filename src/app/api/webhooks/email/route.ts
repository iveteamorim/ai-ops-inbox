import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchInboundEmailBody } from "@/lib/messaging/email-send";
import {
  parseEmailAddressHeader,
  parseResendInboundEvent,
  verifySvixWebhookSignature,
} from "@/lib/messaging/email-webhook";
import { persistEmailInbound } from "@/lib/messaging/repository";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const secret = process.env.RESEND_WEBHOOK_SECRET;

  if (secret) {
    const verified = verifySvixWebhookSignature(
      rawBody,
      {
        id: request.headers.get("svix-id"),
        timestamp: request.headers.get("svix-timestamp"),
        signature: request.headers.get("svix-signature"),
      },
      secret,
    );

    if (!verified) {
      return NextResponse.json({ ok: false, error: "invalid_signature" }, { status: 401 });
    }
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const event = parseResendInboundEvent(payload);
  if (!event) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json({ ok: false, error: "supabase_not_configured" }, { status: 503 });
  }

  try {
    const inbound = await fetchInboundEmailBody(event.data.email_id);
    const parsedFrom = parseEmailAddressHeader(inbound.from || event.data.from);
    const inboundAddress = (inbound.to[0] ?? event.data.to[0] ?? "").trim().toLowerCase();

    if (!parsedFrom.email || !inboundAddress) {
      return NextResponse.json({ ok: false, error: "invalid_inbound_email" }, { status: 400 });
    }

    const text = inbound.text.trim() || event.data.subject.trim() || "(empty email)";
    const result = await persistEmailInbound(admin, {
      inboundAddress,
      fromEmail: parsedFrom.email,
      fromName: parsedFrom.name,
      subject: inbound.subject || event.data.subject,
      text,
      externalMessageId: event.data.email_id,
      rawPayload: {
        event: payload,
        inbound,
      },
    });

    if (!result.saved) {
      const status = result.reason === "duplicate_event" || result.reason === "duplicate_message" ? 200 : 404;
      return NextResponse.json({ ok: true, saved: false, reason: result.reason }, { status });
    }

    return NextResponse.json({
      ok: true,
      saved: true,
      conversation_id: result.conversationId ?? null,
    });
  } catch (error) {
    console.error("email_webhook_failed", {
      error: error instanceof Error ? error.message : "unknown_error",
    });
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
