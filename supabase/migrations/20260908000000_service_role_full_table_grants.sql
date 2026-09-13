-- Ensure the service_role can read/write all app tables regardless of which
-- (non-postgres) role created them. Hosted Supabase normally provisions
-- ALTER DEFAULT PRIVILEGES for service_role, but that is lost when the public
-- schema is dropped and recreated by an external tool, which leaves the admin
-- client with no table privileges.

grant all on all tables in schema public to service_role;
grant all on all routines in schema public to service_role;
grant all on all sequences in schema public to service_role;

-- Re-assert the Data API grants that the rate-limits migration made (default
-- privileges may have been wiped differently depending on applying role).
grant select, insert, update, delete on
  public.organizations,
  public.public_sites,
  public.offerings,
  public.team_members,
  public.availability_rules,
  public.contacts,
  public.bookings,
  public.conversations,
  public.agent_integrations,
  public.knowledge_items,
  public.organization_memberships
to authenticated;

grant select on public.public_sites to anon;