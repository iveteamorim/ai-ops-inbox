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
  ["preco", "precio", "price", "pricing", "custo", "costo", "valor", "quanto", "cuanto", "tarifa", "tarifas"],
  ["info", "informacao", "informacion", "information", "detalhe", "detalhes", "detalle", "detalles", "saber", "conocer"],
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
  ],
  ["horario", "horarios", "abre", "abren", "aberto", "fecha", "fechado", "hours", "hour", "open", "opening", "schedule", "cierra", "cerrado"],
  ["onde", "localizacao", "localizacion", "ubicacion", "address", "direccion", "direcao", "morada", "mapa", "location"],
  ["consulta", "consultas", "cita", "citas", "visita", "visitas", "appointment", "booking", "reserva"],
] as const;

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

  let score = 0;
  for (const signal of signals) {
    if (signal.length < 3) {
      if (messageTokens.has(signal)) score += 2;
      continue;
    }

    if (normalizedMessage.includes(signal)) {
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

export function formatQuickRepliesForPrompt(replies: QuickReply[]) {
  if (replies.length === 0) return "No approved quick replies configured.";

  return replies
    .map((reply, index) => {
      const keywordHint = reply.keywords.trim() ? `Keywords: ${reply.keywords.trim()}` : "Keywords: none";
      return `${index + 1}. ${reply.title}\n${keywordHint}\nApproved reply: ${reply.text}`;
    })
    .join("\n\n");
}

export const DEFAULT_QUICK_REPLY_STARTERS: QuickReply[] = [
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
