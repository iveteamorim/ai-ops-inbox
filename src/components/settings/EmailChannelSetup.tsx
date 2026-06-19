"use client";

import { ChannelBadge } from "@/components/ChannelBadge";
import { ReplyEmailSetup } from "@/components/settings/ReplyEmailSetup";
import { channelSettingsAnchor } from "@/lib/messaging/channel-types";
import type { EmailReplyConfigState } from "@/lib/messaging/email-reply-state";

type Labels = {
  title: string;
  description: string;
  connected: string;
  disconnected: string;
  agentNote: string;
  replyLabels: {
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
};

type Props = {
  label: string;
  isActive: boolean;
  reply: EmailReplyConfigState | null;
  canManage: boolean;
  labels: Labels;
};

export function EmailChannelSetup({ label, isActive, reply, canManage, labels }: Props) {
  const liveActive = isActive || Boolean(reply?.verified);

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
        <ReplyEmailSetup channel="email" reply={reply} canManage={canManage} labels={labels.replyLabels} />
      ) : (
        <p className="note" style={{ marginBottom: 16 }}>
          {labels.agentNote}
        </p>
      )}
    </article>
  );
}
