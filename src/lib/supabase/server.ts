import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Supabase cookie-based client for server components, route handlers and
 * server actions. Sessions are kept in the `sb-*` cookies maintained by
 * src/proxy.ts middleware; no external identity provider is involved.
 */
export async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are required.",
    );
  }

  const cookieStore = await cookies();

  return createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component; the middleware refreshes the
          // session cookie, so failing to write here is safe to ignore.
        }
      },
    },
  });
}