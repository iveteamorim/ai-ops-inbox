"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { InboxRowActions } from "@/components/InboxRowActions";
import { useI18n } from "@/components/i18n/LanguageProvider";
import { getDecisionType } from "@/lib/conversation-decision";
import type { ConversationView, MessageView } from "@/lib/app-data";

type Props = {
  conversation: ConversationView;
  initialMessages: MessageView[];
  currency: "EUR" | "BRL";
  unitOptions: string[];
};

function formatMoney(lang: string, currency: "EUR" | "BRL", value: number) {
  return new Intl.NumberFormat(lang, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatTime(isoDate: string) {
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function statusClass(status: string) {
  if (status === "new") return "status-new";
  if (status === "active") return "status-active";
  if (status === "won") return "status-won";
  if (status === "no_response") return "status-no-response";
  return "status-lost";
}

function formatChannel(channel: ConversationView["channel"]) {
  if (channel === "whatsapp") return "WhatsApp";
  if (channel === "instagram") return "Instagram";
  if (channel === "email") return "Email";
  return "Form";
}

export function ConversationWorkspace({
  conversation,
  initialMessages,
  currency,
  unitOptions,
}: Props) {
  const router = useRouter();
  const { t, lang } = useI18n();
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [generatingSuggestion, setGeneratingSuggestion] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<"active" | "won" | "lost" | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const aiSuggestion = useMemo(() => {
    const leadType = (conversation.leadType ?? "").toLowerCase();

    if (conversation.estimatedValue === 0 || !conversation.leadType) {
      if (lang === "pt") return "Obrigado por escrever. Pode contar-me um pouco mais sobre o que precisa?";
      if (lang === "en") return "Thanks for reaching out. Can you share a bit more about what you need?";
      return "Gracias por escribir. ¿Me puedes contar un poco más sobre lo que necesitas?";
    }

    if (
      leadType.includes("visita") ||
      leadType.includes("consulta") ||
      leadType.includes("sesión") ||
      leadType.includes("sesion")
    ) {
      if (lang === "pt") return "Posso ajudar com a primeira visita e rever a melhor disponibilidade para si.";
      if (lang === "en") return "I can help with the first visit and check the best availability for you.";
      return "Puedo ayudarte con la primera visita y revisar la mejor disponibilidad para ti.";
    }

    if (lang === "pt") return `Posso ajudar com ${conversation.leadType.toLowerCase()} e indicar o próximo passo.`;
    if (lang === "en") return `I can help with ${conversation.leadType.toLowerCase()} and guide the next step.`;
    return `Puedo ayudarte con ${conversation.leadType.toLowerCase()} y orientarte en el siguiente paso.`;
  }, [conversation.estimatedValue, conversation.leadType, lang]);

  const statusLabel = useMemo(() => {
    if (conversation.status === "new") return t("inbox_filter_new");
    if (conversation.status === "active") return t("inbox_filter_in_progress");
    if (conversation.status === "no_response") return t("inbox_filter_no_reply");
    if (conversation.status === "won") return t("revenue_filter_won");
    return t("inbox_filter_lost");
  }, [conversation.status, t]);

  const decisionType = useMemo(() => getDecisionType(conversation), [conversation]);
  const decisionCopy = useMemo(() => {
    if (decisionType === "recover") {
      return {
        title: "Oportunidad en riesgo",
        body: "El cliente escribió y sigue esperando respuesta. Conviene responder primero.",
      };
    }
    if (decisionType === "complex") {
      return {
        title: "Requiere revisión",
        body: "Este caso está marcado como complejo y merece intervención humana directa.",
      };
    }
    if (decisionType === "new") {
      return {
        title: "Nuevo lead",
        body: "Primer contacto sin respuesta todavía. Revisa intención y siguiente paso.",
      };
    }
    if (decisionType === "won") {
      return {
        title: "Ganado",
        body: "La conversación ya se marcó como recuperada. Úsala como referencia de cierre.",
      };
    }
    if (decisionType === "lost") {
      return {
        title: "Perdido",
        body: "La oportunidad se marcó como perdida. Si el cliente vuelve, se reactivará.",
      };
    }
    return {
      title: "En progreso",
      body: "La conversación sigue activa. Mantén el avance y reduce fricción en el siguiente paso.",
    };
  }, [decisionType]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState !== "visible" || sending) return;
      router.refresh();
    }, 8000);

    return () => {
      window.clearInterval(timer);
    };
  }, [router, sending]);

  async function sendReply(overrideText?: string) {
    const text = (overrideText ?? draft).trim();
    if (!text) return;

    setSending(true);
    setError(null);

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          conversation_id: conversation.id,
          text,
        }),
      });

      const payload = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!response.ok || !payload?.ok) {
        if (payload?.error === "conversation_already_assigned") {
          setError("Otro agente ya ha cogido esta conversación.");
          router.refresh();
          return;
        }
        setError(payload?.error ?? "Failed to send message");
        return;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `local-${Date.now()}`,
          direction: "outbound",
          senderType: "agent",
          text,
          createdAt: new Date().toISOString(),
        },
      ]);
      setDraft(overrideText ? draft : "");
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to send message");
    } finally {
      setSending(false);
    }
  }

  async function updateBusinessStatus(status: "active" | "won" | "lost") {
    setUpdatingStatus(status);
    setError(null);

    try {
      const response = await fetch("/api/conversations/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: conversation.id,
          status,
        }),
      });

      const payload = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!response.ok || !payload?.ok) {
        setError(payload?.error ?? "Could not update conversation.");
        return;
      }

      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not update conversation.");
    } finally {
      setUpdatingStatus(null);
    }
  }

  async function fillDraftWithSuggestion() {
    setGeneratingSuggestion(true);
    setError(null);

    try {
      const response = await fetch("/api/conversations/suggest-reply", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          conversation_id: conversation.id,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; suggestion?: string; error?: string }
        | null;

      if (!response.ok || !payload?.ok || !payload.suggestion?.trim()) {
        setDraft(aiSuggestion);
        textareaRef.current?.focus();
        return;
      }

      setDraft(payload.suggestion.trim());
      textareaRef.current?.focus();
    } catch {
      setDraft(aiSuggestion);
      textareaRef.current?.focus();
    } finally {
      setGeneratingSuggestion(false);
    }
  }

  return (
    <div className="grid cols-2">
      <article className="card">
        <p className="label">{t("conversation_messages")}</p>
        {messages.length === 0 ? (
          <div className="empty-state">
            <h3>No messages yet</h3>
            <p>Inbound and outbound conversation history will appear here.</p>
          </div>
        ) : (
          <div className="chat-list">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`chat-bubble ${message.senderType === "agent" ? "chat-agent" : "chat-client"}`}
              >
                <p className="chat-meta">
                  {message.senderType === "agent" ? t("conversation_sender_agent") : t("conversation_sender_client")} · {formatTime(message.createdAt)}
                </p>
                <p className="chat-text">{message.text}</p>
              </div>
            ))}
          </div>
        )}

        <div className="composer">
          <textarea
            ref={textareaRef}
            className="input"
            rows={3}
            placeholder={t("conversation_placeholder")}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
          <p className="subtitle" style={{ marginTop: 0 }}>
            {t("conversation_ai_label")}: “{aiSuggestion}”
          </p>
          {error ? <p className="warn">{error}</p> : null}
          <div className="actions">
            <button
              className="button"
              type="button"
              onClick={fillDraftWithSuggestion}
              disabled={sending || generatingSuggestion}
            >
              {generatingSuggestion ? "..." : t("conversation_reply_with_ai")}
            </button>
            <button className="mini-button" type="button" onClick={() => sendReply()} disabled={sending || !draft.trim()}>
              {sending ? "..." : t("inbox_reply")}
            </button>
          </div>
        </div>
      </article>

      <aside className="card">
        <p className="label">{t("conversation_lead_panel")}</p>
        <p className="kpi warn" style={{ marginBottom: 6 }}>
          {formatMoney(lang, currency, conversation.estimatedValue)} en juego
        </p>
        <p style={{ marginTop: 0, marginBottom: 12 }}>
          <strong>{conversation.leadType ?? t("inbox_unclassified")}</strong>
        </p>
        <div className="decision-panel">
          <p className="label" style={{ marginBottom: 4 }}>Tipo de caso</p>
          <p style={{ margin: 0, fontWeight: 700 }}>{decisionCopy.title}</p>
          <p className="subtitle" style={{ marginTop: 6 }}>{decisionCopy.body}</p>
        </div>
        <p>
          <strong>{t("inbox_status")}:</strong>{" "}
          <span className={`badge ${statusClass(conversation.status)}`}>{statusLabel}</span>
        </p>
        {conversation.status === "won" ? (
          <p><strong>{t("conversation_recovered")}:</strong> {formatMoney(lang, currency, conversation.expectedValue || conversation.estimatedValue)}</p>
        ) : null}
        <div className="actions" style={{ marginTop: 12 }}>
          <button
            className="mini-button"
            type="button"
            disabled={updatingStatus !== null || conversation.status === "active"}
            onClick={() => updateBusinessStatus("active")}
          >
            {updatingStatus === "active" ? "..." : t("conversation_mark_active")}
          </button>
          <button
            className="button"
            type="button"
            disabled={updatingStatus !== null || conversation.status === "won"}
            onClick={() => updateBusinessStatus("won")}
          >
            {updatingStatus === "won" ? "..." : t("conversation_mark_won")}
          </button>
          <button
            className="mini-button mini-warn"
            type="button"
            disabled={updatingStatus !== null || conversation.status === "lost"}
            onClick={() => updateBusinessStatus("lost")}
          >
            {updatingStatus === "lost" ? "..." : t("conversation_mark_lost")}
          </button>
        </div>
        <details style={{ marginTop: 16 }}>
          <summary style={{ cursor: "pointer", color: "var(--muted)" }}>{t("conversation_details")}</summary>
          <div style={{ marginTop: 12 }}>
            <p><strong>{t("inbox_unit")}:</strong> {conversation.unit ?? t("inbox_no_unit")}</p>
            <p><strong>{t("inbox_assigned")}:</strong> {conversation.assignedTo ?? "Unassigned"}</p>
            <p><strong>{t("inbox_channel")}:</strong> {formatChannel(conversation.channel)}</p>
            {conversation.contactPhone ? <p><strong>Phone:</strong> {conversation.contactPhone}</p> : null}
            <div style={{ marginTop: 16 }}>
              <InboxRowActions
                conversationId={conversation.id}
                currentStatus={conversation.status}
                currentUnit={conversation.unit}
                unitOptions={unitOptions}
                labels={{
                  status: t("inbox_status"),
                  unit: t("inbox_unit"),
                  noUnit: t("inbox_no_unit"),
                  save: t("inbox_change_status"),
                  saving: "...",
                  new: t("inbox_filter_new"),
                  active: t("inbox_filter_in_progress"),
                  noResponse: t("inbox_filter_no_reply"),
                  won: t("revenue_filter_won"),
                  lost: t("inbox_filter_lost"),
                }}
              />
            </div>
          </div>
        </details>
      </aside>
    </div>
  );
}
