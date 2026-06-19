"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ChannelBadge } from "@/components/ChannelBadge";
import { channelSettingsAnchor } from "@/lib/messaging/channel-types";
import type { GoogleFormsBackupConfig } from "@/lib/messaging/google-forms-backup";
import type { EmailReplyConfig } from "@/lib/messaging/email-config";

type Labels = {
  title: string;
  description: string;
  connected: string;
  disconnected: string;
  activate: string;
  regenerate: string;
  websiteLink: string;
  websiteLinkHelp: string;
  step1: string;
  step2: string;
  step3: string;
  openForm: string;
  advanced: string;
  endpoint: string;
  token: string;
  embed: string;
  copy: string;
  copied: string;
  help: string;
  agentNote: string;
  error: string;
  backupTitle: string;
  backupHelp: string;
  backupActionUrl: string;
  backupEntryName: string;
  backupEntryEmail: string;
  backupEntryPhone: string;
  backupEntryMessage: string;
  backupSave: string;
  backupSaved: string;
  backupError: string;
  backupActive: string;
  backupProvider: string;
  replyTitle: string;
  replyHelp: string;
  replyFromEmail: string;
  replyFromName: string;
  replyToEmail: string;
  replySave: string;
  replySaved: string;
  replyError: string;
};

type Props = {
  label: string;
  isActive: boolean;
  websiteLink: string | null;
  endpoint: string;
  token: string | null;
  embed: string | null;
  canManage: boolean;
  googleFormsBackup: GoogleFormsBackupConfig | null;
  formReply: EmailReplyConfig | null;
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
  websiteLink,
  endpoint,
  token,
  embed,
  canManage,
  googleFormsBackup,
  formReply,
  labels,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [backupError, setBackupError] = useState<string | null>(null);
  const [backupSaved, setBackupSaved] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [liveToken, setLiveToken] = useState(token);
  const [liveWebsiteLink, setLiveWebsiteLink] = useState(websiteLink);
  const [liveEmbed, setLiveEmbed] = useState(embed);
  const [liveActive, setLiveActive] = useState(isActive);
  const [backupActionUrl, setBackupActionUrl] = useState(googleFormsBackup?.action_url ?? "");
  const [backupEntryName, setBackupEntryName] = useState(googleFormsBackup?.fields.name ?? "");
  const [backupEntryEmail, setBackupEntryEmail] = useState(googleFormsBackup?.fields.email ?? "");
  const [backupEntryPhone, setBackupEntryPhone] = useState(googleFormsBackup?.fields.phone ?? "");
  const [backupEntryMessage, setBackupEntryMessage] = useState(googleFormsBackup?.fields.message ?? "");
  const [backupEnabled, setBackupEnabled] = useState(Boolean(googleFormsBackup));
  const [replyFromEmail, setReplyFromEmail] = useState(formReply?.from_email ?? "");
  const [replyFromName, setReplyFromName] = useState(formReply?.from_name ?? "");
  const [replyToEmail, setReplyToEmail] = useState(formReply?.reply_to ?? "");
  const [replyError, setReplyError] = useState<string | null>(null);
  const [replySaved, setReplySaved] = useState(false);

  async function handleActivate(regenerate = false) {
    setError(null);

    const response = await fetch("/api/channels/form", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ regenerate }),
    });
    const data = (await response.json().catch(() => ({}))) as {
      ok?: boolean;
      token?: string;
      website_link?: string;
      embed?: string;
      error?: string;
    };

    if (!response.ok || !data.ok || !data.token) {
      setError(labels.error);
      return;
    }

    setLiveToken(data.token);
    setLiveWebsiteLink(data.website_link ?? null);
    setLiveEmbed(data.embed ?? null);
    setLiveActive(true);
    startTransition(() => router.refresh());
  }

  async function handleSaveReply() {
    setReplyError(null);
    setReplySaved(false);

    const response = await fetch("/api/channels/form/reply", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        from_email: replyFromEmail,
        from_name: replyFromName,
        reply_to: replyToEmail,
      }),
    });

    const data = (await response.json().catch(() => ({}))) as { ok?: boolean };
    if (!response.ok || !data.ok) {
      setReplyError(labels.replyError);
      return;
    }

    setReplySaved(true);
    startTransition(() => router.refresh());
  }

  async function handleSaveBackup() {
    setBackupError(null);
    setBackupSaved(false);

    const response = await fetch("/api/channels/form/backup", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        enabled: backupEnabled,
        action_url: backupActionUrl,
        entry_name: backupEntryName,
        entry_email: backupEntryEmail,
        entry_phone: backupEntryPhone,
        entry_message: backupEntryMessage,
      }),
    });

    const data = (await response.json().catch(() => ({}))) as { ok?: boolean };
    if (!response.ok || !data.ok) {
      setBackupError(labels.backupError);
      return;
    }

    setBackupSaved(true);
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

      {!liveActive ? (
        <p className="note" style={{ marginBottom: 16 }}>
          {labels.help}
        </p>
      ) : null}

      {canManage ? (
        <div style={{ marginBottom: 16 }}>
          {!liveActive ? (
            <button className="button" type="button" onClick={() => handleActivate(false)} disabled={isPending}>
              {labels.activate}
            </button>
          ) : (
            <button className="button" type="button" onClick={() => handleActivate(true)} disabled={isPending}>
              {labels.regenerate}
            </button>
          )}
          {error ? <p className="note">{error}</p> : null}
        </div>
      ) : (
        <p className="note" style={{ marginBottom: 16 }}>
          {labels.agentNote}
        </p>
      )}

      {liveActive && liveWebsiteLink && liveToken ? (
        <div className="settings-form-simple">
          <ol className="settings-form-steps">
            <li>{labels.step1}</li>
            <li>{labels.step2}</li>
            <li>{labels.step3}</li>
          </ol>

          <div className="settings-form-hero">
            <label className="label" htmlFor="form-website-link">
              {labels.websiteLink}
            </label>
            <p className="note" style={{ marginBottom: 10 }}>
              {labels.websiteLinkHelp}
            </p>
            <div className="settings-copy-row">
              <input id="form-website-link" className="input" readOnly value={liveWebsiteLink} />
              <button
                type="button"
                className="button-copy"
                onClick={() => handleCopy("websiteLink", liveWebsiteLink)}
              >
                {copiedField === "websiteLink" ? labels.copied : labels.copy}
              </button>
            </div>
            <a
              href={liveWebsiteLink}
              target="_blank"
              rel="noreferrer"
              className="settings-form-open-link"
            >
              {labels.openForm}
            </a>
          </div>

          <div className="settings-form-reply">
            <p className="label">{labels.replyTitle}</p>
            <p className="note" style={{ marginBottom: 12 }}>
              {labels.replyHelp}
            </p>
            <div className="settings-form-channel-fields">
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
            </div>
            {canManage ? (
              <div style={{ marginTop: 12 }}>
                <button className="button" type="button" onClick={handleSaveReply}>
                  {labels.replySave}
                </button>
                {replySaved ? <p className="note">{labels.replySaved}</p> : null}
                {replyError ? <p className="note">{replyError}</p> : null}
              </div>
            ) : null}
          </div>

          <details className="settings-form-advanced">
            <summary className="label" style={{ cursor: "pointer" }}>
              {labels.advanced}
            </summary>
            <div className="settings-form-channel-fields" style={{ marginTop: 12 }}>
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
                    <textarea id="form-embed" className="input" readOnly rows={10} value={liveEmbed} />
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

              <div className="settings-form-backup">
                <p className="label">{labels.backupTitle}</p>
                <p className="note" style={{ marginBottom: 12 }}>
                  {labels.backupHelp}
                </p>
                {backupEnabled && googleFormsBackup ? (
                  <p className="note" style={{ marginBottom: 12 }}>
                    {labels.backupActive}
                  </p>
                ) : null}
                <label className="settings-checkbox-row">
                  <input
                    type="checkbox"
                    checked={backupEnabled}
                    onChange={(event) => setBackupEnabled(event.target.checked)}
                  />
                  <span>{labels.backupProvider}</span>
                </label>
                {backupEnabled ? (
                  <div className="settings-form-channel-fields" style={{ marginTop: 12 }}>
                    <label className="novua-lead-form-field">
                      <span className="label">{labels.backupActionUrl}</span>
                      <input
                        className="input"
                        value={backupActionUrl}
                        onChange={(event) => setBackupActionUrl(event.target.value)}
                        placeholder="https://docs.google.com/forms/d/e/.../viewform"
                      />
                    </label>
                    <label className="novua-lead-form-field">
                      <span className="label">{labels.backupEntryName}</span>
                      <input
                        className="input"
                        value={backupEntryName}
                        onChange={(event) => setBackupEntryName(event.target.value)}
                        placeholder="entry.123456789"
                      />
                    </label>
                    <label className="novua-lead-form-field">
                      <span className="label">{labels.backupEntryEmail}</span>
                      <input
                        className="input"
                        value={backupEntryEmail}
                        onChange={(event) => setBackupEntryEmail(event.target.value)}
                        placeholder="entry.987654321"
                      />
                    </label>
                    <label className="novua-lead-form-field">
                      <span className="label">{labels.backupEntryPhone}</span>
                      <input
                        className="input"
                        value={backupEntryPhone}
                        onChange={(event) => setBackupEntryPhone(event.target.value)}
                        placeholder="entry.111222333"
                      />
                    </label>
                    <label className="novua-lead-form-field">
                      <span className="label">{labels.backupEntryMessage}</span>
                      <input
                        className="input"
                        value={backupEntryMessage}
                        onChange={(event) => setBackupEntryMessage(event.target.value)}
                        placeholder="entry.444555666"
                      />
                    </label>
                  </div>
                ) : null}
                {canManage ? (
                  <div style={{ marginTop: 12 }}>
                    <button className="button" type="button" onClick={handleSaveBackup}>
                      {labels.backupSave}
                    </button>
                    {backupSaved ? <p className="note">{labels.backupSaved}</p> : null}
                    {backupError ? <p className="note">{backupError}</p> : null}
                  </div>
                ) : null}
              </div>
            </div>
          </details>
        </div>
      ) : null}
    </article>
  );
}
