"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { BusinessLeadType, BusinessSetupView } from "@/lib/app-data";

type Props = {
  initialValue: BusinessSetupView;
  showInternalTools?: boolean;
  labels: {
    title: string;
    help: string;
    businessName: string;
    leadTypesBlock: string;
    leadTypes: string;
    addLeadType: string;
    leadTypeName: string;
    estimatedValue: string;
    removeLeadType: string;
    save: string;
    saving: string;
    backfill: string;
    backfilling: string;
    backfillSuccess: string;
    reseedDemo: string;
    reseedingDemo: string;
    reseedDemoSuccess: string;
    reseedDemoConfirm: string;
    success: string;
    error: string;
  };
};

type LeadTypeRow = BusinessLeadType;

function createLeadType(): LeadTypeRow {
  return {
    id: `lead-${Math.random().toString(36).slice(2, 8)}`,
    name: "",
    estimatedValue: 0,
  };
}

export function BusinessSetupForm({ initialValue, labels, showInternalTools = false }: Props) {
  const router = useRouter();
  const [businessName, setBusinessName] = useState(initialValue.businessName);
  const [leadTypes, setLeadTypes] = useState<LeadTypeRow[]>(
    initialValue.leadTypes.length > 0 ? initialValue.leadTypes : [createLeadType()],
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isBackfilling, startBackfill] = useTransition();
  const [isReseedingDemo, startReseedDemo] = useTransition();

  function updateLeadType(id: string, patch: Partial<LeadTypeRow>) {
    setLeadTypes((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  function addLeadType() {
    setLeadTypes((current) => [...current, createLeadType()]);
  }

  function removeLeadType(id: string) {
    setLeadTypes((current) => {
      const next = current.filter((row) => row.id !== id);
      return next.length > 0 ? next : [createLeadType()];
    });
  }

  function save() {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const response = await fetch("/api/business-setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName,
          leadTypes: leadTypes
            .map((row) => ({
              id: row.id,
              name: row.name.trim(),
              estimatedValue: Number(row.estimatedValue) || 0,
            }))
            .filter((row) => row.name),
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string; seeded?: number; focusConversationId?: string | null }
        | null;
      if (!response.ok || !payload?.ok) {
        setError(payload?.error ?? labels.error);
        return;
      }

      setMessage(labels.success);
      if ((payload.seeded ?? 0) > 0) {
        router.push(
          payload.focusConversationId
            ? `/inbox?demo=1&focus=${encodeURIComponent(payload.focusConversationId)}`
            : "/inbox?demo=1",
        );
        return;
      }
      router.refresh();
    });
  }

  function backfill() {
    setMessage(null);
    setError(null);
    startBackfill(async () => {
      const response = await fetch("/api/business-setup/backfill", {
        method: "POST",
      });

      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string; updated?: number }
        | null;

      if (!response.ok || !payload?.ok) {
        setError(payload?.error ?? labels.error);
        return;
      }

      setMessage(
        typeof payload.updated === "number"
          ? `${labels.backfillSuccess} (${payload.updated})`
          : labels.backfillSuccess,
      );
      router.refresh();
    });
  }

  function reseedDemo() {
    if (typeof window !== "undefined" && !window.confirm(labels.reseedDemoConfirm)) {
      return;
    }

    setMessage(null);
    setError(null);
    startReseedDemo(async () => {
      const response = await fetch("/api/business-setup/reseed-demo", {
        method: "POST",
      });

      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string; seeded?: number; focusConversationId?: string | null }
        | null;

      if (!response.ok || !payload?.ok) {
        setError(payload?.error ?? labels.error);
        return;
      }

      setMessage(labels.reseedDemoSuccess);
      router.push(
        payload.focusConversationId
          ? `/inbox?demo=1&focus=${encodeURIComponent(payload.focusConversationId)}`
          : "/inbox?demo=1",
      );
    });
  }

  return (
    <article className="card settings-business-card">
      <p className="label">{labels.title}</p>
      <p className="subtitle settings-business-help">
        {labels.help}
      </p>

      <section className="setup-panel settings-business-section">
        <label className="label" htmlFor="business-name">
          {labels.businessName}
        </label>
        <input
          id="business-name"
          className="input settings-business-name-input"
          value={businessName}
          onChange={(event) => setBusinessName(event.target.value)}
        />
      </section>

      <section className="setup-panel settings-business-section">
        <p className="label settings-business-section-title">
          {labels.leadTypesBlock}
        </p>
        <p className="subtitle settings-business-section-copy">
          {labels.leadTypes}
        </p>
        <div className="lead-types-list">
          {leadTypes.map((row) => (
            <div key={row.id} className="lead-type-row settings-lead-card">
              <div className="lead-type-main settings-lead-card-main">
                <div className="settings-lead-card-field">
                  <span className="label">{labels.leadTypeName}</span>
                  <input
                    id={`lead-name-${row.id}`}
                    className="input"
                    placeholder={labels.leadTypeName}
                    value={row.name}
                    onChange={(event) => updateLeadType(row.id, { name: event.target.value })}
                  />
                </div>
                <div className="settings-lead-card-field">
                  <span className="label">{labels.estimatedValue}</span>
                  <input
                    id={`lead-value-${row.id}`}
                    className="input"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    value={row.estimatedValue}
                    onChange={(event) =>
                      updateLeadType(row.id, { estimatedValue: Number(event.target.value) || 0 })
                    }
                  />
                </div>
              </div>
              <div className="lead-type-meta settings-lead-card-actions">
                {leadTypes.length > 1 ? (
                  <button className="action-link" type="button" onClick={() => removeLeadType(row.id)}>
                    {labels.removeLeadType}
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
        <div className="settings-business-add">
          <button className="mini-button" type="button" onClick={addLeadType}>
            {labels.addLeadType}
          </button>
        </div>
      </section>

      {message ? <p className="note settings-business-feedback">{message}</p> : null}
      {error ? <p className="warn settings-business-feedback">{error}</p> : null}

      <div className="actions settings-business-actions">
        <button className="button" type="button" disabled={isPending} onClick={save}>
          {isPending ? labels.saving : labels.save}
        </button>
        {showInternalTools ? (
          <>
            <button className="mini-button" type="button" disabled={isBackfilling} onClick={backfill}>
              {isBackfilling ? labels.backfilling : labels.backfill}
            </button>
            <button className="mini-button" type="button" disabled={isReseedingDemo} onClick={reseedDemo}>
              {isReseedingDemo ? labels.reseedingDemo : labels.reseedDemo}
            </button>
          </>
        ) : null}
      </div>
    </article>
  );
}
