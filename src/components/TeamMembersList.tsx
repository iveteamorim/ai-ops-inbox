"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { TeamMemberView } from "@/lib/app-data";

type Props = {
  members: TeamMemberView[];
  currentUserId: string;
  currentUserRole: string;
  activeLabel: string;
  reassignPlaceholder: string;
  reassignLabel: string;
  reassigningLabel: string;
  reassignSuccess: string;
  reassignError: string;
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
  reassignPlaceholder,
  reassignLabel,
  reassigningLabel,
  reassignSuccess,
  reassignError,
  removeLabel,
  removingLabel,
  removeSuccess,
  removeError,
}: Props) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<"remove" | "reassign" | null>(null);
  const [reassignTargetByMember, setReassignTargetByMember] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  function canRemove(member: TeamMemberView) {
    return currentUserRole === "owner" && member.id !== currentUserId && member.role !== "owner";
  }

  function canReassign(member: TeamMemberView) {
    return (currentUserRole === "owner" || currentUserRole === "admin") && members.some((candidate) => candidate.id !== member.id);
  }

  function canViewStats() {
    return currentUserRole === "owner" || currentUserRole === "admin";
  }

  function handleRemove(memberId: string) {
    setMessage(null);
    setError(null);
    setPendingId(memberId);
    setPendingAction("remove");

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
        setPendingAction(null);
        return;
      }

      setMessage(removeSuccess);
      setPendingId(null);
      setPendingAction(null);
      router.refresh();
    });
  }

  function handleReassign(memberId: string) {
    const targetUserId = reassignTargetByMember[memberId] ?? "";
    if (!targetUserId) return;

    setMessage(null);
    setError(null);
    setPendingId(memberId);
    setPendingAction("reassign");

    startTransition(async () => {
      const response = await fetch("/api/team-invite/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteId: memberId, action: "reassign", targetUserId }),
      });

      const payload = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!response.ok || !payload?.ok) {
        setError(payload?.error ?? reassignError);
        setPendingId(null);
        setPendingAction(null);
        return;
      }

      setMessage(reassignSuccess);
      setPendingId(null);
      setPendingAction(null);
      setReassignTargetByMember((current) => ({ ...current, [memberId]: "" }));
      router.refresh();
    });
  }

  return (
    <div>
      {members.map((member) => {
        const removing = isPending && pendingId === member.id && pendingAction === "remove";
        const reassigning = isPending && pendingId === member.id && pendingAction === "reassign";
        const reassignOptions = members.filter((candidate) => candidate.id !== member.id);

        return (
          <div key={member.id} className="team-member-row">
            <div className="team-member-main">
              <div className="team-member-heading">
                <strong>{member.full_name ?? "Unnamed user"}</strong>
                <span className="badge team-role-badge">{member.role}</span>
              </div>
              <p className="subtitle team-member-load">
                {member.openConversations} conversaciones abiertas
              </p>
              {canViewStats() ? (
                <details className="team-member-stats">
                  <summary>Ver detalle</summary>
                  <div className="team-member-stats-grid">
                    <span>Abiertas</span>
                    <strong>{member.openConversations}</strong>
                    <span>Sin respuesta</span>
                    <strong>{member.atRiskConversations}</strong>
                    <span>Ganadas</span>
                    <strong>{member.wonConversations}</strong>
                    <span>Perdidas</span>
                    <strong>{member.lostConversations}</strong>
                  </div>
                </details>
              ) : null}
            </div>
            <div className="actions team-member-actions">
              <span className="badge status-active">{activeLabel}</span>
              {canReassign(member) ? (
                <div className="team-reassign">
                  <select
                    className="input row-select"
                    value={reassignTargetByMember[member.id] ?? ""}
                    onChange={(event) =>
                      setReassignTargetByMember((current) => ({ ...current, [member.id]: event.target.value }))
                    }
                    disabled={isPending}
                  >
                    <option value="">{reassignPlaceholder}</option>
                    {reassignOptions.map((candidate) => (
                      <option key={candidate.id} value={candidate.id}>
                        {candidate.full_name ?? "Unnamed user"}
                      </option>
                    ))}
                  </select>
                  <button
                    className="mini-button"
                    type="button"
                    disabled={isPending || !(reassignTargetByMember[member.id] ?? "")}
                    onClick={() => handleReassign(member.id)}
                  >
                    {reassigning ? reassigningLabel : reassignLabel}
                  </button>
                </div>
              ) : null}
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
