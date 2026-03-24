"use client";

import { AppNav } from "@/components/AppNav";
import { useI18n } from "@/components/i18n/LanguageProvider";

export default function SettingsPage() {
  const { t } = useI18n();

  return (
    <section className="page">
      <AppNav />
      <header className="header">
        <div>
          <h1 className="title">{t("settings_title")}</h1>
          <p className="subtitle">{t("settings_subtitle")}</p>
        </div>
      </header>

      <div className="grid cols-3">
        <article className="card">
          <p className="label">{t("settings_channels")}</p>
          <div className="preview-row">
            <span>WhatsApp</span>
            <span className="badge status-no-response">{t("settings_disconnected")}</span>
          </div>
          <div className="preview-row">
            <span>Email</span>
            <span className="badge status-no-response">{t("settings_disconnected")}</span>
          </div>
          <div className="preview-row">
            <span>Formulario web</span>
            <span className="badge status-active">{t("settings_active")}</span>
          </div>
        </article>

        <article className="card">
          <p className="label">{t("settings_users")}</p>
          <div className="preview-row">
            <span>Ana (Admin)</span>
            <span className="badge status-active">{t("settings_active")}</span>
          </div>
          <div className="preview-row">
            <span>Carlos (Agente)</span>
            <span className="badge status-active">{t("settings_active")}</span>
          </div>
          <div className="preview-row">
            <span>{t("settings_invite_user")}</span>
            <span>+</span>
          </div>
        </article>

        <article className="card">
          <p className="label">{t("settings_ai_revenue")}</p>
          <div className="preview-row">
            <span>{t("settings_ai_suggestions")}</span>
            <span className="badge status-active">{t("settings_active")}</span>
          </div>
          <div className="preview-row">
            <span>{t("settings_lead_score")}</span>
            <span className="badge status-active">{t("settings_active")}</span>
          </div>
          <div className="preview-row">
            <span>{t("settings_no_reply_rule")}</span>
            <span>{t("settings_two_hours")}</span>
          </div>
        </article>
      </div>
    </section>
  );
}
