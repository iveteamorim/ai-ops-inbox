-- Novua Inbox core schema (v1)
-- Apply in Supabase SQL editor or migrations once backend connection is enabled.

create extension if not exists pgcrypto;

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  plan text not null default 'trial',
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  full_name text,
  role text not null default 'agent' check (role in ('owner', 'admin', 'agent')),
  created_at timestamptz not null default now()
);

create table if not exists public.channels (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  type text not null check (type in ('whatsapp', 'email', 'form')),
  external_account_id text,
  is_active boolean not null default true,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (type, external_account_id)
);

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text,
  phone text,
  email text,
  external_ref text,
  created_at timestamptz not null default now(),
  unique (company_id, phone)
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  channel text not null check (channel in ('whatsapp', 'email', 'form')),
  status text not null default 'new' check (status in ('new', 'active', 'won', 'lost', 'no_response')),
  assigned_to uuid references public.profiles(id),
  estimated_value numeric(12,2) not null default 0,
  expected_value numeric(12,2) not null default 0,
  ai_priority text not null default 'medium' check (ai_priority in ('high', 'medium', 'low')),
  last_message_at timestamptz,
  last_inbound_at timestamptz,
  last_outbound_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.conversations
  add column if not exists estimated_value numeric(12,2) not null default 0,
  add column if not exists expected_value numeric(12,2) not null default 0,
  add column if not exists ai_priority text not null default 'medium';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'conversations_ai_priority_check'
  ) then
    alter table public.conversations
      add constraint conversations_ai_priority_check
      check (ai_priority in ('high', 'medium', 'low'));
  end if;
end
$$;

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  direction text not null check (direction in ('inbound', 'outbound')),
  sender_type text not null check (sender_type in ('customer', 'agent', 'system')),
  channel text not null check (channel in ('whatsapp', 'email', 'form')),
  external_id text,
  text text,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (channel, external_id)
);

create table if not exists public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  external_id text,
  company_id uuid references public.companies(id) on delete set null,
  payload jsonb not null,
  status text not null default 'received' check (status in ('received', 'processed', 'ignored', 'failed')),
  error text,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  unique (source, external_id)
);

create table if not exists public.setup_requests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  channel text not null check (channel in ('whatsapp', 'email', 'form')),
  status text not null default 'requested' check (status in ('requested', 'in_progress', 'completed', 'cancelled')),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_profiles_company on public.profiles (company_id);
create index if not exists idx_channels_company on public.channels (company_id, type, is_active);
create index if not exists idx_contacts_company on public.contacts (company_id);
create index if not exists idx_conversations_company_status on public.conversations (company_id, status, last_message_at desc);
create index if not exists idx_messages_conversation_created on public.messages (conversation_id, created_at desc);
create index if not exists idx_webhook_events_source_status on public.webhook_events (source, status, received_at desc);
create index if not exists idx_setup_requests_company_created on public.setup_requests (company_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_conversations_updated_at on public.conversations;
create trigger trg_conversations_updated_at
before update on public.conversations
for each row
execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  created_company_id uuid;
  metadata_company_id uuid;
  company_name text;
  full_name text;
  user_role text;
begin
  begin
    metadata_company_id := nullif(new.raw_user_meta_data ->> 'company_id', '')::uuid;
  exception
    when others then
      metadata_company_id := null;
  end;

  company_name := nullif(trim(coalesce(new.raw_user_meta_data ->> 'company_name', '')), '');
  full_name := nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), '');
  user_role := nullif(trim(coalesce(new.raw_user_meta_data ->> 'role', '')), '');

  if user_role is null or user_role not in ('owner', 'admin', 'agent') then
    user_role := case when metadata_company_id is null then 'owner' else 'agent' end;
  end if;

  if metadata_company_id is not null then
    created_company_id := metadata_company_id;
  else
    if company_name is null then
      company_name := initcap(split_part(coalesce(new.email, 'novua'), '@', 1));
    end if;

    insert into public.companies (name)
    values (company_name)
    returning id into created_company_id;
  end if;

  insert into public.profiles (id, company_id, full_name, role)
  values (new.id, created_company_id, full_name, user_role)
  on conflict (id) do update
    set company_id = excluded.company_id,
        full_name = coalesce(excluded.full_name, public.profiles.full_name),
        role = excluded.role;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

-- Enable RLS once real auth is connected.
alter table public.profiles enable row level security;
alter table public.channels enable row level security;
alter table public.contacts enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.webhook_events enable row level security;
alter table public.setup_requests enable row level security;

-- Baseline RLS policy: users can only read/write their own company records.
drop policy if exists "profiles_select_own_company" on public.profiles;
create policy "profiles_select_own_company" on public.profiles
for select
using (company_id = (select p.company_id from public.profiles p where p.id = auth.uid()));

drop policy if exists "channels_rw_own_company" on public.channels;
create policy "channels_rw_own_company" on public.channels
for all
using (company_id = (select p.company_id from public.profiles p where p.id = auth.uid()))
with check (company_id = (select p.company_id from public.profiles p where p.id = auth.uid()));

drop policy if exists "contacts_rw_own_company" on public.contacts;
create policy "contacts_rw_own_company" on public.contacts
for all
using (company_id = (select p.company_id from public.profiles p where p.id = auth.uid()))
with check (company_id = (select p.company_id from public.profiles p where p.id = auth.uid()));

drop policy if exists "conversations_rw_own_company" on public.conversations;
create policy "conversations_rw_own_company" on public.conversations
for all
using (company_id = (select p.company_id from public.profiles p where p.id = auth.uid()))
with check (company_id = (select p.company_id from public.profiles p where p.id = auth.uid()));

drop policy if exists "messages_rw_own_company" on public.messages;
create policy "messages_rw_own_company" on public.messages
for all
using (company_id = (select p.company_id from public.profiles p where p.id = auth.uid()))
with check (company_id = (select p.company_id from public.profiles p where p.id = auth.uid()));

drop policy if exists "webhook_events_read_own_company" on public.webhook_events;
create policy "webhook_events_read_own_company" on public.webhook_events
for select
using (company_id = (select p.company_id from public.profiles p where p.id = auth.uid()));

drop policy if exists "setup_requests_rw_own_company" on public.setup_requests;
create policy "setup_requests_rw_own_company" on public.setup_requests
for all
using (company_id = (select p.company_id from public.profiles p where p.id = auth.uid()))
with check (
  company_id = (select p.company_id from public.profiles p where p.id = auth.uid())
  and user_id = auth.uid()
);
