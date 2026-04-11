"use client";

import Link from "next/link";
import { motion } from "framer-motion";

type Metric = {
  label: string;
  value: string;
};

type DecisionGroup = {
  title: string;
  subtitle: string;
  value: string;
  count: string;
  action: string;
  tone: "yellow" | "green" | "blue";
  href: string;
};

type DashboardDecisionViewProps = {
  metrics: Metric[];
  decisionGroups: DecisionGroup[];
  riskAmountLabel: string;
  riskHelp: string;
  actionSummary: string;
  actionHref: string;
  labels: {
    headerTitle: string;
    headerSubtitle: string;
    decisionsNow: string;
    decisionsSubtitle: string;
    estimatedImpact: string;
    riskTitle: string;
    riskHelp: string;
    suggestedAction: string;
    viewPriorities: string;
  };
};

export function DashboardDecisionView({
  metrics,
  decisionGroups,
  riskAmountLabel,
  actionSummary,
  actionHref,
  labels,
}: DashboardDecisionViewProps) {
  return (
    <main className="min-h-screen bg-[#07110E] text-white -m-6">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-10">
          <p className="text-xs uppercase tracking-[0.3em] text-green-400">NÓVUA · DASHBOARD</p>
          <h1 className="mt-3 text-4xl font-semibold">{labels.headerTitle}</h1>
          <p className="mt-3 text-gray-400 max-w-xl">{labels.headerSubtitle}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-10 md:grid-cols-4">
          {metrics.map((metric) => (
            <div key={metric.label} className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-sm text-gray-400">{metric.label}</div>
              <div className="mt-2 text-2xl font-semibold">{metric.value}</div>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-2xl border border-white/10 bg-[#0D1A16] p-6">
            <h2 className="mb-2 text-xl font-semibold">{labels.decisionsNow}</h2>
            <p className="mb-5 max-w-2xl text-sm leading-6 text-gray-400">{labels.decisionsSubtitle}</p>

            <div className="space-y-4">
              {decisionGroups.map((group) => {
                const toneClass =
                  group.tone === "yellow"
                    ? "text-yellow-400 border-yellow-500/15 bg-yellow-500/5"
                    : group.tone === "green"
                      ? "text-green-400 border-green-500/15 bg-green-500/5"
                      : "text-blue-400 border-blue-500/15 bg-blue-500/5";

                return (
                  <motion.div
                    key={group.title}
                    whileHover={{ y: -2 }}
                    className="rounded-xl border border-white/5 bg-[#11231E] p-5"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-lg font-semibold text-white">{group.title}</h3>
                          <span className={`rounded-full border px-3 py-1 text-xs ${toneClass}`}>
                            {group.count}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-gray-400">{group.subtitle}</p>
                      </div>

                      <div className="text-left md:text-right">
                        <div className="text-2xl font-semibold text-white">{group.value}</div>
                        <div className="mt-2 text-sm text-gray-400">{labels.estimatedImpact}</div>
                      </div>
                    </div>

                    <Link
                      href={group.href}
                      className="mt-4 inline-flex rounded-xl border border-white/5 bg-black/15 px-4 py-3 text-sm text-gray-200 transition hover:border-white/10 hover:bg-black/25"
                    >
                      → {group.action}
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-[#0D1A16] p-6">
              <h3 className="text-sm text-gray-400">{labels.riskTitle}</h3>
              <div className="text-4xl font-semibold text-yellow-400 mt-2">{riskAmountLabel}</div>

              <div className="mt-4 h-2 bg-white/10 rounded-full">
                <div className="h-full w-[70%] bg-gradient-to-r from-green-400 to-yellow-400 rounded-full" />
              </div>

              <p className="mt-3 text-sm text-gray-400">{labels.riskHelp}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#0D1A16] p-6">
              <h3 className="text-sm text-gray-400">{labels.suggestedAction}</h3>
              <div className="text-xl font-semibold mt-2">{actionSummary}</div>

              <Link
                href={actionHref}
                className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-green-500 py-3 font-semibold text-black transition hover:bg-green-400"
              >
                {labels.viewPriorities}
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
