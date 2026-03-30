"use client";

import Link from "next/link";
import { useI18n } from "@/components/i18n/LanguageProvider";
import { LocaleMenu } from "@/components/i18n/LocaleMenu";

type AppNavProps = {
  showSetup?: boolean;
};

export function AppNav({ showSetup = false }: AppNavProps) {
  const { t } = useI18n();

  const links = [
    { href: "/dashboard", label: t("nav_dashboard") },
    { href: "/inbox", label: t("nav_inbox") },
    { href: "/revenue", label: t("nav_revenue") },
    { href: "/settings", label: t("nav_settings") },
    ...(showSetup ? [{ href: "/setup-requests", label: "Setup" }] : []),
  ];

  return (
    <nav className="nav">
      {links.map((link) => (
        <Link key={link.href} href={link.href}>
          {link.label}
        </Link>
      ))}
      <span className="nav-spacer" />
      <LocaleMenu />
      <form action="/auth/signout" method="post">
        <button type="submit" className="mini-button">{t("nav_logout")}</button>
      </form>
    </nav>
  );
}
