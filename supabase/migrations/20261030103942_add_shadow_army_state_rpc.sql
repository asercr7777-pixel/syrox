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

  if jsonb_typeof(p_roster) <> 'array'
     or jsonb_typeof(p_formation) <> 'array'
     or jsonb_array_length(p_roster) > 30
     or jsonb_array_length(p_formation) > 6 then
    raise exception 'Invalid shadow army payload' using errcode = '22023';
  end if;

  select coalesce(jsonb_array_length(coalesce(state->'shadowExtractedBossIds', '[]'::jsonb)), 0) * 100
    into v_earned_essence
  from public.user_state
  where user_id = v_user_id;

  v_earned_essence := coalesce(v_earned_essence, 0);

  if p_essence_spent < 0 or p_essence_spent > v_earned_essence then
    raise exception 'Insufficient shadow essence' using errcode = '22023';
  end if;

  insert into public.user_state as existing_state (user_id, state, updated_at)
  values (
    v_user_id,
    jsonb_build_object(
      'shadowArmyRoster', p_roster,
      'shadowArmyFormation', p_formation,
      'shadowArmyEssenceSpent', p_essence_spent
    ),
    now()
  )
  on conflict (user_id) do update
  set state = jsonb_set(
    jsonb_set(
      jsonb_set(
        coalesce(existing_state.state, '{}'::jsonb),
        '{shadowArmyRoster}',
        excluded.state->'shadowArmyRoster',
        true
      ),
      '{shadowArmyFormation}',
      excluded.state->'shadowArmyFormation',
      true
    ),
    '{shadowArmyEssenceSpent}',
    excluded.state->'shadowArmyEssenceSpent',
    true
  ),
  updated_at = now();
end;
$function$;

revoke all on function public.save_shadow_army_state(jsonb, jsonb, integer) from public, anon;
grant execute on function public.save_shadow_army_state(jsonb, jsonb, integer) to authenticated;