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

  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const session = event.data.object as Stripe.Checkout.Session;
    const companyId = typeof session.client_reference_id === "string" ? session.client_reference_id : "";
    const plan = process.env.NOVUA_PAID_PLAN || "growth";

    if (!companyId) {
      return NextResponse.json({ ok: true, skipped: "missing_client_reference_id" });
    }

    const admin = createAdminClient();
    const { data: company } = await admin
      .from("companies")
      .select("config")
      .eq("id", companyId)
      .maybeSingle<{ config?: Record<string, unknown> | null }>();

    const { error } = await admin
      .from("companies")
      .update({
        plan,
        config: {
          ...(company?.config ?? {}),
          stripeCheckoutSessionId: session.id,
          stripeCustomerId: typeof session.customer === "string" ? session.customer : null,
          stripePaymentStatus: session.payment_status,
        },
      })
      .eq("id", companyId);

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
