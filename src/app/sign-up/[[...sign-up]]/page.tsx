import { redirect } from "next/navigation";

import { SignUpPanel } from "@/components/auth/sign-up-panel";
import { getAppAuthSession } from "@/lib/auth/require-app-session";
import { AuthShell } from "@/components/auth-shell";

type SignUpPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const { error } = await searchParams;

  const session = await getAppAuthSession();
  if (session.userId) {
    redirect("/app");
  }

  return (
    <AuthShell>
      <SignUpPanel signInUrl="/sign-in" error={error} />
    </AuthShell>
  );
}