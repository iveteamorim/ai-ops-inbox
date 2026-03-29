import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type ProfileRow = {
  company_id: string;
  role: string;
};

function deriveNameFromEmail(email: string) {
  const local = email.split("@")[0] ?? "agent";
  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { email?: string; role?: string };
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const role = body.role === "admin" ? "admin" : "agent";

  if (!email) {
    return NextResponse.json({ ok: false, error: "missing_email" }, { status: 400 });
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

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("company_id, role")
    .eq("id", user.id)
    .maybeSingle<ProfileRow>();

  if (profileError) {
    return NextResponse.json({ ok: false, error: profileError.message }, { status: 500 });
  }

  if (!profile) {
    return NextResponse.json({ ok: false, error: "profile_not_found" }, { status: 404 });
  }

  if (!["owner", "admin"].includes(profile.role)) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();
  const redirectTo = `${new URL(request.url).origin}/accept-invite`;
  const inviteResult = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo,
    data: {
      company_id: profile.company_id,
      role,
      full_name: deriveNameFromEmail(email),
    },
  });

  if (inviteResult.error || !inviteResult.data.user) {
    return NextResponse.json(
      { ok: false, error: inviteResult.error?.message ?? "invite_failed" },
      { status: 500 },
    );
  }

  const invitedUser = inviteResult.data.user;
  const fullName = deriveNameFromEmail(email);
  const { error: upsertError } = await admin.from("profiles").upsert(
    {
      id: invitedUser.id,
      company_id: profile.company_id,
      full_name: fullName,
      role,
    },
    { onConflict: "id" },
  );

  if (upsertError) {
    return NextResponse.json({ ok: false, error: upsertError.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    invitedUser: {
      id: invitedUser.id,
      email,
      full_name: fullName,
      role,
    },
  });
}
