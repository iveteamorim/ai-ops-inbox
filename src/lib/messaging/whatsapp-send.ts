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

  const cleanPhone = to.replace(/\D/g, "");

  const response = await fetch(
    `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: cleanPhone,
        type: "text",
        text: {
          body: text,
        },
      }),
    },
  );

  const raw = await response.text();

  console.log("WHATSAPP RESPONSE:", raw);

  if (!response.ok) {
    throw new Error(`WhatsApp send failed: ${raw}`);
  }

  const parsed = JSON.parse(raw);

  return {
    raw: parsed,
    messageId: parsed.messages?.[0]?.id ?? null,
  };
}