"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { AuthChangeEvent, SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | undefined;

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are required.",
    );
  }

  if (!browserClient) {
    browserClient = createBrowserClient(url, publishableKey);
  }
  return browserClient;
}

/**
 * Subscribe to Supabase auth state changes.
 * Returns an unsubscribe function. Use in client components or hooks.
 */
export function onAuthStateChange(
  callback: (
    event: AuthChangeEvent,
    session: import("@supabase/supabase-js").Session | null,
  ) => void,
) {
  const supabase = createClient();
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      callback(event, session);
    },
  );
  return () => subscription.unsubscribe();
}