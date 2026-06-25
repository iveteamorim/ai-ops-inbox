export type Currency = "BRL" | "EUR";

const EURO_REGIONS = new Set([
  "AT",
  "BE",
  "BG",
  "CH",
  "CY",
  "CZ",
  "DE",
  "DK",
  "EE",
  "ES",
  "FI",
  "FR",
  "GR",
  "HR",
  "HU",
  "IE",
  "IT",
  "LT",
  "LU",
  "LV",
  "MT",
  "NL",
  "NO",
  "PL",
  "PT",
  "RO",
  "SE",
  "SI",
  "SK",
]);

function extractRegion(locale?: string | null): string | null {
  if (!locale) return null;
  const parts = locale.split("-");
  if (parts.length < 2) return null;
  return parts[1]?.toUpperCase() ?? null;
}

function isBrazilTimezone(timeZone?: string | null): boolean {
  if (!timeZone) return false;
  return /America\/(Sao_Paulo|Recife|Fortaleza|Maceio|Manaus|Belem|Campo_Grande|Cuiaba|Porto_Velho|Boa_Vista|Rio_Branco|Noronha)/.test(
    timeZone,
  );
}

export function detectCurrencyFromLocale(
  locale?: string | null,
  timeZone?: string | null,
): Currency {
  const region = extractRegion(locale);

  if (region === "BR") return "BRL";
  if (region && EURO_REGIONS.has(region)) return "EUR";
  if (isBrazilTimezone(timeZone)) return "BRL";

  return "EUR";
}

export function detectBrowserCurrency(): Currency {
  if (typeof window === "undefined") return "EUR";

  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const locales = navigator.languages?.length ? navigator.languages : [navigator.language];

  for (const locale of locales) {
    const result = detectCurrencyFromLocale(locale, timeZone);
    if (result === "BRL") return "BRL";
  }

  return detectCurrencyFromLocale(navigator.language, timeZone);
}

