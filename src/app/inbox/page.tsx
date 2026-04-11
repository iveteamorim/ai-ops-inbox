import { cookies, headers } from "next/headers";
import { AppNav } from "@/components/AppNav";
import { AutoRefresh } from "@/components/AutoRefresh";
import { InboxDecisionView } from "@/components/inbox/InboxDecisionView";
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
    return { className: "", timeLabel: formatRelativeTime(isoDate) };
  }

  const timestamp = new Date(isoDate).getTime();
  if (Number.isNaN(timestamp)) {
    return { className: "", timeLabel: formatRelativeTime(isoDate) };
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
    return { className: "time-critical", timeLabel };
  }

  if (diffHours >= 24) {
    return { className: "time-warning", timeLabel };
  }

  return { className: "", timeLabel };
}

function actionLabel(type: DecisionType, isAssigned: boolean) {
  if (type === "recover") return "Responder ahora";
  if (type === "complex") return "Escalar caso";
  if (type === "new") return "Abrir conversación";
  if (type === "won") return "Ver detalle";
  if (type === "lost") return "Ver motivo";
  if (!isAssigned) return "Responder";
  return "Continuar conversación";
}

function getStatusTimeLabel(
  row: { status: "new" | "active" | "won" | "lost" | "no_response"; lastMessageAt: string | null },
  noReplyTimeLabel: string,
) {
  if (row.status === "no_response") return noReplyTimeLabel;
  if (!row.lastMessageAt) return "";

  const timestamp = new Date(row.lastMessageAt).getTime();
  if (Number.isNaN(timestamp)) return formatRelativeTime(row.lastMessageAt);

  const diffHours = (Date.now() - timestamp) / (1000 * 60 * 60);
  const relative = formatRelativeTime(row.lastMessageAt);

  if (row.status === "won") {
    if (diffHours < 24) return "Ganado hoy";
    if (diffHours < 48) return "Ganado ayer";
    return `Ganado ${relative}`;
  }

  if (row.status === "lost") {
    if (diffHours < 24) return "Perdido hoy";
    if (diffHours < 48) return "Perdido ayer";
    return `Perdido ${relative}`;
  }

  return relative;
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

function riskLabel(priority: "high" | "medium" | "low") {
  if (priority === "high") return { label: "Alto", className: "text-yellow-400" };
  if (priority === "medium") return { label: "Medio", className: "text-blue-400" };
  return { label: "Bajo", className: "text-green-400" };
}

function progressFor(priority: "high" | "medium" | "low") {
  if (priority === "high") return 82;
  if (priority === "medium") return 52;
  return 34;
}

function stateClassFor(statusLabel: string, status: string) {
  if (statusLabel === "En riesgo" || status === "no_response") {
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
    const noReplyMeta = getNoReplyMeta(row.status, row.lastMessageAt);
    const statusLabel = getVisibleStatusLabel(row, noReplyMeta.className, t);
    const risk = riskLabel(row.aiPriority);
    const delay = getStatusTimeLabel(row, noReplyMeta.timeLabel);
    const owner = row.assignedTo || teamById.get(row.assignedToId ?? "") || "Sin asignar";
    const isAssigned = Boolean(row.assignedToId);
    return {
      id: row.id,
      name: row.contactName,
      message: row.lastMessageText,
      state: statusLabel,
      stateClass: stateClassFor(statusLabel, row.status),
      value: format(row.estimatedValue),
      risk: risk.label,
      riskClass: risk.className,
      delay,
      action: actionLabel(row.decisionType, isAssigned),
      owner,
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
      />
    </section>
  );
}
