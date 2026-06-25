import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { enforceSameOrigin } from "@/lib/security/request-origin";
import { canManageWorkspace, getWorkspaceMember } from "@/lib/workspace-access";

type ConversationRow = {
  id: string;
  company_id: string;
  estimated_value: number | null;
  expected_value: number | null;
  status: "new" | "active" | "no_response" | "won" | "lost";
};

type Payload = {
  conversationId?: string;
  status?: "new" | "active" | "no_response" | "won" | "lost";
  assignedTo?: string | null;
  unit?: string | null;
};

const ALLOWED_STATUSES = new Set(["new", "active", "no_response", "won", "lost"]);

export async function POST(request: Request) {
  const originError = enforceSameOrigin(request);
  if (originError) return originError;

  const body = (await request.json().catch(() => ({}))) as Payload;
  const conversationId = typeof body.conversationId === "string" ? body.conversationId : "";
  const status = typeof body.status === "string" && ALLOWED_STATUSES.has(body.status) ? body.status : undefined;
  const assignedTo = typeof body.assignedTo === "string" ? body.assignedTo : body.assignedTo === null ? null : undefined;
  const unit =
    typeof body.unit === "string" ? body.unit.trim().slice(0, 80) : body.unit === null ? null : undefined;

  if (!conversationId) {
    return NextResponse.json({ ok: false, error: "conversation_id_required" }, { status: 400 });
  }

  if (status === undefined && assignedTo === undefined && unit === undefined) {
    return NextResponse.json({ ok: false, error: "no_changes_requested" }, { status: 400 });
  }

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

  const { data: conversation, error: conversationError } = await admin
    .from("conversations")
    .select("id, company_id, estimated_value, expected_value, status")
    .eq("id", conversationId)
    .maybeSingle<ConversationRow>();

  if (conversationError) {
    return NextResponse.json({ ok: false, error: conversationError.message }, { status: 500 });
  }

  if (!conversation) {
    return NextResponse.json({ ok: false, error: "conversation_not_found" }, { status: 404 });
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

  if (!profile || profile.company_id !== conversation.company_id) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const canManageBusinessStates = canManageWorkspace(profile.role);

  if (assignedTo !== undefined) {
    return NextResponse.json(
      { ok: false, error: "assignment_managed_on_first_reply" },
      { status: 400 },
    );
  }

  if (status !== undefined && (status === "won" || status === "lost") && !canManageBusinessStates) {
    return NextResponse.json({ ok: false, error: "forbidden_status_transition" }, { status: 403 });
  }

  const patch: {
    status?: string;
    assigned_to?: string | null;
    unit?: string | null;
    expected_value?: number;
    updated_at?: string;
  } = {
    updated_at: new Date().toISOString(),
  };

  if (status !== undefined) {
    patch.status = status;
    if (status === "won") {
      patch.expected_value = Number(conversation.expected_value ?? conversation.estimated_value ?? 0);
    } else if (conversation.status === "won" || status === "lost") {
      patch.expected_value = 0;
    }
  }

  if (unit !== undefined) {
    patch.unit = unit || null;
  }

  const { error: updateError } = await admin
    .from("conversations")
    .update(patch)
    .eq("id", conversation.id);

  if (updateError) {
    return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
