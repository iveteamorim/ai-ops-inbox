import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureUserWorkspace } from "@/lib/workspace-bootstrap";
import { enforceSameOrigin } from "@/lib/security/request-origin";

export async function POST(request: Request) {
  const originError = enforceSameOrigin(request);
  if (originError) return originError;

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

  try {
    const result = await ensureUserWorkspace(user);
    return NextResponse.json({ ok: true, repaired: result.repaired });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "workspace_bootstrap_failed",
      },
      { status: 500 },
    );
  }
}
