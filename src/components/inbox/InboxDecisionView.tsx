"use client";

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
  progress: number;
};

type InboxDecisionViewProps = {
  conversations: InboxConversation[];
  riskAmountLabel: string;
  highValueAmountLabel: string;
};

export function InboxDecisionView({ conversations, riskAmountLabel, highValueAmountLabel }: InboxDecisionViewProps) {
  const initialId = conversations[0]?.id ?? "";
  const [selectedId, setSelectedId] = useState(initialId);
  const selected = useMemo(
    () => conversations.find((item) => item.id === selectedId) ?? conversations[0],
    [conversations, selectedId],
  );

  if (!selected) {
    return (
      <main className="min-h-screen bg-[#07110E] text-white -m-6">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="text-gray-300">No hay conversaciones todavía.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#07110E] text-white -m-6">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 opacity-80">
            <div className="text-xs text-gray-400">En riesgo</div>
            <div className="mt-1 text-2xl font-semibold text-yellow-400">{riskAmountLabel}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 opacity-80">
            <div className="text-xs text-gray-400">Alto valor</div>
            <div className="mt-1 text-2xl font-semibold text-green-400">{highValueAmountLabel}</div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] items-start">
          <section className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(13,26,22,0.98),rgba(10,18,16,0.97))] p-5 sm:p-6 max-h-[70vh] overflow-y-auto">
            <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-gray-400">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Todas</span>
              <span className="rounded-full border border-yellow-500/20 bg-yellow-500/5 px-3 py-1 text-yellow-300">En riesgo</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Asignadas</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Nuevas</span>
            </div>

            <div className="space-y-4">
              {conversations.map((conversation) => {
                const isSelected = conversation.id === selectedId;
                return (
                  <motion.button
                    key={conversation.id}
                    whileHover={{ y: -2 }}
                    onClick={() => setSelectedId(conversation.id)}
                    className={[
                      "w-full rounded-2xl border p-5 text-left transition-all duration-300",
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
                        <p className="mt-3 line-clamp-2 text-base leading-7 text-gray-300">{conversation.message}</p>
                      </div>

                      <div className="text-right">
                        <div className="text-2xl font-semibold text-white">{conversation.value}</div>
                        <div className={`mt-1 text-sm font-medium ${conversation.riskClass}`}>{conversation.risk}</div>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 border-t border-white/10 pt-4 text-sm sm:grid-cols-3">
                      <div>
                        <div className="text-gray-500">Estado temporal</div>
                        <div className="mt-1 text-gray-200">{conversation.delay}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Responsable</div>
                        <div className="mt-1 text-gray-200">{conversation.owner}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Siguiente acción</div>
                        <div className="mt-1 font-medium text-white">{conversation.action}</div>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </section>

          <aside className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(13,26,22,0.98),rgba(10,18,16,0.97))] p-5 sm:p-6 sticky top-6 h-fit">
            <p className="text-xs uppercase tracking-[0.18em] text-gray-400">Capa de decisión</p>

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
                  <div className="text-xs uppercase tracking-[0.18em] text-gray-400">Valor</div>
                  <div className="mt-2 text-3xl font-semibold text-white">{selected.value}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-gray-400">Riesgo</div>
                  <div className={`mt-2 text-3xl font-semibold ${selected.riskClass}`}>{selected.risk}</div>
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-white/5 bg-[#101B18] p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-gray-400">Qué hacer ahora</p>
              <p className="mt-3 text-2xl font-semibold text-white">{selected.action}</p>
              <p className="mt-3 text-base leading-7 text-gray-400">
                El revenue aparece donde genera decisión: dentro de la conversación, no separado de ella.
              </p>

              <div className="mt-6 flex flex-col gap-3">
                <button className="rounded-2xl bg-green-500 px-5 py-3 text-base font-semibold text-black transition hover:bg-green-400">
                  {selected.action}
                </button>
                <button className="rounded-2xl border border-white/10 px-5 py-3 text-base font-medium text-gray-200 transition hover:bg-white/5">
                  Asignar responsable
                </button>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-white/5 bg-[#101B18] p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-gray-400">Principio de producto</p>
              <p className="mt-3 text-lg font-semibold text-white">
                No mostramos revenue en abstracto. Hacemos visible dónde actuar para no perderlo.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
