"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import type { BusinessLeadType, BusinessSetupView } from "@/lib/app-data";

type Props = {
  initialValue: BusinessSetupView;
  labels: {
    title: string;
    help: string;
    businessBlock: string;
    businessName: string;
    businessType: string;
    multipleUnits: string;
    units: string;
    unitsPlaceholder: string;
    leadTypesBlock: string;
    leadTypes: string;
    addLeadType: string;
    leadTypeName: string;
    estimatedValue: string;
    priority: string;
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
    priority: false,
  };
}

export function BusinessSetupForm({ initialValue, labels }: Props) {
  const router = useRouter();
  const [businessName, setBusinessName] = useState(initialValue.businessName);
  const [businessType, setBusinessType] = useState(initialValue.businessType);
  const [hasMultipleUnits, setHasMultipleUnits] = useState(initialValue.hasMultipleUnits);
  const [unitsText, setUnitsText] = useState(initialValue.units.join(", "));
  const [leadTypes, setLeadTypes] = useState<LeadTypeRow[]>(
    initialValue.leadTypes.length > 0 ? initialValue.leadTypes : [createLeadType()],
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const parsedUnits = useMemo(
    () =>
      unitsText
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
    [unitsText],
  );

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
          businessType,
          hasMultipleUnits,
          units: hasMultipleUnits ? parsedUnits : [],
          leadTypes: leadTypes
            .map((row) => ({
              id: row.id,
              name: row.name.trim(),
              estimatedValue: Number(row.estimatedValue) || 0,
              priority: row.priority,
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
        <p className="label" style={{ marginBottom: 10 }}>
          {labels.businessBlock}
        </p>
        <div className="grid cols-2">
          <div>
            <label className="label" htmlFor="business-name">
              {labels.businessName}
            </label>
            <input
              id="business-name"
              className="input"
              value={businessName}
              onChange={(event) => setBusinessName(event.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="business-type">
              {labels.businessType}
            </label>
            <input
              id="business-type"
              className="input"
              value={businessType}
              onChange={(event) => setBusinessType(event.target.value)}
            />
          </div>
        </div>
        <label className="checkbox-row" style={{ marginBottom: hasMultipleUnits ? 12 : 0 }}>
          <input
            type="checkbox"
            checked={hasMultipleUnits}
            onChange={(event) => setHasMultipleUnits(event.target.checked)}
          />
          <span>{labels.multipleUnits}</span>
        </label>

        {hasMultipleUnits ? (
          <div>
            <label className="label" htmlFor="business-units">
              {labels.units}
            </label>
            <input
              id="business-units"
              className="input"
              placeholder={labels.unitsPlaceholder}
              value={unitsText}
              onChange={(event) => setUnitsText(event.target.value)}
            />
          </div>
        ) : null}
      </section>

      <section className="setup-panel">
        <p className="label" style={{ marginBottom: 10 }}>
          {labels.leadTypesBlock}
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
                <label className="checkbox-row compact-checkbox">
                  <input
                    type="checkbox"
                    checked={row.priority}
                    onChange={(event) => updateLeadType(row.id, { priority: event.target.checked })}
                  />
                  <span>{labels.priority}</span>
                </label>
                {leadTypes.length > 1 ? (
                  <button className="mini-button" type="button" onClick={() => removeLeadType(row.id)}>
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
