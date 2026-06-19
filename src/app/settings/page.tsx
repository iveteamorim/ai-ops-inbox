import { AppNav } from "@/components/AppNav";
import { BusinessSetupForm } from "@/components/BusinessSetupForm";
import { InviteUserForm } from "@/components/InviteUserForm";
import { PendingInvitesList } from "@/components/PendingInvitesList";
import { PilotFeedbackForm } from "@/components/PilotFeedbackForm";
import { PilotFeedbackHistory } from "@/components/PilotFeedbackHistory";
import { TeamMembersList } from "@/components/TeamMembersList";
import { ChannelsOverview } from "@/components/settings/ChannelsOverview";
import { WorkspaceDangerZone } from "@/components/WorkspaceDangerZone";
import { QuickRepliesForm } from "@/components/QuickRepliesForm";
import { formatChannel, getBusinessSetup } from "@/lib/app-data";
import { getQuickReplies } from "@/lib/quick-replies";
import { getQuickRepliesFormCopy } from "@/lib/settings/quick-replies-copy";
import { canSeeCustomerFeedback } from "@/lib/internal-access";
import { translate } from "@/lib/i18n/dictionaries";
import { parseEmailReplyConfigState } from "@/lib/messaging/email-reply-state";
import { getChannelsOverviewCopy } from "@/lib/settings/channel-settings-copy";
import { loadSettingsPageBase } from "@/lib/settings/load-settings-page-base";
import { formatRoleLabel } from "@/lib/settings/setup-copy";

function getWorkspaceSettingsText(
  lang: string,
  canManageTeam: boolean,
  t: (key: Parameters<typeof translate>[1]) => string,
) {
  if (lang === "pt") {
    return {
      teamTitle: canManageTeam ? "Equipe que responde" : t("settings_users"),
      unnamedUser: "Utilizador sem nome",
      detail: "Ver detalhe",
      open: "Abertas",
      noReply: "Sem resposta",
      won: "Ganhas",
      lost: "Perdidas",
    };
  }

  if (lang === "en") {
    return {
      teamTitle: canManageTeam ? "Response team" : t("settings_users"),
      unnamedUser: "Unnamed user",
      detail: "View details",
      open: "Open",
      noReply: "No reply",
      won: "Won",
      lost: "Lost",
    };
  }

  return {
    teamTitle: canManageTeam ? "Equipo que responde" : t("settings_users"),
    unnamedUser: "Usuario sin nombre",
    detail: "Ver detalle",
    open: "Abiertas",
    noReply: "Sin respuesta",
    won: "Ganadas",
    lost: "Perdidas",
  };
}

export default async function SettingsPage() {
  const base = await loadSettingsPageBase();

  if (base.kind !== "ready") {
    return (
      <section className="page">
        <AppNav />
        <header className="header">
          <div>
            <h1 className="title">{base.t("settings_title")}</h1>
            <p className="subtitle">{base.copy.settingsUnavailable}</p>
          </div>
        </header>
      </section>
    );
  }

  const {
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
  } = base;

  const showCustomerFeedback = canSeeCustomerFeedback(workspaceMode);
  const channelsOverviewCopy = getChannelsOverviewCopy(lang);
  const businessSetup = getBusinessSetup(context.company);
  const quickReplies = getQuickReplies(context.company);
  const quickRepliesCopy = getQuickRepliesFormCopy(lang);
  const roleLabel = formatRoleLabel(lang, context.profile.role);
  const workspaceLabel = context.company?.name ?? "Novua Inbox";
  const emailChannel = channels.find((channel) => channel.type === "email") ?? null;
  const emailReply = parseEmailReplyConfigState(emailChannel?.config ?? null);
  const workspaceSettingsText = getWorkspaceSettingsText(lang, canManageTeam, t);

  const seatLimit = context.company?.plan === "growth" ? 6 : context.company?.plan === "pro" ? 15 : 3;
  const usedSeats = team.length + pendingInvites.length;
  const seatsNote =
    lang === "es"
      ? `${usedSeats}/${seatLimit} usuarios usados en el plan ${context.company?.plan ?? "trial"}.`
      : lang === "pt"
        ? `${usedSeats}/${seatLimit} usuários usados no plano ${context.company?.plan ?? "trial"}.`
        : `${usedSeats}/${seatLimit} users used on the ${context.company?.plan ?? "trial"} plan.`;

  return (
    <section className="page settings-page-reset">
      <AppNav
        showSetup={canSeeInternalSetup}
        showLocale={canSeeInternalSetup}
        userName={context.profile.full_name ?? context.user.email ?? null}
        userRole={context.profile.role}
      />
      <div className="settings-modern settings-dashboard settings-v3">
        <div className="settings-dashboard-inner">
          <header className="settings-dashboard-header">
            <div>
              <p className="settings-kicker">
                {lang === "en" ? "NÓVUA · SETTINGS" : lang === "pt" ? "NÓVUA · CONFIGURAÇÕES" : "NÓVUA · CONFIGURACIÓN"}
              </p>
              <h1>{t("settings_title")}</h1>
              <p>{t("settings_subtitle")}</p>
            </div>
          </header>

          {settingsLoadError ? (
            <article className="card">
              <details>
                <summary className="label" style={{ cursor: "pointer" }} aria-label="Toggle settings load details">
                  {lang === "en"
                    ? "Settings loaded with limits"
                    : lang === "pt"
                      ? "Configurações carregadas com limitações"
                      : "Configuración cargada con limitaciones"}
                </summary>
                <p className="subtitle" style={{ marginBottom: 0 }}>
                  {lang === "en"
                    ? "Some workspace data could not be loaded yet. Core actions remain available."
                    : lang === "pt"
                      ? "Alguns dados do workspace ainda não puderam ser carregados. As ações principais continuam disponíveis."
                      : "Algunos datos del workspace todavía no se han podido cargar. Las acciones principales siguen disponibles."}
                </p>
              </details>
            </article>
          ) : null}

          <ChannelsOverview
            channels={channels.map((channel) =>
              channel.type === "email" ? { ...channel, is_active: Boolean(emailReply?.verified) } : channel,
            )}
            setupRequests={setupRequests}
            title={channelsOverviewCopy.title}
            subtitle={channelsOverviewCopy.subtitle}
            connected={channelsOverviewCopy.connected}
            pending={channelsOverviewCopy.pending}
            disconnected={channelsOverviewCopy.disconnected}
            comingSoon={channelsOverviewCopy.comingSoon}
            configure={channelsOverviewCopy.configure}
            tiles={channelsOverviewCopy.tiles}
            formatChannel={(channel) => formatChannel(channel, t)}
          />

          <div className="settings-section-stack">
            {canManageTeam ? (
              <article className="card settings-section-card">
                <BusinessSetupForm
                  initialValue={businessSetup}
                  showInternalTools={canSeeInternalSetup}
                  labels={{
                    title: `${copy.businessSetupTitle} ${lang === "en" ? "(step 2)" : lang === "pt" ? "(passo 2)" : "(paso 2)"}`,
                    help: copy.businessSetupHelp,
                    businessName: copy.businessSetupName,
                    leadTypesBlock: copy.businessSetupLeadTypesBlock,
                    leadTypes: copy.businessSetupLeadTypes,
                    addLeadType: copy.businessSetupAddLeadType,
                    leadTypeName: copy.businessSetupLeadTypeName,
                    estimatedValue: copy.businessSetupEstimatedValue,
                    removeLeadType: copy.businessSetupRemoveLeadType,
                    save: copy.businessSetupSave,
                    saving: copy.businessSetupSaving,
                    backfill: copy.businessSetupBackfill,
                    backfilling: copy.businessSetupBackfilling,
                    backfillSuccess: copy.businessSetupBackfillSuccess,
                    reseedDemo: copy.businessSetupReseedDemo,
                    reseedingDemo: copy.businessSetupReseedingDemo,
                    reseedDemoSuccess: copy.businessSetupReseedDemoSuccess,
                    reseedDemoConfirm: copy.businessSetupReseedDemoConfirm,
                    success: copy.businessSetupSuccess,
                    error: copy.businessSetupError,
                  }}
                />
              </article>
            ) : (
              <article className="card settings-section-card">
                <p className="label">{copy.accountTitle}</p>
                <p className="subtitle" style={{ marginBottom: 12 }}>
                  {copy.accountHelp}
                </p>
                <div className="preview-row">
                  <span>{copy.accountRole}</span>
                  <span className="badge status-active">{roleLabel}</span>
                </div>
                <div className="preview-row">
                  <span>{copy.accountWorkspace}</span>
                  <span>{workspaceLabel}</span>
                </div>
                <div className="preview-row">
                  <span>{copy.accountEmail}</span>
                  <span>{context.user.email ?? "-"}</span>
                </div>
                <div className="agent-settings-note">
                  <p className="label" style={{ marginBottom: 6 }}>
                    {copy.accountPermissions}
                  </p>
                  <p className="subtitle" style={{ margin: 0 }}>
                    {context.profile.role === "agent"
                      ? copy.accountPermissionsAgent
                      : copy.accountPermissionsAdmin}
                  </p>
                </div>
              </article>
            )}

            {canManageTeam ? (
              <article className="card settings-section-card">
                <QuickRepliesForm initialValue={quickReplies} labels={quickRepliesCopy} />
              </article>
            ) : null}

            <article className="card settings-section-card">
              <p className="label">
                {workspaceSettingsText.teamTitle}{" "}
                {lang === "en" ? "(step 3)" : lang === "pt" ? "(passo 3)" : "(paso 3)"}
              </p>
              {team.length === 0 ? (
                <p className="subtitle">{copy.noTeamMembers}</p>
              ) : (
                <TeamMembersList
                  members={team}
                  currentUserId={context.user.id}
                  currentUserRole={context.profile.role}
                  activeLabel={t("settings_active")}
                  ownerLabel={copy.inviteOwner}
                  adminLabel={copy.inviteAdmin}
                  agentLabel={copy.inviteAgent}
                  unnamedLabel={workspaceSettingsText.unnamedUser}
                  detailLabel={workspaceSettingsText.detail}
                  openLabel={workspaceSettingsText.open}
                  noReplyLabel={workspaceSettingsText.noReply}
                  wonLabel={workspaceSettingsText.won}
                  lostLabel={workspaceSettingsText.lost}
                  reassignPlaceholder={copy.reassignPlaceholder}
                  reassignLabel={copy.reassignAction}
                  reassigningLabel={copy.reassigningAction}
                  reassignSuccess={copy.reassignSuccess}
                  reassignError={copy.reassignError}
                  removeLabel={copy.removeUser}
                  removingLabel={copy.removingUser}
                  removeSuccess={copy.removeUserSuccess}
                  removeError={copy.removeUserError}
                />
              )}
              {canManageTeam ? (
                <div style={{ marginTop: 12 }}>
                  <InviteUserForm
                    title={copy.inviteTitle}
                    seatsNote={seatsNote}
                    emailLabel={copy.inviteEmail}
                    submitLabel={copy.inviteUser}
                    pendingLabel={copy.invitePending}
                    successLabel={copy.inviteSuccess}
                    adminLabel={copy.inviteAdmin}
                    agentLabel={copy.inviteAgent}
                    errorGeneric={copy.inviteError}
                    seatLimitError={copy.seatLimitError}
                  />
                </div>
              ) : null}
              {canManageTeam && pendingInvites.length > 0 ? (
                <PendingInvitesList
                  invites={pendingInvites}
                  title={copy.pendingInvites}
                  ownerLabel={copy.inviteOwner}
                  adminLabel={copy.inviteAdmin}
                  agentLabel={copy.inviteAgent}
                  resendLabel={copy.resendInvite}
                  cancelLabel={copy.cancelInvite}
                  sendingLabel={copy.resendPending}
                  cancellingLabel={copy.cancelPending}
                  successResent={copy.inviteResent}
                  successCancelled={copy.inviteCancelled}
                  errorGeneric={copy.inviteError}
                />
              ) : null}
            </article>

            {showCustomerFeedback ? (
              <article className="card settings-section-card">
                <p className="label">{copy.pilotFeedbackTitle}</p>
                <PilotFeedbackForm
                  labels={{
                    title: "",
                    help: copy.pilotFeedbackHelp,
                    category: copy.pilotFeedbackCategory,
                    message: copy.pilotFeedbackMessage,
                    submit: copy.pilotFeedbackSubmit,
                    submitting: copy.pilotFeedbackSubmitting,
                    success: copy.pilotFeedbackSuccess,
                    error: copy.pilotFeedbackError,
                    bug: copy.pilotFeedbackBug,
                    feedback: copy.pilotFeedbackGeneral,
                    featureRequest: copy.pilotFeedbackFeature,
                  }}
                />
                <div style={{ marginTop: 16 }}>
                  <PilotFeedbackHistory
                    items={feedbackHistory}
                    labels={{
                      title: copy.pilotFeedbackHistoryTitle,
                      empty: copy.pilotFeedbackHistoryEmpty,
                      status: copy.pilotFeedbackHistoryStatus,
                      page: copy.pilotFeedbackHistoryPage,
                      reply: copy.pilotFeedbackHistoryReply,
                      new: copy.pilotFeedbackStatusNew,
                      reviewed: copy.pilotFeedbackStatusReviewed,
                      closed: copy.pilotFeedbackStatusClosed,
                    }}
                  />
                </div>
              </article>
            ) : (
              <article className="card settings-section-card">
                <p className="label">
                  {lang === "en" ? "System feedback" : lang === "pt" ? "Feedback do sistema" : "Feedback del sistema"}
                </p>
                <p className="subtitle" style={{ marginTop: 8 }}>
                  {lang === "en"
                    ? "Help us improve Novua. What isn’t working or what should change?"
                    : lang === "pt"
                      ? "Ajude-nos a melhorar a Novua. O que não está a funcionar ou o que gostaria de mudar?"
                      : "Ayúdanos a mejorar Novua. ¿Qué no está funcionando o qué te gustaría cambiar?"}
                </p>
                <input
                  className="input"
                  placeholder={
                    lang === "en"
                      ? "Write your feedback here..."
                      : lang === "pt"
                        ? "Escreva o seu feedback aqui..."
                        : "Escribe tu feedback aquí..."
                  }
                  disabled
                />
                <button className="button" type="button" disabled style={{ marginTop: 10 }}>
                  {lang === "en" ? "Send feedback" : lang === "pt" ? "Enviar feedback" : "Enviar feedback"}
                </button>
              </article>
            )}

            {context.profile.role === "owner" ? (
              <WorkspaceDangerZone
                title={copy.dangerTitle}
                help={copy.dangerHelp}
                warning={copy.dangerWarning}
                confirmationLabel={copy.dangerConfirmationLabel}
                confirmationPlaceholder={workspaceLabel}
                deleteLabel={copy.dangerDeleteLabel}
                deletingLabel={copy.dangerDeletingLabel}
                successRedirectingLabel={copy.dangerDeletedLabel}
                errorLabel={copy.dangerError}
                workspaceName={workspaceLabel}
              />
            ) : null}
          </div>

          {canSeeInternalSetup ? (
            <article className="card" style={{ marginTop: 12 }}>
              <p className="label">{copy.workspaceModeTitle}</p>
              <p className="subtitle" style={{ marginBottom: 0 }}>
                {workspaceMode === "internal_demo"
                  ? copy.workspaceModeInternal
                  : copy.workspaceModeCustomer}
              </p>
            </article>
          ) : null}
        </div>
      </div>
    </section>
  );
}
