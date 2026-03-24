"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { AppNav } from "@/components/AppNav";
import { useI18n } from "@/components/i18n/LanguageProvider";
import { detectBrowserCurrency, type Currency } from "@/lib/i18n/currency";

type LeadStatus = "Nuevo" | "En conversación" | "Sin respuesta" | "Perdido";

type ChatMessage = {
  id: number;
  sender: "Cliente" | "Agente";
  text: string;
  time: string;
};

const statusOrder: LeadStatus[] = ["Nuevo", "En conversación", "Sin respuesta", "Perdido"];

function statusClass(status: LeadStatus) {
  if (status === "Nuevo") return "status-new";
  if (status === "En conversación") return "status-active";
  if (status === "Sin respuesta") return "status-no-response";
  return "status-lost";
}

export default function ConversationPage() {
  const { t, lang } = useI18n();
  const [currency, setCurrency] = useState<Currency>("EUR");
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "lead";

  const [status, setStatus] = useState<LeadStatus>("Nuevo");
  const [agent, setAgent] = useState("Ana");
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 1, sender: "Cliente", text: "Hello, laser treatment price?", time: "09:12" },
    { id: 2, sender: "Agente", text: "Sure. I can share pricing and availability.", time: "09:14" },
  ]);

  const statusLabel = {
    Nuevo: t("inbox_filter_new"),
    "En conversación": t("inbox_filter_in_progress"),
    "Sin respuesta": t("inbox_filter_no_reply"),
    Perdido: t("inbox_filter_lost"),
  } as const;

  const scoreWord = {
    es: "Alto",
    pt: "Alto",
    en: "High",
  }[lang];

  const aiSuggestion = useMemo(() => {
    if (lang === "pt") return "Quer agendar para esta semana? Tenho horários hoje.";
    if (lang === "en") return "Would you like to book this week? I have slots today.";
    return "¿Te gustaría agendar para esta semana? Tengo horarios disponibles hoy.";
  }, [lang]);

  const senderLabel = {
    Cliente: t("conversation_sender_client"),
    Agente: t("conversation_sender_agent"),
  } as const;

  const estimatedValue = currency === "BRL" ? "R$600" : "€120";
  const fastReplyGain = estimatedValue;
  const conversionLikelihood =
    lang === "pt"
      ? "Alta (estimativa IA)"
      : lang === "en"
        ? "High (AI estimate)"
        : "Alta (estimación IA)";

  useEffect(() => {
    const stored = window.localStorage.getItem("pricing_currency");
    if (stored === "BRL" || stored === "EUR") {
      setCurrency(stored);
      return;
    }
    setCurrency(detectBrowserCurrency());
  }, []);

  function cycleStatus() {
    const index = statusOrder.indexOf(status);
    setStatus(statusOrder[(index + 1) % statusOrder.length]);
  }

  function sendReply() {
    const text = draft.trim();
    if (!text) return;

    setMessages((prev) => [...prev, { id: prev.length + 1, sender: "Agente", text, time: "now" }]);
    setDraft("");
    setStatus("En conversación");
  }

  function applySuggestion() {
    setDraft(aiSuggestion);
  }

  return (
    <section className="page">
      <AppNav />
      <header className="header">
        <div>
          <h1 className="title">{t("conversation_title")}: {id}</h1>
          <p className="subtitle">{t("conversation_subtitle")}</p>
        </div>
      </header>

      <div className="grid cols-2">
        <article className="card">
          <p className="label">{t("conversation_messages")}</p>
          <div className="chat-list">
            {messages.map((message) => (
              <div key={message.id} className={`chat-bubble ${message.sender === "Agente" ? "chat-agent" : "chat-client"}`}>
                <p className="chat-meta">{senderLabel[message.sender]} · {message.time}</p>
                <p className="chat-text">{message.text}</p>
              </div>
            ))}
          </div>

          <div className="composer">
            <textarea className="input" rows={3} placeholder={t("conversation_placeholder")} value={draft} onChange={(e) => setDraft(e.target.value)} />
            <p className="subtitle" style={{ marginTop: 0 }}>
              💰 {t("conversation_ai_conversion")}: {conversionLikelihood}
            </p>
            <p className="subtitle" style={{ marginTop: 0 }}>
              +{fastReplyGain} {t("conversation_fast_reply_gain")}
            </p>
            <div className="actions">
              <button className="mini-button" type="button" onClick={applySuggestion}>{t("conversation_use_ai")}</button>
              <button className="button" type="button" onClick={sendReply}>
                {t("inbox_reply")} - {t("inbox_recover_prefix")} {estimatedValue}
              </button>
            </div>
          </div>
        </article>

        <aside className="card">
          <p className="label">{t("conversation_lead_panel")}</p>
          <p><strong>{t("inbox_status")}:</strong> <span className={`badge ${statusClass(status)}`}>{statusLabel[status]}</span></p>
          <p><strong>{t("inbox_score")}:</strong> <span className="badge score-high">🟢 {scoreWord}</span></p>
          <p><strong>{t("revenue_estimated")}:</strong> {estimatedValue}</p>
          <p><strong>{t("inbox_assigned")}:</strong> {agent}</p>
          <p><strong>{t("conversation_ai_label")}:</strong> &ldquo;{aiSuggestion}&rdquo;</p>
          <div className="actions">
            <button className="mini-button" type="button" onClick={cycleStatus}>{t("inbox_change_status")}</button>
            <button className="mini-button" type="button" onClick={() => setAgent((prev) => (prev === "Ana" ? "Carlos" : "Ana"))}>{t("inbox_assign_agent")}</button>
            <button className="mini-button mini-danger" type="button" onClick={() => setStatus("Perdido")}>{t("inbox_mark_lost")}</button>
          </div>
        </aside>
      </div>
    </section>
  );
}
