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
    <section className="auth-page landing-page relative min-h-screen overflow-hidden bg-[#06080f] text-white -m-4 md:-m-6">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-10%] top-[-4%] h-[34rem] w-[34rem] rounded-full bg-[#7a6cf0]/14 blur-3xl" />
        <div className="absolute right-[-8%] top-16 h-[30rem] w-[30rem] rounded-full bg-[#9b7cf2]/10 blur-3xl" />
        <div className="absolute left-[34%] top-[42%] h-[20rem] w-[20rem] rounded-full bg-[#cf87d8]/6 blur-3xl" />
      </div>

      <div className="page relative mx-auto max-w-2xl px-4 py-6 sm:px-6">
        <Link
          href="/"
          className="auth-back-link"
          aria-label={t("nav_landing")}
          title={t("nav_landing")}
        >
          ←
        </Link>
        <header className="header">
          <div>
            <h1 className="title">{title}</h1>
            <p className="subtitle">{subtitle}</p>
          </div>
        </header>
        {children}
      </div>
    </section>
  );
}
