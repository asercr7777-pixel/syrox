-- Community live chat
CREATE TABLE IF NOT EXISTS public.community_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL DEFAULT 'Hunter',
  avatar text NOT NULL DEFAULT '🐺',
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 500),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS community_messages_created_at_idx
  ON public.community_messages (created_at DESC);

ALTER TABLE public.community_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "community_messages_select" ON public.community_messages;
CREATE POLICY "community_messages_select"
  ON public.community_messages FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "community_messages_insert" ON public.community_messages;
CREATE POLICY "community_messages_insert"
  ON public.community_messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "community_messages_delete_own" ON public.community_messages;
CREATE POLICY "community_messages_delete_own"
  ON public.community_messages FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Keep the display name/avatar synchronized with the user's profile.
CREATE OR REPLACE FUNCTION public.set_community_message_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  SELECT p.username, p.avatar
    INTO NEW.username, NEW.avatar
  FROM public.profiles p
  WHERE p.id = NEW.user_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS community_message_profile ON public.community_messages;
CREATE TRIGGER community_message_profile
  BEFORE INSERT ON public.community_messages
  FOR EACH ROW EXECUTE FUNCTION public.set_community_message_profile();

CREATE TABLE IF NOT EXISTS public.community_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.community_messages(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (message_id, reporter_id)
);

ALTER TABLE public.community_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "community_reports_insert" ON public.community_reports;
CREATE POLICY "community_reports_insert"
  ON public.community_reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "community_reports_select_own" ON public.community_reports;
CREATE POLICY "community_reports_select_own"
  ON public.community_reports FOR SELECT
  TO authenticated
  USING (auth.uid() = reporter_id);

-- Enable Supabase Realtime for the public room without duplicating publication entries.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'community_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.community_messages;
  END IF;
END $$;
