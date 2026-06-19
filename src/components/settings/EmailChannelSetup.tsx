"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ChannelBadge } from "@/components/ChannelBadge";
import { channelSettingsAnchor } from "@/lib/messaging/channel-types";
import type { EmailReplyConfig } from "@/lib/messaging/email-config";

type Labels = {
  title: string;
  description: string;
  connected: string;
  disconnected: string;
  activate: string;
  inboundAddress: string;
  inboundHelp: string;
  replyFromEmail: string;
  replyFromName: string;
  replyToEmail: string;
  webhookUrl: string;
  webhookHelp: string;
  copy: string;
  copied: string;
  save: string;
  saved: string;
  error: string;
  agentNote: string;
};

type Props = {
  label: string;
  isActive: boolean;
  inboundAddress: string | null;
  reply: EmailReplyConfig | null;
  webhookUrl: string;
  canManage: boolean;
  labels: Labels;
};

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "absolute";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

export function EmailChannelSetup({
  label,
  isActive,
  inboundAddress,
  reply,
  webhookUrl,
  canManage,
  labels,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [liveActive, setLiveActive] = useState(isActive);
  const [liveInboundAddress, setLiveInboundAddress] = useState(inboundAddress ?? "");
  const [replyFromEmail, setReplyFromEmail] = useState(reply?.from_email ?? "");
  const [replyFromName, setReplyFromName] = useState(reply?.from_name ?? "");
  const [replyToEmail, setReplyToEmail] = useState(reply?.reply_to ?? "");

  async function handleActivate() {
    setError(null);
    setSaved(false);

    const response = await fetch("/api/channels/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        inbound_address: liveInboundAddress,
        from_email: replyFromEmail,
        from_name: replyFromName,
        reply_to: replyToEmail,
      }),
    });

    const data = (await response.json().catch(() => ({}))) as {
      ok?: boolean;
      inbound_address?: string;
      error?: string;
    };

    if (!response.ok || !data.ok) {
      setError(labels.error);
      return;
    }

    setLiveActive(true);
    setLiveInboundAddress(data.inbound_address ?? liveInboundAddress);
    setSaved(true);
    startTransition(() => router.refresh());
  }

  async function handleCopy(field: string, value: string) {
    await copyText(value);
    setCopiedField(field);
    window.setTimeout(() => setCopiedField(null), 1600);
  }

  return (
    <article
      id={channelSettingsAnchor("email")}
      className={`card settings-channel-card settings-channel-setup-anchor ${
        liveActive ? "settings-channel-connected" : "settings-channel-pending"
      }`.trim()}
    >
      <div className="preview-row" style={{ marginBottom: 12 }}>
        <ChannelBadge label={label} channel="email" />
        <span className={`badge ${liveActive ? "status-active" : "status-no-response"}`}>
          {liveActive ? labels.connected : labels.disconnected}
        </span>
      </div>

      <p className="label">{labels.title}</p>
      <p className="subtitle" style={{ marginBottom: 12 }}>
        {labels.description}
      </p>

      {canManage ? (
        <div className="settings-form-channel-fields" style={{ marginBottom: 16 }}>
          <label className="novua-lead-form-field">
            <span className="label">{labels.inboundAddress}</span>
            <p className="note" style={{ marginBottom: 8 }}>
              {labels.inboundHelp}
            </p>
            <input
              className="input"
              type="email"
              value={liveInboundAddress}
              onChange={(event) => setLiveInboundAddress(event.target.value)}
              placeholder="info@tuempresa.com"
            />
          </label>
          <label className="novua-lead-form-field">
            <span className="label">{labels.replyFromEmail}</span>
            <input
              className="input"
              type="email"
              value={replyFromEmail}
              onChange={(event) => setReplyFromEmail(event.target.value)}
              placeholder="hola@tuempresa.com"
            />
          </label>
          <label className="novua-lead-form-field">
            <span className="label">{labels.replyFromName}</span>
            <input
              className="input"
              value={replyFromName}
              onChange={(event) => setReplyFromName(event.target.value)}
              placeholder="Tu empresa"
            />
          </label>
          <label className="novua-lead-form-field">
            <span className="label">{labels.replyToEmail}</span>
            <input
              className="input"
              type="email"
              value={replyToEmail}
              onChange={(event) => setReplyToEmail(event.target.value)}
              placeholder="info@tuempresa.com"
            />
          </label>

          <div className="settings-copy-field">
            <label className="label" htmlFor="email-webhook-url">
              {labels.webhookUrl}
            </label>
            <p className="note" style={{ marginBottom: 8 }}>
              {labels.webhookHelp}
            </p>
            <div className="settings-copy-row">
              <input id="email-webhook-url" className="input" readOnly value={webhookUrl} />
              <button
                type="button"
                className="button-copy"
                onClick={() => handleCopy("webhook", webhookUrl)}
              >
                {copiedField === "webhook" ? labels.copied : labels.copy}
              </button>
            </div>
          </div>

          <button className="button" type="button" onClick={handleActivate} disabled={isPending}>
            {liveActive ? labels.save : labels.activate}
          </button>
          {saved ? <p className="note">{labels.saved}</p> : null}
          {error ? <p className="note">{error}</p> : null}
        </div>
      ) : (
        <p className="note" style={{ marginBottom: 16 }}>
          {labels.agentNote}
        </p>
      )}
    </article>
  );
}
