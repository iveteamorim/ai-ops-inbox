"use client";

import type { Lang } from "@/lib/i18n/config";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useI18n } from "./LanguageProvider";

const labelByLang: Record<Lang, string> = {
  es: "ES",
  pt: "PT",
  en: "EN",
};

export function LocaleMenu() {
  const { lang } = useI18n();

  return (
    <details className="prefs-menu">
      <summary className="mini-button">{labelByLang[lang]}</summary>
      <div className="prefs-panel">
        <LanguageSwitcher />
      </div>
    </details>
  );
}
