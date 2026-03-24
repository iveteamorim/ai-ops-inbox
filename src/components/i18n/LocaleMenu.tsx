"use client";

import { LanguageSwitcher } from "./LanguageSwitcher";
import { useI18n } from "./LanguageProvider";

export function LocaleMenu() {
  const { t } = useI18n();

  return (
    <details className="prefs-menu">
      <summary className="mini-button">{t("preferences_label")}</summary>
      <div className="prefs-panel">
        <p className="label">{t("lang_label")}</p>
        <LanguageSwitcher />
      </div>
    </details>
  );
}

