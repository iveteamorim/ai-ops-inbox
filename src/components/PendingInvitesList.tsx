"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { PendingInviteView } from "@/lib/app-data";

type Props = {
  invites: PendingInviteView[];
  title: string;
  resendLabel: string;
  cancelLabel: string;
  sendingLabel: string;
  cancellingLabel: string;
  successResent: string;
  successCancelled: string;
};

export function PendingInvitesList({
  invites,
  title,
  resendLabel,
  cancelLabel,
  sendingLabel,
  cancellingLabel,
  successResent,
  successCancelled,
}: Props) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleAction(inviteId: string, action: "resend" | "cancel") {
    setError(null);
    setMessage(null);
    setPendingKey(`${action}:${inviteId}`);

    startTransition(async () => {
      const response = await fetch("/api/team-invite/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteId, action }),
      });
      const payload = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null;

      if (!response.ok || !payload?.ok) {
        setError(payload?.error ?? "Request failed");
        setPendingKey(null);
        return;
      }

      setMessage(action === "resend" ? successResent : successCancelled);
      setPendingKey(null);
      router.refresh();
    });
  }

  return (
    <div style={{ marginTop: 12 }}>
      <p className="label" style={{ marginBottom: 8 }}>
        {title}
      </p>
      {invites.map((invite) => {
        const resendPending = isPending && pendingKey === `resend:${invite.id}`;
        const cancelPending = isPending && pendingKey === `cancel:${invite.id}`;

        return (
          <div key={invite.id} className="preview-row">
            <span>
              {invite.email} ({invite.role})
            </span>
            <div className="actions">
              <button
                className="mini-button"
                type="button"
                disabled={isPending}
                onClick={() => handleAction(invite.id, "resend")}
              >
                {resendPending ? sendingLabel : resendLabel}
              </button>
              <button
                className="mini-button mini-danger"
                type="button"
                disabled={isPending}
                onClick={() => handleAction(invite.id, "cancel")}
              >
                {cancelPending ? cancellingLabel : cancelLabel}
              </button>
            </div>
          </div>
        );
      })}
      {message ? <p className="note">{message}</p> : null}
      {error ? <p className="note">{error}</p> : null}
    </div>
  );
}
