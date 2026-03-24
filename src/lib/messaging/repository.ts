import type { SupabaseClient } from "@supabase/supabase-js";
import type { WhatsAppInboundMessage } from "@/lib/messaging/whatsapp";

type CompanyChannel = {
  company_id: string;
};

type ContactRow = {
  id: string;
};

type ConversationRow = {
  id: string;
};

export async function persistWhatsAppInbound(
  supabase: SupabaseClient,
  message: WhatsAppInboundMessage,
): Promise<{ saved: boolean; reason?: string }> {
  const { data: channel } = await supabase
    .from("channels")
    .select("company_id")
    .eq("type", "whatsapp")
    .eq("external_account_id", message.phoneNumberId)
    .eq("is_active", true)
    .maybeSingle<CompanyChannel>();

  if (!channel?.company_id) {
    return { saved: false, reason: "missing_channel_mapping" };
  }

  const companyId = channel.company_id;

  const { data: existingEvent } = await supabase
    .from("webhook_events")
    .select("id")
    .eq("source", "whatsapp")
    .eq("external_id", message.externalMessageId)
    .maybeSingle();

  if (existingEvent) {
    return { saved: false, reason: "duplicate_event" };
  }

  await supabase.from("webhook_events").insert({
    source: "whatsapp",
    external_id: message.externalMessageId,
    company_id: companyId,
    payload: message.rawMessage,
    status: "received",
  });

  let contactId: string;
  const { data: existingContact } = await supabase
    .from("contacts")
    .select("id")
    .eq("company_id", companyId)
    .eq("phone", message.fromPhone)
    .maybeSingle<ContactRow>();

  if (existingContact?.id) {
    contactId = existingContact.id;
  } else {
    const { data: insertedContact, error: contactError } = await supabase
      .from("contacts")
      .insert({
        company_id: companyId,
        name: message.fromName,
        phone: message.fromPhone,
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
    .eq("channel", "whatsapp")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle<ConversationRow>();

  if (existingConversation?.id) {
    conversationId = existingConversation.id;
  } else {
    const { data: insertedConversation, error: conversationError } = await supabase
      .from("conversations")
      .insert({
        company_id: companyId,
        contact_id: contactId,
        channel: "whatsapp",
        status: "new",
        last_message_at: new Date().toISOString(),
        last_inbound_at: new Date().toISOString(),
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
    channel: "whatsapp",
    external_id: message.externalMessageId,
    text: message.text,
    raw_payload: message.rawMessage,
  });

  if (messageError) {
    throw new Error(`Failed to insert message: ${messageError.message}`);
  }

  await supabase
    .from("conversations")
    .update({
      status: "active",
      last_message_at: new Date().toISOString(),
      last_inbound_at: new Date().toISOString(),
    })
    .eq("id", conversationId);

  await supabase
    .from("webhook_events")
    .update({
      status: "processed",
      processed_at: new Date().toISOString(),
    })
    .eq("source", "whatsapp")
    .eq("external_id", message.externalMessageId);

  return { saved: true };
}
