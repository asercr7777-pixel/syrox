import { supabase, isSupabaseConfigured } from '../supabase';

const STORY_RESET_VERSION = 2;

const RESET_STATE = {
  storyChapter: 0,
  storyMission: 0,
  storyChoices: {},
  storyCompletedMissions: {},
  storyBossDefeated: {},
  storyNpcReputation: {},
  storyLoreUnlocked: [],
  storyAchievements: [],
  activeBossId: null,
  bossHpRemaining: {},
  bossDefeated: {},
};

export async function ensureStoryReset(userId: string): Promise<void> {
  if (!isSupabaseConfigured()) return;

  try {
    const { data: versionRow, error: versionError } = await supabase
      .from('story_reset_versions')
      .select('version')
      .eq('user_id', userId)
      .maybeSingle();

    if (versionError) {
      console.error('[storyReset] version check failed:', versionError);
      return;
    }

    if ((versionRow?.version ?? 0) < STORY_RESET_VERSION) {
      const { data: current, error: stateError } = await supabase
        .from('user_state')
        .select('state')
        .eq('user_id', userId)
        .maybeSingle();

      if (stateError) {
        console.error('[storyReset] state read failed:', stateError);
        return;
      }

      if (current?.state) {
        const { error: updateError } = await supabase
          .from('user_state')
          .update({ state: { ...(current.state as Record<string, unknown>), ...RESET_STATE }, updated_at: new Date().toISOString() })
          .eq('user_id', userId);

        if (updateError) {
          console.error('[storyReset] state reset failed:', updateError);
          return;
        }
      }

      const { error: versionUpdateError } = await supabase
        .from('story_reset_versions')
        .upsert({ user_id: userId, version: STORY_RESET_VERSION, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });

      if (versionUpdateError) console.error('[storyReset] version update failed:', versionUpdateError);
    }
  } catch (error) {
    console.error('[storyReset] unexpected error:', error);
  }
}
