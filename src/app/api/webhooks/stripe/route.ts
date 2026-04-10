import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

function getStripeClient() {
  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!apiKey) {
    throw new Error("Missing STRIPE_SECRET_KEY");
  }

  return new Stripe(apiKey);
}

type CompanyRow = {
  id: string;
  config?: Record<string, unknown> | null;
};

async function getCompanyById(companyId: string) {
  const admin = createAdminClient();
  const { data: company, error } = await admin
    .from("companies")
    .select("id, config")
    .eq("id", companyId)
    .maybeSingle<CompanyRow>();

  if (error || !company) {
    return null;
  }

  return company;
}

async function getCompanyByStripeCustomerId(customerId: string) {
  const admin = createAdminClient();
  const { data: companies, error } = await admin
    .from("companies")
    .select("id, config")
    .filter("config->>stripeCustomerId", "eq", customerId)
    .limit(1);

  if (error || !companies?.length) {
    return null;
  }

  return companies[0] as CompanyRow;
}

async function updateCompanyBillingState(
  companyId: string,
  updates: {
    plan?: string;
    stripeCheckoutSessionId?: string | null;
    stripeCustomerId?: string | null;
    stripeSubscriptionId?: string | null;
    stripePaymentStatus?: string | null;
    stripeSubscriptionStatus?: string | null;
  },
) {
  const admin = createAdminClient();
  const company = await getCompanyById(companyId);
  if (!company) {
    return { error: "company_not_found" };
  }

  const nextConfig = {
    ...(company.config ?? {}),
    ...updates,
  };

  const payload: { plan?: string; config: Record<string, unknown> } = {
    config: nextConfig,
  };

  if (updates.plan) {
    payload.plan = updates.plan;
  }

  const { error } = await admin.from("companies").update(payload).eq("id", companyId);
  return { error: error?.message ?? null };
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ ok: false, error: "stripe_not_configured" }, { status: 400 });
  }

  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = getStripeClient().webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "invalid_signature" },
      { status: 400 },
    );
  }

  const paidPlan = process.env.NOVUA_PAID_PLAN || "growth";

  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const session = event.data.object as Stripe.Checkout.Session;
    const companyId = typeof session.client_reference_id === "string" ? session.client_reference_id : "";

    if (!companyId) {
      return NextResponse.json({ ok: true, skipped: "missing_client_reference_id" });
    }

    const { error } = await updateCompanyBillingState(companyId, {
      plan: paidPlan,
      stripeCheckoutSessionId: session.id,
      stripeCustomerId: typeof session.customer === "string" ? session.customer : null,
      stripeSubscriptionId: typeof session.subscription === "string" ? session.subscription : null,
      stripePaymentStatus: session.payment_status,
      stripeSubscriptionStatus: session.payment_status === "paid" ? "active" : null,
    });

    if (error) {
      return NextResponse.json({ ok: false, error }, { status: 500 });
    }
  }

  if (event.type === "invoice.paid" || event.type === "invoice.payment_failed") {
    const invoice = event.data.object as Stripe.Invoice;
    const customerId = typeof invoice.customer === "string" ? invoice.customer : "";
    if (!customerId) {
      return NextResponse.json({ ok: true, skipped: "missing_customer_id" });
    }

    const company = await getCompanyByStripeCustomerId(customerId);
    if (!company) {
      return NextResponse.json({ ok: true, skipped: "company_not_found" });
    }

    const paymentFailed = event.type === "invoice.payment_failed";
    const { error } = await updateCompanyBillingState(company.id, {
      plan: paymentFailed ? "trial" : paidPlan,
      stripeCustomerId: customerId,
      stripeSubscriptionId: typeof invoice.subscription === "string" ? invoice.subscription : null,
      stripePaymentStatus: paymentFailed ? "failed" : "paid",
      stripeSubscriptionStatus: paymentFailed ? "past_due" : "active",
    });

    if (error) {
      return NextResponse.json({ ok: false, error }, { status: 500 });
    }
  }

  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;
    const customerId = typeof subscription.customer === "string" ? subscription.customer : "";
    if (!customerId) {
      return NextResponse.json({ ok: true, skipped: "missing_customer_id" });
    }

    const company = await getCompanyByStripeCustomerId(customerId);
    if (!company) {
      return NextResponse.json({ ok: true, skipped: "company_not_found" });
    }

    const activeStatuses = new Set(["active", "trialing"]);
    const shouldKeepPaidPlan = activeStatuses.has(subscription.status);

    const { error } = await updateCompanyBillingState(company.id, {
      plan: shouldKeepPaidPlan ? paidPlan : "trial",
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      stripeSubscriptionStatus: subscription.status,
      stripePaymentStatus: shouldKeepPaidPlan ? "paid" : "failed",
    });

    if (error) {
      return NextResponse.json({ ok: false, error }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
