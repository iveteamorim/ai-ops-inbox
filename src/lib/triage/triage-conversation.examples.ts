import {
  type ConversationInput,
  type ServiceType,
  triageConversation,
} from "@/lib/triage/triage-conversation";

export const NOVUA_SERVICE_CATALOG: ServiceType[] = [
  { name: "Primera visita fisio", estimatedValue: 60 },
  { name: "Pack sesiones", estimatedValue: 180 },
  { name: "Tratamiento premium", estimatedValue: 350 },
  { name: "Sin clasificar", estimatedValue: 0 },
];

export const NOVUA_TRIAGE_EXAMPLES: Array<{
  name: string;
  input: ConversationInput;
}> = [
  {
    name: "Pricing + no response",
    input: {
      customerName: "Lucia Demo",
      lastCustomerMessage: "Hola, quiero saber precio y disponibilidad para esta semana.",
      conversationStatus: "no_response",
      lastContactHoursAgo: 72,
      assignedUnit: "Barcelona Centro",
    },
  },
  {
    name: "Booking intent",
    input: {
      customerName: "Nóvua",
      lastCustomerMessage: "Quiero una primera visita esta semana, ¿tenéis hueco?",
      conversationStatus: "new",
      lastContactHoursAgo: 3,
      assignedUnit: "Mataró",
    },
  },
  {
    name: "Low confidence inquiry",
    input: {
      customerName: "Test User",
      lastCustomerMessage: "Hola, ¿me podéis ayudar?",
      conversationStatus: "in_conversation",
      lastContactHoursAgo: 1,
      assignedUnit: null,
    },
  },
];

export function runNovuaTriageExamples() {
  return NOVUA_TRIAGE_EXAMPLES.map((example) => ({
    name: example.name,
    input: example.input,
    output: triageConversation(example.input, NOVUA_SERVICE_CATALOG),
  }));
}
