-- Restrict workout RPC execution to signed-in users.
-- Each function still verifies auth.uid() and the ownership of the target records.
REVOKE EXECUTE ON FUNCTION public.syrox_complete_set(uuid, uuid, integer, numeric, numeric, integer, numeric, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.syrox_complete_set(uuid, uuid, integer, numeric, numeric, integer, numeric, text, jsonb, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.syrox_exercise_history(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.syrox_finish_session(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.syrox_save_session_state(uuid, uuid, integer, text, timestamp with time zone, boolean, jsonb) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.syrox_start_session(uuid) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.syrox_complete_set(uuid, uuid, integer, numeric, numeric, integer, numeric, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.syrox_complete_set(uuid, uuid, integer, numeric, numeric, integer, numeric, text, jsonb, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.syrox_exercise_history(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.syrox_finish_session(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.syrox_save_session_state(uuid, uuid, integer, text, timestamp with time zone, boolean, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.syrox_start_session(uuid) TO authenticated;
