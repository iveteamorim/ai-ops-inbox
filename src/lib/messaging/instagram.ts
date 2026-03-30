export type InstagramInboundMessage = {
  externalMessageId: string;
  instagramAccountId: string;
  fromExternalId: string;
  fromName: string | null;
  text: string;
  timestamp: string;
  rawMessage: unknown;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

export function extractInstagramInboundMessages(payload: unknown): InstagramInboundMessage[] {
  if (!isObject(payload)) {
    return [];
  }

  const entries = asArray(payload.entry);
  const inbound: InstagramInboundMessage[] = [];

  for (const entry of entries) {
    if (!isObject(entry)) continue;

    const messaging = asArray(entry.messaging);
    for (const item of messaging) {
      if (!isObject(item)) continue;

      const sender = isObject(item.sender) ? item.sender : null;
      const recipient = isObject(item.recipient) ? item.recipient : null;
      const message = isObject(item.message) ? item.message : null;

      const externalMessageId = typeof message?.mid === "string" ? message.mid : "";
      const fromExternalId = typeof sender?.id === "string" ? sender.id : "";
      const instagramAccountId = typeof recipient?.id === "string" ? recipient.id : "";
      const text = typeof message?.text === "string" ? message.text : "";
      const timestampValue =
        typeof item.timestamp === "number" || typeof item.timestamp === "string"
          ? String(item.timestamp)
          : "";

      if (!externalMessageId || !fromExternalId || !instagramAccountId || !text) {
        continue;
      }

      inbound.push({
        externalMessageId,
        instagramAccountId,
        fromExternalId,
        fromName: null,
        text,
        timestamp: timestampValue,
        rawMessage: item,
      });
    }
  }

  return inbound;
}
