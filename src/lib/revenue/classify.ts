export type LeadTypeRule = {
  id?: string;
  name: string;
  estimatedValue: number;
};

export type ClassifiedLead = {
  leadType: string | null;
  estimatedValue: number;
};

export function getLeadTypesFromBusinessConfig(config: Record<string, unknown> | null | undefined): LeadTypeRule[] {
  const businessSetup =
    config && typeof config === "object" && "business_setup" in config
      ? (config.business_setup as Record<string, unknown> | null)
      : null;

  const leadTypes = Array.isArray(businessSetup?.lead_types) ? businessSetup.lead_types : [];
  return leadTypes
    .map((row) => {
      if (!row || typeof row !== "object") return null;
      const item = row as Record<string, unknown>;
      const name = typeof item.name === "string" ? item.name.trim() : "";
      const estimatedValue =
        typeof item.estimated_value === "number"
          ? item.estimated_value
          : typeof item.estimated_value === "string"
            ? Number(item.estimated_value)
            : 0;

      return name
        ? {
            name,
            estimatedValue: Number.isFinite(estimatedValue) ? estimatedValue : 0,
          }
        : null;
    })
    .filter((value): value is LeadTypeRule => Boolean(value));
}

function normalizeLeadText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
}

const LEAD_KEYWORD_HINTS: Record<string, string[]> = {
  "primera visita": ["primera visita", "primera cita", "quiero cita", "agendar", "marcar cita"],
  "bono sesiones": ["bono", "pack", "sesiones", "5 sesiones", "10 sesiones"],
  premium: ["premium", "tratamiento completo", "tratamiento avanzado"],
};

const GENERIC_INQUIRY_HINTS = [
  "precio",
  "precios",
  "coste",
  "costo",
  "tarifa",
  "tarifas",
  "disponibilidad",
  "horario",
  "horarios",
  "informacion",
  "info",
  "cita",
  "reservar",
  "reserva",
  "semana",
];

export function classifyLeadFromMessage(message: string, leadTypes: LeadTypeRule[]): ClassifiedLead {
  const text = normalizeLeadText(message);

  if (!text || leadTypes.length === 0) {
    return { leadType: null, estimatedValue: 0 };
  }

  let bestMatch: ClassifiedLead | null = null;
  let bestScore = 0;

  for (const leadType of leadTypes) {
    const normalizedName = normalizeLeadText(leadType.name);
    if (!normalizedName) continue;

    const directTokens = normalizedName
      .split(/\s+/)
      .filter(Boolean)
      .filter((token) => token.length > 2);
    const hints = LEAD_KEYWORD_HINTS[normalizedName] ?? [];

    let score = 0;

    if (text.includes(normalizedName)) {
      score += 5;
    }

    for (const token of directTokens) {
      if (text.includes(token)) {
        score += 2;
      }
    }

    for (const hint of hints) {
      if (text.includes(normalizeLeadText(hint))) {
        score += 3;
      }
    }

    if (score === 0) {
      const hasGenericInquiry = GENERIC_INQUIRY_HINTS.some((hint) => text.includes(hint));
      const isBroadInquiryType =
        normalizedName.includes("visita") ||
        normalizedName.includes("consulta") ||
        normalizedName.includes("cita") ||
        normalizedName.includes("tratamiento");

      if (hasGenericInquiry && isBroadInquiryType) {
        score += 1;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = {
        leadType: leadType.name,
        estimatedValue: Number.isFinite(leadType.estimatedValue) ? leadType.estimatedValue : 0,
      };
    }
  }

  if (bestMatch && bestScore > 0) {
    return bestMatch;
  }

  return { leadType: null, estimatedValue: 0 };
}
