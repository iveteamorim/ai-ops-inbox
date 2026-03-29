import { AppNav } from "@/components/AppNav";
import { cookies } from "next/headers";
import { LANG_COOKIE, normalizeLang } from "@/lib/i18n/config";
import { translate } from "@/lib/i18n/dictionaries";
import { formatChannel, getAppContext, getSettingsData } from "@/lib/app-data";

export default async function SettingsPage() {
  const cookieStore = await cookies();
  const lang = normalizeLang(cookieStore.get(LANG_COOKIE)?.value);
  const t = (key: Parameters<typeof translate>[1]) => translate(lang, key);

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
  const hasOpenAI = Boolean(process.env.OPENAI_API_KEY);
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
              <p className="subtitle">No channels configured yet.</p>
              <div className="actions" style={{ marginTop: 12 }}>
                <a
                  className="button"
                  href="https://developers.facebook.com/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Connect WhatsApp
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
              <div className="actions" style={{ marginTop: 12 }}>
                <a className="mini-button" href="mailto:?subject=Join%20Novua%20Inbox">
                  Invite user
                </a>
              </div>
            </>
          )}
        </article>

        <article className="card">
          <p className="label">{t("settings_ai_revenue")}</p>
          <div className="preview-row">
            <span>{t("settings_ai_suggestions")}</span>
            <span className={`badge ${hasOpenAI ? "status-active" : "status-no-response"}`}>
              {hasOpenAI ? t("settings_active") : t("settings_disconnected")}
            </span>
          </div>
          <div className="preview-row">
            <span>{t("settings_lead_score")}</span>
            <span className="badge status-active">{t("settings_active")}</span>
          </div>
          <div className="preview-row">
            <span>WhatsApp webhook</span>
            <span className={`badge ${hasWebhookSecrets ? "status-active" : "status-no-response"}`}>
              {hasWebhookSecrets ? t("settings_active") : t("settings_disconnected")}
            </span>
          </div>
          <div className="actions" style={{ marginTop: 12 }}>
            <a className="mini-button" href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer">
              Configure AI
            </a>
          </div>
        </article>
      </div>
    </section>
  );
}
