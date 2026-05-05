import { cookies, headers } from "next/headers";
import { AppNav } from "@/components/AppNav";
import { WorkspaceBootstrapCard } from "@/components/WorkspaceBootstrapCard";
import { DashboardDecisionView } from "@/components/dashboard/DashboardDecisionView";
import { detectCurrencyFromLocale } from "@/lib/i18n/currency";
import { LANG_COOKIE, resolveLang } from "@/lib/i18n/config";
import { translate } from "@/lib/i18n/dictionaries";
import { formatRelativeTime, getAppContext, getConversationViews } from "@/lib/app-data";
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
  const lang = resolveLang(cookieStore.get(LANG_COOKIE)?.value, headerStore.get("accept-language"));
  const t = (key: Parameters<typeof translate>[1]) => translate(lang, key);
  const currency = detectCurrencyFromLocale(headerStore.get("accept-language"));
  const format = (value: number) => formatMoney(lang, currency, value);
  const copy =
    lang === "pt"
      ? {
          loadingSubtitle: "Complete a autenticação Supabase e o bootstrap do tenant para desbloquear a app.",
          missingEnv: "Faltam variáveis de ambiente do Supabase.",
          profileMissing: "O utilizador autenticado ainda não tem empresa/perfil.",
          profileRepairTitle: "A configuração do workspace está incompleta",
          profileRepairDescription:
            "O utilizador está autenticado, mas o registo de empresa/perfil está em falta ou desligado. Tente novamente o bootstrap do workspace para repará-lo.",
          profileRepairRetry: "Tentar setup do workspace",
          profileRepairPending: "A reparar workspace...",
          profileRepairSuccess: "Workspace reparado. A recarregar acesso...",
          profileRepairFallback:
            "A reparação do workspace falhou. Verifique SUPABASE_SERVICE_ROLE_KEY e o trigger de auth.",
          profileRepairReasonLabel: "Diagnóstico",
          signInNeeded: "Inicie sessão para aceder ao dashboard.",
          manageSubtitle: "Resumo do workspace e foco operacional do dia.",
          agentSubtitle: "Resumo rápido da tua carga atual e acessos diretos para operar.",
          reviewNow: "Rever agora",
          riskActiveTitle: "Risco ativo",
          riskOne: "conversa em risco",
          riskMany: "conversas em risco",
          goInbox: "Ir ao inbox",
          followup: "Seguimento",
          activeOne: "conversa ativa",
          activeMany: "conversas ativas",
          view: "Ver",
          openLabel: "abrir",
          newConversations: "Novas conversas",
          responseRateLabel: "taxa de resposta",
          highValueLabel: "alto valor",
          newConversationsLabel: "novas conversas",
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
          dashboardTitle: "O que está acontecendo agora",
          dashboardSubtitle: "Visibilidade clara de receitas, risco e decisões necessárias em tempo real.",
          decisionsNow: "Decisões agora",
          decisionsSubtitle: "O dashboard agrupa risco e oportunidade para decidir o que deve entrar primeiro no inbox.",
          estimatedImpact: "impacto estimado",
          riskTitle: "Receita em risco",
          suggestedAction: "Ação sugerida",
          viewPriorities: "Ver prioridades",
          statusTitle: "Status",
          totalRiskLabel: "Risco total",
          riskNone: "Nenhuma conversa em risco",
          riskNoneDetail: "Sem respostas pendentes",
          riskAmountLabel: "em risco",
          leadOne: "cliente potencial",
          leadMany: "clientes potenciais",
        }
      : lang === "en"
        ? {
            loadingSubtitle: "Complete Supabase auth and tenant bootstrap to unlock the app.",
            missingEnv: "Missing Supabase environment variables.",
            profileMissing: "Authenticated user has no company/profile yet.",
            profileRepairTitle: "Workspace setup is incomplete",
            profileRepairDescription:
              "Your user is authenticated, but the company/profile record is missing or disconnected. Retry the workspace bootstrap to repair it.",
            profileRepairRetry: "Retry workspace setup",
            profileRepairPending: "Repairing workspace...",
            profileRepairSuccess: "Workspace repaired. Reloading access...",
            profileRepairFallback: "Workspace repair failed. Check SUPABASE_SERVICE_ROLE_KEY and the auth trigger.",
            profileRepairReasonLabel: "Diagnostic",
            signInNeeded: "Sign in to access the dashboard.",
            manageSubtitle: "Workspace snapshot and operational focus for today.",
            agentSubtitle: "Quick view of your current load and direct actions.",
          reviewNow: "Review now",
          riskActiveTitle: "Active risk",
            riskOne: "conversation at risk",
            riskMany: "conversations at risk",
            goInbox: "Go to inbox",
            followup: "Follow-up",
            activeOne: "active conversation",
            activeMany: "active conversations",
            view: "View",
            openLabel: "open",
            newConversations: "New conversations",
            responseRateLabel: "response rate",
            highValueLabel: "high value",
            newConversationsLabel: "new conversations",
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
            dashboardTitle: "What is happening right now",
            dashboardSubtitle: "Clear visibility into revenue, risk, and the decisions needed in real time.",
            decisionsNow: "Decisions now",
            decisionsSubtitle: "The dashboard groups risk and opportunity to decide what should enter the inbox first.",
            estimatedImpact: "estimated impact",
            riskTitle: "Revenue at risk",
            suggestedAction: "Suggested action",
          viewPriorities: "View priorities",
          statusTitle: "Status",
          totalRiskLabel: "Total risk",
          riskNone: "No conversations at risk",
            riskNoneDetail: "No pending replies",
            riskAmountLabel: "at risk",
            leadOne: "lead",
            leadMany: "leads",
          }
        : {
            loadingSubtitle: "Completa la autenticación de Supabase y el bootstrap del tenant para desbloquear la app.",
            missingEnv: "Faltan variables de entorno de Supabase.",
            profileMissing: "El usuario autenticado todavía no tiene empresa o perfil.",
            profileRepairTitle: "La configuración del workspace está incompleta",
            profileRepairDescription:
              "Tu usuario está autenticado, pero falta o está desconectado el registro de empresa/perfil. Reintenta el bootstrap del workspace para repararlo.",
            profileRepairRetry: "Reintentar setup del workspace",
            profileRepairPending: "Reparando workspace...",
            profileRepairSuccess: "Workspace reparado. Recargando acceso...",
            profileRepairFallback:
              "La reparación del workspace falló. Revisa SUPABASE_SERVICE_ROLE_KEY y el trigger de auth.",
            profileRepairReasonLabel: "Diagnóstico",
            signInNeeded: "Inicia sesión para acceder al dashboard.",
            manageSubtitle: "Resumen del workspace y foco operativo del día.",
            agentSubtitle: "Resumen rápido de tu carga actual y accesos directos para operar.",
          reviewNow: "Revisar ahora",
          riskActiveTitle: "Riesgo activo",
            riskOne: "conversación en riesgo",
            riskMany: "conversaciones en riesgo",
            goInbox: "Ir al inbox",
            followup: "Seguimiento",
            activeOne: "conversación activa",
            activeMany: "conversaciones activas",
            view: "Ver",
            openLabel: "abrir",
            newConversations: "Nuevas conversaciones",
            responseRateLabel: "tasa de respuesta",
            highValueLabel: "alto valor",
            newConversationsLabel: "nuevas conversaciones",
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
            dashboardTitle: "Qué está pasando ahora",
            dashboardSubtitle: "Visibilidad clara de ingresos, riesgo y decisiones necesarias en tiempo real.",
            decisionsNow: "Decisiones ahora",
            decisionsSubtitle:
              "El dashboard agrupa riesgo y oportunidad para decidir qué tipo de trabajo debe entrar primero al inbox.",
            estimatedImpact: "impacto estimado",
            riskTitle: "Ingresos en riesgo",
            suggestedAction: "Acción sugerida",
          viewPriorities: "Ver prioridades",
          statusTitle: "Estado",
          totalRiskLabel: "Riesgo total",
          riskNone: "No hay conversaciones en riesgo",
            riskNoneDetail: "Sin respuestas pendientes",
            riskAmountLabel: "en riesgo",
            leadOne: "cliente potencial",
            leadMany: "clientes potenciales",
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
        {context.kind === "profile_missing" ? (
          <WorkspaceBootstrapCard
            copy={{
              title: copy.profileRepairTitle,
              description: copy.profileRepairDescription,
              retry: copy.profileRepairRetry,
              pending: copy.profileRepairPending,
              success: copy.profileRepairSuccess,
              fallback: copy.profileRepairFallback,
            }}
          />
        ) : (
          <article className="card">
            <p className="warn" style={{ marginBottom: 0 }}>
              {context.kind === "unconfigured" ? copy.missingEnv : copy.signInNeeded}
            </p>
          </article>
        )}
        {context.kind === "profile_missing" ? (
          <article className="card" style={{ marginTop: 12 }}>
            <p className="warn" style={{ marginBottom: 0 }}>{copy.profileMissing}</p>
            {context.reason ? (
              <p style={{ marginTop: 12, marginBottom: 0, color: "var(--muted)", fontSize: "0.92rem" }}>
                <strong>{copy.profileRepairReasonLabel}:</strong> {context.reason}
              </p>
            ) : null}
          </article>
        ) : null}
      </section>
    );
  }

  const workspaceMode = getWorkspaceMode(context.company, context.user.email);
  const canSeeInternalSetup = canManageInternalWorkspace(workspaceMode);
  const canManageBusiness = context.profile.role === "owner" || context.profile.role === "admin";
  const canSeeWorkspaceDashboard = canManageBusiness || workspaceMode === "customer_demo";
  const conversations = await getConversationViews(context.supabase, context.profile.company_id);

  const workspaceOpen = conversations.filter((item) => item.status === "new" || item.status === "active" || item.status === "no_response");
  const workspaceRisk = conversations.filter((item) => item.status === "no_response");

  const myOpen = conversations.filter(
    (item) => item.assignedToId === context.user.id && (item.status === "new" || item.status === "active" || item.status === "no_response"),
  );
  const myRisk = conversations.filter((item) => item.assignedToId === context.user.id && item.status === "no_response");
  const visibleOpen = canSeeWorkspaceDashboard ? workspaceOpen : myOpen;
  const visibleRisk = canSeeWorkspaceDashboard ? workspaceRisk : myRisk;
  const visibleActive = visibleOpen.filter((item) => item.status === "active");
  const visibleRiskAmount = countValue(visibleRisk);
  const visibleActiveAmount = countValue(visibleActive);
  const highValueLeads = conversations.filter(
    (item) => item.aiPriority === "high" && (item.status === "new" || item.status === "active" || item.status === "no_response"),
  );
  const highValueAmount = countValue(highValueLeads);

  const totalConversations = visibleOpen.length;
  const responseRate =
    totalConversations > 0
      ? Math.round(((totalConversations - visibleRisk.length) / totalConversations) * 100)
      : 0;
  const highValuePercent =
    visibleOpen.length > 0 ? Math.round((highValueLeads.length / visibleOpen.length) * 100) : 0;
  const newCount = visibleOpen.filter((item) => item.status === "new").length;

  const metrics = [
    { label: copy.responseRateLabel, value: `${responseRate}%` },
    { label: copy.highValueLabel, value: `${highValuePercent}%` },
    { label: copy.newConversationsLabel, value: String(newCount) },
  ];

  const latestRisk = visibleRisk[0];
  const riskAge = latestRisk?.lastMessageAt ? formatRelativeTime(latestRisk.lastMessageAt, lang) : null;
  const riskSummary =
    visibleRisk.length > 0
      ? `${visibleRisk.length} ${visibleRisk.length === 1 ? copy.riskOne : copy.riskMany}`
      : copy.riskNone;
  const riskDetail =
    visibleRisk.length > 0
      ? `${format(visibleRiskAmount)} ${copy.riskAmountLabel} · ${riskAge ?? ""}`.trim()
      : copy.riskNoneDetail;

  const statusLines = [
    `${visibleRisk.length} ${visibleRisk.length === 1 ? copy.criticalOne : copy.criticalMany}`,
    `${visibleActive.length} ${visibleActive.length === 1 ? copy.activeOne : copy.activeMany}`,
    `${newCount} ${newCount === 1 ? copy.unopenedOne : copy.unopenedMany}`,
  ];

  const decisionGroups = [
    {
      title: lang === "pt" ? "Risco alto" : lang === "en" ? "High risk" : "Riesgo alto",
      subtitle: lang === "pt" ? "Sem resposta > 1h" : lang === "en" ? "No reply > 1h" : "Conversaciones sin respuesta > 1h",
      value: format(visibleRiskAmount),
      count: `${visibleRisk.length} ${visibleRisk.length === 1 ? copy.riskOne : copy.riskMany}`,
      action: lang === "pt" ? "Rever prioridades no inbox" : lang === "en" ? "Review priorities in inbox" : "Revisar prioridades en el inbox",
      tone: "yellow" as const,
      href: "/inbox?scope=no_response",
    },
    {
      title: lang === "pt" ? "Oportunidade" : lang === "en" ? "Opportunity" : "Oportunidad",
      subtitle: lang === "pt" ? "Leads de alto valor sem seguimento" : lang === "en" ? "High value leads pending" : "Leads de alto valor sin seguimiento",
      value: format(highValueAmount),
      count: `${highValueLeads.length} ${highValueLeads.length === 1 ? copy.leadOne : copy.leadMany}`,
      action: lang === "pt" ? "Priorizar leads > €150" : lang === "en" ? "Prioritize > €150" : "Priorizar leads > €150",
      tone: "green" as const,
      href: "/inbox",
    },
    {
      title: lang === "pt" ? "Seguimento" : lang === "en" ? "Follow-up" : "Seguimiento",
      subtitle: lang === "pt" ? "Conversas ativas a aguardar próximo passo" : lang === "en" ? "Active conversations pending" : "Conversaciones activas esperando siguiente paso",
      value: format(visibleActiveAmount),
      count: `${visibleActive.length} ${visibleActive.length === 1 ? copy.activeOne : copy.activeMany}`,
      action: lang === "pt" ? "Ativar follow-up hoje" : lang === "en" ? "Push follow-up today" : "Empujar seguimiento hoy",
      tone: "blue" as const,
      href: "/inbox?scope=active",
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
      <DashboardDecisionView
        headerTitle={copy.dashboardTitle}
        headerSubtitle={copy.dashboardSubtitle}
        riskTitle={copy.riskActiveTitle}
        riskSummary={riskSummary}
        riskDetail={riskDetail}
        riskButtonLabel={copy.goInbox}
        metrics={metrics}
        decisionGroups={decisionGroups}
        statusTitle={copy.statusTitle}
        statusLines={statusLines}
        whatNowLabel={copy.whatNow}
        openLabel={copy.openLabel}
        totalRiskLabel={copy.totalRiskLabel}
      />
    </section>
  );
}
