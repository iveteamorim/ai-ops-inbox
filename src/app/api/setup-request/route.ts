import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type ProfileRow = {
  company_id: string;
};

export async function POST(request: Request) {
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

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .maybeSingle<ProfileRow>();

  if (profileError) {
    return NextResponse.json({ ok: false, error: profileError.message }, { status: 500 });
  }

  if (!profile) {
    return NextResponse.json({ ok: false, error: "profile_not_found" }, { status: 404 });
  }

  const { data: existing, error: existingError } = await supabase
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
    const { data: updated, error: updateError } = await supabase
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

  const { data, error } = await supabase
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
