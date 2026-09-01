CREATE TABLE IF NOT EXISTS public.story_reset_versions (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  version integer NOT NULL DEFAULT 2,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.story_reset_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_story_reset_version" ON public.story_reset_versions;
CREATE POLICY "select_own_story_reset_version"
ON public.story_reset_versions FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_story_reset_version" ON public.story_reset_versions;
CREATE POLICY "insert_own_story_reset_version"
ON public.story_reset_versions FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_story_reset_version" ON public.story_reset_versions;
CREATE POLICY "update_own_story_reset_version"
ON public.story_reset_versions FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

INSERT INTO public.story_reset_versions (user_id, version, updated_at)
SELECT user_id, 2, now()
FROM public.user_state
ON CONFLICT (user_id) DO UPDATE
SET version = 2, updated_at = now();

UPDATE public.user_state
SET state = state || jsonb_build_object(
  'storyChapter', 0,
  'storyMission', 0,
  'storyChoices', '{}'::jsonb,
  'storyCompletedMissions', '{}'::jsonb,
  'storyBossDefeated', '{}'::jsonb,
  'storyNpcReputation', '{}'::jsonb,
  'storyLoreUnlocked', '[]'::jsonb,
  'storyAchievements', '[]'::jsonb,
  'activeBossId', NULL,
  'bossHpRemaining', '{}'::jsonb,
  'bossDefeated', '{}'::jsonb
), updated_at = now();
