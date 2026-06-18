import { ChannelBadge } from "@/components/ChannelBadge";
import type { ChannelType } from "@/lib/messaging/channel-types";
import { channelSettingsAnchor } from "@/lib/messaging/channel-types";

type Props = {
  channel: ChannelType;
  label: string;
  title: string;
  description: string;
  comingSoon: string;
  isConnected: boolean;
  connectedLabel: string;
  pendingLabel: string;
};

export function ChannelSetupPlaceholder({
  channel,
  label,
  title,
  description,
  comingSoon,
  isConnected,
  connectedLabel,
  pendingLabel,
}: Props) {
  return (
    <article
      id={channelSettingsAnchor(channel)}
      className={`card settings-channel-card settings-channel-setup-anchor ${
        isConnected ? "settings-channel-connected" : "settings-channel-pending"
      }`.trim()}
    >
      <div className="preview-row" style={{ marginBottom: 12 }}>
        <ChannelBadge label={label} channel={channel} />
        <span className={`badge ${isConnected ? "status-active" : "status-no-response"}`}>
          {isConnected ? connectedLabel : pendingLabel}
        </span>
      </div>
      <p className="label">{title}</p>
      <p className="subtitle" style={{ marginBottom: 12 }}>
        {description}
      </p>
      <p className="note">{comingSoon}</p>
    </article>
  );
}
