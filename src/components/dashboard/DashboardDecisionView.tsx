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
  headerTitle: string;
  headerSubtitle: string;
  riskTitle: string;
  riskSummary: string;
  riskDetail: string;
  riskButtonLabel: string;
  metrics: Metric[];
  decisionGroups: DecisionGroup[];
  statusTitle: string;
  statusLines: string[];
  whatNowLabel: string;
  openLabel: string;
  totalRiskLabel: string;
};

export function DashboardDecisionView({
  headerTitle,
  headerSubtitle,
  riskTitle,
  riskSummary,
  riskDetail,
  riskButtonLabel,
  metrics,
  decisionGroups,
  statusTitle,
  statusLines,
  whatNowLabel,
  openLabel,
  totalRiskLabel,
}: DashboardDecisionViewProps) {
  return (
    <main className="dashboard-decision-view min-h-screen bg-[#0a1628] text-white -m-6">
      <div className="mx-auto max-w-7xl px-6 py-8 md:px-10">
        <div className="mb-8">
          <p className="mb-2 text-xs tracking-[0.28em] text-white/45">NOVUA · DASHBOARD</p>
          <h1 className="text-2xl font-semibold md:text-3xl">{headerTitle}</h1>
          <p className="mt-2 text-sm text-white/60 md:text-base">{headerSubtitle}</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-xl border border-red-400/25 bg-red-500/10 p-5"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="mb-1 text-xs text-red-300">{riskTitle}</p>
              <h2 className="text-xl font-semibold">{riskSummary}</h2>
              <p className="mt-1 text-sm text-white/55">{riskDetail}</p>
            </div>

            <Link
              className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#0a1628] transition hover:bg-white/90"
              href="/inbox?scope=no_response"
            >
              {riskButtonLabel}
            </Link>
          </div>
        </motion.div>

        <div className="mb-8 flex flex-wrap gap-4 text-xs text-white/55">
          {metrics.map((metric) => (
            <span key={metric.label}>
              <span className="font-semibold text-white">{metric.value}</span> {metric.label}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-[#111f35] p-5 lg:col-span-2">
            <h3 className="mb-4 text-base">{whatNowLabel}</h3>

            <div className="space-y-3">
              {decisionGroups.map((group) => {
                const toneClass =
                  group.tone === "yellow"
                    ? "border-amber-400/25 bg-amber-500/10 text-amber-300"
                    : group.tone === "green"
                      ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-300"
                      : "border-sky-400/25 bg-sky-500/10 text-sky-300";

                return (
                  <div
                    key={group.title}
                    className={`flex items-center justify-between rounded-lg border p-4 ${toneClass}`}
                  >
                    <div>
                      <p className="text-sm">{group.title}</p>
                      <p className="text-xs text-white/55">{group.count}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-white">{group.value}</p>
                      <Link className="text-xs text-white/75 hover:text-white" href={group.href}>
                        {openLabel} →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#111f35] p-5">
            <h3 className="mb-4 text-base">{statusTitle}</h3>

            <div className="mb-4">
              <p className="mb-1 text-xs text-white/45">{totalRiskLabel}</p>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-1/2 bg-gradient-to-r from-white/70 to-amber-300/80"></div>
              </div>
            </div>

            <div className="space-y-2 text-xs text-white/55">
              {statusLines.map((line) => (
                <p key={line}>• {line}</p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
