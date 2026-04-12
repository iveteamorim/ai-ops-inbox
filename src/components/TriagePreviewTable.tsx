import Link from "next/link";
import type { ConversationTriagePreviewView } from "@/lib/app-data";
import { useI18n } from "@/components/i18n/LanguageProvider";

type Props = {
  items: ConversationTriagePreviewView[];
};

function formatStatus(value: ConversationTriagePreviewView["conversationStatus"], lang: string) {
  if (lang === "pt") {
    if (value === "in_conversation") return "Em conversa";
    if (value === "no_response") return "Sem resposta";
    if (value === "won") return "Ganho";
    if (value === "lost") return "Perdido";
    return "Novo";
  }
  if (lang === "en") {
    if (value === "in_conversation") return "In conversation";
    if (value === "no_response") return "No reply";
    if (value === "won") return "Won";
    if (value === "lost") return "Lost";
    return "New";
  }
  if (value === "in_conversation") return "En conversación";
  if (value === "no_response") return "Sin respuesta";
  if (value === "won") return "Ganado";
  if (value === "lost") return "Perdido";
  return "Nuevo";
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export function TriagePreviewTable({ items }: Props) {
  const { lang } = useI18n();
  const copy =
    lang === "pt"
      ? {
          title: "Pré-visualização de triagem",
          subtitle: "Comparação entre a conversa atual e o output do motor novo.",
          empty: "Não há conversas para revisar.",
          headers: {
            customer: "Cliente",
            status: "Estado atual",
            lastMessage: "Última mensagem do cliente",
            current: "Atual",
            newEngine: "Motor novo",
            action: "Ação",
          },
          unclassified: "Sem classificação",
          open: "Abrir conversa",
        }
      : lang === "en"
        ? {
            title: "Triage preview",
            subtitle: "Comparison between the current conversation and the new engine output.",
            empty: "No conversations to review.",
            headers: {
              customer: "Customer",
              status: "Current status",
              lastMessage: "Last customer message",
              current: "Current",
              newEngine: "New engine",
              action: "Action",
            },
            unclassified: "Unclassified",
            open: "Open conversation",
          }
        : {
            title: "Vista previa de triage",
            subtitle: "Comparación entre la conversación actual y el output del motor nuevo.",
            empty: "No hay conversaciones para revisar.",
            headers: {
              customer: "Cliente",
              status: "Estado actual",
              lastMessage: "Último mensaje cliente",
              current: "Actual",
              newEngine: "Motor nuevo",
              action: "Acción",
            },
            unclassified: "Sin clasificar",
            open: "Abrir conversación",
          };

  return (
    <article className="card" style={{ marginTop: 12 }}>
      <p className="label">{copy.title}</p>
      <p className="subtitle">{copy.subtitle}</p>
      {items.length === 0 ? (
        <p className="subtitle">{copy.empty}</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>{copy.headers.customer}</th>
              <th>{copy.headers.status}</th>
              <th>{copy.headers.lastMessage}</th>
              <th>{copy.headers.current}</th>
              <th>{copy.headers.newEngine}</th>
              <th>{copy.headers.action}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.conversationId}>
                <td>
                  <strong>{item.contactName}</strong>
                  <p className="subtitle" style={{ marginBottom: 0 }}>
                    {formatStatus(item.conversationStatus, lang)} · {item.lastContactHoursAgo}h
                  </p>
                </td>
                <td>{formatStatus(item.conversationStatus, lang)}</td>
                <td>
                  <p style={{ margin: 0 }}>{item.lastCustomerMessage}</p>
                  <p className="subtitle" style={{ marginBottom: 0 }}>{formatDate(item.lastCustomerMessageAt)}</p>
                </td>
                <td>
                  <p style={{ margin: 0 }}>{item.currentLeadType ?? copy.unclassified}</p>
                  <p className="subtitle" style={{ marginBottom: 0 }}>{item.currentEstimatedValue} €</p>
                </td>
                <td>
                  <p style={{ margin: 0 }}>{item.triage.leadType}</p>
                  <p className="subtitle" style={{ marginBottom: 0 }}>
                    {item.triage.estimatedValue} € · {item.triage.priority} · {item.triage.riskStatus}
                  </p>
                  <p className="subtitle" style={{ marginBottom: 0 }}>{item.triage.nextAction}</p>
                </td>
                <td>
                  <Link className="button" href={`/conversation/${item.conversationId}`}>
                    {copy.open}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </article>
  );
}
