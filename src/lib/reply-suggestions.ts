export type ReplyIntent = "pricing" | "booking" | "availability" | "general" | "other";
export type CustomerLanguage = "pt" | "es" | "en";

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
}

const LANGUAGE_SIGNALS: Record<CustomerLanguage, string[]> = {
  es: [
    "hola",
    "precio",
    "precios",
    "queria",
    "gracias",
    "cuanto",
    "informacion",
    "servicio",
    "servicios",
    "donde",
    "horario",
    "sesion",
    "sesiones",
    "bono",
    "bonos",
    "cita",
    "reserva",
    "disponibilidad",
    "manana",
    "semana",
  ],
  pt: [
    "ola",
    "obrigado",
    "obrigada",
    "preco",
    "gostaria",
    "quanto",
    "informacao",
    "servico",
    "servicos",
    "onde",
    "horario",
    "sessao",
    "sessoes",
    "bono",
    "bonos",
    "consulta",
    "marcar",
    "disponibilidade",
    "amanha",
    "semana",
  ],
  en: [
    "hello",
    "hi",
    "thanks",
    "thank",
    "price",
    "pricing",
    "would like",
    "how much",
    "information",
    "service",
    "services",
    "where",
    "hours",
    "session",
    "sessions",
    "pack",
    "voucher",
    "appointment",
    "booking",
    "availability",
    "tomorrow",
    "week",
  ],
};

export function detectCustomerLanguage(message: string): CustomerLanguage {
  const text = normalizeText(message);
  if (!text) return "es";

  const scores: Record<CustomerLanguage, number> = { es: 0, pt: 0, en: 0 };

  for (const [lang, signals] of Object.entries(LANGUAGE_SIGNALS) as Array<[CustomerLanguage, string[]]>) {
    for (const signal of signals) {
      if (text.includes(signal)) {
        scores[lang] += signal.length >= 5 ? 2 : 1;
      }
    }
  }

  const ranked = (Object.entries(scores) as Array<[CustomerLanguage, number]>).sort((a, b) => b[1] - a[1]);
  if (ranked[0][1] === 0) return "es";
  if (ranked[1][1] === ranked[0][1]) return "es";
  return ranked[0][0];
}

export function detectReplyIntent(message: string): ReplyIntent {
  const text = normalizeText(message);
  if (!text) return "other";

  if (
    [
      "price",
      "pricing",
      "cost",
      "rate",
      "precio",
      "precios",
      "preco",
      "precos",
      "coste",
      "costo",
      "custo",
      "tarifa",
      "quanto",
      "cuanto",
      "how much",
      "what does it cost",
      "what is the price",
    ].some((hint) => text.includes(hint))
  ) {
    return "pricing";
  }

  if (
    [
      "appointment",
      "book",
      "booking",
      "confirm booking",
      "reserve",
      "reservar",
      "reserva",
      "agendar",
      "quiero cita",
      "confirmar cita",
      "primera visita",
      "quiero una visita",
      "quiero una primera visita",
      "quiero una sesion",
      "marcar",
      "quero marcar",
    ].some((hint) => text.includes(hint))
  ) {
    return "booking";
  }

  if (
    [
      "availability",
      "available",
      "opening",
      "open",
      "hours",
      "schedule",
      "tomorrow",
      "this week",
      "disponibilidad",
      "disponible",
      "disponibilidade",
      "hueco",
      "horario",
      "horarios",
      "manana",
      "amanha",
      "esta semana",
      "abren",
      "abre",
      "cierra",
      "fecha",
      "cerrado",
      "when do you open",
      "opening hours",
    ].some((hint) => text.includes(hint))
  ) {
    return "availability";
  }

  if (["hello", "hi", "information", "info", "help", "update", "hola", "informacion", "ayuda", "ola"].some((hint) => text.includes(hint))) {
    return "general";
  }

  return "other";
}

function detectMessageTopic(message: string): string | null {
  const text = normalizeText(message);

  if (/(bono|bonos|pack).*(sesion|sesiones)|sesion(es)?.*(bono|bonos|pack)/.test(text)) {
    return "session_pack";
  }

  if (text.includes("primera consulta") || text.includes("primeira consulta") || text.includes("first consultation")) {
    return "first_consultation";
  }

  if (text.includes("primera visita") || text.includes("primeira visita") || text.includes("first visit")) {
    return "first_visit";
  }

  return null;
}

function topicLabel(topic: string | null, lang: CustomerLanguage): string | null {
  if (!topic) return null;

  const labels: Record<string, Record<CustomerLanguage, string>> = {
    session_pack: {
      es: "bono de sesiones",
      pt: "bono de sessões",
      en: "session pack",
    },
    first_consultation: {
      es: "primera consulta",
      pt: "primeira consulta",
      en: "first consultation",
    },
    first_visit: {
      es: "primera visita",
      pt: "primeira visita",
      en: "first visit",
    },
  };

  return labels[topic]?.[lang] ?? null;
}

function resolveLeadLabel(params: {
  message: string;
  leadType?: string | null;
  lang: CustomerLanguage;
}): string {
  const topic = topicLabel(detectMessageTopic(params.message), params.lang);
  if (topic) return topic;

  const leadType = params.leadType?.trim();
  if (leadType) return leadType.toLowerCase();

  if (params.lang === "pt") return "o que precisa";
  if (params.lang === "en") return "what you need";
  return "lo que necesitas";
}

export function buildFallbackReplySuggestion(params: {
  message: string;
  leadType?: string | null;
  estimatedValue?: number | null;
}): string {
  const lang = detectCustomerLanguage(params.message);
  const intent = detectReplyIntent(params.message);
  const leadLabel = resolveLeadLabel({
    message: params.message,
    leadType: params.leadType,
    lang,
  });
  const hasValue = Number(params.estimatedValue ?? 0) > 0;

  if (intent === "pricing") {
    if (lang === "pt") {
      return hasValue
        ? `Posso ajudar com o preço de ${leadLabel} e explicar as opções disponíveis.`
        : `Posso ajudar com o preço de ${leadLabel}. Quer que explique as opções?`;
    }
    if (lang === "en") {
      return hasValue
        ? `I can help with the price of ${leadLabel} and explain the available options.`
        : `I can help with the price of ${leadLabel}. Would you like me to explain the options?`;
    }
    return hasValue
      ? `Puedo ayudarte con el precio de ${leadLabel} y explicarte las opciones disponibles.`
      : `Puedo ayudarte con el precio de ${leadLabel}. ¿Quieres que te explique las opciones?`;
  }

  if (intent === "booking" || intent === "availability") {
    if (lang === "pt") {
      return hasValue
        ? `Posso rever a disponibilidade para ${leadLabel} e ajudar a avançar com a reserva.`
        : "Posso rever a disponibilidade contigo e ajudar a concretizar o que precisas.";
    }
    if (lang === "en") {
      return hasValue
        ? `I can check availability for ${leadLabel} and help you move forward with the booking.`
        : "I can check availability with you and help you arrange what you need.";
    }
    return hasValue
      ? `Puedo revisar disponibilidad para ${leadLabel} y ayudarte a avanzar con la reserva.`
      : "Puedo revisar disponibilidad contigo y ayudarte a concretar lo que necesitas.";
  }

  if (hasValue) {
    if (lang === "pt") return `Posso ajudar com ${leadLabel} e indicar o próximo passo.`;
    if (lang === "en") return `I can help with ${leadLabel} and guide the next step.`;
    return `Puedo ayudarte con ${leadLabel} y orientarte en el siguiente paso.`;
  }

  if (lang === "pt") return "Obrigado por escrever. Pode contar-me um pouco mais sobre o que precisa?";
  if (lang === "en") return "Thanks for reaching out. Can you share a bit more about what you need?";
  return "Gracias por escribir. ¿Me puedes contar un poco más sobre lo que necesitas?";
}
