"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Props = {
  channel?: "whatsapp" | "email" | "form";
  idleLabel: string;
  requestedLabel: string;
  requestedNote: string;
};

export function SetupRequestButton({
  channel = "whatsapp",
  idleLabel,
  requestedLabel,
  requestedNote,
}: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "requested">("idle");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleClick() {
    setError(null);

    const res = await fetch("/api/setup-request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ channel }),
    });

    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      alreadyRequested?: boolean;
      error?: string;
    };

    if (!res.ok || !data.ok) {
      setError("Could not request setup right now.");
      return;
    }

    setStatus("requested");
    startTransition(() => {
      router.refresh();
    });
  }

  if (status === "requested") {
    return (
      <div className="request-state">
        <span className="badge status-active">{requestedLabel}</span>
        <p className="note">{requestedNote}</p>
      </div>
    );
  }

  return (
    <div className="request-state">
      <button className="button" type="button" onClick={handleClick} disabled={isPending}>
        {isPending ? "..." : idleLabel}
      </button>
      {error ? <p className="note">{error}</p> : null}
    </div>
  );
}
