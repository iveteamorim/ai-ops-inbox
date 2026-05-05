import type { User } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

type ProfileRow = {
  id: string;
  company_id: string;
  full_name: string | null;
  role: string;
};

type CompanyRow = {
  id: string;
  name: string;
  plan: string;
  config?: Record<string, unknown> | null;
};

export type WorkspaceBootstrapResult = {
  profile: ProfileRow;
  company: CompanyRow;
  repaired: boolean;
};

function titleCase(value: string) {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function deriveCompanyName(user: User) {
  const metadataCompany = user.user_metadata?.company_name;
  if (typeof metadataCompany === "string" && metadataCompany.trim()) {
    return metadataCompany.trim();
  }

  const email = user.email ?? "";
  const local = email.split("@")[0] ?? "novua";
  return titleCase(local);
}

function deriveFullName(user: User) {
  const metadataName = user.user_metadata?.full_name;
  if (typeof metadataName === "string" && metadataName.trim()) {
    return metadataName.trim();
  }

  return null;
}

function normalizeRole(user: User) {
  const value = user.user_metadata?.role;
  return value === "owner" || value === "admin" || value === "agent" ? value : "owner";
}

async function ensureCompany(admin: ReturnType<typeof createAdminClient>, user: User, companyId?: string | null) {
  if (companyId) {
    const { data: existingCompany, error } = await admin
      .from("companies")
      .select("id, name, plan, config")
      .eq("id", companyId)
      .maybeSingle<CompanyRow>();

    if (error) {
      throw new Error(error.message);
    }

    if (existingCompany) {
      return { company: existingCompany, repaired: false };
    }
  }

  const { data: company, error: companyError } = await admin
    .from("companies")
    .insert({ name: deriveCompanyName(user) })
    .select("id, name, plan, config")
    .single<CompanyRow>();

  if (companyError || !company) {
    throw new Error(companyError?.message ?? "Failed to create company");
  }

  return { company, repaired: true };
}

export async function ensureUserWorkspace(user: User): Promise<WorkspaceBootstrapResult> {
  const admin = createAdminClient();
  const { data: existingProfile, error: profileError } = await admin
    .from("profiles")
    .select("id, company_id, full_name, role")
    .eq("id", user.id)
    .maybeSingle<ProfileRow>();

  if (profileError) {
    throw new Error(profileError.message);
  }

  const { company, repaired: companyRepaired } = await ensureCompany(admin, user, existingProfile?.company_id ?? null);
  const desiredFullName = deriveFullName(user);
  const desiredRole = existingProfile?.role ?? normalizeRole(user);

  const nextProfile = {
    id: user.id,
    company_id: company.id,
    full_name: existingProfile?.full_name ?? desiredFullName,
    role: desiredRole,
  };

  const shouldWriteProfile =
    !existingProfile ||
    existingProfile.company_id !== nextProfile.company_id ||
    existingProfile.role !== nextProfile.role ||
    Boolean(desiredFullName && existingProfile.full_name !== desiredFullName);

  if (shouldWriteProfile) {
    const { error: upsertError } = await admin.from("profiles").upsert(nextProfile, { onConflict: "id" });

    if (upsertError) {
      throw new Error(upsertError.message);
    }
  }

  return {
    profile: nextProfile,
    company,
    repaired: companyRepaired || shouldWriteProfile,
  };
}
