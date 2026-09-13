import "server-only";

import type { Organization } from "@/components/dashboard/data";
import { requireCurrentOrganizationForRouteSlug } from "@/lib/data/auth";
import {
  DEFAULT_TERMINOLOGY,
  assertIanaTimezone,
  defaultSiteConfig,
  optionalTrimmed,
  requiredTrimmed,
  slugify,
  type BackendTerminology,
} from "@/lib/data/shared";
import { resolveElevenLabsAgentId } from "@/lib/elevenlabs/config";
import { requireActiveOrganizationContext } from "@/lib/data/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AccessibleWorkspace, WorkspaceMode } from "@/lib/workspaces";

export type { AccessibleWorkspace } from "@/lib/workspaces";

type OrganizationRow = {
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

function modeForRow(row: OrganizationRow): WorkspaceMode {
  return row.owner_user_id ? "personal" : "organization";
}

function viewOrganization(row: OrganizationRow, role?: string): Organization {
  return {
    _id: row.id,
    mode: modeForRow(row),
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

export async function listAccessibleWorkspaces(
  userId: string,
): Promise<AccessibleWorkspace[]> {
  const supabase = createAdminClient();
  const workspaces: AccessibleWorkspace[] = [];

  const { data: personal, error: personalError } = await supabase
    .from("organizations")
    .select("*")
    .eq("owner_user_id", userId)
    .maybeSingle();
  if (personalError) throw new Error(personalError.message);
  if (personal) {
    const row = personal as OrganizationRow;
    workspaces.push({
      slug: row.slug,
      name: row.name,
      mode: "personal",
      role: "owner",
      isBootstrapped: true,
    });
  }

  const { data: memberships, error: membershipError } = await supabase
    .from("organization_memberships")
    .select("organization_id, role")
    .eq("user_id", userId);
  if (membershipError) throw new Error(membershipError.message);

  for (const membership of memberships ?? []) {
    const { data: orgRow, error: orgError } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", membership.organization_id)
      .maybeSingle();
    if (orgError) throw new Error(orgError.message);
    const row = orgRow as OrganizationRow | null;
    if (!row || row.owner_user_id) continue; // personal rows handled above
    workspaces.push({
      slug: row.slug,
      name: row.name,
      mode: "organization",
      role: (membership.role as string) || "member",
      isBootstrapped: true,
    });
  }

  return workspaces;
}

export async function requireActiveOrganizationContext2() {
  return requireActiveOrganizationContext();
}

export async function getCurrentOrganization(): Promise<Organization | null> {
  const context = await requireActiveOrganizationContext();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("organizations")
    .select("*")
    .eq("owner_user_id", context.userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return viewOrganization(data as OrganizationRow, context.role ?? "owner");
}

export async function getWorkspaceForUser(userId: string): Promise<Organization | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("organizations")
    .select("*")
    .eq("owner_user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return viewOrganization(data as OrganizationRow, "owner");
}

export async function getOrganizationForRouteSlug(
  routeOrgSlug: string,
): Promise<Organization | null> {
  const current = await requireCurrentOrganizationForRouteSlug(routeOrgSlug);
  return viewOrganization(current.organization as OrganizationRow, current.auth.role);
}

export async function bootstrapCurrentOrganization(args: {
  name?: string;
  timezone?: string;
  currency?: string;
  locale?: string;
}): Promise<Organization> {
  const context = await requireActiveOrganizationContext();
  const existing = await getCurrentOrganization();
  if (existing) {
    await ensureWorkspaceRows(existing._id, existing.name, existing.slug);
    await ensureOwnerMembership(existing._id, context.userId);
    return existing;
  }

  const name = requiredTrimmed(args.name ?? "My business", "name", 120);
  const timezone = optionalTrimmed(args.timezone, "timezone", 100) ?? "UTC";
  assertIanaTimezone(timezone);
  const currency = (args.currency ?? "ZAR").trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) {
    throw new Error("currency must be a three-letter ISO 4217 code.");
  }
  const locale = optionalTrimmed(args.locale, "locale", 35) ?? "en-ZA";
  try {
    new Intl.Locale(locale);
  } catch {
    throw new Error(`Invalid locale: "${locale}".`);
  }

  const preferredSlug = slugify(name);
  const supabase = createAdminClient();

  const { data: slugOwner, error: slugError } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", preferredSlug)
    .maybeSingle();
  if (slugError) throw new Error(slugError.message);

  const slugSuffix = context.userId.slice(-8);
  const slug = slugOwner ? `${preferredSlug}-${slugSuffix}` : preferredSlug;

  const defaultAgentId = resolveElevenLabsAgentId();

  const { data: organization, error: insertError } = await supabase
    .from("organizations")
    .insert({
      owner_user_id: context.userId,
      name,
      slug,
      timezone,
      currency,
      locale,
      terminology: DEFAULT_TERMINOLOGY,
    })
    .select("*")
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      const raced = await getCurrentOrganization();
      if (raced) {
        await ensureWorkspaceRows(raced._id, raced.name, raced.slug);
        await ensureOwnerMembership(raced._id, context.userId);
        return raced;
      }
    }
    throw new Error(insertError.message);
  }

  const orgRow = organization as OrganizationRow;
  await ensureWorkspaceRows(orgRow.id, name, slug, defaultAgentId);
  await ensureOwnerMembership(orgRow.id, context.userId);

  return viewOrganization(orgRow, context.role ?? "owner");
}

async function ensureOwnerMembership(organizationId: string, userId: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("organization_memberships").upsert(
    {
      organization_id: organizationId,
      user_id: userId,
      role: "owner",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "organization_id,user_id" },
  );
  if (error) throw new Error(error.message);
}

async function ensureWorkspaceRows(
  organizationId: string,
  businessName: string,
  siteSlug: string,
  agentId = resolveElevenLabsAgentId(),
) {
  const supabase = createAdminClient();

  const [{ data: site }, { data: integration }] = await Promise.all([
    supabase
      .from("public_sites")
      .select("id")
      .eq("organization_id", organizationId)
      .maybeSingle(),
    supabase
      .from("agent_integrations")
      .select("id, web_enabled, web_agent_id")
      .eq("organization_id", organizationId)
      .eq("provider", "elevenlabs")
      .maybeSingle(),
  ]);

  if (!site) {
    const { error: siteError } = await supabase.from("public_sites").insert({
      organization_id: organizationId,
      site_slug: siteSlug,
      draft: defaultSiteConfig(businessName),
    });
    if (siteError && siteError.code !== "23505") {
      throw new Error(siteError.message);
    }
  }

  if (!integration) {
    const { error: agentError } = await supabase
      .from("agent_integrations")
      .insert({
        organization_id: organizationId,
        provider: "elevenlabs",
        web_agent_id: agentId,
        web_enabled: Boolean(agentId),
      });
    if (agentError && agentError.code !== "23505") {
      throw new Error(agentError.message);
    }
    return;
  }

  const needsRepair =
    !integration.web_enabled ||
    !integration.web_agent_id ||
    integration.web_agent_id === "agent_your_shared_concierge";

  if (needsRepair && agentId) {
    const { error: repairError } = await supabase
      .from("agent_integrations")
      .update({
        web_agent_id: agentId,
        web_enabled: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", integration.id);
    if (repairError) throw new Error(repairError.message);
  }
}

export async function updateCurrentOrganization(args: {
  name?: string;
  timezone?: string;
  currency?: string;
  locale?: string;
  terminology?: BackendTerminology;
}): Promise<Organization> {
  const context = await requireActiveOrganizationContext();
  const current = await getCurrentOrganization();
  if (!current) {
    throw new Error(
      "This organization has not been initialized yet. Run bootstrapCurrentOrganization first.",
    );
  }

  const timezone = args.timezone?.trim();
  if (timezone) assertIanaTimezone(timezone);
  const currency = args.currency?.trim().toUpperCase();
  if (currency && !/^[A-Z]{3}$/.test(currency)) {
    throw new Error("currency must be a three-letter ISO 4217 code.");
  }
  const locale = optionalTrimmed(args.locale, "locale", 35);
  if (locale) {
    try {
      new Intl.Locale(locale);
    } catch {
      throw new Error(`Invalid locale: "${locale}".`);
    }
  }
  const terminology = args.terminology
    ? (Object.fromEntries(
        Object.entries(args.terminology).map(([key, value]) => [
          key,
          requiredTrimmed(value, `terminology.${key}`, 40),
        ]),
      ) as BackendTerminology)
    : undefined;

  const supabase = createAdminClient();

  if (timezone && timezone !== current.timezone) {
    const { count, error } = await supabase
      .from("availability_rules")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", current._id);
    if (error) throw new Error(error.message);
    if ((count ?? 0) > 500) {
      throw new Error(
        "This organization has too many availability rules for an atomic timezone change.",
      );
    }
    const { error: updateRulesError } = await supabase
      .from("availability_rules")
      .update({ timezone, updated_at: new Date().toISOString() })
      .eq("organization_id", current._id);
    if (updateRulesError) throw new Error(updateRulesError.message);
  }

  if (currency && currency !== current.currency) {
    const { count, error } = await supabase
      .from("offerings")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", current._id);
    if (error) throw new Error(error.message);
    if ((count ?? 0) > 500) {
      throw new Error(
        "This organization has too many offerings for an atomic currency change.",
      );
    }
    const { error: updateOfferingsError } = await supabase
      .from("offerings")
      .update({ currency, updated_at: new Date().toISOString() })
      .eq("organization_id", current._id);
    if (updateOfferingsError) throw new Error(updateOfferingsError.message);
  }

  const { data, error } = await supabase
    .from("organizations")
    .update({
      name: args.name ? requiredTrimmed(args.name, "name", 120) : current.name,
      timezone: timezone ?? current.timezone,
      currency: currency ?? current.currency,
      locale: locale ?? current.locale,
      terminology: terminology ?? current.terminology,
      updated_at: new Date().toISOString(),
    })
    .eq("id", current._id)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return viewOrganization(data as OrganizationRow, context.role ?? "owner");
}