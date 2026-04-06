import Link from "next/link";
import { cookies, headers } from "next/headers";
import { AppNav } from "@/components/AppNav";
import { detectCurrencyFromLocale } from "@/lib/i18n/currency";
import { LANG_COOKIE, normalizeLang } from "@/lib/i18n/config";
import { translate } from "@/lib/i18n/dictionaries";
import { formatNoReplyDuration, getAppContext, getConversationViews } from "@/lib/app-data";
import { canManageInternalWorkspace, getWorkspaceMode } from "@/lib/internal-access";

function formatMoney(lang: string, currency: "EUR" | "BRL", value: number) {
  return new Intl.NumberFormat(lang, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function DashboardPage() {
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
            <h1 className="title">{t("dashboard_title")}</h1>
            <p className="subtitle">Complete Supabase auth and tenant bootstrap to unlock the app.</p>
          </div>
        </header>
        <article className="card">
          <p className="warn" style={{ marginBottom: 0 }}>
            {context.kind === "unconfigured"
              ? "Missing Supabase environment variables."
              : context.kind === "profile_missing"
                ? "Authenticated user has no company/profile yet."
                : "Sign in to access the dashboard."}
          </p>
        </article>
      </section>
    );
  }
  const workspaceMode = getWorkspaceMode(context.company, context.user.email);
  const canSeeInternalSetup = canManageInternalWorkspace(workspaceMode);

  const conversations = await getConversationViews(context.supabase, context.profile.company_id);
  const riskThresholdMs = 2 * 60 * 60 * 1000;
  const now = Date.now();
  const actionQueue = conversations
    .filter((item) => {
      const inboundTime = item.lastInboundAt ? new Date(item.lastInboundAt).getTime() : null;
      const outboundTime = item.lastOutboundAt ? new Date(item.lastOutboundAt).getTime() : null;
      const customerWaiting = Boolean(inboundTime && (!outboundTime || inboundTime > outboundTime));
      const staleEnough = Boolean(inboundTime && now - inboundTime >= riskThresholdMs);
      const openConversation = item.status === "new" || item.status === "active" || item.status === "no_response";
      return openConversation && item.estimatedValue > 0 && customerWaiting && staleEnough;
    })
    .sort((a, b) => {
      const waitA = a.lastInboundAt ? now - new Date(a.lastInboundAt).getTime() : 0;
      const waitB = b.lastInboundAt ? now - new Date(b.lastInboundAt).getTime() : 0;
      return b.estimatedValue - a.estimatedValue || waitB - waitA;
    })
    .slice(0, 5);
  const actionQueueValue = actionQueue.reduce((sum, item) => sum + item.estimatedValue, 0);
  const revenueAtRisk = actionQueueValue;

  return (
    <section className="page">
      <AppNav
        showSetup={canSeeInternalSetup}
        showLocale={canSeeInternalSetup}
        userName={context.profile.full_name ?? context.user.email ?? null}
        userRole={context.profile.role}
      />
      <header className="header">
        <div>
          <h1 className="title">{t("dashboard_title")}</h1>
          <p className="subtitle">
            {context.company?.name ?? "Novua Inbox"} operational view for leads, risk and revenue.
          </p>
        </div>
      </header>

      <div className="grid cols-2" style={{ marginBottom: 12 }}>
        <article className="card">
          <p className="label">{t("dashboard_revenue_risk")}</p>
          <p className="kpi warn">{format(revenueAtRisk)}</p>
        </article>
        <article className="card">
          <p className="label">{t("dashboard_pending_conversations")}</p>
          <p className="kpi">{actionQueue.length}</p>
        </article>
      </div>

      <article className="card" style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline", marginBottom: 12, flexWrap: "wrap" }}>
          <div>
            <p className="label">{t("revenue_risk_queue_title")}</p>
            <p className="subtitle" style={{ margin: 0 }}>{t("revenue_risk_queue_subtitle")}</p>
          </div>
          <p className="kpi warn" style={{ margin: 0 }}>
            {format(actionQueueValue)} · {actionQueue.length} {t("dashboard_pending_conversations").toLowerCase()}
          </p>
        </div>

        {actionQueue.length === 0 ? (
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
              {actionQueue.map((item) => (
                <tr key={item.id}>
                  <td>
                    <span>{item.contactName}</span>
                  </td>
                  <td>{item.leadType ?? t("inbox_unclassified")}</td>
                  <td><strong>{format(item.estimatedValue)}</strong></td>
                  <td><span className="subtitle" style={{ margin: 0 }}>{formatNoReplyDuration(item.lastInboundAt ?? item.lastMessageAt)}</span></td>
                  <td>
                    <Link className="button" href={`/conversation/${item.id}`}>
                      {t("dashboard_action_reply_now")}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </article>
    </section>
  );
}
