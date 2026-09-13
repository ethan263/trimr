import { redirect } from "next/navigation";

import { SettingsScreen } from "@/components/dashboard/settings-screen";
import {
  isWorkspaceAdmin,
  requireCurrentOrganizationForRouteSlug,
} from "@/lib/data/auth";

type SettingsPageProps = {
  params: Promise<{ orgSlug: string }>;
};

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { orgSlug } = await params;
  const current = await requireCurrentOrganizationForRouteSlug(orgSlug);
  if (!isWorkspaceAdmin(current.auth)) {
    redirect(`/app/${orgSlug}`);
  }

  return <SettingsScreen />;
}
