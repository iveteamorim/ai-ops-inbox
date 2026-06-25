import { isPublicDemoUser } from "@/lib/demo-access";

export function isNovuaInternalUser(email?: string | null) {
  if (!email) return false;

  const normalizedEmail = email.trim().toLowerCase();
  if (isPublicDemoUser(normalizedEmail)) {
    return false;
  }

  const allowedEmails = (
    process.env.NOVUA_INTERNAL_EMAILS?.split(",") ?? ["iveteamorim@gmail.com", "saraarubioo1@gmail.com"]
  )
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  const allowedDomains = (process.env.NOVUA_INTERNAL_DOMAINS?.split(",") ?? ["novua.digital"])
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  if (allowedEmails.includes(normalizedEmail)) {
    return true;
  }

  const domain = normalizedEmail.split("@")[1] ?? "";
  return allowedDomains.includes(domain);
}

export type WorkspaceMode = "internal_demo" | "customer_demo" | "customer_live";

function normalizeWorkspaceMode(value: unknown): WorkspaceMode | null {
  if (typeof value !== "string") return null;
  if (value === "internal_demo" || value === "customer_demo" || value === "customer_live") {
    return value;
  }
  return null;
}

export function getWorkspaceMode(
  company: { config?: Record<string, unknown> | null } | null | undefined,
  email?: string | null,
): WorkspaceMode {
  const configuredMode = normalizeWorkspaceMode(company?.config?.workspace_mode);
  if (configuredMode) {
    return configuredMode;
  }

  return isNovuaInternalUser(email) ? "internal_demo" : "customer_live";
}

export function canManageInternalWorkspace(mode: WorkspaceMode) {
  return mode === "internal_demo";
}

export function canSeeCustomerFeedback(mode: WorkspaceMode) {
  return mode !== "internal_demo";
}
