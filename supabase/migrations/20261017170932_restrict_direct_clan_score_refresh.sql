-- This score refresh is called by trusted internal triggers/functions only.
-- Keep server-side service_role execution; remove direct RPC access from signed-in clients.
REVOKE EXECUTE ON FUNCTION public.refresh_clan_season_score(uuid) FROM authenticated;
