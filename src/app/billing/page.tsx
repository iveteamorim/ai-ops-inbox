import { cookies, headers } from "next/headers";
import Link from "next/link";
import { AppNav } from "@/components/AppNav";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatTrialEnd } from "@/lib/trial";
import { resolveLang, LANG_COOKIE } from "@/lib/i18n/config";
import { translate } from "@/lib/i18n/dictionaries";
import { canManageInternalWorkspace, getWorkspaceMode } from "@/lib/internal-access";

type BillingPlan = {
  key: "starter" | "growth" | "pro";
  name: string;
  price: string;
  description: string;
  features: string[];
  cta: string;
  href: string;
  highlighted?: boolean;
};

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

function getPlanLinks() {
  return {
    starter: process.env.STRIPE_STARTER_PAYMENT_LINK_URL || "",
    growth: process.env.STRIPE_GROWTH_PAYMENT_LINK_URL || process.env.STRIPE_PAYMENT_LINK_URL || "",
    pro: process.env.STRIPE_PRO_PAYMENT_LINK_URL || "",
  };
}

export default async function BillingPage() {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const lang = resolveLang(cookieStore.get(LANG_COOKIE)?.value, headerStore.get("accept-language"));
  const t = (key: Parameters<typeof translate>[1]) => translate(lang, key);

  const supabase = await createClient();
  const admin = createAdminClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await admin.from("profiles").select("company_id, full_name, role").eq("id", user.id).maybeSingle<{ company_id: string; full_name: string | null; role: string | null }>()
    : { data: null };
  const { data: company } =
    profile?.company_id
      ? await admin.from("companies").select("config").eq("id", profile.company_id).maybeSingle<{ config?: Record<string, unknown> | null }>()
      : { data: null };

  const trialEndsAt = (user?.user_metadata?.trial_ends_at as string | undefined) ?? null;
  const workspaceMode = getWorkspaceMode(company ?? null, user?.email);
  const canSeeInternalSetup = canManageInternalWorkspace(workspaceMode);
  const planLinks = getPlanLinks();
  const plans: BillingPlan[] = [
    {
      key: "starter",
      name: t("pricing_starter"),
      price: "49€",
      description: t("pricing_starter_recovery"),
      features: [t("pricing_inbox"), t("pricing_whatsapp"), t("pricing_users_3"), t("pricing_ai_basic")],
      cta: t("pricing_cta_starter"),
      href: withPaymentContext(planLinks.starter || "/#pricing", profile?.company_id ?? null, user?.email ?? null),
    },
    {
      key: "growth",
      name: t("pricing_growth"),
      price: "99€",
      description: t("pricing_growth_recovery"),
      features: [t("pricing_no_miss"), t("pricing_whatsapp"), t("pricing_users_6"), t("pricing_ai_full")],
      cta: t("pricing_cta_growth"),
      href: withPaymentContext(planLinks.growth || "/#pricing", profile?.company_id ?? null, user?.email ?? null),
      highlighted: true,
    },
    {
      key: "pro",
      name: t("pricing_pro"),
      price: "199€",
      description: t("pricing_pro_recovery"),
      features: [t("pricing_revenue"), t("pricing_multichannel"), t("pricing_users_15"), t("pricing_support_priority")],
      cta: t("pricing_cta_pro"),
      href: withPaymentContext(planLinks.pro || "/#pricing", profile?.company_id ?? null, user?.email ?? null),
    },
  ];

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

      <article className="card billing-intro-card">
        <p>{t("billing_body")}</p>
        <p className="subtitle billing-next-step">
          {t("pricing_subtitle")}
        </p>
        <div className="billing-plan-grid">
          {plans.map((plan) => {
            const isExternalPaymentLink = plan.href.startsWith("http://") || plan.href.startsWith("https://");
            return (
              <section
                className={`billing-plan-card ${plan.highlighted ? "billing-plan-highlight" : ""}`.trim()}
                key={plan.key}
              >
                <div className="pricing-plan-head">
                  <h2>{plan.name}</h2>
                  {plan.highlighted ? <span className="badge status-active">{t("pricing_growth_badge")}</span> : null}
                </div>
                <p className="billing-plan-price">
                  {plan.price}
                  <span className="pricing-month">{t("pricing_month")}</span>
                </p>
                <p className="subtitle">{plan.description}</p>
                <ul className="billing-feature-list">
                  {plan.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
                {isExternalPaymentLink ? (
                  <a className="button" href={plan.href} target="_blank" rel="noreferrer">
                    {plan.cta}
                  </a>
                ) : (
                  <Link className="button" href={plan.href}>
                    {plan.cta}
                  </Link>
                )}
              </section>
            );
          })}
        </div>
        <div className="actions billing-secondary-actions">
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
