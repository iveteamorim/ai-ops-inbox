import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit } from "@/lib/rate-limit";
import { enforceSameOrigin } from "@/lib/security/request-origin";
import { getWorkspaceMember } from "@/lib/workspace-access";

export async function POST(request: Request) {
  const originError = enforceSameOrigin(request);
  if (originError) return originError;

  const body = (await request.json().catch(() => ({}))) as { channel?: string; notes?: string };
  const channel = body.channel === "email" || body.channel === "form" ? body.channel : "whatsapp";
  const notes = typeof body.notes === "string" ? body.notes.trim() : null;

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
    key: `setup-request:${user.id}`,
    windowMs: 10 * 60_000,
    limit: 5,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { ok: false, error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
    );
  }

  const admin = createAdminClient();
  let profile;
  try {
    profile = await getWorkspaceMember(user);
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "workspace_bootstrap_failed" },
      { status: 500 },
    );
  }

  const { data: existing, error: existingError } = await admin
    .from("setup_requests")
    .select("id, status")
    .eq("company_id", profile.company_id)
    .eq("channel", channel)
    .in("status", ["requested", "in_progress"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ id: string; status: string }>();

  if (existingError) {
    return NextResponse.json({ ok: false, error: existingError.message }, { status: 500 });
  }

  if (existing) {
    const { data: updated, error: updateError } = await admin
      .from("setup_requests")
      .update({ notes })
      .eq("id", existing.id)
      .select("id, status, channel, notes, created_at")
      .single();

    if (updateError) {
      return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, alreadyRequested: true, request: updated });
  }

  const { data, error } = await admin
    .from("setup_requests")
    .insert({
      company_id: profile.company_id,
      user_id: user.id,
      channel,
      status: "requested",
      notes,
    })
    .select("id, status, channel, notes, created_at")
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, request: data });
}
