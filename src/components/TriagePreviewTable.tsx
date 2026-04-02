import Link from "next/link";
import type { ConversationTriagePreviewView } from "@/lib/app-data";

type Props = {
  items: ConversationTriagePreviewView[];
};

function formatStatus(value: ConversationTriagePreviewView["conversationStatus"]) {
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
  return (
    <article className="card" style={{ marginTop: 12 }}>
      <p className="label">Triage preview</p>
      <p className="subtitle">Comparación entre la conversación actual y el output del motor nuevo.</p>
      {items.length === 0 ? (
        <p className="subtitle">No hay conversaciones para revisar.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Estado actual</th>
              <th>Último mensaje cliente</th>
              <th>Actual</th>
              <th>Motor nuevo</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.conversationId}>
                <td>
                  <strong>{item.contactName}</strong>
                  <p className="subtitle" style={{ marginBottom: 0 }}>
                    {formatStatus(item.conversationStatus)} · {item.lastContactHoursAgo}h
                  </p>
                </td>
                <td>{formatStatus(item.conversationStatus)}</td>
                <td>
                  <p style={{ margin: 0 }}>{item.lastCustomerMessage}</p>
                  <p className="subtitle" style={{ marginBottom: 0 }}>{formatDate(item.lastCustomerMessageAt)}</p>
                </td>
                <td>
                  <p style={{ margin: 0 }}>{item.currentLeadType ?? "Sin clasificar"}</p>
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
                    Abrir conversación
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
