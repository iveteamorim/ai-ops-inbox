"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppNav } from "@/components/AppNav";
import { DemoTour } from "@/components/DemoTour";
import { useI18n } from "@/components/i18n/LanguageProvider";
import { detectBrowserCurrency, type Currency } from "@/lib/i18n/currency";

type LeadStatus = "Nuevo" | "En conversación" | "Sin respuesta" | "Perdido";
type LeadScore = "Alto" | "Medio" | "Bajo";
type StatusFilter = "Todos" | LeadStatus;

type Row = {
  id: string;
  name: string;
  last: string;
  channel: string;
  status: LeadStatus;
  score: LeadScore;
  age: string;
  assignedTo: string;
};

const initialRows: Row[] = [
  { id: "maria", name: "Maria", last: "Treatment price?", channel: "WhatsApp", status: "Nuevo", score: "Alto", age: "5 min", assignedTo: "Ana" },
  { id: "joao", name: "Joao", last: "Any slots tomorrow?", channel: "WhatsApp", status: "En conversación", score: "Medio", age: "40 min", assignedTo: "Carlos" },
  { id: "ana", name: "Ana", last: "Consultation cost", channel: "Email", status: "Sin respuesta", score: "Alto", age: "2 h", assignedTo: "Unassigned" },
];

const statusOrder: LeadStatus[] = ["Nuevo", "En conversación", "Sin respuesta", "Perdido"];

function statusClass(status: LeadStatus) {
  if (status === "Nuevo") return "status-new";
  if (status === "En conversación") return "status-active";
  if (status === "Sin respuesta") return "status-no-response";
  return "status-lost";
}

function scoreClass(score: LeadScore) {
  if (score === "Alto") return "score-high";
  if (score === "Medio") return "score-medium";
  return "score-low";
}

export default function InboxPage() {
  const { t, lang } = useI18n();
  const [currency, setCurrency] = useState<Currency>("EUR");
  const [rows, setRows] = useState<Row[]>(initialRows);
  const [followupsSent, setFollowupsSent] = useState<Record<string, boolean>>({});
  const [filter, setFilter] = useState<StatusFilter>("Todos");
  const [loading, setLoading] = useState(true);

  const statusLabel = {
    Nuevo: t("inbox_filter_new"),
    "En conversación": t("inbox_filter_in_progress"),
    "Sin respuesta": t("inbox_filter_no_reply"),
    Perdido: t("inbox_filter_lost"),
  } as const;

  const scoreWord = {
    es: { Alto: "Alto", Medio: "Medio", Bajo: "Bajo" },
    pt: { Alto: "Alto", Medio: "Médio", Bajo: "Baixo" },
    en: { Alto: "High", Medio: "Medium", Bajo: "Low" },
  }[lang];

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 650);
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

  function formatMoney(value: number) {
    return new Intl.NumberFormat(lang, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  }

  const leadValues = useMemo(() => {
    if (currency === "BRL") {
      return {
        maria: { potential: 600, recovered: 0 },
        joao: { potential: 1200, recovered: 720 },
        ana: { potential: 450, recovered: 0 },
      } as const;
    }
    return {
      maria: { potential: 120, recovered: 0 },
      joao: { potential: 240, recovered: 144 },
      ana: { potential: 90, recovered: 0 },
    } as const;
  }, [currency]);

  const leadsAtRisk = useMemo(
    () => rows.filter((r) => r.status === "Sin respuesta" || r.status === "Nuevo").length,
    [rows],
  );

  const riskAmountNow = useMemo(
    () =>
      rows
        .filter((r) => r.status === "Sin respuesta" || r.status === "Nuevo")
        .reduce((sum, row) => {
          const value = leadValues[row.id as keyof typeof leadValues];
          return sum + (value ? value.potential - value.recovered : 0);
        }, 0),
    [rows, leadValues],
  );

  const lostToday = useMemo(() => {
    const fallback = currency === "BRL" ? 320 : 64;
    const computed = rows
      .filter((r) => r.status === "Perdido")
      .reduce((sum, row) => {
        const value = leadValues[row.id as keyof typeof leadValues];
        return sum + (value ? value.potential : 0);
      }, 0);
    return computed || fallback;
  }, [rows, leadValues, currency]);

  const visibleRows = useMemo(() => {
    if (filter === "Todos") return rows;
    return rows.filter((row) => row.status === filter);
  }, [rows, filter]);

  function cycleStatus(id: string) {
    setRows((prev) => prev.map((row) => {
      if (row.id !== id) return row;
      const index = statusOrder.indexOf(row.status);
      const next = statusOrder[(index + 1) % statusOrder.length];
      return { ...row, status: next };
    }));
  }

  function markLost(id: string) {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, status: "Perdido" } : row)));
  }

  function assignAgent(id: string) {
    setRows((prev) => prev.map((row) => {
      if (row.id !== id) return row;
      const nextAgent = row.assignedTo === "Ana" ? "Carlos" : "Ana";
      return { ...row, assignedTo: nextAgent };
    }));
  }

  function sendFollowup(id: string) {
    setFollowupsSent((prev) => ({ ...prev, [id]: true }));
    setRows((prev) => prev.map((row) => row.id === id ? { ...row, status: "En conversación", last: t("inbox_followup_sent") } : row));
  }

  const filterItems: { key: StatusFilter; label: string }[] = [
    { key: "Todos", label: t("inbox_filter_all") },
    { key: "Nuevo", label: t("inbox_filter_new") },
    { key: "En conversación", label: t("inbox_filter_in_progress") },
    { key: "Sin respuesta", label: t("inbox_filter_no_reply") },
    { key: "Perdido", label: t("inbox_filter_lost") },
  ];

  return (
    <section className="page">
      <AppNav />
      <DemoTour title={t("inbox_tour_title")} steps={[t("inbox_filter_no_reply"), t("inbox_reply"), t("inbox_change_status")]} storageKey="tour-inbox" />

      <header className="header">
        <div>
          <h1 className="title">{t("inbox_title")}</h1>
          <p className="subtitle">{t("inbox_subtitle")}</p>
        </div>
      </header>

      <article className="card" style={{ marginBottom: 12 }}>
        <p className="warn" style={{ marginBottom: 6 }}>
          ⚠ {formatMoney(riskAmountNow)} {t("inbox_risk_money_now")}
        </p>
        <p className="subtitle" style={{ margin: 0 }}>
          {leadsAtRisk} {t("inbox_risk_line")}
        </p>
        <p className="subtitle" style={{ marginTop: 6 }}>
          {t("inbox_lost_today_prefix")} {formatMoney(lostToday)} {t("inbox_lost_today_suffix")}
        </p>
      </article>

      <div className="filter-row" style={{ marginBottom: 12 }}>
        {filterItems.map((item) => (
          <button key={item.key} className={`mini-button ${filter === item.key ? "is-active" : ""}`} type="button" onClick={() => setFilter(item.key)}>
            {item.label}
          </button>
        ))}
      </div>

      <article className="card">
        {loading ? (
          <div className="skeleton-list"><div className="skeleton-line" /><div className="skeleton-line" /><div className="skeleton-line" /><div className="skeleton-line" /></div>
        ) : visibleRows.length === 0 ? (
          <div className="empty-state">
            <h3>{t("inbox_empty_title")}</h3>
            <p>{t("inbox_empty_text")}</p>
            <button className="mini-button" type="button" onClick={() => setFilter("Todos")}>{t("inbox_view_all")}</button>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>{t("inbox_client")}</th><th>{t("inbox_last_msg")}</th><th>{t("inbox_channel")}</th><th>{t("inbox_status")}</th><th>{t("inbox_score")}</th><th>{t("inbox_assigned")}</th><th>{t("inbox_value")}</th><th>{t("inbox_actions")}</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => (
                <tr key={row.id}>
                  <td><Link href={`/conversation/${row.id}`}>{row.name}</Link></td>
                  <td>{row.last}</td><td>{row.channel}</td>
                  <td><span className={`badge ${statusClass(row.status)}`}>{statusLabel[row.status]}</span></td>
                  <td><span className={`badge ${scoreClass(row.score)}`}>{row.score === "Alto" ? `🟢 ${scoreWord.Alto}` : row.score === "Medio" ? `🟡 ${scoreWord.Medio}` : `🔴 ${scoreWord.Bajo}`}</span></td>
                  <td>{row.assignedTo}</td>
                  <td>
                    {(() => {
                      const value = leadValues[row.id as keyof typeof leadValues];
                      const potential = value ? value.potential : 0;
                      const recovered = value ? value.recovered : 0;
                      return (
                        <span>
                          {formatMoney(potential)} {t("inbox_value_potential")} | {formatMoney(recovered)} {t("inbox_value_recovered")}
                        </span>
                      );
                    })()}
                    <div className="label" style={{ marginTop: 4, marginBottom: 0, textTransform: "none" }}>{row.age}</div>
                  </td>
                  <td>
                    <div className="actions">
                      <Link className="mini-button" href={`/conversation/${row.id}`}>
                        {(() => {
                          const value = leadValues[row.id as keyof typeof leadValues];
                          const recoverable = value ? value.potential - value.recovered : 0;
                          return `${t("inbox_reply")} -> ${t("inbox_recover_prefix")} ${formatMoney(recoverable)}`;
                        })()}
                      </Link>
                      <button className="mini-button" type="button" onClick={() => cycleStatus(row.id)}>{t("inbox_change_status")}</button>
                      <button className="mini-button" type="button" onClick={() => assignAgent(row.id)}>{t("inbox_assign_agent")}</button>
                      <button className="mini-button mini-danger" type="button" onClick={() => markLost(row.id)}>{t("inbox_mark_lost")}</button>
                      {row.status === "Sin respuesta" && (
                        <button className="mini-button mini-warn" type="button" onClick={() => sendFollowup(row.id)}>
                          {followupsSent[row.id] ? t("inbox_followup_sent") : t("inbox_send_followup")}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </article>
    </section>
  );
}
