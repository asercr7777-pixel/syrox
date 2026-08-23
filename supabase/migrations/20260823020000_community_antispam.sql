-- Community safety limits enforced at the database layer.
-- Max 500 chars, no blank messages, no repeated spam, and a short per-user cooldown.

ALTER TABLE public.community_messages
  DROP CONSTRAINT IF EXISTS community_messages_body_check;

ALTER TABLE public.community_messages
  ADD CONSTRAINT community_messages_body_check
  CHECK (char_length(btrim(body)) BETWEEN 1 AND 500);

CREATE OR REPLACE FUNCTION public.enforce_community_message_limits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  last_body text;
  last_created timestamptz;
  recent_count integer;
BEGIN
  NEW.body := btrim(regexp_replace(NEW.body, '[[:space:]]+', ' ', 'g'));

  IF char_length(NEW.body) = 0 THEN
    RAISE EXCEPTION 'Message cannot be empty';
  END IF;

  SELECT body, created_at INTO last_body, last_created
  FROM public.community_messages
  WHERE user_id = NEW.user_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF last_created IS NOT NULL AND now() - last_created < interval '5 seconds' THEN
    RAISE EXCEPTION 'Please wait a few seconds before sending another message';
  END IF;

  IF last_body IS NOT NULL AND lower(btrim(last_body)) = lower(NEW.body) THEN
    RAISE EXCEPTION 'Please do not repeat the same message';
  END IF;

  SELECT count(*) INTO recent_count
  FROM public.community_messages
  WHERE user_id = NEW.user_id
    AND created_at > now() - interval '1 minute';

  IF recent_count >= 8 THEN
    RAISE EXCEPTION 'Too many messages. Please wait a minute';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS community_message_limits ON public.community_messages;
CREATE TRIGGER community_message_limits
BEFORE INSERT ON public.community_messages
FOR EACH ROW EXECUTE FUNCTION public.enforce_community_message_limits();
