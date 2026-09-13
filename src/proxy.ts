import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const APP_REGEX = /^\/app(?:\/.*)?$/;
const API_APP_REGEX = /^\/api\/app(?:\/.*)?$/;
const AUTH_PATHS = ["/auth/callback", "/auth/confirm"];

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        supabaseResponse = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          supabaseResponse.cookies.set(name, value, options);
        }
      },
    },
  });

  // Refresh session cookies — must happen on every request
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Allow auth callback and confirmation pages through without redirect
  const isAuthPath = AUTH_PATHS.some(
    (authPath) => pathname === authPath || pathname.startsWith(`${authPath}/`),
  );

  if (isAuthPath) {
    return supabaseResponse;
  }

  // Redirect unauthenticated users away from protected /app routes
  if (
    (APP_REGEX.test(pathname) || API_APP_REGEX.test(pathname)) &&
    !user
  ) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/sign-in";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect authenticated users from sign-in/sign-up to app
  if (
    user &&
    (pathname === "/sign-in" || pathname === "/sign-up" || pathname.startsWith("/sign-in/") || pathname.startsWith("/sign-up/"))
  ) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/app";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};