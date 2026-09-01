import type { Emotion, DialogueLine } from './types';

export type StoryFlag =
  | 'truth_seeker'
  | 'shadow_trust'
  | 'shadow_doubt'
  | 'freedom_first'
  | 'power_first'
  | 'mercy'
  | 'resolve';

export interface StoryState {
  flags: Partial<Record<StoryFlag, number>>;
  loreFound: string[];
  milestones: string[];
}

export const DEFAULT_STORY_STATE: StoryState = {
  flags: {},
  loreFound: [],
  milestones: [],
};

export function applyStoryFlag(state: StoryState, flag: StoryFlag, amount = 1): StoryState {
  return {
    ...state,
    flags: { ...state.flags, [flag]: (state.flags[flag] ?? 0) + amount },
  };
}

export function hasStoryFlag(state: StoryState, flag: StoryFlag, minimum = 1): boolean {
  return (state.flags[flag] ?? 0) >= minimum;
}

export function addLore(state: StoryState, loreId: string): StoryState {
  if (state.loreFound.includes(loreId)) return state;
  return { ...state, loreFound: [...state.loreFound, loreId] };
}

export function addMilestone(state: StoryState, milestone: string): StoryState {
  if (state.milestones.includes(milestone)) return state;
  return { ...state, milestones: [...state.milestones, milestone] };
}

const S = (text: string, emotion: Emotion = 'neutral'): DialogueLine => ({
  speaker: 'Shadow',
  voice: 'mentor',
  text,
  emotion,
});

/** Shadow reacts differently as the player's decisions shape the story. */
export function getShadowReaction(state: StoryState): DialogueLine[] {
  if (hasStoryFlag(state, 'shadow_trust', 3)) {
    return [S('You stopped following my voice blindly. You listened, questioned, and still chose to walk beside me. That is why I trust you now.', 'happy')];
  }
  if (hasStoryFlag(state, 'shadow_doubt', 2)) {
    return [S('You keep questioning me. Good. But understand this: some truths become dangerous before they become useful.', 'serious')];
  }
  if (hasStoryFlag(state, 'freedom_first', 2)) {
    return [S('You keep choosing freedom, even when obedience would be easier. The System has noticed.', 'mysterious')];
  }
  if (hasStoryFlag(state, 'power_first', 2)) {
    return [S('Power keeps appearing in front of you. Remember: what you can control is not always what you should control.', 'serious')];
  }
  return [S('Every choice leaves a mark. The world is beginning to remember yours.', 'mysterious')];
}

export const STORY_MILESTONES = {
  firstBoss: 'first_boss_defeated',
  archiveOpened: 'black_archive_opened',
  systemDeclaredEnemy: 'system_declared_enemy',
  shadowTruth: 'shadow_truth_revealed',
  finalChoice: 'final_choice_made',
} as const;
