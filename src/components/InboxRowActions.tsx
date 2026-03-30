"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type TeamOption = {
  id: string;
  full_name: string | null;
  role: string;
};

type Props = {
  conversationId: string;
  currentStatus: "new" | "active" | "no_response" | "won" | "lost";
  currentAssignedToId: string | null;
  team: TeamOption[];
  canAssign: boolean;
  labels: {
    status: string;
    assignee: string;
    save: string;
    saving: string;
    unassigned: string;
    new: string;
    active: string;
    noResponse: string;
    won: string;
    lost: string;
  };
};

export function InboxRowActions({
  conversationId,
  currentStatus,
  currentAssignedToId,
  team,
  canAssign,
  labels,
}: Props) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [assignedTo, setAssignedTo] = useState(currentAssignedToId ?? "");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function save() {
    setError(null);
    startTransition(async () => {
      const response = await fetch("/api/conversations/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          status,
          assignedTo: canAssign ? assignedTo || null : undefined,
        }),
      });

      const payload = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!response.ok || !payload?.ok) {
        setError(payload?.error ?? "Could not update conversation.");
        return;
      }

      router.refresh();
    });
  }

  return (
    <div className="row-actions">
      <label className="sr-only" htmlFor={`status-${conversationId}`}>
        {labels.status}
      </label>
      <select
        id={`status-${conversationId}`}
        className="input row-select"
        value={status}
        onChange={(event) => setStatus(event.target.value as Props["currentStatus"])}
      >
        <option value="new">{labels.new}</option>
        <option value="active">{labels.active}</option>
        <option value="no_response">{labels.noResponse}</option>
        <option value="won">{labels.won}</option>
        <option value="lost">{labels.lost}</option>
      </select>

      {canAssign ? (
        <>
          <label className="sr-only" htmlFor={`assignee-${conversationId}`}>
            {labels.assignee}
          </label>
          <select
            id={`assignee-${conversationId}`}
            className="input row-select"
            value={assignedTo}
            onChange={(event) => setAssignedTo(event.target.value)}
          >
            <option value="">{labels.unassigned}</option>
            {team.map((member) => (
              <option key={member.id} value={member.id}>
                {member.full_name ?? "Unnamed user"} ({member.role})
              </option>
            ))}
          </select>
        </>
      ) : null}

      <button className="mini-button" type="button" disabled={isPending} onClick={save}>
        {isPending ? labels.saving : labels.save}
      </button>
      {error ? <span className="note">{error}</span> : null}
    </div>
  );
}
