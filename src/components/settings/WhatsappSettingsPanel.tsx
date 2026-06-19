import { ChannelBadge } from "@/components/ChannelBadge";
import { SetupRequestButton } from "@/components/SetupRequestButton";
import { WhatsAppEmbeddedSignupCard } from "@/components/WhatsAppEmbeddedSignupCard";

type EmbeddedSignupConfig = {
  enabled: boolean;
  appId: string;
  configId: string;
  apiVersion: string;
};

type Props = {
  label: string;
  connected: boolean;
  connectedLabel: string;
  disconnectedLabel: string;
  displayNumber: string | null;
  canManage: boolean;
  embeddedSignupConfig: EmbeddedSignupConfig;
  setupRequestStatus: "requested" | "in_progress" | null;
  setupRequestNotes: string | null;
  labels: {
    title: string;
    description: string;
    number: string;
    channelsNote: string;
    embeddedConnectAction: string;
    embeddedReconnectAction: string;
    embeddedSdkPreparing: string;
    embeddedSdkLoading: string;
    embeddedConnectError: string;
    embeddedSaveError: string;
    embeddedConnectSuccess: string;
    embeddedConnectHelp: string;
    embeddedFallbackTitle: string;
    embeddedFallbackHelp: string;
    requestWhatsAppSetup: string;
    updateWhatsAppSetup: string;
    setupRequested: string;
    setupRequestedNote: string;
    setupNumberLabel: string;
    setupNumberPlaceholder: string;
    setupMetaVerifiedLabel: string;
    setupMetaVerifiedYes: string;
    setupMetaVerifiedNo: string;
    setupNotesLabel: string;
    setupNotesPlaceholder: string;
    setupPhoneRequired: string;
    requestError: string;
    setupInProgress: string;
  };
};

export function WhatsappSettingsPanel({
  label,
  connected,
  connectedLabel,
  disconnectedLabel,
  displayNumber,
  canManage,
  embeddedSignupConfig,
  setupRequestStatus,
  setupRequestNotes,
  labels,
}: Props) {
  return (
    <article
      className={`card settings-channel-card ${connected ? "settings-channel-connected" : "settings-channel-pending"}`.trim()}
    >
      <div className="preview-row" style={{ marginBottom: 12 }}>
        <ChannelBadge label={label} channel="whatsapp" />
        <span className={`badge ${connected ? "status-active" : "status-no-response"}`}>
          {connected ? connectedLabel : disconnectedLabel}
        </span>
      </div>
      <p className="label">{labels.title}</p>
      <p className="subtitle" style={{ marginBottom: 12 }}>
        {labels.description}
      </p>
      {connected ? (
        <div className="preview-row" style={{ marginBottom: 12 }}>
          <span>{labels.number}</span>
          <span>{displayNumber ?? "-"}</span>
        </div>
      ) : null}
      {canManage ? (
        <>
          {embeddedSignupConfig.enabled ? (
            <WhatsAppEmbeddedSignupCard
              appId={embeddedSignupConfig.appId}
              configId={embeddedSignupConfig.configId}
              apiVersion={embeddedSignupConfig.apiVersion}
              isConnected={connected}
              connectLabel={labels.embeddedConnectAction}
              reconnectLabel={labels.embeddedReconnectAction}
              readyLabel={labels.embeddedSdkPreparing}
              loadingLabel={labels.embeddedSdkLoading}
              launchErrorLabel={labels.embeddedConnectError}
              saveErrorLabel={labels.embeddedSaveError}
              connectedLabel={labels.embeddedConnectSuccess}
              helperLabel={labels.embeddedConnectHelp}
              fallbackLabel={labels.embeddedFallbackTitle}
              fallbackHelp={labels.embeddedFallbackHelp}
            />
          ) : null}
          {!embeddedSignupConfig.enabled ? (
            <SetupRequestButton
              idleLabel={labels.requestWhatsAppSetup}
              updateLabel={labels.updateWhatsAppSetup}
              requestedLabel={labels.setupRequested}
              requestedNote={labels.setupRequestedNote}
              numberLabel={labels.setupNumberLabel}
              numberPlaceholder={labels.setupNumberPlaceholder}
              metaVerifiedLabel={labels.setupMetaVerifiedLabel}
              metaVerifiedYes={labels.setupMetaVerifiedYes}
              metaVerifiedNo={labels.setupMetaVerifiedNo}
              notesLabel={labels.setupNotesLabel}
              notesPlaceholder={labels.setupNotesPlaceholder}
              phoneRequiredError={labels.setupPhoneRequired}
              requestErrorLabel={labels.requestError}
              inProgressLabel={labels.setupInProgress}
              existingStatus={setupRequestStatus}
              existingNotes={setupRequestNotes}
            />
          ) : null}
        </>
      ) : (
        <p className="note">{labels.channelsNote}</p>
      )}
    </article>
  );
}
