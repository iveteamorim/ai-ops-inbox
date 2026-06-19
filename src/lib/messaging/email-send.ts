import {
  formatEmailFromHeader,
  type EmailReplyConfig,
} from "@/lib/messaging/email-config";

type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  replyConfig: EmailReplyConfig;
  inReplyTo?: string | null;
};

type SendEmailResult = {
  messageId: string | null;
  raw: unknown;
};

export function isEmailSendingConfigured() {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

export async function sendEmailText(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("email_provider_not_configured");
  }

  const payload: Record<string, unknown> = {
    from: formatEmailFromHeader(input.replyConfig),
    to: [input.to],
    subject: input.subject,
    text: input.text,
  };

  if (input.replyConfig.reply_to) {
    payload.reply_to = input.replyConfig.reply_to;
  }

  if (input.inReplyTo) {
    payload.headers = {
      "In-Reply-To": input.inReplyTo,
    };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const raw = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      typeof raw === "object" &&
      raw &&
      "message" in raw &&
      typeof raw.message === "string"
        ? raw.message
        : `email_send_failed_${response.status}`;
    throw new Error(message);
  }

  return {
    messageId: typeof raw === "object" && raw && "id" in raw ? String(raw.id) : null,
    raw,
  };
}

export async function fetchInboundEmailBody(emailId: string) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("email_provider_not_configured");
  }

  const response = await fetch(`https://api.resend.com/emails/receiving/${emailId}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  const raw = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`inbound_email_fetch_failed_${response.status}`);
  }

  const text =
    typeof raw === "object" && raw && "text" in raw && typeof raw.text === "string"
      ? raw.text
      : typeof raw === "object" && raw && "html" in raw && typeof raw.html === "string"
        ? raw.html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
        : "";

  const subject =
    typeof raw === "object" && raw && "subject" in raw && typeof raw.subject === "string"
      ? raw.subject
      : "";

  const from =
    typeof raw === "object" && raw && "from" in raw && typeof raw.from === "string"
      ? raw.from
      : "";

  const to = Array.isArray((raw as { to?: unknown }).to)
    ? ((raw as { to: string[] }).to ?? [])
    : [];

  return { text, subject, from, to, raw };
}
