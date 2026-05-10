import { cookies, headers } from "next/headers";
import { AppNav } from "@/components/AppNav";
import { AutoRefresh } from "@/components/AutoRefresh";
import { InboxDecisionView } from "@/components/inbox/InboxDecisionView";
import { detectCurrencyFromLocale } from "@/lib/i18n/currency";
import { LANG_COOKIE, resolveLang } from "@/lib/i18n/config";
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

type InboxLangCopy = {
  atRiskLabel: string;
  noReplyMinutes: string;
  noReplyHours: string;
  noReplyDays: string;
  wonToday: string;
  wonYesterday: string;
  lostToday: string;
  lostYesterday: string;
  actionRecover: string;
  actionComplex: string;
  actionNew: string;
  actionWon: string;
  actionLost: string;
  actionReply: string;
  actionContinue: string;
  unassigned: string;
  riskHigh: string;
  riskMedium: string;
  riskLow: string;
};

function getNoReplyMeta(
  status: "new" | "active" | "won" | "lost" | "no_response",
  isoDate: string | null,
  copy: InboxLangCopy,
  lang: "es" | "pt" | "en",
) {
  if (status !== "no_response" || !isoDate) {
    return { className: "", timeLabel: formatRelativeTime(isoDate, lang) };
  }

  const timestamp = new Date(isoDate).getTime();
  if (Number.isNaN(timestamp)) {
    return { className: "", timeLabel: formatRelativeTime(isoDate, lang) };
  }

  const diffMs = Date.now() - timestamp;
  const diffMinutes = Math.max(0, Math.round(diffMs / (1000 * 60)));
  const diffHours = diffMinutes / 60;
  const timeLabel =
    diffMinutes < 60
      ? `${diffMinutes}${copy.noReplyMinutes}`
      : diffHours < 24
        ? `${Math.round(diffHours)}${copy.noReplyHours}`
        : `${Math.round(diffHours / 24)}${copy.noReplyDays}`;

  if (diffHours >= 72) {
    return { className: "time-critical", timeLabel };
  }

  if (diffHours >= 24) {
    return { className: "time-warning", timeLabel };
  }

  return { className: "", timeLabel };
}

function actionLabel(type: DecisionType, isAssigned: boolean, copy: InboxLangCopy) {
  if (type === "recover") return copy.actionRecover;
  if (type === "complex") return copy.actionComplex;
  if (type === "new") return copy.actionNew;
  if (type === "won") return copy.actionWon;
  if (type === "lost") return copy.actionLost;
  if (!isAssigned) return copy.actionReply;
  return copy.actionContinue;
}

function getStatusTimeLabel(
  row: { status: "new" | "active" | "won" | "lost" | "no_response"; lastMessageAt: string | null },
  noReplyTimeLabel: string,
  copy: InboxLangCopy,
  lang: "es" | "pt" | "en",
) {
  if (row.status === "no_response") return noReplyTimeLabel;
  if (!row.lastMessageAt) return "";

  const timestamp = new Date(row.lastMessageAt).getTime();
  if (Number.isNaN(timestamp)) return formatRelativeTime(row.lastMessageAt, lang);

  const diffHours = (Date.now() - timestamp) / (1000 * 60 * 60);
  const relative = formatRelativeTime(row.lastMessageAt, lang);

  if (row.status === "won") {
    if (diffHours < 24) return copy.wonToday;
    if (diffHours < 48) return copy.wonYesterday;
    return `${copy.wonToday.split(" ")[0]} ${relative}`;
  }

  if (row.status === "lost") {
    if (diffHours < 24) return copy.lostToday;
    if (diffHours < 48) return copy.lostYesterday;
    return `${copy.lostToday.split(" ")[0]} ${relative}`;
  }

  return relative;
}

function getVisibleStatusLabel(
  row: { status: "new" | "active" | "won" | "lost" | "no_response" },
  noReplyClassName: string,
  t: (key: Parameters<typeof translate>[1]) => string,
  copy: InboxLangCopy,
) {
  if (row.status === "no_response" && noReplyClassName === "time-critical") {
    return copy.atRiskLabel;
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

function riskLabel(priority: "high" | "medium" | "low", copy: InboxLangCopy) {
  if (priority === "high") return { label: copy.riskHigh, className: "text-yellow-400" };
  if (priority === "medium") return { label: copy.riskMedium, className: "text-blue-400" };
  return { label: copy.riskLow, className: "text-green-400" };
}

function progressFor(priority: "high" | "medium" | "low") {
  if (priority === "high") return 82;
  if (priority === "medium") return 52;
  return 34;
}

function stateClassFor(status: string) {
  if (status === "no_response") {
    return "border-yellow-500/30 bg-yellow-500/10 text-yellow-400";
  }
  if (status === "active") {
    return "border-blue-500/30 bg-blue-500/10 text-blue-400";
  }
  if (status === "won") {
    return "border-green-500/30 bg-green-500/10 text-green-400";
  }
  if (status === "lost") {
    return "border-white/15 bg-white/5 text-gray-300";
  }
  if (status === "new") {
    return "border-white/15 bg-white/5 text-gray-300";
  }
  return "border-white/15 bg-white/5 text-gray-300";
}

export default async function InboxPage() {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const lang = resolveLang(cookieStore.get(LANG_COOKIE)?.value, headerStore.get("accept-language"));
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
            <p className="subtitle">{t("inbox_locked_subtitle")}</p>
          </div>
        </header>
      </section>
    );
  }

  const [rows, team] = await Promise.all([
    getConversationViews(context.supabase, context.profile.company_id),
    getTeamMembers(context.supabase, context.profile.company_id),
  ]);
  const labels =
    lang === "pt"
      ? {
          risk: "Em risco",
          active: "Ativo",
          highValue: "Alto valor",
          newEntry: "Nova entrada",
          filterAll: "Todas",
          filterRisk: "Em risco",
          filterAssigned: "Atribuídas",
          filterNew: "Novas",
          emptyState: "Ainda não há conversas.",
          temporalState: "Estado temporal",
          owner: "Responsável",
          nextAction: "Próxima ação",
          decisionLayer: "Camada de decisão",
          value: "Valor",
          riskLabel: "Risco",
          whatNow: "O que fazer agora",
          assignOwner: "Atribuir responsável",
          productPrinciple: "Princípio de produto",
          decisionCopy: "O revenue aparece onde gera decisão: dentro da conversa, não separado dela.",
        }
      : lang === "en"
        ? {
            risk: "At risk",
            active: "Active",
            highValue: "High value",
            newEntry: "New",
            filterAll: "All",
            filterRisk: "At risk",
            filterAssigned: "Assigned",
            filterNew: "New",
            emptyState: "No conversations yet.",
            temporalState: "Status timing",
            owner: "Owner",
            nextAction: "Next action",
            decisionLayer: "Decision layer",
            value: "Value",
            riskLabel: "Risk",
            whatNow: "What to do now",
            assignOwner: "Assign owner",
            productPrinciple: "Product principle",
            decisionCopy: "Revenue lives where decisions happen: inside the conversation, not apart from it.",
          }
        : {
            risk: "En riesgo",
            active: "Activo",
            highValue: "Alto valor",
            newEntry: "Nueva entrada",
            filterAll: "Todas",
            filterRisk: "En riesgo",
            filterAssigned: "Asignadas",
            filterNew: "Nuevas",
            emptyState: "No hay conversaciones todavía.",
            temporalState: "Estado temporal",
            owner: "Responsable",
            nextAction: "Siguiente acción",
            decisionLayer: "Capa de decisión",
            value: "Valor",
            riskLabel: "Riesgo",
            whatNow: "Qué hacer ahora",
            assignOwner: "Asignar responsable",
            productPrinciple: "Principio de producto",
            decisionCopy: "El revenue aparece donde genera decisión: dentro de la conversación, no separado de ella.",
          };
  const langCopy: InboxLangCopy =
    lang === "pt"
      ? {
          atRiskLabel: "Em risco",
          noReplyMinutes: " min sem resposta",
          noReplyHours: "h sem resposta",
          noReplyDays: " dias sem resposta",
          wonToday: "Ganho hoje",
          wonYesterday: "Ganho ontem",
          lostToday: "Perdido hoje",
          lostYesterday: "Perdido ontem",
          actionRecover: "Responder agora",
          actionComplex: "Escalar caso",
          actionNew: "Abrir conversa",
          actionWon: "Ver detalhe",
          actionLost: "Ver motivo",
          actionReply: "Responder",
          actionContinue: "Continuar conversa",
          unassigned: "Sem responsável",
          riskHigh: "Alto",
          riskMedium: "Médio",
          riskLow: "Baixo",
        }
      : lang === "en"
        ? {
            atRiskLabel: "At risk",
            noReplyMinutes: " min without reply",
            noReplyHours: "h without reply",
            noReplyDays: " days without reply",
            wonToday: "Won today",
            wonYesterday: "Won yesterday",
            lostToday: "Lost today",
            lostYesterday: "Lost yesterday",
            actionRecover: "Reply now",
            actionComplex: "Escalate case",
            actionNew: "Open conversation",
            actionWon: "View details",
            actionLost: "View reason",
            actionReply: "Reply",
            actionContinue: "Continue conversation",
            unassigned: "Unassigned",
            riskHigh: "High",
            riskMedium: "Medium",
            riskLow: "Low",
          }
        : {
            atRiskLabel: "En riesgo",
            noReplyMinutes: " min sin respuesta",
            noReplyHours: "h sin respuesta",
            noReplyDays: " días sin respuesta",
            wonToday: "Ganado hoy",
            wonYesterday: "Ganado ayer",
            lostToday: "Perdido hoy",
            lostYesterday: "Perdido ayer",
            actionRecover: "Responder ahora",
            actionComplex: "Escalar caso",
            actionNew: "Abrir conversación",
            actionWon: "Ver detalle",
            actionLost: "Ver motivo",
            actionReply: "Responder",
            actionContinue: "Continuar conversación",
            unassigned: "Sin asignar",
            riskHigh: "Alto",
            riskMedium: "Medio",
            riskLow: "Bajo",
          };
  const workspaceMode = getWorkspaceMode(context.company, context.user.email);
  const canSeeInternalSetup = canManageInternalWorkspace(workspaceMode);
  const teamById = new Map(team.map((member) => [member.id, member.full_name ?? member.role ?? ""]));
  const sortedRows = [...rows].sort((a, b) => {
    const scoreDiff = conversationPriorityScore(b) - conversationPriorityScore(a);
    if (scoreDiff !== 0) return scoreDiff;
    const recencyA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
    const recencyB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
    return recencyB - recencyA;
  });
  const visibleRows = sortedRows.slice(0, 12);
  const atRiskRows = rows.filter((row) => row.status === "no_response");
  const activeRows = rows.filter((row) => row.status === "active");
  const newRows = rows.filter((row) => row.status === "new");
  const highValueRows = rows.filter((row) => row.aiPriority === "high");
  const riskAmount = atRiskRows.reduce((sum, row) => sum + row.estimatedValue, 0);
  const activeAmount = activeRows.reduce((sum, row) => sum + row.estimatedValue, 0);
  const highValueAmount = highValueRows.reduce((sum, row) => sum + row.estimatedValue, 0);
  const newCount = newRows.length;

  const conversations = visibleRows.map((row) => {
    const noReplyMeta = getNoReplyMeta(row.status, row.lastMessageAt, langCopy, lang);
    const statusLabel = getVisibleStatusLabel(row, noReplyMeta.className, t, langCopy);
    const risk = riskLabel(row.aiPriority, langCopy);
    const delay = getStatusTimeLabel(row, noReplyMeta.timeLabel, langCopy, lang);
    const owner = row.assignedTo || teamById.get(row.assignedToId ?? "") || langCopy.unassigned;
    const isAssigned = Boolean(row.assignedToId);
    return {
      id: row.id,
      status: row.status,
      name: row.contactName || t("inbox_unknown_contact"),
      message: row.lastMessageText || t("inbox_no_messages"),
      state: statusLabel,
      stateClass: stateClassFor(row.status),
      value: format(row.estimatedValue),
      risk: risk.label,
      riskClass: risk.className,
      delay,
      action: actionLabel(row.decisionType, isAssigned, langCopy),
      owner,
      isAssigned,
      progress: progressFor(row.aiPriority),
    };
  });

  return (
    <section className="page">
      <AutoRefresh intervalMs={12000} />
      <AppNav
        showSetup={canSeeInternalSetup}
        showLocale={canSeeInternalSetup}
        userName={context.profile.full_name ?? context.user.email ?? null}
        userRole={context.profile.role}
      />
      <InboxDecisionView
        conversations={conversations}
        riskAmountLabel={format(riskAmount)}
        activeAmountLabel={format(activeAmount)}
        highValueAmountLabel={format(highValueAmount)}
        newCountLabel={String(newCount)}
        labels={labels}
      />
    </section>
  );
}
