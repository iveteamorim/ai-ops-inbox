import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isNovuaInternalUser } from "@/lib/internal-access";
import { enforceSameOrigin } from "@/lib/security/request-origin";
import { canManageWorkspace, getWorkspaceMember } from "@/lib/workspace-access";

type Payload = {
  requestId?: string;
  status?: "requested" | "in_progress" | "completed" | "cancelled";
};

const ALLOWED_STATUSES = new Set(["requested", "in_progress", "completed", "cancelled"]);

export async function POST(request: Request) {
  const originError = enforceSameOrigin(request);
  if (originError) return originError;

  const body = (await request.json().catch(() => ({}))) as Payload;
  const requestId = typeof body.requestId === "string" ? body.requestId : "";
  const status =
    typeof body.status === "string" && ALLOWED_STATUSES.has(body.status) ? body.status : undefined;

  if (!requestId || !status) {
    return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
  }

  const supabase = await createClient();
  const admin = createAdminClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
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

  if (!canManageWorkspace(profile.role) || !isNovuaInternalUser(user.email)) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const { error } = await admin
    .from("setup_requests")
    .update({ status })
    .eq("id", requestId);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
