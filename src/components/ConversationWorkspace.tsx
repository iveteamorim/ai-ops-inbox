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

function formatRelativeAge(isoDate: string | null, lang: string) {
  if (!isoDate) return "";
  const timestamp = new Date(isoDate).getTime();
  if (Number.isNaN(timestamp)) return "";

  const diffMs = Date.now() - timestamp;
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 60) {
    if (lang === "pt") return `há ${diffMinutes} min`;
    if (lang === "en") return `${diffMinutes} min ago`;
    return `hace ${diffMinutes} min`;
  }

  if (diffHours < 24) {
    if (lang === "pt") return `há ${diffHours} h`;
    if (lang === "en") return `${diffHours}h ago`;
    return `hace ${diffHours} h`;
  }

  if (lang === "pt") return `há ${diffDays} dias`;
  if (lang === "en") return `${diffDays} days ago`;
  return `hace ${diffDays} días`;
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
    if (lang === "pt") {
      if (decisionType === "recover") {
        return { title: "Em risco", body: "O cliente escreveu e continua à espera. Convém responder primeiro." };
      }
      if (decisionType === "complex") {
        return { title: "Requer revisão", body: "Este caso está marcado como complexo e merece intervenção humana direta." };
      }
      if (decisionType === "new") {
        return { title: "Novo lead", body: "Primeiro contacto sem resposta. Revê intenção e próximo passo." };
      }
      if (decisionType === "won") {
        return { title: "Ganho", body: "A conversa já foi marcada como recuperada. Usa-a como referência de fecho." };
      }
      if (decisionType === "lost") {
        return { title: "Perdido", body: "A oportunidade foi marcada como perdida. Se o cliente voltar, será reativada." };
      }
      return { title: "Em conversa", body: "Há interesse, mas falta avançar para o próximo passo antes de perder momentum." };
    }

    if (lang === "en") {
      if (decisionType === "recover") {
        return { title: "At risk", body: "The lead is waiting for a reply. This should be handled first." };
      }
      if (decisionType === "complex") {
        return { title: "Needs review", body: "This case is marked as complex and needs direct human intervention." };
      }
      if (decisionType === "new") {
        return { title: "New lead", body: "First contact with no reply yet. Review intent and next step." };
      }
      if (decisionType === "won") {
        return { title: "Won", body: "This conversation is already marked as recovered. Use it as a closing reference." };
      }
      if (decisionType === "lost") {
        return { title: "Lost", body: "This opportunity was marked as lost. If the lead comes back, it can be reactivated." };
      }
      return { title: "In conversation", body: "There is interest, but the next step still needs to happen before momentum is lost." };
    }

    if (decisionType === "recover") {
      return { title: "En riesgo", body: "El cliente escribió y sigue esperando respuesta. Conviene responder primero." };
    }
    if (decisionType === "complex") {
      return { title: "Requiere revisión", body: "Este caso está marcado como complejo y merece intervención humana directa." };
    }
    if (decisionType === "new") {
      return { title: "Nuevo lead", body: "Primer contacto sin respuesta todavía. Revisa intención y siguiente paso." };
    }
    if (decisionType === "won") {
      return { title: "Ganado", body: "La conversación ya se marcó como recuperada. Úsala como referencia de cierre." };
    }
    if (decisionType === "lost") {
      return { title: "Perdido", body: "La oportunidad se marcó como perdida. Si el cliente vuelve, se reactivará." };
    }
    return { title: "En conversación", body: "Hay interés, pero falta avanzar al siguiente paso antes de perder momentum." };
  }, [decisionType, lang]);

  const panelCopy = useMemo(() => {
    if (lang === "pt") {
      return {
        currentState: "Estado atual",
        whatNow: "O que fazer agora",
        sendReply: "Responder agora",
        useAi: "Responder com IA",
        moneyInPlayNow: "em jogo agora",
        lastReply: "Última resposta",
        noReplyYet: "Sem resposta ainda",
        riskLow: "Risco baixo de perda",
        riskMedium: "Risco médio de perda",
        riskHigh: "Risco alto de perda",
        unassigned: "Sem responsável",
        phone: "Telefone",
      };
    }

    if (lang === "en") {
      return {
        currentState: "Current state",
        whatNow: "What to do now",
        sendReply: "Reply now",
        useAi: "Reply with AI",
        moneyInPlayNow: "in play right now",
        lastReply: "Last reply",
        noReplyYet: "No reply yet",
        riskLow: "Low churn risk",
        riskMedium: "Medium churn risk",
        riskHigh: "High churn risk",
        unassigned: "Unassigned",
        phone: "Phone",
      };
    }

    return {
      currentState: "Estado actual",
      whatNow: "Qué hacer ahora",
      sendReply: "Responder ahora",
      useAi: "Responder con IA",
      moneyInPlayNow: "en juego ahora mismo",
      lastReply: "Última respuesta",
      noReplyYet: "Sin respuesta todavía",
      riskLow: "Riesgo bajo de pérdida",
      riskMedium: "Riesgo medio de pérdida",
      riskHigh: "Riesgo alto de pérdida",
      unassigned: "Sin asignar",
      phone: "Teléfono",
    };
  }, [lang]);

  const lastReplyAge = formatRelativeAge(conversation.lastOutboundAt ?? conversation.lastMessageAt, lang);
  const riskLabel =
    decisionType === "recover"
      ? panelCopy.riskHigh
      : conversation.status === "new"
        ? panelCopy.riskLow
        : panelCopy.riskMedium;

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
          setError(lang === "en" ? "Another agent already claimed this conversation." : lang === "pt" ? "Outro agente já ficou com esta conversa." : "Otro agente ya ha cogido esta conversación.");
          router.refresh();
          return;
        }
        setError(payload?.error ?? (lang === "en" ? "Failed to send message" : lang === "pt" ? "Não foi possível enviar a mensagem" : "No se pudo enviar el mensaje"));
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
      setError(requestError instanceof Error ? requestError.message : (lang === "en" ? "Failed to send message" : lang === "pt" ? "Não foi possível enviar a mensagem" : "No se pudo enviar el mensaje"));
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
        setError(payload?.error ?? (lang === "en" ? "Could not update conversation." : lang === "pt" ? "Não foi possível atualizar a conversa." : "No se pudo actualizar la conversación."));
        return;
      }

      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : (lang === "en" ? "Could not update conversation." : lang === "pt" ? "Não foi possível atualizar a conversa." : "No se pudo actualizar la conversación."));
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
    <div className="conversation-layout">
      <article className="card conversation-main-card">
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
            className="input conversation-composer-input"
            rows={3}
            placeholder={t("conversation_placeholder")}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
          <div className="conversation-ai-suggestion">
            <p className="conversation-ai-title">{t("conversation_ai_label")}</p>
            <p className="conversation-ai-text">“{aiSuggestion}”</p>
          </div>
          {error ? <p className="warn">{error}</p> : null}
          <div className="actions conversation-composer-actions">
            <button
              className="button"
              type="button"
              onClick={fillDraftWithSuggestion}
              disabled={sending || generatingSuggestion}
            >
              {generatingSuggestion ? "..." : panelCopy.useAi}
            </button>
            <button className="mini-button" type="button" onClick={() => sendReply()} disabled={sending || !draft.trim()}>
              {sending ? "..." : t("inbox_reply")}
            </button>
          </div>
        </div>
      </article>

      <aside className="conversation-side">
        <article className="card conversation-side-card">
          <p className="label">{t("conversation_lead_panel")}</p>

          <div className="conversation-money-card">
            <p className="conversation-money-value">
              💰 {formatMoney(lang, currency, conversation.estimatedValue)} {panelCopy.moneyInPlayNow}
            </p>
            <p className="conversation-money-type">{conversation.leadType ?? t("inbox_unclassified")}</p>
            <p className="conversation-money-meta">⏱ {panelCopy.lastReply} {lastReplyAge || panelCopy.noReplyYet}</p>
            <p className="conversation-money-risk">🔥 {riskLabel}</p>
          </div>

          <div className="conversation-state-card">
            <p className="label">{panelCopy.currentState}</p>
            <p className={`conversation-state-title ${decisionType === "recover" ? "conversation-state-risk" : ""}`.trim()}>
              {decisionCopy.title}
            </p>
            <p className="subtitle conversation-state-body">{decisionCopy.body}</p>
          </div>

          <div className="conversation-side-actions">
            <p className="label">{panelCopy.whatNow}</p>
            <div className="actions conversation-side-actions-row">
              <button className="button" type="button" onClick={() => sendReply()} disabled={sending || !draft.trim()}>
                {sending ? "..." : panelCopy.sendReply}
              </button>
              <button
                className="button conversation-success-button"
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
          </div>

          <div className="conversation-details-card">
            <p className="label">{t("conversation_details")}</p>
            <div className="preview-row">
              <span>{t("inbox_assigned")}</span>
              <span>{conversation.assignedTo ?? panelCopy.unassigned}</span>
            </div>
            <div className="preview-row">
              <span>{t("inbox_channel")}</span>
              <span>{formatChannel(conversation.channel)}</span>
            </div>
            <div className="preview-row">
              <span>{t("inbox_status")}</span>
              <span className={`badge ${statusClass(conversation.status)}`}>{statusLabel}</span>
            </div>
            <div className="preview-row">
              <span>{t("inbox_unit")}</span>
              <span>{conversation.unit ?? t("inbox_no_unit")}</span>
            </div>
            {conversation.contactPhone ? (
              <div className="preview-row">
                <span>{panelCopy.phone}</span>
                <span>{conversation.contactPhone}</span>
              </div>
            ) : null}
            {conversation.status === "won" ? (
              <div className="preview-row">
                <span>{t("conversation_recovered")}</span>
                <span>{formatMoney(lang, currency, conversation.expectedValue || conversation.estimatedValue)}</span>
              </div>
            ) : null}
          </div>

          <details className="conversation-manage-details">
            <summary>{t("conversation_details")}</summary>
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
          </details>
        </article>
      </aside>
    </div>
  );
}
