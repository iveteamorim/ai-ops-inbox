"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { MarketingNav } from "@/components/MarketingNav";
import { PasswordField } from "@/components/PasswordField";
import { createClient } from "@/lib/supabase/client";
import { trialEndsAtIso } from "@/lib/trial";
import { useI18n } from "@/components/i18n/LanguageProvider";

export default function SignupPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [company, setCompany] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

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
      const trialEndsAt = trialEndsAtIso();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            company_name: company,
            full_name: name,
            trial_starts_at: new Date().toISOString(),
            trial_ends_at: trialEndsAt,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      if (!data.session) {
        setMessage("Check your email to confirm your account.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="page">
      <MarketingNav />
      <header className="header">
        <div>
          <h1 className="title">{t("signup_title")}</h1>
          <p className="subtitle">{t("signup_subtitle")}</p>
        </div>
      </header>

      <form className="card form" onSubmit={handleSubmit}>
        <label className="label" htmlFor="company">{t("form_company")}</label>
        <input id="company" className="input" type="text" required value={company} onChange={(e) => setCompany(e.target.value)} />

        <label className="label" htmlFor="name">{t("form_name")}</label>
        <input id="name" className="input" type="text" required value={name} onChange={(e) => setName(e.target.value)} />

        <label className="label" htmlFor="email">{t("form_email")}</label>
        <input id="email" className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />

        <label className="label" htmlFor="password">{t("form_password")}</label>
        <PasswordField id="password" required minLength={8} value={password} onChange={setPassword} autoComplete="new-password" />

        {error && <p className="warn">{error}</p>}
        {message && <p>{message}</p>}

        <button className="button" type="submit" disabled={loading}>{loading ? "..." : t("cta_create_account")}</button>

        <p style={{ marginBottom: 0 }}>
          {t("signup_have_account")} <Link href="/login">{t("nav_signin")}</Link>
        </p>
      </form>
    </section>
  );
}
