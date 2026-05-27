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
    hidden: { opacity: 0, y: 18 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" as const },
    },
  };

  const stagger = {
    hidden: {},
    show: {
      transition: { staggerChildren: 0.08 },
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
        <div className="absolute left-[-8%] top-0 h-[32rem] w-[32rem] rounded-full bg-green-500/10 blur-3xl" />
        <div className="absolute right-[-4%] top-24 h-[28rem] w-[28rem] rounded-full bg-emerald-400/8 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pt-6 pb-14 sm:px-6 sm:pt-10 lg:px-8 lg:pt-14">
        <div className="mb-8 flex items-center justify-end gap-3 sm:mb-10">
          <LocaleMenu />
          
          <Link
            href="/login"
            className="rounded-full border border-white/12 bg-white/[0.02] px-5 py-2 text-sm font-semibold text-white transition duration-300 hover:border-white/25 hover:bg-white/[0.06]"
          >
            {t("cta_signin")}
          </Link>
        </div>
        <section className="grid items-start gap-10 lg:grid-cols-[0.95fr_1.2fr] lg:gap-14">
          <div className="max-w-xl">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/8 px-4 py-2 text-base font-medium text-emerald-300">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              {t("landing_brand_kicker")}
            </p>

            <h1 className="max-w-[12ch] text-4xl font-semibold leading-[1.02] text-zinc-100 sm:text-5xl lg:text-[4.5rem]">
              {t("landing_title")}
            </h1>

            <p className="mt-6 max-w-[34ch] text-base leading-8 text-zinc-400 sm:text-lg">
              {t("landing_subtitle")}
            </p>


            <div className="mt-8 flex">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-2xl bg-[#16d39a] px-8 py-3.5 text-lg font-semibold text-[#041d16] shadow-[0_14px_34px_rgba(24,211,154,0.28)] transition duration-300 hover:bg-[#23dfaa]"
              >
                {t("landing_cta_free")}
              </Link>
            </div>

          </div>

          <div className="relative">
            <div className="absolute inset-0 rounded-[28px] bg-green-500/10 blur-3xl" />

            <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(13,26,22,0.98),rgba(10,18,16,0.97))] p-4 shadow-[0_0_60px_rgba(16,185,129,0.08)] sm:rounded-[28px] sm:p-6 lg:p-8">
              <div className="mb-6 flex items-center justify-end gap-3">
                <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-400">
                  {t("nav_inbox")}
                </div>
              </div>

              <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
                <div className="space-y-4">
                  {conversations.map((conversation, index) => {
                    const isActive = index === activeIndex;
                    return (
                      <motion.div
                        key={conversation.id}
                        layout
                        transition={{ duration: 0.35 }}
                        className={[
                          "rounded-2xl border p-4 transition-all duration-500 sm:p-5",
                          isActive
                            ? "scale-[1.01] border-green-400/40 bg-[#132922] shadow-[0_0_35px_rgba(52,211,153,0.12)]"
                            : "border-white/5 bg-[#10211C] opacity-75",
                        ].join(" ")}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-xl font-semibold text-white sm:text-2xl">{conversation.name}</p>
                              <span className="text-xs text-zinc-500">{conversation.time}</span>
                            </div>
                            <p className="mt-2 text-base text-zinc-300 sm:text-lg">{conversation.message}</p>
                          </div>

                          <span className={`rounded-full border px-3 py-1 text-sm ${conversation.statusClass}`}>
                            {conversation.status}
                          </span>
                        </div>

                        <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-3 text-sm text-zinc-400">
                          <span>{t("landing_mockup_value_label")}</span>
                          <span className="font-semibold text-white">{conversation.value}</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                <div className="flex min-h-[300px] flex-col justify-between rounded-2xl border border-white/5 bg-[#0C1210] p-4 sm:min-h-[360px] sm:p-5">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-zinc-400">{panel.title}</p>

                    <AnimatePresence mode="wait">
                      <motion.p
                        key={panel.metric}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.3 }}
                        className={`mt-4 text-4xl font-bold sm:text-5xl ${panel.metricClass}`}
                      >
                        {panel.metric}
                      </motion.p>
                    </AnimatePresence>

                    <div className="mt-5 h-2 w-full overflow-hidden rounded-full bg-white/10">
                      <motion.div
                        key={panel.progress}
                        initial={{ width: 0 }}
                        animate={{ width: panel.progress }}
                        transition={{ duration: 0.55 }}
                        className="h-full rounded-full bg-gradient-to-r from-green-400 via-lime-300 to-yellow-400"
                      />
                    </div>
                  </div>

                  <div className="mt-8">
                    <p className="text-xs uppercase tracking-[0.18em] text-zinc-400">{t("landing_panel_action_label")}</p>
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={panel.action}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.3 }}
                      >
                        <p className="mt-3 text-xl font-semibold text-white sm:text-2xl">{panel.action}</p>
                        <p className="mt-3 text-base leading-7 text-zinc-400">{panel.helper}</p>
                        <p className="mt-5 text-sm font-medium text-emerald-300">{t("landing_value_at_risk")}</p>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <motion.section
          className="py-16 text-center sm:py-20"
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.6 }}
        >
          <p className="mx-auto mb-4 max-w-3xl text-sm uppercase tracking-[0.3em] text-green-300/80">
            {t("landing_mockup_footer")}
          </p>
          <p className="mx-auto max-w-4xl text-3xl font-semibold leading-tight text-white sm:text-4xl lg:text-5xl">
            {t("landing_positioning_line_1")} {t("landing_positioning_line_2")}
          </p>
        </motion.section>

        <motion.section
          className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3"
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.08, margin: "0px 0px -8% 0px" }}
        >
          {problemCards.map((card) => (
            <motion.div
              key={card.label}
              className="rounded-[28px] border border-white/5 bg-[linear-gradient(180deg,rgba(12,27,22,0.98),rgba(10,20,18,0.96))] p-6"
              variants={fadeUp}
            >
              <p className="mb-4 text-sm uppercase tracking-[0.18em] text-green-300/90">{card.label}</p>
              <h3 className="text-2xl font-bold leading-tight text-white">{card.title}</h3>

              {card.rows ? (
                <div className="mt-6 space-y-4 text-base text-zinc-200">
                  {card.rows.map(([label, icon]) => (
                    <div key={label} className="flex items-center justify-between gap-4 border-b border-white/10 pb-3 last:border-b-0 last:pb-0">
                      <span>{label}</span>
                      <span>{icon}</span>
                    </div>
                  ))}
                </div>
              ) : card.number ? (
                <>
                  <p className="mt-6 text-6xl font-bold text-yellow-400">{card.number}</p>
                  <p className="mt-2 text-base leading-7 text-zinc-300">{card.text}</p>
                </>
              ) : (
                <p className="mt-4 text-base leading-7 text-zinc-300">{card.text}</p>
              )}
            </motion.div>
          ))}
        </motion.section>

        <motion.section
          className="py-16 text-center sm:py-20"
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.6 }}
        >
          <h2 className="mx-auto max-w-4xl text-3xl font-semibold leading-tight text-white sm:text-4xl lg:text-5xl">
            {t("landing_final_title")}
          </h2>
          <motion.div className="mt-8 inline-block">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-2xl bg-[#16d39a] px-8 py-3.5 text-lg font-semibold text-[#041d16] shadow-[0_14px_34px_rgba(24,211,154,0.28)] transition duration-300 hover:bg-[#23dfaa]"
            >
              {t("landing_cta_free")}
            </Link>
          </motion.div>
        </motion.section>
      </div>
      <footer className="border-t border-white/5 mt-24">
  <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-8 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
    <div>
      © 2026 Novua Digital
    </div>

    <div className="flex items-center gap-6">
      <Link href="/privacy" className="hover:text-white transition">
        Privacy
      </Link>

      <Link href="/terms" className="hover:text-white transition">
        Terms
      </Link>

      <a
        href="mailto:contact@novua.digital"
        className="hover:text-white transition"
      >
        Contact
      </a>
    </div>
  </div>
</footer>
    </main>
  );
}
