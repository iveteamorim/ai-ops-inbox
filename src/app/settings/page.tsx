import { AppNav } from "@/components/AppNav";
import { cookies } from "next/headers";
import { LANG_COOKIE, normalizeLang } from "@/lib/i18n/config";
import { translate } from "@/lib/i18n/dictionaries";
import { formatChannel, getAppContext, getSettingsData } from "@/lib/app-data";

function getSetupCopy(lang: string) {
  if (lang === "es") {
    return {
      channelsEmpty: "WhatsApp se configura con Novua durante el onboarding.",
      channelsNote: "No pedimos al cliente que configure Meta solo. Reunimos credenciales y dejamos el canal listo.",
      requestSetup: "Solicitar setup",
      reviewPlan: "Ver plan",
      viewMetaDocs: "Ver docs de Meta",
      usersNote: "Invita al equipo cuando el workspace ya esté activo y conectado.",
      inviteUser: "Invitar usuario",
      aiNote: "La IA forma parte del sistema. Lo que se ajusta son reglas de uso, tono y automatización, no claves técnicas del cliente.",
      aiSettings: "Ajustes IA",
      viewGuide: "Ver guía",
      channelsSetupTitle: "WhatsApp onboarding",
      channelsSetupText: "Novua configura el canal contigo durante onboarding. El cliente no debería pasar por Meta Developers sin guía.",
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
        "El cliente compra el setup.",
        "Novua conecta canales y reglas.",
        "El equipo entra cuando todo ya funciona.",
      ],
    };
  }

  if (lang === "pt") {
    return {
      channelsEmpty: "O WhatsApp é configurado com a Novua durante o onboarding.",
      channelsNote: "Não pedimos ao cliente para configurar Meta sozinho. Recolhemos credenciais e deixamos o canal pronto.",
      requestSetup: "Solicitar setup",
      reviewPlan: "Ver plano",
      viewMetaDocs: "Ver docs da Meta",
      usersNote: "Convide a equipa quando o workspace já estiver ativo e conectado.",
      inviteUser: "Convidar utilizador",
      aiNote: "A IA faz parte do sistema. O que se ajusta são regras de uso, tom e automação, não chaves técnicas do cliente.",
      aiSettings: "Definições IA",
      viewGuide: "Ver guia",
      channelsSetupTitle: "Onboarding do WhatsApp",
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
        "O cliente compra o setup.",
        "A Novua conecta canais e regras.",
        "A equipa entra quando tudo já está a funcionar.",
      ],
    };
  }

  return {
    channelsEmpty: "WhatsApp is configured with Novua during onboarding.",
    channelsNote: "We do not expect the client to configure Meta alone. We gather credentials and leave the channel ready.",
    requestSetup: "Request setup",
    reviewPlan: "Review plan",
    viewMetaDocs: "View Meta docs",
    usersNote: "Invite the team once the workspace is active and connected.",
    inviteUser: "Invite user",
    aiNote: "AI is part of the system. What gets adjusted are usage rules, tone, and automation behavior, not client-side technical keys.",
    aiSettings: "AI settings",
    viewGuide: "View guide",
    channelsSetupTitle: "WhatsApp onboarding",
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
      "The client buys the setup.",
      "Novua connects channels and rules.",
      "The team enters once the system is already working.",
    ],
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

  return (
    <section className="page">
      <AppNav />
      <header className="header">
        <div>
          <h1 className="title">{t("settings_title")}</h1>
          <p className="subtitle">{t("settings_subtitle")}</p>
        </div>
      </header>

      <div className="grid cols-3">
        <article className="card">
          <p className="label">{t("settings_channels")}</p>
          {channels.length === 0 ? (
            <>
              <p className="subtitle">{copy.channelsEmpty}</p>
              <p className="note">{copy.channelsNote}</p>
              <div className="actions" style={{ marginTop: 12 }}>
                <a className="button" href="#request-setup">
                  {copy.requestSetup}
                </a>
                <a className="mini-button" href="#channels-setup">
                  {copy.reviewPlan}
                </a>
              </div>
            </>
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
            <a className="button" href="#ai-setup">
              {copy.aiSettings}
            </a>
            <a className="mini-button" href="#ai-setup">
              {copy.reviewPlan}
            </a>
          </div>
        </article>
      </div>

      <div className="grid cols-3" style={{ marginTop: 12 }}>
        <article className="card onboarding-card" id="channels-setup">
          <p className="label">{copy.channelsSetupTitle}</p>
          <p className="subtitle">{copy.channelsSetupText}</p>
          <ul className="clean-list">
            {copy.channelsSetupItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <div className="actions" style={{ marginTop: 12 }}>
            <a className="button" href="#request-setup">
              {copy.requestSetup}
            </a>
            <a className="mini-button" href="https://developers.facebook.com/" target="_blank" rel="noreferrer">
              {copy.viewMetaDocs}
            </a>
          </div>
        </article>

        <article className="card onboarding-card" id="ai-setup">
          <p className="label">{copy.aiSetupTitle}</p>
          <p className="subtitle">{copy.aiSetupText}</p>
          <ul className="clean-list">
            {copy.aiSetupItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <div className="actions" style={{ marginTop: 12 }}>
            <a className="button" href="#ai-setup">
              {copy.aiSettings}
            </a>
            <a className="mini-button" href="#request-setup">
              {copy.viewGuide}
            </a>
          </div>
        </article>

        <article className="card onboarding-card" id="request-setup">
          <p className="label">{copy.requestSetupTitle}</p>
          <p className="subtitle">{copy.requestSetupText}</p>
          <ul className="clean-list">
            {copy.requestSetupItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <div className="actions" style={{ marginTop: 12 }}>
            <a className="button" href="mailto:?subject=Novua%20Inbox%20Setup">
              {copy.requestSetup}
            </a>
          </div>
        </article>
      </div>
    </section>
  );
}
