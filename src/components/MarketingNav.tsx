"use client";

import Link from "next/link";
import { useI18n } from "@/components/i18n/LanguageProvider";
import { LocaleMenu } from "@/components/i18n/LocaleMenu";

type Props = {
  showSections?: boolean;
};

export function MarketingNav({ showSections = true }: Props) {
  const { t } = useI18n();

  return (
    <nav className="nav marketing-nav">
      <Link href="/">{t("nav_home")}</Link>
      {showSections ? <a href="#revenue">{t("nav_revenue_ai")}</a> : null}
      {showSections ? <a href="#features">{t("nav_features")}</a> : null}
      <span className="nav-spacer" />
      <LocaleMenu />
      <Link href="/login">{t("nav_signin")}</Link>
      <Link className="button" href="/signup">
        {t("nav_start_free")}
      </Link>
    </nav>
  );
}
