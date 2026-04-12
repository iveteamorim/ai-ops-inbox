"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const conversations = [
  {
    id: "maria",
    name: "Maria",
    message: "Precio del tratamiento",
    status: "Alto",
    statusClass: "border-green-500/30 bg-green-500/10 text-green-400",
    value: "€180",
    time: "Ahora",
  },
  {
    id: "ana",
    name: "Ana",
    message: "Sin respuesta por 2h",
    status: "Riesgo",
    statusClass: "border-yellow-500/30 bg-yellow-500/10 text-yellow-400",
    value: "€90",
    time: "Hace 2 h",
  },
  {
    id: "joao",
    name: "Joao",
    message: "¿Hay horarios mañana?",
    status: "Activo",
    statusClass: "border-blue-500/30 bg-blue-500/10 text-blue-400",
    value: "€60",
    time: "Hace 4 min",
  },
];

const rightPanelStates = [
  {
    title: "Prioridad visible",
    metric: "Alto",
    metricClass: "text-green-400",
    progress: "78%",
    action: "8 conversaciones prioritarias",
    helper: "El sistema deja visible qué atender primero y por qué.",
  },
  {
    title: "Ingresos en riesgo",
    metric: "Riesgo",
    metricClass: "text-yellow-400",
    progress: "62%",
    action: "3 conversaciones sin respuesta",
    helper: "Detecta ingresos en riesgo según valor y retraso.",
  },
  {
    title: "Seguimiento activo",
    metric: "Activo",
    metricClass: "text-blue-400",
    progress: "48%",
    action: "5 conversaciones abiertas",
    helper: "Hace visible qué sigue en cada conversación.",
  },
];

const problemCards = [
  {
    label: "Problema",
    title: "No todas las conversaciones importan igual",
    text: "Leads con valor quedan sin respuesta mientras el equipo atiende por orden de llegada.",
  },
  {
    label: "Resultado",
    title: "Más claridad, mejores decisiones, más oportunidades atendidas",
    rows: [
      ["Tiempo de respuesta", "↓"],
      ["Conversaciones sin seguimiento", "↓"],
      ["Conversaciones convertidas", "↑"],
    ],
  },
  {
    label: "Decisión",
    title: "Convierte tu inbox en un sistema de decisión",
    number: "8",
    text: "Conversaciones prioritarias visibles",
  },
];

export default function NovuaLanding() {
  const [activeIndex, setActiveIndex] = useState(1);

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
      transition: { staggerChildren: 0.12, delayChildren: 0.1 },
    },
  };

  useEffect(() => {
    if (typeof document !== "undefined" && !document.cookie.includes("lang=")) {
      document.cookie = "lang=es; path=/; max-age=31536000; samesite=lax";
      document.documentElement.lang = "es";
    }
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % conversations.length);
    }, 2400);
    return () => clearInterval(interval);
  }, []);

  const panel = rightPanelStates[activeIndex];

  return (
    <main className="min-h-screen bg-[#07110E] text-white -m-6">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-8%] top-0 h-[32rem] w-[32rem] rounded-full bg-green-500/10 blur-3xl" />
        <div className="absolute right-[-4%] top-24 h-[28rem] w-[28rem] rounded-full bg-emerald-400/8 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pt-10 pb-16 sm:px-6 lg:px-8 lg:pt-14">
        <div className="mb-10 flex items-center justify-end">
          <Link
            href="/login"
            className="rounded-full border border-white/15 px-5 py-2 text-sm font-semibold text-white transition duration-300 hover:border-white/30 hover:bg-white/5"
          >
            Entrar
          </Link>
        </div>
        <section className="grid items-start gap-12 lg:grid-cols-[0.95fr_1.2fr] lg:gap-14">
          <div className="max-w-xl">
            <p className="mb-3 text-xs uppercase tracking-[0.24em] text-green-400 sm:text-sm">
              NÓVUA · SISTEMA DE DECISIÓN
            </p>

            <h1 className="text-4xl font-semibold leading-[0.95] text-white sm:text-5xl lg:text-6xl">
              No pierdas ingresos por no responder a tiempo
            </h1>

            <p className="mt-6 text-base leading-8 text-gray-300 sm:text-lg">
              Prioriza por valor, detecta ingresos en riesgo y define la siguiente acción en cada conversación.
            </p>

            <p className="mt-6 text-xl font-semibold leading-8 text-yellow-400">
              Cada mensaje sin respuesta es una oportunidad perdida.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/signup"
                className="rounded-2xl bg-green-500 px-6 py-3 text-base font-semibold text-black shadow-[0_0_30px_rgba(34,197,94,0.22)] transition duration-300 hover:scale-[1.02] hover:bg-green-400"
              >
                Probar gratis
              </Link>
              <span className="text-sm text-gray-400">15 min · lo activamos contigo</span>
            </div>

            <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-green-400">↓ 42%</span>
                <span>tiempo de respuesta</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-green-400">↑ 28%</span>
                <span>conversión</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-green-400">+ visibilidad</span>
                <span>ingresos en riesgo</span>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 rounded-[28px] bg-green-500/10 blur-3xl" />

            <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(13,26,22,0.98),rgba(10,18,16,0.97))] p-5 shadow-[0_0_60px_rgba(16,185,129,0.08)] sm:p-6 lg:p-8">
              <div className="mb-6 flex items-center justify-end gap-3">
                <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-400">
                  Inbox
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
                          "rounded-2xl border p-5 transition-all duration-500",
                          isActive
                            ? "scale-[1.01] border-green-400/40 bg-[#132922] shadow-[0_0_35px_rgba(52,211,153,0.12)]"
                            : "border-white/5 bg-[#10211C] opacity-75",
                        ].join(" ")}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-2xl font-semibold text-white">{conversation.name}</p>
                              <span className="text-xs text-gray-500">{conversation.time}</span>
                            </div>
                            <p className="mt-2 text-lg text-gray-300">{conversation.message}</p>
                          </div>

                          <span className={`rounded-full border px-3 py-1 text-sm ${conversation.statusClass}`}>
                            {conversation.status}
                          </span>
                        </div>

                        <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-3 text-sm text-gray-400">
                          <span>Valor estimado</span>
                          <span className="font-semibold text-white">{conversation.value}</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                <div className="flex min-h-[360px] flex-col justify-between rounded-2xl border border-white/5 bg-[#101B18] p-5">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-gray-400">{panel.title}</p>

                    <AnimatePresence mode="wait">
                      <motion.p
                        key={panel.metric}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.3 }}
                        className={`mt-4 text-5xl font-bold ${panel.metricClass}`}
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
                    <p className="text-xs uppercase tracking-[0.18em] text-gray-400">Acción sugerida</p>
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={panel.action}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.3 }}
                      >
                        <p className="mt-3 text-2xl font-semibold text-white">{panel.action}</p>
                        <p className="mt-3 text-base leading-7 text-gray-400">{panel.helper}</p>
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
            Novua decide qué conversación atender primero y por qué.
          </p>
          <p className="mx-auto max-w-4xl text-3xl font-semibold leading-tight text-white sm:text-4xl lg:text-5xl">
            No es un CRM. Es una capa de decisión sobre tus conversaciones.
          </p>
        </motion.section>

        <motion.section
          className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3"
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
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
                <div className="mt-6 space-y-4 text-base text-gray-200">
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
                  <p className="mt-2 text-base leading-7 text-gray-300">{card.text}</p>
                </>
              ) : (
                <p className="mt-4 text-base leading-7 text-gray-300">{card.text}</p>
              )}
            </motion.div>
          ))}
        </motion.section>

        <motion.section
          className="mt-8 rounded-[28px] border border-white/5 bg-[linear-gradient(180deg,rgba(12,27,22,0.98),rgba(10,20,18,0.96))] p-6 sm:p-8"
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.4 }}
        >
          <p className="mb-3 text-sm uppercase tracking-[0.18em] text-green-300/90">Onboarding</p>
          <h2 className="text-3xl font-bold leading-tight text-white sm:text-4xl">
            Conectamos tu negocio en 15 minutos
          </h2>
          <p className="mt-5 max-w-5xl text-base leading-7 text-gray-300 sm:text-lg">
            Configuramos Novua contigo para que no pierdas oportunidades reales.
          </p>
          <p className="mt-4 max-w-5xl text-base font-semibold leading-7 text-yellow-400 sm:text-lg">
            Tu equipo ya responde. El problema es a qué responde.
          </p>

          <div className="mt-7 rounded-2xl border border-yellow-700/50 bg-[#17140E] p-5">
            <p className="text-xl font-semibold text-yellow-300">Canal real con onboarding guiado</p>
            <p className="mt-3 text-base leading-7 text-gray-300">
              Producto base en autoservicio. Activación del canal real y pruebas finales contigo.
            </p>
          </div>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/signup"
              className="rounded-2xl bg-green-500 px-7 py-3.5 text-base font-semibold text-black shadow-[0_0_30px_rgba(34,197,94,0.25)] transition duration-300 hover:scale-[1.02] hover:bg-green-400"
            >
              Probar gratis
            </Link>
            <p className="text-sm text-gray-400">Te ayudamos a activarlo en tu negocio</p>
          </div>
        </motion.section>

        <motion.section
          className="py-16 text-center sm:py-20"
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.6 }}
        >
          <h2 className="mx-auto max-w-4xl text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
            Prioriza mejor. Responde antes. Deja visible qué conversación importa ahora.
          </h2>
          <motion.div
            className="mt-8 inline-block"
            animate={{
              boxShadow: [
                "0 0 30px rgba(34,197,94,0.18)",
                "0 0 40px rgba(34,197,94,0.32)",
                "0 0 30px rgba(34,197,94,0.18)",
              ],
            }}
            transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
          >
            <Link
              href="/signup"
              className="rounded-2xl bg-green-500 px-8 py-4 text-base font-semibold text-black shadow-[0_0_30px_rgba(34,197,94,0.25)] transition duration-300 hover:scale-[1.02] hover:bg-green-400"
            >
            Probar gratis
            </Link>
          </motion.div>
        </motion.section>
      </div>
    </main>
  );
}
