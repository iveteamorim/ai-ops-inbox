"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { SetupRequestView } from "@/lib/app-data";

type Props = {
  requests: SetupRequestView[];
};

export function SetupRequestsTable({ requests }: Props) {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "requested" | "in_progress" | "completed">("all");
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const statusPriority: Record<SetupRequestView["status"], number> = {
    requested: 0,
    in_progress: 1,
    completed: 2,
    cancelled: 3,
  };

  const visibleRequests = [...requests]
    .sort((a, b) => {
      const priorityDiff = statusPriority[a.status] - statusPriority[b.status];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })
    .filter((request) => filter === "all" || request.status === filter);

  function handleStatus(requestId: string, status: SetupRequestView["status"]) {
    setError(null);
    setPendingKey(`${requestId}:${status}`);

    startTransition(async () => {
      const response = await fetch("/api/setup-request/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, status }),
      });

      const payload = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!response.ok || !payload?.ok) {
        setError(payload?.error ?? "Request failed");
        setPendingKey(null);
        return;
      }

      setPendingKey(null);
      router.refresh();
    });
  }

  return (
    <article className="card">
      <p className="label">Setup requests</p>
      <div className="actions" style={{ marginBottom: 12 }}>
        {[
          ["all", "All"],
          ["requested", "Requested"],
          ["in_progress", "In progress"],
          ["completed", "Completed"],
        ].map(([value, label]) => (
          <button
            key={value}
            className={`mini-button ${filter === value ? "is-active" : ""}`}
            type="button"
            onClick={() =>
              setFilter(value as "all" | "requested" | "in_progress" | "completed")
            }
          >
            {label}
          </button>
        ))}
      </div>
      {requests.length === 0 ? <p className="subtitle">No setup requests yet.</p> : null}
      {visibleRequests.map((request) => (
        <div key={request.id} className="preview-row" style={{ alignItems: "flex-start" }}>
          <div>
            <div style={{ fontWeight: 600 }}>{request.companyName}</div>
            <div className="note">
              {request.channel} · {request.requestedBy}
            </div>
            {request.notes ? <div className="note" style={{ marginTop: 6, whiteSpace: "pre-line" }}>{request.notes}</div> : null}
          </div>
          <div className="actions">
            <span className={`badge ${
              request.status === "completed"
                ? "status-active"
                : request.status === "in_progress"
                  ? "status-new"
                  : "status-no-response"
            }`}>
              {request.status}
            </span>
            {request.status !== "in_progress" ? (
              <button
                className="mini-button"
                type="button"
                disabled={isPending}
                onClick={() => handleStatus(request.id, "in_progress")}
              >
                {pendingKey === `${request.id}:in_progress` ? "Saving..." : "Mark in progress"}
              </button>
            ) : null}
            {request.status !== "completed" ? (
              <button
                className="mini-button"
                type="button"
                disabled={isPending}
                onClick={() => handleStatus(request.id, "completed")}
              >
                {pendingKey === `${request.id}:completed` ? "Saving..." : "Mark completed"}
              </button>
            ) : null}
          </div>
        </div>
      ))}
      {isPending ? <p className="note">Updating...</p> : null}
      {error ? <p className="note">{error}</p> : null}
    </article>
  );
}
