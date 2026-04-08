import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit } from "@/lib/rate-limit";

type ProfileRow = {
  id: string;
  company_id: string;
  role: string;
};

type ActionPayload = {
  inviteId?: string;
  action?: "cancel" | "resend" | "remove" | "reassign";
  targetUserId?: string;
};

function normalizeRole(value: unknown) {
  return value === "admin" ? "admin" : value === "owner" ? "owner" : "agent";
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as ActionPayload;
  const inviteId = typeof body.inviteId === "string" ? body.inviteId : "";
  const action = body.action;
  const targetUserId = typeof body.targetUserId === "string" ? body.targetUserId : "";

  if (!inviteId || !action) {
    return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const rateLimit = checkRateLimit({
    key: `team-invite-manage:${user.id}`,
    windowMs: 10 * 60_000,
    limit: 20,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { ok: false, error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id, role")
    .eq("id", user.id)
    .maybeSingle<ProfileRow>();

  if (!profile) {
    return NextResponse.json({ ok: false, error: "profile_not_found" }, { status: 404 });
  }

  if (!["owner", "admin"].includes(profile.role)) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data: authUserResult, error: userError } = await admin.auth.admin.getUserById(inviteId);

  if (userError || !authUserResult.user) {
    return NextResponse.json({ ok: false, error: userError?.message ?? "invite_not_found" }, { status: 404 });
  }

  const invitedUser = authUserResult.user;
  if (invitedUser.user_metadata?.company_id !== profile.company_id) {
    return NextResponse.json({ ok: false, error: "invite_not_in_company" }, { status: 403 });
  }

  if (action === "reassign") {
    if (!targetUserId || targetUserId === inviteId) {
      return NextResponse.json({ ok: false, error: "invalid_reassignment_target" }, { status: 400 });
    }

    const [{ data: sourceProfile, error: sourceProfileError }, { data: targetProfile, error: targetProfileError }] =
      await Promise.all([
        admin.from("profiles").select("id, company_id, role").eq("id", inviteId).maybeSingle<ProfileRow>(),
        admin.from("profiles").select("id, company_id, role").eq("id", targetUserId).maybeSingle<ProfileRow>(),
      ]);

    if (sourceProfileError || targetProfileError) {
      return NextResponse.json(
        { ok: false, error: sourceProfileError?.message ?? targetProfileError?.message ?? "profile_lookup_failed" },
        { status: 500 },
      );
    }

    if (!sourceProfile || sourceProfile.company_id !== profile.company_id) {
      return NextResponse.json({ ok: false, error: "user_not_in_company" }, { status: 404 });
    }

    if (!targetProfile || targetProfile.company_id !== profile.company_id) {
      return NextResponse.json({ ok: false, error: "invalid_reassignment_target" }, { status: 400 });
    }

    const { error: reassignError } = await admin
      .from("conversations")
      .update({ assigned_to: targetUserId })
      .eq("company_id", profile.company_id)
      .eq("assigned_to", inviteId)
      .in("status", ["new", "active", "no_response"]);

    if (reassignError) {
      return NextResponse.json({ ok: false, error: reassignError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  }

  if (action === "remove") {
    if (profile.role !== "owner") {
      return NextResponse.json({ ok: false, error: "owner_only_action" }, { status: 403 });
    }

    if (inviteId === user.id) {
      return NextResponse.json({ ok: false, error: "cannot_remove_self" }, { status: 400 });
    }

    const { data: targetProfile, error: targetProfileError } = await admin
      .from("profiles")
      .select("id, company_id, role")
      .eq("id", inviteId)
      .maybeSingle<ProfileRow>();

    if (targetProfileError) {
      return NextResponse.json({ ok: false, error: targetProfileError.message }, { status: 500 });
    }

    if (!targetProfile || targetProfile.company_id !== profile.company_id) {
      return NextResponse.json({ ok: false, error: "user_not_in_company" }, { status: 404 });
    }

    if (targetProfile.role === "owner") {
      return NextResponse.json({ ok: false, error: "cannot_remove_owner" }, { status: 400 });
    }

    const { error: unassignError } = await admin
      .from("conversations")
      .update({ assigned_to: null })
      .eq("company_id", profile.company_id)
      .eq("assigned_to", inviteId)
      .in("status", ["new", "active", "no_response"]);

    if (unassignError) {
      return NextResponse.json({ ok: false, error: unassignError.message }, { status: 500 });
    }

    const { error: deleteError } = await admin.auth.admin.deleteUser(inviteId);
    if (deleteError) {
      return NextResponse.json({ ok: false, error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  }

  if (invitedUser.last_sign_in_at) {
    return NextResponse.json({ ok: false, error: "invite_already_accepted" }, { status: 409 });
  }

  if (action === "cancel") {
    const { error } = await admin.auth.admin.deleteUser(inviteId);
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  }

  const redirectTo = `${new URL(request.url).origin}/accept-invite`;
  const { error } = await admin.auth.admin.inviteUserByEmail(invitedUser.email ?? "", {
    redirectTo,
    data: {
      company_id: profile.company_id,
      role: normalizeRole(invitedUser.user_metadata?.role),
      full_name:
        typeof invitedUser.user_metadata?.full_name === "string" ? invitedUser.user_metadata.full_name : null,
    },
  });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
