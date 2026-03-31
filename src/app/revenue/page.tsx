import Link from "next/link";
import { cookies, headers } from "next/headers";
import { AppNav } from "@/components/AppNav";
import { detectCurrencyFromLocale } from "@/lib/i18n/currency";
import { LANG_COOKIE, normalizeLang } from "@/lib/i18n/config";
import { translate } from "@/lib/i18n/dictionaries";
import { formatStatus, formatRelativeTime, getAppContext, getConversationViews } from "@/lib/app-data";
import { isNovuaInternalUser } from "@/lib/internal-access";

function formatMoney(lang: string, currency: "EUR" | "BRL", value: number) {
  return new Intl.NumberFormat(lang, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function RevenuePage() {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const lang = normalizeLang(cookieStore.get(LANG_COOKIE)?.value);
  const t = (key: Parameters<typeof translate>[1]) => translate(lang, key);
  const currency = detectCurrencyFromLocale(headerStore.get("accept-language"));
  const format = (value: number) => formatMoney(lang, currency, value);

  const context = await getAppContext();
  if (context.kind !== "ready") {
    return (
      <section className="page">
        <AppNav />
        <header className="header">
          <div>
            <h1 className="title">{t("revenue_title")}</h1>
            <p className="subtitle">Revenue views require a configured tenant and real conversation data.</p>
          </div>
        </header>
      </section>
    );
  }
  const canSeeInternalSetup = isNovuaInternalUser(context.user.email);

  const opportunities = await getConversationViews(context.supabase, context.profile.company_id);
  const sortedOpportunities = [...opportunities].sort((a, b) => {
    return (
      b.estimatedValue - a.estimatedValue ||
      new Date(b.lastMessageAt ?? 0).getTime() - new Date(a.lastMessageAt ?? 0).getTime()
    );
  });
  const monthPotential = opportunities.reduce((sum, item) => sum + item.estimatedValue, 0);
  const atRisk = opportunities
    .filter((item) => item.status === "new" || item.status === "no_response")
    .reduce((sum, item) => sum + item.estimatedValue, 0);
  const lostEstimated = opportunities
    .filter((item) => item.status === "lost")
    .reduce((sum, item) => sum + item.estimatedValue, 0);

  return (
    <section className="page">
      <AppNav showSetup={canSeeInternalSetup} />
      <header className="header">
        <div>
          <h1 className="title">{t("revenue_title")}</h1>
          <p className="subtitle">{t("revenue_subtitle")}</p>
        </div>
      </header>

      <div className="grid cols-3">
        <article className="card"><p className="label">{t("revenue_month_potential")}</p><p className="kpi">{format(monthPotential)}</p></article>
        <article className="card"><p className="label">{t("revenue_at_risk")}</p><p className="kpi warn">{format(atRisk)}</p></article>
        <article className="card"><p className="label">{t("revenue_lost_estimated")}</p><p className="kpi warn">{format(lostEstimated)}</p></article>
      </div>

      <article className="card" style={{ marginTop: 12 }}>
        {sortedOpportunities.length === 0 ? (
          <div className="empty-state">
            <h3>{t("revenue_empty_title")}</h3>
            <p>{t("revenue_empty_text")}</p>
            <div className="actions" style={{ marginTop: 12 }}>
              <Link className="button" href="/inbox">
                Go to inbox
              </Link>
              <Link className="mini-button" href="/settings#channels-setup">
                Review setup
              </Link>
            </div>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>{t("revenue_client")}</th>
                <th>{t("dashboard_lead")}</th>
                <th>{t("revenue_estimated")}</th>
                <th>{t("revenue_expected")}</th>
                <th>{t("inbox_status")}</th>
                <th>{t("revenue_last_contact")}</th>
              </tr>
            </thead>
            <tbody>
              {sortedOpportunities.map((item) => (
                <tr key={item.id}>
                  <td>
                    <Link href={`/conversation/${item.id}`}>{item.contactName}</Link>
                  </td>
                  <td>{item.leadType ?? t("inbox_unclassified")}</td>
                  <td>{format(item.estimatedValue)}</td>
                  <td>{format(item.expectedValue)}</td>
                  <td>{formatStatus(item.status, t)}</td>
                  <td>{formatRelativeTime(item.lastMessageAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </article>
    </section>
  );
}
