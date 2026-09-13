import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Brand } from "@/components/brand";
import { getAppAuthSession } from "@/lib/auth/require-app-session";
import { HeroSection } from "@/components/marketing/hero-section";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { Button } from "@/components/ui/button";

function MarketingNav({ signedIn }: { signedIn: boolean }) {
  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/92 backdrop-blur-md">
      <div className="mx-auto flex h-17 max-w-350 items-center px-5 sm:px-8 lg:px-12">
        <Brand />
        <nav className="ml-12 hidden items-center gap-7 text-sm text-muted-foreground md:flex">
          <Link className="transition-colors hover:text-foreground" href="#built-for">
            Built for
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {!signedIn ? (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link href="/sign-in">Sign in</Link>
              </Button>
              <Button asChild size="sm" className="gap-1.5 shadow-none">
                <Link href="/sign-up">
                  Start free <ArrowRight className="size-3.5" />
                </Link>
              </Button>
            </>
          ) : (
            <Button asChild size="sm" className="gap-1.5 shadow-none">
              <Link href="/app">
                Open workspace <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

export default async function Home() {
  const { userId } = await getAppAuthSession();

  return (
    <main className="marketing-home overflow-hidden bg-background">
      <MarketingNav signedIn={Boolean(userId)} />

      <HeroSection />

      <section className="border-t bg-accent">
        <div className="mx-auto flex max-w-350 flex-col items-start gap-8 px-5 py-20 sm:px-8 lg:flex-row lg:items-end lg:justify-between lg:px-12 lg:py-24">
          <div>
            <Sparkles className="size-6 text-primary" />
            <h2 className="mt-6 max-w-3xl font-heading text-5xl font-semibold leading-[0.94] tracking-tighter sm:text-7xl">Give your team time back.</h2>
          </div>
          <Button asChild size="lg" className="h-12 shrink-0 gap-2 rounded-md px-6 shadow-none">
            <Link href="/sign-up">
              Get started <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </section>

      <MarketingFooter />
    </main>
  );
}