-- Forged Community: canonical message schema
create table if not exists public.community_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  username text not null default 'Hunter',
  avatar text not null default '🐺',
  body text not null,
  created_at timestamptz not null default now()
);

alter table public.community_messages enable row level security;

create index if not exists community_messages_created_at_idx
  on public.community_messages (created_at desc);

create index if not exists community_messages_user_id_idx
  on public.community_messages (user_id);

drop policy if exists "community messages are readable" on public.community_messages;
drop policy if exists "users can send community messages" on public.community_messages;

after alter table public.community_messages add column if not exists username text;
alter table public.community_messages add column if not exists avatar text;
alter table public.community_messages add column if not exists body text;

create policy "community messages are readable"
on public.community_messages for select to authenticated using (true);

create policy "users can send community messages"
on public.community_messages for insert to authenticated
with check (auth.uid() = user_id);

-- Keep existing legacy rows usable.
update public.community_messages
set body = coalesce(nullif(body, ''), nullif(content, ''), '')
where body is null or body = '';

update public.community_messages cm
set username = coalesce(nullif(cm.username, ''), p.username, 'Hunter'),
    avatar = coalesce(nullif(cm.avatar, ''), p.avatar, '🐺')
from public.profiles p
where p.id = cm.user_id;

-- Realtime is intentionally configured here; if already present, PostgreSQL will reject
-- the duplicate publication membership, so only add when absent.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'community_messages'
  ) then
    alter publication supabase_realtime add table public.community_messages;
  end if;
end $$;
