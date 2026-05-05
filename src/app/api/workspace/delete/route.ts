import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit } from "@/lib/rate-limit";
import { enforceSameOrigin } from "@/lib/security/request-origin";
import { getWorkspaceMember } from "@/lib/workspace-access";

type CompanyRow = {
  id: string;
  name: string;
};

type DeletePayload = {
  confirmation?: string;
};

export async function POST(request: Request) {
  const originError = enforceSameOrigin(request);
  if (originError) return originError;

  const body = (await request.json().catch(() => ({}))) as DeletePayload;
  const confirmation = typeof body.confirmation === "string" ? body.confirmation.trim() : "";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  const rateLimit = checkRateLimit({
    key: `workspace-delete:${user.id}`,
    windowMs: 10 * 60_000,
    limit: 3,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { ok: false, error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
    );
  }

  let profile;
  try {
    profile = await getWorkspaceMember(user);
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "workspace_bootstrap_failed" },
      { status: 500 },
    );
  }

  if (profile.role !== "owner") {
    return NextResponse.json({ ok: false, error: "owner_only_action" }, { status: 403 });
  }
  const { data: company } = await admin
    .from("companies")
    .select("id, name")
    .eq("id", profile.company_id)
    .maybeSingle<CompanyRow>();

  if (!company) {
    return NextResponse.json({ ok: false, error: "company_not_found" }, { status: 404 });
  }

  if (!confirmation || confirmation !== company.name) {
    return NextResponse.json({ ok: false, error: "invalid_confirmation" }, { status: 400 });
  }

  const { data: members, error: membersError } = await admin
    .from("profiles")
    .select("id")
    .eq("company_id", company.id);

  if (membersError) {
    return NextResponse.json({ ok: false, error: membersError.message }, { status: 500 });
  }

  const memberIds = (members ?? []).map((member) => member.id);
  const otherUserIds = memberIds.filter((id) => id !== user.id);

  for (const memberId of otherUserIds) {
    const { error } = await admin.auth.admin.deleteUser(memberId);
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
  }

  const { error: deleteCompanyError } = await admin.from("companies").delete().eq("id", company.id);
  if (deleteCompanyError) {
    return NextResponse.json({ ok: false, error: deleteCompanyError.message }, { status: 500 });
  }

  const { error: deleteOwnerError } = await admin.auth.admin.deleteUser(user.id);
  if (deleteOwnerError) {
    return NextResponse.json({ ok: false, error: deleteOwnerError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
