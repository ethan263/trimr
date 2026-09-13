"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export async function signInAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect(`/sign-in?error=${encodeURIComponent("Email and password are required.")}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    // Provide user-friendly error messages
    let message = error.message;
    if (error.message.includes("Invalid login credentials")) {
      message = "Incorrect email or password. Please try again.";
    } else if (error.message.includes("Email not confirmed")) {
      message = "Please confirm your email address before signing in. Check your inbox for the confirmation link.";
    }
    redirect(`/sign-in?error=${encodeURIComponent(message)}`);
  }
  redirect("/app");
}

export async function signUpAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? "").trim();

  if (!email || !password) {
    redirect(`/sign-up?error=${encodeURIComponent("Email and password are required.")}`);
  }

  if (password.length < 8) {
    redirect(`/sign-up?error=${encodeURIComponent("Password must be at least 8 characters.")}`);
  }

  const supabase = await createClient();

  // Build the callback URL for email confirmation
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      data: {
        full_name: name || undefined,
      },
    },
  });

  if (error) {
    let message = error.message;
    if (error.message.includes("already registered")) {
      message = "An account with this email already exists. Try signing in instead.";
    }
    redirect(`/sign-up?error=${encodeURIComponent(message)}`);
  }

  // If user was created but needs email confirmation, show confirmation screen
  if (data.user && !data.session) {
    redirect(`/auth/confirm?email=${encodeURIComponent(email)}`);
  }

  // If session exists immediately (email confirmation disabled), go to app
  redirect("/app");
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/sign-in");
}

export async function resendConfirmationAction(email: string) {
  const supabase = await createClient();
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }
  return { success: true };
}