import {
  formatEmailFromHeader,
  type EmailReplyConfig,
} from "@/lib/messaging/email-config";
import { getPlatformFromEmail } from "@/lib/messaging/email-platform";

type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  replyConfig: EmailReplyConfig;
  inReplyTo?: string | null;
  usePlatformSender?: boolean;
};

type SendEmailResult = {
  messageId: string | null;
  raw: unknown;
};

function buildOutboundFromHeader(replyConfig: EmailReplyConfig, usePlatformSender: boolean) {
  if (!usePlatformSender) {
    return formatEmailFromHeader(replyConfig);
  }

  const displayName = replyConfig.from_name?.trim() || replyConfig.from_email.split("@")[0];
  const platformFrom = getPlatformFromEmail();
  const platformAddressMatch = platformFrom.match(/<([^>]+)>/);
  const platformAddress = platformAddressMatch?.[1]?.trim() || platformFrom;

  return `${displayName} <${platformAddress}>`;
}

export function isEmailSendingConfigured() {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

export async function sendEmailText(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("email_provider_not_configured");
  }

  const usePlatformSender = input.usePlatformSender !== false;
  const replyTo = input.replyConfig.reply_to || input.replyConfig.from_email;

  const payload: Record<string, unknown> = {
    from: buildOutboundFromHeader(input.replyConfig, usePlatformSender),
    to: [input.to],
    subject: input.subject,
    text: input.text,
    reply_to: replyTo,
  };

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

export async function sendVerificationEmail({
  to,
  code,
  businessName,
}: {
  to: string;
  code: string;
  businessName: string | null;
}) {
  const label = businessName?.trim() || "Novua";
  return sendEmailText({
    to,
    subject: `${code} — confirma tu email en Novua`,
    text: [
      `Hola${businessName ? ` ${businessName}` : ""},`,
      "",
      `Tu código de confirmación en Novua es: ${code}`,
      "",
      "Introdúcelo en Settings para activar las respuestas por email a tus leads.",
      "",
      "Si no solicitaste esto, ignora este mensaje.",
      "",
      "— Novua",
    ].join("\n"),
    replyConfig: {
      from_email: to,
      from_name: label,
      reply_to: null,
    },
    usePlatformSender: true,
  });
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
