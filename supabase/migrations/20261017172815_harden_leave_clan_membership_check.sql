-- Prevent non-members from writing clan history by calling leave_clan.
CREATE OR REPLACE FUNCTION public.leave_clan(p_clan_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth', 'extensions'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_leader uuid;
  v_deleted integer;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT leader_id INTO v_leader
  FROM public.clans
  WHERE id = p_clan_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'clan_not_found';
  END IF;

  IF v_leader = v_uid THEN
    RAISE EXCEPTION 'leader_cannot_leave';
  END IF;

  DELETE FROM public.clan_members
  WHERE clan_id = p_clan_id AND user_id = v_uid;

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  IF v_deleted = 0 THEN
    RAISE EXCEPTION 'not_clan_member';
  END IF;

  INSERT INTO public.clan_history(clan_id, event_type, title, details)
  VALUES (p_clan_id, 'member_left', 'Hunter left the clan', 'A member left the clan.');
END;
$function$;
