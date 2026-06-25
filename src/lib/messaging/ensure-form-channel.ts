import { randomBytes } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

function createFormToken() {
  return randomBytes(24).toString("base64url");
}

export async function ensureFormChannelForCompany(
  admin: SupabaseClient,
  companyId: string,
  userId: string,
) {
  const { data: channel } = await admin
    .from("channels")
    .select("id, external_account_id, is_active, config")
    .eq("company_id", companyId)
    .eq("type", "form")
    .maybeSingle<{
      id: string;
      external_account_id: string | null;
      is_active: boolean;
      config: Record<string, unknown> | null;
    }>();

  if (channel?.is_active && channel.external_account_id) {
    return;
  }

  const token = channel?.external_account_id ?? createFormToken();
  const now = new Date().toISOString();
  const config = {
    ...(channel?.config ?? {}),
    connection_method: "web_form",
    activated_at: now,
    activated_by_user_id: userId,
  };

  if (channel?.id) {
    await admin
      .from("channels")
      .update({
        external_account_id: token,
        is_active: true,
        config,
      })
      .eq("id", channel.id);
    return;
  }

  await admin.from("channels").insert({
    company_id: companyId,
    type: "form",
    external_account_id: token,
    is_active: true,
    config,
  });
}
