"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { InboxRowActions } from "@/components/InboxRowActions";
import { useI18n } from "@/components/i18n/LanguageProvider";
import type { ConversationView, MessageView } from "@/lib/app-data";

type Props = {
  conversation: ConversationView;
  initialMessages: MessageView[];
  currency: "EUR" | "BRL";
  team: Array<{ id: string; full_name: string | null; role: string }>;
  unitOptions: string[];
  canAssign: boolean;
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
  team,
  unitOptions,
  canAssign,
}: Props) {
  const router = useRouter();
  const { t, lang } = useI18n();
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<"won" | "lost" | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const aiSuggestion = useMemo(() => {
    if (lang === "pt") return "Posso ajudar a avançar com a reserva hoje?";
    if (lang === "en") return "Can I help you move this booking forward today?";
    return "¿Puedo ayudarte a avanzar esta reserva hoy?";
  }, [lang]);

  const statusLabel = useMemo(() => {
    if (conversation.status === "new") return t("inbox_filter_new");
    if (conversation.status === "active") return t("inbox_filter_in_progress");
    if (conversation.status === "no_response") return t("inbox_filter_no_reply");
    if (conversation.status === "won") return t("revenue_filter_won");
    return t("inbox_filter_lost");
  }, [conversation.status, t]);

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
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to send message");
    } finally {
      setSending(false);
    }
  }

  async function updateBusinessStatus(status: "won" | "lost") {
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
            <button className="button" type="button" onClick={() => sendReply(aiSuggestion)} disabled={sending}>
              {sending ? "..." : t("conversation_reply_with_ai")}
            </button>
            <button
              className="mini-button"
              type="button"
              onClick={() => {
                setDraft((current) => current || aiSuggestion);
                textareaRef.current?.focus();
              }}
            >
              {t("conversation_write_manually")}
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
        <p>
          <strong>{t("inbox_status")}:</strong>{" "}
          <span className={`badge ${statusClass(conversation.status)}`}>{statusLabel}</span>
        </p>
        {conversation.status === "won" ? (
          <p><strong>{t("conversation_recovered")}:</strong> {formatMoney(lang, currency, conversation.expectedValue || conversation.estimatedValue)}</p>
        ) : null}
        <div className="actions" style={{ marginTop: 12 }}>
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
                currentAssignedToId={conversation.assignedToId}
                currentUnit={conversation.unit}
                unitOptions={unitOptions}
                team={team}
                canAssign={canAssign}
                labels={{
                  status: t("inbox_status"),
                  assignee: t("inbox_assigned"),
                  unit: t("inbox_unit"),
                  noUnit: t("inbox_no_unit"),
                  save: t("inbox_change_status"),
                  saving: "...",
                  unassigned: "Unassigned",
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
