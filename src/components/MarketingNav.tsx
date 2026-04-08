"use client";

import Link from "next/link";
import { useI18n } from "@/components/i18n/LanguageProvider";
import { LocaleMenu } from "@/components/i18n/LocaleMenu";

type Props = {
  showHome?: boolean;
  showBackToLanding?: boolean;
  showSections?: boolean;
  showLocale?: boolean;
  showSignIn?: boolean;
  showStartFree?: boolean;
};

export function MarketingNav({
  showHome = true,
  showBackToLanding = false,
  showSections = true,
  showLocale = true,
  showSignIn = true,
  showStartFree = true,
}: Props) {
  const { t } = useI18n();

  return (
    <nav className="nav marketing-nav">
      {showHome ? (
        <Link href="/">{showBackToLanding ? `← ${t("nav_landing")}` : t("nav_home")}</Link>
      ) : null}
      {showSections ? <a href="#revenue">{t("nav_revenue_ai")}</a> : null}
      {showSections ? <a href="#features">{t("nav_features")}</a> : null}
      <span className="nav-spacer" />
      {showLocale ? <LocaleMenu /> : null}
      {showSignIn ? <Link href="/login">{t("nav_signin")}</Link> : null}
      {showStartFree ? (
        <Link className="button" href="/signup">
          {t("nav_start_free")}
        </Link>
      ) : null}
    </nav>
  );
}
