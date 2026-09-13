import { redirect } from "next/navigation";

import { WorkspacePicker } from "@/components/auth/workspace-picker";
import { requireAppSession } from "@/lib/auth/require-app-session";
import {
  bootstrapCurrentOrganization,
  listAccessibleWorkspaces,
} from "@/lib/data/organizations";

export default async function AppIndexPage() {
  const session = await requireAppSession();

  const workspaces = await listAccessibleWorkspaces(session.userId!);

  if (workspaces.length === 0) {
    const workspace = await bootstrapCurrentOrganization({
      timezone: "Africa/Johannesburg",
      locale: "en-ZA",
      currency: "ZAR",
    });
    redirect(`/app/${workspace.slug}`);
  }

  if (workspaces.length === 1) {
    redirect(`/app/${workspaces[0]!.slug}`);
  }

  return <WorkspacePicker workspaces={workspaces} />;
}