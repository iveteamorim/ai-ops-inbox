import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit } from "@/lib/rate-limit";
import { formCorsJsonResponse, formCorsPreflightResponse } from "@/lib/messaging/form-cors";
import { normalizeFormLead, type FormLeadPayload } from "@/lib/messaging/form";
import { persistFormLead } from "@/lib/messaging/repository";

function clientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

export async function OPTIONS() {
  return formCorsPreflightResponse();
}

export async function POST(request: Request) {
  const ip = clientIp(request);
  const ipLimit = checkRateLimit({
    key: `form-leads:ip:${ip}`,
    windowMs: 60_000,
    limit: 20,
  });

  if (!ipLimit.allowed) {
    return formCorsJsonResponse(
      { ok: false, error: "rate_limited" },
      429,
    );
  }

  const body = (await request.json().catch(() => ({}))) as FormLeadPayload;
  const parsed = normalizeFormLead(body);

  if (!parsed.ok) {
    return formCorsJsonResponse({ ok: false, error: parsed.error }, 400);
  }

  const tokenLimit = checkRateLimit({
    key: `form-leads:token:${parsed.value.token}`,
    windowMs: 60_000,
    limit: 30,
  });

  if (!tokenLimit.allowed) {
    return formCorsJsonResponse(
      { ok: false, error: "rate_limited" },
      429,
    );
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return formCorsJsonResponse({ ok: false, error: "service_unavailable" }, 503);
  }

  try {
    const result = await persistFormLead(admin, {
      token: parsed.value.token,
      name: parsed.value.name,
      email: parsed.value.email,
      phone: parsed.value.phone,
      message: parsed.value.message,
      rawPayload: {
        source: "api/leads/form",
        name: parsed.value.name,
        email: parsed.value.email,
        phone: parsed.value.phone,
        message: parsed.value.message,
      },
    });

    if (!result.saved) {
      const status = result.reason === "invalid_token" ? 401 : 409;
      return formCorsJsonResponse({ ok: false, error: result.reason ?? "not_saved" }, status);
    }

    return formCorsJsonResponse({
      ok: true,
      conversation_id: result.conversationId ?? null,
    });
  } catch (error) {
    console.error("form_lead_ingest_failed", {
      error: error instanceof Error ? error.message : "unknown_error",
    });
    return formCorsJsonResponse({ ok: false, error: "internal_error" }, 500);
  }
}
