"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Props = {
  title: string;
  seatsNote?: string;
  emailLabel: string;
  submitLabel: string;
  pendingLabel: string;
  successLabel: string;
  adminLabel: string;
  agentLabel: string;
  errorGeneric: string;
  seatLimitError: string;
};

export function InviteUserForm({
  title,
  seatsNote,
  emailLabel,
  submitLabel,
  pendingLabel,
  successLabel,
  adminLabel,
  agentLabel,
  errorGeneric,
  seatLimitError,
}: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "agent">("agent");
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const response = await fetch("/api/team-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });

      const payload = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!response.ok || !payload?.ok) {
        if (payload?.error === "seat_limit_reached") {
          setError(seatLimitError);
        } else {
          setError(errorGeneric);
        }
        return;
      }

      setEmail("");
      setRole("agent");
      setSuccess(successLabel);
      router.refresh();
    });
  }

  return (
    <form className="settings-inline-form" onSubmit={handleSubmit}>
      <p className="note settings-inline-form-title">{title}</p>
      {seatsNote ? <p className="note settings-inline-form-note">{seatsNote}</p> : null}
      <input
        id="invite-email"
        className="input settings-inline-input"
        type="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder={emailLabel}
      />
      <select
        id="invite-role"
        className="input settings-inline-select"
        value={role}
        onChange={(event) => setRole(event.target.value === "admin" ? "admin" : "agent")}
      >
        <option value="agent">{agentLabel}</option>
        <option value="admin">{adminLabel}</option>
      </select>
      <div className="settings-inline-actions">
        <button className="button" type="submit" disabled={isPending}>
          {isPending ? pendingLabel : submitLabel}
        </button>
      </div>
      {success ? <p className="note">{success}</p> : null}
      {error ? <p className="note">{error}</p> : null}
    </form>
  );
}
