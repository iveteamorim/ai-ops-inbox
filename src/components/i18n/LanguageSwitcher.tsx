"use client";

import { type Lang, SUPPORTED_LANGUAGES } from "@/lib/i18n/config";
import { useI18n } from "./LanguageProvider";

const labelByLang: Record<Lang, string> = {
  es: "ES",
  pt: "PT",
  en: "EN",
};

export function LanguageSwitcher() {
  const { lang, setLang, t } = useI18n();

  return (
    <div className="lang-switcher" aria-label={t("lang_label")}>
      {SUPPORTED_LANGUAGES.map((code) => (
        <button
          key={code}
          className={`lang-pill ${lang === code ? "is-active" : ""}`}
          type="button"
          onClick={() => setLang(code)}
        >
          {labelByLang[code]}
        </button>
      ))}
    </div>
  );
}
