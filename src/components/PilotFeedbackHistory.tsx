import type { UserPilotFeedbackView } from "@/lib/app-data";

type Props = {
  items: UserPilotFeedbackView[];
  labels: {
    title: string;
    empty: string;
    status: string;
    page: string;
    reply: string;
    new: string;
    reviewed: string;
    closed: string;
  };
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function formatCategory(value: UserPilotFeedbackView["category"]) {
  if (value === "feature_request") return "Feature request";
  if (value === "feedback") return "Feedback";
  return "Bug";
}

function formatStatus(value: UserPilotFeedbackView["status"], labels: Props["labels"]) {
  if (value === "reviewed") return labels.reviewed;
  if (value === "closed") return labels.closed;
  return labels.new;
}

export function PilotFeedbackHistory({ items, labels }: Props) {
  return (
    <article className="card" style={{ marginTop: 12 }}>
      <p className="label">{labels.title}</p>
      {items.length === 0 ? (
        <p className="subtitle">{labels.empty}</p>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {items.map((item) => (
            <div key={item.id} style={{ borderTop: "1px solid var(--border)", paddingTop: 12 }}>
              <div className="preview-row">
                <span>{formatCategory(item.category)}</span>
                <span className="badge status-active">{formatStatus(item.status, labels)}</span>
              </div>
              <p style={{ margin: "8px 0 0" }}>{item.message}</p>
              <p className="subtitle" style={{ marginBottom: 0 }}>
                {formatDate(item.createdAt)} · {labels.page}: {item.pagePath ?? "—"}
              </p>
              {item.adminReply ? (
                <div style={{ marginTop: 10 }}>
                  <p className="label" style={{ marginBottom: 6 }}>{labels.reply}</p>
                  <p style={{ margin: 0 }}>{item.adminReply}</p>
                  {item.repliedAt ? (
                    <p className="subtitle" style={{ marginBottom: 0 }}>{formatDate(item.repliedAt)}</p>
                  ) : null}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </article>
  );
}
