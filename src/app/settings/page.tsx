import { AppNav } from "@/components/AppNav";
import { BusinessSetupForm } from "@/components/BusinessSetupForm";
import { InviteUserForm } from "@/components/InviteUserForm";
import { PendingInvitesList } from "@/components/PendingInvitesList";
import { PilotFeedbackForm } from "@/components/PilotFeedbackForm";
import { PilotFeedbackHistory } from "@/components/PilotFeedbackHistory";
import { SetupRequestButton } from "@/components/SetupRequestButton";
import { TeamMembersList } from "@/components/TeamMembersList";
import { cookies } from "next/headers";
import { LANG_COOKIE, normalizeLang } from "@/lib/i18n/config";
import { translate } from "@/lib/i18n/dictionaries";
import { formatChannel, getAppContext, getBusinessSetup, getSettingsData } from "@/lib/app-data";
import { canManageInternalWorkspace, canSeeCustomerFeedback, getWorkspaceMode } from "@/lib/internal-access";

function getSetupCopy(lang: string) {
  if (lang === "es") {
    return {
      channelsEmpty: "WhatsApp se configura con Novua durante el onboarding.",
      channelUsage: "Se usa para recibir y responder mensajes entrantes.",
      channelsNote: "Configurado por Novua durante onboarding.",
      requestSetup: "Solicitar setup",
      requestWhatsAppSetup: "Solicitar setup de WhatsApp",
      updateWhatsAppSetup: "Actualizar solicitud",
      setupRequested: "Setup solicitado",
      setupRequestedNote: "Estamos preparando la configuración de WhatsApp.",
      setupPhoneRequired: "Es obligatorio indicar el número de WhatsApp.",
      setupNumberLabel: "Número de WhatsApp",
      setupNumberPlaceholder: "+34 600 111 222",
      setupMetaVerifiedLabel: "¿Tienes Meta Business verificado?",
      setupMetaVerifiedYes: "Sí",
      setupMetaVerifiedNo: "No",
      setupNotesLabel: "Nota",
      setupNotesPlaceholder: "Nombre de contacto, disponibilidad o cualquier detalle útil.",
      inviteTitle: "Añade agentes o admins al mismo workspace.",
      inviteEmail: "Email",
      inviteRole: "Rol",
      inviteUser: "Invitar usuario",
      invitePending: "Enviando invitación...",
      inviteSuccess: "Invitación enviada.",
      inviteAdmin: "Admin",
      inviteAgent: "Agente",
      inviteError: "No se pudo enviar la invitación.",
      seatLimitError: "Límite de usuarios alcanzado para este plan.",
      pendingInvites: "Invitaciones pendientes",
      resendInvite: "Reenviar",
      cancelInvite: "Cancelar",
      resendPending: "Reenviando...",
      cancelPending: "Cancelando...",
      inviteResent: "Invitación reenviada.",
      inviteCancelled: "Invitación cancelada.",
      removeUser: "Eliminar acceso",
      removingUser: "Eliminando...",
      removeUserSuccess: "Acceso eliminado.",
      removeUserError: "No se pudo eliminar el acceso.",
      reassignPlaceholder: "Reasignar a...",
      reassignAction: "Reasignar",
      reassigningAction: "Reasignando...",
      reassignSuccess: "Conversaciones abiertas reasignadas.",
      reassignError: "No se pudieron reasignar las conversaciones.",
      businessSetupTitle: "Tu negocio",
      businessSetupHelp:
        "Esto ayuda a Novua a priorizar mejor tus conversaciones y estimar el valor de cada cliente.",
      businessSetupName: "Nombre del negocio",
      businessSetupLeadTypesBlock: "Tipos de consulta",
      businessSetupLeadTypes: "¿Qué tipo de consultas recibes?",
      businessSetupAddLeadType: "+ Añadir tipo",
      businessSetupLeadTypeName: "Nombre",
      businessSetupEstimatedValue: "Valor estimado (€)",
      businessSetupRemoveLeadType: "Eliminar",
      businessSetupSave: "Guardar configuración",
      businessSetupSaving: "Guardando...",
      businessSetupBackfill: "Recalcular conversaciones",
      businessSetupBackfilling: "Recalculando...",
      businessSetupBackfillSuccess: "Conversaciones actualizadas",
      businessSetupReseedDemo: "Recrear demo",
      businessSetupReseedingDemo: "Recreando demo...",
      businessSetupReseedDemoSuccess: "Demo recreada.",
      businessSetupReseedDemoConfirm:
        "Esto borrará los leads demo actuales de esta cuenta y volverá a crear la demo base. ¿Continuar?",
      businessSetupSuccess: "Configuración guardada.",
      businessSetupError: "No se pudo guardar la configuración.",
      pilotFeedbackTitle: "Reportar problema",
      pilotFeedbackHelp: "",
      pilotFeedbackCategory: "Tipo",
      pilotFeedbackMessage: "Cuéntanos qué ha pasado o qué mejorarías.",
      pilotFeedbackSubmit: "Enviar feedback",
      pilotFeedbackSubmitting: "Enviando...",
      pilotFeedbackSuccess: "Feedback enviado.",
      pilotFeedbackError: "No se pudo enviar el feedback.",
      pilotFeedbackBug: "Bug",
      pilotFeedbackGeneral: "Feedback",
      pilotFeedbackFeature: "Feature request",
      pilotFeedbackHistoryTitle: "Tus reportes",
      pilotFeedbackHistoryEmpty: "Todavía no has enviado reportes.",
      pilotFeedbackHistoryStatus: "Estado",
      pilotFeedbackHistoryPage: "Página",
      pilotFeedbackHistoryReply: "Respuesta de Novua",
      pilotFeedbackStatusNew: "Nuevo",
      pilotFeedbackStatusReviewed: "Revisado",
      pilotFeedbackStatusClosed: "Cerrado",
      accountTitle: "Tu acceso",
      accountHelp: "Información de la cuenta con la que estás trabajando ahora mismo.",
      accountRole: "Rol",
      accountWorkspace: "Workspace",
      accountEmail: "Email",
      accountPermissions: "Permisos",
      accountPermissionsAgent: "Puedes gestionar conversaciones, responder mensajes y reportar incidencias.",
      accountPermissionsAdmin: "Puedes configurar el workspace, gestionar equipo y operar conversaciones.",
      systemAiAssistance: "Asistencia IA",
      systemFollowUpAutomation: "Automatización de seguimiento",
      systemWhatsappWebhook: "Webhook de WhatsApp",
      noTeamMembers: "No hay miembros del equipo todavía.",
    };
  }

  if (lang === "pt") {
    return {
      channelsEmpty: "O WhatsApp é configurado com a Novua durante o onboarding.",
      channelUsage: "É usado para receber e responder a mensagens de entrada.",
      channelsNote: "Configurado pela Novua durante o onboarding.",
      requestSetup: "Solicitar setup",
      requestWhatsAppSetup: "Solicitar setup de WhatsApp",
      updateWhatsAppSetup: "Atualizar solicitação",
      setupRequested: "Setup solicitado",
      setupRequestedNote: "Estamos a preparar a configuração do WhatsApp.",
      setupPhoneRequired: "O número de WhatsApp é obrigatório.",
      setupNumberLabel: "Número de WhatsApp",
      setupNumberPlaceholder: "+351 912 345 678",
      setupMetaVerifiedLabel: "Tem Meta Business verificado?",
      setupMetaVerifiedYes: "Sim",
      setupMetaVerifiedNo: "Não",
      setupNotesLabel: "Nota",
      setupNotesPlaceholder: "Nome do contato, disponibilidade ou qualquer detalhe útil.",
      inviteTitle: "Adicione agentes ou admins ao mesmo workspace.",
      inviteEmail: "Email",
      inviteRole: "Função",
      inviteUser: "Convidar usuário",
      invitePending: "Enviando convite...",
      inviteSuccess: "Convite enviado.",
      inviteAdmin: "Admin",
      inviteAgent: "Agente",
      inviteError: "Não foi possível enviar o convite.",
      seatLimitError: "O limite de usuários deste plano foi atingido.",
      pendingInvites: "Convites pendentes",
      resendInvite: "Reenviar",
      cancelInvite: "Cancelar",
      resendPending: "Reenviando...",
      cancelPending: "Cancelando...",
      inviteResent: "Convite reenviado.",
      inviteCancelled: "Convite cancelado.",
      removeUser: "Remover acesso",
      removingUser: "Removendo...",
      removeUserSuccess: "Acesso removido.",
      removeUserError: "Não foi possível remover o acesso.",
      reassignPlaceholder: "Reatribuir para...",
      reassignAction: "Reatribuir",
      reassigningAction: "A reatribuir...",
      reassignSuccess: "Conversas abertas reatribuídas.",
      reassignError: "Não foi possível reatribuir as conversas.",
      businessSetupTitle: "Seu negócio",
      businessSetupHelp:
        "Isto ajuda a Novua a priorizar melhor as suas conversas e estimar o valor de cada cliente.",
      businessSetupName: "Nome do negócio",
      businessSetupLeadTypesBlock: "Tipos de consulta",
      businessSetupLeadTypes: "Que tipo de consultas recebes?",
      businessSetupAddLeadType: "+ Adicionar tipo",
      businessSetupLeadTypeName: "Nome",
      businessSetupEstimatedValue: "Valor estimado (€)",
      businessSetupRemoveLeadType: "Remover",
      businessSetupSave: "Guardar configuração",
      businessSetupSaving: "Guardando...",
      businessSetupBackfill: "Recalcular conversas",
      businessSetupBackfilling: "Recalculando...",
      businessSetupBackfillSuccess: "Conversas atualizadas",
      businessSetupReseedDemo: "Recriar demo",
      businessSetupReseedingDemo: "Recriando demo...",
      businessSetupReseedDemoSuccess: "Demo recriada.",
      businessSetupReseedDemoConfirm:
        "Isto irá apagar os leads demo atuais desta conta e recriar a demo base. Continuar?",
      businessSetupSuccess: "Configuração guardada.",
      businessSetupError: "Não foi possível guardar a configuração.",
      pilotFeedbackTitle: "Reportar problema",
      pilotFeedbackHelp: "",
      pilotFeedbackCategory: "Tipo",
      pilotFeedbackMessage: "Conta-nos o que aconteceu ou o que melhorarias.",
      pilotFeedbackSubmit: "Enviar feedback",
      pilotFeedbackSubmitting: "Enviando...",
      pilotFeedbackSuccess: "Feedback enviado.",
      pilotFeedbackError: "Não foi possível enviar o feedback.",
      pilotFeedbackBug: "Bug",
      pilotFeedbackGeneral: "Feedback",
      pilotFeedbackFeature: "Feature request",
      pilotFeedbackHistoryTitle: "Seus reportes",
      pilotFeedbackHistoryEmpty: "Ainda não enviaste reportes.",
      pilotFeedbackHistoryStatus: "Estado",
      pilotFeedbackHistoryPage: "Página",
      pilotFeedbackHistoryReply: "Resposta da Novua",
      pilotFeedbackStatusNew: "Novo",
      pilotFeedbackStatusReviewed: "Revisado",
      pilotFeedbackStatusClosed: "Fechado",
      accountTitle: "O seu acesso",
      accountHelp: "Informação da conta com a qual está a trabalhar neste momento.",
      accountRole: "Função",
      accountWorkspace: "Workspace",
      accountEmail: "Email",
      accountPermissions: "Permissões",
      accountPermissionsAgent: "Pode gerir conversas, responder mensagens e reportar incidências.",
      accountPermissionsAdmin: "Pode configurar o workspace, gerir equipa e operar conversas.",
      systemAiAssistance: "Assistência IA",
      systemFollowUpAutomation: "Automação de follow-up",
      systemWhatsappWebhook: "Webhook do WhatsApp",
      noTeamMembers: "Ainda não há membros na equipa.",
    };
  }

  return {
    channelsEmpty: "WhatsApp is configured with Novua during onboarding.",
    channelUsage: "Used to receive and respond to inbound messages.",
    channelsNote: "Configured by Novua during onboarding.",
    requestSetup: "Request setup",
    requestWhatsAppSetup: "Request WhatsApp setup",
    updateWhatsAppSetup: "Update request",
    setupRequested: "Setup requested",
    setupRequestedNote: "We are preparing the WhatsApp configuration.",
    setupPhoneRequired: "WhatsApp number is required.",
    setupNumberLabel: "WhatsApp number",
    setupNumberPlaceholder: "+34 600 111 222",
    setupMetaVerifiedLabel: "Do you have Meta Business verified?",
    setupMetaVerifiedYes: "Yes",
    setupMetaVerifiedNo: "No",
    setupNotesLabel: "Note",
    setupNotesPlaceholder: "Contact name, availability, or any useful detail.",
    inviteTitle: "Add agents or admins to the same workspace.",
    inviteEmail: "Email",
    inviteRole: "Role",
    inviteUser: "Invite user",
    invitePending: "Sending invite...",
    inviteSuccess: "Invitation sent.",
    inviteAdmin: "Admin",
    inviteAgent: "Agent",
    inviteError: "Could not send the invitation.",
    seatLimitError: "This plan has reached its user limit.",
    pendingInvites: "Pending invites",
    resendInvite: "Resend",
    cancelInvite: "Cancel",
    resendPending: "Resending...",
    cancelPending: "Cancelling...",
    inviteResent: "Invitation resent.",
    inviteCancelled: "Invitation cancelled.",
    removeUser: "Remove access",
    removingUser: "Removing...",
    removeUserSuccess: "Access removed.",
    removeUserError: "Could not remove access.",
    reassignPlaceholder: "Reassign to...",
    reassignAction: "Reassign",
    reassigningAction: "Reassigning...",
    reassignSuccess: "Open conversations reassigned.",
    reassignError: "Could not reassign conversations.",
    businessSetupTitle: "Your business",
    businessSetupHelp:
      "This helps Novua prioritize your conversations better and estimate the value of each customer.",
    businessSetupName: "Business name",
    businessSetupLeadTypesBlock: "Inquiry types",
    businessSetupLeadTypes: "What types of inquiries do you receive?",
    businessSetupAddLeadType: "+ Add type",
    businessSetupLeadTypeName: "Name",
    businessSetupEstimatedValue: "Estimated value (€)",
    businessSetupRemoveLeadType: "Remove",
    businessSetupSave: "Save configuration",
    businessSetupSaving: "Saving...",
    businessSetupBackfill: "Recalculate conversations",
    businessSetupBackfilling: "Recalculating...",
    businessSetupBackfillSuccess: "Conversations updated",
    businessSetupReseedDemo: "Recreate demo",
    businessSetupReseedingDemo: "Recreating demo...",
    businessSetupReseedDemoSuccess: "Demo recreated.",
    businessSetupReseedDemoConfirm:
      "This will delete the current demo leads for this account and recreate the base demo. Continue?",
    businessSetupSuccess: "Configuration saved.",
    businessSetupError: "Could not save the configuration.",
    pilotFeedbackTitle: "Report an issue",
    pilotFeedbackHelp: "",
    pilotFeedbackCategory: "Type",
    pilotFeedbackMessage: "Tell us what happened or what you would improve.",
    pilotFeedbackSubmit: "Send feedback",
    pilotFeedbackSubmitting: "Sending...",
    pilotFeedbackSuccess: "Feedback sent.",
    pilotFeedbackError: "Could not send feedback.",
    pilotFeedbackBug: "Bug",
    pilotFeedbackGeneral: "Feedback",
    pilotFeedbackFeature: "Feature request",
    pilotFeedbackHistoryTitle: "Your reports",
    pilotFeedbackHistoryEmpty: "You have not sent any reports yet.",
    pilotFeedbackHistoryStatus: "Status",
    pilotFeedbackHistoryPage: "Page",
    pilotFeedbackHistoryReply: "Reply from Novua",
    pilotFeedbackStatusNew: "New",
    pilotFeedbackStatusReviewed: "Reviewed",
    pilotFeedbackStatusClosed: "Closed",
    accountTitle: "Your access",
    accountHelp: "Information about the account you are currently using.",
    accountRole: "Role",
    accountWorkspace: "Workspace",
    accountEmail: "Email",
    accountPermissions: "Permissions",
    accountPermissionsAgent: "You can manage conversations, reply to messages, and report issues.",
    accountPermissionsAdmin: "You can configure the workspace, manage the team, and operate conversations.",
    systemAiAssistance: "AI assistance",
    systemFollowUpAutomation: "Follow-up automation",
    systemWhatsappWebhook: "WhatsApp webhook",
    noTeamMembers: "No team members yet.",
  };
}

function formatRoleLabel(lang: string, role: string) {
  if (lang === "pt") {
    if (role === "owner") return "Owner";
    if (role === "admin") return "Admin";
    return "Agente";
  }

  if (lang === "en") {
    if (role === "owner") return "Owner";
    if (role === "admin") return "Admin";
    return "Agent";
  }

  if (role === "owner") return "Owner";
  if (role === "admin") return "Admin";
  return "Agente";
}

export default async function SettingsPage() {
  const cookieStore = await cookies();
  const lang = normalizeLang(cookieStore.get(LANG_COOKIE)?.value);
  const t = (key: Parameters<typeof translate>[1]) => translate(lang, key);
  const copy = getSetupCopy(lang);

  const context = await getAppContext();
  if (context.kind !== "ready") {
    return (
      <section className="page">
        <AppNav />
        <header className="header">
          <div>
            <h1 className="title">{t("settings_title")}</h1>
            <p className="subtitle">Settings require a configured authenticated workspace.</p>
          </div>
        </header>
      </section>
    );
  }

  const { channels, team, pendingInvites, setupRequests, feedbackHistory } = await getSettingsData(
    context.supabase,
    context.profile.company_id,
    context.user.id,
  );
  const workspaceMode = getWorkspaceMode(context.company, context.user.email);
  const canSeeInternalSetup = canManageInternalWorkspace(workspaceMode);
  const showCustomerFeedback = canSeeCustomerFeedback(workspaceMode);
  const canManageTeam = context.profile.role === "owner" || context.profile.role === "admin";
  const seatLimit =
    context.company?.plan === "growth" ? 6 : context.company?.plan === "pro" ? 15 : 3;
  const usedSeats = team.length + pendingInvites.length;
  const seatsNote =
    lang === "es"
      ? `${usedSeats}/${seatLimit} usuarios usados en el plan ${context.company?.plan ?? "trial"}.`
      : lang === "pt"
        ? `${usedSeats}/${seatLimit} usuários usados no plano ${context.company?.plan ?? "trial"}.`
        : `${usedSeats}/${seatLimit} users used on the ${context.company?.plan ?? "trial"} plan.`;
  const hasWebhookSecrets = Boolean(process.env.WHATSAPP_VERIFY_TOKEN && process.env.WHATSAPP_APP_SECRET);
  const whatsappSetupRequest = setupRequests.find((request) => request.channel === "whatsapp" && (request.status === "requested" || request.status === "in_progress"));
  const businessSetup = getBusinessSetup(context.company);
  const roleLabel = formatRoleLabel(lang, context.profile.role);
  const workspaceLabel = context.company?.name ?? "Novua Inbox";
  const whatsappConnected = channels.length > 0;

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
          <h1 className="title">{t("settings_title")}</h1>
          <p className="subtitle">{t("settings_subtitle")}</p>
        </div>
      </header>

      <article className={`card settings-hero ${whatsappConnected ? "settings-hero-connected" : "settings-hero-disconnected"}`.trim()}>
        <div className="settings-hero-content">
          <div>
            <p className="settings-hero-title">
              {whatsappConnected ? "WhatsApp conectado" : "WhatsApp desconectado"}
            </p>
            <p className="settings-hero-copy">
              {whatsappConnected
                ? "Ya puedes recibir y responder conversaciones reales desde Novua."
                : "Ahora mismo no estás recibiendo conversaciones en Novua."}
            </p>
          </div>
          {canManageTeam ? (
            <div className="settings-hero-action">
              <a className="button" href="#whatsapp-setup">
                {whatsappConnected ? "Actualizar canal" : "Conectar ahora"}
              </a>
            </div>
          ) : null}
        </div>
      </article>

      <div className="grid cols-2" style={{ marginTop: 12 }}>
        <article className="card">
          <p className="label">{canManageTeam ? "Cómo Novua decide" : "Sistema"}</p>
          <div className="settings-capability-list">
            <div className="settings-capability-card">
              <strong>✓ {copy.systemAiAssistance}</strong>
              <span>Ayuda al equipo a responder más rápido y con contexto.</span>
            </div>
            <div className="settings-capability-card">
              <strong>✓ {t("settings_lead_score")}</strong>
              <span>Prioriza conversaciones según valor, intención y urgencia.</span>
            </div>
            <div className="settings-capability-card">
              <strong>✓ {copy.systemFollowUpAutomation}</strong>
              <span>Empuja conversaciones activas para no perder oportunidades.</span>
            </div>
            <div className="settings-capability-card">
              <strong>✓ {copy.systemWhatsappWebhook}</strong>
              <span>{hasWebhookSecrets ? "Canal listo para recibir mensajes." : "Pendiente de conexión técnica."}</span>
            </div>
          </div>
        </article>

        <article className="card">
          <p className="label">{canManageTeam ? "Quién responde a los clientes" : t("settings_users")}</p>
          {team.length === 0 ? (
            <p className="subtitle">{copy.noTeamMembers}</p>
          ) : (
            <TeamMembersList
              members={team}
              currentUserId={context.user.id}
              currentUserRole={context.profile.role}
              activeLabel={t("settings_active")}
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
              resendLabel={copy.resendInvite}
              cancelLabel={copy.cancelInvite}
              sendingLabel={copy.resendPending}
              cancellingLabel={copy.cancelPending}
              successResent={copy.inviteResent}
              successCancelled={copy.inviteCancelled}
            />
          ) : null}
        </article>
      </div>

      <div className="grid cols-2" style={{ marginTop: 12 }}>
        {canManageTeam ? (
          <BusinessSetupForm
            initialValue={businessSetup}
            showInternalTools={canSeeInternalSetup}
            labels={{
              title: copy.businessSetupTitle,
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
        ) : (
          <article className="card">
            <p className="label">{copy.accountTitle}</p>
            <p className="subtitle" style={{ marginBottom: 12 }}>{copy.accountHelp}</p>
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
              <p className="label" style={{ marginBottom: 6 }}>{copy.accountPermissions}</p>
              <p className="subtitle" style={{ margin: 0 }}>
                {context.profile.role === "agent" ? copy.accountPermissionsAgent : copy.accountPermissionsAdmin}
              </p>
            </div>
          </article>
        )}

        <article className="card" id="whatsapp-setup">
          <p className="label">Conecta WhatsApp</p>
          <p className="subtitle" style={{ marginBottom: 12 }}>
            Usa este canal para empezar a recibir y responder conversaciones reales desde Novua.
          </p>
          {channels.length > 0 ? (
            <div className="preview-row" style={{ marginBottom: 12 }}>
              <span>{formatChannel(channels[0].type)}</span>
              <span className={`badge ${channels[0].is_active ? "status-active" : "status-no-response"}`}>
                {channels[0].is_active ? t("settings_active") : t("settings_disconnected")}
              </span>
            </div>
          ) : null}
          {canManageTeam ? (
            <SetupRequestButton
              idleLabel={copy.requestWhatsAppSetup}
              updateLabel={copy.updateWhatsAppSetup}
              requestedLabel={copy.setupRequested}
              requestedNote={copy.setupRequestedNote}
              numberLabel={copy.setupNumberLabel}
              numberPlaceholder={copy.setupNumberPlaceholder}
              metaVerifiedLabel={copy.setupMetaVerifiedLabel}
              metaVerifiedYes={copy.setupMetaVerifiedYes}
              metaVerifiedNo={copy.setupMetaVerifiedNo}
              notesLabel={copy.setupNotesLabel}
              notesPlaceholder={copy.setupNotesPlaceholder}
              phoneRequiredError={copy.setupPhoneRequired}
              existingStatus={whatsappSetupRequest?.status ?? null}
              existingNotes={whatsappSetupRequest?.notes ?? null}
            />
          ) : (
            <div className="setup-state">
              <p className="note">{copy.channelUsage}</p>
              <p className="note">{copy.channelsNote}</p>
            </div>
          )}
        </article>
      </div>

      {showCustomerFeedback ? (
        <>
          <PilotFeedbackForm
            labels={{
              title: copy.pilotFeedbackTitle,
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
        </>
      ) : null}

      {canSeeInternalSetup ? (
        <>
          <article className="card" style={{ marginTop: 12 }}>
            <p className="label">Workspace mode</p>
            <p className="subtitle" style={{ marginBottom: 0 }}>
              {workspaceMode === "internal_demo"
                ? "Internal demo workspace. Internal tools are visible here."
                : workspaceMode === "customer_demo"
                  ? "Customer demo workspace. Customer-facing setup is visible without internal tools."
                  : "Customer workspace. Customer-facing setup and feedback are enabled."}
            </p>
          </article>
        </>
      ) : null}
    </section>
  );
}
