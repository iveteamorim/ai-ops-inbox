export type EmailReplyConfig = {
  from_email: string;
  from_name: string | null;
  reply_to: string | null;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmailAddress(value: string) {
  return EMAIL_PATTERN.test(value.trim());
}

export function normalizeEmailAddress(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim().toLowerCase();
}

export function parseEmailReplyConfig(
  config: Record<string, unknown> | null | undefined,
): EmailReplyConfig | null {
  if (!config) return null;

  const fromEmail = normalizeEmailAddress(config.reply_from_email);
  if (!fromEmail || !isValidEmailAddress(fromEmail)) {
    return null;
  }

  const fromName =
    typeof config.reply_from_name === "string" && config.reply_from_name.trim()
      ? config.reply_from_name.trim()
      : null;

  const replyToRaw = normalizeEmailAddress(config.reply_to);
  const replyTo = replyToRaw && isValidEmailAddress(replyToRaw) ? replyToRaw : null;

  return {
    from_email: fromEmail,
    from_name: fromName,
    reply_to: replyTo,
  };
}

export function buildEmailReplyConfigPatch(body: {
  from_email?: string;
  from_name?: string;
  reply_to?: string;
}): { ok: true; value: EmailReplyConfig } | { ok: false; error: string } {
  const fromEmail = normalizeEmailAddress(body.from_email);
  if (!fromEmail) {
    return { ok: false, error: "from_email_required" };
  }

  if (!isValidEmailAddress(fromEmail)) {
    return { ok: false, error: "invalid_from_email" };
  }

  const fromName =
    typeof body.from_name === "string" && body.from_name.trim() ? body.from_name.trim() : null;

  const replyToRaw = normalizeEmailAddress(body.reply_to);
  if (replyToRaw && !isValidEmailAddress(replyToRaw)) {
    return { ok: false, error: "invalid_reply_to" };
  }

  return {
    ok: true,
    value: {
      from_email: fromEmail,
      from_name: fromName,
      reply_to: replyToRaw || null,
    },
  };
}

export function emailReplyConfigToChannelConfig(config: EmailReplyConfig) {
  return {
    reply_from_email: config.from_email,
    reply_from_name: config.from_name,
    reply_to: config.reply_to,
  };
}

export function formatEmailFromHeader(config: EmailReplyConfig) {
  if (config.from_name) {
    return `${config.from_name} <${config.from_email}>`;
  }
  return config.from_email;
}
