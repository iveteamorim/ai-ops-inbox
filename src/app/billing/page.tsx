import { cookies } from "next/headers";
import { AppNav } from "@/components/AppNav";
import { ActivatePlanButton } from "@/components/ActivatePlanButton";
import { createClient } from "@/lib/supabase/server";
import { formatTrialEnd } from "@/lib/trial";
import { normalizeLang, LANG_COOKIE } from "@/lib/i18n/config";
import { translate } from "@/lib/i18n/dictionaries";
import { canManageInternalWorkspace, getWorkspaceMode } from "@/lib/internal-access";

export default async function BillingPage() {
  const cookieStore = await cookies();
  const lang = normalizeLang(cookieStore.get(LANG_COOKIE)?.value);
  const t = (key: Parameters<typeof translate>[1]) => translate(lang, key);

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
        <div className="actions">
          <ActivatePlanButton
            idleLabel={t("billing_activate_plan")}
            requestedLabel={t("billing_activation_requested")}
            inProgressLabel={t("billing_activation_in_progress")}
            requestedNote={t("billing_activation_requested_note")}
            inProgressNote={t("billing_activation_in_progress_note")}
            requestErrorLabel={t("billing_activation_error")}
            existingStatus={billingRequest?.status ?? null}
          />
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
