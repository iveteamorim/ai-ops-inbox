"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";

type InboxConversation = {
  id: string;
  name: string;
  message: string;
  state: string;
  stateClass: string;
  value: string;
  risk: string;
  riskClass: string;
  delay: string;
  action: string;
  owner: string;
  isAssigned: boolean;
  progress: number;
};

type InboxDecisionViewProps = {
  conversations: InboxConversation[];
  riskAmountLabel: string;
  activeAmountLabel: string;
  highValueAmountLabel: string;
  newCountLabel: string;
  labels: {
    risk: string;
    active: string;
    highValue: string;
    newEntry: string;
    filterAll: string;
    filterRisk: string;
    filterAssigned: string;
    filterNew: string;
    emptyState: string;
    temporalState: string;
    owner: string;
    nextAction: string;
    decisionLayer: string;
    value: string;
    riskLabel: string;
    whatNow: string;
    assignOwner: string;
    productPrinciple: string;
    decisionCopy: string;
  };
};

export function InboxDecisionView({
  conversations,
  riskAmountLabel,
  activeAmountLabel,
  highValueAmountLabel,
  newCountLabel,
  labels,
}: InboxDecisionViewProps) {
  const initialId = conversations[0]?.id ?? "";
  const [selectedId, setSelectedId] = useState(initialId);
  const [activeFilter, setActiveFilter] = useState<"all" | "risk" | "assigned" | "new">("all");
  const selected = useMemo(
    () => conversations.find((item) => item.id === selectedId) ?? conversations[0],
    [conversations, selectedId],
  );
  const filteredConversations = useMemo(() => {
    if (activeFilter === "all") return conversations;
    if (activeFilter === "risk") return conversations.filter((item) => item.state === labels.filterRisk);
    if (activeFilter === "assigned") return conversations.filter((item) => item.isAssigned);
    return conversations.filter((item) => item.state === labels.filterNew);
  }, [activeFilter, conversations, labels.filterNew, labels.filterRisk]);

  if (!selected) {
    return (
      <main className="min-h-screen bg-[#07110E] text-white -m-6">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="text-gray-300">{labels.emptyState}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#07110E] text-white -m-6">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 opacity-80">
            <div className="text-xs text-gray-400">{labels.risk}</div>
            <div className="mt-1 text-2xl font-semibold text-yellow-400">{riskAmountLabel}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 opacity-80">
            <div className="text-xs text-gray-400">{labels.active}</div>
            <div className="mt-1 text-2xl font-semibold text-blue-400">{activeAmountLabel}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 opacity-80">
            <div className="text-xs text-gray-400">{labels.highValue}</div>
            <div className="mt-1 text-2xl font-semibold text-green-400">{highValueAmountLabel}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 opacity-80">
            <div className="text-xs text-gray-400">{labels.newEntry}</div>
            <div className="mt-1 text-2xl font-semibold text-white">{newCountLabel}</div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch">
          <section className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(13,26,22,0.98),rgba(10,18,16,0.97))] p-4 sm:p-5 overflow-y-auto lg:h-[640px]">
            <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-gray-400">
              <button
                type="button"
                onClick={() => setActiveFilter("all")}
                className={`rounded-full border px-3 py-1 transition ${
                  activeFilter === "all" ? "border-white/30 bg-white/10 text-white" : "border-white/10 bg-white/5"
                }`}
              >
                {labels.filterAll}
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter("risk")}
                className={`rounded-full border px-3 py-1 transition ${
                  activeFilter === "risk"
                    ? "border-yellow-500/40 bg-yellow-500/15 text-yellow-200"
                    : "border-yellow-500/20 bg-yellow-500/5 text-yellow-300"
                }`}
              >
                {labels.filterRisk}
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter("assigned")}
                className={`rounded-full border px-3 py-1 transition ${
                  activeFilter === "assigned" ? "border-white/30 bg-white/10 text-white" : "border-white/10 bg-white/5"
                }`}
              >
                {labels.filterAssigned}
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter("new")}
                className={`rounded-full border px-3 py-1 transition ${
                  activeFilter === "new" ? "border-white/30 bg-white/10 text-white" : "border-white/10 bg-white/5"
                }`}
              >
                {labels.filterNew}
              </button>
            </div>

            <div className="space-y-4">
              {filteredConversations.map((conversation) => {
                const isSelected = conversation.id === selectedId;
                return (
                  <motion.div
                    key={conversation.id}
                    whileHover={{ y: -2 }}
                    onClick={() => setSelectedId(conversation.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelectedId(conversation.id);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    className={[
                      "w-full rounded-2xl border p-4 text-left transition-all duration-300",
                      isSelected
                        ? "border-green-400/40 bg-[#132922] shadow-[0_0_35px_rgba(52,211,153,0.12)]"
                        : "border-white/5 bg-[#10211C] hover:border-white/10",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-xl font-semibold text-white">{conversation.name}</p>
                          <span className={`rounded-full border px-3 py-1 text-xs ${conversation.stateClass}`}>
                            {conversation.state}
                          </span>
                        </div>
                        <p className="mt-2 line-clamp-2 text-base leading-7 text-gray-300">{conversation.message}</p>
                      </div>

                      <div className="text-right">
                        <div className="text-2xl font-semibold text-white">{conversation.value}</div>
                        <div className={`mt-1 text-sm font-medium ${conversation.riskClass}`}>{conversation.risk}</div>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 border-t border-white/10 pt-3 text-sm sm:grid-cols-3">
                      <div>
                        <div className="text-gray-500">{labels.temporalState}</div>
                        <div className="mt-1 text-gray-200">{conversation.delay}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">{labels.owner}</div>
                        <div className="mt-1 text-gray-200">{conversation.owner}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">{labels.nextAction}</div>
                        <Link
                          href={`/conversation/${conversation.id}`}
                          onClick={(event) => event.stopPropagation()}
                          className="mt-1 inline-flex font-medium text-emerald-300 underline-offset-4 hover:text-emerald-200 hover:underline"
                        >
                          {conversation.action}
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </section>

          <aside className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(13,26,22,0.98),rgba(10,18,16,0.97))] p-5 sm:p-6 lg:h-[640px] lg:overflow-y-auto">
            <p className="text-xs uppercase tracking-[0.18em] text-gray-400">{labels.decisionLayer}</p>

            <div className="mt-5 rounded-2xl border border-white/5 bg-[#101B18] p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-2xl font-semibold text-white">{selected.name}</p>
                  <p className="mt-2 text-sm text-gray-400">{selected.delay}</p>
                </div>
                <span className={`rounded-full border px-3 py-1 text-sm ${selected.stateClass}`}>{selected.state}</span>
              </div>

              <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-green-400 via-lime-300 to-yellow-400"
                  style={{ width: `${selected.progress}%` }}
                />
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-gray-400">{labels.value}</div>
                  <div className="mt-2 text-3xl font-semibold text-white">{selected.value}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-gray-400">{labels.riskLabel}</div>
                  <div className={`mt-2 text-3xl font-semibold ${selected.riskClass}`}>{selected.risk}</div>
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-white/5 bg-[#101B18] p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-gray-400">{labels.whatNow}</p>
              <p className="mt-3 text-2xl font-semibold text-white">{selected.action}</p>
              <p className="mt-3 text-base leading-7 text-gray-400">{labels.decisionCopy}</p>

              <div className="mt-6 flex flex-col gap-3">
                <Link
                  href={`/conversation/${selected.id}`}
                  className="rounded-2xl bg-green-500 px-5 py-3 text-base font-semibold text-black transition hover:bg-green-400"
                >
                  {selected.action}
                </Link>
                <Link
                  href={`/conversation/${selected.id}?assign=1`}
                  className="rounded-2xl border border-white/10 px-5 py-3 text-base font-medium text-gray-200 transition hover:bg-white/5"
                >
                  {labels.assignOwner}
                </Link>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-white/5 bg-[#101B18] p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-gray-400">{labels.productPrinciple}</p>
              <p className="mt-3 text-lg font-semibold text-white">{labels.decisionCopy}</p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
