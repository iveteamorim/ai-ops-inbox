import { randomInt } from "crypto";

export type PendingEmailVerification = {
  email: string;
  code: string;
  expires_at: string;
  from_name: string | null;
};

const VERIFICATION_TTL_MS = 15 * 60 * 1000;

export function createVerificationCode() {
  return String(randomInt(100000, 999999));
}

export function buildPendingEmailVerification(email: string, fromName: string | null): PendingEmailVerification {
  return {
    email,
    code: createVerificationCode(),
    expires_at: new Date(Date.now() + VERIFICATION_TTL_MS).toISOString(),
    from_name: fromName,
  };
}

export function isPendingVerificationValid(
  pending: PendingEmailVerification | null | undefined,
  email: string,
  code: string,
) {
  if (!pending) return false;
  if (pending.email !== email.trim().toLowerCase()) return false;
  if (pending.code !== code.trim()) return false;
  if (Date.now() > new Date(pending.expires_at).getTime()) return false;
  return true;
}

export function getPlatformFromEmail() {
  return (
    process.env.NOVUA_PLATFORM_FROM_EMAIL?.trim() ||
    process.env.RESEND_FROM_EMAIL?.trim() ||
    "Novua <onboarding@resend.dev>"
  );
}

export function getPlatformFromName() {
  const raw = getPlatformFromEmail();
  const match = raw.match(/^(.*)<([^>]+)>$/);
  if (match?.[1]?.trim()) {
    return match[1].trim().replace(/(^"|"$)/g, "");
  }
  return "Novua";
}

export function getPlatformFromAddress() {
  const raw = getPlatformFromEmail();
  const match = raw.match(/<([^>]+)>/);
  return match?.[1]?.trim() || raw;
}
