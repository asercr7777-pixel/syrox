create table if not exists public.shadow_army_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  roster jsonb not null default '[]'::jsonb check (jsonb_typeof(roster) = 'array'),
  formation jsonb not null default '[]'::jsonb check (jsonb_typeof(formation) = 'array'),
  essence_spent integer not null default 0 check (essence_spent >= 0),
  updated_at timestamptz not null default now()
);

alter table public.shadow_army_state enable row level security;

create policy "Users can read own shadow army state"
  on public.shadow_army_state for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert own shadow army state"
  on public.shadow_army_state for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update own shadow army state"
  on public.shadow_army_state for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete own shadow army state"
  on public.shadow_army_state for delete to authenticated
  using ((select auth.uid()) = user_id);

revoke all on table public.shadow_army_state from public, anon;
grant select, insert, update, delete on table public.shadow_army_state to authenticated;

create or replace function public.save_shadow_army_state(
  p_roster jsonb,
  p_formation jsonb,
  p_essence_spent integer
)
returns void
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_earned_essence integer;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if p_roster is null or p_formation is null
     or jsonb_typeof(p_roster) <> 'array'
     or jsonb_typeof(p_formation) <> 'array'
     or jsonb_array_length(p_roster) > 30
     or jsonb_array_length(p_formation) > 4
     or p_essence_spent is null then
    raise exception 'Invalid shadow army payload' using errcode = '22023';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_roster) as unit(value)
    where unit.value->>'id' not in ('vexar', 'nyx', 'orynd', 'khael', 'sable', 'draeven')
  ) then
    raise exception 'Unknown shadow unit' using errcode = '22023';
  end if;

  if (select count(*) from jsonb_array_elements(p_roster))
     <> (select count(distinct unit.value->>'id') from jsonb_array_elements(p_roster) as unit(value)) then
    raise exception 'Duplicate shadow units are not allowed' using errcode = '22023';
  end if;

  if (select count(*) from jsonb_array_elements_text(p_formation))
     <> (select count(distinct deployed.value) from jsonb_array_elements_text(p_formation) as deployed(value)) then
    raise exception 'Duplicate formation slots are not allowed' using errcode = '22023';
  end if;

  if exists (
    select 1
    from jsonb_array_elements_text(p_formation) as deployed(value)
    where not exists (
      select 1 from jsonb_array_elements(p_roster) as unit(value)
      where unit.value->>'id' = deployed.value
    )
  ) then
    raise exception 'Only recruited shadows can be deployed' using errcode = '22023';
  end if;

  select coalesce(jsonb_array_length(coalesce(state->'shadowExtractedBossIds', '[]'::jsonb)), 0) * 100
    into v_earned_essence
  from public.user_state
  where user_id = v_user_id;

  v_earned_essence := coalesce(v_earned_essence, 0);

  if p_essence_spent < 0 or p_essence_spent > v_earned_essence then
    raise exception 'Insufficient shadow essence' using errcode = '22023';
  end if;

  insert into public.shadow_army_state as existing_state (user_id, roster, formation, essence_spent, updated_at)
  values (v_user_id, p_roster, p_formation, p_essence_spent, now())
  on conflict (user_id) do update
  set roster = excluded.roster,
      formation = excluded.formation,
      essence_spent = excluded.essence_spent,
      updated_at = now();
end;
$function$;

revoke all on function public.save_shadow_army_state(jsonb, jsonb, integer) from public, anon;
grant execute on function public.save_shadow_army_state(jsonb, jsonb, integer) to authenticated;