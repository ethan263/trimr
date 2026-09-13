-- Supabase native auth workspaces (replaces Clerk org claims).
--
-- Personal workspaces are keyed on Supabase auth.users via organizations
-- .owner_user_id. Team workspaces are modeled with a memberships table.
-- All RLS now derives access from auth.uid() + organization_memberships
-- instead of the Clerk JWT helper functions.

begin;

-- 1. Personal workspace owner (Supabase auth user uuid).
alter table public.organizations
  add column if not exists owner_user_id uuid references auth.users(id) on delete set null;

-- Drop the legacy index that user_scoped_workspaces created under the same
-- name on owner_clerk_user_id so the unique index below lands on owner_user_id.
drop index if exists public.organizations_by_owner_user;

create unique index if not exists organizations_by_owner_user
  on public.organizations (owner_user_id)
  where owner_user_id is not null;

-- 2. Team memberships.
create table if not exists public.organization_memberships (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'operator', 'member')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create index if not exists organization_memberships_by_user
  on public.organization_memberships (user_id);

alter table public.organization_memberships enable row level security;

-- 3. Access helpers. security definer + locked search_path so the RLS
-- subqueries do not re-enter RLS on organization_memberships.
create or replace function public.can_access_organization(p_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    p_org_id is not null
    and auth.uid() is not null
    and (
      exists (
        select 1 from public.organizations o
        where o.id = p_org_id and o.owner_user_id = auth.uid()
      )
      or exists (
        select 1 from public.organization_memberships m
        where m.organization_id = p_org_id and m.user_id = auth.uid()
      )
    );
$$;

create or replace function public.can_manage_organization(p_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    p_org_id is not null
    and auth.uid() is not null
    and (
      exists (
        select 1 from public.organizations o
        where o.id = p_org_id and o.owner_user_id = auth.uid()
      )
      or exists (
        select 1 from public.organization_memberships m
        where m.organization_id = p_org_id and m.user_id = auth.uid()
          and m.role in ('owner', 'admin')
    )
  );
$$;

-- 4. Rewrite organizations policies.
drop policy if exists "organizations_select_member" on public.organizations;
create policy "organizations_select_member"
  on public.organizations for select
  to authenticated
  using (public.can_access_organization(id));

drop policy if exists "organizations_insert_admin" on public.organizations;
create policy "organizations_insert_admin"
  on public.organizations for insert
  to authenticated
  with check (owner_user_id = auth.uid());

drop policy if exists "organizations_update_admin" on public.organizations;
create policy "organizations_update_admin"
  on public.organizations for update
  to authenticated
  using (public.can_manage_organization(id))
  with check (public.can_manage_organization(id));

-- 5. Rewrite child-table policies to membership-based access.
drop policy if exists "public_sites_org_access" on public.public_sites;
create policy "public_sites_org_access"
  on public.public_sites for all
  to authenticated
  using (public.can_access_organization(organization_id))
  with check (public.can_access_organization(organization_id));

drop policy if exists "offerings_org_access" on public.offerings;
create policy "offerings_org_access"
  on public.offerings for all
  to authenticated
  using (public.can_access_organization(organization_id))
  with check (public.can_access_organization(organization_id));

drop policy if exists "team_members_org_access" on public.team_members;
create policy "team_members_org_access"
  on public.team_members for all
  to authenticated
  using (public.can_access_organization(organization_id))
  with check (public.can_access_organization(organization_id));

drop policy if exists "availability_rules_org_access" on public.availability_rules;
create policy "availability_rules_org_access"
  on public.availability_rules for all
  to authenticated
  using (public.can_access_organization(organization_id))
  with check (public.can_access_organization(organization_id));

drop policy if exists "contacts_org_access" on public.contacts;
create policy "contacts_org_access"
  on public.contacts for all
  to authenticated
  using (public.can_access_organization(organization_id))
  with check (public.can_access_organization(organization_id));

drop policy if exists "bookings_org_access" on public.bookings;
create policy "bookings_org_access"
  on public.bookings for all
  to authenticated
  using (public.can_access_organization(organization_id))
  with check (public.can_access_organization(organization_id));

drop policy if exists "conversations_org_access" on public.conversations;
create policy "conversations_org_access"
  on public.conversations for all
  to authenticated
  using (public.can_access_organization(organization_id))
  with check (public.can_access_organization(organization_id));

drop policy if exists "agent_integrations_org_access" on public.agent_integrations;
create policy "agent_integrations_org_access"
  on public.agent_integrations for all
  to authenticated
  using (public.can_access_organization(organization_id))
  with check (public.can_access_organization(organization_id));

drop policy if exists "knowledge_items_org_access" on public.knowledge_items;
create policy "knowledge_items_org_access"
  on public.knowledge_items for all
  to authenticated
  using (public.can_access_organization(organization_id))
  with check (public.can_access_organization(organization_id));

-- 6. Memberships policies: members can read their orgs; only owner/admin can
-- manage (add / change roles / remove) members.
drop policy if exists "organization_memberships_select" on public.organization_memberships;
create policy "organization_memberships_select"
  on public.organization_memberships for select
  to authenticated
  using (public.can_access_organization(organization_id));

drop policy if exists "organization_memberships_write" on public.organization_memberships;
create policy "organization_memberships_write"
  on public.organization_memberships for all
  to authenticated
  using (public.can_manage_organization(organization_id))
  with check (public.can_manage_organization(organization_id));

grant select, insert, update, delete on public.organization_memberships to authenticated;
grant usage on schema public to authenticated;

-- 7. SECURITY DEFINER helpers: revoke the default PUBLIC execute and allow only
-- the authenticated role (required so RLS policy evaluation can call them).
revoke all on function public.can_access_organization(uuid) from public;
revoke all on function public.can_manage_organization(uuid) from public;
grant execute on function public.can_access_organization(uuid) to authenticated;
grant execute on function public.can_manage_organization(uuid) to authenticated;

-- 8. Drop the Clerk claim helpers now that nothing references them.
drop function if exists public.current_clerk_org_id();
drop function if exists public.current_clerk_user_id();
drop function if exists public.current_clerk_org_role();

commit;