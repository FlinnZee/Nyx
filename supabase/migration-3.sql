-- ============================================================================
--  Nyx — migration 3: replies, deletes, and persistent call history
--  Run once in Supabase → SQL Editor → New query → paste all → Run.
--  Safe to re-run.
-- ============================================================================

-- ----------------------------- messages --------------------------------
alter table public.messages add column if not exists reply_to uuid
  references public.messages(id) on delete set null;
alter table public.messages add column if not exists deleted boolean not null default false;

-- Delete for everyone: only the author, keeps a "message deleted" tombstone.
create or replace function public.delete_message(p_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.messages
     set deleted = true, body = null, attachment = null, voice = null, kind = 'deleted'
   where id = p_id and author_id = auth.uid();
$$;

-- ------------------------------- calls ---------------------------------
create table if not exists public.calls (
  id         uuid primary key default gen_random_uuid(),
  from_id    uuid not null references auth.users(id) on delete cascade,
  to_id      uuid not null references auth.users(id) on delete cascade,
  kind       text not null default 'voice',   -- voice | video
  status     text not null default 'completed', -- completed | missed | declined
  duration   int  not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists calls_participants_idx on public.calls (from_id, to_id, created_at);

alter table public.calls enable row level security;

drop policy if exists "calls: mine" on public.calls;
create policy "calls: mine" on public.calls
  for select using (from_id = auth.uid() or to_id = auth.uid());

drop policy if exists "calls: log" on public.calls;
create policy "calls: log" on public.calls
  for insert with check (from_id = auth.uid());

-- ------------------------------ realtime -------------------------------
do $$
begin
  alter publication supabase_realtime add table public.calls;
exception when duplicate_object then null;
end $$;

notify pgrst, 'reload schema';
