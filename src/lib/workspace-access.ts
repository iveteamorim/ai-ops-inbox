import type { User } from "@supabase/supabase-js";
import { ensureUserWorkspace } from "@/lib/workspace-bootstrap";

export type WorkspaceMember = {
  id: string;
  company_id: string;
  full_name: string | null;
  role: string;
};

export async function getWorkspaceMember(user: User): Promise<WorkspaceMember> {
  const result = await ensureUserWorkspace(user);

  return {
    id: result.profile.id,
    company_id: result.profile.company_id,
    full_name: result.profile.full_name,
    role: result.profile.role,
  };
}

export function canManageWorkspace(role: string) {
  return role === "owner" || role === "admin";
}
