-- ============================================================================
--  Nyx — migration 2: receipts, friends, avatars, device-side media
--  Run once in Supabase → SQL Editor → New query → paste all → Run.
--  Safe to re-run.
-- ============================================================================

-- ----------------------------------------------------------------------------
--  Columns
-- ----------------------------------------------------------------------------
alter table public.messages add column if not exists delivered_at timestamptz;
alter table public.messages add column if not exists read_at timestamptz;
alter table public.profiles add column if not exists avatar_url text;

-- ----------------------------------------------------------------------------
--  Friend requests (a pair is "contacts" when a request is accepted)
-- ----------------------------------------------------------------------------
create table if not exists public.friend_requests (
  id         uuid primary key default gen_random_uuid(),
  from_id    uuid not null references auth.users(id) on delete cascade,
  to_id      uuid not null references auth.users(id) on delete cascade,
  status     text not null default 'pending', -- pending | accepted | declined
  created_at timestamptz not null default now(),
  unique (from_id, to_id)
);

alter table public.friend_requests enable row level security;

drop policy if exists "requests: mine" on public.friend_requests;
create policy "requests: mine" on public.friend_requests
  for select using (from_id = auth.uid() or to_id = auth.uid());

drop policy if exists "requests: send" on public.friend_requests;
create policy "requests: send" on public.friend_requests
  for insert with check (from_id = auth.uid() and to_id <> auth.uid());

drop policy if exists "requests: respond" on public.friend_requests;
create policy "requests: respond" on public.friend_requests
  for update using (to_id = auth.uid());

-- Are two users connected (accepted friends OR share a conversation)?
create or replace function public.are_connected(other uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.friend_requests
    where status = 'accepted'
      and ((from_id = auth.uid() and to_id = other)
        or (from_id = other and to_id = auth.uid()))
  ) or exists (
    select 1
    from public.conversation_members a
    join public.conversation_members b using (conversation_id)
    where a.user_id = auth.uid() and b.user_id = other
  );
$$;

-- Tighten profile visibility: self + connections only (no public directory).
drop policy if exists "profiles readable by authed" on public.profiles;
drop policy if exists "profiles: self or connected" on public.profiles;
create policy "profiles: self or connected" on public.profiles
  for select using (id = auth.uid() or public.are_connected(id));

-- Exact-handle lookup (the ONLY way to discover a stranger).
create or replace function public.find_by_handle(p_handle text)
returns table (id uuid, name text, handle text, hue int, avatar_url text, bio text)
language sql
security definer
set search_path = public
as $$
  select id, name, handle, hue, avatar_url, bio
  from public.profiles
  where approved and lower(handle) = lower(trim(p_handle))
  limit 1;
$$;

create or replace function public.send_friend_request(p_handle text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_to uuid;
begin
  select id into v_to from public.profiles
   where approved and lower(handle) = lower(trim(p_handle));
  if v_to is null then raise exception 'No user with that handle'; end if;
  if v_to = auth.uid() then raise exception 'That is your own handle'; end if;
  if exists (select 1 from public.friend_requests
             where status in ('pending','accepted')
               and ((from_id = auth.uid() and to_id = v_to)
                 or (from_id = v_to and to_id = auth.uid()))) then
    raise exception 'A request already exists between you two';
  end if;
  -- Clear an old declined pair so people can retry.
  delete from public.friend_requests
   where status = 'declined'
     and ((from_id = auth.uid() and to_id = v_to)
       or (from_id = v_to and to_id = auth.uid()));
  insert into public.friend_requests (from_id, to_id) values (auth.uid(), v_to);
end;
$$;

create or replace function public.respond_friend_request(p_id uuid, p_accept boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.friend_requests
     set status = case when p_accept then 'accepted' else 'declined' end
   where id = p_id and to_id = auth.uid() and status = 'pending';
  if not found then raise exception 'Request not found'; end if;
end;
$$;

-- ----------------------------------------------------------------------------
--  Delivery / read receipts
-- ----------------------------------------------------------------------------
create or replace function public.mark_delivered(p_ids uuid[])
returns void
language sql
security definer
set search_path = public
as $$
  update public.messages
     set delivered_at = now()
   where id = any(p_ids)
     and delivered_at is null
     and author_id <> auth.uid()
     and public.is_conversation_member(conversation_id);
$$;

create or replace function public.mark_read(p_cid uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.messages
     set read_at = now(), delivered_at = coalesce(delivered_at, now())
   where conversation_id = p_cid
     and read_at is null
     and author_id <> auth.uid()
     and public.is_conversation_member(p_cid);
$$;

-- ----------------------------------------------------------------------------
--  Device-side media: strip the server copy once the recipient has it
-- ----------------------------------------------------------------------------
create or replace function public.scrub_media(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_msg public.messages;
  v_path text;
begin
  select * into v_msg from public.messages where id = p_id;
  if not found then return; end if;
  if v_msg.author_id = auth.uid() or not public.is_conversation_member(v_msg.conversation_id) then
    return;
  end if;
  v_path := coalesce(v_msg.attachment->>'path', v_msg.voice->>'path');
  update public.messages
     set attachment = case when attachment is null then null else attachment - 'url' end,
         voice      = case when voice is null then null else voice - 'url' end
   where id = p_id;
  if v_path is not null then
    delete from storage.objects where bucket_id = 'media' and name = v_path;
  end if;
end;
$$;

-- Uploaders may remove their own objects; needed for avatar replacement too.
drop policy if exists "media: own delete" on storage.objects;
create policy "media: own delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'media' and (owner = auth.uid() or owner_id = auth.uid()::text));

drop policy if exists "media: own update" on storage.objects;
create policy "media: own update" on storage.objects
  for update to authenticated
  using (bucket_id = 'media' and (owner = auth.uid() or owner_id = auth.uid()::text));

-- ----------------------------------------------------------------------------
--  Realtime for friend requests + message updates
-- ----------------------------------------------------------------------------
do $$
begin
  alter publication supabase_realtime add table public.friend_requests;
exception when duplicate_object then null;
end $$;

notify pgrst, 'reload schema';
