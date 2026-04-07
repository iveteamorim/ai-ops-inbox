import Link from "next/link";
import { cookies, headers } from "next/headers";
import { AppNav } from "@/components/AppNav";
import { detectCurrencyFromLocale } from "@/lib/i18n/currency";
import { LANG_COOKIE, normalizeLang } from "@/lib/i18n/config";
import { translate } from "@/lib/i18n/dictionaries";
import { getAppContext, getConversationViews } from "@/lib/app-data";
import { canManageInternalWorkspace, getWorkspaceMode } from "@/lib/internal-access";

function formatMoney(lang: string, currency: "EUR" | "BRL", value: number) {
  return new Intl.NumberFormat(lang, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function countValue(items: Array<{ estimatedValue: number }>) {
  return items.reduce((sum, item) => sum + item.estimatedValue, 0);
}

function occurredToday(isoDate: string | null, todayStart: Date) {
  if (!isoDate) return false;
  const timestamp = new Date(isoDate).getTime();
  if (Number.isNaN(timestamp)) return false;
  return timestamp >= todayStart.getTime();
}

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const lang = normalizeLang(cookieStore.get(LANG_COOKIE)?.value);
  const t = (key: Parameters<typeof translate>[1]) => translate(lang, key);
  const currency = detectCurrencyFromLocale(headerStore.get("accept-language"));
  const format = (value: number) => formatMoney(lang, currency, value);
  const copy =
    lang === "pt"
      ? {
          loadingSubtitle: "Complete a autenticação Supabase e o bootstrap do tenant para desbloquear a app.",
          missingEnv: "Faltam variáveis de ambiente do Supabase.",
          profileMissing: "O utilizador autenticado ainda não tem empresa/perfil.",
          signInNeeded: "Inicie sessão para aceder ao dashboard.",
          manageSubtitle: "Resumo do workspace e foco operacional do dia.",
          agentSubtitle: "Resumo rápido da tua carga atual e acessos diretos para operar.",
          reviewNow: "Rever agora",
          riskOne: "conversa em risco",
          riskMany: "conversas em risco",
          goInbox: "Ir ao inbox",
          followup: "Seguimento",
          activeOne: "conversa ativa",
          activeMany: "conversas ativas",
          view: "Ver",
          newConversations: "Novas conversas",
          unopenedOne: "conversa por abrir",
          unopenedMany: "conversas por abrir",
          open: "Abrir",
          heroRisk: "em risco agora mesmo",
          criticalOne: "conversa crítica sem resposta",
          criticalMany: "conversas críticas sem resposta",
          inConversation: "em conversa",
          activeProcess: "oportunidades ativas em processo",
          activeUnderCare: "valor ativo sob o teu seguimento",
          recoveredToday: "recuperados hoje",
          closedToday: "receitas fechadas no dia",
          myClosedToday: "conversas fechadas hoje",
          whatNow: "O que fazer agora",
        }
      : lang === "en"
        ? {
            loadingSubtitle: "Complete Supabase auth and tenant bootstrap to unlock the app.",
            missingEnv: "Missing Supabase environment variables.",
            profileMissing: "Authenticated user has no company/profile yet.",
            signInNeeded: "Sign in to access the dashboard.",
            manageSubtitle: "Workspace snapshot and operational focus for today.",
            agentSubtitle: "Quick view of your current load and direct actions.",
            reviewNow: "Review now",
            riskOne: "conversation at risk",
            riskMany: "conversations at risk",
            goInbox: "Go to inbox",
            followup: "Follow-up",
            activeOne: "active conversation",
            activeMany: "active conversations",
            view: "View",
            newConversations: "New conversations",
            unopenedOne: "unopened conversation",
            unopenedMany: "unopened conversations",
            open: "Open",
            heroRisk: "at risk right now",
            criticalOne: "critical conversation with no reply",
            criticalMany: "critical conversations with no reply",
            inConversation: "in conversation",
            activeProcess: "active opportunities in progress",
            activeUnderCare: "active value under your follow-up",
            recoveredToday: "recovered today",
            closedToday: "revenue closed today",
            myClosedToday: "conversations closed today",
            whatNow: "What to do now",
          }
        : {
            loadingSubtitle: "Complete Supabase auth and tenant bootstrap to unlock the app.",
            missingEnv: "Missing Supabase environment variables.",
            profileMissing: "Authenticated user has no company/profile yet.",
            signInNeeded: "Sign in to access the dashboard.",
            manageSubtitle: "Resumen del workspace y foco operativo del día.",
            agentSubtitle: "Resumen rápido de tu carga actual y accesos directos para operar.",
            reviewNow: "Revisar ahora",
            riskOne: "conversación en riesgo",
            riskMany: "conversaciones en riesgo",
            goInbox: "Ir al inbox",
            followup: "Seguimiento",
            activeOne: "conversación activa",
            activeMany: "conversaciones activas",
            view: "Ver",
            newConversations: "Nuevas conversaciones",
            unopenedOne: "conversación sin abrir",
            unopenedMany: "conversaciones sin abrir",
            open: "Abrir",
            heroRisk: "en riesgo ahora mismo",
            criticalOne: "conversación crítica sin respuesta",
            criticalMany: "conversaciones críticas sin respuesta",
            inConversation: "en conversación",
            activeProcess: "oportunidades activas en proceso",
            activeUnderCare: "valor activo bajo tu seguimiento",
            recoveredToday: "recuperados hoy",
            closedToday: "ingresos cerrados en el día",
            myClosedToday: "conversaciones cerradas hoy",
            whatNow: "Qué hacer ahora",
          };

  const context = await getAppContext();
  if (context.kind !== "ready") {
    return (
      <section className="page">
        <AppNav />
        <header className="header">
          <div>
            <h1 className="title">{t("dashboard_title")}</h1>
            <p className="subtitle">{copy.loadingSubtitle}</p>
          </div>
        </header>
        <article className="card">
          <p className="warn" style={{ marginBottom: 0 }}>
            {context.kind === "unconfigured"
              ? copy.missingEnv
              : context.kind === "profile_missing"
                ? copy.profileMissing
                : copy.signInNeeded}
          </p>
        </article>
      </section>
    );
  }

  const workspaceMode = getWorkspaceMode(context.company, context.user.email);
  const canSeeInternalSetup = canManageInternalWorkspace(workspaceMode);
  const canManageBusiness = context.profile.role === "owner" || context.profile.role === "admin";
  const conversations = await getConversationViews(context.supabase, context.profile.company_id);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const workspaceOpen = conversations.filter((item) => item.status === "new" || item.status === "active" || item.status === "no_response");
  const workspaceRisk = conversations.filter((item) => item.status === "no_response");
  const workspaceNew = conversations.filter((item) => item.status === "new");
  const workspaceWon = conversations.filter((item) => item.status === "won");
  const workspaceWonToday = workspaceWon.filter((item) => occurredToday(item.lastMessageAt ?? item.createdAt, todayStart));

  const myOpen = conversations.filter(
    (item) => item.assignedToId === context.user.id && (item.status === "new" || item.status === "active" || item.status === "no_response"),
  );
  const myRisk = conversations.filter((item) => item.assignedToId === context.user.id && item.status === "no_response");
  const myWonToday = conversations.filter(
    (item) => item.assignedToId === context.user.id && item.status === "won" && occurredToday(item.lastMessageAt ?? item.createdAt, todayStart),
  );
  const visibleOpen = canManageBusiness ? workspaceOpen : myOpen;
  const visibleRisk = canManageBusiness ? workspaceRisk : myRisk;
  const visibleWonToday = canManageBusiness ? workspaceWonToday : myWonToday;
  const visibleActive = visibleOpen.filter((item) => item.status === "active");
  const visibleNew = canManageBusiness ? workspaceNew : conversations.filter((item) => item.status === "new");
  const visibleRecoveredToday = countValue(visibleWonToday);

  const actionCards = [
    {
      href: "/inbox?scope=no_response",
      title: copy.reviewNow,
      detail: `${visibleRisk.length} ${visibleRisk.length === 1 ? copy.riskOne : copy.riskMany}`,
      tone: "dashboard-action-risk",
      cta: copy.goInbox,
      emoji: "🔴",
    },
    {
      href: canManageBusiness ? "/inbox" : "/inbox?scope=mine",
      title: copy.followup,
      detail: `${visibleActive.length} ${visibleActive.length === 1 ? copy.activeOne : copy.activeMany}`,
      tone: "dashboard-action-followup",
      cta: copy.view,
      emoji: "🟠",
    },
    {
      href: "/inbox?scope=new",
      title: copy.newConversations,
      detail: `${visibleNew.length} ${visibleNew.length === 1 ? copy.unopenedOne : copy.unopenedMany}`,
      tone: "dashboard-action-new",
      cta: copy.open,
      emoji: "🔵",
    },
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
          <h1 className="title">{t("dashboard_title")}</h1>
          <p className="subtitle">
            {canManageBusiness
              ? copy.manageSubtitle
              : copy.agentSubtitle}
          </p>
        </div>
      </header>

      <article className="card dashboard-hero dashboard-hero-risk">
        <p className="dashboard-hero-value">💰 {format(countValue(visibleRisk))} {copy.heroRisk}</p>
        <p className="dashboard-hero-detail">
          {visibleRisk.length} {visibleRisk.length === 1 ? copy.criticalOne : copy.criticalMany}
        </p>
      </article>

      <div className="grid cols-2" style={{ marginTop: 12, marginBottom: 12 }}>
        <article className="card dashboard-hero dashboard-hero-active">
          <p className="dashboard-secondary-value">💰 {format(countValue(visibleOpen))} {copy.inConversation}</p>
          <p className="dashboard-hero-detail">
            {canManageBusiness ? copy.activeProcess : copy.activeUnderCare}
          </p>
        </article>
        <article className="card dashboard-hero dashboard-hero-won">
          <p className="dashboard-secondary-value">💰 {format(visibleRecoveredToday)} {copy.recoveredToday}</p>
          <p className="dashboard-hero-detail">
            {canManageBusiness ? copy.closedToday : copy.myClosedToday}
          </p>
        </article>
      </div>

      <article className="card dashboard-actions-shell">
        <p className="label">{copy.whatNow}</p>
        <div className="dashboard-actions-list">
          {actionCards.map((item) => (
            <div key={item.href} className={`dashboard-action-row ${item.tone}`.trim()}>
              <div>
                <div className="dashboard-action-title">{item.emoji} {item.title}</div>
                <div className="dashboard-action-detail">{item.detail}</div>
              </div>
              <Link className={item.tone === "dashboard-action-risk" ? "button" : "mini-button dashboard-action-button"} href={item.href}>
                {item.cta}
              </Link>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
