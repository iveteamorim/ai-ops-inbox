import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AppNav } from "@/components/AppNav";
import { createClient } from "@/lib/supabase/server";
import { formatTrialEnd } from "@/lib/trial";
import { normalizeLang, LANG_COOKIE } from "@/lib/i18n/config";
import { translate } from "@/lib/i18n/dictionaries";
import { canManageInternalWorkspace, getWorkspaceMode } from "@/lib/internal-access";

export default async function BillingPage({
  searchParams,
}: {
  searchParams?: Promise<{ activation?: string }>;
}) {
  const cookieStore = await cookies();
  const lang = normalizeLang(cookieStore.get(LANG_COOKIE)?.value);
  const t = (key: Parameters<typeof translate>[1]) => translate(lang, key);
  const params = (await searchParams) ?? {};

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from("profiles").select("company_id, full_name, role").eq("id", user.id).maybeSingle<{ company_id: string; full_name: string | null; role: string | null }>()
    : { data: null };
  const { data: company } =
    profile?.company_id
      ? await supabase.from("companies").select("config").eq("id", profile.company_id).maybeSingle<{ config?: Record<string, unknown> | null }>()
      : { data: null };
  const { data: billingRequest } =
    profile?.company_id
      ? await supabase
          .from("setup_requests")
          .select("status")
          .eq("company_id", profile.company_id)
          .eq("channel", "form")
          .in("status", ["requested", "in_progress"])
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle<{ status: "requested" | "in_progress" }>()
      : { data: null };

  const trialEndsAt = (user?.user_metadata?.trial_ends_at as string | undefined) ?? null;
  const workspaceMode = getWorkspaceMode(company ?? null, user?.email);
  const canSeeInternalSetup = canManageInternalWorkspace(workspaceMode);

  async function requestPlanActivation() {
    "use server";

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .maybeSingle<{ company_id: string }>();

    if (!profile?.company_id) {
      redirect("/billing?activation=error");
    }

    const { data: existing } = await supabase
      .from("setup_requests")
      .select("id, status")
      .eq("company_id", profile.company_id)
      .eq("channel", "form")
      .in("status", ["requested", "in_progress"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<{ id: string; status: string }>();

    if (existing) {
      await supabase.from("setup_requests").update({ notes: "Billing activation request" }).eq("id", existing.id);
      redirect("/billing");
    }

    const { error } = await supabase.from("setup_requests").insert({
      company_id: profile.company_id,
      user_id: user.id,
      channel: "form",
      status: "requested",
      notes: "Billing activation request",
    });

    if (error) {
      redirect("/billing?activation=error");
    }

    redirect("/billing");
  }

  return (
    <section className="page">
      <AppNav
        showSetup={canSeeInternalSetup}
        showLocale={canSeeInternalSetup}
        userName={profile?.full_name ?? user?.email ?? null}
        userRole={profile?.role ?? null}
      />
      <header className="header">
        <div>
          <h1 className="title">{t("billing_title")}</h1>
          <p className="subtitle">
            {t("billing_subtitle_prefix")} {formatTrialEnd(trialEndsAt)}.
          </p>
        </div>
      </header>

      <article className="card" style={{ maxWidth: 700 }}>
        <p>{t("billing_body")}</p>
        {params.activation === "error" ? <p className="note">{t("billing_activation_error")}</p> : null}
        <div className="actions">
          {billingRequest?.status === "in_progress" ? (
            <div className="request-state">
              <span className="badge status-new">{t("billing_activation_in_progress")}</span>
              <p className="note">{t("billing_activation_in_progress_note")}</p>
            </div>
          ) : billingRequest?.status === "requested" ? (
            <div className="request-state">
              <span className="badge status-active">{t("billing_activation_requested")}</span>
              <p className="note">{t("billing_activation_requested_note")}</p>
            </div>
          ) : (
            <form action={requestPlanActivation}>
              <button className="button" type="submit">
                {t("billing_activate_plan")}
              </button>
            </form>
          )}
          <form action="/auth/signout" method="post">
            <button className="mini-button" type="submit">
              {t("billing_signout")}
            </button>
          </form>
        </div>
      </article>
    </section>
  );
}
