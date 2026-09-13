import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { Brand } from "@/components/brand";

export default async function ConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  return (
    <main className="flex min-h-dvh flex-col bg-background">
      <header className="flex items-center justify-between px-6 py-5 sm:px-10">
        <Brand />
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          Back
        </Link>
      </header>
      <div className="flex flex-1 items-center justify-center px-6 pb-[max(4rem,env(safe-area-inset-bottom))] pt-2 sm:px-10">
        <div className="w-full max-w-[440px] text-center">
          <div className="mx-auto mb-6 grid size-16 place-items-center rounded-2xl border border-black/10 bg-[#f7f5ef]">
            <Mail className="size-7 text-foreground" />
          </div>

          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Check your email
          </h1>

          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            We sent a confirmation link to{" "}
            {email ? (
              <span className="font-medium text-foreground">{email}</span>
            ) : (
              "your email address"
            )}
            . Click the link to activate your account and open your workspace.
          </p>

          <div className="mt-8 rounded-xl border border-black/10 bg-white p-5 text-left text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Next steps</p>
            <ul className="mt-3 space-y-2">
              <li className="flex items-start gap-2">
                <span className="mt-1 size-1.5 shrink-0 rounded-full bg-emerald-500" />
                Open the email from flippinCalendar and click the confirmation link.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 size-1.5 shrink-0 rounded-full bg-emerald-500" />
                You will be signed in and taken to your workspace automatically.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 size-1.5 shrink-0 rounded-full bg-emerald-500" />
                Check your spam folder if you do not see the email within a minute.
              </li>
            </ul>
          </div>

          <div className="mt-8 flex flex-col items-center gap-3">
            <Link
              href="/sign-in"
              className="text-sm font-medium text-primary hover:underline"
            >
              Already confirmed? Sign in
            </Link>
            <Link
              href="/"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Back to home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}