"use client";

import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { CHANNEL_TYPES, channelSettingsAnchor, type ChannelType } from "@/lib/messaging/channel-types";

function hashToChannel(hash: string): ChannelType | null {
  const id = hash.replace(/^#/, "");
  for (const type of CHANNEL_TYPES) {
    if (id === channelSettingsAnchor(type)) return type;
  }
  return null;
}

type PanelProps = {
  channel: ChannelType;
  activeChannel?: ChannelType | null;
  children: ReactNode;
};

function Panel({ channel, activeChannel, children }: PanelProps) {
  if (activeChannel !== channel) return null;
  return <div className="settings-channel-focus-panel">{children}</div>;
}

type FocusedChannelSetupProps = {
  emptyLabel: string;
  children: ReactNode;
};

function FocusedChannelSetup({ emptyLabel, children }: FocusedChannelSetupProps) {
  const [activeChannel, setActiveChannel] = useState<ChannelType | null>(() => {
    if (typeof window === "undefined") return null;
    return hashToChannel(window.location.hash);
  });
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    const sync = () => setActiveChannel(hashToChannel(window.location.hash));
    sync();
    setHasHydrated(true);
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  if (!hasHydrated) {
    return <div className="settings-channel-focus" aria-hidden />;
  }

  if (!activeChannel) {
    return (
      <article className="card settings-channel-focus-empty">
        <p className="subtitle" style={{ margin: 0 }}>
          {emptyLabel}
        </p>
      </article>
    );
  }

  return (
    <div className="settings-channel-focus">
      {Children.map(children, (child) => {
        if (!isValidElement<PanelProps>(child)) return child;
        return cloneElement(child, { activeChannel });
      })}
    </div>
  );
}

FocusedChannelSetup.Panel = Panel;

export { FocusedChannelSetup };
