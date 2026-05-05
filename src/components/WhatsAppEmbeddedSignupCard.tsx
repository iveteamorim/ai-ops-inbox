"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Props = {
  appId: string;
  configId: string;
  apiVersion: string;
  isConnected: boolean;
  connectLabel: string;
  reconnectLabel: string;
  readyLabel: string;
  loadingLabel: string;
  launchErrorLabel: string;
  saveErrorLabel: string;
  connectedLabel: string;
  helperLabel: string;
  fallbackLabel: string;
  fallbackHelp: string;
};

type EmbeddedFinishPayload = {
  wabaId: string;
  phoneNumberId: string;
  displayPhoneNumber: string | null;
  businessName: string | null;
};

type FacebookLoginResponse = {
  status?: string;
  authResponse?: {
    code?: string;
    accessToken?: string;
  } | null;
};

type FacebookSdk = {
  init: (options: Record<string, unknown>) => void;
  login: (
    callback: (response: FacebookLoginResponse) => void,
    options: Record<string, unknown>,
  ) => void;
};

declare global {
  interface Window {
    FB?: FacebookSdk;
    fbAsyncInit?: () => void;
  }
}

function parseEmbeddedEventData(raw: unknown): EmbeddedFinishPayload | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, unknown>;
  const source =
    record.data && typeof record.data === "object"
      ? (record.data as Record<string, unknown>)
      : record.payload && typeof record.payload === "object"
        ? (record.payload as Record<string, unknown>)
        : record;
  const wabaId = typeof source.waba_id === "string" ? source.waba_id.trim() : "";
  const phoneNumberId = typeof source.phone_number_id === "string" ? source.phone_number_id.trim() : "";
  const displayPhoneNumber =
    typeof source.display_phone_number === "string" && source.display_phone_number.trim()
      ? source.display_phone_number.trim()
      : null;
  const businessName =
    typeof source.business_name === "string" && source.business_name.trim()
      ? source.business_name.trim()
      : null;

  if (!wabaId || !phoneNumberId) return null;

  return { wabaId, phoneNumberId, displayPhoneNumber, businessName };
}

function getEmbeddedEvent(raw: unknown) {
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  if (!raw || typeof raw !== "object") return null;
  return raw as Record<string, unknown>;
}

export function WhatsAppEmbeddedSignupCard({
  appId,
  configId,
  apiVersion,
  isConnected,
  connectLabel,
  reconnectLabel,
  readyLabel,
  loadingLabel,
  launchErrorLabel,
  saveErrorLabel,
  connectedLabel,
  helperLabel,
  fallbackLabel,
  fallbackHelp,
}: Props) {
  const router = useRouter();
  const [sdkReady, setSdkReady] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "launching" | "saving" | "connected" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const finishPayloadRef = useRef<EmbeddedFinishPayload | null>(null);
  const authCodeRef = useRef<string | null>(null);
  const completionStartedRef = useRef(false);

  const buttonLabel = useMemo(() => {
    if (status === "loading") return loadingLabel;
    if (status === "launching") return loadingLabel;
    if (status === "saving" || isPending) return loadingLabel;
    return isConnected ? reconnectLabel : connectLabel;
  }, [connectLabel, isConnected, isPending, loadingLabel, reconnectLabel, status]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    function handleSdkReady() {
      if (!window.FB) return;
      window.FB.init({
        appId,
        cookie: true,
        xfbml: false,
        version: apiVersion,
      });
      setSdkReady(true);
    }

    if (window.FB) {
      handleSdkReady();
      return;
    }

    window.fbAsyncInit = handleSdkReady;

    const existingScript = document.getElementById("facebook-jssdk");
    if (existingScript) return;

    const script = document.createElement("script");
    script.id = "facebook-jssdk";
    script.async = true;
    script.defer = true;
    script.crossOrigin = "anonymous";
    script.src = "https://connect.facebook.net/en_US/sdk.js";
    script.onerror = () => {
      setError(launchErrorLabel);
      setStatus("error");
    };
    document.body.appendChild(script);
  }, [apiVersion, appId, launchErrorLabel]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    async function completeConnection() {
      if (completionStartedRef.current || !finishPayloadRef.current) return;
      completionStartedRef.current = true;
      setStatus("saving");
      setError(null);

      const res = await fetch("/api/whatsapp/embedded-signup/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          waba_id: finishPayloadRef.current.wabaId,
          phone_number_id: finishPayloadRef.current.phoneNumberId,
          display_phone_number: finishPayloadRef.current.displayPhoneNumber,
          business_name: finishPayloadRef.current.businessName,
          code: authCodeRef.current,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        completionStartedRef.current = false;
        setStatus("error");
        setError(data.error === "phone_number_already_connected" ? connectedLabel : saveErrorLabel);
        return;
      }

      setStatus("connected");
      startTransition(() => {
        router.refresh();
      });
    }

    function handleMessage(event: MessageEvent) {
      if (event.origin !== "https://www.facebook.com" && event.origin !== "https://web.facebook.com") {
        return;
      }

      const payload = getEmbeddedEvent(event.data);
      if (!payload || payload.type !== "WA_EMBEDDED_SIGNUP") return;

      const embeddedEvent = typeof payload.event === "string" ? payload.event : "";
      if (embeddedEvent === "FINISH") {
        const finishData = parseEmbeddedEventData(payload);
        if (!finishData) {
          setStatus("error");
          setError(saveErrorLabel);
          return;
        }
        finishPayloadRef.current = finishData;
        void completeConnection();
        return;
      }

      if (embeddedEvent === "ERROR") {
        setStatus("error");
        setError(saveErrorLabel);
        return;
      }

      if (embeddedEvent === "CANCEL") {
        setStatus("idle");
      }
    }

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [connectedLabel, router, saveErrorLabel, startTransition]);

  function startEmbeddedSignup() {
    if (!window.FB || !sdkReady) {
      setStatus("error");
      setError(launchErrorLabel);
      return;
    }

    setError(null);
    setStatus("launching");
    finishPayloadRef.current = null;
    authCodeRef.current = null;
    completionStartedRef.current = false;

    window.FB.login(
      (response) => {
        if (!response || response.status !== "connected") {
          setStatus("idle");
          return;
        }

        authCodeRef.current =
          typeof response.authResponse?.code === "string" && response.authResponse.code.trim()
            ? response.authResponse.code.trim()
            : null;
      },
      {
        config_id: configId,
        response_type: "code",
        override_default_response_type: true,
        extras: {
          feature: "whatsapp_embedded_signup",
          sessionInfoVersion: 3,
        },
      },
    );
  }

  return (
    <div className="request-state">
      <p className="note" style={{ marginBottom: 12 }}>
        {helperLabel}
      </p>
      <button className="button" type="button" onClick={startEmbeddedSignup} disabled={!sdkReady || status === "saving" || isPending}>
        {!sdkReady && status === "idle" ? readyLabel : buttonLabel}
      </button>
      {status === "connected" ? (
        <p className="note" style={{ marginTop: 10 }}>
          {connectedLabel}
        </p>
      ) : null}
      {error ? (
        <p className="note" style={{ marginTop: 10 }}>
          {error}
        </p>
      ) : null}
      <div style={{ marginTop: 14 }}>
        <p className="label" style={{ marginBottom: 6 }}>
          {fallbackLabel}
        </p>
        <p className="note">{fallbackHelp}</p>
      </div>
    </div>
  );
}
