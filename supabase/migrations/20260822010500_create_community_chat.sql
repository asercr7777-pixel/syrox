-- Public signed-in community chat.
-- Messages are visible to authenticated users, but writes remain owner-scoped.
CREATE TABLE IF NOT EXISTS public.community_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL DEFAULT 'Hunter',
  avatar text NOT NULL DEFAULT '🐺',
  body text NOT NULL CHECK (char_length(trim(body)) BETWEEN 1 AND 500),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS community_messages_created_idx
  ON public.community_messages (created_at DESC);

ALTER TABLE public.community_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "community_read_authenticated" ON public.community_messages;
CREATE POLICY "community_read_authenticated"
  ON public.community_messages FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "community_insert_own" ON public.community_messages;
CREATE POLICY "community_insert_own"
  ON public.community_messages FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "community_delete_own" ON public.community_messages;
CREATE POLICY "community_delete_own"
  ON public.community_messages FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Keep display identity server-controlled and add a small anti-spam cooldown.
CREATE OR REPLACE FUNCTION public.prepare_community_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  last_sent timestamptz;
BEGIN
  IF NEW.user_id <> auth.uid() THEN
    RAISE EXCEPTION 'You can only send messages as yourself';
  END IF;

  SELECT created_at INTO last_sent
  FROM public.community_messages
  WHERE user_id = NEW.user_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF last_sent IS NOT NULL AND last_sent > now() - interval '2 seconds' THEN
    RAISE EXCEPTION 'Please wait a moment before sending another message';
  END IF;

  SELECT COALESCE(username, 'Hunter'), COALESCE(avatar, '🐺')
    INTO NEW.username, NEW.avatar
  FROM public.profiles
  WHERE id = NEW.user_id;

  NEW.body := trim(NEW.body);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS community_message_prepare ON public.community_messages;
CREATE TRIGGER community_message_prepare
  BEFORE INSERT ON public.community_messages
  FOR EACH ROW EXECUTE FUNCTION public.prepare_community_message();

-- Reports are private to the reporter and cannot expose reporter data through the chat UI.
CREATE TABLE IF NOT EXISTS public.community_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.community_messages(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text NOT NULL DEFAULT 'inappropriate',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (message_id, reporter_id)
);

ALTER TABLE public.community_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "community_reports_insert_own" ON public.community_reports;
CREATE POLICY "community_reports_insert_own"
  ON public.community_reports FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "community_reports_read_own" ON public.community_reports;
CREATE POLICY "community_reports_read_own"
  ON public.community_reports FOR SELECT
  TO authenticated USING (auth.uid() = reporter_id);

-- Enable Supabase Realtime for live message delivery.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'community_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.community_messages;
  END IF;
END $$;
