import type { SupabaseClient } from "@supabase/supabase-js";
import type { WhatsAppInboundMessage } from "@/lib/messaging/whatsapp";
import type { InstagramInboundMessage } from "@/lib/messaging/instagram";
import { getLeadTypesFromBusinessConfig } from "@/lib/revenue/classify";
import { triageConversation, type ServiceType } from "@/lib/triage/triage-conversation";

type CompanyChannel = {
  company_id: string;
};

type CompanyRow = {
  config: Record<string, unknown> | null;
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
  status: "new" | "active" | "won" | "lost" | "no_response";
  unit: string | null;
  last_message_at: string | null;
  last_inbound_at: string | null;
  last_outbound_at: string | null;
  created_at: string;
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

  if (!channel?.company_id) {
    return { saved: false, reason: "missing_channel_mapping" };
  }

  const companyId = channel.company_id;
  const { data: company } = await supabase
    .from("companies")
    .select("config")
    .eq("id", companyId)
    .maybeSingle<CompanyRow>();
  const leadTypes = getLeadTypesFromBusinessConfig(company?.config);
  const serviceCatalog: ServiceType[] = leadTypes.map((item) => ({
    name: item.name,
    estimatedValue: item.estimatedValue,
  }));

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
    .select("id, status, unit, last_message_at, last_inbound_at, last_outbound_at, created_at")
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

  const conversationForTriage = existingConversation ?? {
    id: conversationId,
    status: "new" as const,
    unit: null,
    last_message_at: null,
    last_inbound_at: null,
    last_outbound_at: null,
    created_at: new Date().toISOString(),
  };

  const referenceTimestamp =
    conversationForTriage.last_outbound_at ??
    conversationForTriage.last_inbound_at ??
    conversationForTriage.last_message_at ??
    conversationForTriage.created_at;
  const lastContactHoursAgo = Math.max(
    0,
    Math.round((Date.now() - new Date(referenceTimestamp).getTime()) / (1000 * 60 * 60)),
  );
  const triage = triageConversation(
    {
      customerName: message.contactName ?? "",
      lastCustomerMessage: message.text,
      conversationStatus:
        conversationForTriage.status === "active"
          ? "in_conversation"
          : conversationForTriage.status,
      lastContactHoursAgo,
      assignedUnit: conversationForTriage.unit,
    },
    serviceCatalog,
  );

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
  const hasExistingHumanReply = Boolean(conversationForTriage.last_outbound_at);
  const nextStatus =
    conversationForTriage.status === "won"
      ? "won"
      : conversationForTriage.status === "lost"
        ? "active"
        : hasExistingHumanReply || conversationForTriage.status === "active" || conversationForTriage.status === "no_response"
          ? "active"
          : "new";
  const { error: conversationUpdateError } = await supabase
    .from("conversations")
    .update({
      status: nextStatus,
      lead_type: triage.leadType,
      estimated_value: triage.estimatedValue,
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
