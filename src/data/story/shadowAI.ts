import type { AppState } from '../../store/types';
import { decodeStoryEvolution } from './storyEvolution';
import type { DialogueLine } from './types';

export type ShadowMode = 'watching' | 'testing' | 'trusting' | 'doubting' | 'warning' | 'revealing' | 'respecting' | 'provoking';
export type ShadowAction = 'recover' | 'complete_tasks' | 'train' | 'protect_streak' | 'seek_truth' | 'continue_story' | 'rest_and_return';

export interface ShadowMoment { mode: ShadowMode; title: string; line: string; pressure: number; }
export interface ShadowMemory {
  firstMission: boolean; firstWorkout: boolean; firstBoss: boolean; currentStreak: number; bestStreak: number;
  recentConsistency: number; workoutMomentum: number; completedMissions: number; defeatedBosses: number;
  loreCount: number; dominantPath: 'truth' | 'trust' | 'power' | 'freedom' | 'mercy' | 'resolve' | 'uncertain';
}
interface ShadowProfile {
  trust: number; suspicion: number; respect: number; curiosity: number; pressure: number; truth: number;
  resolve: number; freedom: number; power: number; mercy: number; consistency: number; recentMomentum: number;
  completedMissions: number; defeatedBosses: number; loreCount: number;
}

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));
function countTrue(values: Record<string, boolean> | undefined): number { return Object.values(values ?? {}).filter(Boolean).length; }

function getProfile(state: AppState, chapter: number, missionDone: boolean): ShadowProfile {
  const flags = decodeStoryEvolution(state.storyAchievements, state.storyLoreUnlocked).flags;
  const trust = flags.shadow_trust ?? 0;
  const suspicion = flags.shadow_doubt ?? 0;
  const truth = flags.truth_seeker ?? 0;
  const resolve = flags.resolve ?? 0;
  const freedom = flags.freedom_first ?? 0;
  const power = flags.power_first ?? 0;
  const mercy = flags.mercy ?? 0;
  const history = state.history ?? [];
  const recent = history.slice(-7);
  const recentCompleted = recent.reduce((total, day) => total + (day.allMainDone ? 1 : 0), 0);
  const recentWorkouts = recent.reduce((total, day) => total + (day.workoutCompleted ? 1 : 0), 0);
  const consistency = recent.length === 0 ? 0 : Math.round(((recentCompleted + recentWorkouts) / (recent.length * 2)) * 100);
  const recentMomentum = recent.length === 0 ? 0 : Math.round((recentWorkouts / recent.length) * 100);
  const completedMissions = countTrue(state.storyCompletedMissions);
  const defeatedBosses = countTrue(state.storyBossDefeated);
  const loreCount = state.storyLoreUnlocked?.length ?? 0;
  const pressure = clamp(chapter * 2.1 + suspicion * 8 + (state.streak === 0 ? 16 : 0) + (missionDone ? 0 : 7) + (consistency < 35 ? 10 : 0) + (chapter >= 16 ? 6 : 0));
  const respect = clamp(resolve * 9 + consistency * 0.45 + Math.min(20, state.streak * 2) + completedMissions * 0.5 + defeatedBosses * 2);
  const curiosity = clamp(truth * 13 + freedom * 7 + loreCount * 1.5 + chapter * 0.8);
  return { trust, suspicion, respect, curiosity, pressure, truth, resolve, freedom, power, mercy, consistency, recentMomentum, completedMissions, defeatedBosses, loreCount };
}

function getDominantPath(profile: ShadowProfile): ShadowMemory['dominantPath'] {
  const paths: Array<[ShadowMemory['dominantPath'], number]> = [['truth', profile.truth], ['trust', profile.trust], ['power', profile.power], ['freedom', profile.freedom], ['mercy', profile.mercy], ['resolve', profile.resolve]];
  paths.sort((a, b) => b[1] - a[1]);
  return paths[0][1] > 0 ? paths[0][0] : 'uncertain';
}

export function getShadowMemory(state: AppState): ShadowMemory {
  const profile = getProfile(state, Math.max(1, state.storyChapter + 1), false);
  return {
    firstMission: profile.completedMissions >= 1,
    firstWorkout: Boolean(state.history?.some(day => day.workoutCompleted)),
    firstBoss: profile.defeatedBosses >= 1,
    currentStreak: state.streak,
    bestStreak: state.bestStreak,
    recentConsistency: profile.consistency,
    workoutMomentum: profile.recentMomentum,
    completedMissions: profile.completedMissions,
    defeatedBosses: profile.defeatedBosses,
    loreCount: profile.loreCount,
    dominantPath: getDominantPath(profile),
  };
}

export function getShadowAction(state: AppState, chapter: number, missionDone: boolean): ShadowAction {
  const profile = getProfile(state, chapter, missionDone);
  const enabledTasks = state.mainTasks.filter(task => task.enabled);
  const completedTasks = enabledTasks.filter(task => state.coreCompleted[task.id]).length;
  const allTasksDone = enabledTasks.length > 0 && completedTasks === enabledTasks.length;
  const workoutToday = state.workoutsCompletedToday > 0 || state.workoutSessions.some(session => {
    const d = new Date(session.completedAt); const today = new Date();
    return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
  });
  if (state.streak === 0 && profile.consistency < 35) return 'recover';
  if (!allTasksDone) return 'complete_tasks';
  if (!workoutToday && profile.recentMomentum < 70) return 'train';
  if (state.streak > 0 && state.streak >= Math.max(3, Math.floor(state.bestStreak * 0.8))) return 'protect_streak';
  if (profile.truth > profile.resolve && profile.curiosity >= 40) return 'seek_truth';
  if (!missionDone) return 'continue_story';
  return 'rest_and_return';
}

function pick<T>(items: T[], seed: number): T { return items[Math.abs(seed) % items.length]; }
function getSeed(state: AppState, chapter: number, missionDone: boolean, profile: ShadowProfile): number {
  const dateSeed = Number((state.lastActiveDate ?? '').replace(/-/g, '').slice(-6)) || 0;
  return dateSeed + chapter * 31 + state.streak * 17 + state.level * 7 + profile.completedMissions * 13 + profile.truth * 19 + profile.suspicion * 23 + (missionDone ? 11 : 0);
}

const ARC_LINES: Record<number, string[]> = {
  1: ['The city taught you to obey before it taught you to choose. I want to see which lesson survives.', 'Your first step is small. The System prefers small steps because they are easier to ignore.'],
  6: ['The Glass King does not rule with chains. He rules by convincing people the cage is beautiful.', 'You are approaching the first crown. Do not confuse authority with truth.'],
  11: ['Mirrors are useful because they lie without changing your face.', 'Something in Mirrorfall has learned how to imitate you. I need to know what it cannot imitate.'],
  16: ['The war outside is loud. The war inside you is quieter, and far more important.', 'From here on, every victory will cost you an assumption.'],
  21: ['We are below the ruins now. The oldest things here were buried for a reason.', 'The deeper gate does not test strength. It tests whether you know why you are strong.'],
  26: ['Truth is no longer a reward. It is a price.', 'You wanted the final answers. Be careful what you become willing to sacrifice for them.'],
  30: ['This is the last door. I will not tell you which side is freedom.', 'I have guided you to the edge. The next decision must belong to you, not me.'],
};

export function getShadowMoment(state: AppState, chapter: number, missionDone: boolean): ShadowMoment {
  const profile = getProfile(state, chapter, missionDone);
  const seed = getSeed(state, chapter, missionDone, profile);
  const truthDominant = profile.truth >= profile.trust + 1 && profile.truth >= profile.power;
  const trustDominant = profile.trust >= profile.suspicion + 2;
  const doubtDominant = profile.suspicion >= profile.trust + 2;
  const disciplineDominant = profile.resolve >= 3 || profile.respect >= 55;
  const arcLines = ARC_LINES[chapter];

  if (arcLines && !missionDone && chapter % 5 === 1) return { mode: 'revealing', title: `SHADOW // ARC ${Math.ceil(chapter / 5)} SIGNAL`, line: pick(arcLines, seed), pressure: profile.pressure };
  if (chapter >= 25 && profile.truth >= 4) {
    return { mode: 'revealing', title: 'SHADOW // ACCESS GRANTED', line: pick(['You kept pulling at the thread. Most people stop when the truth starts pulling back.', 'You wanted answers badly enough to become dangerous. Now you finally understand why I stayed quiet.', 'The deeper you looked, the less useful your old certainty became. That was the point.'], seed), pressure: profile.pressure };
  }
  if (chapter === 30) {
    return { mode: profile.truth >= profile.power ? 'revealing' : 'testing', title: 'SHADOW // THE LAST QUESTION', line: pick(['I can give you an answer. I will not give you the decision.', 'If you need me to choose for you, then none of this was freedom.', 'Whatever you choose next will tell me who you became without my voice.'], seed), pressure: profile.pressure };
  }
  if (doubtDominant) return { mode: 'doubting', title: 'SHADOW // UNCONVINCED', line: pick(['You still do not trust me. Keep it that way. Trust should be earned, not requested.', 'Every time you question me, you make the System nervous. I almost respect that.', 'You watch my words like they are traps. Good. Some of them are.'], seed), pressure: profile.pressure };
  if (trustDominant && profile.respect >= 45) return { mode: 'trusting', title: 'SHADOW // ALLY', line: pick(['You stopped asking whether I was right. You started deciding for yourself. That is why I trust you.', 'I used to measure your obedience. Now I measure your judgment.', 'You do not need a hand on your shoulder anymore. You need a witness. I can be that.'], seed), pressure: profile.pressure };
  if (profile.consistency >= 75 && state.streak >= 5) return { mode: 'respecting', title: 'SHADOW // RESPECT', line: pick(['Again. You return when it would be easier to disappear. That habit is becoming a weapon.', 'You keep coming back. I am beginning to think your discipline is not temporary.', 'You are making consistency look less like effort and more like identity.'], seed), pressure: profile.pressure };
  if (profile.consistency < 30 && state.streak === 0) return { mode: 'warning', title: 'SHADOW // PRESSURE', line: pick(['You disappeared. I noticed. The question is not why you fell. It is whether you are going to stay there.', 'Your excuses arrived before you did. Send them away and come back.', 'You broke the rhythm. Fine. Rebuild it before the break becomes your new identity.'], seed), pressure: profile.pressure };
  if (!missionDone && profile.pressure >= 55) return { mode: 'provoking', title: 'SHADOW // PROVOCATION', line: pick(['You have enough information. What you lack now is movement.', 'The mission is still waiting. So is the version of you that finishes it.', 'You keep standing at the edge of the decision. Step forward.'], seed), pressure: profile.pressure };
  if (truthDominant) return { mode: 'testing', title: 'SHADOW // TESTING', line: pick(['You keep looking beneath the answer. Good. The first lie is rarely the deepest one.', 'Questions are changing you faster than answers ever could.', 'You are no longer chasing victory. You are chasing what victory is hiding.'], seed), pressure: profile.pressure };
  if (profile.power >= profile.truth + 2 && profile.power >= profile.mercy + 1) return { mode: 'testing', title: 'SHADOW // POWER TEST', line: pick(['You keep choosing strength first. Just remember: power reveals the person holding it.', 'You want control. I wonder what you will become when you finally have it.', 'You are collecting power faster than wisdom. That imbalance never stays quiet.'], seed), pressure: profile.pressure };
  if (disciplineDominant) return { mode: 'respecting', title: 'SHADOW // OBSERVING', line: pick(['You are becoming predictable in one useful way: when the path gets harder, you return.', 'I do not need to push you as much anymore. That is progress.', 'Discipline is becoming your answer before I finish asking the question.'], seed), pressure: profile.pressure };
  return { mode: 'watching', title: 'SHADOW // WATCHING', line: pick(['I am watching what you do when nobody is watching you. That is where the real story begins.', 'You think I am studying your choices. I am studying the pattern behind them.', 'Every completed day leaves a mark. So does every abandoned one.', 'I have seen what you say you want. Now I am watching what you repeatedly do.', 'Do not mistake silence for absence. I am still here.'], seed), pressure: profile.pressure };
}

export function shadowDialogue(state: AppState, chapter: number, missionDone: boolean): DialogueLine[] {
  const moment = getShadowMoment(state, chapter, missionDone);
  const emotion: DialogueLine['emotion'] = moment.mode === 'trusting' ? 'happy' : moment.mode === 'revealing' ? 'mysterious' : moment.mode === 'warning' || moment.mode === 'provoking' || moment.mode === 'doubting' ? 'serious' : 'neutral';
  return [{ speaker: 'Shadow', voice: 'mentor', text: moment.line, emotion }];
}
