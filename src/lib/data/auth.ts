import "server-only";

import type { BackendTerminology, Organization } from "@/components/dashboard/data";
import { getAppAuthSession } from "@/lib/auth/require-app-session";
import {
  MANAGE_OPERATIONS_PERMISSION,
  isWorkspaceAdmin,
  isWorkspaceOperator,
  permissionsForMembershipRole,
} from "@/lib/rbac";
import { createAdminClient } from "@/lib/supabase/admin";
import type { WorkspaceMode } from "@/lib/workspaces";

export {
  MANAGE_OPERATIONS_PERMISSION,
  isWorkspaceAdmin,
  isWorkspaceOperator,
} from "@/lib/rbac";

export type OrganizationRow = {
  id: string;
  clerk_org_id: string | null;
  owner_user_id: string | null;
  name: string;
  slug: string;
  timezone: string;
  currency: string;
  locale: string;
  terminology: BackendTerminology;
  created_at: string;
  updated_at: string;
};

export type ActiveOrganizationContext = {
  mode: WorkspaceMode;
  role: string;
  userId: string;
  permissions: string[];
};

export function mapOrganization(
  row: OrganizationRow,
  role?: string,
): Organization {
  return {
    _id: row.id,
    name: row.name,
    slug: row.slug,
    timezone: row.timezone,
    currency: row.currency,
    locale: row.locale,
    terminology: row.terminology,
    role,
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
  };
}

/** Resolve the current user's active workspace context from the Supabase session. */
export async function requireActiveOrganizationContext(): Promise<ActiveOrganizationContext> {
  const session = await getAppAuthSession();
  if (!session.userId) {
    throw new Error("Authentication required.");
  }
  return {
    mode: "personal",
    role: "owner",
    userId: session.userId,
    permissions: [MANAGE_OPERATIONS_PERMISSION],
  };
}

async function lookupContextOrganization(
  context: ActiveOrganizationContext,
): Promise<OrganizationRow | null> {
  const supabase = createAdminClient();
  // Personal workspace.
  const { data, error } = await supabase
    .from("organizations")
    .select("*")
    .eq("owner_user_id", context.userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as OrganizationRow | null) ?? null;
}

export async function requireCurrentOrganization() {
  const context = await requireActiveOrganizationContext();
  // Service role after auth verification: dashboard tenancy is enforced by
  // subscriber/owner filters, not by JWT RLS claims.
  const data = await lookupContextOrganization(context);
  if (!data) {
    throw new Error(
      "This workspace has not been initialized yet. Run bootstrapCurrentOrganization first.",
    );
  }
  return {
    auth: context,
    organization: data,
    supabase: createAdminClient(),
  };
}

export async function requireCurrentOrganizationAdmin() {
  const current = await requireCurrentOrganization();
  if (!isWorkspaceAdmin(current.auth)) {
    throw new Error("An organization admin role is required for this action.");
  }
  return current;
}

export async function requireCurrentOrganizationOperator() {
  const current = await requireCurrentOrganization();
  if (!isWorkspaceOperator(current.auth)) {
    throw new Error(
      "The organization operator permission is required for this action.",
    );
  }
  return current;
}

/**
 * Resolve the workspace from the URL slug for the signed-in user. Allows
 * access if the user owns the personal workspace or is a member of the team.
 */
export async function requireCurrentOrganizationForRouteSlug(
  routeOrgSlug: string,
) {
  const session = await getAppAuthSession();
  if (!session.userId) {
    throw new Error("Authentication required.");
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("organizations")
    .select("*")
    .eq("slug", routeOrgSlug)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) {
    throw new Error("This business was not found.");
  }

  const organization = data as OrganizationRow;

  const membership = await resolveMembership(session.userId, organization.id);
  if (!membership) {
    throw new Error("You do not have access to this business.");
  }

  return {
    auth: {
      mode: organization.owner_user_id
        ? ("personal" as const)
        : ("organization" as const),
      role: membership.role,
      userId: session.userId,
      permissions: permissionsForMembershipRole(membership.role),
    },
    organization,
    supabase,
  };
}

async function resolveMembership(
  userId: string,
  organizationId: string,
): Promise<{ role: string } | null> {
  const supabase = createAdminClient();
  const { data: membership, error } = await supabase
    .from("organization_memberships")
    .select("role")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (membership) {
    return { role: membership.role as string };
  }

  // Fall back to personal ownership (legacy personal rows).
  const { data: org } = await supabase
    .from("organizations")
    .select("owner_user_id")
    .eq("id", organizationId)
    .maybeSingle();
  if (org?.owner_user_id === userId) {
    return { role: "owner" };
  }
  return null;
}

export async function requireCurrentOrganizationAdminForRouteSlug(
  routeOrgSlug: string,
) {
  const current = await requireCurrentOrganizationForRouteSlug(routeOrgSlug);
  if (!isWorkspaceAdmin(current.auth)) {
    throw new Error("An organization admin role is required for this action.");
  }
  return current;
}

export function ms(iso: string | null | undefined): number | undefined {
  if (!iso) return undefined;
  return new Date(iso).getTime();
}

export function iso(msValue: number): string {
  return new Date(msValue).toISOString();
}
