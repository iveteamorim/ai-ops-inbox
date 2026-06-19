import { createHmac, timingSafeEqual } from "crypto";

export function verifySvixWebhookSignature(
  rawBody: string,
  headers: {
    id: string | null;
    timestamp: string | null;
    signature: string | null;
  },
  secret: string | undefined,
) {
  if (!secret || !headers.id || !headers.timestamp || !headers.signature) {
    return false;
  }

  const normalizedSecret = secret.startsWith("whsec_") ? secret.slice("whsec_".length) : secret;
  let secretBytes: Buffer;

  try {
    secretBytes = Buffer.from(normalizedSecret, "base64");
  } catch {
    return false;
  }

  const signedContent = `${headers.id}.${headers.timestamp}.${rawBody}`;
  const expected = createHmac("sha256", secretBytes).update(signedContent).digest("base64");

  const signatures = headers.signature.split(" ");
  for (const entry of signatures) {
    const [version, value] = entry.split(",");
    if (version !== "v1" || !value) continue;

    try {
      if (timingSafeEqual(Buffer.from(value), Buffer.from(expected))) {
        return true;
      }
    } catch {
      continue;
    }
  }

  return false;
}

export type ResendInboundEvent = {
  type: string;
  data: {
    email_id: string;
    from: string;
    to: string[];
    subject: string;
  };
};

export function parseResendInboundEvent(payload: unknown): ResendInboundEvent | null {
  if (!payload || typeof payload !== "object") return null;

  const type = "type" in payload && typeof payload.type === "string" ? payload.type : "";
  if (type !== "email.received") return null;

  const data = "data" in payload && payload.data && typeof payload.data === "object" ? payload.data : null;
  if (!data) return null;

  const emailId = "email_id" in data && typeof data.email_id === "string" ? data.email_id : "";
  const from = "from" in data && typeof data.from === "string" ? data.from : "";
  const subject = "subject" in data && typeof data.subject === "string" ? data.subject : "";
  const to = Array.isArray((data as { to?: unknown }).to)
    ? (data as { to: string[] }).to.filter((item) => typeof item === "string")
    : [];

  if (!emailId || !from || to.length === 0) {
    return null;
  }

  return {
    type,
    data: {
      email_id: emailId,
      from,
      to,
      subject,
    },
  };
}

export function parseEmailAddressHeader(value: string) {
  const trimmed = value.trim();
  const match = trimmed.match(/^(.*)<([^>]+)>$/);
  if (match) {
    const name = match[1]?.replace(/(^"|"$)/g, "").trim() || null;
    const email = match[2]?.trim().toLowerCase() ?? "";
    return { name, email };
  }

  return { name: null, email: trimmed.toLowerCase() };
}
