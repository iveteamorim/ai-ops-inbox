"use client";

import { useState, useTransition } from "react";

type Props = {
  labels: {
    title: string;
    help: string;
    category: string;
    message: string;
    submit: string;
    submitting: string;
    success: string;
    error: string;
    bug: string;
    feedback: string;
    featureRequest: string;
  };
};

export function PilotFeedbackForm({ labels }: Props) {
  const [category, setCategory] = useState<"bug" | "feedback" | "feature_request">("feedback");
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit() {
    const trimmed = message.trim();
    if (!trimmed) return;

    setResult(null);
    startTransition(async () => {
      const response = await fetch("/api/pilot-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          message: trimmed,
          pagePath: window.location.pathname,
        }),
      });

      const payload = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!response.ok || !payload?.ok) {
        setResult({ ok: false, text: labels.error });
        return;
      }

      setMessage("");
      setResult({ ok: true, text: labels.success });
    });
  }

  return (
    <article className="card" style={{ marginTop: 12 }}>
      <p className="label">{labels.title}</p>
      <p className="subtitle" style={{ marginTop: 0 }}>{labels.help}</p>

      <label className="sr-only" htmlFor="pilot-feedback-category">
        {labels.category}
      </label>
      <select
        id="pilot-feedback-category"
        className="input"
        value={category}
        onChange={(event) => setCategory(event.target.value as "bug" | "feedback" | "feature_request")}
      >
        <option value="bug">{labels.bug}</option>
        <option value="feedback">{labels.feedback}</option>
        <option value="feature_request">{labels.featureRequest}</option>
      </select>

      <label className="sr-only" htmlFor="pilot-feedback-message">
        {labels.message}
      </label>
      <textarea
        id="pilot-feedback-message"
        className="input"
        rows={4}
        placeholder={labels.message}
        value={message}
        onChange={(event) => setMessage(event.target.value)}
      />

      <div className="actions">
        <button className="button" type="button" disabled={isPending || !message.trim()} onClick={submit}>
          {isPending ? labels.submitting : labels.submit}
        </button>
      </div>

      {result ? <p className={result.ok ? "subtitle" : "warn"} style={{ marginBottom: 0 }}>{result.text}</p> : null}
    </article>
  );
}
