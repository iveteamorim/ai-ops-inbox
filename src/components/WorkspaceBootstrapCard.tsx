"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

type WorkspaceBootstrapCardProps = {
  copy: {
    title: string;
    description: string;
    retry: string;
    pending: string;
    success: string;
    fallback: string;
  };
};

export function WorkspaceBootstrapCard({ copy }: WorkspaceBootstrapCardProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function repairWorkspace() {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/auth/bootstrap-workspace", {
        method: "POST",
      });
      const payload = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null;

      if (!response.ok || !payload?.ok) {
        setError(payload?.error || copy.fallback);
        return;
      }

      setMessage(copy.success);
      router.refresh();
    } catch {
      setError(copy.fallback);
    } finally {
      setLoading(false);
    }
  }

  return (
    <article className="card">
      <p className="label" style={{ marginBottom: 10 }}>{copy.title}</p>
      <p className="subtitle" style={{ marginTop: 0 }}>{copy.description}</p>
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginTop: 16 }}>
        <Button type="button" onClick={repairWorkspace} disabled={loading}>
          {loading ? copy.pending : copy.retry}
        </Button>
        {message ? <p style={{ margin: 0, color: "var(--text)" }}>{message}</p> : null}
        {error ? <p className="warn" style={{ margin: 0 }}>{error}</p> : null}
      </div>
    </article>
  );
}
