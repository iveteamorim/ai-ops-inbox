import { AppNav } from "@/components/AppNav";
import { SetupRequestsTable } from "@/components/SetupRequestsTable";
import { getAppContext, getSetupRequestsAdminView } from "@/lib/app-data";

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

  if (!["owner", "admin"].includes(context.profile.role)) {
    return (
      <section className="page">
        <AppNav />
        <header className="header">
          <div>
            <h1 className="title">Setup requests</h1>
            <p className="subtitle">Only owners and admins can view setup requests.</p>
          </div>
        </header>
      </section>
    );
  }

  const requests = await getSetupRequestsAdminView();

  return (
    <section className="page">
      <AppNav />
      <header className="header">
        <div>
          <h1 className="title">Setup requests</h1>
          <p className="subtitle">Review and update WhatsApp onboarding requests.</p>
        </div>
      </header>
      <SetupRequestsTable requests={requests} />
    </section>
  );
}
