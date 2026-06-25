import { ChannelBadge } from "@/components/ChannelBadge";
import { SetupRequestButton } from "@/components/SetupRequestButton";

type Props = {
  label: string;
  connected: boolean;
  connectedLabel: string;
  disconnectedLabel: string;
  displayHandle: string | null;
  canManage: boolean;
  setupRequestStatus: "requested" | "in_progress" | null;
  setupRequestNotes: string | null;
  labels: {
    title: string;
    description: string;
    handle: string;
    channelHelp: string;
    channelsNote: string;
    requestInstagramSetup: string;
    updateInstagramSetup: string;
    setupRequested: string;
    setupInstagramRequestedNote: string;
    setupInstagramHandleLabel: string;
    setupInstagramHandlePlaceholder: string;
    setupMetaVerifiedLabel: string;
    setupMetaVerifiedYes: string;
    setupMetaVerifiedNo: string;
    setupNotesLabel: string;
    setupNotesPlaceholder: string;
    setupInstagramRequired: string;
    requestError: string;
    setupInProgress: string;
  };
};

export function InstagramSettingsPanel({
  label,
  connected,
  connectedLabel,
  disconnectedLabel,
  displayHandle,
  canManage,
  setupRequestStatus,
  setupRequestNotes,
  labels,
}: Props) {
  return (
    <article
      className={`card settings-channel-card ${connected ? "settings-channel-connected" : "settings-channel-pending"}`.trim()}
    >
      <div className="preview-row" style={{ marginBottom: 12 }}>
        <ChannelBadge label={label} channel="instagram" />
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
          <span>{labels.handle}</span>
          <span>{displayHandle ?? "-"}</span>
        </div>
      ) : null}
      {canManage ? (
        <>
          <p className="note" style={{ marginBottom: 12 }}>
            {labels.channelHelp}
          </p>
          <SetupRequestButton
            channel="instagram"
            idleLabel={labels.requestInstagramSetup}
            updateLabel={labels.updateInstagramSetup}
            requestedLabel={labels.setupRequested}
            requestedNote={labels.setupInstagramRequestedNote}
            numberLabel={labels.setupInstagramHandleLabel}
            numberPlaceholder={labels.setupInstagramHandlePlaceholder}
            metaVerifiedLabel={labels.setupMetaVerifiedLabel}
            metaVerifiedYes={labels.setupMetaVerifiedYes}
            metaVerifiedNo={labels.setupMetaVerifiedNo}
            notesLabel={labels.setupNotesLabel}
            notesPlaceholder={labels.setupNotesPlaceholder}
            phoneRequiredError={labels.setupInstagramRequired}
            requestErrorLabel={labels.requestError}
            inProgressLabel={labels.setupInProgress}
            existingStatus={setupRequestStatus}
            existingNotes={setupRequestNotes}
          />
        </>
      ) : (
        <p className="note">{labels.channelsNote}</p>
      )}
    </article>
  );
}
