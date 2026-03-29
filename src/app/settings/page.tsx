import { AppNav } from "@/components/AppNav";
import { cookies } from "next/headers";
import { LANG_COOKIE, normalizeLang } from "@/lib/i18n/config";
import { translate } from "@/lib/i18n/dictionaries";
import { formatChannel, getAppContext, getSettingsData } from "@/lib/app-data";

function getSetupCopy(lang: string) {
  if (lang === "es") {
    return {
      channelsEmpty: "WhatsApp se configura con Novua durante el onboarding.",
      channelUsage: "Se usa para recibir y responder mensajes entrantes.",
      channelsNote: "Configurado por Novua durante onboarding.",
      requestSetup: "Solicitar setup",
      requestWhatsAppSetup: "Solicitar setup de WhatsApp",
      usersNote: "Invita al equipo cuando el sistema esté activo.",
      systemStatusTitle: "Estado del sistema",
      channelsConnected: "Canales conectados",
      aiSystem: "Sistema IA",
      followUps: "Follow-ups",
      nextStep: "Siguiente paso",
      nextStepText: "Solicitar setup de WhatsApp para empezar a recibir conversaciones.",
    };
  }

  if (lang === "pt") {
    return {
      channelsEmpty: "O WhatsApp é configurado com a Novua durante o onboarding.",
      channelUsage: "É usado para receber e responder a mensagens de entrada.",
      channelsNote: "Configurado pela Novua durante o onboarding.",
      requestSetup: "Solicitar setup",
      requestWhatsAppSetup: "Solicitar setup de WhatsApp",
      usersNote: "Convide a equipa quando o sistema estiver ativo.",
      systemStatusTitle: "Estado do sistema",
      channelsConnected: "Canais conectados",
      aiSystem: "Sistema IA",
      followUps: "Follow-ups",
      nextStep: "Próximo passo",
      nextStepText: "Solicitar setup de WhatsApp para começar a receber conversas.",
    };
  }

  return {
    channelsEmpty: "WhatsApp is configured with Novua during onboarding.",
    channelUsage: "Used to receive and respond to inbound messages.",
    channelsNote: "Configured by Novua during onboarding.",
    requestSetup: "Request setup",
    requestWhatsAppSetup: "Request WhatsApp setup",
    usersNote: "Invite the team once the system is active.",
    systemStatusTitle: "System status",
    channelsConnected: "Channels connected",
    aiSystem: "AI system",
    followUps: "Follow-ups",
    nextStep: "Next step",
    nextStepText: "Request WhatsApp setup to start receiving conversations.",
  };
}

export default async function SettingsPage() {
  const cookieStore = await cookies();
  const lang = normalizeLang(cookieStore.get(LANG_COOKIE)?.value);
  const t = (key: Parameters<typeof translate>[1]) => translate(lang, key);
  const copy = getSetupCopy(lang);

  const context = await getAppContext();
  if (context.kind !== "ready") {
    return (
      <section className="page">
        <AppNav />
        <header className="header">
          <div>
            <h1 className="title">{t("settings_title")}</h1>
            <p className="subtitle">Settings require a configured authenticated workspace.</p>
          </div>
        </header>
      </section>
    );
  }

  const { channels, team } = await getSettingsData(context.supabase, context.profile.company_id);
  const hasWebhookSecrets = Boolean(process.env.WHATSAPP_VERIFY_TOKEN && process.env.WHATSAPP_APP_SECRET);
  const connectedChannels = channels.filter((channel) => channel.is_active).length;

  return (
    <section className="page">
      <AppNav />
      <header className="header">
        <div>
          <h1 className="title">{t("settings_title")}</h1>
          <p className="subtitle">{t("settings_subtitle")}</p>
        </div>
      </header>

      <div className="grid cols-2">
        <article className="card">
          <p className="label">WhatsApp</p>
          {channels.length === 0 ? (
            <div className="setup-state">
              <div className="preview-row">
                <span>WhatsApp</span>
                <span className="badge status-no-response">{t("settings_disconnected")}</span>
              </div>
              <p className="note">{copy.channelUsage}</p>
              <p className="note">{copy.channelsNote}</p>
              <div className="actions" style={{ marginTop: 12 }}>
                <a className="button" href="mailto:?subject=Novua%20Inbox%20Setup">
                  {copy.requestWhatsAppSetup}
                </a>
              </div>
            </div>
          ) : (
            channels.map((channel) => (
              <div key={channel.id} className="preview-row">
                <span>{formatChannel(channel.type)}</span>
                <span className={`badge ${channel.is_active ? "status-active" : "status-no-response"}`}>
                  {channel.is_active ? t("settings_active") : t("settings_disconnected")}
                </span>
              </div>
            ))
          )}
        </article>

        <article className="card">
          <p className="label">{t("settings_ai_revenue")}</p>
          <div className="preview-row">
            <span>AI Assistance</span>
            <span className="badge status-active">{t("settings_active")}</span>
          </div>
          <div className="preview-row">
            <span>{t("settings_lead_score")}</span>
            <span className="badge status-active">{t("settings_active")}</span>
          </div>
          <div className="preview-row">
            <span>Follow-up automation</span>
            <span className="badge status-active">{t("settings_active")}</span>
          </div>
          <div className="preview-row">
            <span>WhatsApp webhook</span>
            <span className={`badge ${hasWebhookSecrets ? "status-active" : "status-no-response"}`}>
              {hasWebhookSecrets ? t("settings_active") : t("settings_disconnected")}
            </span>
          </div>
        </article>

        <article className="card">
          <p className="label">{t("settings_users")}</p>
          {team.length === 0 ? (
            <p className="subtitle">No team members found.</p>
          ) : (
            <>
              {team.map((member) => (
                <div key={member.id} className="preview-row">
                  <span>{member.full_name ?? "Unnamed user"} ({member.role})</span>
                  <span className="badge status-active">{t("settings_active")}</span>
                </div>
              ))}
              <p className="note">{copy.usersNote}</p>
            </>
          )}
        </article>

        <article className="card" id="request-setup">
          <p className="label">{copy.systemStatusTitle}</p>
          <div className="preview-row">
            <span>{copy.channelsConnected}</span>
            <span className={`badge ${connectedChannels > 0 ? "status-active" : "status-no-response"}`}>{connectedChannels}</span>
          </div>
          <div className="preview-row">
            <span>{copy.aiSystem}</span>
            <span className="badge status-active">{t("settings_active")}</span>
          </div>
          <div className="preview-row">
            <span>{copy.followUps}</span>
            <span className="badge status-active">{t("settings_active")}</span>
          </div>
          <p className="label" style={{ marginTop: 16 }}>{copy.nextStep}</p>
          <p className="subtitle">{copy.nextStepText}</p>
        </article>
      </div>
    </section>
  );
}
