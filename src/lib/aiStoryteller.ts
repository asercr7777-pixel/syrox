import type { AppState } from '../store/types';

export interface AIStoryState {
  worldBrightness: number;
  npcFriendliness: number;
  enemyStrength: number;
  cityEvolution: number;
  darknessSpread: number;
  narratorTone: 'hopeful' | 'neutral' | 'dark';
  dynamicDialogue: string;
  worldDescription: string;
}

export function computeAIStoryState(state: AppState): AIStoryState {
  const history = state.history;
  const last7 = history.slice(-7);
  const last30 = history.slice(-30);

  const recentDiscipline = last7.length > 0
    ? last7.reduce((a, h) => a + h.disciplineScore, 0) / last7.length
    : 0;
  const monthlyDiscipline = last30.length > 0
    ? last30.reduce((a, h) => a + h.disciplineScore, 0) / last30.length
    : 0;

  const streakFactor = Math.min(100, state.streak * 5);
  const overall = (recentDiscipline * 0.5 + streakFactor * 0.3 + monthlyDiscipline * 0.2);

  const worldBrightness = Math.round(Math.max(0, Math.min(100, overall)));
  const npcFriendliness = Math.round(Math.max(0, Math.min(100, overall + 10)));
  const enemyStrength = Math.round(Math.max(50, Math.min(200, 200 - overall)));
  const cityEvolution = Math.round(Math.max(0, Math.min(100, monthlyDiscipline)));
  const darknessSpread = Math.round(Math.max(0, Math.min(100, 100 - overall)));

  const narratorTone: 'hopeful' | 'neutral' | 'dark' = overall >= 65 ? 'hopeful' : overall >= 35 ? 'neutral' : 'dark';

  const perfectDays = history.filter((h) => h.allMainDone).length;
  const totalTasks = history.reduce((a, h) => a + Object.values(h.coreCompleted).filter(Boolean).length, 0);

  let dynamicDialogue: string;
  let worldDescription: string;

  if (narratorTone === 'hopeful') {
    dynamicDialogue = `The world responds to your discipline. Light spreads across the land as you maintain a ${state.streak}-day streak. NPCs greet you with respect — you have completed ${totalTasks} tasks and ${perfectDays} perfect days. The cities evolve, growing more beautiful with each habit you complete. Your power radiates like a beacon.`;
    worldDescription = 'The world is bright and vibrant. Cities gleam with golden light. NPCs smile as you pass. The air itself feels charged with your discipline.';
  } else if (narratorTone === 'neutral') {
    dynamicDialogue = `The world holds its breath. Your discipline wavers — ${recentDiscipline.toFixed(0)}% in the last 7 days. The NPCs are cautious, neither friendly nor hostile. Cities remain unchanged. Enemies watch from the shadows, waiting to see if you will rise or fall. The story hangs in balance.`;
    worldDescription = 'The world is muted. Cities stand still. NPCs watch you carefully. Shadows linger at the edges. Everything waits for your next move.';
  } else {
    dynamicDialogue = `Darkness spreads across the world. Your discipline has faltered — only ${recentDiscipline.toFixed(0)}% in recent days. NPCs avert their eyes, disappointed. Cities crumble slowly. Enemies grow bolder, feeding on your inconsistency. But it is not too late. One completed habit can turn the tide.`;
    worldDescription = 'The world is dark and decaying. Cities show cracks. NPCs whisper about your decline. Enemies laugh from the shadows. But a single spark of discipline could reverse it all.';
  }

  return {
    worldBrightness,
    npcFriendliness,
    enemyStrength,
    cityEvolution,
    darknessSpread,
    narratorTone,
    dynamicDialogue,
    worldDescription,
  };
}

export function getDynamicNPCDialogue(state: AppState, regionName: string): string {
  const ai = computeAIStoryState(state);
  const npcName = regionName === 'Forgotten Village' ? 'Elder Marin'
    : regionName === 'Forest of Discipline' ? 'Tree Sage Vorin'
    : regionName === 'Temple of Focus' ? 'Monk Kael'
    : regionName === 'Mountain of Will' ? 'Climber Rhea'
    : regionName === 'Kingdom of Consistency' ? 'King Aldric'
    : regionName === 'Ocean of Wisdom' ? 'Leviathan Speaker'
    : regionName === 'Desert of Temptation' ? 'Mirage Keeper'
    : regionName === 'Frozen Sanctuary' ? 'Ice Guardian Fross'
    : regionName === 'Shadow Citadel' ? 'Shadow Lord Vex'
    : 'Celestial Being';

  if (ai.narratorTone === 'hopeful') {
    return `${npcName}: "Hunter! Your discipline shines like a star. I can feel the world healing because of you. Continue your habits — we are all counting on your light. The ${regionName} has never been more alive."`;
  } else if (ai.narratorTone === 'neutral') {
    return `${npcName}: "I see you, hunter. Your path is uncertain. The ${regionName} waits to see what you will become. Will you rise, or will you fall? Complete your habits, and we will know."`;
  } else {
    return `${npcName}: "Hunter... the light grows dim. The ${regionName} suffers when you falter. But I have not given up on you. Complete just one habit today. One is enough to begin again."`;
  }
}
