import Link from "next/link";
import { cookies, headers } from "next/headers";
import { AppNav } from "@/components/AppNav";
import { detectCurrencyFromLocale } from "@/lib/i18n/currency";
import { LANG_COOKIE, normalizeLang } from "@/lib/i18n/config";
import { translate } from "@/lib/i18n/dictionaries";
import {
  formatChannel,
  formatPriority,
  formatRelativeTime,
  formatStatus,
  getAppContext,
  getConversationViews,
} from "@/lib/app-data";

function formatMoney(lang: string, currency: "EUR" | "BRL", value: number) {
  return new Intl.NumberFormat(lang, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function statusClass(status: string) {
  if (status === "new") return "status-new";
  if (status === "active") return "status-active";
  if (status === "no_response") return "status-no-response";
  return "status-lost";
}

function priorityClass(priority: string) {
  if (priority === "high") return "score-high";
  if (priority === "medium") return "score-medium";
  return "score-low";
}

export default async function InboxPage() {
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
            <h1 className="title">{t("inbox_title")}</h1>
            <p className="subtitle">Connect Supabase and sign in to unlock the inbox.</p>
          </div>
        </header>
      </section>
    );
  }

  const rows = await getConversationViews(context.supabase, context.profile.company_id);
  const leadsAtRisk = rows.filter((row) => row.status === "new" || row.status === "no_response").length;
  const riskAmount = rows
    .filter((row) => row.status === "new" || row.status === "no_response")
    .reduce((sum, row) => sum + row.estimatedValue, 0);
  const lostAmount = rows
    .filter((row) => row.status === "lost")
    .reduce((sum, row) => sum + row.estimatedValue, 0);

  return (
    <section className="page">
      <AppNav />
      <header className="header">
        <div>
          <h1 className="title">{t("inbox_title")}</h1>
          <p className="subtitle">{t("inbox_subtitle")}</p>
        </div>
      </header>

      <article className="card" style={{ marginBottom: 12 }}>
        <p className="warn" style={{ marginBottom: 6 }}>
          {format(riskAmount)} {t("inbox_risk_money_now")}
        </p>
        <p className="subtitle" style={{ margin: 0 }}>
          {leadsAtRisk} {t("inbox_risk_line")}
        </p>
        <p className="subtitle" style={{ marginTop: 6 }}>
          {t("inbox_lost_today_prefix")} {format(lostAmount)} {t("inbox_lost_today_suffix")}
        </p>
      </article>

      <article className="card">
        {rows.length === 0 ? (
          <div className="empty-state">
            <h3>{t("inbox_empty_title")}</h3>
            <p>{t("inbox_empty_text")}</p>
            <div className="actions" style={{ marginTop: 12 }}>
              <Link className="button" href="/settings#channels-setup">
                Review setup
              </Link>
              <Link className="mini-button" href="/settings#request-setup">
                Request onboarding
              </Link>
            </div>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>{t("inbox_client")}</th>
                <th>{t("inbox_last_msg")}</th>
                <th>{t("inbox_channel")}</th>
                <th>{t("inbox_status")}</th>
                <th>{t("inbox_score")}</th>
                <th>{t("inbox_assigned")}</th>
                <th>{t("inbox_value")}</th>
                <th>{t("inbox_actions")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const recoverable = Math.max(0, row.estimatedValue - row.expectedValue);
                return (
                  <tr key={row.id}>
                    <td>
                      <Link href={`/conversation/${row.id}`}>{row.contactName}</Link>
                    </td>
                    <td>
                      {row.lastMessageText}
                      <div className="label" style={{ marginTop: 4, marginBottom: 0, textTransform: "none" }}>
                        {formatRelativeTime(row.lastMessageAt)}
                      </div>
                    </td>
                    <td>{formatChannel(row.channel)}</td>
                    <td>
                      <span className={`badge ${statusClass(row.status)}`}>{formatStatus(row.status, t)}</span>
                    </td>
                    <td>
                      <span className={`badge ${priorityClass(row.aiPriority)}`}>{formatPriority(row.aiPriority, t)}</span>
                    </td>
                    <td>{row.assignedTo ?? "Unassigned"}</td>
                    <td>
                      {format(row.estimatedValue)} {t("inbox_value_potential")} | {format(row.status === "won" ? row.expectedValue : 0)} {t("inbox_value_recovered")}
                    </td>
                    <td>
                      <Link className="mini-button" href={`/conversation/${row.id}`}>
                        {t("inbox_reply")} → {t("inbox_recover_prefix")} {format(recoverable)}
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </article>
    </section>
  );
}
