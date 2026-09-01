import type { Emotion, DialogueLine, StoryChoice, StoryMission } from './types';

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

export const DEFAULT_STORY_STATE: StoryState = { flags: {}, loreFound: [], milestones: [] };

export function applyStoryFlag(state: StoryState, flag: StoryFlag, amount = 1): StoryState {
  if (amount === 0) return state;
  return { ...state, flags: { ...state.flags, [flag]: (state.flags[flag] ?? 0) + amount } };
}

export function hasStoryFlag(state: StoryState, flag: StoryFlag, minimum = 1): boolean {
  return (state.flags[flag] ?? 0) >= minimum;
}

export function addLore(state: StoryState, loreId: string): StoryState {
  if (!loreId || state.loreFound.includes(loreId)) return state;
  return { ...state, loreFound: [...state.loreFound, loreId] };
}

export function addMilestone(state: StoryState, milestone: string): StoryState {
  if (!milestone || state.milestones.includes(milestone)) return state;
  return { ...state, milestones: [...state.milestones, milestone] };
}

/** Explicit IDs are kept for backwards compatibility; new choices can evolve
 * automatically from their wording without requiring another data-map edit. */
export const CHOICE_FLAG_MAP: Record<string, StoryFlag> = {
  c1: 'resolve',
  c2: 'truth_seeker',
};

function inferChoiceFlag(choice: Pick<StoryChoice, 'id' | 'label' | 'consequence'>): StoryFlag | null {
  const explicit = CHOICE_FLAG_MAP[choice.id];
  if (explicit) return explicit;
  const text = `${choice.id} ${choice.label} ${choice.consequence}`.toLowerCase();
  if (/truth|secret|reveal|learn|discover|knowledge|question/.test(text)) return 'truth_seeker';
  if (/trust|ally|stand with|beside|believe|follow shadow/.test(text)) return 'shadow_trust';
  if (/doubt|reject|refuse|suspicious|betray|against shadow/.test(text)) return 'shadow_doubt';
  if (/freedom|escape|break free|liberate|independent/.test(text)) return 'freedom_first';
  if (/power|control|dominate|rule|stronger|master/.test(text)) return 'power_first';
  if (/mercy|forgive|save|protect|help|spare/.test(text)) return 'mercy';
  if (/resolve|endure|persist|continue|fight|forward|discipline/.test(text)) return 'resolve';
  return null;
}

export function applyChoice(state: StoryState, choice: Pick<StoryChoice, 'id' | 'label' | 'consequence' | 'reward'>): StoryState {
  let next = state;
  const flag = inferChoiceFlag(choice);
  if (flag) next = applyStoryFlag(next, flag);
  if (choice.reward?.type === 'lore' && typeof choice.reward.value === 'string') next = addLore(next, choice.reward.value);
  return next;
}

export function applyMissionEvolution(state: StoryState, mission: Pick<StoryMission, 'id' | 'type' | 'title' | 'description'>): StoryState {
  let next = state;
  const text = `${mission.id} ${mission.title} ${mission.description}`.toLowerCase();
  if (mission.type === 'workout' || /train|workout|strength|push|pull|leg|exercise|plyometric/.test(text)) next = applyStoryFlag(next, 'resolve');
  if (mission.type === 'tasks' || mission.type === 'discipline_score' || /discipline|complete|habit|daily/.test(text)) next = applyStoryFlag(next, 'resolve');
  if (mission.type === 'read_quran' || mission.type === 'read_book' || /truth|secret|archive|lore|read|discover|learn/.test(text)) next = applyStoryFlag(next, 'truth_seeker');
  if (mission.type === 'pray' || /mercy|protect|save|help|forgive/.test(text)) next = applyStoryFlag(next, 'mercy');
  if (/shadow|trust|ally|beside/.test(text)) next = applyStoryFlag(next, 'shadow_trust');
  if (/doubt|question|refuse|reject|suspicious/.test(text)) next = applyStoryFlag(next, 'shadow_doubt');
  if (/freedom|escape|break|free/.test(text)) next = applyStoryFlag(next, 'freedom_first');
  if (/power|control|dominate|rule/.test(text)) next = applyStoryFlag(next, 'power_first');
  return next;
}

const FLAG_TOKEN = 'evo:flag:';
const MILESTONE_TOKEN = 'evo:milestone:';

export function encodeStoryEvolution(state: StoryState): string[] {
  const tokens: string[] = [];
  (Object.keys(state.flags) as StoryFlag[]).forEach((flag) => {
    const amount = Math.max(0, Math.floor(state.flags[flag] ?? 0));
    for (let i = 1; i <= amount; i += 1) tokens.push(`${FLAG_TOKEN}${flag}:${i}`);
  });
  state.milestones.forEach((milestone) => tokens.push(`${MILESTONE_TOKEN}${milestone}`));
  return tokens;
}

export function decodeStoryEvolution(storyAchievements: string[] = [], loreFound: string[] = []): StoryState {
  const flags: Partial<Record<StoryFlag, number>> = {};
  const milestones: string[] = [];
  const validFlags = new Set<StoryFlag>(['truth_seeker', 'shadow_trust', 'shadow_doubt', 'freedom_first', 'power_first', 'mercy', 'resolve']);
  for (const token of storyAchievements) {
    if (token.startsWith(FLAG_TOKEN)) {
      const parts = token.slice(FLAG_TOKEN.length).split(':');
      const flag = parts[0] as StoryFlag;
      if (validFlags.has(flag)) flags[flag] = Math.max(flags[flag] ?? 0, Number(parts[1]) || 0);
    } else if (token.startsWith(MILESTONE_TOKEN)) {
      const id = token.slice(MILESTONE_TOKEN.length);
      if (id && !milestones.includes(id)) milestones.push(id);
    }
  }
  return { flags, loreFound: [...new Set(loreFound.filter(Boolean))], milestones };
}

export function mergeEncodedStoryEvolution(achievements: string[], before: StoryState, after: StoryState): string[] {
  const existing = new Set(achievements);
  for (const token of encodeStoryEvolution(after)) existing.add(token);
  for (const token of encodeStoryEvolution(before)) existing.add(token);
  return [...existing];
}

export function getShadowReaction(state: StoryState): DialogueLine[] {
  if (hasStoryFlag(state, 'shadow_trust', 3)) return [S('You stopped following my voice blindly. You listened, questioned, and still chose to walk beside me. That is why I trust you now.', 'happy')];
  if (hasStoryFlag(state, 'shadow_doubt', 2)) return [S('You keep questioning me. Good. But understand this: some truths become dangerous before they become useful.', 'serious')];
  if (hasStoryFlag(state, 'truth_seeker', 2)) return [S('You keep choosing the truth, even when it costs you comfort. Remember that when the System offers you an easier answer.', 'mysterious')];
  if (hasStoryFlag(state, 'freedom_first', 2)) return [S('You keep choosing freedom, even when obedience would be easier. The System has noticed.', 'mysterious')];
  if (hasStoryFlag(state, 'power_first', 2)) return [S('Power keeps appearing in front of you. Remember: what you can control is not always what you should control.', 'serious')];
  if (hasStoryFlag(state, 'resolve', 2)) return [S('You keep moving forward when turning back would be easier. That resolve will matter when the path disappears.', 'serious')];
  return [S('Every choice leaves a mark. The world is beginning to remember yours.', 'mysterious')];
}

export const STORY_MILESTONES = {
  firstMission: 'first_mission_completed',
  firstWorkout: 'first_workout_completed',
  firstBoss: 'first_boss_defeated',
  archiveOpened: 'black_archive_opened',
  systemDeclaredEnemy: 'system_declared_enemy',
  shadowTruth: 'shadow_truth_revealed',
  finalChoice: 'final_choice_made',
} as const;

function S(text: string, emotion: Emotion = 'mysterious'): DialogueLine {
  return { speaker: 'Shadow', voice: 'guardian', text, emotion };
}
