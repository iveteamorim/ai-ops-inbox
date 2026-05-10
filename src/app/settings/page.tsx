import { AppNav } from "@/components/AppNav";
import { BusinessSetupForm } from "@/components/BusinessSetupForm";
import { InviteUserForm } from "@/components/InviteUserForm";
import { PendingInvitesList } from "@/components/PendingInvitesList";
import { PilotFeedbackForm } from "@/components/PilotFeedbackForm";
import { PilotFeedbackHistory } from "@/components/PilotFeedbackHistory";
import { SetupRequestButton } from "@/components/SetupRequestButton";
import { TeamMembersList } from "@/components/TeamMembersList";
import { WhatsAppEmbeddedSignupCard } from "@/components/WhatsAppEmbeddedSignupCard";
import { WorkspaceDangerZone } from "@/components/WorkspaceDangerZone";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { LANG_COOKIE, resolveLang } from "@/lib/i18n/config";
import { translate } from "@/lib/i18n/dictionaries";
import { formatChannel, getAppContext, getBusinessSetup, getSettingsData } from "@/lib/app-data";
import { canManageInternalWorkspace, canSeeCustomerFeedback, getWorkspaceMode } from "@/lib/internal-access";
import { getWhatsAppEmbeddedSignupRuntimeConfig } from "@/lib/whatsapp-embedded-signup";

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
      setupInProgress: "Setup en curso",
      setupRequestedNote: "Estamos preparando contigo la conexión real de WhatsApp.",
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
      inviteOwner: "Propietario",
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
      businessSetupTitle: "Cómo se calcula el valor",
      businessSetupHelp:
        "Define cuánto vale cada tipo de conversación. Esto determina qué aparece primero en el inbox.",
      businessSetupName: "Nombre del negocio",
      businessSetupLeadTypesBlock: "Tipos de consulta y valor estimado (€)",
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
      pilotFeedbackBug: "Error",
      pilotFeedbackGeneral: "Comentarios",
      pilotFeedbackFeature: "Solicitud de mejora",
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
      settingsUnavailable: "Configuración requiere un workspace autenticado y configurado.",
      workspaceModeTitle: "Modo del workspace",
      workspaceModeInternal: "Workspace interno de demo. Aquí se muestran herramientas internas.",
      workspaceModeCustomerDemo:
        "Workspace demo de cliente. Aquí se muestra setup orientado a cliente sin herramientas internas.",
      workspaceModeCustomer: "Workspace cliente. Aquí están activos setup y feedback orientados a cliente.",
      requestError: "No se pudo solicitar el setup ahora mismo.",
      embeddedConnectTitle: "Conectar con Meta",
      embeddedConnectHelp:
        "Haz login con Meta y autoriza tu número una sola vez. Novua guardará la conexión del canal cuando el flujo termine.",
      embeddedConnectAction: "Conectar con Meta",
      embeddedReconnectAction: "Reconectar WhatsApp",
      embeddedSdkLoading: "Cargando conexión...",
      embeddedSdkPreparing: "Preparando Meta...",
      embeddedConnectSuccess: "WhatsApp conectado desde Meta.",
      embeddedConnectError: "No se pudo abrir la conexión con Meta.",
      embeddedSaveError: "Meta terminó el flujo, pero Novua no pudo guardar la conexión.",
      embeddedFallbackTitle: "Si Meta no te deja terminar",
      embeddedFallbackHelp: "Usa la solicitud manual de abajo y Novua te ayuda a cerrar la conexión.",
      dangerTitle: "Zona peligrosa",
      dangerHelp: "Elimina el workspace, el canal configurado y todos los datos asociados.",
      dangerWarning:
        "Esta acción es irreversible. Se eliminarán contactos, conversaciones, mensajes y accesos del equipo.",
      dangerConfirmationLabel: "Escribe el nombre del workspace para confirmar",
      dangerDeleteLabel: "Eliminar workspace y datos",
      dangerDeletingLabel: "Eliminando...",
      dangerDeletedLabel: "Eliminando workspace. Redirigiendo...",
      dangerError: "No se pudo eliminar el workspace.",
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
      setupInProgress: "Setup em curso",
      setupRequestedNote: "Estamos preparando com você a conexão real do WhatsApp.",
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
      inviteOwner: "Proprietário",
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
      businessSetupTitle: "Como calculamos o valor",
      businessSetupHelp:
        "Defina quanto vale cada tipo de conversa. Isso determina o que aparece primeiro no inbox.",
      businessSetupName: "Nome do negócio",
      businessSetupLeadTypesBlock: "Tipos de consulta e valor estimado (€)",
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
      pilotFeedbackFeature: "Pedido de melhoria",
      pilotFeedbackHistoryTitle: "Seus reportes",
      pilotFeedbackHistoryEmpty: "Ainda não enviaste reportes.",
      pilotFeedbackHistoryStatus: "Estado",
      pilotFeedbackHistoryPage: "Página",
      pilotFeedbackHistoryReply: "Resposta da Novua",
      pilotFeedbackStatusNew: "Novo",
      pilotFeedbackStatusReviewed: "Revisado",
      pilotFeedbackStatusClosed: "Fechado",
      accountTitle: "Seu acesso",
      accountHelp: "Informação da conta com a qual você está trabalhando agora.",
      accountRole: "Função",
      accountWorkspace: "Workspace",
      accountEmail: "Email",
      accountPermissions: "Permissões",
      accountPermissionsAgent: "Pode gerir conversas, responder mensagens e reportar incidentes.",
      accountPermissionsAdmin: "Pode configurar o workspace, gerir equipa e operar conversas.",
      systemAiAssistance: "Assistência IA",
      systemFollowUpAutomation: "Automatização de seguimento",
      systemWhatsappWebhook: "Webhook do WhatsApp",
      noTeamMembers: "Ainda não há membros na equipa.",
      settingsUnavailable: "Configurações requerem um workspace autenticado e configurado.",
      workspaceModeTitle: "Modo do workspace",
      workspaceModeInternal: "Workspace interno de demo. Ferramentas internas visíveis.",
      workspaceModeCustomerDemo:
        "Workspace demo de cliente. Setup orientado a cliente sem ferramentas internas.",
      workspaceModeCustomer: "Workspace cliente. Setup e feedback orientados a cliente.",
      requestError: "Não foi possível solicitar o setup.",
      embeddedConnectTitle: "Conectar com Meta",
      embeddedConnectHelp:
        "Faça login com a Meta e autorize o seu número uma única vez. A Novua guardará a conexão do canal ao terminar o fluxo.",
      embeddedConnectAction: "Conectar com Meta",
      embeddedReconnectAction: "Reconectar WhatsApp",
      embeddedSdkLoading: "Carregando conexão...",
      embeddedSdkPreparing: "Preparando Meta...",
      embeddedConnectSuccess: "WhatsApp conectado pela Meta.",
      embeddedConnectError: "Não foi possível abrir a conexão com a Meta.",
      embeddedSaveError: "A Meta terminou o fluxo, mas a Novua não conseguiu guardar a conexão.",
      embeddedFallbackTitle: "Se a Meta não deixar terminar",
      embeddedFallbackHelp: "Use a solicitação manual abaixo e a Novua ajuda a fechar a conexão.",
      dangerTitle: "Zona perigosa",
      dangerHelp: "Remove o workspace, canal configurado e todos os dados associados.",
      dangerWarning:
        "Esta ação é irreversível. Serão removidos contatos, conversas, mensagens e acessos.",
      dangerConfirmationLabel: "Digite o nome do workspace para confirmar",
      dangerDeleteLabel: "Excluir workspace e dados",
      dangerDeletingLabel: "Excluindo...",
      dangerDeletedLabel: "Excluindo workspace. Redirecionando...",
      dangerError: "Não foi possível excluir o workspace.",
    };
  }

  return {
    channelsEmpty: "WhatsApp is configured with Novua during onboarding.",
    channelUsage: "It is used to receive and reply to inbound messages.",
    channelsNote: "Configured by Novua during onboarding.",
    requestSetup: "Request setup",
    requestWhatsAppSetup: "Request WhatsApp setup",
    updateWhatsAppSetup: "Update request",
    setupRequested: "Setup requested",
    setupInProgress: "Setup in progress",
    setupRequestedNote: "We are preparing the real WhatsApp connection with you.",
    setupPhoneRequired: "WhatsApp phone is required.",
    setupNumberLabel: "WhatsApp number",
    setupNumberPlaceholder: "+1 415 555 0101",
    setupMetaVerifiedLabel: "Is Meta Business verified?",
    setupMetaVerifiedYes: "Yes",
    setupMetaVerifiedNo: "No",
    setupNotesLabel: "Note",
    setupNotesPlaceholder: "Contact name, availability or any useful detail.",
    inviteTitle: "Add agents or admins to this workspace.",
    inviteEmail: "Email",
    inviteRole: "Role",
    inviteUser: "Invite user",
    invitePending: "Sending invite...",
    inviteSuccess: "Invite sent.",
    inviteAdmin: "Admin",
    inviteAgent: "Agent",
    inviteOwner: "Owner",
    inviteError: "Could not send invite.",
    seatLimitError: "Seat limit reached for this plan.",
    pendingInvites: "Pending invites",
    resendInvite: "Resend",
    cancelInvite: "Cancel",
    resendPending: "Resending...",
    cancelPending: "Cancelling...",
    inviteResent: "Invite resent.",
    inviteCancelled: "Invite cancelled.",
    removeUser: "Remove access",
    removingUser: "Removing...",
    removeUserSuccess: "Access removed.",
    removeUserError: "Could not remove access.",
    reassignPlaceholder: "Reassign to...",
    reassignAction: "Reassign",
    reassigningAction: "Reassigning...",
    reassignSuccess: "Open conversations reassigned.",
    reassignError: "Conversations could not be reassigned.",
    businessSetupTitle: "How value is calculated",
    businessSetupHelp:
      "Define how much each type of conversation is worth. This determines what appears first in the inbox.",
    businessSetupName: "Business name",
    businessSetupLeadTypesBlock: "Lead types and estimated value (€)",
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
    businessSetupReseedDemo: "Reseed demo",
    businessSetupReseedingDemo: "Reseeding demo...",
    businessSetupReseedDemoSuccess: "Demo recreated.",
    businessSetupReseedDemoConfirm:
      "This will delete the current demo leads for this account and recreate the base demo. Continue?",
    businessSetupSuccess: "Configuration saved.",
    businessSetupError: "Could not save configuration.",
    pilotFeedbackTitle: "Report issue",
    pilotFeedbackHelp: "",
    pilotFeedbackCategory: "Category",
    pilotFeedbackMessage: "Tell us what happened or what should improve.",
    pilotFeedbackSubmit: "Send feedback",
    pilotFeedbackSubmitting: "Sending...",
    pilotFeedbackSuccess: "Feedback sent.",
    pilotFeedbackError: "Could not send feedback.",
    pilotFeedbackBug: "Bug",
    pilotFeedbackGeneral: "Feedback",
    pilotFeedbackFeature: "Feature request",
    pilotFeedbackHistoryTitle: "Your reports",
    pilotFeedbackHistoryEmpty: "You have not sent reports yet.",
    pilotFeedbackHistoryStatus: "Status",
    pilotFeedbackHistoryPage: "Page",
    pilotFeedbackHistoryReply: "Novua reply",
    pilotFeedbackStatusNew: "New",
    pilotFeedbackStatusReviewed: "Reviewed",
    pilotFeedbackStatusClosed: "Closed",
    accountTitle: "Your access",
    accountHelp: "Account information for the user you're logged in with.",
    accountRole: "Role",
    accountWorkspace: "Workspace",
    accountEmail: "Email",
    accountPermissions: "Permissions",
    accountPermissionsAgent: "You can manage conversations, reply to messages, and report issues.",
    accountPermissionsAdmin: "You can configure the workspace, manage the team, and operate conversations.",
    systemAiAssistance: "AI assistance",
    systemFollowUpAutomation: "Automated follow-up",
    systemWhatsappWebhook: "WhatsApp webhook",
    noTeamMembers: "No team members yet.",
    settingsUnavailable: "Settings requires an authenticated, configured workspace.",
    workspaceModeTitle: "Workspace mode",
    workspaceModeInternal: "Internal demo workspace. Internal tools visible.",
    workspaceModeCustomerDemo: "Customer demo workspace. Setup visible, internal tools hidden.",
    workspaceModeCustomer: "Customer workspace. Setup and feedback available.",
    requestError: "Could not request setup.",
    embeddedConnectTitle: "Connect with Meta",
    embeddedConnectHelp:
      "Log in with Meta and authorize your number once. Novua will save the channel connection when the flow finishes.",
    embeddedConnectAction: "Connect with Meta",
    embeddedReconnectAction: "Reconnect WhatsApp",
    embeddedSdkLoading: "Loading connection...",
    embeddedSdkPreparing: "Preparing Meta...",
    embeddedConnectSuccess: "WhatsApp connected through Meta.",
    embeddedConnectError: "Could not open the Meta connection flow.",
    embeddedSaveError: "Meta finished the flow, but Novua could not save the connection.",
    embeddedFallbackTitle: "If Meta does not let you finish",
    embeddedFallbackHelp: "Use the manual request below and Novua will help you complete the connection.",
    dangerTitle: "Danger zone",
    dangerHelp: "Delete the workspace, configured channel, and all associated data.",
    dangerWarning: "This action is irreversible. Contacts, conversations, messages, and team access will be deleted.",
    dangerConfirmationLabel: "Type the workspace name to confirm",
    dangerDeleteLabel: "Delete workspace and data",
    dangerDeletingLabel: "Deleting...",
    dangerDeletedLabel: "Deleting workspace. Redirecting...",
    dangerError: "Could not delete the workspace.",
  };
}

function formatRoleLabel(lang: string, role: string) {
  if (lang === "pt") {
    if (role === "owner") return "Proprietário";
    if (role === "admin") return "Admin";
    return "Agente";
  }

  if (lang === "en") {
    if (role === "owner") return "Owner";
    if (role === "admin") return "Admin";
    return "Agent";
  }

  if (role === "owner") return "Propietario";
  if (role === "admin") return "Admin";
  return "Agente";
}

export default async function SettingsPage() {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const lang = resolveLang(cookieStore.get(LANG_COOKIE)?.value, headerStore.get("accept-language"));
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
            <p className="subtitle">{copy.settingsUnavailable}</p>
          </div>
        </header>
      </section>
    );
  }

  let channels = [] as Awaited<ReturnType<typeof getSettingsData>>["channels"];
  let team = [] as Awaited<ReturnType<typeof getSettingsData>>["team"];
  let pendingInvites = [] as Awaited<ReturnType<typeof getSettingsData>>["pendingInvites"];
  let setupRequests = [] as Awaited<ReturnType<typeof getSettingsData>>["setupRequests"];
  let feedbackHistory = [] as Awaited<ReturnType<typeof getSettingsData>>["feedbackHistory"];
  let settingsLoadError: string | null = null;

  try {
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
  const workspaceMode = getWorkspaceMode(context.company, context.user.email);
  if (workspaceMode === "customer_demo") {
    redirect("/dashboard");
  }

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
  const embeddedSignupConfig = getWhatsAppEmbeddedSignupRuntimeConfig();
  const whatsappSetupRequest = setupRequests.find((request) => request.channel === "whatsapp" && (request.status === "requested" || request.status === "in_progress"));
  const businessSetup = getBusinessSetup(context.company);
  const roleLabel = formatRoleLabel(lang, context.profile.role);
  const workspaceLabel = context.company?.name ?? "Novua Inbox";
  const whatsappChannel = channels.find((channel) => channel.type === "whatsapp") ?? null;
  const whatsappConnected = Boolean(whatsappChannel?.is_active);
  const settingsText =
    lang === "pt"
      ? {
          heroConnected: "WhatsApp conectado",
          heroDisconnected: "WhatsApp desconectado",
          heroConnectedCopy: "Já podes receber e responder conversas reais desde a Novua.",
          heroDisconnectedCopy: "Neste momento não estás a receber conversas na Novua.",
          heroConnectedAction: "Atualizar canal",
          heroDisconnectedAction: "Conectar agora",
          systemTitleManage: "Como a Novua decide",
          systemTitleAgent: "Sistema",
          capabilities: [
            { title: copy.systemAiAssistance, description: "Ajuda a equipa a responder mais rápido e com contexto." },
            { title: t("settings_lead_score"), description: "Prioriza conversas segundo valor, intenção e urgência." },
            { title: copy.systemFollowUpAutomation, description: "Empurra conversas ativas para não perder oportunidades." },
            { title: copy.systemWhatsappWebhook, description: hasWebhookSecrets ? "Canal pronto para receber mensagens." : "Ligação técnica pendente." },
          ],
          teamTitle: canManageTeam ? "Equipe que responde" : t("settings_users"),
          channelTitle: "Conecta WhatsApp",
          channelHelp: embeddedSignupConfig.enabled
            ? "Conecta o teu número com a Meta dentro da Novua. Se algo falhar, mantém a solicitação manual como plano B."
            : "Usa este canal para solicitar ou atualizar a conexão real do WhatsApp durante o onboarding guiado.",
          unnamedUser: "Utilizador sem nome",
          detail: "Ver detalhe",
          open: "Abertas",
          noReply: "Sem resposta",
          won: "Ganhas",
          lost: "Perdidas",
        }
      : lang === "en"
        ? {
            heroConnected: "WhatsApp connected",
            heroDisconnected: "WhatsApp disconnected",
            heroConnectedCopy: "You can now receive and reply to real conversations in Novua.",
            heroDisconnectedCopy: "You are not receiving conversations in Novua right now.",
            heroConnectedAction: "Update channel",
            heroDisconnectedAction: "Connect now",
            systemTitleManage: "How Novua decides",
            systemTitleAgent: "System",
            capabilities: [
              { title: copy.systemAiAssistance, description: "Helps the team reply faster and with context." },
              { title: t("settings_lead_score"), description: "Prioritizes conversations by value, intent, and urgency." },
              { title: copy.systemFollowUpAutomation, description: "Pushes active conversations so opportunities are not lost." },
              { title: copy.systemWhatsappWebhook, description: hasWebhookSecrets ? "Channel ready to receive messages." : "Technical connection still pending." },
            ],
            teamTitle: canManageTeam ? "Response team" : t("settings_users"),
            channelTitle: "Connect WhatsApp",
            channelHelp: embeddedSignupConfig.enabled
              ? "Connect your number with Meta inside Novua. If anything fails, keep the manual request as backup."
              : "Use this area to request or update the real WhatsApp connection during guided onboarding.",
            unnamedUser: "Usuario sin nombre",
            detail: "View details",
            open: "Open",
            noReply: "No reply",
            won: "Won",
            lost: "Lost",
          }
        : {
            heroConnected: "WhatsApp conectado",
            heroDisconnected: "WhatsApp desconectado",
            heroConnectedCopy: "Ya puedes recibir y responder conversaciones reales desde Novua.",
            heroDisconnectedCopy: "Ahora mismo no estás recibiendo conversaciones en Novua.",
            heroConnectedAction: "Actualizar canal",
            heroDisconnectedAction: "Conectar ahora",
            systemTitleManage: "Cómo Novua decide",
            systemTitleAgent: "Sistema",
            capabilities: [
              { title: copy.systemAiAssistance, description: "Ayuda al equipo a responder más rápido y con contexto." },
              { title: t("settings_lead_score"), description: "Prioriza conversaciones según valor, intención y urgencia." },
              { title: copy.systemFollowUpAutomation, description: "Empuja conversaciones activas para no perder oportunidades." },
              { title: copy.systemWhatsappWebhook, description: hasWebhookSecrets ? "Canal listo para recibir mensajes." : "Pendiente de conexión técnica." },
            ],
            teamTitle: canManageTeam ? "Equipo que responde" : t("settings_users"),
            channelTitle: "Conecta WhatsApp",
            channelHelp: embeddedSignupConfig.enabled
              ? "Conecta tu número con Meta dentro de Novua. Si algo falla, mantén la solicitud manual como respaldo."
              : "Usa este canal para solicitar o actualizar la conexión real de WhatsApp durante onboarding guiado.",
            unnamedUser: "Usuario sin nombre",
            detail: "Ver detalle",
            open: "Abiertas",
            noReply: "Sin respuesta",
            won: "Ganadas",
            lost: "Perdidas",
          };

  return (
    <section className="page">
      <div className="min-h-screen bg-gradient-to-br from-black via-[#061a14] to-[#0b2a20] text-white p-8 settings-modern">
        <AppNav
          showSetup={canSeeInternalSetup}
          showLocale={canSeeInternalSetup}
          userName={context.profile.full_name ?? context.user.email ?? null}
          userRole={context.profile.role}
        />
        <div className="max-w-6xl mx-auto space-y-10">
          <div>
            <p className="text-green-400 text-sm mb-2">
              {lang === "en" ? "NÓVUA · SETTINGS" : lang === "pt" ? "NÓVUA · CONFIGURAÇÕES" : "NÓVUA · CONFIGURACIÓN"}
            </p>
            <h1 className="text-3xl md:text-4xl font-semibold">{t("settings_title")}</h1>
            <p className="text-gray-300 mt-2 max-w-xl">{t("settings_subtitle")}</p>
          </div>

          <article className={`card settings-hero ${whatsappConnected ? "settings-hero-connected" : "settings-hero-disconnected"}`.trim()}>
            <div className="settings-hero-content">
              <div>
                <p className="settings-hero-title">
                  {whatsappConnected ? settingsText.heroConnected : settingsText.heroDisconnected}
                </p>
                <p className="settings-hero-copy">
                  {whatsappConnected
                    ? settingsText.heroConnectedCopy
                    : settingsText.heroDisconnectedCopy}
                </p>
              </div>
              {canManageTeam ? (
                <div className="settings-hero-action">
                  <a className="button" href="#whatsapp-setup">
                    {whatsappConnected ? settingsText.heroConnectedAction : settingsText.heroDisconnectedAction}
                  </a>
                </div>
              ) : null}
            </div>
          </article>

          {settingsLoadError ? (
            <article className="card">
              <p className="label">
                {lang === "en" ? "Settings loaded with limits" : lang === "pt" ? "Configurações carregadas com limitações" : "Configuración cargada con limitaciones"}
              </p>
              <p className="subtitle" style={{ marginBottom: 0 }}>
                {lang === "en"
                  ? "Some workspace data could not be loaded yet. Core actions remain available."
                  : lang === "pt"
                    ? "Alguns dados do workspace ainda não puderam ser carregados. As ações principais continuam disponíveis."
                    : "Algunos datos del workspace todavía no se han podido cargar. Las acciones principales siguen disponibles."}
              </p>
            </article>
          ) : null}

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

            <article className="card">
              <p className="label">{settingsText.teamTitle}</p>
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
                  unnamedLabel={settingsText.unnamedUser}
                  detailLabel={settingsText.detail}
                  openLabel={settingsText.open}
                  noReplyLabel={settingsText.noReply}
                  wonLabel={settingsText.won}
                  lostLabel={settingsText.lost}
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
          </div>

          <article className="card" id="whatsapp-setup">
            <p className="label">{settingsText.channelTitle}</p>
            <p className="subtitle" style={{ marginBottom: 12 }}>
              {settingsText.channelHelp}
            </p>
            {whatsappChannel ? (
              <div className="preview-row" style={{ marginBottom: 12 }}>
                <span>{formatChannel(whatsappChannel.type, t)}</span>
                <span className={`badge ${whatsappChannel.is_active ? "status-active" : "status-no-response"}`}>
                  {whatsappChannel.is_active ? t("settings_active") : t("settings_disconnected")}
                </span>
              </div>
            ) : null}
            {canManageTeam ? (
              <>
                {embeddedSignupConfig.enabled ? (
                  <WhatsAppEmbeddedSignupCard
                    appId={embeddedSignupConfig.appId}
                    configId={embeddedSignupConfig.configId}
                    apiVersion={embeddedSignupConfig.apiVersion}
                    isConnected={whatsappConnected}
                    connectLabel={copy.embeddedConnectAction}
                    reconnectLabel={copy.embeddedReconnectAction}
                    readyLabel={copy.embeddedSdkPreparing}
                    loadingLabel={copy.embeddedSdkLoading}
                    launchErrorLabel={copy.embeddedConnectError}
                    saveErrorLabel={copy.embeddedSaveError}
                    connectedLabel={copy.embeddedConnectSuccess}
                    helperLabel={copy.embeddedConnectHelp}
                    fallbackLabel={copy.embeddedFallbackTitle}
                    fallbackHelp={copy.embeddedFallbackHelp}
                  />
                ) : null}
                <div style={{ marginTop: embeddedSignupConfig.enabled ? 18 : 0 }}>
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
                    requestErrorLabel={copy.requestError}
                    inProgressLabel={copy.setupInProgress}
                    existingStatus={whatsappSetupRequest?.status ?? null}
                    existingNotes={whatsappSetupRequest?.notes ?? null}
                  />
                </div>
              </>
            ) : (
              <div className="setup-state">
                <p className="note">{copy.channelUsage}</p>
                <p className="note">{copy.channelsNote}</p>
              </div>
            )}
          </article>

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
          ) : (
            <article className="card">
              <p className="label">
                {lang === "en" ? "System feedback" : lang === "pt" ? "Feedback do sistema" : "Feedback del sistema"}
              </p>
              <p className="subtitle">
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
              <button className="button" type="button" disabled>
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

          {canSeeInternalSetup ? (
            <article className="card" style={{ marginTop: 12 }}>
              <p className="label">{copy.workspaceModeTitle}</p>
              <p className="subtitle" style={{ marginBottom: 0 }}>
                {workspaceMode === "internal_demo"
                  ? copy.workspaceModeInternal
                  : workspaceMode === "customer_demo"
                    ? copy.workspaceModeCustomerDemo
                    : copy.workspaceModeCustomer}
              </p>
            </article>
          ) : null}
        </div>
      </div>
    </section>
  );
}
