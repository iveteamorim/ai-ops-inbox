"use client";

import Link from "next/link";
import { useI18n } from "@/components/i18n/LanguageProvider";
import { LocaleMenu } from "@/components/i18n/LocaleMenu";

export function AppNav() {
  const { t } = useI18n();

  const links = [
    { href: "/dashboard", label: t("nav_dashboard") },
    { href: "/inbox", label: t("nav_inbox") },
    { href: "/revenue", label: t("nav_revenue") },
    { href: "/settings", label: t("nav_settings") },
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
      <Link href="/">{t("nav_landing")}</Link>
      <Link href="/auth/signout">{t("nav_logout")}</Link>
    </nav>
  );
}
