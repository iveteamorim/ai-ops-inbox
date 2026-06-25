export type WhatsAppInboundMessage = {
  externalMessageId: string;
  phoneNumberId: string;
  fromPhone: string;
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

export function extractInboundMessages(payload: unknown): WhatsAppInboundMessage[] {
  if (!isObject(payload)) {
    return [];
  }

  const entries = asArray(payload.entry);
  const inbound: WhatsAppInboundMessage[] = [];

  for (const entry of entries) {
    if (!isObject(entry)) continue;

    const changes = asArray(entry.changes);
    for (const change of changes) {
      if (!isObject(change)) continue;
      const value = isObject(change.value) ? change.value : null;
      if (!value) continue;

      const metadata = isObject(value.metadata) ? value.metadata : null;
      const phoneNumberId =
        typeof metadata?.phone_number_id === "string" ? metadata.phone_number_id : "";

      const contacts = asArray(value.contacts);
      const firstContact = isObject(contacts[0]) ? contacts[0] : null;
      const profile = firstContact && isObject(firstContact.profile) ? firstContact.profile : null;
      const fromName = typeof profile?.name === "string" ? profile.name : null;

      const messages = asArray(value.messages);
      for (const msg of messages) {
        if (!isObject(msg)) continue;
        if (msg.type !== "text") continue;

        const textObj = isObject(msg.text) ? msg.text : null;
        const text = typeof textObj?.body === "string" ? textObj.body : "";

        const externalMessageId = typeof msg.id === "string" ? msg.id : "";
        const fromPhone = typeof msg.from === "string" ? msg.from : "";
        const timestamp = typeof msg.timestamp === "string" ? msg.timestamp : "";

        if (!phoneNumberId || !externalMessageId || !fromPhone || !text) {
          continue;
        }

        inbound.push({
          externalMessageId,
          phoneNumberId,
          fromPhone,
          fromName,
          text,
          timestamp,
          rawMessage: msg,
        });
      }
    }
  }

  return inbound;
}
