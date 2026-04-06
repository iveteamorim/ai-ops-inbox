import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type ConversationRow = {
  id: string;
  company_id: string;
  channel: "whatsapp" | "instagram" | "email" | "form";
  assigned_to: string | null;
};

type PostBody = {
  conversation_id?: string;
  text?: string;
};

async function getAuthenticatedClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { user, supabase };
}

async function getAuthorizedConversation(supabase: Awaited<ReturnType<typeof createClient>>, conversationId: string) {
  const { data: conversation, error: conversationError } = await supabase
    .from("conversations")
    .select("id, company_id, channel, assigned_to")
    .eq("id", conversationId)
    .maybeSingle<ConversationRow>();

  if (conversationError) {
    return { conversation: null, error: conversationError.message, status: 500 as const };
  }

  if (!conversation) {
    return { conversation: null, error: "conversation_not_found", status: 404 as const };
  }

  return { conversation, error: null, status: 200 as const };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get("conversation_id")?.trim();

  if (!conversationId) {
    return NextResponse.json({ ok: false, error: "conversation_id_required" }, { status: 400 });
  }

  let authContext;
  try {
    authContext = await getAuthenticatedClient();
  } catch {
    return NextResponse.json({ ok: false, error: "supabase_not_configured" }, { status: 503 });
  }

  if (!authContext.user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const access = await getAuthorizedConversation(authContext.supabase, conversationId);
  if (!access.conversation) {
    return NextResponse.json({ ok: false, error: access.error }, { status: access.status });
  }

  const { data, error } = await authContext.supabase
    .from("messages")
    .select("id, direction, sender_type, text, created_at")
    .eq("conversation_id", access.conversation.id)
    .eq("company_id", access.conversation.company_id)
    .order("created_at", { ascending: true })
    .limit(200);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, messages: data ?? [] });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as PostBody;
  const conversationId = body.conversation_id?.trim();
  const text = body.text?.trim();

  if (!conversationId || !text) {
    return NextResponse.json({ ok: false, error: "conversation_id_text_required" }, { status: 400 });
  }

  let authContext;
  try {
    authContext = await getAuthenticatedClient();
  } catch {
    return NextResponse.json({ ok: false, error: "supabase_not_configured" }, { status: 503 });
  }

  if (!authContext.user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const access = await getAuthorizedConversation(authContext.supabase, conversationId);
  if (!access.conversation) {
    return NextResponse.json({ ok: false, error: access.error }, { status: access.status });
  }

  const now = new Date().toISOString();
  const { error: insertError } = await authContext.supabase.from("messages").insert({
    company_id: access.conversation.company_id,
    conversation_id: access.conversation.id,
    direction: "outbound",
    sender_type: "agent",
    channel: access.conversation.channel,
    text,
    raw_payload: { source: "api/messages" },
  });

  if (insertError) {
    return NextResponse.json({ ok: false, error: insertError.message }, { status: 500 });
  }

  const { error: updateError } = await authContext.supabase
    .from("conversations")
    .update({
      status: "active",
      last_message_at: now,
      last_outbound_at: now,
    })
    .eq("id", access.conversation.id);

  if (updateError) {
    return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });
  }

  if (!access.conversation.assigned_to) {
    const { error: assignmentError } = await authContext.supabase
      .from("conversations")
      .update({
        assigned_to: authContext.user.id,
        updated_at: now,
      })
      .eq("id", access.conversation.id)
      .is("assigned_to", null);

    if (assignmentError) {
      return NextResponse.json({ ok: false, error: assignmentError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true, queued: true });
}
