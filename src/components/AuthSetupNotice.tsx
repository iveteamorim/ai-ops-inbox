"use client";

import Link from "next/link";
import { useI18n } from "@/components/i18n/LanguageProvider";
import { DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/demo-credentials";

function isAuthConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(url && anonKey && !url.includes("YOUR-PROJECT"));
}

export function AuthSetupNotice() {
  const { t } = useI18n();

  if (isAuthConfigured()) {
    return null;
  }

  return (
    <div className="auth-setup-notice">
      <p className="auth-setup-notice-title">{t("login_local_setup_title")}</p>
      <p className="auth-setup-notice-copy">{t("login_local_setup_body")}</p>
      <ol className="auth-setup-notice-steps">
        <li>{t("login_local_setup_step_1")}</li>
        <li>{t("login_local_setup_step_2")}</li>
        <li>{t("login_local_setup_step_3")}</li>
      </ol>
      <div className="auth-setup-notice-demo">
        <p>{t("login_local_setup_demo")}</p>
        <code>{DEMO_EMAIL}</code>
        <code>{DEMO_PASSWORD}</code>
      </div>
      <p className="auth-setup-notice-copy">
        {t("login_local_setup_prod")}{" "}
        <Link href="https://app.novua.digital/login?demo=1" target="_blank" rel="noreferrer">
          app.novua.digital/login?demo=1
        </Link>
      </p>
    </div>
  );
}
