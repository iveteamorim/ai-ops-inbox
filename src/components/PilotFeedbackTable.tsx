import type { PilotFeedbackView } from "@/lib/app-data";

type Props = {
  items: PilotFeedbackView[];
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function formatCategory(value: PilotFeedbackView["category"]) {
  if (value === "feature_request") return "Feature request";
  if (value === "feedback") return "Feedback";
  return "Bug";
}

export function PilotFeedbackTable({ items }: Props) {
  return (
    <article className="card" style={{ marginTop: 12 }}>
      <p className="label">Feedback</p>
      {items.length === 0 ? (
        <p className="subtitle">No feedback yet.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>When</th>
              <th>Company</th>
              <th>Sent by</th>
              <th>Type</th>
              <th>Page</th>
              <th>Message</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{formatDate(item.createdAt)}</td>
                <td>{item.companyName}</td>
                <td>{item.sentBy}</td>
                <td>{formatCategory(item.category)}</td>
                <td>{item.pagePath ?? "—"}</td>
                <td>{item.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </article>
  );
}
