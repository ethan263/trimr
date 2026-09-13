import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import { Brand } from "@/components/brand";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { getAppAuthSession } from "@/lib/auth/require-app-session";
import { Button } from "@/components/ui/button";

const includedFeatures = [
  "AI receptionist — text and voice concierge",
  "Online booking, team scheduling, and messaging",
  "Public site with your own branding",
  "Real-time availability and bookings",
];

export default async function PricingPage() {
  const { userId } = await getAppAuthSession();

  return (
    <main className="min-h-dvh bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex h-18 max-w-350 items-center px-5 sm:px-8 lg:px-12">
          <Brand />
          <Button asChild variant="ghost" size="sm" className="ml-auto gap-2">
            <Link href={userId ? "/app" : "/"}>
              <ArrowLeft className="size-3.5" /> {userId ? "Workspace" : "Home"}
            </Link>
          </Button>
        </div>
      </header>

      <section className="mx-auto max-w-350 px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
        <div className="mb-14 max-w-3xl">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
            One plan — everything included
          </p>
          <h1 className="mt-5 font-heading text-6xl font-medium leading-[0.92] tracking-[-0.055em] sm:text-7xl">
            Run the desk for free. Add AI where it matters.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground">
            Everything is included. No plans, no paywalls, no billing.
          </p>
        </div>

        <div className="grid border border-border lg:grid-cols-2">
          <article className="flex min-h-102.5 flex-col border-b border-r bg-primary p-8 text-primary-foreground lg:border-b-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] opacity-60">
              Everything
            </p>
            <p className="mt-8 font-heading text-6xl tracking-[-0.06em]">
              R0
              <span className="ml-1 font-sans text-xs tracking-normal opacity-60">
                / forever, in preview
              </span>
            </p>
            <p className="mt-4 text-sm leading-6 opacity-65">
              All features are unlocked for every workspace — no plans, no
              paywalls, no billing.
            </p>
            <div className="mt-8 space-y-3 border-t border-current/15 pt-6">
              {includedFeatures.map((feature) => (
                <p key={feature} className="flex items-center gap-2 text-sm">
                  <Check className="size-3.5" /> {feature}
                </p>
              ))}
            </div>
            <Button
              asChild
              variant="secondary"
              className="mt-auto shadow-none"
            >
              <Link href={userId ? "/app" : "/sign-up"}>
                {userId ? "Open workspace" : "Get started"}
              </Link>
            </Button>
          </article>
        </div>

        {userId ? (
          <p className="mt-8 text-center text-sm text-muted-foreground">
            Your workspace includes everything.
          </p>
        ) : (
          <p className="mt-5 text-center text-xs text-muted-foreground">
            Create your account to start using the desk.
          </p>
        )}
      </section>

      <MarketingFooter />
    </main>
  );
}
