"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";

import { useWorkspace } from "@/components/dashboard/workspace-context";

export type EntitlementsState = {
  isLoaded: boolean;
  webAgent: boolean;
  browserVoice: boolean;
  advancedAnalytics: boolean;
  hasAiAgent: boolean;
};

const allFeatures: Omit<EntitlementsState, "isLoaded"> = {
  webAgent: true,
  browserVoice: true,
  advancedAnalytics: true,
  hasAiAgent: true,
};

type EntitlementsContextValue = {
  entitlements: EntitlementsState;
  refreshEntitlements: () => Promise<EntitlementsState>;
};

const EntitlementsContext = createContext<EntitlementsContextValue | null>(null);

/**
 * All features are unlocked for every authenticated workspace. This provider
 * exists only to preserve the component API surface; the underlying billing
 * and plan gates have been removed.
 */
export function EntitlementsProvider({ children }: { children: ReactNode }) {
  useWorkspace(); // ensure provider is only mounted inside a workspace
  const value = useMemo<EntitlementsContextValue>(
    () => ({
      entitlements: { isLoaded: true, ...allFeatures },
      refreshEntitlements: async () => ({ isLoaded: true, ...allFeatures }),
    }),
    [],
  );

  return (
    <EntitlementsContext.Provider value={value}>
      {children}
    </EntitlementsContext.Provider>
  );
}

function useEntitlementsContext() {
  const value = useContext(EntitlementsContext);
  if (!value) {
    throw new Error(
      "useFeatureEntitlements must be used inside EntitlementsProvider",
    );
  }
  return value;
}

export function useFeatureEntitlements() {
  return useEntitlementsContext().entitlements;
}

export function useRefreshEntitlements() {
  return useEntitlementsContext().refreshEntitlements;
}