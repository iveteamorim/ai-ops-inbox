import { buildFallbackReplySuggestion, detectReplyIntent, type ReplyIntent } from "@/lib/reply-suggestions";

export type ServiceType = {
  name: string;
  estimatedValue: number;
};

export type ConversationInput = {
  customerName: string;
  lastCustomerMessage: string;
  conversationStatus: "new" | "in_conversation" | "no_response" | "won" | "lost";
  lastContactHoursAgo: number;
  assignedUnit?: string | null;
};

export type TriageIntent = ReplyIntent;
export type TriagePriority = "low" | "medium" | "high";
export type TriageRiskStatus = "safe" | "watch" | "at_risk";
export type TriageNextAction =
  | "reply_now"
  | "follow_up"
  | "qualify_need"
  | "close_low_priority"
  | "mark_won"
  | "mark_lost";

export type TriageResult = {
  intent: TriageIntent;
  leadType: string;
  estimatedValue: number;
  priority: TriagePriority;
  riskStatus: TriageRiskStatus;
  nextAction: TriageNextAction;
  suggestedResponse: string;
  revenueAtRisk: number;
  reasoningSummary: string;
};

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
}

function scoreLeadType(message: string, service: ServiceType) {
  const text = normalizeText(message);
  const name = normalizeText(service.name);
  if (!text || !name) return 0;

  let score = 0;
  if (text.includes(name)) {
    score += 6;
  }

  const tokens = name
    .split(/\s+/)
    .filter(Boolean)
    .filter((token) => token.length > 2);

  for (const token of tokens) {
    if (text.includes(token)) {
      score += 2;
    }
  }

  const genericInquiryHints = [
    "appointment",
    "availability",
    "available",
    "book",
    "booking",
    "cost",
    "information",
    "price",
    "schedule",
    "this week",
    "tomorrow",
    "treatment",
    "update",
    "precio",
    "precios",
    "coste",
    "costo",
    "tarifa",
    "disponibilidad",
    "horario",
    "horarios",
    "cita",
    "reserva",
    "reservar",
    "sesion",
    "sesiones",
    "tratamiento",
    "pack",
    "bono",
    "semana",
    "manana",
  ];

  const broadCommercialType =
    name.includes("appointment") ||
    name.includes("consultation") ||
    name.includes("follow-up") ||
    name.includes("premium") ||
    name.includes("treatment") ||
    name.includes("visit") ||
    name.includes("visita") ||
    name.includes("consulta") ||
    name.includes("sesion") ||
    name.includes("tratamiento") ||
    name.includes("pack") ||
    name.includes("bono");

  if (score === 0 && broadCommercialType && genericInquiryHints.some((hint) => text.includes(hint))) {
    score += 1;
  }

  return score;
}

function selectLeadType(message: string, serviceCatalog: ServiceType[]) {
  const cleanedCatalog = serviceCatalog.filter((item) => item.name.trim().length > 0);
  const fallbackUnknown =
    cleanedCatalog.find((item) => normalizeText(item.name).includes("sin clasificar")) ??
    cleanedCatalog.find((item) => normalizeText(item.name).includes("unclassified")) ??
    { name: "Sin clasificar", estimatedValue: 0 };

  let best = fallbackUnknown;
  let bestScore = 0;

  for (const service of cleanedCatalog) {
    const score = scoreLeadType(message, service);
    if (score > bestScore) {
      best = service;
      bestScore = score;
    }
  }

  if (bestScore === 0) {
    return fallbackUnknown;
  }

  return best;
}

function computePriority(params: {
  intent: TriageIntent;
  estimatedValue: number;
  conversationStatus: ConversationInput["conversationStatus"];
  lastContactHoursAgo: number;
}): TriagePriority {
  const { intent, estimatedValue, conversationStatus, lastContactHoursAgo } = params;

  if (conversationStatus === "won" || conversationStatus === "lost") return "low";
  if (conversationStatus === "no_response" && lastContactHoursAgo >= 24 && estimatedValue > 0) return "high";
  if ((intent === "booking" || intent === "availability") && estimatedValue > 0) return "high";
  if (intent === "pricing" && estimatedValue >= 180) return "high";
  if (estimatedValue > 0 && (intent === "pricing" || intent === "general" || intent === "availability")) return "medium";
  return "low";
}

function computeRiskStatus(params: {
  priority: TriagePriority;
  conversationStatus: ConversationInput["conversationStatus"];
  lastContactHoursAgo: number;
  estimatedValue: number;
}): TriageRiskStatus {
  const { priority, conversationStatus, lastContactHoursAgo, estimatedValue } = params;

  if (conversationStatus === "won" || conversationStatus === "lost" || estimatedValue === 0) return "safe";
  if (conversationStatus === "no_response" && lastContactHoursAgo >= 24 && estimatedValue > 0) return "at_risk";
  if (conversationStatus === "no_response" && lastContactHoursAgo >= 2 && estimatedValue > 0) return "watch";
  if (priority === "high") return "watch";
  return "safe";
}

function computeNextAction(params: {
  conversationStatus: ConversationInput["conversationStatus"];
  riskStatus: TriageRiskStatus;
  intent: TriageIntent;
  estimatedValue: number;
}): TriageNextAction {
  const { conversationStatus, riskStatus, intent, estimatedValue } = params;

  if (conversationStatus === "won") return "mark_won";
  if (conversationStatus === "lost") return "mark_lost";
  if (riskStatus === "at_risk") return "reply_now";
  if (riskStatus === "watch") return "follow_up";
  if (estimatedValue === 0 || intent === "other") return "close_low_priority";
  return "qualify_need";
}

function buildReasoningSummary(params: {
  intent: TriageIntent;
  leadType: string;
  priority: TriagePriority;
  riskStatus: TriageRiskStatus;
  conversationStatus: ConversationInput["conversationStatus"];
  lastContactHoursAgo: number;
}): string {
  const { intent, leadType, priority, riskStatus, conversationStatus, lastContactHoursAgo } = params;

  if (conversationStatus === "won") return "Conversation already marked as won, so there is no revenue risk.";
  if (conversationStatus === "lost") return "Conversation already marked as lost, so there is no active revenue opportunity.";

  const urgency =
    conversationStatus === "no_response"
      ? `The conversation has been waiting ${lastContactHoursAgo} hours without reply.`
      : "The conversation is still active.";

  return `${urgency} Intent is ${intent}, mapped to ${leadType}, with ${priority} priority and ${riskStatus} risk.`;
}

export function triageConversation(
  conversation: ConversationInput,
  serviceCatalog: ServiceType[],
): TriageResult {
  const intent = detectReplyIntent(conversation.lastCustomerMessage);
  const leadTypeMatch = selectLeadType(conversation.lastCustomerMessage, serviceCatalog);
  const estimatedValue = Number(leadTypeMatch.estimatedValue ?? 0);
  const priority = computePriority({
    intent,
    estimatedValue,
    conversationStatus: conversation.conversationStatus,
    lastContactHoursAgo: conversation.lastContactHoursAgo,
  });
  const riskStatus = computeRiskStatus({
    priority,
    conversationStatus: conversation.conversationStatus,
    lastContactHoursAgo: conversation.lastContactHoursAgo,
    estimatedValue,
  });
  const nextAction = computeNextAction({
    conversationStatus: conversation.conversationStatus,
    riskStatus,
    intent,
    estimatedValue,
  });
  const revenueAtRisk =
    riskStatus === "at_risk" ? estimatedValue : 0;

  return {
    intent,
    leadType: leadTypeMatch.name,
    estimatedValue,
    priority,
    riskStatus,
    nextAction,
    suggestedResponse: buildFallbackReplySuggestion({
      message: conversation.lastCustomerMessage,
      leadType: leadTypeMatch.name,
      estimatedValue,
    }),
    revenueAtRisk,
    reasoningSummary: buildReasoningSummary({
      intent,
      leadType: leadTypeMatch.name,
      priority,
      riskStatus,
      conversationStatus: conversation.conversationStatus,
      lastContactHoursAgo: conversation.lastContactHoursAgo,
    }),
  };
}
