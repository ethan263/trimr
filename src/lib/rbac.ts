export const MANAGE_OPERATIONS_PERMISSION = "org:operations_hub:manage";

export type WorkspaceMode = "personal" | "organization";

export type WorkspaceAuthRole = {
  mode?: WorkspaceMode;
  role?: string;
  permissions?: readonly string[];
};

/** Workspace owner or team admin — settings, member management. */
export function isWorkspaceAdmin(auth: WorkspaceAuthRole): boolean {
  if (auth.mode === "personal") {
    return true;
  }
  return auth.role === "admin" || auth.role === "owner";
}

/** Can use the operations hub (bookings, offerings, agent, public site). */
export function isWorkspaceOperator(auth: WorkspaceAuthRole): boolean {
  if (auth.mode === "personal") {
    return true;
  }
  if (isWorkspaceAdmin(auth)) {
    return true;
  }
  if (auth.role === "operator" || auth.role === "member") {
    return true;
  }
  return auth.permissions?.includes(MANAGE_OPERATIONS_PERMISSION) ?? false;
}

/** Infer hub permissions from a membership role. */
export function permissionsForMembershipRole(role: string | undefined): string[] {
  if (!role) return [];
  if (role === "admin" || role === "owner" || role === "operator" || role === "member") {
    return [MANAGE_OPERATIONS_PERMISSION];
  }
  return [];
}