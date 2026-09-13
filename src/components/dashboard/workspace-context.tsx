"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  defaultTerminology,
  normalizeTerminology,
  type Organization,
  type Terminology,
} from "@/components/dashboard/data";
import {
  bootstrapCurrentOrganizationAction,
  fetchCurrentOrganizationAction,
} from "@/app/actions/organizations";
import { createClient } from "@/lib/supabase/client";

type WorkspaceContextValue = {
  orgSlug: string;
  organization: Organization | null;
  terminology: Terminology;
  isBootstrapping: boolean;
  bootstrapError: string | null;
  refreshOrganization: () => Promise<void>;
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({
  children,
  orgSlug,
  initialOrganization,
}: {
  children: ReactNode;
  orgSlug: string;
  initialOrganization?: Organization | null;
}) {
  const [user, setUser] = useState<{ fullName: string | null; firstName: string | null } | null>(null);
  const [organization, setOrganization] = useState<Organization | null | undefined>(
    () => (initialOrganization === undefined ? undefined : initialOrganization),
  );
  const [isCreating, setIsCreating] = useState(false);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const requestedBootstrap = useRef(false);
  const hadOrganization = useRef(Boolean(initialOrganization));
  const loadedOrgSlug = useRef<string | null>(
    initialOrganization ? orgSlug : null,
  );
  const prevOrgSlugRef = useRef(orgSlug);

  const refreshOrganization = useCallback(async () => {
    const current = await fetchCurrentOrganizationAction(orgSlug);
    setOrganization(current);
  }, [orgSlug]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user ? { fullName: user.user_metadata.full_name ?? null, firstName: user.user_metadata.first_name ?? null } : null);
    });
  }, []);

  useEffect(() => {
    if (organization) {
      hadOrganization.current = true;
    }
  }, [organization]);

  useEffect(() => {
    const slugChanged = prevOrgSlugRef.current !== orgSlug;
    if (slugChanged) {
      requestedBootstrap.current = false;
      prevOrgSlugRef.current = orgSlug;
    }

    if (loadedOrgSlug.current === orgSlug && hadOrganization.current) {
      return;
    }

    let cancelled = false;
    setBootstrapError(null);
    void fetchCurrentOrganizationAction(orgSlug)
      .then((current) => {
        if (!cancelled) {
          setOrganization(current);
          if (current) {
            loadedOrgSlug.current = orgSlug;
            hadOrganization.current = true;
          }
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setOrganization(null);
          setBootstrapError(
            error instanceof Error ? error.message : "Failed to load business.",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [orgSlug]);

  useEffect(() => {
    if (organization !== null || requestedBootstrap.current) {
      return;
    }

    requestedBootstrap.current = true;
    setIsCreating(true);
    setBootstrapError(null);
    void bootstrapCurrentOrganizationAction({
      name: user?.fullName?.trim() || user?.firstName?.trim() || undefined,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      locale: navigator.language,
    })
      .then((created) => {
        setOrganization(created);
        setBootstrapError(null);
        loadedOrgSlug.current = orgSlug;
        hadOrganization.current = true;
      })
      .catch((error) => {
        requestedBootstrap.current = false;
        setBootstrapError(
          error instanceof Error
            ? error.message
            : "Failed to set up business.",
        );
      })
      .finally(() => setIsCreating(false));
  }, [organization, orgSlug, user?.firstName, user?.fullName]);

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      orgSlug,
      organization: organization ?? null,
      terminology: organization
        ? normalizeTerminology(organization.terminology)
        : defaultTerminology,
      isBootstrapping:
        (organization === undefined && !hadOrganization.current) || isCreating,
      bootstrapError,
      refreshOrganization,
    }),
    [bootstrapError, isCreating, organization, orgSlug, refreshOrganization],
  );

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const value = useContext(WorkspaceContext);
  if (!value) {
    throw new Error("useWorkspace must be used inside WorkspaceProvider");
  }
  return value;
}

/** True when org row is loaded and bootstrap finished — safe to run server actions. */
export function useWorkspaceReady() {
  const { organization, isBootstrapping } = useWorkspace();
  return Boolean(organization?._id) && !isBootstrapping;
}