import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get("conversation_id");

  if (!conversationId) {
    return NextResponse.json({ ok: false, error: "conversation_id_required" }, { status: 400 });
  }

  let supabase;
  try {
    supabase = createAdminClient();
  } catch {
    return NextResponse.json(
      { ok: true, messages: [], note: "supabase_not_configured" },
      { status: 202 },
    );
  }

  const { data, error } = await supabase
    .from("messages")
    .select("id, direction, sender_type, text, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(200);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, messages: data ?? [] });
}

type PostBody = {
  conversation_id?: string;
  company_id?: string;
  text?: string;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as PostBody;

  if (!body.conversation_id || !body.company_id || !body.text) {
    return NextResponse.json(
      { ok: false, error: "conversation_id_company_id_text_required" },
      { status: 400 },
    );
  }

  let supabase;
  try {
    supabase = createAdminClient();
  } catch {
    return NextResponse.json(
      {
        ok: true,
        queued: false,
        note: "supabase_not_configured",
      },
      { status: 202 },
    );
  }

  const { error: insertError } = await supabase.from("messages").insert({
    company_id: body.company_id,
    conversation_id: body.conversation_id,
    direction: "outbound",
    sender_type: "agent",
    channel: "whatsapp",
    text: body.text,
    raw_payload: { source: "api/messages" },
  });

  if (insertError) {
    return NextResponse.json({ ok: false, error: insertError.message }, { status: 500 });
  }

  await supabase
    .from("conversations")
    .update({
      status: "active",
      last_message_at: new Date().toISOString(),
      last_outbound_at: new Date().toISOString(),
    })
    .eq("id", body.conversation_id);

  return NextResponse.json({ ok: true, queued: true });
}
