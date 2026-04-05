import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { User } from "@supabase/supabase-js";
import type { DictionaryKey } from "@/lib/i18n/dictionaries";
import { classifyLeadFromMessage } from "@/lib/revenue/classify";
import { triageConversation, type ServiceType, type TriageResult } from "@/lib/triage/triage-conversation";
import { getDecisionType, type DecisionType } from "@/lib/conversation-decision";

type ProfileRow = {
  id: string;
  company_id: string;
  full_name: string | null;
  role: string;
};

type CompanyRow = {
  id: string;
  name: string;
  plan: string;
  config?: Record<string, unknown> | null;
};

type ConversationRow = {
  id: string;
  company_id: string;
  contact_id: string;
  assigned_to: string | null;
  unit: string | null;
  lead_type: string | null;
  is_complex: boolean;
  channel: "whatsapp" | "instagram" | "email" | "form";
  status: "new" | "active" | "won" | "lost" | "no_response";
  last_message_at: string | null;
  last_inbound_at: string | null;
  last_outbound_at: string | null;
  created_at: string;
  updated_at: string;
  estimated_value: number | null;
  expected_value: number | null;
  ai_priority: "high" | "medium" | "low" | null;
};

type ContactRow = {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
};

type ProfileNameRow = {
  id: string;
  full_name: string | null;
  role: string;
};

type MessageRow = {
  id: string;
  conversation_id: string;
  direction: "inbound" | "outbound";
  sender_type: "customer" | "agent" | "system";
  text: string | null;
  created_at: string;
};

type ChannelRow = {
  id: string;
  type: "whatsapp" | "instagram" | "email" | "form";
  external_account_id: string | null;
  is_active: boolean;
};

type SetupRequestRow = {
  id: string;
  channel: "whatsapp" | "instagram" | "email" | "form";
  status: "requested" | "in_progress" | "completed" | "cancelled";
  notes: string | null;
  created_at: string;
};

type PilotFeedbackRow = {
  id: string;
  company_id: string;
  user_id: string;
  category: "bug" | "feedback" | "feature_request";
  message: string;
  page_path: string | null;
  status: "new" | "reviewed" | "closed";
  admin_reply: string | null;
  replied_at: string | null;
  created_at: string;
};

function isMissingConversationUnitColumnError(error: { message?: string } | null | undefined) {
  const message = error?.message?.toLowerCase() ?? "";
  return (
    message.includes("conversations") &&
    (message.includes("unit") || message.includes("lead_type"))
  );
}

export type TeamMemberView = {
  id: string;
  full_name: string | null;
  role: string;
};

export type PendingInviteView = {
  id: string;
  email: string;
  role: string;
  invitedAt: string | null;
};

export type SetupRequestView = {
  id: string;
  channel: "whatsapp" | "instagram" | "email" | "form";
  status: "requested" | "in_progress" | "completed" | "cancelled";
  createdAt: string;
  companyName: string;
  requestedBy: string;
  notes: string | null;
};

export type PilotFeedbackView = {
  id: string;
  companyName: string;
  sentBy: string;
  category: "bug" | "feedback" | "feature_request";
  message: string;
  pagePath: string | null;
  status: "new" | "reviewed" | "closed";
  adminReply: string | null;
  repliedAt: string | null;
  createdAt: string;
};

export type UserPilotFeedbackView = {
  id: string;
  category: "bug" | "feedback" | "feature_request";
  message: string;
  pagePath: string | null;
  status: "new" | "reviewed" | "closed";
  adminReply: string | null;
  repliedAt: string | null;
  createdAt: string;
};

export type AppContext =
  | { kind: "unconfigured" }
  | { kind: "unauthenticated" }
  | { kind: "profile_missing"; user: User }
  | {
      kind: "ready";
      user: User;
      supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
      profile: ProfileRow;
      company: CompanyRow | null;
    };

export type BusinessLeadType = {
  id: string;
  name: string;
  estimatedValue: number;
};

export type BusinessSetupView = {
  businessName: string;
  leadTypes: BusinessLeadType[];
};

function parseBusinessSetup(company: CompanyRow | null): BusinessSetupView {
  const config = company?.config;
  const businessSetup =
    config && typeof config === "object" && "business_setup" in config
      ? (config.business_setup as Record<string, unknown> | null)
      : null;

  const leadTypesRaw = Array.isArray(businessSetup?.lead_types) ? businessSetup?.lead_types : [];
  return {
    businessName:
      typeof businessSetup?.business_name === "string" && businessSetup.business_name.trim()
        ? businessSetup.business_name.trim()
        : company?.name ?? "",
    leadTypes: leadTypesRaw
      .map((value) => {
        if (!value || typeof value !== "object") return null;
        const row = value as Record<string, unknown>;
        const name = typeof row.name === "string" ? row.name.trim() : "";
        const estimatedValue =
          typeof row.estimated_value === "number"
            ? row.estimated_value
            : typeof row.estimated_value === "string"
              ? Number(row.estimated_value)
              : 0;
        return name
          ? {
              id:
                typeof row.id === "string" && row.id.trim()
                  ? row.id
                  : `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Math.random().toString(36).slice(2, 8)}`,
              name,
              estimatedValue: Number.isFinite(estimatedValue) ? estimatedValue : 0,
            }
          : null;
      })
      .filter((value): value is BusinessLeadType => Boolean(value)),
  };
}

export type ConversationView = {
  id: string;
  contactName: string;
  contactPhone: string | null;
  unit: string | null;
  leadType: string | null;
  isComplex: boolean;
  channel: "whatsapp" | "instagram" | "email" | "form";
  status: ConversationRow["status"];
  decisionType: DecisionType;
  assignedToId: string | null;
  assignedTo: string | null;
  aiPriority: "high" | "medium" | "low";
  estimatedValue: number;
  expectedValue: number;
  lastMessageText: string;
  lastMessageAt: string | null;
  lastInboundAt: string | null;
  lastOutboundAt: string | null;
  createdAt: string;
};

export type MessageView = {
  id: string;
  direction: "inbound" | "outbound";
  senderType: "customer" | "agent" | "system";
  text: string;
  createdAt: string;
};

export type ConversationTriagePreviewView = {
  conversationId: string;
  contactName: string;
  conversationStatus: "new" | "in_conversation" | "no_response" | "won" | "lost";
  currentLeadType: string | null;
  currentEstimatedValue: number;
  lastCustomerMessage: string;
  lastCustomerMessageAt: string | null;
  lastContactHoursAgo: number;
  triage: TriageResult;
};

function titleCase(value: string) {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function deriveCompanyName(user: User) {
  const metadataCompany = user.user_metadata?.company_name;
  if (typeof metadataCompany === "string" && metadataCompany.trim()) {
    return metadataCompany.trim();
  }

  const email = user.email ?? "";
  const local = email.split("@")[0] ?? "novua";
  return titleCase(local);
}

function deriveFullName(user: User) {
  const metadataName = user.user_metadata?.full_name;
  if (typeof metadataName === "string" && metadataName.trim()) {
    return metadataName.trim();
  }

  return null;
}

async function getProfileAndCompany(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string,
) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, company_id, full_name, role")
    .eq("id", userId)
    .maybeSingle<ProfileRow>();

  if (!profile) {
    return { profile: null, company: null };
  }

  const { data: company } = await supabase
    .from("companies")
    .select("id, name, plan, config")
    .eq("id", profile.company_id)
    .maybeSingle<CompanyRow>();

  return { profile, company: company ?? null };
}

async function bootstrapProfile(user: User) {
  const admin = createAdminClient();
  const companyName = deriveCompanyName(user);
  const fullName = deriveFullName(user);

  const { data: company, error: companyError } = await admin
    .from("companies")
    .insert({ name: companyName })
    .select("id, name, plan, config")
    .single<CompanyRow>();

  if (companyError || !company) {
    throw new Error(companyError?.message ?? "Failed to create company");
  }

  const { error: profileError } = await admin.from("profiles").upsert(
    {
      id: user.id,
      company_id: company.id,
      full_name: fullName,
      role: "owner",
    },
    { onConflict: "id" },
  );

  if (profileError) {
    throw new Error(profileError.message);
  }
}

export async function getAppContext(): Promise<AppContext> {
  let supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  try {
    supabase = await createSupabaseServerClient();
  } catch {
    return { kind: "unconfigured" };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { kind: "unauthenticated" };
  }

  let { profile, company } = await getProfileAndCompany(supabase, user.id);
  if (!profile) {
    try {
      await bootstrapProfile(user);
      const bootstrapped = await getProfileAndCompany(supabase, user.id);
      profile = bootstrapped.profile;
      company = bootstrapped.company;
    } catch {
      return { kind: "profile_missing", user };
    }
  }

  if (!profile) {
    return { kind: "profile_missing", user };
  }

  return {
    kind: "ready",
    user,
    supabase,
    profile,
    company,
  };
}

function normalizePriority(priority: ConversationRow["ai_priority"]): "high" | "medium" | "low" {
  if (priority === "high" || priority === "medium" || priority === "low") {
    return priority;
  }
  return "medium";
}

export function formatChannel(channel: ConversationView["channel"]) {
  if (channel === "whatsapp") return "WhatsApp";
  if (channel === "instagram") return "Instagram";
  if (channel === "email") return "Email";
  return "Form";
}

export function formatStatus(status: ConversationView["status"], t: (key: DictionaryKey) => string) {
  if (status === "new") return t("inbox_filter_new");
  if (status === "active") return t("inbox_filter_in_progress");
  if (status === "no_response") return t("inbox_filter_no_reply");
  if (status === "won") return t("revenue_filter_won");
  return t("inbox_filter_lost");
}

export function formatPriority(priority: ConversationView["aiPriority"], t: (key: DictionaryKey) => string) {
  if (priority === "high") return t("dashboard_risk_high");
  if (priority === "medium") return t("dashboard_risk_medium");
  return "Low";
}

function deriveEffectiveConversationStatus(row: ConversationRow): ConversationRow["status"] {
  if (row.status === "won" || row.status === "lost") {
    return row.status;
  }

  const inboundTimestamp = row.last_inbound_at ? new Date(row.last_inbound_at).getTime() : null;
  const outboundTimestamp = row.last_outbound_at ? new Date(row.last_outbound_at).getTime() : null;

  if (
    inboundTimestamp &&
    outboundTimestamp &&
    !Number.isNaN(inboundTimestamp) &&
    !Number.isNaN(outboundTimestamp) &&
    outboundTimestamp >= inboundTimestamp
  ) {
    return "active";
  }

  return row.status;
}

export function formatRelativeTime(isoDate: string | null) {
  if (!isoDate) return "-";

  const timestamp = new Date(isoDate).getTime();
  if (Number.isNaN(timestamp)) return "-";

  const diffMs = Date.now() - timestamp;
  const diffMinutes = Math.max(0, Math.round(diffMs / (1000 * 60)));
  if (diffMinutes < 60) return `Hace ${diffMinutes} min`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `Hace ${diffHours}h`;

  const diffDays = Math.round(diffHours / 24);
  return `Hace ${diffDays} días`;
}

export function formatNoReplyDuration(isoDate: string | null) {
  if (!isoDate) return "-";

  const timestamp = new Date(isoDate).getTime();
  if (Number.isNaN(timestamp)) return "-";

  const diffMs = Date.now() - timestamp;
  const diffMinutes = Math.max(0, Math.round(diffMs / (1000 * 60)));
  if (diffMinutes < 60) return `${diffMinutes} min sin responder`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h sin responder`;

  const diffDays = Math.round(diffHours / 24);
  return `${diffDays} días sin responder`;
}

export async function getConversationViews(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  companyId: string,
) {
  const baseSelect =
    "id, company_id, contact_id, assigned_to, channel, status, last_message_at, last_inbound_at, last_outbound_at, created_at, updated_at, estimated_value, expected_value, is_complex, ai_priority, lead_type";
  let { data: conversations, error } = await supabase
    .from("conversations")
    .select(`${baseSelect}, unit`)
    .eq("company_id", companyId)
    .order("updated_at", { ascending: false });

  if (isMissingConversationUnitColumnError(error)) {
    const fallback = await supabase
      .from("conversations")
      .select(baseSelect)
      .eq("company_id", companyId)
      .order("updated_at", { ascending: false });

    conversations = fallback.data?.map((row) => ({
      ...row,
      unit: null,
      lead_type: null,
      is_complex: false,
    })) ?? null;
    error = fallback.error;
  }

  if (error || !conversations) {
    throw new Error(error?.message ?? "Failed to load conversations");
  }

  if (conversations.length === 0) {
    return [] satisfies ConversationView[];
  }

  const conversationRows = conversations as ConversationRow[];
  const contactIds = Array.from(new Set(conversationRows.map((row) => row.contact_id)));
  const assignedIds = Array.from(
    new Set(conversationRows.map((row) => row.assigned_to).filter((value): value is string => Boolean(value))),
  );

  const [{ data: contacts }, { data: profiles }, { data: messages }, { data: company }] = await Promise.all([
    supabase.from("contacts").select("id, name, phone, email").in("id", contactIds),
    assignedIds.length > 0
      ? supabase.from("profiles").select("id, full_name").in("id", assignedIds)
      : Promise.resolve({ data: [] as ProfileNameRow[] }),
    supabase
      .from("messages")
      .select("id, conversation_id, direction, sender_type, text, created_at")
      .in(
        "conversation_id",
        conversationRows.map((row) => row.id),
      )
      .order("created_at", { ascending: false })
      .limit(500),
    supabase.from("companies").select("id, name, config").eq("id", companyId).maybeSingle<CompanyRow>(),
  ]);

  const contactsById = new Map((contacts as ContactRow[] | null | undefined)?.map((row) => [row.id, row]) ?? []);
  const profilesById = new Map((profiles as ProfileNameRow[] | null | undefined)?.map((row) => [row.id, row]) ?? []);
  const lastMessageByConversation = new Map<string, MessageRow>();
  const lastInboundMessageByConversation = new Map<string, MessageRow>();
  const leadTypes = parseBusinessSetup((company as CompanyRow | null | undefined) ?? null).leadTypes;

  for (const message of (messages as MessageRow[] | null | undefined) ?? []) {
    if (!lastMessageByConversation.has(message.conversation_id)) {
      lastMessageByConversation.set(message.conversation_id, message);
    }
    if (
      !lastInboundMessageByConversation.has(message.conversation_id) &&
      message.direction === "inbound" &&
      message.sender_type === "customer"
    ) {
      lastInboundMessageByConversation.set(message.conversation_id, message);
    }
  }

  return conversationRows.map((row) => {
    const contact = contactsById.get(row.contact_id);
    const assigned = row.assigned_to ? profilesById.get(row.assigned_to) : null;
    const latestMessage = lastMessageByConversation.get(row.id);
    const latestInboundMessage = lastInboundMessageByConversation.get(row.id);
    const classification = classifyLeadFromMessage(
      latestInboundMessage?.text?.trim() || latestMessage?.text?.trim() || "",
      leadTypes,
    );
    const persistedLeadType = row.lead_type?.trim() || null;
    const persistedEstimatedValue = Number(row.estimated_value ?? 0);
    const effectiveStatus = deriveEffectiveConversationStatus(row);
    const isComplex = Boolean(row.is_complex);
    const decisionType = getDecisionType({
      status: effectiveStatus,
      isComplex,
    } satisfies Pick<ConversationView, "status" | "isComplex">);

    return {
      id: row.id,
      contactName: contact?.name?.trim() || contact?.phone || contact?.email || "Unknown contact",
      contactPhone: contact?.phone ?? null,
      unit: row.unit?.trim() || null,
      leadType: persistedLeadType || classification.leadType,
      isComplex,
      channel: row.channel,
      status: effectiveStatus,
      decisionType,
      assignedToId: row.assigned_to,
      assignedTo: assigned?.full_name ?? null,
      aiPriority: normalizePriority(row.ai_priority),
      estimatedValue:
        persistedLeadType || persistedEstimatedValue > 0
          ? persistedEstimatedValue
          : classification.estimatedValue,
      expectedValue: Number(row.expected_value ?? 0),
      lastMessageText: latestMessage?.text?.trim() || "No messages yet",
      lastMessageAt: row.last_message_at ?? latestMessage?.created_at ?? row.updated_at,
      lastInboundAt: row.last_inbound_at,
      lastOutboundAt: row.last_outbound_at,
      createdAt: row.created_at,
    } satisfies ConversationView;
  });
}

export async function getTeamMembers(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  companyId: string,
) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("company_id", companyId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return ((data as TeamMemberView[] | null | undefined) ?? []);
}

export async function getConversationDetail(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  companyId: string,
  conversationId: string,
) {
  const conversations = await getConversationViews(supabase, companyId);
  const conversation = conversations.find((row) => row.id === conversationId);

  if (!conversation) {
    return null;
  }

  const { data: messages, error } = await supabase
    .from("messages")
    .select("id, direction, sender_type, text, created_at")
    .eq("company_id", companyId)
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return {
    conversation,
    messages: ((messages as MessageRow[] | null | undefined) ?? []).map((message) => ({
      id: message.id,
      direction: message.direction,
      senderType: message.sender_type,
      text: message.text?.trim() || "",
      createdAt: message.created_at,
    })) satisfies MessageView[],
  };
}

export async function getConversationTriagePreview(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  companyId: string,
) {
  const conversations = await getConversationViews(supabase, companyId);
  const { data: messages, error: messagesError } = await supabase
    .from("messages")
    .select("id, conversation_id, direction, sender_type, text, created_at")
    .eq("company_id", companyId)
    .eq("sender_type", "customer")
    .order("created_at", { ascending: false })
    .limit(1000);

  if (messagesError) {
    throw new Error(messagesError.message);
  }

  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select("id, name, config")
    .eq("id", companyId)
    .maybeSingle<CompanyRow>();

  if (companyError) {
    throw new Error(companyError.message);
  }

  const serviceCatalog: ServiceType[] = parseBusinessSetup((company as CompanyRow | null | undefined) ?? null)
    .leadTypes
    .map((item) => ({
      name: item.name,
      estimatedValue: item.estimatedValue,
    }));

  const messagesByConversation = new Map<string, MessageRow>();
  for (const message of (messages as MessageRow[] | null | undefined) ?? []) {
    if (!messagesByConversation.has(message.conversation_id) && message.text?.trim()) {
      messagesByConversation.set(message.conversation_id, message);
    }
  }

  return conversations
    .map((conversation) => {
      const lastCustomerMessage = messagesByConversation.get(conversation.id);
      const lastCustomerMessageText = lastCustomerMessage?.text?.trim() || conversation.lastMessageText.trim();
      const referenceTimestamp =
        conversation.lastOutboundAt ??
        conversation.lastInboundAt ??
        conversation.lastMessageAt ??
        conversation.createdAt;
      const lastContactHoursAgo = Math.max(
        0,
        Math.round((Date.now() - new Date(referenceTimestamp).getTime()) / (1000 * 60 * 60)),
      );
      const triage = triageConversation(
        {
          customerName: conversation.contactName,
          lastCustomerMessage: lastCustomerMessageText,
          conversationStatus:
            conversation.status === "active"
              ? "in_conversation"
              : conversation.status,
          lastContactHoursAgo,
          assignedUnit: conversation.unit,
        },
        serviceCatalog,
      );

      return {
        conversationId: conversation.id,
        contactName: conversation.contactName,
        conversationStatus:
          conversation.status === "active"
            ? "in_conversation"
            : conversation.status,
        currentLeadType: conversation.leadType,
        currentEstimatedValue: conversation.estimatedValue,
        lastCustomerMessage: lastCustomerMessageText,
        lastCustomerMessageAt: lastCustomerMessage?.created_at ?? conversation.lastInboundAt,
        lastContactHoursAgo,
        triage,
      } satisfies ConversationTriagePreviewView;
    })
    .slice(0, 20);
}

export async function getSettingsData(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  companyId: string,
  userId: string,
) {
  const admin = createAdminClient();
  const [{ data: channels }, { data: setupRequests }, { data: adminProfiles }, { data: feedbackHistory }] =
    await Promise.all([
    supabase
      .from("channels")
      .select("id, type, external_account_id, is_active")
      .eq("company_id", companyId)
      .order("type", { ascending: true }),
    supabase
      .from("setup_requests")
      .select("id, channel, status, notes, created_at")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(10),
    admin
      .from("profiles")
      .select("id, full_name, role")
      .eq("company_id", companyId)
      .order("created_at", { ascending: true }),
    supabase
      .from("pilot_feedback")
      .select("id, category, message, page_path, status, admin_reply, replied_at, created_at")
      .eq("company_id", companyId)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  let pendingInvites: PendingInviteView[] = [];

  try {
    const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    if (!error) {
      const scopedUsers = data.users.filter(
        (user) => user.user_metadata?.company_id === companyId,
      );

      pendingInvites = scopedUsers
        .filter((user) => !user.last_sign_in_at)
        .map((user) => ({
          id: user.id,
          email: user.email ?? "",
          role:
            typeof user.user_metadata?.role === "string" && ["owner", "admin", "agent"].includes(user.user_metadata.role)
              ? user.user_metadata.role
              : "agent",
          invitedAt: user.invited_at ?? user.created_at ?? null,
        }))
        .filter((invite) => Boolean(invite.email));
    }
  } catch {
    pendingInvites = [];
  }

  const pendingInviteIds = new Set(pendingInvites.map((invite) => invite.id));
  const allProfiles = ((adminProfiles as TeamMemberView[] | null | undefined) ?? []);
  const team = allProfiles.filter((member) => !pendingInviteIds.has(member.id));

  return {
    channels: ((channels as ChannelRow[] | null | undefined) ?? []),
    team,
    pendingInvites,
    setupRequests: ((setupRequests as SetupRequestRow[] | null | undefined) ?? []),
    feedbackHistory: (((feedbackHistory as Array<{
      id: string;
      category: "bug" | "feedback" | "feature_request";
      message: string;
      page_path: string | null;
      status: "new" | "reviewed" | "closed";
      admin_reply: string | null;
      replied_at: string | null;
      created_at: string;
    }> | null | undefined) ?? [])).map((row) => ({
      id: row.id,
      category: row.category,
      message: row.message,
      pagePath: row.page_path,
      status: row.status,
      adminReply: row.admin_reply,
      repliedAt: row.replied_at,
      createdAt: row.created_at,
    })) satisfies UserPilotFeedbackView[],
  };
}

export function getBusinessSetup(company: CompanyRow | null) {
  return parseBusinessSetup(company);
}

export async function getSetupRequestsAdminView() {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("setup_requests")
    .select("id, company_id, user_id, channel, status, notes, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    throw new Error(error.message);
  }

  const rows = ((data as Array<{
    id: string;
    company_id: string;
    user_id: string;
    channel: "whatsapp" | "instagram" | "email" | "form";
    status: "requested" | "in_progress" | "completed" | "cancelled";
    notes: string | null;
    created_at: string;
  }> | null | undefined) ?? []);

  if (rows.length === 0) {
    return [] satisfies SetupRequestView[];
  }

  const companyIds = Array.from(new Set(rows.map((row) => row.company_id)));
  const userIds = Array.from(new Set(rows.map((row) => row.user_id)));

  const [{ data: companies, error: companiesError }, { data: profiles, error: profilesError }] =
    await Promise.all([
      admin.from("companies").select("id, name").in("id", companyIds),
      admin.from("profiles").select("id, full_name").in("id", userIds),
    ]);

  if (companiesError) {
    throw new Error(companiesError.message);
  }

  if (profilesError) {
    throw new Error(profilesError.message);
  }

  const companiesById = new Map(
    (((companies as Array<{ id: string; name: string }> | null | undefined) ?? []).map((row) => [
      row.id,
      row.name,
    ])),
  );
  const profilesById = new Map(
    (((profiles as Array<{ id: string; full_name: string | null }> | null | undefined) ?? []).map((row) => [
      row.id,
      row.full_name,
    ])),
  );

  return rows.map((row) => {
    return {
      id: row.id,
      channel: row.channel,
      status: row.status,
      createdAt: row.created_at,
      companyName: companiesById.get(row.company_id) ?? "Unknown company",
      requestedBy: profilesById.get(row.user_id) ?? "Unknown user",
      notes: row.notes,
    } satisfies SetupRequestView;
  });
}

export async function getPilotFeedbackAdminView() {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("pilot_feedback")
    .select("id, company_id, user_id, category, message, page_path, status, admin_reply, replied_at, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    throw new Error(error.message);
  }

  const rows = ((data as PilotFeedbackRow[] | null | undefined) ?? []);

  if (rows.length === 0) {
    return [] satisfies PilotFeedbackView[];
  }

  const companyIds = Array.from(new Set(rows.map((row) => row.company_id)));
  const userIds = Array.from(new Set(rows.map((row) => row.user_id)));

  const [{ data: companies, error: companiesError }, { data: profiles, error: profilesError }] =
    await Promise.all([
      admin.from("companies").select("id, name").in("id", companyIds),
      admin.from("profiles").select("id, full_name").in("id", userIds),
    ]);

  if (companiesError) {
    throw new Error(companiesError.message);
  }

  if (profilesError) {
    throw new Error(profilesError.message);
  }

  const companiesById = new Map(
    (((companies as Array<{ id: string; name: string }> | null | undefined) ?? [])).map((row) => [row.id, row.name]),
  );
  const profilesById = new Map(
    (((profiles as Array<{ id: string; full_name: string | null }> | null | undefined) ?? [])).map((row) => [
      row.id,
      row.full_name?.trim() || "Unknown user",
    ]),
  );

  return rows.map((row) => ({
    id: row.id,
    companyName: companiesById.get(row.company_id) ?? "Unknown company",
    sentBy: profilesById.get(row.user_id) ?? "Unknown user",
    category: row.category,
    message: row.message,
    pagePath: row.page_path,
    status: row.status,
    adminReply: row.admin_reply,
    repliedAt: row.replied_at,
    createdAt: row.created_at,
  })) satisfies PilotFeedbackView[];
}
