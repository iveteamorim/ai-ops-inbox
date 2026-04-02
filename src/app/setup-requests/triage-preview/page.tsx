import { notFound } from "next/navigation";
import { AppNav } from "@/components/AppNav";
import { TriagePreviewTable } from "@/components/TriagePreviewTable";
import { getAppContext, getConversationTriagePreview } from "@/lib/app-data";
import { isNovuaInternalUser } from "@/lib/internal-access";

export default async function TriagePreviewPage() {
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
      <AppNav showSetup />
      <header className="header">
        <div>
          <h1 className="title">Triage preview</h1>
          <p className="subtitle">Ruta interna para validar outputs reales del motor antes de sustituir la heurística actual.</p>
        </div>
      </header>
      <TriagePreviewTable items={items} />
    </section>
  );
}
