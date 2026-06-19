import type { SupabaseClient } from "@supabase/supabase-js";
import { parseEmailReplyConfigState, type EmailReplyConfigState } from "@/lib/messaging/email-reply-state";

type ChannelRow = {
  config: Record<string, unknown> | null;
};

export async function resolveReplyConfigForConversation(
  admin: SupabaseClient,
  companyId: string,
  _channel: "form" | "email",
): Promise<EmailReplyConfigState | null> {
  const { data: channelRow } = await admin
    .from("channels")
    .select("config")
    .eq("company_id", companyId)
    .eq("type", "form")
    .eq("is_active", true)
    .maybeSingle<ChannelRow>();

  return parseEmailReplyConfigState(channelRow?.config ?? null);
}

export async function resolveEmailSubject(
  admin: SupabaseClient,
  conversationId: string,
  companyId: string,
  channel: "form" | "email",
  contactName: string | null,
) {
  if (channel === "form") {
    return contactName ? `Re: tu solicitud, ${contactName}` : "Re: tu solicitud";
  }

  const { data: inboundMessages } = await admin
    .from("messages")
    .select("raw_payload")
    .eq("conversation_id", conversationId)
    .eq("company_id", companyId)
    .eq("direction", "inbound")
    .order("created_at", { ascending: true })
    .limit(5);

  for (const message of inboundMessages ?? []) {
    const payload = message.raw_payload;
    if (payload && typeof payload === "object" && "subject" in payload) {
      const subject = (payload as { subject?: unknown }).subject;
      if (typeof subject === "string" && subject.trim()) {
        const trimmed = subject.trim();
        return trimmed.toLowerCase().startsWith("re:") ? trimmed : `Re: ${trimmed}`;
      }
    }
  }

  return "Re: tu mensaje";
}

export async function resolveInReplyToMessageId(
  admin: SupabaseClient,
  conversationId: string,
  companyId: string,
) {
  const { data: outboundMessages } = await admin
    .from("messages")
    .select("external_id")
    .eq("conversation_id", conversationId)
    .eq("company_id", companyId)
    .eq("direction", "outbound")
    .not("external_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(1);

  const externalId = outboundMessages?.[0]?.external_id;
  return typeof externalId === "string" && externalId.trim() ? externalId.trim() : null;
}
