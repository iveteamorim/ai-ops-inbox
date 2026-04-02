"use client";

import type { PilotFeedbackView } from "@/lib/app-data";
import { useState, useTransition } from "react";

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
  const [drafts, setDrafts] = useState<Record<string, string>>(
    Object.fromEntries(items.map((item) => [item.id, item.adminReply ?? ""])),
  );
  const [statuses, setStatuses] = useState<Record<string, PilotFeedbackView["status"]>>(
    Object.fromEntries(items.map((item) => [item.id, item.status])),
  );
  const [saved, setSaved] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  function save(feedbackId: string) {
    setSaved((current) => ({ ...current, [feedbackId]: "" }));
    startTransition(async () => {
      const response = await fetch("/api/pilot-feedback/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feedbackId,
          status: statuses[feedbackId],
          adminReply: drafts[feedbackId] ?? "",
        }),
      });

      const payload = (await response.json().catch(() => null)) as { ok?: boolean } | null;
      setSaved((current) => ({
        ...current,
        [feedbackId]: response.ok && payload?.ok ? "Saved." : "Could not save.",
      }));
    });
  }

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
              <th>Status</th>
              <th>Reply</th>
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
                <td style={{ minWidth: 160 }}>
                  <select
                    className="input"
                    value={statuses[item.id] ?? item.status}
                    onChange={(event) =>
                      setStatuses((current) => ({
                        ...current,
                        [item.id]: event.target.value as PilotFeedbackView["status"],
                      }))
                    }
                  >
                    <option value="new">New</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="closed">Closed</option>
                  </select>
                </td>
                <td style={{ minWidth: 320 }}>
                  <textarea
                    className="input"
                    rows={3}
                    placeholder="Single reply visible to the customer"
                    value={drafts[item.id] ?? ""}
                    onChange={(event) =>
                      setDrafts((current) => ({
                        ...current,
                        [item.id]: event.target.value,
                      }))
                    }
                  />
                  <div className="actions" style={{ marginTop: 8 }}>
                    <button className="button" type="button" disabled={isPending} onClick={() => save(item.id)}>
                      Save
                    </button>
                  </div>
                  {item.repliedAt ? <p className="subtitle" style={{ marginBottom: 0 }}>Last reply: {formatDate(item.repliedAt)}</p> : null}
                  {saved[item.id] ? <p className="subtitle" style={{ marginBottom: 0 }}>{saved[item.id]}</p> : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </article>
  );
}
