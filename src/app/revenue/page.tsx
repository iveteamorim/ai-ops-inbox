import Link from "next/link";
import { cookies, headers } from "next/headers";
import { AppNav } from "@/components/AppNav";
import { detectCurrencyFromLocale } from "@/lib/i18n/currency";
import { LANG_COOKIE, normalizeLang } from "@/lib/i18n/config";
import { translate } from "@/lib/i18n/dictionaries";
import { formatNoReplyDuration, formatStatus, formatRelativeTime, getAppContext, getConversationViews } from "@/lib/app-data";
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
  const openPotential = opportunities
    .filter((item) => item.status === "new" || item.status === "active" || item.status === "no_response")
    .reduce((sum, item) => sum + item.estimatedValue, 0);
  const recoveredRevenue = opportunities
    .filter((item) => item.status === "won")
    .reduce((sum, item) => sum + (item.expectedValue || item.estimatedValue), 0);
  const lostEstimated = opportunities
    .filter((item) => item.status === "lost")
    .reduce((sum, item) => sum + item.estimatedValue, 0);
  const riskThresholdMs = 2 * 60 * 60 * 1000;
  const now = Date.now();
  const atRiskQueue = sortedOpportunities.filter((item) => {
    const inboundTime = item.lastInboundAt ? new Date(item.lastInboundAt).getTime() : null;
    const outboundTime = item.lastOutboundAt ? new Date(item.lastOutboundAt).getTime() : null;
    const customerWaiting = Boolean(
      inboundTime &&
      (!outboundTime || inboundTime > outboundTime),
    );
    const staleEnough = Boolean(inboundTime && now - inboundTime >= riskThresholdMs);
    const openConversation = item.status === "new" || item.status === "active" || item.status === "no_response";
    return openConversation && item.estimatedValue > 0 && customerWaiting && staleEnough;
  });
  const atRisk = atRiskQueue.reduce((sum, item) => sum + item.estimatedValue, 0);
  const byLeadType = Array.from(
    opportunities.reduce((map, item) => {
      const key = item.leadType ?? t("inbox_unclassified");
      const current = map.get(key) ?? { leadType: key, count: 0, estimatedValue: 0 };
      current.count += 1;
      current.estimatedValue += item.estimatedValue;
      map.set(key, current);
      return map;
    }, new Map<string, { leadType: string; count: number; estimatedValue: number }>()).values(),
  ).sort((a, b) => b.estimatedValue - a.estimatedValue);
  const topLeadTypes = byLeadType.slice(0, 6);
  const hiddenLeadTypesCount = Math.max(0, byLeadType.length - topLeadTypes.length);

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
        <article className="card"><p className="label">{t("revenue_open_pipeline")}</p><p className="kpi">{format(openPotential)}</p></article>
        <article className="card"><p className="label">{t("revenue_at_risk")}</p><p className="kpi warn">{format(atRisk)}</p></article>
        <article className="card"><p className="label">{t("revenue_recovered")}</p><p className="kpi">{format(recoveredRevenue)}</p></article>
      </div>

      <div className="grid cols-2" style={{ marginTop: 12 }}>
        <article className="card"><p className="label">{t("revenue_lost_estimated")}</p><p className="kpi warn">{format(lostEstimated)}</p></article>
        <article className="card">
          <p className="label">{t("revenue_business_states")}</p>
          <p className="subtitle" style={{ margin: 0 }}>
            {opportunities.filter((item) => item.status === "new" || item.status === "active" || item.status === "no_response").length}{" "}
            {t("revenue_active_opportunities").toLowerCase()} ·{" "}
            {opportunities.filter((item) => item.status === "won").length} {t("revenue_filter_won").toLowerCase()} ·{" "}
            {opportunities.filter((item) => item.status === "lost").length} {t("revenue_filter_lost").toLowerCase()}
          </p>
        </article>
      </div>

      <article className="card" style={{ marginTop: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline", marginBottom: 12 }}>
          <div>
            <p className="label">{t("revenue_risk_queue_title")}</p>
            <p className="subtitle" style={{ margin: 0 }}>{t("revenue_risk_queue_subtitle")}</p>
          </div>
          <p className="kpi warn" style={{ margin: 0 }}>{format(atRiskQueue.reduce((sum, item) => sum + item.estimatedValue, 0))}</p>
        </div>

        {atRiskQueue.length === 0 ? (
          <div className="empty-state">
            <h3>{t("revenue_risk_queue_empty_title")}</h3>
            <p>{t("revenue_risk_queue_empty_text")}</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>{t("revenue_client")}</th>
                <th>{t("dashboard_lead")}</th>
                <th>{t("revenue_estimated")}</th>
                <th>{t("revenue_last_contact")}</th>
                <th>{t("dashboard_action")}</th>
              </tr>
            </thead>
            <tbody>
              {atRiskQueue.map((item) => (
                <tr key={item.id}>
                  <td>{item.contactName}</td>
                  <td>{item.leadType ?? t("inbox_unclassified")}</td>
                  <td>{format(item.estimatedValue)}</td>
                  <td>{formatNoReplyDuration(item.lastInboundAt ?? item.lastMessageAt)}</td>
                  <td>
                    <Link className="mini-button" href={`/conversation/${item.id}`}>
                      {t("dashboard_action_reply_now")}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </article>

      {byLeadType.length > 0 ? (
        <article className="card" style={{ marginTop: 12 }}>
          <p className="label" style={{ marginBottom: 12 }}>{t("dashboard_lead")}</p>
          <div className="grid cols-3">
            {topLeadTypes.map((item) => (
              <div key={item.leadType} className="card" style={{ padding: 16 }}>
                <p className="label" style={{ marginBottom: 6 }}>{item.leadType}</p>
                <p className="kpi" style={{ marginBottom: 6 }}>{format(item.estimatedValue)}</p>
                <p className="subtitle" style={{ margin: 0 }}>
                  {item.count} {item.count === 1 ? t("revenue_conversation_singular") : t("revenue_conversation_plural")}
                </p>
              </div>
            ))}
            {hiddenLeadTypesCount > 0 ? (
              <div className="card" style={{ padding: 16 }}>
                <p className="label" style={{ marginBottom: 6 }}>{t("revenue_more_types_label")}</p>
                <p className="kpi" style={{ marginBottom: 6 }}>+{hiddenLeadTypesCount}</p>
                <p className="subtitle" style={{ margin: 0 }}>{t("revenue_more_types_subtitle")}</p>
              </div>
            ) : null}
          </div>
        </article>
      ) : null}

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
                <th>{t("revenue_potential")}</th>
                <th>{t("revenue_recovered")}</th>
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
                  <td>{item.status === "won" ? format(item.expectedValue || item.estimatedValue) : "—"}</td>
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
