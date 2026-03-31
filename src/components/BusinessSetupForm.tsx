"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { BusinessLeadType, BusinessSetupView } from "@/lib/app-data";

type Props = {
  initialValue: BusinessSetupView;
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

export function BusinessSetupForm({ initialValue, labels }: Props) {
  const router = useRouter();
  const [businessName, setBusinessName] = useState(initialValue.businessName);
  const [leadTypes, setLeadTypes] = useState<LeadTypeRow[]>(
    initialValue.leadTypes.length > 0 ? initialValue.leadTypes : [createLeadType()],
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

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

      const payload = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!response.ok || !payload?.ok) {
        setError(payload?.error ?? labels.error);
        return;
      }

      setMessage(labels.success);
      router.refresh();
    });
  }

  return (
    <article className="card">
      <p className="label">{labels.title}</p>
      <p className="subtitle" style={{ marginBottom: 12 }}>
        {labels.help}
      </p>

      <section className="setup-panel">
        <label className="label" htmlFor="business-name">
          {labels.businessName}
        </label>
        <input
          id="business-name"
          className="input"
          value={businessName}
          onChange={(event) => setBusinessName(event.target.value)}
        />
      </section>

      <section className="setup-panel">
        <p className="label" style={{ marginBottom: 10 }}>
          {labels.leadTypesBlock}
        </p>
        <p className="subtitle" style={{ marginBottom: 12 }}>
          {labels.leadTypes}
        </p>
        <div className="lead-types-list">
          {leadTypes.map((row) => (
            <div key={row.id} className="lead-type-row">
              <div className="lead-type-main">
                <div>
                  <label className="label" htmlFor={`lead-name-${row.id}`}>
                    {labels.leadTypeName}
                  </label>
                  <input
                    id={`lead-name-${row.id}`}
                    className="input"
                    placeholder={labels.leadTypeName}
                    value={row.name}
                    onChange={(event) => updateLeadType(row.id, { name: event.target.value })}
                  />
                </div>
                <div>
                  <label className="label" htmlFor={`lead-value-${row.id}`}>
                    {labels.estimatedValue}
                  </label>
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
              <div className="lead-type-meta">
                {leadTypes.length > 1 ? (
                  <button className="action-link" type="button" onClick={() => removeLeadType(row.id)}>
                    {labels.removeLeadType}
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
        <button className="mini-button" type="button" onClick={addLeadType}>
          {labels.addLeadType}
        </button>
      </section>

      {message ? <p className="note" style={{ marginTop: 12 }}>{message}</p> : null}
      {error ? <p className="warn" style={{ marginTop: 12 }}>{error}</p> : null}

      <div className="actions" style={{ marginTop: 12 }}>
        <button className="button" type="button" disabled={isPending} onClick={save}>
          {isPending ? labels.saving : labels.save}
        </button>
      </div>
    </article>
  );
}
