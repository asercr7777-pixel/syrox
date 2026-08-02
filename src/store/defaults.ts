import type { AppState } from './types';
import { CORE_TASKS } from '../data/tasks';
import { DEFAULT_EXERCISES } from '../data/tasks';
import { RANKS } from '../data/ranks';

export const STORAGE_KEY = 'discipline-system-v1';

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function nowWeekKey(): string {
  const d = new Date();
  const year = d.getFullYear();
  const start = new Date(year, 0, 1);
  const diff = (d.getTime() - start.getTime()) / 86400000;
  const week = Math.ceil((diff + start.getDay() + 1) / 7);
  return `${year}-W${week}`;
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export function xpForLevel(level: number): number {
  // Exponential: each level needs more. Level 1 -> 100, scaling.
  return Math.floor(100 * Math.pow(level, 1.45));
}

export function levelFromXp(xp: number): number {
  let level = 1;
  let needed = xpForLevel(1);
  let acc = 0;
  while (xp >= acc + needed) {
    acc += needed;
    level += 1;
    needed = xpForLevel(level);
  }
  return level;
}

export function levelProgress(xp: number): { current: number; needed: number; pct: number; level: number } {
  const level = levelFromXp(xp);
  let acc = 0;
  for (let l = 1; l < level; l++) acc += xpForLevel(l);
  const intoLevel = xp - acc;
  const needed = xpForLevel(level);
  return { current: intoLevel, needed, pct: Math.min(100, (intoLevel / needed) * 100), level };
}

export function createDefaultState(): AppState {
  const mainTasks = CORE_TASKS.map((t, i) => ({
    id: t.id,
    label: t.label,
    emoji: t.emoji,
    points: t.points,
    description: '',
    category: t.category,
    enabled: true,
    order: i,
  }));
  const coreCompleted: Record<string, boolean> = {};
  for (const t of mainTasks) coreCompleted[t.id] = false;

  const workouts = {
    push: DEFAULT_EXERCISES.push.map((e) => ({ id: uid(), ...e, completed: false })),
    pull: DEFAULT_EXERCISES.pull.map((e) => ({ id: uid(), ...e, completed: false })),
    leg: DEFAULT_EXERCISES.leg.map((e) => ({ id: uid(), ...e, completed: false })),
  };

  return {
    username: 'Hunter',
    avatar: '🐺',
    avatarColor: '#7c3aed',
    bannerColor: '#1e1b4b',
    nameColor: '#fbbf24',
    theme: 'shadow',

    xp: 0,
    level: 1,
    coins: 0,
    totalPoints: 0,
    streak: 0,
    bestStreak: 0,
    lastActiveDate: null,
    streakShield: 0,

    coreCompleted,
    customCompleted: {},
    dailyXp: 0,
    dailyPoints: 0,
    dailyCap: 1000,
    lastDailyResetDate: todayStr(),

    customTasks: [],
    mainTasks,

    workouts,
    workoutsCompletedToday: 0,
    lastWorkoutDate: null,
    workoutSessions: [],
    totalWorkoutSeconds: 0,

    schedule: [
      { id: uid(), start: '06:00', end: '07:00', label: 'Pray + Quran', color: '#7c3aed', completed: false },
      { id: uid(), start: '07:00', end: '08:00', label: 'Breakfast + Water', color: '#06b6d4', completed: false },
      { id: uid(), start: '11:00', end: '12:00', label: 'Train', color: '#ff7a18', completed: false },
      { id: uid(), start: '13:00', end: '15:00', label: 'Work', color: '#3b82f6', completed: false },
      { id: uid(), start: '15:00', end: '16:00', label: 'Read', color: '#10b981', completed: false },
    ],

    dungeonClearedToday: false,
    lastDungeonDate: null,
    dungeonsCleared: 0,
    secretDungeonAvailable: false,
    secretDungeonId: null,
    secretDungeonExpiresAt: null,

    lastLoginClaimDate: null,
    loginStreak: 0,
    lastSpinDate: null,
    lastSpinRewardId: null,

    dailyChallengeIds: [],
    dailyChallengeCompleted: {},
    dailyChallengeDate: null,
    weeklyMissionIds: [],
    weeklyMissionCompleted: {},
    weeklyMissionWeek: null,

    inventory: [
      { id: 'ember', type: 'aura', obtainedAt: Date.now(), favorite: false },
    ],
    equipped: {
      aura: 'ember',
      weapon: null,
      title: null,
      shield: null,
      frame: null,
      background: null,
    },

    backgroundType: 'default',
    customBackground: null,
    backgroundVideo: null,
    backgroundBlur: 0,
    backgroundDarken: 40,
    backgroundBrightness: 100,
    selectedBackgroundId: null,

    achievements: [],

    history: [],
    notes: {},

    chat: [
      {
        id: uid(),
        role: 'ai',
        text: "Welcome, Hunter. I am your AI Coach. I'll analyze your performance, suggest tasks, and push you toward the next rank. Complete your core tasks today — the path to Shadow Monarch begins with a single push-up.",
        at: Date.now(),
      },
    ],

    friends: [
      { id: 'f1', name: 'IronWolf', level: 24, rankId: 'A', streak: 12, xp: 28000, auraColor: '#a855f7' },
      { id: 'f2', name: 'NightDancer', level: 15, rankId: 'C', streak: 5, xp: 4200, auraColor: '#38bdf8' },
      { id: 'f3', name: 'SilentBlade', level: 31, rankId: 'S', streak: 30, xp: 65000, auraColor: '#f97316' },
    ],

    soundEnabled: true,
    notifications: {
      workout: true,
      water: true,
      sleep: true,
      reading: true,
      prayer: true,
      tasks: true,
    },

    seasonXp: 0,
    seasonId: 'season-1',

    doubleXpUntil: null,
    easterEggsFound: [],
    createdAt: Date.now(),

    questProgress: {},
    questCompleted: {},
    questDateReset: null,

    storyChapterIndex: 0,
    storyObjectivesCompleted: {},
    storyChoices: {},
    storySideQuestsCompleted: {},
    storySecretQuestsUnlocked: {},
    storyCompletedChapters: [],
    storyBossDefeated: {},
    storyLog: [],

    npcReputation: {},
    npcQuestsCompleted: {},
    npcDialogueIndex: {},

    reputation: { kingdom: 0, guild: 0, guardian: 0, scholar: 0, void: 0 },

    joinedFaction: null,

    activeWorldEvent: null,
    worldEventExpiresAt: null,

    storyDungeonsCleared: {},

    loreUnlocked: ['lore_fv', 'lore_first_habit'],

    storyAchievementsUnlocked: [],

    ngPlusUnlocked: false,
    ngPlusActive: false,
    ngPlusHiddenBossesDefeated: {},

    infiniteTowerFloor: 0,
    dailyBossDate: null,
    dailyBossDefeated: false,
    weeklyRaidDamage: 0,
    weeklyRaidWeek: null,
    weeklyRaidDefeated: false,

    activeBossId: null,
    bossHpRemaining: {},
    bossDefeated: {},

    chestInventory: { common_chest: 1 },

    petId: null,
    petLevel: 1,
    petXp: 0,

    battlePassTier: 1,
    battlePassXp: 0,
    battlePassPremium: false,
    battlePassClaimedFree: [],
    battlePassClaimedPremium: [],

    lastFortuneDate: null,
    lastFortuneLuck: 3,
    lastFortuneQuote: '',

    milestoneClaimed: [],

    prestigeLevel: 0,
    prestigeMultiplier: 1,

    dailyShopSeed: null,
    dailyShopDate: null,

    secretShopAvailable: false,
    secretShopExpiresAt: null,

    searchHistory: [],

    rankRewardsClaimed: [],
  };
}

export function getStarterRank() {
  return RANKS[0];
}
