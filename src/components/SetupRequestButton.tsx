"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Props = {
  channel?: "whatsapp" | "email" | "form";
  idleLabel: string;
  requestedLabel: string;
  requestedNote: string;
  numberLabel: string;
  numberPlaceholder: string;
  notesLabel: string;
  notesPlaceholder: string;
};

export function SetupRequestButton({
  channel = "whatsapp",
  idleLabel,
  requestedLabel,
  requestedNote,
  numberLabel,
  numberPlaceholder,
  notesLabel,
  notesPlaceholder,
}: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "requested">("idle");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleClick() {
    setError(null);

    const trimmedPhone = phoneNumber.trim();
    const trimmedNotes = notes.trim();
    const payloadNotes = [trimmedPhone ? `WhatsApp number: ${trimmedPhone}` : "", trimmedNotes]
      .filter(Boolean)
      .join("\n");

    const res = await fetch("/api/setup-request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ channel, notes: payloadNotes || undefined }),
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
      <label className="label" htmlFor={`setup-number-${channel}`}>
        {numberLabel}
      </label>
      <input
        id={`setup-number-${channel}`}
        className="input"
        type="text"
        value={phoneNumber}
        onChange={(event) => setPhoneNumber(event.target.value)}
        placeholder={numberPlaceholder}
        autoComplete="tel"
      />
      <label className="label" htmlFor={`setup-notes-${channel}`} style={{ marginTop: 10 }}>
        {notesLabel}
      </label>
      <textarea
        id={`setup-notes-${channel}`}
        className="input"
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        placeholder={notesPlaceholder}
        rows={3}
      />
      <button className="button" type="button" onClick={handleClick} disabled={isPending}>
        {isPending ? "..." : idleLabel}
      </button>
      {error ? <p className="note">{error}</p> : null}
    </div>
  );
}
