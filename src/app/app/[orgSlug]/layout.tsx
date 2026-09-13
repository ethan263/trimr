import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell/app-shell";
import { requireAppSession } from "@/lib/auth/require-app-session";
import {
  requireCurrentOrganizationForRouteSlug,
  isWorkspaceOperator,
} from "@/lib/data/auth";
import { getOrganizationForRouteSlug } from "@/lib/data/organizations";

export default async function OrganizationLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ orgSlug: string }>;
}) {
  await requireAppSession();
  const { orgSlug: routeOrgSlug } = await params;

  try {
    const current = await requireCurrentOrganizationForRouteSlug(routeOrgSlug);
    if (!isWorkspaceOperator(current.auth)) {
      redirect("/app/access-required");
    }
  } catch {
    redirect("/app/access-required");
  }

  const initialOrganization = await getOrganizationForRouteSlug(routeOrgSlug).catch(
    () => null,
  );

  return (
    <AppShell orgSlug={routeOrgSlug} initialOrganization={initialOrganization}>
      {children}
    </AppShell>
  );
}