"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useI18n } from "@/components/i18n/LanguageProvider";
import type { SetupRequestView } from "@/lib/app-data";

type Props = {
  requests: SetupRequestView[];
};

export function SetupRequestsTable({ requests }: Props) {
  const router = useRouter();
  const { lang } = useI18n();
  const [filter, setFilter] = useState<"all" | "requested" | "in_progress" | "completed">("all");
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const copy =
    lang === "pt"
      ? {
          title: "Solicitações de setup",
          empty: "Ainda não há solicitações de setup.",
          filters: {
            all: "Todos",
            requested: "Solicitado",
            inProgress: "Em curso",
            completed: "Concluído",
          },
          status: {
            requested: "solicitado",
            inProgress: "em curso",
            completed: "concluído",
            cancelled: "cancelado",
          },
          actions: {
            markInProgress: "Marcar como em curso",
            markCompleted: "Marcar como concluído",
            saving: "Guardando...",
            updating: "A atualizar...",
            failed: "Não foi possível atualizar.",
          },
        }
      : lang === "en"
        ? {
            title: "Setup requests",
            empty: "No setup requests yet.",
            filters: {
              all: "All",
              requested: "Requested",
              inProgress: "In progress",
              completed: "Completed",
            },
            status: {
              requested: "requested",
              inProgress: "in progress",
              completed: "completed",
              cancelled: "cancelled",
            },
            actions: {
              markInProgress: "Mark in progress",
              markCompleted: "Mark completed",
              saving: "Saving...",
              updating: "Updating...",
              failed: "Request failed",
            },
          }
        : {
            title: "Solicitudes de setup",
            empty: "Todavía no hay solicitudes de setup.",
            filters: {
              all: "Todas",
              requested: "Solicitada",
              inProgress: "En curso",
              completed: "Completada",
            },
            status: {
              requested: "solicitada",
              inProgress: "en curso",
              completed: "completada",
              cancelled: "cancelada",
            },
            actions: {
              markInProgress: "Marcar en curso",
              markCompleted: "Marcar completada",
              saving: "Guardando...",
              updating: "Actualizando...",
              failed: "No se pudo actualizar.",
            },
          };

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
        setError(payload?.error ?? copy.actions.failed);
        setPendingKey(null);
        return;
      }

      setPendingKey(null);
      router.refresh();
    });
  }

  return (
    <article className="card">
      <p className="label">{copy.title}</p>
      <div className="actions" style={{ marginBottom: 12 }}>
        {[
          ["all", copy.filters.all],
          ["requested", copy.filters.requested],
          ["in_progress", copy.filters.inProgress],
          ["completed", copy.filters.completed],
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
      {requests.length === 0 ? <p className="subtitle">{copy.empty}</p> : null}
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
              {request.status === "requested"
                ? copy.status.requested
                : request.status === "in_progress"
                  ? copy.status.inProgress
                  : request.status === "completed"
                    ? copy.status.completed
                    : copy.status.cancelled}
            </span>
            {request.status !== "in_progress" ? (
              <button
                className="mini-button"
                type="button"
                disabled={isPending}
                onClick={() => handleStatus(request.id, "in_progress")}
              >
                {pendingKey === `${request.id}:in_progress` ? copy.actions.saving : copy.actions.markInProgress}
              </button>
            ) : null}
            {request.status !== "completed" ? (
              <button
                className="mini-button"
                type="button"
                disabled={isPending}
                onClick={() => handleStatus(request.id, "completed")}
              >
                {pendingKey === `${request.id}:completed` ? copy.actions.saving : copy.actions.markCompleted}
              </button>
            ) : null}
          </div>
        </div>
      ))}
      {isPending ? <p className="note">{copy.actions.updating}</p> : null}
      {error ? <p className="note">{error}</p> : null}
    </article>
  );
}
