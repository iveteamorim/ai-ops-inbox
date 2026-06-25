import { notFound } from "next/navigation";
import { AppNav } from "@/components/AppNav";
import { TriagePreviewTable } from "@/components/TriagePreviewTable";
import { getAppContext, getConversationTriagePreview } from "@/lib/app-data";
import { isNovuaInternalUser } from "@/lib/internal-access";
import { cookies, headers } from "next/headers";
import { LANG_COOKIE, resolveLang } from "@/lib/i18n/config";

export default async function TriagePreviewPage() {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const lang = resolveLang(cookieStore.get(LANG_COOKIE)?.value, headerStore.get("accept-language"));
  const copy =
    lang === "pt"
      ? {
          title: "Pré-visualização de triagem",
          subtitle: "Rota interna para validar o output do motor antes de substituir a heurística atual.",
        }
      : lang === "en"
        ? {
            title: "Triage preview",
            subtitle: "Internal route to validate the new engine output before replacing the current heuristic.",
          }
        : {
            title: "Vista previa de triage",
            subtitle: "Ruta interna para validar el output del motor antes de sustituir la heurística actual.",
          };

  const context = await getAppContext();

  if (context.kind !== "ready") {
    notFound();
  }

  if (!isNovuaInternalUser(context.user.email)) {
    notFound();
  }

  const items = await getConversationTriagePreview(context.supabase, context.profile.company_id);

  return (
    <section className="page">
      <AppNav
        showSetup
        showLocale
        userName={context.profile.full_name ?? context.user.email ?? null}
        userRole={context.profile.role}
      />
      <header className="header">
        <div>
          <h1 className="title">{copy.title}</h1>
          <p className="subtitle">{copy.subtitle}</p>
        </div>
      </header>
      <TriagePreviewTable items={items} />
    </section>
  );
}
