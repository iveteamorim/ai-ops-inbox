import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isNovuaInternalUser } from "@/lib/internal-access";

type Payload = {
  feedbackId?: string;
  status?: "new" | "reviewed" | "closed";
  adminReply?: string;
};

const ALLOWED_STATUSES = new Set(["new", "reviewed", "closed"]);

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Payload;
  const feedbackId = typeof body.feedbackId === "string" ? body.feedbackId.trim() : "";
  const status =
    typeof body.status === "string" && ALLOWED_STATUSES.has(body.status) ? body.status : undefined;
  const adminReply =
    typeof body.adminReply === "string" ? body.adminReply.trim().slice(0, 4000) : undefined;

  if (!feedbackId) {
    return NextResponse.json({ ok: false, error: "feedback_id_required" }, { status: 400 });
  }

  if (status === undefined && adminReply === undefined) {
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

  if (!isNovuaInternalUser(user.email)) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();
  const patch: {
    status?: "new" | "reviewed" | "closed";
    admin_reply?: string | null;
    replied_at?: string | null;
  } = {};

  if (status !== undefined) {
    patch.status = status;
  }

  if (adminReply !== undefined) {
    patch.admin_reply = adminReply || null;
    patch.replied_at = adminReply ? new Date().toISOString() : null;
  }

  const { error } = await admin.from("pilot_feedback").update(patch).eq("id", feedbackId);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
