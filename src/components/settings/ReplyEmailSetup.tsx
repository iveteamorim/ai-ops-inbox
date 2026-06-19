"use client";

import { useState } from "react";
import type { EmailReplyConfigState } from "@/lib/messaging/email-reply-state";

type Labels = {
  title: string;
  help: string;
  email: string;
  name: string;
  sendCode: string;
  code: string;
  confirm: string;
  verified: string;
  pending: string;
  codeSent: string;
  error: string;
  invalidCode: string;
  noDnsNote: string;
};

type Props = {
  channel: "form" | "email";
  reply: EmailReplyConfigState | null;
  canManage: boolean;
  labels: Labels;
};

export function ReplyEmailSetup({ channel, reply, canManage, labels }: Props) {
  const [email, setEmail] = useState(reply?.from_email ?? "");
  const [fromName, setFromName] = useState(reply?.from_name ?? "");
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
        channel,
        action: "verify",
        email,
        from_name: fromName,
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
        channel,
        action: "confirm",
        email,
        code,
        from_name: fromName,
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

  return (
    <div className="settings-form-reply">
      <p className="label">{labels.title}</p>
      <p className="note" style={{ marginBottom: 12 }}>
        {labels.help}
      </p>
      <p className="note" style={{ marginBottom: 12 }}>
        {labels.noDnsNote}
      </p>

      {verified ? (
        <p className="note" style={{ marginBottom: 12 }}>
          {labels.verified}: <strong>{email}</strong>
        </p>
      ) : null}

      {canManage ? (
        <div className="settings-form-channel-fields">
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
          <label className="novua-lead-form-field">
            <span className="label">{labels.name}</span>
            <input
              className="input"
              value={fromName}
              onChange={(event) => setFromName(event.target.value)}
              placeholder="Tu empresa"
              disabled={busy}
            />
          </label>

          {!verified ? (
            <button className="button" type="button" onClick={handleSendCode} disabled={busy || !email.trim()}>
              {labels.sendCode}
            </button>
          ) : null}

          {pending && !verified ? (
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
          ) : null}

          {verified ? (
            <button className="button" type="button" onClick={handleSendCode} disabled={busy}>
              {labels.sendCode}
            </button>
          ) : null}

          {status ? <p className="note">{status}</p> : null}
          {error ? <p className="note">{error}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
