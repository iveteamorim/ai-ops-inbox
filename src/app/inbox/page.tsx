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
  getTeamMembers,
} from "@/lib/app-data";
import { isNovuaInternalUser } from "@/lib/internal-access";

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

export default async function InboxPage({
  searchParams,
}: {
  searchParams?: Promise<{ unit?: string }>;
}) {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
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

  const [rows, team] = await Promise.all([
    getConversationViews(context.supabase, context.profile.company_id),
    getTeamMembers(context.supabase, context.profile.company_id),
  ]);
  const canSeeInternalSetup = isNovuaInternalUser(context.user.email);
  const unitOptions = Array.from(new Set(rows.map((row) => row.unit).filter((value): value is string => Boolean(value))));
  const selectedUnit = resolvedSearchParams?.unit?.trim() || "";
  const visibleRows = selectedUnit ? rows.filter((row) => row.unit === selectedUnit) : rows;
  const leadsAtRisk = rows.filter((row) => row.status === "new" || row.status === "no_response").length;
  const riskAmount = rows
    .filter((row) => row.status === "new" || row.status === "no_response")
    .reduce((sum, row) => sum + row.estimatedValue, 0);
  const lostAmount = rows
    .filter((row) => row.status === "lost")
    .reduce((sum, row) => sum + row.estimatedValue, 0);
  void team;

  return (
    <section className="page">
      <AppNav showSetup={canSeeInternalSetup} />
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
        {visibleRows.length === 0 ? (
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
          <>
            <form method="GET" className="actions" style={{ marginBottom: 12 }}>
              <select className="input row-select" name="unit" defaultValue={selectedUnit}>
                <option value="">{t("inbox_all_units")}</option>
                {unitOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <button className="mini-button" type="submit">
                {t("inbox_filter_units")}
              </button>
              {selectedUnit ? (
                <Link className="mini-button" href="/inbox">
                  {t("inbox_clear_unit_filter")}
                </Link>
              ) : null}
            </form>
            <table className="table">
            <thead>
              <tr>
                <th>{t("inbox_client")}</th>
                <th>{t("inbox_last_msg")}</th>
                <th>{t("inbox_unit")}</th>
                <th>{t("inbox_channel")}</th>
                <th>{t("inbox_status")}</th>
                <th>{t("inbox_score")}</th>
                <th>{t("inbox_assigned")}</th>
                <th>{t("inbox_value")}</th>
                <th>{t("inbox_actions")}</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => {
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
                    <td>{row.unit ?? t("inbox_no_unit")}</td>
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
                      <div className="label" style={{ marginTop: 4, marginBottom: 0, textTransform: "none" }}>
                        {row.leadType ?? t("inbox_unclassified")}
                      </div>
                    </td>
                    <td>
                      <div className="stack-actions">
                        <Link className="mini-button" href={`/conversation/${row.id}`}>
                          Abrir conversación
                        </Link>
                        <span className="note">
                          {t("inbox_recover_prefix")} {format(recoverable)}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            </table>
          </>
        )}
      </article>
    </section>
  );
}
