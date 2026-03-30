export function isNovuaInternalUser(email?: string | null) {
  if (!email) return false;

  const normalizedEmail = email.trim().toLowerCase();
  const allowedEmails = (
    process.env.NOVUA_INTERNAL_EMAILS?.split(",") ?? ["iveteamorim@gmail.com", "saraarubioo1@gmail.com"]
  )
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  const allowedDomains = (process.env.NOVUA_INTERNAL_DOMAINS?.split(",") ?? ["novua.digital"])
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  if (allowedEmails.includes(normalizedEmail)) {
    return true;
  }

  const domain = normalizedEmail.split("@")[1] ?? "";
  return allowedDomains.includes(domain);
}
