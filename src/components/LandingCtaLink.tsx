"use client";

import Link from "next/link";
import { useI18n } from "@/components/i18n/LanguageProvider";

type Props = {
  className?: string;
};

export function LandingCtaLink({ className = "" }: Props) {
  const { t } = useI18n();

  return (
    <Link href="/signup" className={["landing-cta", className].filter(Boolean).join(" ")}>
      {t("landing_cta_free")}
    </Link>
  );
}
