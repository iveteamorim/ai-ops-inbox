"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { MarketingNav } from "@/components/MarketingNav";
import { PasswordField } from "@/components/PasswordField";
import { createClient } from "@/lib/supabase/client";
import { createPublicAuthClient } from "@/lib/supabase/public-auth-client";
import { useI18n } from "@/components/i18n/LanguageProvider";

const PUBLIC_DEMO_EMAILS = new Set(["demo@novua.digital"]);

function isPublicDemoEmail(value: string) {
  return PUBLIC_DEMO_EMAILS.has(value.trim().toLowerCase());
}

export default function LoginPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!url || !anonKey) {
        setError("Auth is not configured. Add Supabase env vars.");
        return;
      }

      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setError(signInError.message);
        return;
      }
      await fetch("/api/demo/reset", { method: "POST" }).catch(() => null);
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    setError(null);
    setMessage(null);

    if (!email.trim()) {
      setError(t("login_forgot_requires_email"));
      return;
    }

    if (isPublicDemoEmail(email)) {
      setMessage(t("login_demo_reset_blocked"));
      return;
    }

    setResetLoading(true);
    try {
      const supabase = createPublicAuthClient();
      const redirectTo =
        typeof window !== "undefined" ? `${window.location.origin}/reset-password` : undefined;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo,
      });

      if (resetError) {
        setError(resetError.message);
        return;
      }

      setMessage(t("login_forgot_sent"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("login_forgot_error"));
    } finally {
      setResetLoading(false);
    }
  }

  return (
    <section className="page">
      <MarketingNav
        showSections={false}
        showSignIn={false}
        showStartFree={false}
        showBackToLanding
      />
      <header className="header">
        <div>
          <h1 className="title">{t("login_title")}</h1>
          <p className="subtitle">{t("login_subtitle")}</p>
        </div>
      </header>

      <form className="card form" onSubmit={handleSubmit}>
        <label className="label" htmlFor="email">{t("form_email")}</label>
        <input id="email" className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />

        <label className="label" htmlFor="password">{t("form_password")}</label>
        <PasswordField id="password" required value={password} onChange={setPassword} autoComplete="current-password" />

        {error && <p className="warn">{error}</p>}
        {message && <p className="note">{message}</p>}

        <button className="button" type="submit" disabled={loading}>
          {loading ? "..." : t("nav_signin")}
        </button>

        <button
          className="action-link"
          type="button"
          disabled={resetLoading}
          onClick={handleForgotPassword}
        >
          {resetLoading ? "..." : t("login_forgot_password")}
        </button>

        <p style={{ marginBottom: 0 }}>
          {t("login_no_account")} <Link href="/signup">{t("nav_start_free")}</Link>
        </p>
      </form>
    </section>
  );
}
