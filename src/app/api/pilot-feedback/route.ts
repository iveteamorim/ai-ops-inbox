import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit } from "@/lib/rate-limit";
import { enforceSameOrigin } from "@/lib/security/request-origin";
import { getWorkspaceMember } from "@/lib/workspace-access";

type Payload = {
  category?: "bug" | "feedback" | "feature_request";
  message?: string;
  pagePath?: string;
};

const ALLOWED_CATEGORIES = new Set(["bug", "feedback", "feature_request"]);

export async function POST(request: Request) {
  const originError = enforceSameOrigin(request);
  if (originError) return originError;

  const body = (await request.json().catch(() => ({}))) as Payload;
  const category =
    typeof body.category === "string" && ALLOWED_CATEGORIES.has(body.category)
      ? body.category
      : undefined;
  const message = typeof body.message === "string" ? body.message.trim().slice(0, 4000) : "";
  const pagePath = typeof body.pagePath === "string" ? body.pagePath.trim().slice(0, 255) : "";

  if (!category || !message) {
    return NextResponse.json({ ok: false, error: "invalid_feedback_payload" }, { status: 400 });
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
    key: `pilot-feedback:${user.id}`,
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

  const { error: insertError } = await admin.from("pilot_feedback").insert({
    company_id: profile.company_id,
    user_id: profile.id,
    category,
    message,
    page_path: pagePath || null,
  });

  if (insertError) {
    return NextResponse.json({ ok: false, error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
