"use client";

import { useMemo } from "react";

import { createClient } from "@/lib/supabase/client";

/**
 * Browser Supabase client. Sessions are maintained in cookies by the
 * middleware; no explicit token forwarding is needed.
 */
export function useSupabaseClient() {
  return useMemo(() => createClient(), []);
}