export function getPublicAppUrl(request?: Request) {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (configured) return configured;

  if (request) {
    try {
      return new URL(request.url).origin;
    } catch {
      // fall through
    }
  }

  return "https://app.novua.digital";
}
