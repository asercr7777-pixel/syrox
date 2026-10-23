-- STRYVEN security hardening: restore authenticated ownership for leaderboard writes.
-- The historical duplicate leaderboard migration reintroduced permissive anon policies
-- after the authenticated schema migration. Keep the public competition board readable
-- to signed-in users, but never allow anonymous or authenticated users to mutate other rows.

ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_leaderboard" ON public.leaderboard;
DROP POLICY IF EXISTS "anon_upsert_leaderboard" ON public.leaderboard;
DROP POLICY IF EXISTS "anon_update_leaderboard" ON public.leaderboard;
DROP POLICY IF EXISTS "anon_delete_leaderboard" ON public.leaderboard;

DROP POLICY IF EXISTS "auth_read_leaderboard" ON public.leaderboard;
CREATE POLICY "auth_read_leaderboard"
ON public.leaderboard
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "auth_insert_leaderboard" ON public.leaderboard;
CREATE POLICY "auth_insert_leaderboard"
ON public.leaderboard
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "auth_update_leaderboard" ON public.leaderboard;
CREATE POLICY "auth_update_leaderboard"
ON public.leaderboard
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "auth_delete_leaderboard" ON public.leaderboard;
CREATE POLICY "auth_delete_leaderboard"
ON public.leaderboard
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
