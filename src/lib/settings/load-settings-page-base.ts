import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { LANG_COOKIE, resolveLang } from "@/lib/i18n/config";
import { translate } from "@/lib/i18n/dictionaries";
import { getAppContext, getSettingsData } from "@/lib/app-data";
import { ensureFormChannelForCompany } from "@/lib/messaging/ensure-form-channel";
import { createAdminClient } from "@/lib/supabase/admin";
import { canManageInternalWorkspace, getWorkspaceMode } from "@/lib/internal-access";
import { getSetupCopy } from "@/lib/settings/setup-copy";

export async function loadSettingsPageBase() {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const lang = resolveLang(cookieStore.get(LANG_COOKIE)?.value, headerStore.get("accept-language"));
  const t = (key: Parameters<typeof translate>[1]) => translate(lang, key);
  const copy = getSetupCopy(lang);

  const context = await getAppContext();
  if (context.kind !== "ready") {
    return { kind: "unavailable" as const, lang, t, copy };
  }

  const workspaceMode = getWorkspaceMode(context.company, context.user.email);
  if (workspaceMode === "customer_demo") {
    redirect("/dashboard");
  }

  const canSeeInternalSetup = canManageInternalWorkspace(workspaceMode);
  const canManageTeam = context.profile.role === "owner" || context.profile.role === "admin";

  let channels = [] as Awaited<ReturnType<typeof getSettingsData>>["channels"];
  let team = [] as Awaited<ReturnType<typeof getSettingsData>>["team"];
  let pendingInvites = [] as Awaited<ReturnType<typeof getSettingsData>>["pendingInvites"];
  let setupRequests = [] as Awaited<ReturnType<typeof getSettingsData>>["setupRequests"];
  let feedbackHistory = [] as Awaited<ReturnType<typeof getSettingsData>>["feedbackHistory"];
  let settingsLoadError: string | null = null;

  try {
    if (canManageTeam) {
      const admin = createAdminClient();
      await ensureFormChannelForCompany(admin, context.profile.company_id, context.user.id);
    }

    ({ channels, team, pendingInvites, setupRequests, feedbackHistory } = await getSettingsData(
      context.supabase,
      context.profile.company_id,
      context.user.id,
    ));
  } catch (error) {
    settingsLoadError = error instanceof Error ? error.message : "settings_load_failed";
    console.error("settings_page_load_failed", {
      userId: context.user.id,
      companyId: context.profile.company_id,
      error: settingsLoadError,
    });
  }

  return {
    kind: "ready" as const,
    lang,
    t,
    copy,
    context,
    workspaceMode,
    canSeeInternalSetup,
    canManageTeam,
    channels,
    team,
    pendingInvites,
    setupRequests,
    feedbackHistory,
    settingsLoadError,
    headerStore,
  };
}
