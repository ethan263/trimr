import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Supabase auth callback — handles email confirmation links and OAuth redirects.
 * Exchanges the auth code for a session and redirects to the app.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/app";
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // Handle error callbacks from Supabase
  if (error) {
    const message = errorDescription ?? error;
    return NextResponse.redirect(
      `${origin}/sign-in?error=${encodeURIComponent(message)}`,
    );
  }

  if (code) {
    const supabase = await createClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (!exchangeError) {
      // Successfully authenticated — redirect to app
      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
    // Code exchange failed
    return NextResponse.redirect(
      `${origin}/sign-in?error=${encodeURIComponent(exchangeError.message)}`,
    );
  }

  // No code parameter — invalid callback
  return NextResponse.redirect(
    `${origin}/sign-in?error=${encodeURIComponent("Invalid authentication link. Please try signing in again.")}`,
  );
}