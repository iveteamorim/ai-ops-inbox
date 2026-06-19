"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useI18n } from "@/components/i18n/LanguageProvider";
import { getDefaultQuickReplyStarters, type QuickReply, type QuickRepliesView } from "@/lib/quick-replies";

type Props = {
  initialValue: QuickRepliesView;
  labels: {
    title: string;
    help: string;
    replyTitle: string;
    replyKeywords: string;
    replyKeywordsHelp: string;
    replyText: string;
    addReply: string;
    removeReply: string;
    loadExamples: string;
    save: string;
    saving: string;
    success: string;
    error: string;
    empty: string;
  };
};

function createReply(): QuickReply {
  return {
    id: `reply-${Math.random().toString(36).slice(2, 8)}`,
    title: "",
    keywords: "",
    text: "",
  };
}

export function QuickRepliesForm({ initialValue, labels }: Props) {
  const router = useRouter();
  const { lang } = useI18n();
  const [replies, setReplies] = useState<QuickReply[]>(
    initialValue.replies.length > 0 ? initialValue.replies : [],
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function updateReply(id: string, patch: Partial<QuickReply>) {
    setReplies((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  function addReply() {
    setReplies((current) => [...current, createReply()]);
  }

  function removeReply(id: string) {
    setReplies((current) => current.filter((row) => row.id !== id));
  }

  function loadExamples() {
    setReplies(getDefaultQuickReplyStarters(lang).map((row) => ({ ...row })));
  }

  function save() {
    setMessage(null);
    setError(null);

    startTransition(async () => {
      const response = await fetch("/api/quick-replies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quickReplies: replies
            .map((row) => ({
              id: row.id,
              title: row.title.trim(),
              keywords: row.keywords.trim(),
              text: row.text.trim(),
            }))
            .filter((row) => row.title && row.text),
        }),
      });

      const payload = (await response.json().catch(() => null)) as { ok?: boolean } | null;
      if (!response.ok || !payload?.ok) {
        setError(labels.error);
        return;
      }

      setMessage(labels.success);
      router.refresh();
    });
  }

  return (
    <div className="settings-quick-replies">
      <p className="label">{labels.title}</p>
      <p className="subtitle settings-business-help">{labels.help}</p>

      {replies.length === 0 ? (
        <p className="subtitle" style={{ marginBottom: 12 }}>
          {labels.empty}
        </p>
      ) : (
        <div className="settings-quick-replies-list">
          {replies.map((row) => (
            <div key={row.id} className="settings-quick-reply-card">
              <div className="settings-quick-reply-grid">
                <label className="settings-quick-reply-field">
                  <span className="label">{labels.replyTitle}</span>
                  <input
                    className="input"
                    value={row.title}
                    placeholder={labels.replyTitle}
                    onChange={(event) => updateReply(row.id, { title: event.target.value })}
                  />
                </label>
                <label className="settings-quick-reply-field">
                  <span className="label">{labels.replyKeywords}</span>
                  <input
                    className="input"
                    value={row.keywords}
                    placeholder={labels.replyKeywordsHelp}
                    onChange={(event) => updateReply(row.id, { keywords: event.target.value })}
                  />
                </label>
              </div>
              <label className="settings-quick-reply-field">
                <span className="label">{labels.replyText}</span>
                <textarea
                  className="input"
                  rows={3}
                  value={row.text}
                  placeholder={labels.replyText}
                  onChange={(event) => updateReply(row.id, { text: event.target.value })}
                />
              </label>
              <button className="action-link" type="button" onClick={() => removeReply(row.id)}>
                {labels.removeReply}
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="settings-quick-replies-actions">
        <button className="mini-button" type="button" onClick={addReply}>
          {labels.addReply}
        </button>
        {replies.length === 0 ? (
          <button className="mini-button" type="button" onClick={loadExamples}>
            {labels.loadExamples}
          </button>
        ) : null}
      </div>

      {message ? <p className="note settings-business-feedback">{message}</p> : null}
      {error ? <p className="warn settings-business-feedback">{error}</p> : null}

      <div className="actions settings-business-actions">
        <button className="button" type="button" disabled={isPending} onClick={save}>
          {isPending ? labels.saving : labels.save}
        </button>
      </div>
    </div>
  );
}
