"use client";

import { useEffect, useMemo, useState } from "react";
import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MarketingNav } from "@/components/MarketingNav";
import { PasswordField } from "@/components/PasswordField";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/components/i18n/LanguageProvider";

export default function AcceptInvitePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useI18n();
  const supabase = useMemo(() => createClient(), []);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"booting" | "ready" | "done">("booting");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const ensureInviteSession = useCallback(async () => {
    const code = searchParams.get("code");
    const tokenHash = searchParams.get("token_hash");
    const inviteType = searchParams.get("type");

    if (code) {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (exchangeError) {
        throw exchangeError;
      }
    } else if (typeof window !== "undefined" && window.location.hash) {
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");

      if (accessToken && refreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (sessionError) {
          throw sessionError;
        }
      }
    } else if (tokenHash && inviteType === "invite") {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: "invite",
      });
      if (verifyError) {
        throw verifyError;
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 200));
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      throw sessionError;
    }

    if (!session) {
      throw new Error("Auth session missing!");
    }

    return session;
  }, [searchParams, supabase]);

  useEffect(() => {
    let cancelled = false;

    async function bootstrapInviteSession() {
      try {
        await ensureInviteSession();

        if (!cancelled) {
          setStatus("ready");
        }
      } catch (inviteError) {
        if (!cancelled) {
          setError(inviteError instanceof Error ? inviteError.message : "Invitation could not be verified.");
        }
      }
    }

    void bootstrapInviteSession();
    return () => {
      cancelled = true;
    };
  }, [ensureInviteSession]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await ensureInviteSession();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        throw updateError;
      }

      setStatus("done");
      router.push("/dashboard");
      router.refresh();
    } catch (updateErr) {
      setError(updateErr instanceof Error ? updateErr.message : "Could not complete invite.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="page">
      <MarketingNav />
      <header className="header">
        <div>
          <h1 className="title">{t("accept_invite_title")}</h1>
          <p className="subtitle">{t("accept_invite_subtitle")}</p>
        </div>
      </header>

      <form className="card form" onSubmit={handleSubmit}>
        {status === "booting" ? <p className="subtitle">{t("accept_invite_verifying")}</p> : null}
        {status === "ready" ? (
          <>
            <label className="label" htmlFor="invite-password">
              {t("accept_invite_password")}
            </label>
            <PasswordField id="invite-password" minLength={8} required value={password} onChange={setPassword} autoComplete="new-password" />

            <label className="label" htmlFor="invite-confirm-password">
              {t("accept_invite_confirm_password")}
            </label>
            <PasswordField id="invite-confirm-password" minLength={8} required value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password" />

            <button className="button" type="submit" disabled={loading}>
              {loading ? "..." : t("accept_invite_submit")}
            </button>
          </>
        ) : null}

        {status === "done" ? <p className="subtitle">{t("accept_invite_done")}</p> : null}
        {error ? <p className="warn">{error}</p> : null}
      </form>
    </section>
  );
}
