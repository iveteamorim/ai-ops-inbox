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
import { isNovuaInternalUser } from "@/lib/internal-access";

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
  };
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
  const canSeeInternalSetup = isNovuaInternalUser(context.user.email);
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
  return (
    <section className="page">
      <AppNav showSetup={canSeeInternalSetup} />
      <header className="header">
        <div>
          <h1 className="title">{t("settings_title")}</h1>
          <p className="subtitle">{t("settings_subtitle")}</p>
        </div>
      </header>

      <div className="grid cols-2">
        <article className="card">
          <p className="label">WhatsApp</p>
          {channels.length === 0 ? (
            <div className="setup-state">
              <div className="preview-row">
                <span>WhatsApp</span>
                <span className="badge status-no-response">{t("settings_disconnected")}</span>
              </div>
              <p className="note">{copy.channelUsage}</p>
              <p className="note">{copy.channelsNote}</p>
              <div className="actions" style={{ marginTop: 12 }}>
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
              </div>
            </div>
          ) : (
            channels.map((channel) => (
              <div key={channel.id} className="preview-row">
                <span>{formatChannel(channel.type)}</span>
                <span className={`badge ${channel.is_active ? "status-active" : "status-no-response"}`}>
                  {channel.is_active ? t("settings_active") : t("settings_disconnected")}
                </span>
              </div>
            ))
          )}
        </article>

        <article className="card">
          <p className="label">{t("settings_ai_revenue")}</p>
          <div className="preview-row">
            <span>AI Assistance</span>
            <span className="badge status-active">{t("settings_active")}</span>
          </div>
          <div className="preview-row">
            <span>{t("settings_lead_score")}</span>
            <span className="badge status-active">{t("settings_active")}</span>
          </div>
          <div className="preview-row">
            <span>Follow-up automation</span>
            <span className="badge status-active">{t("settings_active")}</span>
          </div>
          <div className="preview-row">
            <span>WhatsApp webhook</span>
            <span className={`badge ${hasWebhookSecrets ? "status-active" : "status-no-response"}`}>
              {hasWebhookSecrets ? t("settings_active") : t("settings_disconnected")}
            </span>
          </div>
        </article>
      </div>

      <div className="grid cols-2" style={{ marginTop: 12 }}>
        <article className="card">
          <p className="label">{t("settings_users")}</p>
          {team.length === 0 ? (
            <p className="subtitle">No team members found.</p>
          ) : (
            <TeamMembersList
              members={team}
              currentUserId={context.user.id}
              currentUserRole={context.profile.role}
              activeLabel={t("settings_active")}
              removeLabel={copy.removeUser}
              removingLabel={copy.removingUser}
              removeSuccess={copy.removeUserSuccess}
              removeError={copy.removeUserError}
            />
          )}
          <div style={{ marginTop: 12 }}>
            <InviteUserForm
              title={copy.inviteTitle}
              seatsNote={seatsNote}
              emailLabel={copy.inviteEmail}
              roleLabel={copy.inviteRole}
              submitLabel={copy.inviteUser}
              pendingLabel={copy.invitePending}
              successLabel={copy.inviteSuccess}
              adminLabel={copy.inviteAdmin}
              agentLabel={copy.inviteAgent}
              errorGeneric={copy.inviteError}
              seatLimitError={copy.seatLimitError}
            />
          </div>
          {pendingInvites.length > 0 ? (
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

        <BusinessSetupForm
          initialValue={businessSetup}
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
      </div>

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
    </section>
  );
}
