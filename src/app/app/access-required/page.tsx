import { redirect } from "next/navigation";

import { requireAppSession } from "@/lib/auth/require-app-session";
import { listAccessibleWorkspaces } from "@/lib/data/organizations";
import { isWorkspaceOperator } from "@/lib/rbac";

export default async function AccessRequiredPage() {
  const session = await requireAppSession();
  const firstWorkspace = await listAccessibleWorkspaces(session.userId!)
    .then((ws) => ws.find((w) => isWorkspaceOperator({ mode: w.mode, role: w.role })))
    .catch(() => null);
  if (firstWorkspace) {
    redirect(`/app/${firstWorkspace.slug}`);
  }
  redirect("/app");

  return null;
}