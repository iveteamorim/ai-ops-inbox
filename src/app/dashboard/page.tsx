"use client";

import { useEffect, useState } from "react";
import { AppNav } from "@/components/AppNav";
import { useI18n } from "@/components/i18n/LanguageProvider";
import { detectBrowserCurrency, type Currency } from "@/lib/i18n/currency";

export default function DashboardPage() {
  const { t } = useI18n();
  const [currency, setCurrency] = useState<Currency>("EUR");
  const currencySymbol = currency === "BRL" ? "R$" : "€";
  const revenueAtRisk = currency === "BRL" ? `${currencySymbol} 4.800` : `${currencySymbol} 960`;
  const queue = [
    { lead: "Maria", risk: t("dashboard_risk_high"), value: currency === "BRL" ? "R$600" : "€120", action: t("dashboard_action_reply_now") },
    { lead: "Ana", risk: t("dashboard_risk_high"), value: currency === "BRL" ? "R$450" : "€90", action: t("dashboard_action_followup") },
    { lead: "Joao", risk: t("dashboard_risk_medium"), value: currency === "BRL" ? "R$1200" : "€240", action: t("dashboard_action_schedule") },
  ];

  useEffect(() => {
    const stored = window.localStorage.getItem("pricing_currency");
    if (stored === "BRL" || stored === "EUR") {
      setCurrency(stored);
      return;
    }
    setCurrency(detectBrowserCurrency());
  }, []);

  return (
    <section className="page">
      <AppNav />
      <header className="header">
        <div>
          <h1 className="title">{t("dashboard_title")}</h1>
          <p className="subtitle">{t("dashboard_subtitle")}</p>
        </div>
      </header>

      <div className="grid cols-3" style={{ marginBottom: 12 }}>
        <article className="card"><p className="label">{t("dashboard_leads_today")}</p><p className="kpi">21</p></article>
        <article className="card"><p className="label">{t("dashboard_no_reply")}</p><p className="kpi warn">6</p></article>
        <article className="card"><p className="label">{t("dashboard_revenue_risk")}</p><p className="kpi warn">{revenueAtRisk}</p></article>
      </div>

      <div className="grid cols-2">
        <article className="card">
          <p className="label">{t("dashboard_priority_queue")}</p>
          <table className="table">
            <thead>
              <tr><th>{t("dashboard_lead")}</th><th>{t("dashboard_risk")}</th><th>{t("dashboard_value")}</th><th>{t("dashboard_action")}</th></tr>
            </thead>
            <tbody>
              {queue.map((item) => (
                <tr key={item.lead}><td>{item.lead}</td><td>{item.risk}</td><td>{item.value}</td><td>{item.action}</td></tr>
              ))}
            </tbody>
          </table>
        </article>

        <article className="card">
          <p className="label">{t("dashboard_recent_activity")}</p>
          <div className="preview-row"><span>{t("dashboard_evt_new_lead")}</span><span>{t("dashboard_time_5m")}</span></div>
          <div className="preview-row"><span>{t("dashboard_evt_followup_sent")}</span><span>{t("dashboard_time_12m")}</span></div>
          <div className="preview-row"><span>{t("dashboard_evt_lead_moved")}</span><span>{t("dashboard_time_25m")}</span></div>
          <div className="preview-row"><span>{t("dashboard_evt_ai_used")}</span><span>{t("dashboard_time_32m")}</span></div>
        </article>
      </div>
    </section>
  );
}
