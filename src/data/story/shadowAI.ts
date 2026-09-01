import type { AppState } from '../../store/types';
import { decodeStoryEvolution } from './storyEvolution';
import type { DialogueLine } from './types';

export type ShadowMode = 'watching' | 'testing' | 'trusting' | 'doubting' | 'warning' | 'revealing';

export interface ShadowMoment { mode: ShadowMode; title: string; line: string; pressure: number; }

/** Deterministic, local Shadow director. It reacts to the player's real state,
 * so the same scene can feel different without an external AI service. */
export function getShadowMoment(state: AppState, chapter: number, missionDone: boolean): ShadowMoment {
  const evo = decodeStoryEvolution(state.storyAchievements, state.storyLoreUnlocked);
  const trust = evo.flags.shadow_trust ?? 0;
  const doubt = evo.flags.shadow_doubt ?? 0;
  const truth = evo.flags.truth_seeker ?? 0;
  const resolve = evo.flags.resolve ?? 0;
  const pressure = Math.min(100, chapter * 2 + doubt * 7 + (state.streak === 0 ? 15 : 0));
  if (chapter >= 25 && truth >= 4) return { mode:'revealing', title:'SHADOW // ACCESS GRANTED', line:'You kept asking questions when silence was easier. There is almost nothing left for me to hide.', pressure };
  if (doubt >= trust + 2) return { mode:'doubting', title:'SHADOW // UNCONVINCED', line:'You do not trust me. Good. Blind trust would make you exactly what the System wants.', pressure };
  if (trust >= 4) return { mode:'trusting', title:'SHADOW // ALLY', line:'You stopped needing my permission. That is why I can finally stand beside you.', pressure };
  if (!missionDone && state.streak === 0) return { mode:'warning', title:'SHADOW // PRESSURE', line:'The world is not asking you to feel ready. It is asking whether you will move anyway.', pressure };
  if (truth >= 2) return { mode:'testing', title:'SHADOW // TESTING', line:'You keep looking beneath the answer. Keep going. The first lie is never the deepest one.', pressure };
  if (resolve >= 3) return { mode:'testing', title:'SHADOW // OBSERVING', line:'You are becoming predictable in one useful way: when the path gets harder, you return.', pressure };
  return { mode:'watching', title:'SHADOW // WATCHING', line:'I am watching what you do when nobody is watching you. That is where the real story begins.', pressure };
}

export function shadowDialogue(state: AppState, chapter: number, missionDone: boolean): DialogueLine[] {
  const moment = getShadowMoment(state, chapter, missionDone);
  return [{ speaker:'Shadow', voice:'mentor', text:moment.line, emotion:moment.mode === 'trusting' ? 'happy' : moment.mode === 'revealing' ? 'mysterious' : moment.mode === 'warning' ? 'serious' : 'neutral' }];
}
