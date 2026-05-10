"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/demo-credentials";
import { useI18n } from "@/components/i18n/LanguageProvider";

export default function DemoEntryPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [status, setStatus] = useState(t("demo_entry_loading"));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function enterDemo() {
      setError(null);
      setStatus(t("demo_entry_loading"));

      try {
        const supabase = createClient();
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: DEMO_EMAIL,
          password: DEMO_PASSWORD,
        });

        if (signInError) {
          throw signInError;
        }

        if (!cancelled) {
          setStatus(t("demo_entry_resetting"));
        }

        await fetch("/api/demo/reset", { method: "POST" }).catch(() => null);

        if (!cancelled) {
          router.replace("/dashboard");
          router.refresh();
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : t("demo_entry_error"));
          setStatus(t("demo_entry_error"));
        }
      }
    }

    enterDemo();

    return () => {
      cancelled = true;
    };
  }, [router, t]);

  return (
    <section className="page demo-entry-page">
      <div className="card demo-entry-card">
        <p className="eyebrow">{t("demo_entry_eyebrow")}</p>
        <h1 className="title">{t("demo_entry_title")}</h1>
        <p className="subtitle">{status}</p>

        {error ? (
          <div className="demo-credentials">
            <p className="warn">{error}</p>
            <p>{t("demo_entry_fallback")}</p>
            <code>{DEMO_EMAIL}</code>
            <code>{DEMO_PASSWORD}</code>
            <Link className="button" href="/login?demo=1">
              {t("demo_entry_login_link")}
            </Link>
          </div>
        ) : (
          <div className="demo-loader" aria-label={status} />
        )}
      </div>
    </section>
  );
}

