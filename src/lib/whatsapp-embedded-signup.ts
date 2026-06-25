export type WhatsAppEmbeddedSignupRuntimeConfig = {
  appId: string;
  configId: string;
  apiVersion: string;
  enabled: boolean;
};

export function getWhatsAppEmbeddedSignupRuntimeConfig(): WhatsAppEmbeddedSignupRuntimeConfig {
  const appId = process.env.NEXT_PUBLIC_META_APP_ID?.trim() ?? "";
  const configId = process.env.NEXT_PUBLIC_WHATSAPP_EMBEDDED_SIGNUP_CONFIG_ID?.trim() ?? "";
  const apiVersion = process.env.NEXT_PUBLIC_META_API_VERSION?.trim() || "v23.0";
  const enabledFlag = (process.env.NEXT_PUBLIC_ENABLE_WHATSAPP_EMBEDDED_SIGNUP?.trim() ?? "").toLowerCase();

  return {
    appId,
    configId,
    apiVersion,
    enabled: enabledFlag === "true" && Boolean(appId && configId),
  };
}
