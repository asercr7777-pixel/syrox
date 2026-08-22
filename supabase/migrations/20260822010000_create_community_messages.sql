create table if not exists public.community_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  username text not null default 'Hunter',
  avatar text not null default '🐺',
  body text not null check (char_length(trim(body)) between 1 and 500),
  created_at timestamptz not null default now()
);

create table if not exists public.community_reports (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.community_messages(id) on delete cascade,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(message_id, reporter_id)
);

alter table public.community_messages enable row level security;
alter table public.community_reports enable row level security;

drop policy if exists "community messages read" on public.community_messages;
drop policy if exists "community messages insert" on public.community_messages;
drop policy if exists "community reports insert" on public.community_reports;

create policy "community messages read" on public.community_messages
  for select to authenticated using (true);

create policy "community messages insert" on public.community_messages
  for insert to authenticated
  with check (auth.uid() = user_id);

create policy "community reports insert" on public.community_reports
  for insert to authenticated
  with check (auth.uid() = reporter_id);

create index if not exists community_messages_created_at_idx on public.community_messages(created_at desc);
create index if not exists community_reports_message_id_idx on public.community_reports(message_id);

alter table public.community_messages replica identity full;

-- Keep Realtime enabled for the live community room.
do $$
begin
  alter publication supabase_realtime add table public.community_messages;
exception when duplicate_object then
  null;
end $$;
