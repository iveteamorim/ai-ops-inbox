import { detectCustomerLanguage } from "@/lib/reply-suggestions";

type CompanyConfig = Record<string, unknown> | null | undefined;

export type QuickReply = {
  id: string;
  title: string;
  keywords: string;
  text: string;
};

export type QuickRepliesView = {
  replies: QuickReply[];
};

const KEYWORD_SYNONYM_GROUPS = [
  [
    "preco",
    "precio",
    "price",
    "pricing",
    "custo",
    "costo",
    "cost",
    "costs",
    "valor",
    "quanto",
    "cuanto",
    "tarifa",
    "tarifas",
    "fee",
    "fees",
    "quote",
    "rate",
    "rates",
    "charge",
    "charges",
  ],
  [
    "info",
    "informacao",
    "informacion",
    "information",
    "detalhe",
    "detalhes",
    "detalle",
    "detalles",
    "saber",
    "conocer",
    "details",
    "detail",
    "about",
    "learn",
    "inquiry",
    "enquiry",
  ],
  [
    "servico",
    "servicos",
    "servicio",
    "servicios",
    "service",
    "services",
    "produto",
    "produtos",
    "producto",
    "productos",
    "product",
    "products",
    "tratamento",
    "tratamentos",
    "tratamiento",
    "tratamientos",
    "treatment",
    "treatments",
    "offering",
    "offerings",
  ],
  [
    "horario",
    "horarios",
    "abre",
    "abren",
    "aberto",
    "fecha",
    "fechado",
    "hours",
    "hour",
    "open",
    "opening",
    "schedule",
    "cierra",
    "cerrado",
    "closed",
    "close",
    "weekday",
    "weekend",
  ],
  [
    "onde",
    "localizacao",
    "localizacion",
    "ubicacion",
    "address",
    "direccion",
    "direcao",
    "morada",
    "mapa",
    "location",
    "where",
    "directions",
  ],
  [
    "bono",
    "bonos",
    "sesion",
    "sesiones",
    "sessao",
    "sessoes",
    "pack",
    "packs",
    "voucher",
    "vouchers",
    "bundle",
    "bundles",
  ],
  ["consulta", "consultas", "cita", "citas", "visita", "visitas", "appointment", "booking", "reserva", "book"],
] as const;

const ENGLISH_PHRASE_GROUPS: Array<{ phrases: string[]; groupIndex: number }> = [
  { phrases: ["how much", "how many", "what does it cost", "what is the price", "what is the cost"], groupIndex: 0 },
  { phrases: ["more info", "more information", "tell me about", "learn more", "want info", "need info"], groupIndex: 1 },
  {
    phrases: ["what services", "which service", "what products", "which product", "what do you offer", "what treatments"],
    groupIndex: 2,
  },
  {
    phrases: ["what time", "opening hours", "opening times", "when do you open", "when are you open", "are you open"],
    groupIndex: 3,
  },
  { phrases: ["where are you", "where is", "how do i get", "how to get there", "your address"], groupIndex: 4 },
];

const SPANISH_PHRASE_GROUPS: Array<{ phrases: string[]; groupIndex: number }> = [
  {
    phrases: [
      "precio de",
      "precio del",
      "precio la",
      "precio los",
      "precio las",
      "cuanto cuesta",
      "cuanto vale",
      "queria saber el precio",
      "saber el precio",
      "coste de",
      "costo de",
    ],
    groupIndex: 0,
  },
  {
    phrases: ["mas informacion", "más informacion", "informacion sobre", "saber mas", "queria saber", "me gustaria saber"],
    groupIndex: 1,
  },
  {
    phrases: ["que servicios", "que productos", "que tratamientos", "que ofrecen"],
    groupIndex: 2,
  },
  {
    phrases: ["que horario", "a que hora", "cuando abren", "horario de"],
    groupIndex: 3,
  },
  {
    phrases: ["donde estais", "donde estan", "donde quedais", "como llegar"],
    groupIndex: 4,
  },
  {
    phrases: ["bono sesiones", "bono de sesiones", "pack sesiones", "bonos sesiones"],
    groupIndex: 5,
  },
];

const PORTUGUESE_PHRASE_GROUPS: Array<{ phrases: string[]; groupIndex: number }> = [
  {
    phrases: ["preco de", "preco do", "preco da", "quanto custa", "quanto vale", "queria saber o preco"],
    groupIndex: 0,
  },
  {
    phrases: ["mais informacao", "informacao sobre", "queria saber", "gostaria de saber"],
    groupIndex: 1,
  },
  {
    phrases: ["que servicos", "que produtos", "que tratamentos"],
    groupIndex: 2,
  },
  {
    phrases: ["que horario", "a que horas", "quando abrem"],
    groupIndex: 3,
  },
  {
    phrases: ["onde ficam", "onde estao", "como chegar"],
    groupIndex: 4,
  },
  {
    phrases: ["bono sessoes", "bono de sessoes", "pack sessoes"],
    groupIndex: 5,
  },
];

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function tokenize(value: string) {
  return normalizeText(value)
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 2);
}

function expandKeyword(keyword: string) {
  const normalized = normalizeText(keyword);
  if (!normalized) return [];

  const expanded = new Set<string>([normalized]);
  for (const group of KEYWORD_SYNONYM_GROUPS) {
    if (group.some((term) => normalized.includes(term) || term.includes(normalized))) {
      group.forEach((term) => expanded.add(term));
    }
  }

  return [...expanded];
}

function getMessagePhraseSignals(normalizedMessage: string) {
  const signals = new Set<string>();

  for (const entry of [...ENGLISH_PHRASE_GROUPS, ...SPANISH_PHRASE_GROUPS, ...PORTUGUESE_PHRASE_GROUPS]) {
    const matched = entry.phrases.some((phrase) => normalizedMessage.includes(normalizeText(phrase)));
    if (!matched) continue;

    for (const term of KEYWORD_SYNONYM_GROUPS[entry.groupIndex]) {
      signals.add(term);
    }
  }

  return signals;
}

function buildReplySignals(reply: QuickReply) {
  const signals = new Set<string>();

  for (const keyword of reply.keywords.split(",")) {
    for (const expanded of expandKeyword(keyword)) {
      signals.add(expanded);
    }
  }

  for (const token of tokenize(reply.title)) {
    signals.add(token);
    for (const expanded of expandKeyword(token)) {
      signals.add(expanded);
    }
  }

  return [...signals];
}

function scoreReplyMatch(normalizedMessage: string, messageTokens: Set<string>, reply: QuickReply) {
  const signals = buildReplySignals(reply);
  if (signals.length === 0) return 0;

  const phraseSignals = getMessagePhraseSignals(normalizedMessage);
  let score = 0;
  for (const signal of signals) {
    if (signal.length < 3) {
      if (messageTokens.has(signal)) score += 2;
      continue;
    }

    if (normalizedMessage.includes(signal) || phraseSignals.has(signal)) {
      score += Math.max(signal.length, 3);
    }
  }

  return score;
}

function parseQuickReplyRow(value: unknown): QuickReply | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const title = typeof row.title === "string" ? row.title.trim().slice(0, 80) : "";
  const text = typeof row.text === "string" ? row.text.trim().slice(0, 1200) : "";
  if (!title || !text) return null;

  const keywords = typeof row.keywords === "string" ? row.keywords.trim().slice(0, 240) : "";
  const id =
    typeof row.id === "string" && row.id.trim()
      ? row.id.trim()
      : `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Math.random().toString(36).slice(2, 8)}`;

  return { id, title, keywords, text };
}

export function parseQuickReplies(config: CompanyConfig): QuickRepliesView {
  const quickRepliesRoot =
    config && typeof config === "object" && "quick_replies" in config
      ? config.quick_replies
      : null;

  const rows = Array.isArray(quickRepliesRoot) ? quickRepliesRoot : [];
  return {
    replies: rows
      .map(parseQuickReplyRow)
      .filter((row): row is QuickReply => Boolean(row))
      .slice(0, 20),
  };
}

export function getQuickReplies(company: { config?: CompanyConfig } | null) {
  return parseQuickReplies(company?.config ?? null);
}

export function matchQuickReply(message: string, replies: QuickReply[]): QuickReply | null {
  const normalizedMessage = normalizeText(message);
  if (!normalizedMessage || replies.length === 0) return null;

  const messageTokens = new Set(tokenize(message));
  let best: QuickReply | null = null;
  let bestScore = 0;

  for (const reply of replies) {
    const score = scoreReplyMatch(normalizedMessage, messageTokens, reply);
    if (score > bestScore) {
      best = reply;
      bestScore = score;
    }
  }

  return bestScore > 0 ? best : null;
}

export function resolveQuickReplyMatch(message: string, configuredReplies: QuickReply[]): QuickReply | null {
  const configuredMatch = matchQuickReply(message, configuredReplies);
  if (configuredMatch) return configuredMatch;

  const lang = detectCustomerLanguage(message);
  return matchQuickReply(message, getDefaultQuickReplyStarters(lang));
}

export function formatQuickRepliesForPrompt(replies: QuickReply[]) {
  if (replies.length === 0) return "No approved quick replies configured.";

  return replies
    .map((reply, index) => {
      const keywordHint = reply.keywords.trim() ? `Keywords: ${reply.keywords.trim()}` : "Keywords: none";
      return `${index + 1}. ${reply.title}\n${keywordHint}\nApproved reply: ${reply.text}`;
    })
    .join("\n\n");
}

export const DEFAULT_QUICK_REPLY_STARTERS: QuickReply[] = getDefaultQuickReplyStarters("pt");

export function getDefaultQuickReplyStarters(lang: string): QuickReply[] {
  if (lang === "en") {
    return [
      {
        id: "opening-hours",
        title: "Opening hours",
        keywords: "hours,open,opening,schedule,closed,close,weekday,weekend",
        text: "We are open Monday to Friday, 9:00 AM to 7:00 PM. Saturdays 9:00 AM to 1:00 PM. Closed on Sundays.",
      },
      {
        id: "pricing-consultation",
        title: "Consultation price",
        keywords: "price,pricing,cost,fee,quote,how much,rate,charge",
        text: "The first consultation is €50. I can explain what is included and help you book.",
      },
      {
        id: "pricing-session-pack",
        title: "Session pack price",
        keywords: "session pack,sessions,pack,voucher,bono,price,pricing,cost,how much",
        text: "Our session pack is €180 for 5 sessions. I can explain what is included and help you choose the best option.",
      },
      {
        id: "services-info",
        title: "Services and information",
        keywords: "service,services,product,products,info,information,treatment,offer",
        text: "We offer several services and treatments. Tell me which product or service you are interested in and I will send the details.",
      },
      {
        id: "location",
        title: "Location",
        keywords: "where,location,address,directions,map",
        text: "We are at Example Street 12, Lisbon. Street parking is available and the metro stop is a 3-minute walk away.",
      },
    ];
  }

  if (lang === "es") {
    return [
      {
        id: "opening-hours",
        title: "Horario",
        keywords: "horario,horarios,abre,abren,cierra,cerrado,hours,open,schedule",
        text: "Abrimos de lunes a viernes, de 9:00 a 19:00. Sábados de 9:00 a 13:00. Domingo cerrado.",
      },
      {
        id: "pricing-consultation",
        title: "Precio consulta",
        keywords: "precio,price,costo,costo,valor,cuanto,tarifa,fee,quote",
        text: "La primera consulta cuesta 50€. Puedo explicarte qué incluye y ayudarte a reservar.",
      },
      {
        id: "pricing-session-pack",
        title: "Precio bono sesiones",
        keywords: "bono,bonos,sesiones,pack,precio,precios,cuanto,costo,tarifa",
        text: "El bono de sesiones cuesta 180€ por 5 sesiones. Puedo explicarte qué incluye y ayudarte a elegir la mejor opción.",
      },
      {
        id: "services-info",
        title: "Servicios e información",
        keywords: "servicio,servicios,producto,productos,info,informacion,tratamiento,tratamientos",
        text: "Tenemos varios servicios y tratamientos. Dime qué producto o servicio te interesa y te envío los detalles.",
      },
      {
        id: "location",
        title: "Ubicación",
        keywords: "donde,ubicacion,direccion,address,location,mapa,directions",
        text: "Estamos en Calle Ejemplo 12, Lisboa. Hay aparcamiento en la calle y el metro está a 3 minutos.",
      },
    ];
  }

  return [
    {
      id: "opening-hours",
      title: "Horário",
      keywords: "horario,horarios,abre,abren,aberto,fecha,hours,open,schedule",
      text: "Abrimos de segunda a sexta, das 9h às 19h. Sábados das 9h às 13h. Domingo fechado.",
    },
      {
        id: "pricing-consultation",
        title: "Preço consulta",
        keywords: "preco,precio,price,custo,costo,valor,quanto,cuanto,tarifa",
        text: "A primeira consulta custa 50€. Posso explicar o que está incluído e ajudar a marcar.",
      },
      {
        id: "pricing-session-pack",
        title: "Preço bono sessões",
        keywords: "bono,bonos,sessoes,sessao,pack,preco,precos,quanto,custo,tarifa",
        text: "O bono de sessões custa 180€ por 5 sessões. Posso explicar o que está incluído e ajudar a escolher a melhor opção.",
      },
    {
      id: "services-info",
      title: "Serviços e informação",
      keywords: "servico,servicio,produto,producto,info,informacao,informacion,tratamento,tratamiento",
      text: "Temos vários serviços e tratamentos. Diz-me qual produto ou serviço te interessa e envio os detalhes.",
    },
    {
      id: "location",
      title: "Localização",
      keywords: "onde,localizacao,localizacion,address,direccion,dirección,morada,mapa",
      text: "Estamos na Rua Exemplo 12, Lisboa. Há estacionamento na rua e paragem de metro a 3 minutos.",
    },
  ];
}
