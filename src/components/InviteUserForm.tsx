"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Props = {
  title: string;
  seatsNote?: string;
  emailLabel: string;
  roleLabel: string;
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
  roleLabel,
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
          setError(payload?.error ?? errorGeneric);
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
    <form className="form compact-form" onSubmit={handleSubmit}>
      <p className="note">{title}</p>
      {seatsNote ? <p className="note">{seatsNote}</p> : null}
      <label className="label" htmlFor="invite-email">
        {emailLabel}
      </label>
      <input
        id="invite-email"
        className="input"
        type="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />
      <label className="label" htmlFor="invite-role">
        {roleLabel}
      </label>
      <select
        id="invite-role"
        className="input"
        value={role}
        onChange={(event) => setRole(event.target.value === "admin" ? "admin" : "agent")}
      >
        <option value="agent">{agentLabel}</option>
        <option value="admin">{adminLabel}</option>
      </select>
      <div className="actions">
        <button className="button" type="submit" disabled={isPending}>
          {isPending ? pendingLabel : submitLabel}
        </button>
      </div>
      {success ? <p className="note">{success}</p> : null}
      {error ? <p className="note">{error}</p> : null}
    </form>
  );
}
