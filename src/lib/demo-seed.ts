import type { SupabaseClient } from "@supabase/supabase-js";
import { triageConversation, type ServiceType } from "@/lib/triage/triage-conversation";

type DemoContactSeed = {
  name: string;
  phone: string;
  message: string;
  hoursAgo: number;
  status: "new" | "active" | "no_response" | "won" | "lost";
  replyOffsetHours?: number;
  replyText?: string;
};

type DemoMessageInsert = {
  company_id: string;
  conversation_id: string;
  direction: "inbound" | "outbound";
  sender_type: "customer" | "agent";
  channel: "whatsapp";
  text: string;
  raw_payload: Record<string, unknown>;
  created_at: string;
};

export const DEMO_SEED_PHONES = [
  "+34600000010",
  "+34600000011",
  "+34600000012",
  "+34600000013",
  "+34600000014",
] as const;

export function buildDemoConversationSeeds(serviceCatalog: ServiceType[]): DemoContactSeed[] {
  const primary = serviceCatalog[0]?.name?.trim() || "Premium treatment";
  const secondary = serviceCatalog[1]?.name?.trim() || "General information";
  const tertiary = serviceCatalog[2]?.name?.trim() || "Follow-up update";

  return [
    {
      name: "Emma Hot Lead",
      phone: "+34600000010",
      message: `Hi, I want to book a ${primary.toLowerCase()} this week.`,
      hoursAgo: 26,
      status: "no_response",
    },
    {
      name: "Mia Info Lead",
      phone: "+34600000011",
      message: `Can you send me more information about ${secondary.toLowerCase()}?`,
      hoursAgo: 2,
      status: "new",
    },
    {
      name: "Olivia Follow-up",
      phone: "+34600000012",
      message: `I asked yesterday about ${tertiary.toLowerCase()}, any update?`,
      hoursAgo: 28,
      status: "no_response",
    },
    {
      name: "Sofia Availability",
      phone: "+34600000013",
      message: `Do you have availability tomorrow for a ${primary.toLowerCase()}?`,
      hoursAgo: 6,
      status: "active",
      replyOffsetHours: 2,
      replyText: "Yes, we can check tomorrow's availability and help you move forward with the booking.",
    },
    {
      name: "Lucas Converted",
      phone: "+34600000014",
      message: `I want to confirm the ${primary.toLowerCase()} booking for Friday.`,
      hoursAgo: 24,
      status: "won",
      replyOffsetHours: 20,
      replyText: "Confirmed. Your premium treatment booking is scheduled and we will send the final details shortly.",
    },
  ];
}

export async function seedDemoConversations(params: {
  companyId: string;
  serviceCatalog: ServiceType[];
  admin: SupabaseClient;
  assignedToUserId?: string | null;
}) {
  const { companyId, serviceCatalog, admin, assignedToUserId } = params;
  const seeds = buildDemoConversationSeeds(serviceCatalog);
  let focusConversationId: string | null = null;
  let focusRank = -1;

  for (const seed of seeds) {
    const inboundAt = new Date(Date.now() - seed.hoursAgo * 60 * 60 * 1000).toISOString();
    const outboundAt =
      typeof seed.replyOffsetHours === "number"
        ? new Date(Date.now() - seed.replyOffsetHours * 60 * 60 * 1000).toISOString()
        : null;
    const lastTouchAt = outboundAt ?? inboundAt;
    const lastContactHoursAgo = Math.max(
      0,
      Math.round((Date.now() - new Date(lastTouchAt).getTime()) / (1000 * 60 * 60)),
    );
    const triage = triageConversation(
      {
        customerName: seed.name,
        lastCustomerMessage: seed.message,
        conversationStatus:
          seed.status === "active"
            ? "in_conversation"
            : seed.status === "new"
              ? "new"
              : seed.status === "no_response"
                ? "no_response"
                : seed.status,
        lastContactHoursAgo,
        assignedUnit: null,
      },
      serviceCatalog,
    );

    const { data: contact, error: contactError } = await admin
      .from("contacts")
      .insert({
        company_id: companyId,
        name: seed.name,
        phone: seed.phone,
      })
      .select("id")
      .single<{ id: string }>();

    if (contactError || !contact?.id) {
      throw new Error(`Failed to create demo contact: ${contactError?.message ?? "unknown"}`);
    }

    const { data: conversation, error: conversationError } = await admin
      .from("conversations")
      .insert({
        company_id: companyId,
        contact_id: contact.id,
        assigned_to: outboundAt && assignedToUserId ? assignedToUserId : null,
        channel: "whatsapp",
        status: seed.status,
        lead_type: triage.leadType,
        estimated_value: triage.estimatedValue,
        expected_value: seed.status === "won" ? triage.estimatedValue : 0,
        ai_priority: triage.priority,
        last_message_at: lastTouchAt,
        last_inbound_at: inboundAt,
        last_outbound_at: outboundAt,
        created_at: inboundAt,
        updated_at: lastTouchAt,
      })
      .select("id")
      .single<{ id: string }>();

    if (conversationError || !conversation?.id) {
      throw new Error(
        `Failed to create demo conversation: ${conversationError?.message ?? "unknown"}`,
      );
    }

    const priorityRank = triage.priority === "high" ? 3 : triage.priority === "medium" ? 2 : 1;
    const statusRank =
      seed.status === "no_response"
        ? 3
        : seed.status === "new"
          ? 2
          : seed.status === "active"
            ? 1
            : 0;
    const rank = priorityRank * 10 + statusRank;
    if (rank > focusRank) {
      focusRank = rank;
      focusConversationId = conversation.id;
    }

    const messageRows: DemoMessageInsert[] = [
      {
        company_id: companyId,
        conversation_id: conversation.id,
        direction: "inbound",
        sender_type: "customer",
        channel: "whatsapp",
        text: seed.message,
        raw_payload: { source: "demo_seed" },
        created_at: inboundAt,
      },
    ];

    if (outboundAt) {
      messageRows.push({
        company_id: companyId,
        conversation_id: conversation.id,
        direction: "outbound",
        sender_type: "agent",
        channel: "whatsapp",
        text: seed.replyText ?? triage.suggestedResponse,
        raw_payload: { source: "demo_seed" },
        created_at: outboundAt,
      });
    }

    const { error: messageError } = await admin.from("messages").insert(messageRows);
    if (messageError) {
      throw new Error(`Failed to create demo messages: ${messageError.message}`);
    }
  }

  return { seeded: seeds.length, focusConversationId };
}

export async function resetAndSeedDemoConversations(params: {
  companyId: string;
  serviceCatalog: ServiceType[];
  admin: SupabaseClient;
  assignedToUserId?: string | null;
}) {
  const { companyId, serviceCatalog, admin, assignedToUserId } = params;

  const { data: contacts, error: contactsError } = await admin
    .from("contacts")
    .select("id, phone")
    .eq("company_id", companyId)
    .in("phone", [...DEMO_SEED_PHONES]);

  if (contactsError) {
    throw new Error(`Failed to load demo contacts: ${contactsError.message}`);
  }

  const contactIds = (contacts ?? []).map((row: { id: string }) => row.id);

  if (contactIds.length > 0) {
    const { data: conversations, error: conversationsError } = await admin
      .from("conversations")
      .select("id")
      .eq("company_id", companyId)
      .in("contact_id", contactIds);

    if (conversationsError) {
      throw new Error(`Failed to load demo conversations: ${conversationsError.message}`);
    }

    const conversationIds = (conversations ?? []).map((row: { id: string }) => row.id);

    if (conversationIds.length > 0) {
      const { error: messagesDeleteError } = await admin
        .from("messages")
        .delete()
        .in("conversation_id", conversationIds);

      if (messagesDeleteError) {
        throw new Error(`Failed to delete demo messages: ${messagesDeleteError.message}`);
      }

      const { error: conversationsDeleteError } = await admin
        .from("conversations")
        .delete()
        .in("id", conversationIds);

      if (conversationsDeleteError) {
        throw new Error(`Failed to delete demo conversations: ${conversationsDeleteError.message}`);
      }
    }

    const { error: contactsDeleteError } = await admin.from("contacts").delete().in("id", contactIds);
    if (contactsDeleteError) {
      throw new Error(`Failed to delete demo contacts: ${contactsDeleteError.message}`);
    }
  }

  return seedDemoConversations({ companyId, serviceCatalog, admin, assignedToUserId });
}
