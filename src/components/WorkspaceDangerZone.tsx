"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Props = {
  title: string;
  help: string;
  warning: string;
  confirmationLabel: string;
  confirmationPlaceholder: string;
  deleteLabel: string;
  deletingLabel: string;
  successRedirectingLabel: string;
  errorLabel: string;
  workspaceName: string;
};

export function WorkspaceDangerZone({
  title,
  help,
  warning,
  confirmationLabel,
  confirmationPlaceholder,
  deleteLabel,
  deletingLabel,
  successRedirectingLabel,
  errorLabel,
  workspaceName,
}: Props) {
  const router = useRouter();
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const canDelete = confirmation.trim() === workspaceName;

  function handleDelete() {
    setMessage(null);
    setError(null);

    startTransition(async () => {
      const response = await fetch("/api/workspace/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation }),
      });

      const payload = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!response.ok || !payload?.ok) {
        setError(errorLabel);
        return;
      }

      setMessage(successRedirectingLabel);
      router.push("/");
      router.refresh();
    });
  }

  return (
    <article className="card" style={{ marginTop: 12 }}>
      <p className="label" style={{ color: "var(--danger)" }}>{title}</p>
      <p className="subtitle" style={{ marginBottom: 8 }}>{help}</p>
      <p className="note" style={{ marginBottom: 12 }}>{warning}</p>
      <label className="label" htmlFor="workspace-delete-confirmation">
        {confirmationLabel}
      </label>
      <input
        id="workspace-delete-confirmation"
        className="input"
        type="text"
        value={confirmation}
        onChange={(event) => setConfirmation(event.target.value)}
        placeholder={confirmationPlaceholder}
        autoComplete="off"
      />
      <div className="actions" style={{ marginTop: 12 }}>
        <button
          className="mini-button mini-danger"
          type="button"
          disabled={isPending || !canDelete}
          onClick={handleDelete}
        >
          {isPending ? deletingLabel : deleteLabel}
        </button>
      </div>
      {message ? <p className="note">{message}</p> : null}
      {error ? <p className="note">{error}</p> : null}
    </article>
  );
}
