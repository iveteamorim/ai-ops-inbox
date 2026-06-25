export const LANG_COOKIE = "lang";
export const SUPPORTED_LANGUAGES = ["es", "pt", "en"] as const;

export type Lang = (typeof SUPPORTED_LANGUAGES)[number];

export function isSupportedLang(value: string | undefined | null): value is Lang {
  if (!value) return false;
  return SUPPORTED_LANGUAGES.includes(value as Lang);
}

export function normalizeLang(value: string | undefined | null): Lang {
  if (!value) return "en";
  const base = value.toLowerCase().split("-")[0];
  return isSupportedLang(base) ? base : "en";
}

export function detectLangFromHeader(header: string | null): Lang {
  if (!header) return "en";

  const candidates = header
    .split(",")
    .map((entry) => entry.trim().split(";")[0])
    .filter(Boolean)
    .map((entry) => normalizeLang(entry));

  return candidates[0] ?? "en";
}

export function resolveLang(cookieValue: string | undefined | null, headerValue: string | null): Lang {
  void headerValue;
  if (cookieValue) {
    return normalizeLang(cookieValue);
  }
  return "en";
}
