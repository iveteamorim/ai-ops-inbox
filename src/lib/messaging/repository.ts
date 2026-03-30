import type { SupabaseClient } from "@supabase/supabase-js";
import type { WhatsAppInboundMessage } from "@/lib/messaging/whatsapp";
import type { InstagramInboundMessage } from "@/lib/messaging/instagram";

type CompanyChannel = {
  company_id: string;
};

type DbError = {
  code?: string;
  message?: string;
};

type ContactRow = {
  id: string;
};

type ConversationRow = {
  id: string;
};

type InboundMessageInput = {
  source: "whatsapp" | "instagram";
  channelType: "whatsapp" | "instagram";
  externalAccountId: string;
  contactKey: { phone?: string | null; externalRef?: string | null };
  contactName: string | null;
  text: string;
  externalMessageId: string;
  rawMessage: unknown;
};

async function persistInboundMessage(
  supabase: SupabaseClient,
  message: InboundMessageInput,
): Promise<{ saved: boolean; reason?: string }> {
  const { data: channel } = await supabase
    .from("channels")
    .select("company_id")
    .eq("type", message.channelType)
    .eq("external_account_id", message.externalAccountId)
    .eq("is_active", true)
    .maybeSingle<CompanyChannel>();

  console.log("[inbound-message] channel lookup", {
    source: message.source,
    channelType: message.channelType,
    externalAccountId: message.externalAccountId,
    channel,
  });

  if (!channel?.company_id) {
    return { saved: false, reason: "missing_channel_mapping" };
  }

  const companyId = channel.company_id;

  const { error: eventInsertError } = await supabase.from("webhook_events").insert({
    source: message.source,
    external_id: message.externalMessageId,
    company_id: companyId,
    payload: message.rawMessage,
    status: "received",
  });

  if (eventInsertError) {
    const dbError = eventInsertError as DbError;
    if (dbError.code === "23505") {
      return { saved: false, reason: "duplicate_event" };
    }
    throw new Error(`Failed to insert webhook event: ${eventInsertError.message}`);
  }

  let contactId: string;
  const contactQuery = supabase.from("contacts").select("id").eq("company_id", companyId);
  const contactLookup = message.contactKey.phone
    ? contactQuery.eq("phone", message.contactKey.phone)
    : contactQuery.eq("external_ref", message.contactKey.externalRef ?? "");
  const { data: existingContact } = await contactLookup.maybeSingle<ContactRow>();

  if (existingContact?.id) {
    contactId = existingContact.id;
  } else {
    const { data: insertedContact, error: contactError } = await supabase
      .from("contacts")
      .insert({
        company_id: companyId,
        name: message.contactName,
        phone: message.contactKey.phone ?? null,
        external_ref: message.contactKey.externalRef ?? null,
      })
      .select("id")
      .single<ContactRow>();

    if (contactError || !insertedContact?.id) {
      throw new Error(`Failed to create contact: ${contactError?.message ?? "unknown"}`);
    }

    contactId = insertedContact.id;
  }

  let conversationId: string;
  const { data: existingConversation } = await supabase
    .from("conversations")
    .select("id")
    .eq("company_id", companyId)
    .eq("contact_id", contactId)
    .eq("channel", message.channelType)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle<ConversationRow>();

  if (existingConversation?.id) {
    conversationId = existingConversation.id;
  } else {
    const now = new Date().toISOString();
    const { data: insertedConversation, error: conversationError } = await supabase
      .from("conversations")
      .insert({
        company_id: companyId,
        contact_id: contactId,
        channel: message.channelType,
        status: "new",
        last_message_at: now,
        last_inbound_at: now,
      })
      .select("id")
      .single<ConversationRow>();

    if (conversationError || !insertedConversation?.id) {
      throw new Error(
        `Failed to create conversation: ${conversationError?.message ?? "unknown"}`,
      );
    }

    conversationId = insertedConversation.id;
  }

  const { error: messageError } = await supabase.from("messages").insert({
    company_id: companyId,
    conversation_id: conversationId,
    direction: "inbound",
    sender_type: "customer",
    channel: message.channelType,
    external_id: message.externalMessageId,
    text: message.text,
    raw_payload: message.rawMessage,
  });

  if (messageError) {
    throw new Error(`Failed to insert message: ${messageError.message}`);
  }

  const now = new Date().toISOString();
  const { error: conversationUpdateError } = await supabase
    .from("conversations")
    .update({
      status: "active",
      last_message_at: now,
      last_inbound_at: now,
    })
    .eq("id", conversationId);

  if (conversationUpdateError) {
    throw new Error(`Failed to update conversation: ${conversationUpdateError.message}`);
  }

  const { error: webhookUpdateError } = await supabase
    .from("webhook_events")
    .update({
      status: "processed",
      processed_at: now,
    })
    .eq("source", message.source)
    .eq("external_id", message.externalMessageId);

  if (webhookUpdateError) {
    throw new Error(`Failed to update webhook event: ${webhookUpdateError.message}`);
  }

  return { saved: true };
}

export async function persistWhatsAppInbound(
  supabase: SupabaseClient,
  message: WhatsAppInboundMessage,
): Promise<{ saved: boolean; reason?: string }> {
  return persistInboundMessage(supabase, {
    source: "whatsapp",
    channelType: "whatsapp",
    externalAccountId: message.phoneNumberId,
    contactKey: { phone: message.fromPhone, externalRef: null },
    contactName: message.fromName,
    text: message.text,
    externalMessageId: message.externalMessageId,
    rawMessage: message.rawMessage,
  });
}

export async function persistInstagramInbound(
  supabase: SupabaseClient,
  message: InstagramInboundMessage,
): Promise<{ saved: boolean; reason?: string }> {
  return persistInboundMessage(supabase, {
    source: "instagram",
    channelType: "instagram",
    externalAccountId: message.instagramAccountId,
    contactKey: { phone: null, externalRef: message.fromExternalId },
    contactName: message.fromName,
    text: message.text,
    externalMessageId: message.externalMessageId,
    rawMessage: message.rawMessage,
  });
}
