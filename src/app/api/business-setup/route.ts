import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { ServiceType } from "@/lib/triage/triage-conversation";
import { seedDemoConversations } from "@/lib/demo-seed";
import { enforceSameOrigin } from "@/lib/security/request-origin";
import { canManageWorkspace, getWorkspaceMember } from "@/lib/workspace-access";

type LeadTypeInput = {
  id?: string;
  name?: string;
  estimatedValue?: number;
};

type Payload = {
  businessName?: string;
  leadTypes?: LeadTypeInput[];
};

type CompanyRow = {
  id: string;
  config: Record<string, unknown> | null;
};

export async function POST(request: Request) {
  const originError = enforceSameOrigin(request);
  if (originError) return originError;

  const body = (await request.json().catch(() => ({}))) as Payload;

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

  const admin = createAdminClient();
  let profile;
  try {
    profile = await getWorkspaceMember(user);
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "workspace_bootstrap_failed" },
      { status: 500 },
    );
  }

  if (!canManageWorkspace(profile.role)) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const businessName = typeof body.businessName === "string" ? body.businessName.trim().slice(0, 120) : "";
  const leadTypes = Array.isArray(body.leadTypes)
    ? body.leadTypes
        .map((row) => {
          const name = typeof row?.name === "string" ? row.name.trim().slice(0, 120) : "";
          const estimatedValue =
            typeof row?.estimatedValue === "number"
              ? row.estimatedValue
              : typeof row?.estimatedValue === "string"
                ? Number(row.estimatedValue)
                : 0;
          if (!name) return null;
          return {
            id:
              typeof row?.id === "string" && row.id.trim()
                ? row.id.trim()
                : `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Math.random().toString(36).slice(2, 8)}`,
            name,
            estimated_value: Number.isFinite(estimatedValue) ? Math.max(0, estimatedValue) : 0,
          };
        })
        .filter((value): value is { id: string; name: string; estimated_value: number } => Boolean(value))
        .slice(0, 12)
    : [];

  const { data: company, error: companyError } = await admin
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

  const currentConfig = company.config && typeof company.config === "object" ? company.config : {};
  const currentBusinessSetup =
    "business_setup" in currentConfig && currentConfig.business_setup && typeof currentConfig.business_setup === "object"
      ? (currentConfig.business_setup as Record<string, unknown>)
      : {};
  const nextConfig = {
    ...currentConfig,
    business_setup: {
      ...currentBusinessSetup,
      business_name: businessName,
      lead_types: leadTypes,
    },
  };

  const { error: updateError } = await admin
    .from("companies")
    .update({
      name: businessName || undefined,
      config: nextConfig,
    })
    .eq("id", company.id);

  if (updateError) {
    return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });
  }
  const serviceCatalog: ServiceType[] = leadTypes.map((item) => ({
    name: item.name,
    estimatedValue: item.estimated_value,
  }));
  let seeded = 0;
  let focusConversationId: string | null = null;

  if (serviceCatalog.length > 0) {
    const { count, error: conversationsCountError } = await admin
      .from("conversations")
      .select("id", { count: "exact", head: true })
      .eq("company_id", company.id);

    if (conversationsCountError) {
      return NextResponse.json({ ok: false, error: conversationsCountError.message }, { status: 500 });
    }

    if ((count ?? 0) === 0) {
      try {
        const seedResult = await seedDemoConversations({
          companyId: company.id,
          serviceCatalog,
          admin,
          assignedToUserId: user.id,
        });
        seeded = seedResult.seeded;
        focusConversationId = seedResult.focusConversationId;
      } catch (seedError) {
        return NextResponse.json(
          {
            ok: false,
            error: seedError instanceof Error ? seedError.message : "demo_seed_failed",
          },
          { status: 500 },
        );
      }
    }
  }

  return NextResponse.json({ ok: true, seeded, focusConversationId });
}
