import {
  isValidEmailAddress,
  normalizeEmailAddress,
  type EmailReplyConfig,
} from "@/lib/messaging/email-config";

export type EmailReplyConfigState = EmailReplyConfig & {
  verified: boolean;
};

export function parseEmailReplyConfigState(
  config: Record<string, unknown> | null | undefined,
): EmailReplyConfigState | null {
  if (!config) return null;

  const fromEmail = normalizeEmailAddress(config.reply_from_email);
  if (!fromEmail || !isValidEmailAddress(fromEmail)) {
    return null;
  }

  const fromName =
    typeof config.reply_from_name === "string" && config.reply_from_name.trim()
      ? config.reply_from_name.trim()
      : null;

  const verified = config.reply_email_verified === true;

  return {
    from_email: fromEmail,
    from_name: fromName,
    reply_to: fromEmail,
    verified,
  };
}

export function isReplyEmailReady(config: Record<string, unknown> | null | undefined) {
  const parsed = parseEmailReplyConfigState(config);
  return Boolean(parsed?.verified);
}

export function emailReplyConfigStateToChannelConfig(config: EmailReplyConfigState) {
  return {
    reply_from_email: config.from_email,
    reply_from_name: config.from_name,
    reply_to: config.from_email,
    reply_email_verified: config.verified,
    reply_email_verified_at: new Date().toISOString(),
  };
}

export function pendingVerificationToChannelConfig(pending: {
  email: string;
  from_name: string | null;
  code: string;
  expires_at: string;
}) {
  return {
    reply_from_email: pending.email,
    reply_from_name: pending.from_name,
    reply_email_verified: false,
    reply_email_pending: {
      email: pending.email,
      code: pending.code,
      expires_at: pending.expires_at,
      from_name: pending.from_name,
    },
  };
}
