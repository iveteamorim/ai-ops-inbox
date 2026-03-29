import { AppNav } from "@/components/AppNav";
import { InviteUserForm } from "@/components/InviteUserForm";
import { PendingInvitesList } from "@/components/PendingInvitesList";
import { SetupRequestButton } from "@/components/SetupRequestButton";
import { TeamMembersList } from "@/components/TeamMembersList";
import { cookies } from "next/headers";
import { LANG_COOKIE, normalizeLang } from "@/lib/i18n/config";
import { translate } from "@/lib/i18n/dictionaries";
import { formatChannel, getAppContext, getSettingsData } from "@/lib/app-data";

function getSetupCopy(lang: string) {
  if (lang === "es") {
    return {
      channelsEmpty: "WhatsApp se configura con Novua durante el onboarding.",
      channelUsage: "Se usa para recibir y responder mensajes entrantes.",
      channelsNote: "Configurado por Novua durante onboarding.",
      requestSetup: "Solicitar setup",
      requestWhatsAppSetup: "Solicitar setup de WhatsApp",
      setupRequested: "Setup solicitado",
      setupRequestedNote: "Estamos preparando la configuración de WhatsApp.",
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
    };
  }

  if (lang === "pt") {
    return {
      channelsEmpty: "O WhatsApp é configurado com a Novua durante o onboarding.",
      channelUsage: "É usado para receber e responder a mensagens de entrada.",
      channelsNote: "Configurado pela Novua durante o onboarding.",
      requestSetup: "Solicitar setup",
      requestWhatsAppSetup: "Solicitar setup de WhatsApp",
      setupRequested: "Setup solicitado",
      setupRequestedNote: "Estamos a preparar a configuração do WhatsApp.",
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
    };
  }

  return {
    channelsEmpty: "WhatsApp is configured with Novua during onboarding.",
    channelUsage: "Used to receive and respond to inbound messages.",
    channelsNote: "Configured by Novua during onboarding.",
    requestSetup: "Request setup",
    requestWhatsAppSetup: "Request WhatsApp setup",
    setupRequested: "Setup requested",
    setupRequestedNote: "We are preparing the WhatsApp configuration.",
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

  const { channels, team, pendingInvites, setupRequests } = await getSettingsData(
    context.supabase,
    context.profile.company_id,
  );
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
  return (
    <section className="page">
      <AppNav />
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
                {whatsappSetupRequest ? (
                  <div className="request-state">
                    <span className={`badge ${whatsappSetupRequest.status === "in_progress" ? "status-new" : "status-active"}`}>
                      {whatsappSetupRequest.status === "in_progress" ? "Setup in progress" : copy.setupRequested}
                    </span>
                    <p className="note">{copy.setupRequestedNote}</p>
                  </div>
                ) : (
                  <SetupRequestButton
                    idleLabel={copy.requestWhatsAppSetup}
                    requestedLabel={copy.setupRequested}
                    requestedNote={copy.setupRequestedNote}
                  />
                )}
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
      </div>
    </section>
  );
}
