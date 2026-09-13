"use client";

import { useEffect, useState, useCallback } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

/**
 * Hook that provides the current Supabase auth session and user.
 * Listens for auth state changes (sign in, sign out, token refresh).
 *
 * Usage:
 *   const { session, user, loading, signOut } = useAuth();
 */
export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setLoading(false);
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    window.location.href = "/sign-in";
  }, [supabase]);

  return {
    session,
    user: session?.user ?? null,
    loading,
    signOut,
    isAuthenticated: !!session?.user,
  };
}