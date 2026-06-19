import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit } from "@/lib/rate-limit";
import { enforceSameOrigin } from "@/lib/security/request-origin";
import { getWorkspaceMember, type WorkspaceMember } from "@/lib/workspace-access";
import { sendWhatsAppText } from "@/lib/messaging/whatsapp-send";
import { isEmailSendingConfigured, sendEmailText } from "@/lib/messaging/email-send";
import {
  resolveEmailSubject,
  resolveInReplyToMessageId,
  resolveReplyConfigForConversation,
} from "@/lib/messaging/email-reply";

type ConversationRow = {
  id: string;
  company_id: string;
  contact_id: string;
  channel: "whatsapp" | "instagram" | "email" | "form";
  assigned_to: string | null;
};

type PostBody = {
  conversation_id?: string;
  text?: string;
};

async function getAuthenticatedClient() {
  const supabase = await createClient();
  const admin = createAdminClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profile = user ? await getWorkspaceMember(user).catch(() => null) : null;

  return { user, supabase, admin, profile };
}

async function getAuthorizedConversation(
  admin: ReturnType<typeof createAdminClient>,
  profile: WorkspaceMember | null,
  conversationId: string,
) {
  const { data: conversation, error: conversationError } = await admin
    .from("conversations")
    .select("id, company_id, contact_id, channel, assigned_to")
    .eq("id", conversationId)
    .maybeSingle<ConversationRow>();

  if (conversationError) {
    return { conversation: null, error: conversationError.message, status: 500 as const };
  }

  if (!conversation) {
    return { conversation: null, error: "conversation_not_found", status: 404 as const };
  }

  if (!profile || profile.company_id !== conversation.company_id) {
    return { conversation: null, error: "forbidden", status: 403 as const };
  }

  return { conversation, error: null, status: 200 as const };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get("conversation_id")?.trim();

  if (!conversationId) {
    return NextResponse.json({ ok: false, error: "conversation_id_required" }, { status: 400 });
  }

  let authContext;
  try {
    authContext = await getAuthenticatedClient();
  } catch {
    return NextResponse.json({ ok: false, error: "supabase_not_configured" }, { status: 503 });
  }

  if (!authContext.user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const access = await getAuthorizedConversation(authContext.admin, authContext.profile, conversationId);

  if (!access.conversation) {
    return NextResponse.json({ ok: false, error: access.error }, { status: access.status });
  }

  const { data, error } = await authContext.admin
    .from("messages")
    .select("id, direction, sender_type, text, created_at, delivery_status, delivered_at, read_at")
    .eq("conversation_id", access.conversation.id)
    .eq("company_id", access.conversation.company_id)
    .order("created_at", { ascending: true })
    .limit(200);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, messages: data ?? [] });
}

export async function POST(request: Request) {
  const originError = enforceSameOrigin(request);
  if (originError) return originError;

  const body = (await request.json().catch(() => ({}))) as PostBody;
  const conversationId = body.conversation_id?.trim();
  const text = body.text?.trim();

  if (!conversationId || !text) {
    return NextResponse.json({ ok: false, error: "conversation_id_text_required" }, { status: 400 });
  }

  let authContext;
  try {
    authContext = await getAuthenticatedClient();
  } catch {
    return NextResponse.json({ ok: false, error: "supabase_not_configured" }, { status: 503 });
  }

  if (!authContext.user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const rateLimit = checkRateLimit({
    key: `messages:${authContext.user.id}`,
    windowMs: 60_000,
    limit: 20,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { ok: false, error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
    );
  }

  const access = await getAuthorizedConversation(authContext.admin, authContext.profile, conversationId);

  if (!access.conversation) {
    return NextResponse.json({ ok: false, error: access.error }, { status: access.status });
  }

  const now = new Date().toISOString();

  const { data: claimedConversation, error: claimError } = await authContext.admin
    .from("conversations")
    .update({
      assigned_to: authContext.user.id,
      updated_at: now,
    })
    .eq("id", access.conversation.id)
    .or(`assigned_to.is.null,assigned_to.eq.${authContext.user.id}`)
    .select("id, assigned_to")
    .maybeSingle<{ id: string; assigned_to: string | null }>();

  if (claimError) {
    return NextResponse.json({ ok: false, error: claimError.message }, { status: 500 });
  }

  if (!claimedConversation) {
    const latestAccess = await getAuthorizedConversation(authContext.admin, authContext.profile, conversationId);

    const assignedToOther =
      latestAccess.conversation?.assigned_to &&
      latestAccess.conversation.assigned_to !== authContext.user.id;

    if (assignedToOther) {
      return NextResponse.json({ ok: false, error: "conversation_already_assigned" }, { status: 409 });
    }

    return NextResponse.json({ ok: false, error: "conversation_claim_failed" }, { status: 409 });
  }

  const { data: insertedMessage, error: insertError } = await authContext.admin
    .from("messages")
    .insert({
      company_id: access.conversation.company_id,
      conversation_id: access.conversation.id,
      direction: "outbound",
      sender_type: "agent",
      channel: access.conversation.channel,
      text,
      raw_payload: { source: "api/messages" },
      delivery_status: "sent",
    })
    .select("id")
    .single<{ id: string }>();

  if (insertError) {
    return NextResponse.json({ ok: false, error: insertError.message }, { status: 500 });
  }

  let whatsappSent = false;
  let emailSent = false;
  let deliveryStatus: "sent" | "failed" = "sent";
  let deliveryError: string | null = null;

  if (access.conversation.channel === "whatsapp") {
    const { data: contact, error: contactError } = await authContext.admin
      .from("contacts")
      .select("phone")
      .eq("id", access.conversation.contact_id)
      .maybeSingle<{ phone: string | null }>();

    if (contactError) {
      return NextResponse.json({ ok: false, error: contactError.message }, { status: 500 });
    }

    const { data: channel, error: channelError } = await authContext.admin
      .from("channels")
      .select("external_account_id")
      .eq("company_id", access.conversation.company_id)
      .eq("type", "whatsapp")
      .eq("is_active", true)
      .maybeSingle<{ external_account_id: string | null }>();

    if (channelError) {
      return NextResponse.json({ ok: false, error: channelError.message }, { status: 500 });
    }

    if (!contact?.phone) {
      return NextResponse.json({ ok: false, error: "contact_phone_missing" }, { status: 400 });
    }

    if (!channel?.external_account_id) {
      return NextResponse.json({ ok: false, error: "whatsapp_channel_missing" }, { status: 400 });
    }

    const whatsappResult = await sendWhatsAppText({
      phoneNumberId: channel.external_account_id,
      to: contact.phone,
      text,
    });

    whatsappSent = true;

    if (whatsappResult.messageId && insertedMessage?.id) {
      await authContext.admin
        .from("messages")
        .update({
          external_id: whatsappResult.messageId,
          raw_payload: whatsappResult.raw,
          delivery_status: "sent",
        })
        .eq("id", insertedMessage.id);
    }
  } else if (access.conversation.channel === "form" || access.conversation.channel === "email") {
    const { data: contact, error: contactError } = await authContext.admin
      .from("contacts")
      .select("email, name")
      .eq("id", access.conversation.contact_id)
      .maybeSingle<{ email: string | null; name: string | null }>();

    if (contactError) {
      return NextResponse.json({ ok: false, error: contactError.message }, { status: 500 });
    }

    if (!contact?.email) {
      return NextResponse.json({ ok: false, error: "contact_email_missing" }, { status: 400 });
    }

    if (!isEmailSendingConfigured()) {
      return NextResponse.json({ ok: false, error: "email_provider_not_configured" }, { status: 503 });
    }

    const replyConfig = await resolveReplyConfigForConversation(
      authContext.admin,
      access.conversation.company_id,
      access.conversation.channel,
    );

    if (!replyConfig || !replyConfig.verified) {
      return NextResponse.json({ ok: false, error: "reply_email_not_configured" }, { status: 400 });
    }

    const subject = await resolveEmailSubject(
      authContext.admin,
      access.conversation.id,
      access.conversation.company_id,
      access.conversation.channel,
      contact.name,
    );

    const inReplyTo = await resolveInReplyToMessageId(
      authContext.admin,
      access.conversation.id,
      access.conversation.company_id,
    );

    try {
      const emailResult = await sendEmailText({
        to: contact.email,
        subject,
        text,
        replyConfig,
        inReplyTo,
        usePlatformSender: true,
      });

      emailSent = true;

      if (insertedMessage?.id) {
        await authContext.admin
          .from("messages")
          .update({
            external_id: emailResult.messageId,
            raw_payload: {
              source: "api/messages",
              provider: "resend",
              to: contact.email,
              subject,
              response: emailResult.raw,
            },
            delivery_status: "sent",
          })
          .eq("id", insertedMessage.id);
      }
    } catch (error) {
      deliveryStatus = "failed";
      deliveryError = error instanceof Error ? error.message : "email_send_failed";

      if (insertedMessage?.id) {
        await authContext.admin
          .from("messages")
          .update({
            delivery_status: "failed",
            raw_payload: {
              source: "api/messages",
              provider: "resend",
              to: contact.email,
              subject,
              error: deliveryError,
            },
          })
          .eq("id", insertedMessage.id);
      }

      return NextResponse.json({ ok: false, error: deliveryError }, { status: 502 });
    }
  }

  const { error: updateError } = await authContext.admin
    .from("conversations")
    .update({
      status: "active",
      last_message_at: now,
      last_outbound_at: now,
    })
    .eq("id", access.conversation.id);

  if (updateError) {
    return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, queued: true, whatsappSent, emailSent, deliveryStatus });
}