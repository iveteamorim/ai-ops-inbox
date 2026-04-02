import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getLeadTypesFromBusinessConfig } from "@/lib/revenue/classify";
import { triageConversation, type ServiceType } from "@/lib/triage/triage-conversation";

type ProfileRow = {
  id: string;
  company_id: string;
};

type CompanyRow = {
  id: string;
  config: Record<string, unknown> | null;
};

type ConversationRow = {
  id: string;
  lead_type: string | null;
  estimated_value: number | null;
  status: "new" | "active" | "won" | "lost" | "no_response";
  unit: string | null;
  last_message_at: string | null;
  last_inbound_at: string | null;
  last_outbound_at: string | null;
  created_at: string;
};

type MessageRow = {
  conversation_id: string;
  direction: "inbound" | "outbound";
  sender_type: "customer" | "agent" | "system";
  text: string | null;
  created_at: string;
};

export async function POST() {
  let supabase: Awaited<ReturnType<typeof createClient>>;
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

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, company_id")
    .eq("id", user.id)
    .maybeSingle<ProfileRow>();

  if (profileError) {
    return NextResponse.json({ ok: false, error: profileError.message }, { status: 500 });
  }

  if (!profile) {
    return NextResponse.json({ ok: false, error: "profile_not_found" }, { status: 404 });
  }

  const admin = createAdminClient();

  const [{ data: company, error: companyError }, { data: conversations, error: conversationsError }] =
    await Promise.all([
      admin.from("companies").select("id, config").eq("id", profile.company_id).maybeSingle<CompanyRow>(),
      admin
        .from("conversations")
        .select("id, lead_type, estimated_value, status, unit, last_message_at, last_inbound_at, last_outbound_at, created_at")
        .eq("company_id", profile.company_id)
        .order("updated_at", { ascending: false }) as PromiseLike<{
        data: ConversationRow[] | null;
        error: { message: string } | null;
      }>,
    ]);

  if (companyError) {
    return NextResponse.json({ ok: false, error: companyError.message }, { status: 500 });
  }

  if (conversationsError) {
    return NextResponse.json({ ok: false, error: conversationsError.message }, { status: 500 });
  }

  if (!company) {
    return NextResponse.json({ ok: false, error: "company_not_found" }, { status: 404 });
  }

  const leadTypes = getLeadTypesFromBusinessConfig(company.config);
  if (leadTypes.length === 0) {
    return NextResponse.json({ ok: true, updated: 0, note: "no_lead_types_configured" });
  }
  const serviceCatalog: ServiceType[] = leadTypes.map((item) => ({
    name: item.name,
    estimatedValue: item.estimatedValue,
  }));

  const rows = (conversations ?? []) as ConversationRow[];
  if (rows.length === 0) {
    return NextResponse.json({ ok: true, updated: 0 });
  }

  const conversationIds = rows.map((row) => row.id);
  const { data: messages, error: messagesError } = await admin
    .from("messages")
    .select("conversation_id, direction, sender_type, text, created_at")
    .in("conversation_id", conversationIds)
    .order("created_at", { ascending: false });

  if (messagesError) {
    return NextResponse.json({ ok: false, error: messagesError.message }, { status: 500 });
  }

  const latestInboundByConversation = new Map<string, MessageRow>();
  const latestAnyByConversation = new Map<string, MessageRow>();

  for (const message of ((messages as MessageRow[] | null | undefined) ?? [])) {
    if (!latestAnyByConversation.has(message.conversation_id)) {
      latestAnyByConversation.set(message.conversation_id, message);
    }
    if (
      !latestInboundByConversation.has(message.conversation_id) &&
      message.direction === "inbound" &&
      message.sender_type === "customer"
    ) {
      latestInboundByConversation.set(message.conversation_id, message);
    }
  }

  const updates: Array<{ id: string; lead_type: string | null; estimated_value: number }> = rows
    .map((row) => {
      const latestMessage =
        latestInboundByConversation.get(row.id)?.text?.trim() ||
        latestAnyByConversation.get(row.id)?.text?.trim() ||
        "";
      const referenceTimestamp =
        row.last_outbound_at ??
        row.last_inbound_at ??
        row.last_message_at ??
        row.created_at;
      const lastContactHoursAgo = Math.max(
        0,
        Math.round((Date.now() - new Date(referenceTimestamp).getTime()) / (1000 * 60 * 60)),
      );
      const triage = triageConversation(
        {
          customerName: "",
          lastCustomerMessage: latestMessage,
          conversationStatus: row.status === "active" ? "in_conversation" : row.status,
          lastContactHoursAgo,
          assignedUnit: row.unit,
        },
        serviceCatalog,
      );

      const nextLeadType = triage.leadType;
      const nextEstimatedValue = triage.estimatedValue;
      const currentEstimatedValue = Number(row.estimated_value ?? 0);

      if ((row.lead_type ?? null) === nextLeadType && currentEstimatedValue === nextEstimatedValue) {
        return null;
      }

      return {
        id: row.id,
        lead_type: nextLeadType,
        estimated_value: nextEstimatedValue,
      };
    })
    .filter((value) => value !== null);

  for (const update of updates) {
    const { error } = await admin
      .from("conversations")
      .update({
        lead_type: update.lead_type,
        estimated_value: update.estimated_value,
      })
      .eq("id", update.id)
      .eq("company_id", profile.company_id);

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true, updated: updates.length });
}
