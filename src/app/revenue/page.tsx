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

function occurredToday(isoDate: string | null, todayStart: Date) {
  if (!isoDate) return false;
  const timestamp = new Date(isoDate).getTime();
  if (Number.isNaN(timestamp)) return false;
  return timestamp >= todayStart.getTime();
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

  const workspaceMode = getWorkspaceMode(context.company, context.user.email);
  const canSeeInternalSetup = canManageInternalWorkspace(workspaceMode);
  const canManageBusiness = context.profile.role === "owner" || context.profile.role === "admin";
  const opportunities = await getConversationViews(context.supabase, context.profile.company_id);
  const visibleOpportunities = canManageBusiness
    ? opportunities
    : opportunities.filter((item) => item.assignedToId === context.user.id || !item.assignedToId);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const openStatuses = new Set(["new", "active", "no_response"]);
  const openOpportunities = visibleOpportunities.filter((item) => openStatuses.has(item.status));
  const activeOpportunities = visibleOpportunities.filter((item) => item.status === "active");
  const newOpportunities = visibleOpportunities.filter((item) => item.status === "new");
  const wonOpportunities = visibleOpportunities.filter((item) => item.status === "won");
  const lostOpportunities = visibleOpportunities.filter((item) => item.status === "lost");
  const wonToday = wonOpportunities.filter((item) => occurredToday(item.lastMessageAt ?? item.createdAt, todayStart));

  const riskThresholdMs = 2 * 60 * 60 * 1000;
  const now = Date.now();
  const atRiskQueue = [...openOpportunities]
    .filter((item) => {
      const inboundTime = item.lastInboundAt ? new Date(item.lastInboundAt).getTime() : null;
      const outboundTime = item.lastOutboundAt ? new Date(item.lastOutboundAt).getTime() : null;
      const customerWaiting = Boolean(inboundTime && (!outboundTime || inboundTime > outboundTime));
      const staleEnough = Boolean(inboundTime && now - inboundTime >= riskThresholdMs);
      return item.estimatedValue > 0 && customerWaiting && staleEnough;
    })
    .sort((a, b) => b.estimatedValue - a.estimatedValue);

  const atRiskAmount = atRiskQueue.reduce((sum, item) => sum + item.estimatedValue, 0);
  const openPotential = openOpportunities.reduce((sum, item) => sum + item.estimatedValue, 0);
  const recoveredRevenue = wonToday.reduce((sum, item) => sum + (item.expectedValue || item.estimatedValue), 0);
  const lostEstimated = lostOpportunities.reduce((sum, item) => sum + item.estimatedValue, 0);

  const actionButtonLabel =
    lang === "pt" ? "Responder agora" : lang === "en" ? "Reply now" : "Responder ahora";
  const pipelineItems = [
    { id: "risk", label: "En riesgo", count: atRiskQueue.length, icon: "🔴" },
    { id: "progress", label: "En conversación", count: activeOpportunities.length, icon: "🟢" },
    { id: "new", label: "Nuevo", count: newOpportunities.length, icon: "🔵" },
    { id: "won", label: "Ganado", count: wonOpportunities.length, icon: "🟢" },
    { id: "lost", label: "Perdido", count: lostOpportunities.length, icon: "⚪" },
  ];

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
          <h1 className="title">{t("revenue_title")}</h1>
          <p className="subtitle">
            {canManageBusiness
              ? "Dinero, riesgo y acciones prioritarias del workspace."
              : "Dinero en riesgo y conversaciones que requieren seguimiento."}
          </p>
        </div>
      </header>

      <article className="card revenue-hero revenue-hero-risk">
        <p className="revenue-hero-value">💰 {format(atRiskAmount)} en riesgo ahora mismo</p>
        <p className="revenue-hero-detail">
          {atRiskQueue.length === 0
            ? "No hay conversaciones abiertas con dinero en riesgo ahora mismo."
            : "dinero que puedes perder si no respondes"}
        </p>
      </article>

      <div className="grid cols-3" style={{ marginTop: 12, marginBottom: 12 }}>
        <article className="card revenue-kpi revenue-kpi-active">
          <p className="revenue-kpi-value">💰 {format(openPotential)}</p>
          <p className="revenue-kpi-label">en juego (pipeline activo)</p>
        </article>
        <article className="card revenue-kpi revenue-kpi-won">
          <p className="revenue-kpi-value">💰 {format(recoveredRevenue)}</p>
          <p className="revenue-kpi-label">recuperados hoy</p>
        </article>
        <article className="card revenue-kpi revenue-kpi-lost">
          <p className="revenue-kpi-value">💰 {format(lostEstimated)}</p>
          <p className="revenue-kpi-label">perdidos</p>
        </article>
      </div>

      <article className="card revenue-actions-shell">
        <p className="label">Qué hacer ahora</p>
        {atRiskQueue.length === 0 ? (
          <div className="empty-state">
            <h3>{t("revenue_risk_queue_empty_title")}</h3>
            <p>{t("revenue_risk_queue_empty_text")}</p>
          </div>
        ) : (
          <div className="revenue-action-list">
            {atRiskQueue.map((item) => (
              <div key={item.id} className="revenue-action-row">
                <div>
                  <div className="revenue-action-value">🔴 {format(item.estimatedValue)} en riesgo</div>
                  <div className="revenue-action-detail">
                    {item.contactName} · {formatNoReplyDuration(item.lastInboundAt ?? item.lastMessageAt)}
                  </div>
                </div>
                <Link className="button" href={`/conversation/${item.id}`}>
                  {actionButtonLabel}
                </Link>
              </div>
            ))}
          </div>
        )}
      </article>

      <article className="card revenue-pipeline-shell" style={{ marginTop: 12 }}>
        <p className="label">Pipeline</p>
        <div className="revenue-pipeline-list">
          {pipelineItems.map((item) => (
            <div key={item.id} className="revenue-pipeline-row">
              <span>
                {item.icon} {item.label}
              </span>
              <strong>{item.count}</strong>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
