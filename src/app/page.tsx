"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useI18n } from "@/components/i18n/LanguageProvider";
import { LocaleMenu } from "@/components/i18n/LocaleMenu";

export default function NovuaLanding() {
  const { t } = useI18n();
  const [activeIndex, setActiveIndex] = useState(1);

  const conversations = [
    {
      id: "maria",
      name: "Maria",
      message: t("landing_mockup_msg_1"),
      status: t("landing_mockup_status_high"),
      statusClass: "border-green-500/30 bg-green-500/10 text-green-400",
      value: t("landing_mockup_value_1"),
      time: t("landing_conversation_1_time"),
    },
    {
      id: "ana",
      name: "Ana",
      message: t("landing_mockup_msg_2"),
      status: t("landing_mockup_status_risk"),
      statusClass: "border-yellow-500/30 bg-yellow-500/10 text-yellow-400",
      value: t("landing_mockup_value_2"),
      time: t("landing_conversation_2_time"),
    },
    {
      id: "joao",
      name: "Joao",
      message: t("landing_mockup_msg_3"),
      status: t("landing_mockup_status_active"),
      statusClass: "border-blue-500/30 bg-blue-500/10 text-blue-400",
      value: t("landing_mockup_value_3"),
      time: t("landing_conversation_3_time"),
    },
  ];

  const rightPanelStates = [
    {
      title: t("landing_panel_1_title"),
      metric: t("landing_mockup_status_high"),
      metricClass: "text-green-400",
      progress: "78%",
      action: t("landing_panel_1_action"),
      helper: t("landing_panel_1_helper"),
    },
    {
      title: t("landing_panel_2_title"),
      metric: t("landing_mockup_status_risk"),
      metricClass: "text-yellow-400",
      progress: "62%",
      action: t("landing_panel_2_action"),
      helper: t("landing_panel_2_helper"),
    },
    {
      title: t("landing_panel_3_title"),
      metric: t("landing_mockup_status_active"),
      metricClass: "text-blue-400",
      progress: "48%",
      action: t("landing_panel_3_action"),
      helper: t("landing_panel_3_helper"),
    },
  ];

  const problemCards = [
    {
      label: t("landing_problem"),
      title: t("landing_problem_1_title"),
      text: t("landing_problem_1"),
    },
    {
      label: t("landing_result"),
      title: t("landing_result_title"),
      rows: [
        [t("landing_response_time"), "↓"],
        [t("landing_unfollowed"), "↓"],
        [t("landing_converted"), "↑"],
      ],
    },
    {
      label: t("landing_revenue_label"),
      title: t("landing_revenue_title"),
      number: "8",
      text: t("landing_mockup_unanswered_high_value"),
    },
  ];

  const fadeUp = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { duration: 0.5, ease: "easeOut" as const },
    },
  };

  const stagger = {
    hidden: {},
    show: {
      transition: { staggerChildren: 0.05 },
    },
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % conversations.length);
    }, 2400);
    return () => clearInterval(interval);
  }, [conversations.length]);

  const panel = rightPanelStates[activeIndex];

  return (
    <main className="min-h-screen bg-[#07110E] text-white -m-4 md:-m-6">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-10%] top-[-5%] h-[40rem] w-[40rem] rounded-full bg-white/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 pt-8 pb-20 sm:px-6 sm:pt-12 lg:px-8 lg:pt-16">
        <div className="mb-16 flex items-center justify-between">
          <div className="text-lg font-semibold text-white">Novua</div>
          <div className="flex items-center gap-2">
            <LocaleMenu />
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-sm text-zinc-300 hover:text-white transition"
            >
              {t("cta_signin")}
            </Link>
          </div>
        </div>

        <section className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <h1 className="text-5xl font-semibold leading-tight text-white sm:text-6xl lg:text-7xl">
              {t("landing_title")}
            </h1>

            <p className="mt-6 text-lg leading-relaxed text-zinc-400 sm:text-xl max-w-lg">
              {t("landing_subtitle")}
            </p>

            <div className="mt-8 flex items-center gap-3">
              <Link
                href="/signup"
                className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-zinc-100"
              >
                {t("landing_cta_free")}
              </Link>
              <p className="text-sm text-zinc-500">{t("landing_no_card")}</p>
            </div>
          </div>

          <div className="relative">
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm">
              <div className="grid gap-4">
                <div className="space-y-3">
                  {conversations.map((conversation, index) => {
                    const isActive = index === activeIndex;
                    return (
                      <motion.div
                        key={conversation.id}
                        layout
                        transition={{ duration: 0.35 }}
                        className={[
                          "rounded-xl border p-3 transition-all duration-300 sm:p-4",
                          isActive
                            ? "border-white/20 bg-white/[0.08]"
                            : "border-white/5 bg-white/[0.02] opacity-60",
                        ].join(" ")}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <p className="font-medium text-white text-sm">{conversation.name}</p>
                            <p className="mt-1 text-xs text-zinc-400 line-clamp-2">{conversation.message}</p>
                          </div>
                          <span className="text-xs text-zinc-500 flex-shrink-0">{conversation.time}</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                <div className="text-sm text-zinc-400">
                  <p>Smart prioritization by business value, not arrival order.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="my-24 text-center">
          <h2 className="text-4xl font-semibold text-white sm:text-5xl lg:text-6xl max-w-3xl mx-auto">
            {t("landing_final_title")}
          </h2>
        </section>

        <div className="text-center">
          <Link
            href="/signup"
            className="inline-block rounded-lg bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-zinc-100"
          >
            {t("landing_cta_free")}
          </Link>
        </div>
      </div>
      <footer className="border-t border-white/10 mt-32">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 text-xs text-zinc-500 sm:flex-row">
            <div>© 2026 Novua Digital</div>
            <div className="flex items-center gap-6">
              <Link href="/privacy" className="hover:text-zinc-300 transition">Privacy</Link>
              <Link href="/terms" className="hover:text-zinc-300 transition">Terms</Link>
              <a href="mailto:contact@novua.digital" className="hover:text-zinc-300 transition">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
