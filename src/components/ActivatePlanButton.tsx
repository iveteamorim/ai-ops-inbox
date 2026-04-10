"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Props = {
  idleLabel: string;
  requestedLabel: string;
  inProgressLabel: string;
  requestedNote: string;
  inProgressNote: string;
  requestErrorLabel: string;
  existingStatus?: "requested" | "in_progress" | "completed" | "cancelled" | null;
};

export function ActivatePlanButton({
  idleLabel,
  requestedLabel,
  inProgressLabel,
  requestedNote,
  inProgressNote,
  requestErrorLabel,
  existingStatus = null,
}: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "requested" | "in_progress">(
    existingStatus === "in_progress" ? "in_progress" : existingStatus === "requested" ? "requested" : "idle",
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleClick() {
    setError(null);

    const res = await fetch("/api/setup-request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        channel: "form",
        notes: "Billing activation request",
      }),
    });

    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      alreadyRequested?: boolean;
    };

    if (!res.ok || !data.ok) {
      setError(requestErrorLabel);
      return;
    }

    setStatus(existingStatus === "in_progress" ? "in_progress" : "requested");
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div className="request-state">
      {status !== "idle" ? (
        <>
          <span className={`badge ${status === "in_progress" ? "status-new" : "status-active"}`}>
            {status === "in_progress" ? inProgressLabel : requestedLabel}
          </span>
          <p className="note">{status === "in_progress" ? inProgressNote : requestedNote}</p>
        </>
      ) : null}
      <button className="button" type="button" onClick={handleClick} disabled={isPending || status !== "idle"}>
        {isPending ? "..." : status === "idle" ? idleLabel : status === "in_progress" ? inProgressLabel : requestedLabel}
      </button>
      {error ? <p className="note">{error}</p> : null}
    </div>
  );
}
