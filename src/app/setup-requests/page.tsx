import { AppNav } from "@/components/AppNav";
import { PilotFeedbackTable } from "@/components/PilotFeedbackTable";
import { SetupRequestsTable } from "@/components/SetupRequestsTable";
import Link from "next/link";
import { getAppContext, getPilotFeedbackAdminView, getSetupRequestsAdminView } from "@/lib/app-data";
import { isNovuaInternalUser } from "@/lib/internal-access";
import { notFound } from "next/navigation";
import { cookies, headers } from "next/headers";
import { LANG_COOKIE, resolveLang } from "@/lib/i18n/config";

export default async function SetupRequestsPage() {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const lang = resolveLang(cookieStore.get(LANG_COOKIE)?.value, headerStore.get("accept-language"));
  const copy =
    lang === "pt"
      ? {
          title: "Solicitações de setup",
          subtitle: "Revise e atualize pedidos de onboarding do WhatsApp.",
          authRequired: "A autenticação é obrigatória.",
          triage: "Pré-visualizar triagem",
        }
      : lang === "en"
        ? {
            title: "Setup requests",
            subtitle: "Review and update WhatsApp onboarding requests.",
            authRequired: "Authentication is required.",
            triage: "Triage preview",
          }
        : {
            title: "Solicitudes de setup",
            subtitle: "Revisa y actualiza solicitudes de onboarding de WhatsApp.",
            authRequired: "La autenticación es obligatoria.",
            triage: "Vista previa de triage",
          };

  const context = await getAppContext();

  if (context.kind !== "ready") {
    return (
      <section className="page">
        <AppNav />
        <header className="header">
          <div>
            <h1 className="title">{copy.title}</h1>
            <p className="subtitle">{copy.authRequired}</p>
          </div>
        </header>
      </section>
    );
  }

  if (!isNovuaInternalUser(context.user.email)) {
    notFound();
  }

  const [requests, feedback] = await Promise.all([
    getSetupRequestsAdminView(),
    getPilotFeedbackAdminView(),
  ]);

  return (
    <section className="page">
      <AppNav
        showLocale
        userName={context.profile.full_name ?? context.user.email ?? null}
        userRole={context.profile.role}
      />
      <header className="header">
        <div>
          <h1 className="title">{copy.title}</h1>
          <p className="subtitle">{copy.subtitle}</p>
        </div>
        <div className="actions">
          <Link className="button" href="/setup-requests/triage-preview">
            {copy.triage}
          </Link>
        </div>
      </header>
      <SetupRequestsTable requests={requests} />
      <PilotFeedbackTable items={feedback} />
    </section>
  );
}
