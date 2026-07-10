-- ============================================================================
--  Nyx — database schema (Supabase / Postgres)
--  Run this once: Supabase → SQL Editor → New query → paste all → Run.
--  Safe to re-run. No dependency on triggers over auth.users.
-- ============================================================================

-- ----------------------------------------------------------------------------
--  Tables
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  name       text not null default 'New user',
  handle     text unique,
  bio        text not null default '',
  status     text not null default '',
  hue        int  not null default 264,
  presence   text not null default 'online',
  approved   boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.invites (
  code       text primary key,
  created_by uuid references auth.users(id) on delete set null,
  used_by    uuid references auth.users(id) on delete set null,
  used_at    timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.conversations (
  id         uuid primary key default gen_random_uuid(),
  is_group   boolean not null default false,
  title      text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.conversation_members (
  conversation_id uuid references public.conversations(id) on delete cascade,
  user_id         uuid references auth.users(id) on delete cascade,
  joined_at       timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create table if not exists public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  author_id       uuid not null references auth.users(id) on delete cascade,
  kind            text not null default 'text',
  body            text,
  attachment      jsonb,
  voice           jsonb,
  created_at      timestamptz not null default now()
);

create index if not exists messages_conversation_idx on public.messages (conversation_id, created_at);

-- ----------------------------------------------------------------------------
--  Helpers
-- ----------------------------------------------------------------------------
create or replace function public.is_conversation_member(cid uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.conversation_members
    where conversation_id = cid and user_id = auth.uid()
  );
$$;

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- Redeem an invite: creates/updates the caller's profile and approves it.
create or replace function public.redeem_invite(p_code text, p_name text, p_handle text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_used uuid;
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;

  select used_by into v_used from public.invites where code = p_code for update;
  if not found then
    raise exception 'Invalid invite code';
  end if;
  if v_used is not null then
    raise exception 'This invite code has already been used';
  end if;
  if exists (select 1 from public.profiles where handle = p_handle and id <> auth.uid()) then
    raise exception 'That handle is already taken';
  end if;

  update public.invites set used_by = auth.uid(), used_at = now() where code = p_code;

  insert into public.profiles (id, name, handle, approved)
  values (auth.uid(), p_name, p_handle, true)
  on conflict (id) do update
    set name = excluded.name, handle = excluded.handle, approved = true;
end;
$$;

-- Approved users can mint a new invite code for a friend.
create or replace function public.create_invite()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and approved) then
    raise exception 'Not allowed';
  end if;
  v_code := 'NYX-' || upper(substr(md5(gen_random_uuid()::text), 1, 6));
  insert into public.invites (code, created_by) values (v_code, auth.uid());
  return v_code;
end;
$$;

-- ----------------------------------------------------------------------------
--  Row Level Security
-- ----------------------------------------------------------------------------
alter table public.profiles             enable row level security;
alter table public.invites              enable row level security;
alter table public.conversations        enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages             enable row level security;

drop policy if exists "profiles readable by authed" on public.profiles;
create policy "profiles readable by authed" on public.profiles
  for select using (auth.role() = 'authenticated');

drop policy if exists "update own profile" on public.profiles;
create policy "update own profile" on public.profiles
  for update using (id = auth.uid());

drop policy if exists "invites: see own" on public.invites;
create policy "invites: see own" on public.invites
  for select using (created_by = auth.uid() or used_by = auth.uid());

drop policy if exists "conversations: members read" on public.conversations;
create policy "conversations: members read" on public.conversations
  for select using (public.is_conversation_member(id));

drop policy if exists "conversations: create" on public.conversations;
create policy "conversations: create" on public.conversations
  for insert with check (created_by = auth.uid());

drop policy if exists "members: read own convos" on public.conversation_members;
create policy "members: read own convos" on public.conversation_members
  for select using (public.is_conversation_member(conversation_id));

drop policy if exists "members: add" on public.conversation_members;
create policy "members: add" on public.conversation_members
  for insert with check (
    user_id = auth.uid() or public.is_conversation_member(conversation_id)
  );

drop policy if exists "messages: members read" on public.messages;
create policy "messages: members read" on public.messages
  for select using (public.is_conversation_member(conversation_id));

drop policy if exists "messages: members send" on public.messages;
create policy "messages: members send" on public.messages
  for insert with check (
    author_id = auth.uid() and public.is_conversation_member(conversation_id)
  );

-- ----------------------------------------------------------------------------
--  Realtime
-- ----------------------------------------------------------------------------
do $$
begin
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object then null;
end $$;

-- ----------------------------------------------------------------------------
--  Storage (photos, files, voice notes)
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

drop policy if exists "media: authed upload" on storage.objects;
create policy "media: authed upload" on storage.objects
  for insert to authenticated with check (bucket_id = 'media');

drop policy if exists "media: public read" on storage.objects;
create policy "media: public read" on storage.objects
  for select using (bucket_id = 'media');

-- ----------------------------------------------------------------------------
--  Seed invite codes (use NYX-FOUNDER for your first account)
-- ----------------------------------------------------------------------------
insert into public.invites (code) values
  ('NYX-FOUNDER'),
  ('NYX-FRIEND-1'),
  ('NYX-FRIEND-2'),
  ('NYX-FRIEND-3'),
  ('NYX-FRIEND-4'),
  ('NYX-FRIEND-5')
on conflict (code) do nothing;

-- Refresh PostgREST's schema cache so the new functions are callable immediately.
notify pgrst, 'reload schema';
