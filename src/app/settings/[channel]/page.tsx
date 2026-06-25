import { AppNav } from "@/components/AppNav";
import { EmailChannelSetup } from "@/components/settings/EmailChannelSetup";
import { FormChannelSetup } from "@/components/settings/FormChannelSetup";
import { InstagramSettingsPanel } from "@/components/settings/InstagramSettingsPanel";
import { SettingsBackLink } from "@/components/settings/SettingsBackLink";
import { WhatsappSettingsPanel } from "@/components/settings/WhatsappSettingsPanel";
import { getPublicAppUrl } from "@/lib/app-url";
import { formatChannel } from "@/lib/app-data";
import { buildFormEmbedSnippet, buildFormPublicUrl } from "@/lib/messaging/form";
import { parseEmailReplyConfigState } from "@/lib/messaging/email-reply-state";
import { parseGoogleFormsBackupConfig } from "@/lib/messaging/google-forms-backup";
import { isChannelSettingsPath, type ChannelType } from "@/lib/messaging/channel-types";
import { loadSettingsPageBase } from "@/lib/settings/load-settings-page-base";
import {
  getChannelSetupCopy,
  getChannelsOverviewCopy,
  getEmailChannelSetupCopy,
  getFormChannelSetupCopy,
} from "@/lib/settings/channel-settings-copy";
import { getWhatsAppEmbeddedSignupRuntimeConfig } from "@/lib/whatsapp-embedded-signup";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ channel: string }>;
};

function getBackLabel(lang: string) {
  if (lang === "pt") return "Voltar aos canais";
  if (lang === "en") return "Back to channels";
  return "Volver a canales";
}

export default async function SettingsChannelPage({ params }: Props) {
  const { channel: channelParam } = await params;
  if (!isChannelSettingsPath(channelParam)) {
    notFound();
  }

  const channel = channelParam as ChannelType;
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

  const { lang, t, copy, context, canSeeInternalSetup, canManageTeam, channels, setupRequests, headerStore } =
    base;
  const channelsOverviewCopy = getChannelsOverviewCopy(lang);
  const channelSetupCopy = getChannelSetupCopy(lang);
  const embeddedSignupConfig = getWhatsAppEmbeddedSignupRuntimeConfig();

  const whatsappChannel = channels.find((item) => item.type === "whatsapp") ?? null;
  const instagramChannel = channels.find((item) => item.type === "instagram") ?? null;
  const emailChannel = channels.find((item) => item.type === "email") ?? null;
  const formChannel = channels.find((item) => item.type === "form") ?? null;

  const whatsappSetupRequest = setupRequests.find(
    (request) =>
      request.channel === "whatsapp" && (request.status === "requested" || request.status === "in_progress"),
  );
  const instagramSetupRequest = setupRequests.find(
    (request) =>
      request.channel === "instagram" && (request.status === "requested" || request.status === "in_progress"),
  );

  const whatsappChannelConfig =
    whatsappChannel?.config && typeof whatsappChannel.config === "object" ? whatsappChannel.config : null;
  const whatsappDisplayNumber =
    typeof whatsappChannelConfig?.display_phone_number === "string" &&
    whatsappChannelConfig.display_phone_number.trim()
      ? whatsappChannelConfig.display_phone_number.trim()
      : null;

  const instagramChannelConfig =
    instagramChannel?.config && typeof instagramChannel.config === "object" ? instagramChannel.config : null;
  const instagramDisplayHandle =
    typeof instagramChannelConfig?.instagram_handle === "string" && instagramChannelConfig.instagram_handle.trim()
      ? instagramChannelConfig.instagram_handle.trim()
      : typeof instagramChannelConfig?.username === "string" && instagramChannelConfig.username.trim()
        ? instagramChannelConfig.username.trim()
        : null;

  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const protocol = headerStore.get("x-forwarded-proto") ?? "https";
  const appUrl = host ? `${protocol}://${host}` : getPublicAppUrl();
  const formToken =
    formChannel?.is_active && formChannel.external_account_id ? formChannel.external_account_id : null;
  const formEndpoint = `${appUrl}/api/leads/form`;
  const formWebsiteLink = formToken ? buildFormPublicUrl(appUrl, formToken) : null;
  const formEmbed = formToken ? buildFormEmbedSnippet(appUrl, formToken) : null;
  const formReply = parseEmailReplyConfigState(formChannel?.config ?? null);
  const emailReply = parseEmailReplyConfigState(emailChannel?.config ?? null);
  const googleFormsBackup = parseGoogleFormsBackupConfig(formChannel?.config ?? null);

  const emailChannelSetupCopy = getEmailChannelSetupCopy(lang, channelSetupCopy.email);
  const formChannelSetupCopy = getFormChannelSetupCopy(lang, channelSetupCopy.form, channelsOverviewCopy);

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
              <SettingsBackLink label={getBackLabel(lang)} />
              <p className="settings-kicker" style={{ marginTop: 12 }}>
                {lang === "en" ? "NÓVUA · CHANNEL" : lang === "pt" ? "NÓVUA · CANAL" : "NÓVUA · CANAL"}
              </p>
              <h1>{formatChannel(channel, t)}</h1>
              <p>{channelSetupCopy[channel].description}</p>
            </div>
          </header>

          {channel === "whatsapp" ? (
            <WhatsappSettingsPanel
              label={formatChannel("whatsapp", t)}
              connected={Boolean(whatsappChannel?.is_active)}
              connectedLabel={t("settings_active")}
              disconnectedLabel={t("settings_disconnected")}
              displayNumber={whatsappDisplayNumber}
              canManage={canManageTeam}
              embeddedSignupConfig={embeddedSignupConfig}
              setupRequestStatus={
                whatsappSetupRequest?.status === "requested" || whatsappSetupRequest?.status === "in_progress"
                  ? whatsappSetupRequest.status
                  : null
              }
              setupRequestNotes={whatsappSetupRequest?.notes ?? null}
              labels={{
                title: channelSetupCopy.whatsapp.title,
                description: channelSetupCopy.whatsapp.description,
                number: copy.whatsappNumber,
                channelsNote: copy.channelsNote,
                embeddedConnectAction: copy.embeddedConnectAction,
                embeddedReconnectAction: copy.embeddedReconnectAction,
                embeddedSdkPreparing: copy.embeddedSdkPreparing,
                embeddedSdkLoading: copy.embeddedSdkLoading,
                embeddedConnectError: copy.embeddedConnectError,
                embeddedSaveError: copy.embeddedSaveError,
                embeddedConnectSuccess: copy.embeddedConnectSuccess,
                embeddedConnectHelp: copy.embeddedConnectHelp,
                embeddedFallbackTitle: copy.embeddedFallbackTitle,
                embeddedFallbackHelp: copy.embeddedFallbackHelp,
                requestWhatsAppSetup: copy.requestWhatsAppSetup,
                updateWhatsAppSetup: copy.updateWhatsAppSetup,
                setupRequested: copy.setupRequested,
                setupRequestedNote: copy.setupRequestedNote,
                setupNumberLabel: copy.setupNumberLabel,
                setupNumberPlaceholder: copy.setupNumberPlaceholder,
                setupMetaVerifiedLabel: copy.setupMetaVerifiedLabel,
                setupMetaVerifiedYes: copy.setupMetaVerifiedYes,
                setupMetaVerifiedNo: copy.setupMetaVerifiedNo,
                setupNotesLabel: copy.setupNotesLabel,
                setupNotesPlaceholder: copy.setupNotesPlaceholder,
                setupPhoneRequired: copy.setupPhoneRequired,
                requestError: copy.requestError,
                setupInProgress: copy.setupInProgress,
              }}
            />
          ) : null}

          {channel === "instagram" ? (
            <InstagramSettingsPanel
              label={formatChannel("instagram", t)}
              connected={Boolean(instagramChannel?.is_active)}
              connectedLabel={t("settings_active")}
              disconnectedLabel={t("settings_disconnected")}
              displayHandle={instagramDisplayHandle}
              canManage={canManageTeam}
              setupRequestStatus={
                instagramSetupRequest?.status === "requested" || instagramSetupRequest?.status === "in_progress"
                  ? instagramSetupRequest.status
                  : null
              }
              setupRequestNotes={instagramSetupRequest?.notes ?? null}
              labels={{
                title: channelSetupCopy.instagram.title,
                description: channelSetupCopy.instagram.description,
                handle: copy.instagramHandle,
                channelHelp: copy.instagramChannelHelp,
                channelsNote: copy.channelsNote,
                requestInstagramSetup: copy.requestInstagramSetup,
                updateInstagramSetup: copy.updateInstagramSetup,
                setupRequested: copy.setupRequested,
                setupInstagramRequestedNote: copy.setupInstagramRequestedNote,
                setupInstagramHandleLabel: copy.setupInstagramHandleLabel,
                setupInstagramHandlePlaceholder: copy.setupInstagramHandlePlaceholder,
                setupMetaVerifiedLabel: copy.setupMetaVerifiedLabel,
                setupMetaVerifiedYes: copy.setupMetaVerifiedYes,
                setupMetaVerifiedNo: copy.setupMetaVerifiedNo,
                setupNotesLabel: copy.setupNotesLabel,
                setupNotesPlaceholder: copy.setupNotesPlaceholder,
                setupInstagramRequired: copy.setupInstagramRequired,
                requestError: copy.requestError,
                setupInProgress: copy.setupInProgress,
              }}
            />
          ) : null}

          {channel === "email" ? (
            <EmailChannelSetup
              label={formatChannel("email", t)}
              isActive={Boolean(emailReply?.verified)}
              reply={emailReply}
              canManage={canManageTeam}
              labels={emailChannelSetupCopy}
            />
          ) : null}

          {channel === "form" ? (
            <FormChannelSetup
              label={formatChannel("form", t)}
              isActive={Boolean(formChannel?.is_active && formToken)}
              websiteLink={formWebsiteLink}
              token={formToken}
              endpoint={formEndpoint}
              embed={formEmbed}
              canManage={canManageTeam}
              googleFormsBackup={googleFormsBackup}
              formReply={formReply}
              labels={formChannelSetupCopy}
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}
