import Link from "next/link";
import { NovuaLeadForm } from "@/components/marketing/NovuaLeadForm";

const copy = {
  kicker: "Diagnóstico inicial",
  title: "Diagnóstico operativo inicial",
  description:
    "Evaluamos tu operación y definimos dónde hay pérdida de tiempo, fricción y oportunidad.",
  bullets: [
    "Mapeo del flujo actual",
    "Identificación de cuellos de botella",
    "Recomendación de arquitectura",
  ],
  privacy: "Usamos tus datos solo para responder.",
  whatsapp: "Hablar por WhatsApp",
  whatsappUrl: process.env.NEXT_PUBLIC_NOVUA_WHATSAPP_URL ?? "https://novua.digital/#contato",
  form: {
    name: "Nombre",
    email: "Email",
    phone: "Teléfono",
    message: "Cuéntanos tu situación",
    submit: "Solicitar diagnóstico",
    sending: "Enviando...",
    success: "Solicitud enviada. Te contactaremos pronto.",
    error: "No se pudo enviar. Inténtalo de nuevo en unos minutos.",
    configError: "Formulario no configurado todavía.",
  },
};

export default async function DiagnosticoPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token.trim() : undefined;

  return (
    <main className="diagnostico-page min-h-screen bg-[#07101f] text-white">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <Link href="https://novua.digital" className="diagnostico-back">
          ← Volver a Novua
        </Link>

        <p className="diagnostico-kicker">{copy.kicker}</p>
        <h1 className="diagnostico-title">{copy.title}</h1>
        <p className="diagnostico-description">{copy.description}</p>

        <ul className="diagnostico-bullets">
          {copy.bullets.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        <div className="diagnostico-card">
          <NovuaLeadForm token={token} labels={copy.form} />
          <p className="diagnostico-privacy">{copy.privacy}</p>
        </div>

        <div className="diagnostico-actions">
          <a href={copy.whatsappUrl} target="_blank" rel="noreferrer" className="diagnostico-whatsapp">
            {copy.whatsapp}
          </a>
        </div>
      </div>
    </main>
  );
}
