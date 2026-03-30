import Link from "next/link";
import { cookies, headers } from "next/headers";
import { AppNav } from "@/components/AppNav";
import { detectCurrencyFromLocale } from "@/lib/i18n/currency";
import { LANG_COOKIE, normalizeLang } from "@/lib/i18n/config";
import { translate } from "@/lib/i18n/dictionaries";
import {
  formatPriority,
  formatRelativeTime,
  formatStatus,
  getAppContext,
  getConversationViews,
} from "@/lib/app-data";
import { isNovuaInternalUser } from "@/lib/internal-access";

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
  const canSeeInternalSetup = isNovuaInternalUser(context.user.email);

  const conversations = await getConversationViews(context.supabase, context.profile.company_id);
  const openStatuses = new Set(["new", "active", "no_response"]);
  const leadsToday = conversations.filter((item) => {
    const created = new Date(item.createdAt).toDateString();
    return created === new Date().toDateString();
  }).length;
  const unanswered = conversations.filter((item) => item.status === "new" || item.status === "no_response").length;
  const revenueAtRisk = conversations
    .filter((item) => item.status === "new" || item.status === "no_response")
    .reduce((sum, item) => sum + item.estimatedValue, 0);
  const queue = conversations
    .filter((item) => openStatuses.has(item.status))
    .sort((a, b) => {
      const priorityScore = { high: 3, medium: 2, low: 1 };
      return (
        priorityScore[b.aiPriority] - priorityScore[a.aiPriority] ||
        b.estimatedValue - a.estimatedValue ||
        (new Date(b.lastMessageAt ?? 0).getTime() - new Date(a.lastMessageAt ?? 0).getTime())
      );
    })
    .slice(0, 5);

  return (
    <section className="page">
      <AppNav showSetup={canSeeInternalSetup} />
      <header className="header">
        <div>
          <h1 className="title">{t("dashboard_title")}</h1>
          <p className="subtitle">
            {context.company?.name ?? "Novua Inbox"} operational view for leads, risk and revenue.
          </p>
        </div>
      </header>

      <div className="grid cols-3" style={{ marginBottom: 12 }}>
        <article className="card">
          <p className="label">{t("dashboard_leads_today")}</p>
          <p className="kpi">{leadsToday}</p>
        </article>
        <article className="card">
          <p className="label">{t("dashboard_no_reply")}</p>
          <p className="kpi warn">{unanswered}</p>
        </article>
        <article className="card">
          <p className="label">{t("dashboard_revenue_risk")}</p>
          <p className="kpi warn">{format(revenueAtRisk)}</p>
        </article>
      </div>

      <div className="grid cols-2">
        <article className="card">
          <p className="label">{t("dashboard_priority_queue")}</p>
          {queue.length === 0 ? (
            <div className="empty-state">
              <h3>No active conversations yet</h3>
              <p>Connect a channel or create inbound traffic to populate the queue.</p>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>{t("dashboard_lead")}</th>
                  <th>{t("dashboard_risk")}</th>
                  <th>{t("dashboard_value")}</th>
                  <th>{t("dashboard_action")}</th>
                </tr>
              </thead>
              <tbody>
                {queue.map((item) => (
                  <tr key={item.id}>
                    <td>{item.contactName}</td>
                    <td>{formatPriority(item.aiPriority, t)}</td>
                    <td>{format(item.estimatedValue)}</td>
                    <td>
                      <Link href={`/conversation/${item.id}`}>
                        {formatStatus(item.status, t)}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </article>

        <article className="card">
          <p className="label">{t("dashboard_recent_activity")}</p>
          {conversations.length === 0 ? (
            <div className="empty-state">
              <h3>No activity yet</h3>
              <p>Recent conversation events will appear here once messages start flowing.</p>
            </div>
          ) : (
            conversations.slice(0, 4).map((item) => (
              <div key={item.id} className="preview-row">
                <span>
                  <strong>{item.contactName}</strong> · {item.lastMessageText}
                </span>
                <span>{formatRelativeTime(item.lastMessageAt)}</span>
              </div>
            ))
          )}
        </article>
      </div>
    </section>
  );
}
