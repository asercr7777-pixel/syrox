-- Harden community deletes and realtime delivery.
-- This makes DELETE events carry the full old row and reasserts the own-message delete policy.

ALTER TABLE public.community_messages REPLICA IDENTITY FULL;

DROP POLICY IF EXISTS "community_messages_delete_own" ON public.community_messages;
CREATE POLICY "community_messages_delete_own"
  ON public.community_messages
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

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
