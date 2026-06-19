import type { DictionaryKey } from "@/lib/i18n/dictionaries";

export const CHANNEL_TYPES = ["whatsapp", "instagram", "email", "form"] as const;

export type ChannelType = (typeof CHANNEL_TYPES)[number];

export function isChannelType(value: string): value is ChannelType {
  return (CHANNEL_TYPES as readonly string[]).includes(value);
}

export function formatChannelLabel(
  channel: ChannelType,
  t: (key: DictionaryKey) => string,
): string {
  if (channel === "whatsapp") return "WhatsApp";
  if (channel === "instagram") return "Instagram";
  if (channel === "email") return "Email";
  return t("conversation_channel_form");
}

export function channelSettingsAnchor(channel: ChannelType): string {
  return `${channel}-setup`;
}

export function channelSettingsPath(channel: ChannelType): string {
  return `/settings/${channel}`;
}

export function isChannelSettingsPath(segment: string): segment is ChannelType {
  return isChannelType(segment);
}

export function channelBadgeClass(channel: ChannelType): string {
  switch (channel) {
    case "whatsapp":
      return "border-emerald-500/35 bg-emerald-500/12 text-emerald-300";
    case "instagram":
      return "border-pink-500/35 bg-pink-500/12 text-pink-300";
    case "email":
      return "border-sky-500/35 bg-sky-500/12 text-sky-300";
    case "form":
      return "border-violet-500/35 bg-violet-500/12 text-violet-300";
    default:
      return "border-white/15 bg-white/5 text-gray-300";
  }
}
