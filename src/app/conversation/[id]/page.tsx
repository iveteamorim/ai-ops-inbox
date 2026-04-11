import { notFound } from "next/navigation";
import { cookies, headers } from "next/headers";
import { AppNav } from "@/components/AppNav";
import { ConversationWorkspace } from "@/components/ConversationWorkspace";
import { detectCurrencyFromLocale } from "@/lib/i18n/currency";
import { LANG_COOKIE, resolveLang } from "@/lib/i18n/config";
import { translate } from "@/lib/i18n/dictionaries";
import { getAppContext, getConversationDetail, getConversationViews } from "@/lib/app-data";
import { canManageInternalWorkspace, getWorkspaceMode } from "@/lib/internal-access";

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cookieStore = await cookies();
  const headerStore = await headers();
  const lang = resolveLang(cookieStore.get(LANG_COOKIE)?.value, headerStore.get("accept-language"));
  const t = (key: Parameters<typeof translate>[1]) => translate(lang, key);
  const currency = detectCurrencyFromLocale(headerStore.get("accept-language"));

  const context = await getAppContext();
  if (context.kind !== "ready") {
    notFound();
  }

  const detail = await getConversationDetail(context.supabase, context.profile.company_id, id);
  if (!detail) {
    notFound();
  }
  const rows = await getConversationViews(context.supabase, context.profile.company_id);
  const unitOptions = Array.from(new Set(rows.map((row) => row.unit).filter((value): value is string => Boolean(value))));
  const workspaceMode = getWorkspaceMode(context.company, context.user.email);
  const canSeeInternalSetup = canManageInternalWorkspace(workspaceMode);

  return (
    <section className="page">
      <AppNav
        showSetup={canSeeInternalSetup}
        showLocale={canSeeInternalSetup}
        userName={context.profile.full_name ?? context.user.email ?? null}
        userRole={context.profile.role}
      />
      <header className="header">
        <div>
          <h1 className="title">
            {t("conversation_title")}: {detail.conversation.contactName || t("inbox_unknown_contact")}
          </h1>
          <p className="subtitle">{t("conversation_subtitle")}</p>
        </div>
      </header>

      <ConversationWorkspace
        conversation={detail.conversation}
        initialMessages={detail.messages}
        currency={currency}
        unitOptions={unitOptions}
      />
    </section>
  );
}
