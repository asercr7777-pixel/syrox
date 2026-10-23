-- The active training client uses the validated overload with configuration and an action token.
-- Revoke the unused legacy overload that lacks equivalent set-number/value validation.
REVOKE EXECUTE ON FUNCTION public.syrox_complete_set(uuid, uuid, integer, numeric, numeric, integer, numeric, text) FROM authenticated;
