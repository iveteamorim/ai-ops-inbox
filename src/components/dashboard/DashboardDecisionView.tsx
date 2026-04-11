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
}: DashboardDecisionViewProps) {
  return (
    <main className="min-h-screen bg-[#061412] text-white -m-6">
      <div className="mx-auto max-w-7xl px-6 py-8 md:px-10">
        <div className="mb-8">
          <p className="text-xs text-green-400 tracking-widest mb-2">NÓVUA · DASHBOARD</p>
          <h1 className="text-2xl md:text-3xl font-semibold">{headerTitle}</h1>
          <p className="text-gray-400 mt-2 text-sm md:text-base">{headerSubtitle}</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-5 rounded-xl bg-red-500/10 border border-red-500/30"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-xs text-red-400 mb-1">{riskTitle}</p>
              <h2 className="text-xl font-semibold">{riskSummary}</h2>
              <p className="text-gray-400 text-sm mt-1">{riskDetail}</p>
            </div>

            <Link className="bg-green-500 hover:bg-green-400 text-black px-4 py-2 rounded-lg text-sm" href="/inbox?scope=no_response">
              {riskButtonLabel}
            </Link>
          </div>
        </motion.div>

        <div className="flex flex-wrap gap-4 text-xs text-gray-400 mb-8">
          {metrics.map((metric) => (
            <span key={metric.label} className="text-green-400">
              {metric.value} {metric.label}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 p-5 rounded-xl bg-[#0b1f1b] border border-white/10">
            <h3 className="text-base mb-4">Qué hacer ahora</h3>

            <div className="space-y-3">
              {decisionGroups.map((group) => {
                const toneClass =
                  group.tone === "yellow"
                    ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-400"
                    : group.tone === "green"
                      ? "bg-green-500/10 border-green-500/30 text-green-400"
                      : "bg-blue-500/10 border-blue-500/30 text-blue-400";

                return (
                  <div
                    key={group.title}
                    className={`p-4 rounded-lg border flex justify-between items-center ${toneClass}`}
                  >
                    <div>
                      <p className="text-sm">{group.title}</p>
                      <p className="text-xs text-gray-300">{group.count}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-white">{group.value}</p>
                      <Link className="text-xs text-green-400" href={group.href}>
                        abrir →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-5 rounded-xl bg-[#0b1f1b] border border-white/10">
            <h3 className="text-base mb-4">{statusTitle}</h3>

            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-1">Riesgo total</p>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full w-1/2 bg-yellow-400"></div>
              </div>
            </div>

            <div className="space-y-2 text-xs text-gray-400">
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
