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
  const copy =
    lang === "pt"
      ? {
          emptySubtitle: "As vistas de revenue precisam de um tenant configurado e de conversas reais.",
          manageSubtitle: "Dinheiro, risco e ações prioritárias do workspace.",
          agentSubtitle: "Dinheiro em risco e conversas que precisam de seguimento.",
          replyNow: "Responder agora",
          risk: "Em risco",
          inConversation: "Em conversa",
          new: "Novo",
          won: "Ganho",
          lost: "Perdido",
          heroRisk: "em risco agora mesmo",
          nothingAtRisk: "Não há conversas abertas com dinheiro em risco agora.",
          riskHelp: "dinheiro que podes perder se não responderes",
          inPlay: "em jogo (pipeline ativo)",
          recovered: "recuperados hoje",
          lostLabel: "perdidos",
          whatNow: "O que fazer agora",
          pipeline: "Pipeline",
          amountAtRisk: "em risco",
        }
      : lang === "en"
        ? {
            emptySubtitle: "Revenue views require a configured tenant and real conversation data.",
            manageSubtitle: "Money, risk, and priority actions across the workspace.",
            agentSubtitle: "Money at risk and conversations that need follow-up.",
            replyNow: "Reply now",
            risk: "At risk",
            inConversation: "In conversation",
            new: "New",
            won: "Won",
            lost: "Lost",
            heroRisk: "at risk right now",
            nothingAtRisk: "There are no open conversations with money at risk right now.",
            riskHelp: "money you can lose if you do not reply",
            inPlay: "in play (active pipeline)",
            recovered: "recovered today",
            lostLabel: "lost",
            whatNow: "What to do now",
            pipeline: "Pipeline",
            amountAtRisk: "at risk",
          }
        : {
            emptySubtitle: "Revenue views require a configured tenant and real conversation data.",
            manageSubtitle: "Dinero, riesgo y acciones prioritarias del workspace.",
            agentSubtitle: "Dinero en riesgo y conversaciones que requieren seguimiento.",
            replyNow: "Responder ahora",
            risk: "En riesgo",
            inConversation: "En conversación",
            new: "Nuevo",
            won: "Ganado",
            lost: "Perdido",
            heroRisk: "en riesgo ahora mismo",
            nothingAtRisk: "No hay conversaciones abiertas con dinero en riesgo ahora mismo.",
            riskHelp: "dinero que puedes perder si no respondes",
            inPlay: "en juego (pipeline activo)",
            recovered: "recuperados hoy",
            lostLabel: "perdidos",
            whatNow: "Qué hacer ahora",
            pipeline: "Pipeline",
            amountAtRisk: "en riesgo",
          };

  const context = await getAppContext();
  if (context.kind !== "ready") {
    return (
      <section className="page">
        <AppNav />
        <header className="header">
          <div>
            <h1 className="title">{t("revenue_title")}</h1>
            <p className="subtitle">{copy.emptySubtitle}</p>
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

  const pipelineItems = [
    { id: "risk", label: copy.risk, count: atRiskQueue.length, icon: "🔴" },
    { id: "progress", label: copy.inConversation, count: activeOpportunities.length, icon: "🟢" },
    { id: "new", label: copy.new, count: newOpportunities.length, icon: "🔵" },
    { id: "won", label: copy.won, count: wonOpportunities.length, icon: "🟢" },
    { id: "lost", label: copy.lost, count: lostOpportunities.length, icon: "⚪" },
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
              ? copy.manageSubtitle
              : copy.agentSubtitle}
          </p>
        </div>
      </header>

      <article className="card revenue-hero revenue-hero-risk">
        <p className="revenue-hero-value">💰 {format(atRiskAmount)} {copy.heroRisk}</p>
        <p className="revenue-hero-detail">
          {atRiskQueue.length === 0
            ? copy.nothingAtRisk
            : copy.riskHelp}
        </p>
      </article>

      <div className="grid cols-3" style={{ marginTop: 12, marginBottom: 12 }}>
        <article className="card revenue-kpi revenue-kpi-active">
          <p className="revenue-kpi-value">💰 {format(openPotential)}</p>
          <p className="revenue-kpi-label">{copy.inPlay}</p>
        </article>
        <article className="card revenue-kpi revenue-kpi-won">
          <p className="revenue-kpi-value">💰 {format(recoveredRevenue)}</p>
          <p className="revenue-kpi-label">{copy.recovered}</p>
        </article>
        <article className="card revenue-kpi revenue-kpi-lost">
          <p className="revenue-kpi-value">💰 {format(lostEstimated)}</p>
          <p className="revenue-kpi-label">{copy.lostLabel}</p>
        </article>
      </div>

      <article className="card revenue-actions-shell">
        <p className="label">{copy.whatNow}</p>
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
                  <div className="revenue-action-value">🔴 {format(item.estimatedValue)} {copy.amountAtRisk}</div>
                  <div className="revenue-action-detail">
                    {item.contactName} · {formatNoReplyDuration(item.lastInboundAt ?? item.lastMessageAt)}
                  </div>
                </div>
                <Link className="button" href={`/conversation/${item.id}`}>
                  {copy.replyNow}
                </Link>
              </div>
            ))}
          </div>
        )}
      </article>

      <article className="card revenue-pipeline-shell" style={{ marginTop: 12 }}>
        <p className="label">{copy.pipeline}</p>
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
