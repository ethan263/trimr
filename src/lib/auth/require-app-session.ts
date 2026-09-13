import "server-only";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

/**
 * Read the Supabase session for `/app` routes.
 *
 * Returns the authenticated user (id + email). Workspaces are resolved from
 * organization_memberships / organizations.owner_user_id, not from a JWT org
 * claim.
 */
export async function getAppAuthSession() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    return { userId: null as string | null, email: null as string | null };
  }
  return {
    userId: user.id as string,
    email: user.email ?? (null as string | null),
  };
}

/**
 * Require a signed-in session for `/app` routes.
 */
export async function requireAppSession() {
  const session = await getAppAuthSession();
  if (!session.userId) {
    redirect("/sign-in");
  }
  return session;
}
