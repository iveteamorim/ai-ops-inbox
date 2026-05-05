import type { ServiceType } from "@/lib/triage/triage-conversation";

export const DEFAULT_PUBLIC_DEMO_EMAILS = ["demo@novua.digital"] as const;

export const DEFAULT_DEMO_COMPANY_NAME = "Novua Demo Workspace";

export const DEFAULT_DEMO_LEAD_TYPES = [
  { id: "premium-treatment", name: "Premium treatment", estimated_value: 300 },
  { id: "general-information", name: "General information", estimated_value: 50 },
  { id: "follow-up-update", name: "Follow-up update", estimated_value: 120 },
] as const;

export function getPublicDemoEmails() {
  return (process.env.NOVUA_PUBLIC_DEMO_EMAILS?.split(",") ?? [...DEFAULT_PUBLIC_DEMO_EMAILS])
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

export function isPublicDemoUser(email?: string | null) {
  if (!email) return false;
  return getPublicDemoEmails().includes(email.trim().toLowerCase());
}

export function buildDemoWorkspaceConfig(currentConfig?: Record<string, unknown> | null) {
  const config = currentConfig && typeof currentConfig === "object" ? currentConfig : {};
  const currentBusinessSetup =
    "business_setup" in config && config.business_setup && typeof config.business_setup === "object"
      ? (config.business_setup as Record<string, unknown>)
      : {};

  return {
    ...config,
    workspace_mode: "customer_demo",
    demo_workspace: true,
    business_setup: {
      ...currentBusinessSetup,
      business_name: DEFAULT_DEMO_COMPANY_NAME,
      lead_types: DEFAULT_DEMO_LEAD_TYPES.map((item) => ({ ...item })),
    },
  };
}

export function getDemoServiceCatalog(config?: Record<string, unknown> | null): ServiceType[] {
  const businessSetup =
    config && "business_setup" in config && config.business_setup && typeof config.business_setup === "object"
      ? (config.business_setup as Record<string, unknown>)
      : {};
  const leadTypes = Array.isArray(businessSetup.lead_types) ? businessSetup.lead_types : DEFAULT_DEMO_LEAD_TYPES;

  const catalog = leadTypes
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const name = typeof row.name === "string" ? row.name.trim() : "";
      const estimatedValue =
        typeof row.estimated_value === "number"
          ? row.estimated_value
          : typeof row.estimated_value === "string"
            ? Number(row.estimated_value)
            : 0;
      if (!name) return null;
      return {
        name,
        estimatedValue: Number.isFinite(estimatedValue) ? Math.max(0, estimatedValue) : 0,
      };
    })
    .filter((value): value is ServiceType => Boolean(value));

  return catalog.length > 0
    ? catalog
    : DEFAULT_DEMO_LEAD_TYPES.map((item) => ({
        name: item.name,
        estimatedValue: item.estimated_value,
      }));
}
