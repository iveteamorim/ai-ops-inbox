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
      title: "Revisar ahora",
      detail: `${visibleRisk.length} ${visibleRisk.length === 1 ? "conversación en riesgo" : "conversaciones en riesgo"}`,
      tone: "dashboard-action-risk",
      cta: "Ir al inbox",
      emoji: "🔴",
    },
    {
      href: canManageBusiness ? "/inbox" : "/inbox?scope=mine",
      title: "Seguimiento",
      detail: `${visibleActive.length} ${visibleActive.length === 1 ? "conversación activa" : "conversaciones activas"}`,
      tone: "dashboard-action-followup",
      cta: "Ver",
      emoji: "🟠",
    },
    {
      href: "/inbox?scope=new",
      title: "Nuevas conversaciones",
      detail: `${visibleNew.length} ${visibleNew.length === 1 ? "conversación sin abrir" : "conversaciones sin abrir"}`,
      tone: "dashboard-action-new",
      cta: "Abrir",
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
              ? lang === "pt"
                ? "Resumo do workspace e foco operacional do dia."
                : lang === "en"
                  ? "Workspace snapshot and operational focus for today."
                  : "Resumen del workspace y foco operativo del día."
              : "Resumen rápido de tu carga actual y accesos directos para operar."}
          </p>
        </div>
      </header>

      <article className="card dashboard-hero dashboard-hero-risk">
        <p className="dashboard-hero-value">💰 {format(countValue(visibleRisk))} en riesgo ahora mismo</p>
        <p className="dashboard-hero-detail">
          {visibleRisk.length} {visibleRisk.length === 1 ? "conversación crítica sin respuesta" : "conversaciones críticas sin respuesta"}
        </p>
      </article>

      <div className="grid cols-2" style={{ marginTop: 12, marginBottom: 12 }}>
        <article className="card dashboard-hero dashboard-hero-active">
          <p className="dashboard-secondary-value">💰 {format(countValue(visibleOpen))} en conversación</p>
          <p className="dashboard-hero-detail">
            {canManageBusiness ? "oportunidades activas en proceso" : "valor activo bajo tu seguimiento"}
          </p>
        </article>
        <article className="card dashboard-hero dashboard-hero-won">
          <p className="dashboard-secondary-value">💰 {format(visibleRecoveredToday)} recuperados hoy</p>
          <p className="dashboard-hero-detail">
            {canManageBusiness ? "ingresos cerrados en el día" : "conversaciones cerradas hoy"}
          </p>
        </article>
      </div>

      <article className="card dashboard-actions-shell">
        <p className="label">Qué hacer ahora</p>
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
