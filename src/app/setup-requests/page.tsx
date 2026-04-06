import { AppNav } from "@/components/AppNav";
import { PilotFeedbackTable } from "@/components/PilotFeedbackTable";
import { SetupRequestsTable } from "@/components/SetupRequestsTable";
import Link from "next/link";
import { getAppContext, getPilotFeedbackAdminView, getSetupRequestsAdminView } from "@/lib/app-data";
import { isNovuaInternalUser } from "@/lib/internal-access";
import { notFound } from "next/navigation";

export default async function SetupRequestsPage() {
  const context = await getAppContext();

  if (context.kind !== "ready") {
    return (
      <section className="page">
        <AppNav />
        <header className="header">
          <div>
            <h1 className="title">Setup requests</h1>
            <p className="subtitle">Authentication is required.</p>
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
      <AppNav showLocale />
      <header className="header">
        <div>
          <h1 className="title">Setup requests</h1>
          <p className="subtitle">Review and update WhatsApp onboarding requests.</p>
        </div>
        <div className="actions">
          <Link className="button" href="/setup-requests/triage-preview">
            Triage preview
          </Link>
        </div>
      </header>
      <SetupRequestsTable requests={requests} />
      <PilotFeedbackTable items={feedback} />
    </section>
  );
}
