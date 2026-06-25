"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useI18n } from "@/components/i18n/LanguageProvider";

type Props = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

export function AuthPageShell({ title, subtitle, children }: Props) {
  const { t } = useI18n();

  return (
    <section className="auth-page landing-page relative min-h-screen overflow-hidden bg-[#0a1628] text-white -m-4 md:-m-6">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-10%] top-[-4%] h-[34rem] w-[34rem] rounded-full bg-[#1e3a5f]/22 blur-3xl" />
        <div className="absolute right-[-8%] top-16 h-[28rem] w-[28rem] rounded-full bg-white/[0.04] blur-3xl" />
        <div className="absolute left-[34%] top-[42%] h-[18rem] w-[18rem] rounded-full bg-[#111f35]/60 blur-3xl" />
      </div>

      <Link
        href="/"
        className="auth-back-link"
        aria-label={t("nav_landing")}
        title={t("nav_landing")}
      >
        ←
      </Link>

      <div className="auth-page-layout">
        <div className="auth-panel">
          <header className="auth-panel-header">
            <p className="auth-panel-kicker">Novua</p>
            <h1 className="auth-panel-title">{title}</h1>
            <p className="auth-panel-subtitle">{subtitle}</p>
          </header>
          <div className="auth-panel-body">{children}</div>
        </div>
      </div>
    </section>
  );
}
