"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { MarketingNav } from "@/components/MarketingNav";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/components/i18n/LanguageProvider";
import { DEMO_AUTH_COOKIE } from "@/lib/auth/constants";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!url || !anonKey) {
        document.cookie = `${DEMO_AUTH_COOKIE}=1; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`;
        router.push("/dashboard");
        router.refresh();
        return;
      }

      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setError(signInError.message);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="page">
      <MarketingNav />
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
        <input id="password" className="input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />

        {error && <p className="warn">{error}</p>}

        <button className="button" type="submit" disabled={loading}>
          {loading ? "..." : t("nav_signin")}
        </button>

        <p style={{ marginBottom: 0 }}>
          {t("login_no_account")} <Link href="/signup">{t("nav_start_free")}</Link>
        </p>
      </form>
    </section>
  );
}
