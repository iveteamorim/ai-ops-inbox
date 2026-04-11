"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Props = {
  conversationId: string;
  currentStatus: "new" | "active" | "no_response" | "won" | "lost";
  currentUnit: string | null;
  unitOptions: string[];
  labels: {
    status: string;
    unit: string;
    noUnit: string;
    save: string;
    saving: string;
    new: string;
    active: string;
    noResponse: string;
    won: string;
    lost: string;
    error: string;
  };
};

export function InboxRowActions({
  conversationId,
  currentStatus,
  currentUnit,
  unitOptions,
  labels,
}: Props) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [unit, setUnit] = useState(currentUnit ?? "");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function save() {
    setError(null);
    startTransition(async () => {
      const response = await fetch("/api/conversations/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          status,
          unit: unit || null,
        }),
      });

      const payload = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!response.ok || !payload?.ok) {
        setError(payload?.error ?? labels.error);
        return;
      }

      router.refresh();
    });
  }

  return (
    <div className="row-actions">
      <label className="sr-only" htmlFor={`status-${conversationId}`}>
        {labels.status}
      </label>
      <select
        id={`status-${conversationId}`}
        className="input row-select"
        value={status}
        onChange={(event) => setStatus(event.target.value as Props["currentStatus"])}
      >
        <option value="new">{labels.new}</option>
        <option value="active">{labels.active}</option>
        <option value="no_response">{labels.noResponse}</option>
        <option value="won">{labels.won}</option>
        <option value="lost">{labels.lost}</option>
      </select>

      <label className="sr-only" htmlFor={`unit-${conversationId}`}>
        {labels.unit}
      </label>
      <select
        id={`unit-${conversationId}`}
        className="input row-select"
        value={unit}
        onChange={(event) => setUnit(event.target.value)}
      >
        <option value="">{labels.noUnit}</option>
        {unitOptions.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>

      <button className="mini-button" type="button" disabled={isPending} onClick={save}>
        {isPending ? labels.saving : labels.save}
      </button>
      {error ? <span className="note">{error}</span> : null}
    </div>
  );
}
