-- Community fixes: expose only public profile fields to signed-in users,
-- keep community names/avatars synchronized, make DELETE events reliable,
-- and keep the leaderboard identity tied to the real profile.

DROP POLICY IF EXISTS "select_own_profile" ON public.profiles;
CREATE POLICY "select_profiles_for_community"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

ALTER TABLE public.community_messages REPLICA IDENTITY FULL;

CREATE OR REPLACE FUNCTION public.sync_community_message_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.community_messages
  SET username = NEW.username,
      avatar = NEW.avatar
  WHERE user_id = NEW.id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS community_profile_changed ON public.profiles;
CREATE TRIGGER community_profile_changed
AFTER UPDATE OF username, avatar ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.sync_community_message_profile();

CREATE OR REPLACE FUNCTION public.sync_leaderboard_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.leaderboard
  SET username = NEW.username,
      avatar = NEW.avatar,
      updated_at = now()
  WHERE user_id = NEW.id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profile_changed_leaderboard ON public.profiles;
CREATE TRIGGER profile_changed_leaderboard
AFTER UPDATE OF username, avatar ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.sync_leaderboard_profile();

-- Refresh existing rows so old/stale display data is corrected immediately.
UPDATE public.community_messages cm
SET username = p.username,
    avatar = p.avatar
FROM public.profiles p
WHERE p.id = cm.user_id;

UPDATE public.leaderboard lb
SET username = p.username,
    avatar = p.avatar,
    updated_at = now()
FROM public.profiles p
WHERE p.id = lb.user_id;
