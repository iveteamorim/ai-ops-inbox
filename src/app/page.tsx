"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LandingCtaLink } from "@/components/LandingCtaLink";
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
      statusClass: "border-[#10b981]/35 bg-[#10b981]/12 text-[#6ee7b7]",
      value: t("landing_mockup_value_1"),
      time: t("landing_conversation_1_time"),
    },
    {
      id: "ana",
      name: "Ana",
      message: t("landing_mockup_msg_2"),
      status: t("landing_mockup_status_risk"),
      statusClass: "border-amber-500/35 bg-amber-500/12 text-amber-300",
      value: t("landing_mockup_value_2"),
      time: t("landing_conversation_2_time"),
    },
    {
      id: "david",
      name: "David",
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
      metricClass: "text-[#6ee7b7]",
      progress: "78%",
      action: t("landing_panel_1_action"),
      helper: t("landing_panel_1_helper"),
    },
    {
      title: t("landing_panel_2_title"),
      metric: t("landing_mockup_status_risk"),
      metricClass: "text-amber-300",
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
    <main className="landing-page min-h-screen bg-[#06080f] text-white -m-4 overflow-hidden md:-m-6">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-10%] top-[-4%] h-[34rem] w-[34rem] rounded-full bg-[#7a6cf0]/14 blur-3xl" />
        <div className="absolute right-[-8%] top-16 h-[30rem] w-[30rem] rounded-full bg-[#9b7cf2]/10 blur-3xl" />
        <div className="absolute left-[34%] top-[42%] h-[20rem] w-[20rem] rounded-full bg-[#cf87d8]/6 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pt-1 pb-8 sm:px-6 sm:pt-3 lg:px-8 lg:pt-4">
        <div className="mb-2 flex items-center justify-end gap-2 sm:mb-3">
          <LocaleMenu />
          
          <Link
            href="/login"
            className="rounded-full border border-[#9b7cf2]/25 bg-[#7a6cf0]/10 px-3.5 py-1.5 text-xs font-semibold text-[#ede9fe] transition duration-300 hover:border-[#9b7cf2]/40 hover:bg-[#7a6cf0]/18 sm:px-4 sm:text-sm"
          >
            {t("cta_signin")}
          </Link>
        </div>
        <section className="grid max-h-[calc(100svh-4.5rem)] items-center gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:gap-10">
          <div className="max-w-xl lg:max-w-2xl lg:py-2">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#9b7cf2]/35 bg-[#7a6cf0]/12 px-3.5 py-1.5 text-xs font-medium text-[#ddd6fe] sm:mb-5 sm:px-4 sm:py-2 sm:text-sm">
              <span className="h-2 w-2 rounded-full bg-[#9b7cf2]" />
              {t("landing_brand_kicker")}
            </p>

            <h1 className="max-w-[12ch] text-[2.35rem] font-semibold leading-[1.08] tracking-[-0.03em] text-zinc-100 sm:text-[2.85rem] sm:leading-[1.06] lg:text-[3.35rem] lg:leading-[1.02]">
              {t("landing_title")}
            </h1>

            <p className="mt-5 max-w-[36ch] text-base leading-7 text-zinc-300 sm:mt-6 sm:max-w-[38ch] sm:text-lg sm:leading-8">
              {t("landing_subtitle")}
            </p>


            <div className="mt-7 sm:mt-9">
              <LandingCtaLink className="w-full sm:w-auto" />
            </div>

          </div>

          <div className="relative lg:origin-top lg:scale-[0.9] xl:scale-[0.94]">
            <div className="absolute inset-0 rounded-[28px] bg-[#9b7cf2]/10 blur-3xl" />

            <div className="relative overflow-hidden rounded-[18px] border border-[#9b7cf2]/12 bg-[linear-gradient(180deg,rgba(16,14,28,0.98),rgba(10,12,20,0.97))] p-2 shadow-[0_0_60px_rgba(122,108,240,0.12)] sm:rounded-[20px] sm:p-3 lg:p-3.5">
              <div className="mb-2 flex items-center justify-end">
                <div className="rounded-full border border-[#9b7cf2]/20 bg-[#7a6cf0]/10 px-2 py-0.5 text-[10px] text-[#c4b5fd]">
                  {t("nav_inbox")}
                </div>
              </div>

              <div className="grid gap-2.5 xl:grid-cols-[1.1fr_0.9fr] xl:gap-3">
                <div className="space-y-1.5 sm:space-y-2">
                  {conversations.map((conversation, index) => {
                    const isActive = index === activeIndex;
                    return (
                      <motion.div
                        key={conversation.id}
                        layout
                        transition={{ duration: 0.35 }}
                        className={[
                          "rounded-lg border p-2 transition-all duration-500 sm:rounded-xl sm:p-2.5",
                          isActive
                            ? "border-[#9b7cf2]/45 bg-[#17132a] shadow-[0_0_35px_rgba(122,108,240,0.16)]"
                            : "border-white/5 bg-[#10131f] opacity-75",
                        ].join(" ")}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <p className="text-sm font-semibold text-white">{conversation.name}</p>
                              <span className="text-[10px] text-zinc-500">{conversation.time}</span>
                            </div>
                            <p className="mt-1 text-[11px] leading-4 text-zinc-300 sm:text-xs sm:leading-5">{conversation.message}</p>
                          </div>

                          <span className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold ${conversation.statusClass}`}>
                            {conversation.status}
                          </span>
                        </div>

                        {isActive ? (
                          <div className="mt-1.5 flex items-center justify-between gap-2 border-t border-white/10 pt-1.5 text-[10px] text-zinc-400">
                            <span>{t("landing_mockup_value_label")}</span>
                            <span className="font-semibold text-white">{conversation.value}</span>
                          </div>
                        ) : null}
                      </motion.div>
                    );
                  })}
                </div>

                <div className="flex flex-col justify-between rounded-lg border border-white/5 bg-[#0C1210] p-2.5 sm:rounded-xl sm:p-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-400">{panel.title}</p>

                    <AnimatePresence mode="wait">
                      <motion.p
                        key={panel.metric}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.3 }}
                        className={`mt-1.5 text-xl font-bold sm:text-2xl ${panel.metricClass}`}
                      >
                        {panel.metric}
                      </motion.p>
                    </AnimatePresence>

                    <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/10">
                      <motion.div
                        key={panel.progress}
                        initial={{ width: 0 }}
                        animate={{ width: panel.progress }}
                        transition={{ duration: 0.55 }}
                        className="h-full rounded-full bg-gradient-to-r from-[#7a6cf0] via-[#9b7cf2] to-amber-400"
                      />
                    </div>
                  </div>

                  <div className="mt-2.5">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-400">{t("landing_panel_action_label")}</p>
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={panel.action}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.3 }}
                      >
                        <p className="mt-1 text-sm font-semibold text-white sm:text-base">{panel.action}</p>
                        <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-zinc-300 sm:text-xs sm:leading-5">{panel.helper}</p>
                        <p className="mt-1.5 text-[11px] font-medium text-[#c4b5fd]">{t("landing_value_at_risk")}</p>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <motion.section
          className="py-12 text-center sm:py-20"
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.6 }}
        >
          <p className="mx-auto mb-4 max-w-3xl text-sm uppercase tracking-[0.3em] text-[#c4b5fd]/85">
            {t("landing_mockup_footer")}
          </p>
          <p className="mx-auto max-w-4xl text-2xl font-semibold leading-tight text-white sm:text-4xl lg:text-5xl">
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
              className="rounded-[22px] border border-[#9b7cf2]/10 bg-[linear-gradient(180deg,rgba(16,14,28,0.98),rgba(10,12,20,0.96))] p-5 sm:rounded-[28px] sm:p-6"
              variants={fadeUp}
            >
              <p className="mb-4 text-sm uppercase tracking-[0.18em] text-[#c4b5fd]/90">{card.label}</p>
              <h3 className="text-xl font-bold leading-tight text-white sm:text-2xl">{card.title}</h3>

              {card.rows ? (
                <div className="mt-6 space-y-4 text-base text-zinc-200">
                  {card.rows.map(([label, icon]) => (
                    <div key={label} className="flex items-center justify-between gap-4 border-b border-white/10 pb-3 last:border-b-0 last:pb-0">
                      <span>{label}</span>
                      <span>{icon}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-base leading-7 text-zinc-300">{card.text}</p>
              )}
            </motion.div>
          ))}
        </motion.section>

        <motion.section
          className="py-12 text-center sm:py-20"
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.6 }}
        >
          <h2 className="mx-auto max-w-4xl text-2xl font-semibold leading-tight text-white sm:text-4xl lg:text-5xl">
            {t("landing_final_title")}
          </h2>
          <motion.div className="mt-8 flex justify-center px-1 sm:px-0">
            <LandingCtaLink className="w-full max-w-md sm:w-auto sm:max-w-none" />
          </motion.div>
        </motion.section>
      </div>
      <footer className="border-t border-white/5 mt-16 sm:mt-24">
  <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
    <div>
      © 2026 Novua Digital
    </div>

    <div className="flex flex-wrap items-center gap-4 sm:gap-6">
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
