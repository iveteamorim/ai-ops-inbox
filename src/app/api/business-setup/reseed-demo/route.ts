import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { resetAndSeedDemoConversations } from "@/lib/demo-seed";
import type { ServiceType } from "@/lib/triage/triage-conversation";

type ProfileRow = {
  id: string;
  company_id: string;
};

type CompanyRow = {
  id: string;
  config: Record<string, unknown> | null;
};

export async function POST() {
  let supabase: Awaited<ReturnType<typeof createClient>>;
  try {
    supabase = await createClient();
  } catch {
    return NextResponse.json({ ok: false, error: "supabase_not_configured" }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, company_id")
    .eq("id", user.id)
    .maybeSingle<ProfileRow>();

  if (profileError) {
    return NextResponse.json({ ok: false, error: profileError.message }, { status: 500 });
  }

  if (!profile) {
    return NextResponse.json({ ok: false, error: "profile_not_found" }, { status: 404 });
  }

  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select("id, config")
    .eq("id", profile.company_id)
    .maybeSingle<CompanyRow>();

  if (companyError) {
    return NextResponse.json({ ok: false, error: companyError.message }, { status: 500 });
  }

  if (!company) {
    return NextResponse.json({ ok: false, error: "company_not_found" }, { status: 404 });
  }

  const config = company.config && typeof company.config === "object" ? company.config : {};
  const businessSetup =
    "business_setup" in config && config.business_setup && typeof config.business_setup === "object"
      ? (config.business_setup as Record<string, unknown>)
      : {};
  const leadTypes = Array.isArray(businessSetup.lead_types)
    ? businessSetup.lead_types
    : [];

  const serviceCatalog: ServiceType[] = leadTypes
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const name = typeof row.name === "string" ? row.name.trim() : "";
      const estimatedValue =
        typeof row.estimated_value === "number"
          ? row.estimated_value
          : typeof row.estimated_value === "string"
            ? Number(row.estimated_value)
            : 0;
      if (!name) return null;
      return {
        name,
        estimatedValue: Number.isFinite(estimatedValue) ? Math.max(0, estimatedValue) : 0,
      };
    })
    .filter((value): value is ServiceType => Boolean(value));

  if (serviceCatalog.length === 0) {
    return NextResponse.json({ ok: false, error: "missing_lead_types" }, { status: 400 });
  }

  try {
    const admin = createAdminClient();
    const result = await resetAndSeedDemoConversations({
      companyId: company.id,
      serviceCatalog,
      admin,
    });

    return NextResponse.json({ ok: true, seeded: result.seeded, focusConversationId: result.focusConversationId });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "demo_reseed_failed" },
      { status: 500 },
    );
  }
}
