"use client";

import Link from "next/link";
import { useI18n } from "@/components/i18n/LanguageProvider";
import { LocaleMenu } from "@/components/i18n/LocaleMenu";

type AppNavProps = {
  showSetup?: boolean;
  showLocale?: boolean;
  userName?: string | null;
  userRole?: string | null;
};

function formatRole(role: string | null | undefined, lang: string) {
  if (lang === "pt") {
    if (role === "owner") return "Proprietário";
    if (role === "admin") return "Admin";
    if (role === "agent") return "Agente";
    return null;
  }

  if (lang === "en") {
    if (role === "owner") return "Owner";
    if (role === "admin") return "Admin";
    if (role === "agent") return "Agent";
    return null;
  }

  if (role === "owner") return "Propietario";
  if (role === "admin") return "Admin";
  if (role === "agent") return "Agente";
  return null;
}

export function AppNav({ showSetup = false, showLocale = false, userName, userRole }: AppNavProps) {
  const { t, lang } = useI18n();

  const links = [
    { href: "/dashboard", label: t("nav_dashboard") },
    { href: "/inbox", label: t("nav_inbox") },
    { href: "/settings", label: t("nav_settings") },
    ...(showSetup ? [{ href: "/setup-requests", label: "Setup" }] : []),
  ];

  return (
    <nav className="nav">
      <div className="nav-links">
        {links.map((link) => (
          <Link key={link.href} href={link.href}>
            {link.label}
          </Link>
        ))}
      </div>
      <div className="nav-meta">
        {userName ? (
          <div className="nav-user">
            <strong>{userName}</strong>
            {formatRole(userRole, lang) ? <span>{formatRole(userRole, lang)}</span> : null}
          </div>
        ) : null}
        {showLocale ? <LocaleMenu /> : null}
        <form action="/auth/signout" method="post">
          <button type="submit" className="mini-button">{t("nav_logout")}</button>
        </form>
      </div>
    </nav>
  );
}
