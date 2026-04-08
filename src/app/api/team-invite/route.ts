import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit } from "@/lib/rate-limit";

type ProfileRow = {
  company_id: string;
  role: string;
};

type CompanyRow = {
  id: string;
  plan: string;
};

const PLAN_SEAT_LIMITS: Record<string, number> = {
  trial: 3,
  starter: 3,
  growth: 6,
  pro: 15,
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

  const rateLimit = checkRateLimit({
    key: `team-invite:${user.id}`,
    windowMs: 10 * 60_000,
    limit: 5,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { ok: false, error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
    );
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
  const { data: company, error: companyError } = await admin
    .from("companies")
    .select("id, plan")
    .eq("id", profile.company_id)
    .maybeSingle<CompanyRow>();

  if (companyError) {
    return NextResponse.json({ ok: false, error: companyError.message }, { status: 500 });
  }

  const plan = company?.plan ?? "trial";
  const seatLimit = PLAN_SEAT_LIMITS[plan] ?? PLAN_SEAT_LIMITS.trial;
  const [{ count: profileCount, error: profileCountError }, usersResult] = await Promise.all([
    admin.from("profiles").select("*", { count: "exact", head: true }).eq("company_id", profile.company_id),
    admin.auth.admin.listUsers({ page: 1, perPage: 200 }),
  ]);

  if (profileCountError) {
    return NextResponse.json({ ok: false, error: profileCountError.message }, { status: 500 });
  }

  if (usersResult.error) {
    return NextResponse.json({ ok: false, error: usersResult.error.message }, { status: 500 });
  }

  const pendingInvites = usersResult.data.users.filter(
    (listedUser) =>
      listedUser.user_metadata?.company_id === profile.company_id &&
      !listedUser.last_sign_in_at,
  );
  const occupiedSeats = (profileCount ?? 0) + pendingInvites.length;

  if (occupiedSeats >= seatLimit) {
    return NextResponse.json(
      {
        ok: false,
        error: "seat_limit_reached",
        limit: seatLimit,
        plan,
      },
      { status: 403 },
    );
  }

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
