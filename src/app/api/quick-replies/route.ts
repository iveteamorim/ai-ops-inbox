import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { enforceSameOrigin } from "@/lib/security/request-origin";
import { canManageWorkspace, getWorkspaceMember } from "@/lib/workspace-access";

type QuickReplyInput = {
  id?: string;
  title?: string;
  keywords?: string;
  text?: string;
};

type Payload = {
  quickReplies?: QuickReplyInput[];
};

type CompanyRow = {
  id: string;
  config: Record<string, unknown> | null;
};

export async function POST(request: Request) {
  const originError = enforceSameOrigin(request);
  if (originError) return originError;

  const body = (await request.json().catch(() => ({}))) as Payload;

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

  if (!canManageWorkspace(profile.role)) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const quickReplies = Array.isArray(body.quickReplies)
    ? body.quickReplies
        .map((row) => {
          const title = typeof row?.title === "string" ? row.title.trim().slice(0, 80) : "";
          const text = typeof row?.text === "string" ? row.text.trim().slice(0, 1200) : "";
          const keywords = typeof row?.keywords === "string" ? row.keywords.trim().slice(0, 240) : "";
          if (!title || !text) return null;
          return {
            id:
              typeof row?.id === "string" && row.id.trim()
                ? row.id.trim()
                : `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Math.random().toString(36).slice(2, 8)}`,
            title,
            keywords,
            text,
          };
        })
        .filter((value): value is { id: string; title: string; keywords: string; text: string } => Boolean(value))
        .slice(0, 20)
    : [];

  const { data: company, error: companyError } = await admin
    .from("companies")
    .select("id, config")
    .eq("id", profile.company_id)
    .maybeSingle<CompanyRow>();

  if (companyError) {
    return NextResponse.json({ ok: false, error: companyError.message }, { status: 500 });
  }

  if (!company) {
    return NextResponse.json({ ok: false, error: "company_not_found" }, { status: 404 });
  }

  const currentConfig = company.config && typeof company.config === "object" ? company.config : {};
  const nextConfig = {
    ...currentConfig,
    quick_replies: quickReplies,
  };

  const { error: updateError } = await admin
    .from("companies")
    .update({ config: nextConfig })
    .eq("id", company.id);

  if (updateError) {
    return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
