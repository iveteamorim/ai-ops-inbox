import Link from "next/link";
import type { ChannelType } from "@/lib/messaging/channel-types";
import { CHANNEL_TYPES, channelSettingsAnchor } from "@/lib/messaging/channel-types";
import { ChannelBadge } from "@/components/ChannelBadge";

type ChannelRow = {
  type: ChannelType;
  is_active: boolean;
};

type SetupRequestRow = {
  channel: ChannelType;
  status: "requested" | "in_progress" | "completed" | "cancelled";
};

type ChannelTileCopy = {
  label: string;
  description: string;
};

type Props = {
  channels: ChannelRow[];
  setupRequests: SetupRequestRow[];
  title: string;
  subtitle: string;
  connected: string;
  pending: string;
  disconnected: string;
  comingSoon: string;
  configure: string;
  tiles: Record<ChannelType, ChannelTileCopy>;
  formatChannel: (channel: ChannelType) => string;
};

export function ChannelsOverview({
  channels,
  setupRequests,
  title,
  subtitle,
  connected,
  pending,
  disconnected,
  comingSoon,
  configure,
  tiles,
  formatChannel,
}: Props) {
  return (
    <article className="card settings-channels-overview">
      <p className="label">{title}</p>
      <p className="subtitle" style={{ marginBottom: 16 }}>
        {subtitle}
      </p>

      <div className="settings-channels-grid">
        {CHANNEL_TYPES.map((type) => {
          const channel = channels.find((item) => item.type === type) ?? null;
          const pendingRequest = setupRequests.find(
            (request) =>
              request.channel === type &&
              (request.status === "requested" || request.status === "in_progress"),
          );
          const isConnected = Boolean(channel?.is_active);
          const isPending = Boolean(pendingRequest);
          const statusLabel = isConnected
            ? connected
            : isPending
              ? pending
              : type === "whatsapp" || type === "form"
                ? disconnected
                : comingSoon;

          return (
            <Link
              key={type}
              href={`#${channelSettingsAnchor(type)}`}
              className="settings-channel-tile settings-channel-tile-link"
            >
              <div className="settings-channel-tile-head">
                <ChannelBadge label={formatChannel(type)} channel={type} />
                <span
                  className={[
                    "badge",
                    isConnected ? "status-active" : isPending ? "status-no-response" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {statusLabel}
                </span>
              </div>
              <p className="settings-channel-tile-copy">{tiles[type].description}</p>
              <span className="action-link">{configure}</span>
            </Link>
          );
        })}
      </div>
    </article>
  );
}
