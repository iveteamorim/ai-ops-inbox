"use client";

import { useState } from "react";
import { getPublicAppUrl } from "@/lib/app-url";

type Labels = {
  name: string;
  email: string;
  phone: string;
  message: string;
  submit: string;
  sending: string;
  success: string;
  error: string;
  configError: string;
};

type Props = {
  token?: string;
  labels: Labels;
  className?: string;
};

export function NovuaLeadForm({ token, labels, className = "" }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  const formToken = token ?? process.env.NEXT_PUBLIC_NOVUA_FORM_TOKEN ?? "";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!formToken) {
      setStatus("error");
      return;
    }

    setStatus("sending");

    try {
      const endpoint = `${getPublicAppUrl()}/api/leads/form`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: formToken,
          name,
          email,
          phone,
          message,
        }),
      });

      const result = (await response.json().catch(() => ({}))) as { ok?: boolean };

      if (!response.ok || !result.ok) {
        setStatus("error");
        return;
      }

      setName("");
      setEmail("");
      setPhone("");
      setMessage("");
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  if (!formToken) {
    return <p className="novua-lead-form-note">{labels.configError}</p>;
  }

  return (
    <form className={`novua-lead-form ${className}`.trim()} onSubmit={handleSubmit}>
      <div className="novua-lead-form-grid">
        <label className="novua-lead-form-field">
          <span>{labels.name}</span>
          <input
            name="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            autoComplete="name"
          />
        </label>
        <label className="novua-lead-form-field">
          <span>{labels.email}</span>
          <input
            name="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
          />
        </label>
        <label className="novua-lead-form-field">
          <span>{labels.phone}</span>
          <input
            name="phone"
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            autoComplete="tel"
          />
        </label>
        <label className="novua-lead-form-field novua-lead-form-field-full">
          <span>{labels.message}</span>
          <textarea
            name="message"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={4}
            required
          />
        </label>
      </div>

      <button type="submit" className="novua-lead-form-submit" disabled={status === "sending"}>
        {status === "sending" ? labels.sending : labels.submit}
      </button>

      {status === "success" ? <p className="novua-lead-form-success">{labels.success}</p> : null}
      {status === "error" ? <p className="novua-lead-form-error">{labels.error}</p> : null}
    </form>
  );
}
