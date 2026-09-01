import type { AppState } from '../../store/types';
import { decodeStoryEvolution } from './storyEvolution';
import type { DialogueLine } from './types';

export type ShadowMode =
  | 'watching'
  | 'testing'
  | 'trusting'
  | 'doubting'
  | 'warning'
  | 'revealing'
  | 'respecting'
  | 'provoking';

export interface ShadowMoment {
  mode: ShadowMode;
  title: string;
  line: string;
  pressure: number;
}

interface ShadowProfile {
  trust: number;
  suspicion: number;
  respect: number;
  curiosity: number;
  pressure: number;
  truth: number;
  resolve: number;
  freedom: number;
  power: number;
  mercy: number;
  consistency: number;
  recentMomentum: number;
  completedMissions: number;
  defeatedBosses: number;
  loreCount: number;
}

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));

function countTrue(values: Record<string, boolean> | undefined): number {
  return Object.values(values ?? {}).filter(Boolean).length;
}

function getProfile(state: AppState, chapter: number, missionDone: boolean): ShadowProfile {
  const evo = decodeStoryEvolution(state.storyAchievements, state.storyLoreUnlocked);
  const flags = evo.flags;

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

  const pressure = clamp(
    chapter * 2.1 +
      suspicion * 8 +
      (state.streak === 0 ? 16 : 0) +
      (missionDone ? 0 : 7) +
      (consistency < 35 ? 10 : 0),
  );

  const respect = clamp(
    resolve * 9 +
      consistency * 0.45 +
      Math.min(20, state.streak * 2) +
      completedMissions * 0.5 +
      defeatedBosses * 2,
  );

  const curiosity = clamp(truth * 13 + freedom * 7 + loreCount * 1.5 + chapter * 0.8);

  return {
    trust,
    suspicion,
    respect,
    curiosity,
    pressure,
    truth,
    resolve,
    freedom,
    power,
    mercy,
    consistency,
    recentMomentum,
    completedMissions,
    defeatedBosses,
    loreCount,
  };
}

function pick<T>(items: T[], seed: number): T {
  return items[Math.abs(seed) % items.length];
}

function getSeed(state: AppState, chapter: number, missionDone: boolean, profile: ShadowProfile): number {
  const dateSeed = Number((state.lastActiveDate ?? '').replace(/-/g, '').slice(-6)) || 0;
  return (
    dateSeed +
    chapter * 31 +
    state.streak * 17 +
    state.level * 7 +
    profile.completedMissions * 13 +
    profile.truth * 19 +
    profile.suspicion * 23 +
    (missionDone ? 11 : 0)
  );
}

/**
 * Behavior-driven local Shadow engine.
 *
 * Shadow does not use a cloud LLM or fabricate player data. Instead, it reads
 * the player's real progression and story history and turns those signals into
 * a persistent-feeling relationship: trust, suspicion, respect, curiosity and
 * pressure all change the kind of Shadow that appears.
 */
export function getShadowMoment(state: AppState, chapter: number, missionDone: boolean): ShadowMoment {
  const profile = getProfile(state, chapter, missionDone);
  const seed = getSeed(state, chapter, missionDone, profile);

  const truthDominant = profile.truth >= profile.trust + 1 && profile.truth >= profile.power;
  const trustDominant = profile.trust >= profile.suspicion + 2;
  const doubtDominant = profile.suspicion >= profile.trust + 2;
  const disciplineDominant = profile.resolve >= 3 || profile.respect >= 55;

  if (chapter >= 25 && profile.truth >= 4) {
    const lines = [
      'You kept pulling at the thread. Most people stop when the truth starts pulling back.',
      'You wanted answers badly enough to become dangerous. Now you finally understand why I stayed quiet.',
      'The deeper you looked, the less useful your old certainty became. That was the point.',
    ];
    return {
      mode: 'revealing',
      title: 'SHADOW // ACCESS GRANTED',
      line: pick(lines, seed),
      pressure: profile.pressure,
    };
  }

  if (doubtDominant) {
    const lines = [
      'You still do not trust me. Keep it that way. Trust should be earned, not requested.',
      'Every time you question me, you make the System nervous. I almost respect that.',
      'You watch my words like they are traps. Good. Some of them are.',
    ];
    return {
      mode: 'doubting',
      title: 'SHADOW // UNCONVINCED',
      line: pick(lines, seed),
      pressure: profile.pressure,
    };
  }

  if (trustDominant && profile.respect >= 45) {
    const lines = [
      'You stopped asking whether I was right. You started deciding for yourself. That is why I trust you.',
      'I used to measure your obedience. Now I measure your judgment.',
      'You do not need a hand on your shoulder anymore. You need a witness. I can be that.',
    ];
    return {
      mode: 'trusting',
      title: 'SHADOW // ALLY',
      line: pick(lines, seed),
      pressure: profile.pressure,
    };
  }

  if (profile.consistency >= 75 && state.streak >= 5) {
    const lines = [
      'Again. You return when it would be easier to disappear. That habit is becoming a weapon.',
      'Five days, and you still came back. I am beginning to think your discipline is not temporary.',
      'You are making consistency look less like effort and more like identity.',
    ];
    return {
      mode: 'respecting',
      title: 'SHADOW // RESPECT',
      line: pick(lines, seed),
      pressure: profile.pressure,
    };
  }

  if (profile.consistency < 30 && state.streak === 0) {
    const lines = [
      'You disappeared. I noticed. The question is not why you fell. It is whether you are going to stay there.',
      'Your excuses arrived before you did. Send them away and come back.',
      'You broke the rhythm. Fine. Rebuild it before the break becomes your new identity.',
    ];
    return {
      mode: 'warning',
      title: 'SHADOW // PRESSURE',
      line: pick(lines, seed),
      pressure: profile.pressure,
    };
  }

  if (!missionDone && profile.pressure >= 55) {
    const lines = [
      'You have enough information. What you lack now is movement.',
      'The mission is still waiting. So is the version of you that finishes it.',
      'You keep standing at the edge of the decision. Step forward.',
    ];
    return {
      mode: 'provoking',
      title: 'SHADOW // PROVOCATION',
      line: pick(lines, seed),
      pressure: profile.pressure,
    };
  }

  if (truthDominant) {
    const lines = [
      'You keep looking beneath the answer. Good. The first lie is rarely the deepest one.',
      'Questions are changing you faster than answers ever could.',
      'You are no longer chasing victory. You are chasing what victory is hiding.',
    ];
    return {
      mode: 'testing',
      title: 'SHADOW // TESTING',
      line: pick(lines, seed),
      pressure: profile.pressure,
    };
  }

  if (profile.power >= profile.truth + 2 && profile.power >= profile.mercy + 1) {
    const lines = [
      'You keep choosing strength first. Just remember: power reveals the person holding it.',
      'You want control. I wonder what you will become when you finally have it.',
      'You are collecting power faster than wisdom. That imbalance never stays quiet.',
    ];
    return {
      mode: 'testing',
      title: 'SHADOW // POWER TEST',
      line: pick(lines, seed),
      pressure: profile.pressure,
    };
  }

  if (disciplineDominant) {
    const lines = [
      'You are becoming predictable in one useful way: when the path gets harder, you return.',
      'I do not need to push you as much anymore. That is progress.',
      'Discipline is becoming your answer before I finish asking the question.',
    ];
    return {
      mode: 'respecting',
      title: 'SHADOW // OBSERVING',
      line: pick(lines, seed),
      pressure: profile.pressure,
    };
  }

  const lines = [
    'I am watching what you do when nobody is watching you. That is where the real story begins.',
    'You think I am studying your choices. I am studying the pattern behind them.',
    'Every completed day leaves a mark. So does every abandoned one.',
    'I have seen what you say you want. Now I am watching what you repeatedly do.',
    'Do not mistake silence for absence. I am still here.',
  ];

  return {
    mode: 'watching',
    title: 'SHADOW // WATCHING',
    line: pick(lines, seed),
    pressure: profile.pressure,
  };
}

export function shadowDialogue(state: AppState, chapter: number, missionDone: boolean): DialogueLine[] {
  const moment = getShadowMoment(state, chapter, missionDone);
  const emotion: DialogueLine['emotion'] =
    moment.mode === 'trusting'
      ? 'happy'
      : moment.mode === 'revealing'
        ? 'mysterious'
        : moment.mode === 'warning' || moment.mode === 'provoking'
          ? 'serious'
          : moment.mode === 'doubting'
            ? 'serious'
            : 'neutral';

  return [
    {
      speaker: 'Shadow',
      voice: 'mentor',
      text: moment.line,
      emotion,
    },
  ];
}
