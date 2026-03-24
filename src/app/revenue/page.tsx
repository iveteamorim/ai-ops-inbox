"use client";

import { useEffect, useMemo, useState } from "react";
import { AppNav } from "@/components/AppNav";
import { DemoTour } from "@/components/DemoTour";
import { useI18n } from "@/components/i18n/LanguageProvider";
import { detectBrowserCurrency, type Currency } from "@/lib/i18n/currency";

type RevenueFilter = "Todos" | "En riesgo" | "Perdidos" | "Ganados";

type Opportunity = {
  client: string;
  value: string;
  expected: string;
  status: "Nuevo" | "En conversación" | "Sin respuesta" | "Perdido";
  last: string;
};

export default function RevenuePage() {
  const { t } = useI18n();
  const [currency, setCurrency] = useState<Currency>("EUR");
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<RevenueFilter>("Todos");

  const currencySymbol = currency === "BRL" ? "R$" : "€";
  const money = {
    monthPotential: currency === "BRL" ? `${currencySymbol} 48.000` : `${currencySymbol} 9.600`,
    atRisk: currency === "BRL" ? `${currencySymbol} 4.800` : `${currencySymbol} 960`,
    lostEstimated: currency === "BRL" ? `${currencySymbol} 10.500` : `${currencySymbol} 2.100`,
  };

  const opportunities = useMemo<Opportunity[]>(
    () =>
      currency === "BRL"
        ? [
            { client: "Maria", value: "R$600", expected: "R$360", status: "Nuevo", last: "3h" },
            { client: "Joao", value: "R$1200", expected: "R$720", status: "En conversación", last: "1d" },
            { client: "Ana", value: "R$450", expected: "R$180", status: "Sin respuesta", last: "2d" },
            { client: "Pedro", value: "R$900", expected: "R$0", status: "Perdido", last: "4d" },
          ]
        : [
            { client: "Maria", value: "€120", expected: "€72", status: "Nuevo", last: "3h" },
            { client: "Joao", value: "€240", expected: "€144", status: "En conversación", last: "1d" },
            { client: "Ana", value: "€90", expected: "€36", status: "Sin respuesta", last: "2d" },
            { client: "Pedro", value: "€180", expected: "€0", status: "Perdido", last: "4d" },
          ],
    [currency],
  );

  const statusLabel = {
    Nuevo: t("inbox_filter_new"),
    "En conversación": t("inbox_filter_in_progress"),
    "Sin respuesta": t("inbox_filter_no_reply"),
    Perdido: t("inbox_filter_lost"),
  } as const;

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 700);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const stored = window.localStorage.getItem("pricing_currency");
    if (stored === "BRL" || stored === "EUR") {
      setCurrency(stored);
      return;
    }
    setCurrency(detectBrowserCurrency());
  }, []);

  const filtered = useMemo(() => {
    if (filter === "Todos") return opportunities;
    if (filter === "En riesgo") return opportunities.filter((item) => item.status === "Sin respuesta" || item.status === "Nuevo");
    if (filter === "Perdidos") return opportunities.filter((item) => item.status === "Perdido");
    return [];
  }, [filter, opportunities]);

  const filterItems: { key: RevenueFilter; label: string }[] = [
    { key: "Todos", label: t("revenue_filter_all") },
    { key: "En riesgo", label: t("revenue_filter_risk") },
    { key: "Perdidos", label: t("revenue_filter_lost") },
    { key: "Ganados", label: t("revenue_filter_won") },
  ];

  return (
    <section className="page">
      <AppNav />
      <DemoTour title={t("revenue_tour_title")} steps={[t("revenue_at_risk"), t("revenue_expected"), t("revenue_filter_risk")]} storageKey="tour-revenue" />

      <header className="header">
        <div>
          <h1 className="title">{t("revenue_title")}</h1>
          <p className="subtitle">{t("revenue_subtitle")}</p>
        </div>
      </header>

      <div className="grid cols-3">
        <article className="card"><p className="label">{t("revenue_month_potential")}</p><p className="kpi">{money.monthPotential}</p></article>
        <article className="card"><p className="label">{t("revenue_at_risk")}</p><p className="kpi warn">{money.atRisk}</p></article>
        <article className="card"><p className="label">{t("revenue_lost_estimated")}</p><p className="kpi warn">{money.lostEstimated}</p></article>
      </div>

      <article className="card" style={{ marginTop: 12 }}>
        <p className="warn">⚠ {t("revenue_alert")}</p>
      </article>

      <div className="filter-row" style={{ marginTop: 12 }}>
        {filterItems.map((item) => (
          <button key={item.key} className={`mini-button ${filter === item.key ? "is-active" : ""}`} type="button" onClick={() => setFilter(item.key)}>
            {item.label}
          </button>
        ))}
      </div>

      <article className="card" style={{ marginTop: 12 }}>
        {loading ? (
          <div className="skeleton-list"><div className="skeleton-line" /><div className="skeleton-line" /><div className="skeleton-line" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <h3>{t("revenue_empty_title")}</h3>
            <p>{t("revenue_empty_text")}</p>
            <button className="mini-button" type="button" onClick={() => setFilter("Todos")}>{t("revenue_view_pipeline")}</button>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr><th>{t("revenue_client")}</th><th>{t("revenue_estimated")}</th><th>{t("revenue_expected")}</th><th>{t("inbox_status")}</th><th>{t("revenue_last_contact")}</th></tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.client}><td>{o.client}</td><td>{o.value}</td><td>{o.expected}</td><td>{statusLabel[o.status]}</td><td>{o.last}</td></tr>
              ))}
            </tbody>
          </table>
        )}
      </article>
    </section>
  );
}
