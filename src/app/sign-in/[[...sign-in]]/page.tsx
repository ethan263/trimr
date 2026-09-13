import { redirect } from "next/navigation";

import { SignInPanel } from "@/components/auth/sign-in-panel";
import { getAppAuthSession } from "@/lib/auth/require-app-session";
import { AuthShell } from "@/components/auth-shell";

type SignInPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const { error } = await searchParams;

  const session = await getAppAuthSession();
  if (session.userId) {
    redirect("/app");
  }

  return (
    <AuthShell>
      <SignInPanel signUpUrl="/sign-up" error={error} />
    </AuthShell>
  );
}