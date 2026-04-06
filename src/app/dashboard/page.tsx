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

  const myOpen = conversations.filter(
    (item) => item.assignedToId === context.user.id && (item.status === "new" || item.status === "active" || item.status === "no_response"),
  );
  const myRisk = conversations.filter((item) => item.assignedToId === context.user.id && item.status === "no_response");
  const todayLeads = conversations.filter((item) => new Date(item.createdAt).getTime() >= todayStart.getTime());
  const visibleOpen = canManageBusiness ? workspaceOpen : myOpen;
  const visibleRisk = canManageBusiness ? workspaceRisk : myRisk;

  const shortcutLinks = canManageBusiness
    ? [
        {
          href: "/inbox?scope=no_response",
          label: t("dashboard_pending_conversations"),
          detail: `${workspaceRisk.length} ${t("inbox_filter_no_reply").toLowerCase()}`,
        },
        {
          href: "/inbox?scope=unassigned",
          label: t("inbox_assigned"),
          detail: `${conversations.filter((item) => !item.assignedToId).length} sin asignar`,
        },
        {
          href: "/inbox?scope=new",
          label: t("inbox_filter_new"),
          detail: `${workspaceNew.length} leads nuevos`,
        },
      ]
    : [
        {
          href: "/inbox?scope=mine",
          label: "Mis conversaciones",
          detail: `${myOpen.length} abiertas a mi cargo`,
        },
        {
          href: "/inbox?scope=no_response",
          label: t("inbox_filter_no_reply"),
          detail: `${myRisk.length} pendientes de respuesta`,
        },
        {
          href: "/inbox?scope=unassigned",
          label: "Sin asignar",
          detail: `${conversations.filter((item) => !item.assignedToId).length} disponibles para coger`,
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
              ? `${context.company?.name ?? "Novua Inbox"} overview: situación del workspace y foco del día.`
              : "Resumen rápido de tu carga actual y accesos directos para operar."}
          </p>
        </div>
      </header>

      <div className="grid cols-3" style={{ marginBottom: 12 }}>
        <article className="card">
          <p className="label">{canManageBusiness ? t("dashboard_leads_today") : "Mis abiertas"}</p>
          <p className="kpi">{canManageBusiness ? todayLeads.length : myOpen.length}</p>
          <p className="subtitle" style={{ margin: 0 }}>
            {canManageBusiness ? "conversaciones creadas hoy" : "conversaciones activas a tu cargo"}
          </p>
        </article>
        <article className="card">
          <p className="label">{t("dashboard_no_reply")}</p>
          <p className="kpi warn">{format(countValue(visibleRisk))}</p>
          <p className="subtitle" style={{ margin: 0 }}>
            {visibleRisk.length} conversaciones esperando respuesta
          </p>
        </article>
        <article className="card">
          <p className="label">{canManageBusiness ? t("dashboard_revenue_risk") : "Valor en curso"}</p>
          <p className="kpi">{format(countValue(visibleOpen))}</p>
          <p className="subtitle" style={{ margin: 0 }}>
            {canManageBusiness ? `${workspaceWon.length} ${t("revenue_filter_won").toLowerCase()} en el workspace` : "valor estimado de tus conversaciones abiertas"}
          </p>
        </article>
      </div>

      <div className="grid cols-2">
        <article className="card">
          <p className="label">{canManageBusiness ? "Qué revisar hoy" : "Qué hacer ahora"}</p>
          <div className="clean-list">
            {shortcutLinks.map((item) => (
              <Link key={item.href} href={item.href} className="dashboard-shortcut">
                <strong>{item.label}</strong>
                <span>{item.detail}</span>
              </Link>
            ))}
          </div>
        </article>

        <article className="card">
          <p className="label">{canManageBusiness ? "Estado del workspace" : "Tu contexto"}</p>
          <div className="preview-row">
            <span>{t("inbox_filter_in_progress")}</span>
            <strong>{canManageBusiness ? workspaceOpen.filter((item) => item.status === "active").length : myOpen.filter((item) => item.status === "active").length}</strong>
          </div>
          <div className="preview-row">
            <span>{t("inbox_filter_new")}</span>
            <strong>{canManageBusiness ? workspaceNew.length : conversations.filter((item) => !item.assignedToId && item.status === "new").length}</strong>
          </div>
          <div className="preview-row">
            <span>{t("inbox_filter_no_reply")}</span>
            <strong>{visibleRisk.length}</strong>
          </div>
          <div className="preview-row">
            <span>{t("revenue_filter_won")}</span>
            <strong>{canManageBusiness ? workspaceWon.length : conversations.filter((item) => item.assignedToId === context.user.id && item.status === "won").length}</strong>
          </div>
        </article>
      </div>
    </section>
  );
}
