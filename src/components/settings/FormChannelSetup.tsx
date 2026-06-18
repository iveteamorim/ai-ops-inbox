"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ChannelBadge } from "@/components/ChannelBadge";
import { channelSettingsAnchor } from "@/lib/messaging/channel-types";

type Labels = {
  title: string;
  description: string;
  connected: string;
  disconnected: string;
  activate: string;
  regenerate: string;
  endpoint: string;
  token: string;
  embed: string;
  copy: string;
  copied: string;
  help: string;
  agentNote: string;
  error: string;
};

type Props = {
  label: string;
  isActive: boolean;
  token: string | null;
  endpoint: string;
  embed: string | null;
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

export function FormChannelSetup({
  label,
  isActive,
  token,
  endpoint,
  embed,
  canManage,
  labels,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [liveToken, setLiveToken] = useState(token);
  const [liveEmbed, setLiveEmbed] = useState(embed);
  const [liveActive, setLiveActive] = useState(isActive);

  async function handleActivate() {
    setError(null);

    const response = await fetch("/api/channels/form", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const data = (await response.json().catch(() => ({}))) as {
      ok?: boolean;
      token?: string;
      embed?: string;
      error?: string;
    };

    if (!response.ok || !data.ok || !data.token) {
      setError(labels.error);
      return;
    }

    setLiveToken(data.token);
    setLiveEmbed(data.embed ?? null);
    setLiveActive(true);
    startTransition(() => router.refresh());
  }

  async function handleCopy(field: string, value: string) {
    await copyText(value);
    setCopiedField(field);
    window.setTimeout(() => setCopiedField(null), 1600);
  }

  return (
    <article
      id={channelSettingsAnchor("form")}
      className={`card settings-channel-card settings-channel-setup-anchor ${
        liveActive ? "settings-channel-connected" : "settings-channel-pending"
      }`.trim()}
    >
      <div className="preview-row" style={{ marginBottom: 12 }}>
        <ChannelBadge label={label} channel="form" />
        <span className={`badge ${liveActive ? "status-active" : "status-no-response"}`}>
          {liveActive ? labels.connected : labels.disconnected}
        </span>
      </div>

      <p className="label">{labels.title}</p>
      <p className="subtitle" style={{ marginBottom: 12 }}>
        {labels.description}
      </p>
      <p className="note" style={{ marginBottom: 16 }}>
        {labels.help}
      </p>

      {canManage ? (
        <div style={{ marginBottom: 16 }}>
          <button className="button" type="button" onClick={handleActivate} disabled={isPending}>
            {liveActive ? labels.regenerate : labels.activate}
          </button>
          {error ? <p className="note">{error}</p> : null}
        </div>
      ) : (
        <p className="note" style={{ marginBottom: 16 }}>
          {labels.agentNote}
        </p>
      )}

      {liveActive && liveToken ? (
        <div className="settings-form-channel-fields">
          <div className="settings-copy-field">
            <label className="label" htmlFor="form-endpoint">
              {labels.endpoint}
            </label>
            <div className="settings-copy-row">
              <input id="form-endpoint" className="input" readOnly value={endpoint} />
              <button
                type="button"
                className="button-copy"
                onClick={() => handleCopy("endpoint", endpoint)}
              >
                {copiedField === "endpoint" ? labels.copied : labels.copy}
              </button>
            </div>
          </div>

          <div className="settings-copy-field">
            <label className="label" htmlFor="form-token">
              {labels.token}
            </label>
            <div className="settings-copy-row">
              <input id="form-token" className="input" readOnly value={liveToken} />
              <button
                type="button"
                className="button-copy"
                onClick={() => handleCopy("token", liveToken)}
              >
                {copiedField === "token" ? labels.copied : labels.copy}
              </button>
            </div>
          </div>

          {liveEmbed ? (
            <div className="settings-copy-field">
              <label className="label" htmlFor="form-embed">
                {labels.embed}
              </label>
              <div className="settings-copy-row settings-copy-row-stack">
                <textarea id="form-embed" className="input" readOnly rows={12} value={liveEmbed} />
                <button
                  type="button"
                  className="button-copy"
                  onClick={() => handleCopy("embed", liveEmbed)}
                >
                  {copiedField === "embed" ? labels.copied : labels.copy}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
