import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { enforceSameOrigin } from "@/lib/security/request-origin";
import { getWorkspaceMember } from "@/lib/workspace-access";

type PostBody = {
  conversation_id?: string;
};

type ConversationRow = {
  id: string;
  company_id: string;
  contact_id: string;
  status: "new" | "active" | "won" | "lost" | "no_response";
  lead_type: string | null;
  estimated_value: number | null;
};

type ContactRow = {
  name: string | null;
};

type MessageRow = {
  direction: "inbound" | "outbound";
  sender_type: "customer" | "agent" | "system";
  text: string | null;
  created_at: string;
};

async function getAuthenticatedClient() {
  const supabase = await createClient();
  const admin = createAdminClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profile = user ? await getWorkspaceMember(user).catch(() => null) : null;

  return { user, supabase, admin, profile };
}

async function getAuthorizedConversation(
  admin: ReturnType<typeof createAdminClient>,
  companyId: string | null | undefined,
  conversationId: string,
) {
  const { data: conversation, error } = await admin
    .from("conversations")
    .select("id, company_id, contact_id, status, lead_type, estimated_value")
    .eq("id", conversationId)
    .maybeSingle<ConversationRow>();

  if (error) {
    return { conversation: null, error: error.message, status: 500 as const };
  }

  if (!conversation) {
    return { conversation: null, error: "conversation_not_found", status: 404 as const };
  }

  if (!companyId || companyId !== conversation.company_id) {
    return { conversation: null, error: "forbidden", status: 403 as const };
  }

  return { conversation, error: null, status: 200 as const };
}

function formatRecentMessages(messages: MessageRow[]) {
  return messages
    .filter((message) => message.text?.trim())
    .map((message) => {
      const speaker =
        message.sender_type === "agent"
          ? "Agent"
          : message.sender_type === "customer"
            ? "Customer"
            : "System";
      return `${speaker}: ${message.text?.trim()}`;
    })
    .join("\n");
}

export async function POST(request: Request) {
  const originError = enforceSameOrigin(request);
  if (originError) return originError;

  const body = (await request.json().catch(() => ({}))) as PostBody;
  const conversationId = body.conversation_id?.trim();

  if (!conversationId) {
    return NextResponse.json({ ok: false, error: "conversation_id_required" }, { status: 400 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ ok: false, error: "openai_not_configured" }, { status: 503 });
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

  const access = await getAuthorizedConversation(authContext.admin, authContext.profile?.company_id, conversationId);
  if (!access.conversation) {
    return NextResponse.json({ ok: false, error: access.error }, { status: access.status });
  }

  const [contactResult, messagesResult] = await Promise.all([
    authContext.admin
      .from("contacts")
      .select("name")
      .eq("id", access.conversation.contact_id)
      .eq("company_id", access.conversation.company_id)
      .maybeSingle<ContactRow>(),
    authContext.admin
      .from("messages")
      .select("direction, sender_type, text, created_at")
      .eq("conversation_id", access.conversation.id)
      .eq("company_id", access.conversation.company_id)
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  if (contactResult.error) {
    return NextResponse.json({ ok: false, error: contactResult.error.message }, { status: 500 });
  }

  if (messagesResult.error) {
    return NextResponse.json({ ok: false, error: messagesResult.error.message }, { status: 500 });
  }

  const recentMessages = ((messagesResult.data as MessageRow[] | null) ?? []).reverse();
  const recentTranscript = formatRecentMessages(recentMessages);
  const latestCustomerMessage =
    [...recentMessages].reverse().find(
      (message) => message.direction === "inbound" && message.sender_type === "customer" && message.text?.trim(),
    )?.text?.trim() ?? "";

  const systemPrompt = [
    "You write suggested replies for a business operator handling inbound leads.",
    "Write one short reply in the same language as the latest customer message.",
    "Keep it practical and natural, 1 to 3 short sentences.",
    "Do not invent exact pricing, dates, or availability you do not know.",
    "If the lead is unclear, ask one clarifying question.",
    "If the lead shows commercial intent, move the conversation forward.",
    "Do not mention internal scoring, value, risk, or labels.",
    "Return only the suggested reply text.",
  ].join(" ");

  const userPrompt = [
    `Customer name: ${contactResult.data?.name ?? "Unknown"}`,
    `Conversation status: ${access.conversation.status}`,
    `Lead type: ${access.conversation.lead_type ?? "Unclassified"}`,
    `Estimated value: ${Number(access.conversation.estimated_value ?? 0)}`,
    `Latest customer message: ${latestCustomerMessage || "None"}`,
    "Recent messages:",
    recentTranscript || "No recent messages.",
  ].join("\n");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      temperature: 0.4,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "openai_request_failed");
    return NextResponse.json({ ok: false, error: errorText }, { status: 502 });
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string | null } }>;
  };
  const suggestion = payload.choices?.[0]?.message?.content?.trim();

  if (!suggestion) {
    return NextResponse.json({ ok: false, error: "empty_suggestion" }, { status: 502 });
  }

  return NextResponse.json({ ok: true, suggestion });
}
