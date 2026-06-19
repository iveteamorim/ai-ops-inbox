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

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
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

  let best: QuickReply | null = null;
  let bestScore = 0;

  for (const reply of replies) {
    const keywordList = reply.keywords
      .split(",")
      .map((keyword) => normalizeText(keyword))
      .filter(Boolean);

    if (keywordList.length === 0) continue;

    let score = 0;
    for (const keyword of keywordList) {
      if (normalizedMessage.includes(keyword)) {
        score += Math.max(keyword.length, 3);
      }
    }

    if (score > bestScore) {
      best = reply;
      bestScore = score;
    }
  }

  return best;
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
    keywords: "preco,preço,price,custo,valor,quanto,custa,cuanto",
    text: "A primeira consulta custa 50€. Posso explicar o que está incluído e ajudar a marcar.",
  },
  {
    id: "location",
    title: "Localização",
    keywords: "onde,localizacao,localização,address,direccion,dirección,morada,mapa",
    text: "Estamos na Rua Exemplo 12, Lisboa. Há estacionamento na rua e paragem de metro a 3 minutos.",
  },
];
