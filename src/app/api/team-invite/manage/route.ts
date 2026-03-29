import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type ProfileRow = {
  company_id: string;
  role: string;
};

type ActionPayload = {
  inviteId?: string;
  action?: "cancel" | "resend";
};

function normalizeRole(value: unknown) {
  return value === "admin" ? "admin" : value === "owner" ? "owner" : "agent";
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as ActionPayload;
  const inviteId = typeof body.inviteId === "string" ? body.inviteId : "";
  const action = body.action;

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
