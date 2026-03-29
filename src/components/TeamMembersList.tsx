"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { TeamMemberView } from "@/lib/app-data";

type Props = {
  members: TeamMemberView[];
  currentUserId: string;
  currentUserRole: string;
  activeLabel: string;
  removeLabel: string;
  removingLabel: string;
  removeSuccess: string;
  removeError: string;
};

export function TeamMembersList({
  members,
  currentUserId,
  currentUserRole,
  activeLabel,
  removeLabel,
  removingLabel,
  removeSuccess,
  removeError,
}: Props) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function canRemove(member: TeamMemberView) {
    return currentUserRole === "owner" && member.id !== currentUserId && member.role !== "owner";
  }

  function handleRemove(memberId: string) {
    setMessage(null);
    setError(null);
    setPendingId(memberId);

    startTransition(async () => {
      const response = await fetch("/api/team-invite/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteId: memberId, action: "remove" }),
      });

      const payload = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!response.ok || !payload?.ok) {
        setError(payload?.error ?? removeError);
        setPendingId(null);
        return;
      }

      setMessage(removeSuccess);
      setPendingId(null);
      router.refresh();
    });
  }

  return (
    <div>
      {members.map((member) => {
        const removing = isPending && pendingId === member.id;

        return (
          <div key={member.id} className="preview-row">
            <span>{member.full_name ?? "Unnamed user"} ({member.role})</span>
            <div className="actions">
              <span className="badge status-active">{activeLabel}</span>
              {canRemove(member) ? (
                <button
                  className="mini-button mini-danger"
                  type="button"
                  disabled={isPending}
                  onClick={() => handleRemove(member.id)}
                >
                  {removing ? removingLabel : removeLabel}
                </button>
              ) : null}
            </div>
          </div>
        );
      })}
      {message ? <p className="note">{message}</p> : null}
      {error ? <p className="note">{error}</p> : null}
    </div>
  );
}
