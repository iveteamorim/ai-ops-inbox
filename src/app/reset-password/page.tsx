"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MarketingNav } from "@/components/MarketingNav";
import { PasswordField } from "@/components/PasswordField";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/components/i18n/LanguageProvider";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useI18n();
  const supabase = useMemo(() => createClient(), []);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"booting" | "ready" | "done">("booting");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const ensureRecoverySession = useCallback(async () => {
    const code = searchParams.get("code");
    const tokenHash = searchParams.get("token_hash");
    const recoveryType = searchParams.get("type");

    if (code) {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (exchangeError) throw exchangeError;
    } else if (typeof window !== "undefined" && window.location.hash) {
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");

      if (accessToken && refreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (sessionError) throw sessionError;
      }
    } else if (tokenHash && recoveryType === "recovery") {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: "recovery",
      });
      if (verifyError) throw verifyError;
    }

    await new Promise((resolve) => setTimeout(resolve, 200));
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) throw sessionError;
    if (!session) throw new Error("Auth session missing!");
    return session;
  }, [searchParams, supabase]);

  useEffect(() => {
    let cancelled = false;

    async function bootstrapRecovery() {
      try {
        await ensureRecoverySession();
        if (!cancelled) setStatus("ready");
      } catch (recoveryError) {
        if (!cancelled) {
          setError(recoveryError instanceof Error ? recoveryError.message : t("reset_password_invalid"));
        }
      }
    }

    void bootstrapRecovery();
    return () => {
      cancelled = true;
    };
  }, [ensureRecoverySession, t]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError(t("reset_password_too_short"));
      return;
    }

    if (password !== confirmPassword) {
      setError(t("reset_password_mismatch"));
      return;
    }

    setLoading(true);
    try {
      await ensureRecoverySession();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;

      setStatus("done");
      router.push("/dashboard");
      router.refresh();
    } catch (updateErr) {
      setError(updateErr instanceof Error ? updateErr.message : t("reset_password_error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="page">
      <MarketingNav />
      <header className="header">
        <div>
          <h1 className="title">{t("reset_password_title")}</h1>
          <p className="subtitle">{t("reset_password_subtitle")}</p>
        </div>
      </header>

      <form className="card form" onSubmit={handleSubmit}>
        {status === "booting" ? <p className="subtitle">{t("reset_password_verifying")}</p> : null}
        {status === "ready" ? (
          <>
            <label className="label" htmlFor="reset-password">
              {t("accept_invite_password")}
            </label>
            <PasswordField id="reset-password" minLength={8} required value={password} onChange={setPassword} autoComplete="new-password" />

            <label className="label" htmlFor="reset-confirm-password">
              {t("accept_invite_confirm_password")}
            </label>
            <PasswordField id="reset-confirm-password" minLength={8} required value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password" />

            <button className="button" type="submit" disabled={loading}>
              {loading ? "..." : t("reset_password_submit")}
            </button>
          </>
        ) : null}

        {status === "done" ? <p className="subtitle">{t("reset_password_done")}</p> : null}
        {error ? <p className="warn">{error}</p> : null}
      </form>
    </section>
  );
}
