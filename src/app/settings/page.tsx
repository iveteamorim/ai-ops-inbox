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
      channelsNote: "No pedimos al cliente que configure Meta solo. Reunimos credenciales y dejamos el canal listo.",
      requestSetup: "Solicitar setup",
      requestWhatsAppSetup: "Solicitar setup de WhatsApp",
      viewMetaDocs: "Ver docs de Meta",
      usersNote: "Invita al equipo cuando el workspace ya esté activo y conectado.",
      inviteUser: "Invitar usuario",
      aiNote: "La IA forma parte del sistema. Lo que se ajusta son reglas de uso, tono y automatización, no claves técnicas del cliente.",
      aiSettings: "Ajustes IA",
      channelsSetupTitle: "Setup de WhatsApp",
      channelsSetupText: "Configuramos WhatsApp contigo durante el onboarding. El cliente no debería pasar por Meta Developers sin guía.",
      channelsSetupItems: [
        "Validamos el caso de uso y número de WhatsApp.",
        "Recogemos phone number ID, verify token y app secret.",
        "Conectamos webhook y hacemos prueba real de mensajes.",
      ],
      aiSetupTitle: "Ajustes de IA",
      aiSetupText: "La IA se presenta como capacidad activa del producto. Los ajustes se centran en comportamiento y operación.",
      aiSetupItems: [
        "Ajustamos tono y estilo de respuesta.",
        "Definimos scoring, follow-up y reglas de priorización.",
        "Revisamos idioma y comportamiento antes de activar automatizaciones.",
      ],
      requestSetupTitle: "Done-for-you setup",
      requestSetupText: "El modelo correcto ahora es setup guiado por Novua, no self-serve técnico.",
      requestSetupItems: [
        "Incluye conexión del número, sincronización de mensajes y webhook.",
        "La configuración suele quedar lista en unas 24h.",
        "El equipo entra cuando todo ya funciona.",
      ],
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
      channelsNote: "Não pedimos ao cliente para configurar Meta sozinho. Recolhemos credenciais e deixamos o canal pronto.",
      requestSetup: "Solicitar setup",
      requestWhatsAppSetup: "Solicitar setup de WhatsApp",
      viewMetaDocs: "Ver docs da Meta",
      usersNote: "Convide a equipa quando o workspace já estiver ativo e conectado.",
      inviteUser: "Convidar utilizador",
      aiNote: "A IA faz parte do sistema. O que se ajusta são regras de uso, tom e automação, não chaves técnicas do cliente.",
      aiSettings: "Definições IA",
      channelsSetupTitle: "Setup do WhatsApp",
      channelsSetupText: "A Novua configura o canal consigo durante o onboarding. O cliente não deve passar pelo Meta Developers sem orientação.",
      channelsSetupItems: [
        "Validamos o caso de uso e o número de WhatsApp.",
        "Recolhemos phone number ID, verify token e app secret.",
        "Ligamos o webhook e fazemos um teste real de mensagens.",
      ],
      aiSetupTitle: "Definições de IA",
      aiSetupText: "A IA deve aparecer como capacidade ativa do produto. Os ajustes focam comportamento e operação.",
      aiSetupItems: [
        "Ajustamos tom e estilo de resposta.",
        "Definimos scoring, follow-up e regras de priorização.",
        "Revemos idioma e comportamento antes de ativar automações.",
      ],
      requestSetupTitle: "Setup done-for-you",
      requestSetupText: "O modelo correto agora é setup guiado pela Novua, não self-serve técnico.",
      requestSetupItems: [
        "Inclui ligação do número, sincronização de mensagens e webhook.",
        "A configuração costuma ficar pronta em cerca de 24h.",
        "A equipa entra quando tudo já está a funcionar.",
      ],
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
    channelsNote: "We do not expect the client to configure Meta alone. We gather credentials and leave the channel ready.",
    requestSetup: "Request setup",
    requestWhatsAppSetup: "Request WhatsApp setup",
    viewMetaDocs: "View Meta docs",
    usersNote: "Invite the team once the workspace is active and connected.",
    inviteUser: "Invite user",
    aiNote: "AI is part of the system. What gets adjusted are usage rules, tone, and automation behavior, not client-side technical keys.",
    aiSettings: "AI settings",
    channelsSetupTitle: "WhatsApp setup",
    channelsSetupText: "Novua configures the channel with you during onboarding. The client should not be sent into Meta Developers alone.",
    channelsSetupItems: [
      "Validate the use case and WhatsApp number.",
      "Collect phone number ID, verify token, and app secret.",
      "Connect the webhook and run a real message test.",
    ],
    aiSetupTitle: "AI settings",
    aiSetupText: "AI should appear as an active product capability. Settings focus on behavior and operating rules.",
    aiSetupItems: [
      "Adjust tone and reply style.",
      "Define scoring, follow-up, and prioritization rules.",
      "Review language and behavior before enabling automations.",
    ],
    requestSetupTitle: "Done-for-you setup",
    requestSetupText: "The correct model right now is Novua-led onboarding, not technical self-serve.",
    requestSetupItems: [
      "It includes number connection, message sync, and webhook setup.",
      "Setup usually completes in about 24h.",
      "The team enters once the system is already working.",
    ],
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
          <p className="label">{t("settings_channels")}</p>
          {channels.length === 0 ? (
            <div className="setup-state">
              <div className="preview-row">
                <span>WhatsApp</span>
                <span className="badge status-no-response">{t("settings_disconnected")}</span>
              </div>
              <p className="note">{copy.channelUsage}</p>
              <p className="note">{copy.channelsEmpty}</p>
              <div className="actions" style={{ marginTop: 12 }}>
                <a className="button" href="#request-setup">
                  {copy.requestSetup}
                </a>
              </div>
              <details className="setup-panel" id="channels-setup">
                <summary>{copy.channelsSetupTitle}</summary>
                <p className="subtitle">{copy.channelsSetupText}</p>
                <ul className="clean-list">
                  {copy.channelsSetupItems.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <div className="actions" style={{ marginTop: 12 }}>
                  <a className="button" href="#request-setup">
                    {copy.requestWhatsAppSetup}
                  </a>
                  <a className="mini-button" href="https://developers.facebook.com/" target="_blank" rel="noreferrer">
                    {copy.viewMetaDocs}
                  </a>
                </div>
              </details>
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
          <p className="note">{copy.aiNote}</p>
          <div className="actions" style={{ marginTop: 12 }}>
            <a className="button" href="#ai-settings">
              {copy.aiSettings}
            </a>
          </div>
          <details className="setup-panel" id="ai-settings">
            <summary>{copy.aiSetupTitle}</summary>
            <p className="subtitle">{copy.aiSetupText}</p>
            <ul className="clean-list">
              {copy.aiSetupItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <div className="settings-grid">
              <div>
                <p className="label">Response tone</p>
                <p className="subtitle">Friendly · Professional</p>
              </div>
              <div>
                <p className="label">Language</p>
                <p className="subtitle">ES · PT · EN</p>
              </div>
              <div>
                <p className="label">Follow-up timing</p>
                <p className="subtitle">1h · 6h · 24h</p>
              </div>
            </div>
          </details>
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
              <div className="actions" style={{ marginTop: 12 }}>
                <a className="mini-button" href="mailto:?subject=Join%20Novua%20Inbox">
                  {copy.inviteUser}
                </a>
              </div>
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
          <details className="setup-panel" open>
            <summary>{copy.requestSetupTitle}</summary>
            <p className="subtitle">{copy.requestSetupText}</p>
            <ul className="clean-list">
              {copy.requestSetupItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <div className="actions" style={{ marginTop: 12 }}>
              <a className="button" href="mailto:?subject=Novua%20Inbox%20Setup">
                {copy.requestWhatsAppSetup}
              </a>
            </div>
          </details>
        </article>
      </div>
    </section>
  );
}
