import { cookies, headers } from "next/headers";
import Link from "next/link";
import { AppNav } from "@/components/AppNav";
import { createClient } from "@/lib/supabase/server";
import { formatTrialEnd } from "@/lib/trial";
import { resolveLang, LANG_COOKIE } from "@/lib/i18n/config";
import { translate } from "@/lib/i18n/dictionaries";
import { canManageInternalWorkspace, getWorkspaceMode } from "@/lib/internal-access";

function withPaymentContext(paymentLink: string, companyId?: string | null, email?: string | null) {
  if (!paymentLink.startsWith("http://") && !paymentLink.startsWith("https://")) {
    return paymentLink;
  }

  try {
    const url = new URL(paymentLink);
    if (companyId) {
      url.searchParams.set("client_reference_id", companyId);
    }
    if (email) {
      url.searchParams.set("prefilled_email", email);
    }
    return url.toString();
  } catch {
    return paymentLink;
  }
}

export default async function BillingPage() {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const lang = resolveLang(cookieStore.get(LANG_COOKIE)?.value, headerStore.get("accept-language"));
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

  const trialEndsAt = (user?.user_metadata?.trial_ends_at as string | undefined) ?? null;
  const workspaceMode = getWorkspaceMode(company ?? null, user?.email);
  const canSeeInternalSetup = canManageInternalWorkspace(workspaceMode);
  const paymentLink = withPaymentContext(
    process.env.STRIPE_PAYMENT_LINK_URL || "/#pricing",
    profile?.company_id ?? null,
    user?.email ?? null,
  );
  const isExternalPaymentLink = paymentLink.startsWith("http://") || paymentLink.startsWith("https://");

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
          {isExternalPaymentLink ? (
            <a className="button" href={paymentLink} target="_blank" rel="noreferrer">
              {t("billing_activate_plan")}
            </a>
          ) : (
            <Link className="button" href={paymentLink}>
              {t("billing_activate_plan")}
            </Link>
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
