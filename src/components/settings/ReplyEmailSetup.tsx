"use client";

import { useState } from "react";
import type { EmailReplyConfigState } from "@/lib/messaging/email-reply-state";

type Labels = {
  title: string;
  help: string;
  email: string;
  sendCode: string;
  code: string;
  confirm: string;
  verified: string;
  pending: string;
  codeSent: string;
  error: string;
  invalidCode: string;
};

type Props = {
  reply: EmailReplyConfigState | null;
  canManage: boolean;
  labels: Labels;
};

export function ReplyEmailSetup({ reply, canManage, labels }: Props) {
  const [email, setEmail] = useState(reply?.from_email ?? "");
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);
  const [verified, setVerified] = useState(Boolean(reply?.verified));
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSendCode() {
    setBusy(true);
    setError(null);
    setStatus(null);

    const response = await fetch("/api/channels/reply-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        channel: "form",
        action: "verify",
        email,
      }),
    });

    const data = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string };
    setBusy(false);

    if (!response.ok || !data.ok) {
      setError(labels.error);
      return;
    }

    setPending(true);
    setVerified(false);
    setStatus(labels.codeSent);
  }

  async function handleConfirm() {
    setBusy(true);
    setError(null);
    setStatus(null);

    const response = await fetch("/api/channels/reply-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        channel: "form",
        action: "confirm",
        email,
        code,
      }),
    });

    const data = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string };
    setBusy(false);

    if (!response.ok || !data.ok) {
      setError(data.error === "invalid_verification_code" ? labels.invalidCode : labels.error);
      return;
    }

    setPending(false);
    setVerified(true);
    setStatus(labels.verified);
    setCode("");
  }

  if (!canManage) {
    return verified ? (
      <p className="note">
        {labels.verified}: <strong>{email}</strong>
      </p>
    ) : null;
  }

  return (
    <div className="settings-reply-email-simple">
      {verified ? (
        <p className="note settings-reply-email-confirmed">
          {labels.verified}: <strong>{email}</strong>
        </p>
      ) : null}

      <label className="novua-lead-form-field">
        <span className="label">{labels.email}</span>
        <input
          className="input"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="hola@tuempresa.com"
          disabled={busy}
        />
      </label>

      {!pending ? (
        <button className="button" type="button" onClick={handleSendCode} disabled={busy || !email.trim()}>
          {labels.sendCode}
        </button>
      ) : (
        <>
          <p className="note">{labels.pending}</p>
          <label className="novua-lead-form-field">
            <span className="label">{labels.code}</span>
            <input
              className="input"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="123456"
              inputMode="numeric"
              disabled={busy}
            />
          </label>
          <button className="button" type="button" onClick={handleConfirm} disabled={busy || !code.trim()}>
            {labels.confirm}
          </button>
        </>
      )}

      {status ? <p className="note">{status}</p> : null}
      {error ? <p className="note">{error}</p> : null}
    </div>
  );
}
