import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type ConversationRow = {
  id: string;
  company_id: string;
};

type ProfileRow = {
  id: string;
  company_id: string;
  role: string;
};

type Payload = {
  conversationId?: string;
  status?: "new" | "active" | "no_response" | "won" | "lost";
  assignedTo?: string | null;
};

const ALLOWED_STATUSES = new Set(["new", "active", "no_response", "won", "lost"]);

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Payload;
  const conversationId = typeof body.conversationId === "string" ? body.conversationId : "";
  const status = typeof body.status === "string" && ALLOWED_STATUSES.has(body.status) ? body.status : undefined;
  const assignedTo = typeof body.assignedTo === "string" ? body.assignedTo : body.assignedTo === null ? null : undefined;

  if (!conversationId) {
    return NextResponse.json({ ok: false, error: "conversation_id_required" }, { status: 400 });
  }

  if (status === undefined && assignedTo === undefined) {
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

  const { data: conversation, error: conversationError } = await supabase
    .from("conversations")
    .select("id, company_id")
    .eq("id", conversationId)
    .maybeSingle<ConversationRow>();

  if (conversationError) {
    return NextResponse.json({ ok: false, error: conversationError.message }, { status: 500 });
  }

  if (!conversation) {
    return NextResponse.json({ ok: false, error: "conversation_not_found" }, { status: 404 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, company_id, role")
    .eq("id", user.id)
    .maybeSingle<ProfileRow>();

  if (profileError) {
    return NextResponse.json({ ok: false, error: profileError.message }, { status: 500 });
  }

  if (!profile || profile.company_id !== conversation.company_id) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const canManageAssignment = profile.role === "owner" || profile.role === "admin";

  if (assignedTo !== undefined && !canManageAssignment) {
    return NextResponse.json({ ok: false, error: "assignment_forbidden" }, { status: 403 });
  }

  if (assignedTo) {
    const { data: assignee, error: assigneeError } = await supabase
      .from("profiles")
      .select("id, company_id, role")
      .eq("id", assignedTo)
      .maybeSingle<ProfileRow>();

    if (assigneeError) {
      return NextResponse.json({ ok: false, error: assigneeError.message }, { status: 500 });
    }

    if (!assignee || assignee.company_id !== conversation.company_id) {
      return NextResponse.json({ ok: false, error: "invalid_assignee" }, { status: 400 });
    }
  }

  const patch: {
    status?: string;
    assigned_to?: string | null;
    updated_at?: string;
  } = {
    updated_at: new Date().toISOString(),
  };

  if (status !== undefined) {
    patch.status = status;
  }

  if (assignedTo !== undefined) {
    patch.assigned_to = assignedTo;
  }

  const { error: updateError } = await supabase
    .from("conversations")
    .update(patch)
    .eq("id", conversation.id);

  if (updateError) {
    return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
