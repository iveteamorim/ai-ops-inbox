"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { ChannelType } from "@/lib/messaging/channel-types";

function parseRequestNotes(channel: ChannelType, notes?: string | null) {
  const lines = (notes ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const primaryPrefix =
    channel === "instagram" ? "instagram handle:" : channel === "whatsapp" ? "whatsapp number:" : "";
  const primaryLine = primaryPrefix
    ? lines.find((line) => line.toLowerCase().startsWith(primaryPrefix))
    : null;
  const metaLine = lines.find((line) => line.toLowerCase().startsWith("meta business verified:"));
  const primaryValue = primaryLine ? primaryLine.split(":").slice(1).join(":").trim() : "";
  const metaVerifiedRaw = metaLine ? metaLine.split(":").slice(1).join(":").trim().toLowerCase() : "";
  const metaVerified = metaVerifiedRaw === "yes" || metaVerifiedRaw === "no" ? metaVerifiedRaw : "no";
  const extraNotes = lines.filter((line) => line !== primaryLine && line !== metaLine).join("\n");

  return { primaryValue, metaVerified, extraNotes };
}

type Props = {
  channel?: Extract<ChannelType, "whatsapp" | "instagram">;
  idleLabel: string;
  updateLabel: string;
  requestedLabel: string;
  inProgressLabel: string;
  requestedNote: string;
  numberLabel: string;
  numberPlaceholder: string;
  metaVerifiedLabel: string;
  metaVerifiedYes: string;
  metaVerifiedNo: string;
  notesLabel: string;
  notesPlaceholder: string;
  phoneRequiredError: string;
  requestErrorLabel: string;
  existingStatus?: "requested" | "in_progress" | "completed" | "cancelled" | null;
  existingNotes?: string | null;
};

export function SetupRequestButton({
  channel = "whatsapp",
  idleLabel,
  updateLabel,
  requestedLabel,
  inProgressLabel,
  requestedNote,
  numberLabel,
  numberPlaceholder,
  metaVerifiedLabel,
  metaVerifiedYes,
  metaVerifiedNo,
  notesLabel,
  notesPlaceholder,
  phoneRequiredError,
  requestErrorLabel,
  existingStatus = null,
  existingNotes = null,
}: Props) {
  const initial = parseRequestNotes(channel, existingNotes);
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "requested" | "in_progress">(
    existingStatus === "in_progress" ? "in_progress" : existingStatus === "requested" ? "requested" : "idle",
  );
  const [primaryValue, setPrimaryValue] = useState(initial.primaryValue);
  const [metaVerified, setMetaVerified] = useState<"yes" | "no">(initial.metaVerified as "yes" | "no");
  const [notes, setNotes] = useState(initial.extraNotes);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleClick() {
    setError(null);

    const trimmedPrimary = primaryValue.trim();
    if (!trimmedPrimary) {
      setError(phoneRequiredError);
      return;
    }

    const trimmedNotes = notes.trim();
    const primaryKey = channel === "instagram" ? "Instagram handle" : "WhatsApp number";
    const payloadNotes = [
      `${primaryKey}: ${trimmedPrimary}`,
      `Meta Business verified: ${metaVerified}`,
      trimmedNotes,
    ]
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
      setError(requestErrorLabel);
      return;
    }

    setStatus(data.alreadyRequested ? (existingStatus === "in_progress" ? "in_progress" : "requested") : "requested");
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
          <p className="note">{requestedNote}</p>
        </>
      ) : null}
      <label className="label" htmlFor={`setup-number-${channel}`}>
        {numberLabel}
      </label>
      <input
        id={`setup-number-${channel}`}
        className="input"
        type="text"
        value={primaryValue}
        onChange={(event) => setPrimaryValue(event.target.value)}
        placeholder={numberPlaceholder}
        autoComplete={channel === "whatsapp" ? "tel" : "off"}
      />
      <label className="label" htmlFor={`setup-meta-${channel}`} style={{ marginTop: 10 }}>
        {metaVerifiedLabel}
      </label>
      <select
        id={`setup-meta-${channel}`}
        className="input"
        value={metaVerified}
        onChange={(event) => setMetaVerified(event.target.value === "yes" ? "yes" : "no")}
      >
        <option value="yes">{metaVerifiedYes}</option>
        <option value="no">{metaVerifiedNo}</option>
      </select>
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
        {isPending ? "..." : status === "idle" ? idleLabel : updateLabel}
      </button>
      {error ? <p className="note">{error}</p> : null}
    </div>
  );
}
