function resolveInstagramAccessToken(channelAccessToken?: string | null) {
  const channelToken = channelAccessToken?.trim();
  if (channelToken) return channelToken;

  const instagramToken = process.env.INSTAGRAM_ACCESS_TOKEN?.trim();
  if (instagramToken) return instagramToken;

  const whatsappToken = process.env.WHATSAPP_ACCESS_TOKEN?.trim();
  if (whatsappToken) return whatsappToken;

  return null;
}

export async function sendInstagramText({
  instagramAccountId,
  to,
  text,
  accessToken,
}: {
  instagramAccountId: string;
  to: string;
  text: string;
  accessToken?: string | null;
}) {
  const token = resolveInstagramAccessToken(accessToken);

  if (!token) {
    throw new Error("instagram_access_token_not_configured");
  }

  const apiVersion = process.env.NEXT_PUBLIC_META_API_VERSION?.trim() || "v23.0";
  const response = await fetch(`https://graph.facebook.com/${apiVersion}/${instagramAccountId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      recipient: { id: to },
      message: { text },
    }),
  });

  const raw = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      typeof raw === "object" &&
      raw &&
      "error" in raw &&
      typeof raw.error === "object" &&
      raw.error &&
      "message" in raw.error &&
      typeof raw.error.message === "string"
        ? raw.error.message
        : `instagram_send_failed_${response.status}`;
    throw new Error(message);
  }

  const messageId =
    typeof raw === "object" && raw && "message_id" in raw
      ? String(raw.message_id)
      : typeof raw === "object" && raw && "id" in raw
        ? String(raw.id)
        : null;

  return {
    raw,
    messageId,
  };
}
