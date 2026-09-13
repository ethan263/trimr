"use client";

import Link from "next/link";
import { useState } from "react";

import { signUpAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SignUpPanel({
  signInUrl,
  error,
}: {
  signInUrl: string;
  error?: string | null;
}) {
  const [isPending, setIsPending] = useState(false);

  return (
    <div className="w-full rounded-xl border border-black/10 bg-white p-6 shadow-sm sm:p-8">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Create your account
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Start free — no card needed. We will send a confirmation email.
        </p>
      </div>

      {error ? (
        <div
          className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      <form
        action={async (formData) => {
          setIsPending(true);
          await signUpAction(formData);
        }}
        className="space-y-4"
      >
        <div className="space-y-1.5">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" name="name" type="text" autoComplete="name" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
          <p className="text-xs text-muted-foreground">At least 8 characters.</p>
        </div>
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href={signInUrl} className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}