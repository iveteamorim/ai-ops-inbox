export async function sendWhatsAppText({
  phoneNumberId,
  to,
  text,
}: {
  phoneNumberId: string;
  to: string;
  text: string;
}) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!token) {
    throw new Error("Missing WHATSAPP_ACCESS_TOKEN");
  }

  const response = await fetch(`https://graph.facebook.com/v22.0/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: text },
    }),
  });

 if (!response.ok) {
    throw new Error(`WhatsApp send failed: ${await response.text()}`);
  }

  const data = await response.json();

  return {
    raw: data,
    messageId: data?.messages?.[0]?.id ?? null,
  };
}