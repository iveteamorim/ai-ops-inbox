import type { ChannelType } from "@/lib/messaging/channel-types";
import { channelBadgeClass } from "@/lib/messaging/channel-types";

type Props = {
  label: string;
  channel: ChannelType;
  className?: string;
};

export function ChannelBadge({ label, channel, className = "" }: Props) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em]",
        channelBadgeClass(channel),
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {label}
    </span>
  );
}
