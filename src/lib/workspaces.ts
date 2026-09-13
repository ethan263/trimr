export type WorkspaceMode = "personal" | "organization";

export type AccessibleWorkspace = {
  slug: string;
  name: string;
  mode: WorkspaceMode;
  role: string;
  isBootstrapped: boolean;
};