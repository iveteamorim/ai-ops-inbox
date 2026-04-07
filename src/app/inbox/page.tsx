import Link from "next/link";
import { cookies, headers } from "next/headers";
import { AppNav } from "@/components/AppNav";
import { AutoRefresh } from "@/components/AutoRefresh";
import { detectCurrencyFromLocale } from "@/lib/i18n/currency";
import { LANG_COOKIE, normalizeLang } from "@/lib/i18n/config";
import { translate } from "@/lib/i18n/dictionaries";
import {
  formatRelativeTime,
  formatStatus,
  getAppContext,
  getConversationViews,
  getTeamMembers,
} from "@/lib/app-data";
import { type DecisionType } from "@/lib/conversation-decision";
import { canManageInternalWorkspace, getWorkspaceMode } from "@/lib/internal-access";

function formatMoney(lang: string, currency: "EUR" | "BRL", value: number) {
  return new Intl.NumberFormat(lang, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function getNoReplyMeta(status: "new" | "active" | "won" | "lost" | "no_response", isoDate: string | null) {
  if (status !== "no_response" || !isoDate) {
    return { className: "", badgeLabel: null as string | null, timeLabel: formatRelativeTime(isoDate) };
  }

  const timestamp = new Date(isoDate).getTime();
  if (Number.isNaN(timestamp)) {
    return { className: "", badgeLabel: null as string | null, timeLabel: formatRelativeTime(isoDate) };
  }

  const diffMs = Date.now() - timestamp;
  const diffMinutes = Math.max(0, Math.round(diffMs / (1000 * 60)));
  const diffHours = diffMinutes / 60;
  const timeLabel =
    diffMinutes < 60
      ? `${diffMinutes} min sin respuesta`
      : diffHours < 24
        ? `${Math.round(diffHours)}h sin respuesta`
        : `${Math.round(diffHours / 24)} días sin respuesta`;

  if (diffHours >= 72) {
    return { className: "time-critical", badgeLabel: null as string | null, timeLabel };
  }

  if (diffHours >= 24) {
    return { className: "time-warning", badgeLabel: "Pendiente", timeLabel };
  }

  return { className: "", badgeLabel: null as string | null, timeLabel };
}

function actionLabel(type: DecisionType, isAssigned: boolean) {
  if (type === "recover") return "Responder ahora";
  if (type === "complex") return "Escalar caso";
  if (type === "new") return "Contactar lead";
  if (type === "won") return "Ver cierre";
  if (type === "lost") return null;
  if (!isAssigned) return "Responder";
  return "Continuar conversación";
}

function getVisibleStatusLabel(
  row: { status: "new" | "active" | "won" | "lost" | "no_response" },
  noReplyClassName: string,
  t: (key: Parameters<typeof translate>[1]) => string,
) {
  if (row.status === "no_response" && noReplyClassName === "time-critical") {
    return "En riesgo";
  }
  return formatStatus(row.status, t);
}

function conversationPriorityScore(row: {
  decisionType: DecisionType;
  status: "new" | "active" | "won" | "lost" | "no_response";
  aiPriority: "high" | "medium" | "low";
  estimatedValue: number;
}) {
  const statusBonus =
    row.decisionType === "recover"
      ? 200
      : row.decisionType === "complex"
        ? 140
        : row.decisionType === "new"
          ? 80
          : row.status === "active"
            ? 24
            : 0;
  const aiBonus = row.aiPriority === "high" ? 18 : row.aiPriority === "medium" ? 8 : 0;
  return row.estimatedValue + statusBonus + aiBonus;
}

export default async function InboxPage({
  searchParams,
}: {
  searchParams?: Promise<{ unit?: string; demo?: string; focus?: string; scope?: string }>;
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
  const workspaceMode = getWorkspaceMode(context.company, context.user.email);
  const canSeeInternalSetup = canManageInternalWorkspace(workspaceMode);
  const unitOptions = Array.from(new Set(rows.map((row) => row.unit).filter((value): value is string => Boolean(value))));
  const selectedUnit = resolvedSearchParams?.unit?.trim() || "";
  const selectedScope = resolvedSearchParams?.scope?.trim() || "all";
  const showDemoNotice = resolvedSearchParams?.demo?.trim() === "1";
  const focusedConversationId = resolvedSearchParams?.focus?.trim() || "";
  const scopedRows = rows.filter((row) => {
    if (selectedUnit && row.unit !== selectedUnit) return false;
    if (selectedScope === "mine") return row.assignedToId === context.user.id;
    if (selectedScope === "unassigned") return !row.assignedToId;
    if (selectedScope === "no_response") return row.status === "no_response";
    if (selectedScope === "new") return row.status === "new";
    return true;
  });
  const visibleRows = scopedRows.sort((a, b) => {
    const scoreDiff = conversationPriorityScore(b) - conversationPriorityScore(a);
    if (scoreDiff !== 0) return scoreDiff;
    const recencyA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
    const recencyB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
    return recencyB - recencyA;
  });
  const unansweredRows = rows.filter((row) => row.status === "no_response");
  const newRows = rows.filter((row) => row.status === "new");
  const activeRows = rows.filter((row) => row.status === "active");
  const leadsAtRisk = unansweredRows.length;
  const riskAmount = unansweredRows.reduce((sum, row) => sum + row.estimatedValue, 0);
  const activeAmount = activeRows.reduce((sum, row) => sum + row.estimatedValue, 0);
  const newAmount = newRows.reduce((sum, row) => sum + row.estimatedValue, 0);
  const complexCount = rows.filter((row) => row.decisionType === "complex").length;
  const lostAmount = rows
    .filter((row) => row.status === "lost")
    .reduce((sum, row) => sum + row.estimatedValue, 0);
  void team;

  function buildInboxHref(scope: string) {
    const params = new URLSearchParams();
    if (scope !== "all") params.set("scope", scope);
    if (selectedUnit) params.set("unit", selectedUnit);
    if (showDemoNotice) params.set("demo", "1");
    if (focusedConversationId) params.set("focus", focusedConversationId);
    const query = params.toString();
    return query ? `/inbox?${query}` : "/inbox";
  }

  return (
    <section className="page">
      <AutoRefresh intervalMs={12000} />
      <AppNav
        showSetup={canSeeInternalSetup}
        showLocale={canSeeInternalSetup}
        userName={context.profile.full_name ?? context.user.email ?? null}
        userRole={context.profile.role}
      />
      <header className="header">
        <div>
          <h1 className="title">{t("inbox_title")}</h1>
          <p className="subtitle">{t("inbox_subtitle")}</p>
        </div>
      </header>

      <div className="grid cols-3" style={{ marginBottom: 12 }}>
        <article className="card decision-card decision-card-warn">
          <p className="label">En riesgo ahora</p>
          <p className="kpi" style={{ marginBottom: 6 }}>{format(riskAmount)}</p>
          <p className="subtitle" style={{ margin: 0 }}>
            {leadsAtRisk} conversaciones sin respuesta
          </p>
        </article>
        <article className="card decision-card decision-card-active">
          <p className="label">En progreso</p>
          <p className="kpi" style={{ marginBottom: 6 }}>{format(activeAmount)}</p>
          <p className="subtitle" style={{ margin: 0 }}>
            {activeRows.length} conversaciones activas
          </p>
        </article>
        <article className="card decision-card decision-card-neutral">
          {complexCount > 0 ? (
            <>
              <p className="label">Requieren atención</p>
              <p className="kpi" style={{ marginBottom: 6 }}>{complexCount}</p>
              <p className="subtitle" style={{ margin: 0 }}>
                casos complejos detectados
              </p>
            </>
          ) : (
            <>
              <p className="label">Leads nuevos</p>
              <p className="kpi" style={{ marginBottom: 6 }}>{format(newAmount)}</p>
              <p className="subtitle" style={{ margin: 0 }}>
                {newRows.length} leads nuevos
              </p>
            </>
          )}
        </article>
      </div>

      <article className="card" style={{ marginBottom: 12 }}>
        <p className="warn" style={{ marginBottom: 6 }}>
          {format(riskAmount)} {t("inbox_risk_money_now")}
        </p>
        <p className="subtitle" style={{ margin: 0 }}>
          {leadsAtRisk > 0 ? `${leadsAtRisk} ${t("inbox_risk_line")}` : "No hay conversaciones en riesgo por demora."}
        </p>
        {lostAmount > 0 ? (
          <p className="subtitle" style={{ marginTop: 6 }}>
            {t("inbox_lost_today_prefix")} {format(lostAmount)} {t("inbox_lost_today_suffix")}
          </p>
        ) : null}
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
            {showDemoNotice ? (
              <div className="demo-notice" style={{ marginBottom: 12 }}>
                <p className="label" style={{ marginBottom: 6 }}>Demo lista</p>
                <p className="subtitle" style={{ margin: 0 }}>
                  Hemos creado conversaciones de ejemplo para que veas prioridad, valor y acción desde el primer minuto.
                </p>
              </div>
            ) : null}
            <div className="inbox-quick-filters">
              <Link
                className={selectedScope === "all" ? "mini-button filter-pill filter-pill-all is-active" : "mini-button filter-pill filter-pill-all"}
                href={buildInboxHref("all")}
              >
                Todas
              </Link>
              <Link
                className={selectedScope === "mine" ? "mini-button filter-pill filter-pill-mine is-active" : "mini-button filter-pill filter-pill-mine"}
                href={buildInboxHref("mine")}
              >
                Mías
              </Link>
              <Link
                className={
                  selectedScope === "unassigned"
                    ? "mini-button filter-pill filter-pill-unassigned is-active"
                    : "mini-button filter-pill filter-pill-unassigned"
                }
                href={buildInboxHref("unassigned")}
              >
                Sin asignar
              </Link>
              <Link
                className={
                  selectedScope === "no_response"
                    ? "mini-button filter-pill filter-pill-no-response is-active"
                    : "mini-button filter-pill filter-pill-no-response"
                }
                href={buildInboxHref("no_response")}
              >
                Sin respuesta
              </Link>
              <Link
                className={selectedScope === "new" ? "mini-button filter-pill filter-pill-new is-active" : "mini-button filter-pill filter-pill-new"}
                href={buildInboxHref("new")}
              >
                Nuevas
              </Link>
            </div>
            <form method="GET" className="actions" style={{ marginBottom: 12 }}>
              <input type="hidden" name="scope" value={selectedScope === "all" ? "" : selectedScope} />
              {showDemoNotice ? <input type="hidden" name="demo" value="1" /> : null}
              {focusedConversationId ? <input type="hidden" name="focus" value={focusedConversationId} /> : null}
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
            <div className="inbox-card-list">
              {visibleRows.map((row) => {
                const primaryAction = actionLabel(row.decisionType, Boolean(row.assignedToId));
                const noReplyMeta = getNoReplyMeta(row.status, row.lastInboundAt ?? row.lastMessageAt);
                const visibleStatusLabel = getVisibleStatusLabel(row, noReplyMeta.className, t);
                const isCriticalRisk = visibleStatusLabel === "En riesgo";
                const statusToneClass =
                  row.status === "no_response" && visibleStatusLabel === "En riesgo"
                    ? "inbox-row-status-risk"
                    : row.status === "active"
                      ? "inbox-row-status-active"
                      : row.status === "new"
                        ? "inbox-row-status-new"
                        : "";
                const rowClassName = [
                  row.id === focusedConversationId ? "inbox-row-card-focus" : "",
                  isCriticalRisk ? "inbox-row-card-risk" : row.status === "active" ? "inbox-row-card-active" : "",
                  row.assignedToId === context.user.id ? "inbox-row-card-mine" : "",
                ]
                  .filter(Boolean)
                  .join(" ");
                const assignedLabel = row.assignedTo
                  ? row.assignedToId === context.user.id
                    ? "Asignado a ti"
                    : row.assignedTo
                  : "Sin asignar";
                return (
                  <article key={row.id} className={`inbox-row-card ${rowClassName}`.trim()}>
                    <div className="inbox-row-card-top">
                      <div>
                        <div className={`inbox-row-status ${statusToneClass}`.trim()}>
                          {row.status === "no_response" && visibleStatusLabel === "En riesgo" ? "🔴 " : row.status === "active" ? "🟢 " : ""}
                          {visibleStatusLabel}
                        </div>
                        <div className={`inbox-row-time ${noReplyMeta.className}`.trim()}>{noReplyMeta.timeLabel}</div>
                      </div>
                      <div className="inbox-row-value">
                        <div className={`inbox-row-value-amount ${isCriticalRisk ? "risk-label" : ""}`}>💰 {format(row.estimatedValue)}</div>
                        <div className="inbox-row-value-type">{row.leadType ?? t("inbox_unclassified")}</div>
                      </div>
                    </div>

                    <div className="inbox-row-body">
                      <Link className="inbox-row-contact" href={`/conversation/${row.id}`}>
                        {row.contactName}
                      </Link>
                      <div className="inbox-row-message">{row.lastMessageText}</div>
                    </div>

                    <div className="inbox-row-footer">
                      <div className="inbox-row-assigned">{assignedLabel}</div>
                      {primaryAction ? (
                        <Link className={isCriticalRisk ? "button" : "mini-button inbox-row-secondary-action"} href={`/conversation/${row.id}`}>
                          {primaryAction}
                        </Link>
                      ) : (
                        <span className="note" style={{ marginTop: 0 }}>—</span>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </article>
    </section>
  );
}
