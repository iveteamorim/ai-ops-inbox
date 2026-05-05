import { NextResponse } from "next/server";
import { buildDemoWorkspaceConfig, getDemoServiceCatalog, isPublicDemoUser } from "@/lib/demo-access";
import { resetAndSeedDemoConversations } from "@/lib/demo-seed";
import { enforceSameOrigin } from "@/lib/security/request-origin";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type CompanyRow = {
  id: string;
  config: Record<string, unknown> | null;
};

export async function POST(request: Request) {
  const originError = enforceSameOrigin(request);
  if (originError) return originError;

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

  if (!isPublicDemoUser(user.email)) {
    return NextResponse.json({ ok: true, skipped: "not_demo_user" });
  }

  const admin = createAdminClient();
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .maybeSingle<{ company_id: string }>();

  if (profileError) {
    return NextResponse.json({ ok: false, error: profileError.message }, { status: 500 });
  }

  if (!profile?.company_id) {
    return NextResponse.json({ ok: false, error: "demo_profile_missing" }, { status: 404 });
  }

  const { data: company, error: companyError } = await admin
    .from("companies")
    .select("id, config")
    .eq("id", profile.company_id)
    .maybeSingle<CompanyRow>();

  if (companyError) {
    return NextResponse.json({ ok: false, error: companyError.message }, { status: 500 });
  }

  if (!company) {
    return NextResponse.json({ ok: false, error: "demo_company_missing" }, { status: 404 });
  }

  const config = buildDemoWorkspaceConfig(company.config);
  const { error: updateError } = await admin.from("companies").update({ config }).eq("id", company.id);

  if (updateError) {
    return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });
  }

  try {
    const result = await resetAndSeedDemoConversations({
      companyId: company.id,
      serviceCatalog: getDemoServiceCatalog(config),
      admin,
      assignedToUserId: user.id,
    });

    return NextResponse.json({
      ok: true,
      seeded: result.seeded,
      focusConversationId: result.focusConversationId,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "demo_reset_failed" },
      { status: 500 },
    );
  }
}
