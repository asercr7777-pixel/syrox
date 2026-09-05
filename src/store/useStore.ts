import { useEffect, useReducer } from 'react';
import type { AppState, DropResult, InventoryItem, WorkoutSessionRecord, MainTask } from './types';
import { createDefaultState, levelFromXp, todayStr, uid, nowWeekKey } from './defaults';
import { DAILY_CHALLENGES, DAILY_LOGIN_REWARDS, SPIN_REWARDS } from '../data/tasks';
import { RANKS, getRankByXp, getRankIndex } from '../data/ranks';
import { AURAS, RARITY_META, WEAPONS, TITLES, type Rarity } from '../data/collections';
import { DUNGEONS, SECRET_DUNGEONS, BOSS_DUNGEON } from '../data/dungeons';
import { playSound } from '../lib/sound';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { ALL_CHAPTERS, getTotalChapters } from '../data/story';
import { getChestById } from '../data/chests';
import { getBattlePassReward } from '../data/battlepass';
import { getMilestoneById } from '../data/milestones';

const ALL_STORY_CHAPTER_COUNT = getTotalChapters();
const VALID_STORY_MISSION_IDS = new Set(ALL_CHAPTERS.flatMap((chapter) => chapter.missions.map((mission) => mission.id)));
const VALID_STORY_BOSS_IDS = new Set(ALL_CHAPTERS.map((chapter) => chapter.boss.id));
const VALID_STORY_LORE_IDS = new Set(ALL_CHAPTERS.flatMap((chapter) => chapter.boss.rewardLore ? [chapter.boss.rewardLore] : []));

// ---------------------------------------------------------------------------
// Module-level singleton state — shared across ALL components that call
// useStore(). This eliminates the bug where independent useState instances
// in different components overwrite each other's data.
// ---------------------------------------------------------------------------

let globalState: AppState = createDefaultState();
let globalCloudLoaded = false;
let globalUserId: string | null = null;
let dailyResetDone = false;
let saveTimer: number | null = null;
let leaderboardSyncTimer: number | null = null;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}


function pickValidRecord<T>(record: Record<string, T> | undefined, validIds: Set<string>): Record<string, T> {
  if (!record) return {};
  return Object.fromEntries(Object.entries(record).filter(([id]) => validIds.has(id)));
}

function pickValidArray(values: string[] | undefined, validIds: Set<string>): string[] {
  if (!values) return [];
  return values.filter((id, index, arr) => validIds.has(id) && arr.indexOf(id) === index);
}

function normalizeLoadedState(cloudState: AppState, def: AppState): AppState {
  const safeMainTasks = cloudState.mainTasks && cloudState.mainTasks.length > 0
    ? cloudState.mainTasks.map((task, index) => ({ ...task, order: Number.isFinite(task.order) ? task.order : index }))
    : def.mainTasks;
  const safeCoreCompleted = cloudState.mainTasks && cloudState.mainTasks.length > 0
    ? Object.fromEntries(safeMainTasks.map((task) => [task.id, Boolean(cloudState.coreCompleted?.[task.id])]))
    : def.coreCompleted;
  const safeInventory = Array.from(
    new Map(
      (cloudState.inventory ?? []).map((item) => [`${item.type}:${item.id}`, {
        ...item,
        obtainedAt: Number.isFinite(item.obtainedAt) ? item.obtainedAt : Date.now(),
        favorite: Boolean(item.favorite),
      }])
    ).values()
  );

  return {
    ...def,
    ...cloudState,
    xp: Math.max(0, Number.isFinite(cloudState.xp) ? cloudState.xp : def.xp),
    coins: Math.max(0, Number.isFinite(cloudState.coins) ? cloudState.coins : def.coins),
    totalPoints: Math.max(0, Number.isFinite(cloudState.totalPoints) ? cloudState.totalPoints : def.totalPoints),
    dailyXp: Math.max(0, Math.min(Number.isFinite(cloudState.dailyXp) ? cloudState.dailyXp : 0, 1000)),
    dailyPoints: Math.max(0, Number.isFinite(cloudState.dailyPoints) ? cloudState.dailyPoints : def.dailyPoints),
    dailyCap: 1000,
    level: levelFromXp(Math.max(0, Number.isFinite(cloudState.xp) ? cloudState.xp : def.xp)),
    storyChapter: Math.max(0, Math.min(cloudState.storyChapter ?? 0, ALL_STORY_CHAPTER_COUNT)),
    storyMission: Math.max(0, cloudState.storyMission ?? 0),
    storyCompletedMissions: pickValidRecord(cloudState.storyCompletedMissions, VALID_STORY_MISSION_IDS),
    storyBossDefeated: pickValidRecord(cloudState.storyBossDefeated, VALID_STORY_BOSS_IDS),
    storyLoreUnlocked: pickValidArray(cloudState.storyLoreUnlocked, VALID_STORY_LORE_IDS),
    storyChoices: cloudState.storyChoices ?? {},
    storyNpcReputation: cloudState.storyNpcReputation ?? {},
    storyAchievements: Array.from(new Set(cloudState.storyAchievements ?? [])),
    mainTasks: safeMainTasks,
    coreCompleted: safeCoreCompleted,
    inventory: safeInventory,
    customCompleted: cloudState.customCompleted ?? {},
    equipped: { ...def.equipped, ...cloudState.equipped },
    notifications: { ...def.notifications, ...cloudState.notifications },
    chestInventory: Object.fromEntries(
      Object.entries({ ...def.chestInventory, ...cloudState.chestInventory }).map(([id, count]) => [id, Math.max(0, Math.floor(Number(count) || 0))])
    ),
    bossHpRemaining: cloudState.bossHpRemaining ?? {},
    bossDefeated: cloudState.bossDefeated ?? {},
    workoutRewardsClaimedToday: { ...(cloudState.workoutRewardsClaimedToday ?? {}), push: cloudState.workoutRewardsClaimedToday?.push ?? false, pull: cloudState.workoutRewardsClaimedToday?.pull ?? false, leg: cloudState.workoutRewardsClaimedToday?.leg ?? false },
  };
}

function setState(updater: (s: AppState) => AppState) {
  globalState = updater(globalState);
  notify();
  scheduleAutoSave();
}

function scheduleAutoSave() {
  if (!globalCloudLoaded || !globalUserId) return;
  if (saveTimer !== null) window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    saveTimer = null;
    void saveToCloudInternal(globalState);
  }, 1500);
}

function flushSave() {
  if (saveTimer !== null) {
    window.clearTimeout(saveTimer);
    saveTimer = null;
  }
  if (globalCloudLoaded && globalUserId) {
    void saveToCloudInternal(globalState);
  }
}

async function saveToCloudInternal(state: AppState) {
  if (!isSupabaseConfigured() || !globalUserId) return;
  try {
    const { error } = await supabase.from('user_state').upsert({
      user_id: globalUserId,
      state,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
    if (error) console.error('[saveToCloud] database error:', error);
  } catch (err) {
    console.error('[saveToCloud] error:', err);
  }
}

async function syncLeaderboardInternal(state: AppState) {
  if (!isSupabaseConfigured() || !globalUserId) return;
  try {
    const rank = getRankByXp(state.xp);
    const disciplineScore = calculateDisciplineScore(state);
    const tasksCompleted = state.history.reduce((acc, h) => {
      return acc + Object.values(h.coreCompleted).filter(Boolean).length + Object.values(h.customCompleted).filter(Boolean).length;
    }, 0);
    const row = {
      username: state.username,
      avatar: state.avatar,
      xp: state.xp,
      level: state.level,
      total_points: state.totalPoints,
      streak: state.streak,
      discipline_score: disciplineScore,
      tasks_completed: tasksCompleted,
      rank_id: rank.id,
      rank_name: rank.name,
      rank_emoji: rank.emoji,
      aura_color: state.equipped.aura ? AURAS.find((a) => a.id === state.equipped.aura)?.color ?? '#ff7a18' : '#ff7a18',
      background_type: state.backgroundType,
      background_value: state.customBackground ?? state.backgroundVideo ?? state.selectedBackgroundId,
      updated_at: new Date().toISOString(),
    };
    await supabase.from('leaderboard').upsert({ user_id: globalUserId, ...row }, { onConflict: 'user_id' });
  } catch (err) {
    console.error('[syncLeaderboard] error:', err);
  }
}

function doDailyReset() {
  const today = todayStr();
  setState((s) => {
    if (s.lastDailyResetDate === today) return s;
    let newStreak = s.streak;
    const newBestStreak = s.bestStreak;
    let newStreakShield = s.streakShield;

    if (s.lastActiveDate && s.lastActiveDate !== today) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      if (s.lastActiveDate !== yesterday) {
        if (newStreakShield > 0) {
          newStreakShield -= 1;
        } else {
          newStreak = 0;
        }
      }
    }

    const shuffled = [...DAILY_CHALLENGES].sort(() => Math.random() - 0.5).slice(0, 3);
    const challengeIds = shuffled.map((c) => c.id);

    let secretAvailable = s.secretDungeonAvailable;
    let secretId = s.secretDungeonId;
    let secretExpires = s.secretDungeonExpiresAt;
    if (!secretAvailable && Math.random() < 0.12) {
      const pick = SECRET_DUNGEONS[Math.floor(Math.random() * SECRET_DUNGEONS.length)];
      secretAvailable = true;
      secretId = pick.id;
      secretExpires = Date.now() + 6 * 3600 * 1000;
    }

    const currentWeek = nowWeekKey();
    const currentMonth = today.slice(0, 7);
    const lastReset = s.lastDailyResetDate ?? today;
    const monthChanged = lastReset.slice(0, 7) !== currentMonth;
    void monthChanged;

    return {
      ...s,
      coreCompleted: Object.fromEntries(s.mainTasks.filter(t => t.enabled).map((t) => [t.id, false])),
      customCompleted: {},
      dailyXp: 0,
      dailyPoints: 0,
      lastDailyResetDate: today,
      workoutsCompletedToday: 0,
      workoutRewardsClaimedToday: { push: false, pull: false, leg: false },
      workouts: {
        push: s.workouts.push.map((e) => ({ ...e, completed: false })),
        pull: s.workouts.pull.map((e) => ({ ...e, completed: false })),
        leg: s.workouts.leg.map((e) => ({ ...e, completed: false })),
      },
      schedule: s.schedule.map((sl) => ({ ...sl, completed: false })),
      dungeonClearedToday: false,
      dailyChallengeIds: challengeIds,
      dailyChallengeCompleted: {},
      dailyChallengeDate: today,
      weeklyMissionWeek: currentWeek,
      streak: newStreak,
      bestStreak: newBestStreak,
      streakShield: newStreakShield,
      secretDungeonAvailable: secretAvailable,
      secretDungeonId: secretId,
      secretDungeonExpiresAt: secretExpires,
    };
  });
}

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

function addXp(s: AppState, amount: number): AppState {
  let xp = s.xp;
  let level = s.level;
  let coins = s.coins;
  let leveledUp = false;
  let multiplier = 1;
  if (s.doubleXpUntil && s.doubleXpUntil > Date.now()) multiplier = 2;
  const effective = Math.floor(amount * multiplier);
  xp += effective;
  const newLevel = levelFromXp(xp);
  if (newLevel > level) {
    level = newLevel;
    leveledUp = true;
    coins += (newLevel - s.level) * 50;
  }
  if (leveledUp) {
    setTimeout(() => playSound('levelup'), 50);
  }
  const oldRank = getRankByXp(s.xp);
  const newRank = getRankByXp(xp);
  if (newRank.id !== oldRank.id && getRankIndex(newRank.id) > getRankIndex(oldRank.id)) {
    setTimeout(() => playSound('rankup'), 150);
  }
  return { ...s, xp, level, coins };
}



function addPoints(s: AppState, xp: number, points: number): AppState {
  const dailyRemaining = s.dailyCap - s.dailyXp;
  const cappedXp = Math.max(0, Math.min(xp, dailyRemaining));
  if (cappedXp <= 0) return s;
  let next = addXp(s, cappedXp);
  next = {
    ...next,
    totalPoints: next.totalPoints + points,
    dailyXp: next.dailyXp + cappedXp,
    dailyPoints: next.dailyPoints + points,
  };
  const today = todayStr();
  const enabledMain = next.mainTasks.filter((t) => t.enabled);
  const allMain = enabledMain.every((t) => next.coreCompleted[t.id]);
  const disciplineScore = calculateDisciplineScore(next);
  const existing = next.history.find((h) => h.date === today);
  const dayRecord = {
    date: today,
    coreCompleted: next.coreCompleted,
    customCompleted: next.customCompleted,
    xpGained: next.dailyXp,
    pointsGained: next.dailyPoints,
    workoutCompleted: next.workoutsCompletedToday > 0,
    dungeonCleared: next.dungeonClearedToday,
    allMainDone: allMain,
    disciplineScore,
  };
  if (existing) {
    next = { ...next, history: next.history.map((h) => (h.date === today ? dayRecord : h)) };
  } else {
    next = { ...next, history: [...next.history, dayRecord] };
  }
  return next;
}

function rollRarity(bonusLegendary = 0): Rarity {
  const r = Math.random() * 100;
  let acc = 0;
  const tiers: { rarity: Rarity; weight: number }[] = [
    { rarity: 'common', weight: 50 },
    { rarity: 'rare', weight: 30 },
    { rarity: 'epic', weight: 15 },
    { rarity: 'legendary', weight: 4.5 + bonusLegendary },
    { rarity: 'mythic', weight: 0.4 },
    { rarity: 'secret', weight: 0.1 },
  ];
  for (const t of tiers) {
    acc += t.weight;
    if (r < acc) return t.rarity;
  }
  return 'common';
}

function pickFromRarity<T extends { rarity: Rarity; id: string }>(items: T[], rarity: Rarity): T | null {
  const pool = items.filter((i) => i.rarity === rarity);
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

function generateDrops(auraBonus = 0): DropResult[] {
  const drops: DropResult[] = [];
  const auraRoll = Math.random();
  if (auraRoll < 0.01 + auraBonus) {
    const legendary = AURAS.filter((a) => a.rarity === 'legendary');
    const pick = legendary[Math.floor(Math.random() * legendary.length)];
    drops.push({ type: 'aura', itemId: pick.id, rarity: 'legendary', label: pick.name });
  } else if (auraRoll < 0.2 + auraBonus) {
    const normal = AURAS.filter((a) => a.rarity === 'common' || a.rarity === 'rare' || a.rarity === 'epic');
    const pick = normal[Math.floor(Math.random() * normal.length)];
    drops.push({ type: 'aura', itemId: pick.id, rarity: pick.rarity, label: pick.name });
  }
  if (Math.random() < 0.15) {
    const rarity = rollRarity();
    const w = pickFromRarity(WEAPONS, rarity);
    if (w) drops.push({ type: 'weapon', itemId: w.id, rarity, label: w.name });
  }
  if (Math.random() < 0.1) {
    const rarity = rollRarity();
    const t = pickFromRarity(TITLES, rarity);
    if (t) drops.push({ type: 'title', itemId: t.id, rarity, label: t.name });
  }
  return drops;
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

function calculateDisciplineScore(state: AppState): number {
  const enabledMain = state.mainTasks.filter((t) => t.enabled);
  const mainDone = enabledMain.filter((t) => Boolean(state.coreCompleted[t.id])).length;
  const extraDone = state.customTasks.filter((t) => Boolean(state.customCompleted[t.id])).length;
  const totalPossible = enabledMain.length + state.customTasks.length;
  if (totalPossible <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round(((mainDone + extraDone) / totalPossible) * 100)));
}

// ---------------------------------------------------------------------------
// Actions — module-level functions operating on globalState
// ---------------------------------------------------------------------------

function updateProfile(patch: Partial<Pick<AppState, 'username' | 'avatar' | 'avatarColor' | 'bannerColor' | 'nameColor' | 'theme'>>) {
  setState((s) => ({ ...s, ...patch }));
  if (isSupabaseConfigured() && globalUserId) {
    const profilePatch: Record<string, string> = {};
    if ('username' in patch) profilePatch.username = patch.username!;
    if ('avatar' in patch) profilePatch.avatar = patch.avatar!;
    if ('avatarColor' in patch) profilePatch.avatar_color = patch.avatarColor!;
    if ('bannerColor' in patch) profilePatch.banner_color = patch.bannerColor!;
    if ('nameColor' in patch) profilePatch.name_color = patch.nameColor!;
    if ('theme' in patch) profilePatch.theme = patch.theme!;
    if (Object.keys(profilePatch).length > 0) {
      void supabase.from('profiles').upsert({ id: globalUserId, ...profilePatch }).then(({ error }) => {
        if (error) console.error('[updateProfile] sync error:', error);
      });
    }
  }
}

function toggleCoreTask(id: string) {
  setState((s) => {
    const task = s.mainTasks.find((t) => t.id === id);
    if (!task) return s;
    const wasCompleted = s.coreCompleted[id];
    const next = { ...s, coreCompleted: { ...s.coreCompleted, [id]: !wasCompleted } };
    if (!wasCompleted) {
      const coinReward = Math.max(10, Math.floor(task.points * 0.3));
      const withPoints = addPoints(next, task.points, task.points);
      const withCoins = { ...withPoints, coins: withPoints.coins + coinReward };
      playSound('task');
      const allDone = s.mainTasks.filter((t) => t.enabled).every((t) => withCoins.coreCompleted[t.id]);
      if (allDone) {
        const today = todayStr();
        if (s.lastActiveDate !== today) {
          const newStreak = s.streak + 1;
          return {
            ...withCoins,
            streak: newStreak,
            bestStreak: Math.max(s.bestStreak, newStreak),
            lastActiveDate: today,
            coins: withCoins.coins + 50,
          };
        }
        return withCoins;
      }
      return withCoins;
    } else {
      const coinReward = Math.max(10, Math.floor(task.points * 0.3));
      const xp = Math.max(0, s.xp - task.points);
      return {
        ...next,
        xp,
        level: levelFromXp(xp),
        coins: Math.max(0, s.coins - coinReward),
        totalPoints: Math.max(0, s.totalPoints - task.points),
        dailyXp: Math.max(0, s.dailyXp - task.points),
        dailyPoints: Math.max(0, s.dailyPoints - task.points),
      };
    }
  });
}

function toggleCustomTask(id: string) {
  setState((s) => {
    const task = s.customTasks.find((t) => t.id === id);
    if (!task) return s;
    const wasCompleted = s.customCompleted[id];
    const next = { ...s, customCompleted: { ...s.customCompleted, [id]: !wasCompleted } };
    if (!wasCompleted) {
      const coinReward = Math.max(5, Math.floor(task.points * 0.2));
      playSound('task');
      const withPoints = addPoints(next, task.points, task.points);
      return { ...withPoints, coins: withPoints.coins + coinReward };
    } else {
      const coinReward = Math.max(5, Math.floor(task.points * 0.2));
      const xp = Math.max(0, s.xp - task.points);
      return {
        ...next,
        xp,
        level: levelFromXp(xp),
        coins: Math.max(0, s.coins - coinReward),
        totalPoints: Math.max(0, s.totalPoints - task.points),
        dailyXp: Math.max(0, s.dailyXp - task.points),
        dailyPoints: Math.max(0, s.dailyPoints - task.points),
      };
    }
  });
}

function addCustomTask(label: string, emoji: string, points: number) {
  setState((s) => ({
    ...s,
    customTasks: [...s.customTasks, { id: uid(), label, emoji, points, createdAt: Date.now() }],
  }));
}

function updateCustomTask(id: string, patch: { label?: string; emoji?: string; points?: number }) {
  setState((s) => ({
    ...s,
    customTasks: s.customTasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
  }));
}

function deleteCustomTask(id: string) {
  setState((s) => ({
    ...s,
    customTasks: s.customTasks.filter((t) => t.id !== id),
    customCompleted: Object.fromEntries(Object.entries(s.customCompleted).filter(([k]) => k !== id)),
  }));
}

function addMainTask(data: { label: string; emoji: string; points: number; description?: string; category?: 'body' | 'mind' | 'spirit' | 'work' }) {
  setState((s) => {
    const newTask: MainTask = {
      id: uid(),
      label: data.label,
      emoji: data.emoji,
      points: data.points,
      description: data.description ?? '',
      category: data.category ?? 'body',
      enabled: true,
      order: s.mainTasks.length,
    };
    return {
      ...s,
      mainTasks: [...s.mainTasks, newTask],
      coreCompleted: { ...s.coreCompleted, [newTask.id]: false },
    };
  });
}

function updateMainTask(id: string, patch: { label?: string; emoji?: string; points?: number; description?: string; category?: 'body' | 'mind' | 'spirit' | 'work'; enabled?: boolean }) {
  setState((s) => ({
    ...s,
    mainTasks: s.mainTasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
  }));
}

function deleteMainTask(id: string) {
  setState((s) => {
    const remaining = s.mainTasks.filter((t) => t.id !== id).map((t, i) => ({ ...t, order: i }));
    const newCoreCompleted = { ...s.coreCompleted };
    delete newCoreCompleted[id];
    return {
      ...s,
      mainTasks: remaining,
      coreCompleted: newCoreCompleted,
    };
  });
}

function reorderMainTask(id: string, direction: 'up' | 'down') {
  setState((s) => {
    const tasks = [...s.mainTasks].sort((a, b) => a.order - b.order);
    const idx = tasks.findIndex((t) => t.id === id);
    if (idx === -1) return s;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= tasks.length) return s;
    [tasks[idx], tasks[swapIdx]] = [tasks[swapIdx], tasks[idx]];
    const reordered = tasks.map((t, i) => ({ ...t, order: i }));
    return { ...s, mainTasks: reordered };
  });
}

function toggleExercise(dayId: 'push' | 'pull' | 'leg', exerciseId: string) {
  setState((s) => {
    const exercises = s.workouts[dayId].map((e) => (e.id === exerciseId ? { ...e, completed: !e.completed } : e));
    const allDone = exercises.every((e) => e.completed);
    let workoutsCompleted = s.workoutsCompletedToday;
    let lastWorkout = s.lastWorkoutDate;
    const alreadyRewarded = s.workoutRewardsClaimedToday?.[dayId] ?? false;
    if (allDone && !s.workouts[dayId].every((e) => e.completed) && !alreadyRewarded) {
      workoutsCompleted += 1;
      lastWorkout = todayStr();
      playSound('task');
      const withXp = addPoints(s, 150, 150);
      return {
        ...withXp,
        workouts: { ...s.workouts, [dayId]: exercises },
        workoutsCompletedToday: workoutsCompleted,
        workoutRewardsClaimedToday: { ...s.workoutRewardsClaimedToday, [dayId]: true },
        lastWorkoutDate: lastWorkout,
      };
    }
    return { ...s, workouts: { ...s.workouts, [dayId]: exercises } };
  });
}

function addExercise(dayId: 'push' | 'pull' | 'leg', name: string, sets: number, reps: string, section: 'stretching' | 'main' | 'plyometric') {
  setState((s) => ({
    ...s,
    workouts: { ...s.workouts, [dayId]: [...s.workouts[dayId], { id: uid(), name, sets, reps, section, completed: false }] },
  }));
}

function updateExercise(dayId: 'push' | 'pull' | 'leg', exerciseId: string, patch: { name?: string; sets?: number; reps?: string }) {
  setState((s) => ({
    ...s,
    workouts: { ...s.workouts, [dayId]: s.workouts[dayId].map((e) => (e.id === exerciseId ? { ...e, ...patch } : e)) },
  }));
}

function deleteExercise(dayId: 'push' | 'pull' | 'leg', exerciseId: string) {
  setState((s) => ({
    ...s,
    workouts: { ...s.workouts, [dayId]: s.workouts[dayId].filter((e) => e.id !== exerciseId) },
  }));
}

function addScheduleSlot(slot: { start: string; end: string; label: string; color: string }) {
  setState((s) => ({ ...s, schedule: [...s.schedule, { id: uid(), ...slot, completed: false }] }));
}

function updateScheduleSlot(id: string, patch: { start?: string; end?: string; label?: string; color?: string }) {
  setState((s) => ({ ...s, schedule: s.schedule.map((sl) => (sl.id === id ? { ...sl, ...patch } : sl)) }));
}

function toggleScheduleSlot(id: string) {
  setState((s) => {
    const slot = s.schedule.find((sl) => sl.id === id);
    if (!slot) return s;
    const was = slot.completed;
    playSound('task');
    const next = { ...s, schedule: s.schedule.map((sl) => (sl.id === id ? { ...sl, completed: !was } : sl)) };
    if (!was) return addPoints(next, 20, 20);
    return next;
  });
}

function deleteScheduleSlot(id: string) {
  setState((s) => ({ ...s, schedule: s.schedule.filter((sl) => sl.id !== id) }));
}

function clearDungeon(dungeonId: string): DropResult[] {
  let drops: DropResult[] = [];
  setState((s) => {
    const dungeon = DUNGEONS.find((d) => d.id === dungeonId);
    if (!dungeon || s.dungeonClearedToday) return s;
    if (getRankIndex(getRankByXp(s.xp).id) < getRankIndex(dungeon.rankId)) return s;
    const next = addPoints(s, dungeon.rewardXp, dungeon.rewardXp);
    return { ...next, dungeonClearedToday: true, lastDungeonDate: todayStr(), dungeonsCleared: next.dungeonsCleared + 1 };
  });
  playSound('rankup');
  return drops;
}

function damageBoss(amount: number): DropResult[] {
  let drops: DropResult[] = [];
  setState((s) => {
    const bossId = 'dungeon_boss';
    if (s.bossDefeated[bossId]) return s;
    const currentHp = s.bossHpRemaining[bossId] ?? (BOSS_DUNGEON as any).hp;
    const safeAmount = Math.max(0, Math.min(100, Math.floor(Number.isFinite(amount) ? amount : 0)));
    if (safeAmount <= 0) return s;
    const actualDamage = Math.min(safeAmount, currentHp);
    const newHp = Math.max(0, currentHp - actualDamage);
    let next = addPoints(s, actualDamage, actualDamage);
    next = { ...next, bossHpRemaining: { ...next.bossHpRemaining, [bossId]: newHp } };
    if (newHp === 0) {
      next = { ...next, bossDefeated: { ...next.bossDefeated, [bossId]: true }, coins: next.coins + BOSS_DUNGEON.rewardCoins };
      next = addPoints(next, BOSS_DUNGEON.rewardXp, BOSS_DUNGEON.rewardXp);
      drops = [
        { type: 'aura', itemId: BOSS_DUNGEON.auraId, rarity: 'legendary', label: 'Shadow Monarch Aura' },
        { type: 'title', itemId: BOSS_DUNGEON.titleId, rarity: 'legendary', label: 'Shadow Monarch Title' },
        { type: 'badge', itemId: BOSS_DUNGEON.badgeId, rarity: 'legendary', label: 'Boss Slayer Badge' },
      ];
      const existing = new Set(next.inventory.map((i) => `${i.type}:${i.id}`));
      const newItems = drops.filter((d) => d.itemId && !existing.has(`${d.type}:${d.itemId}`))
        .map((d) => ({ id: d.itemId!, type: d.type as InventoryItem['type'], obtainedAt: Date.now(), favorite: false }));
      return { ...next, inventory: [...next.inventory, ...newItems] };
    }
    return next;
  });
  playSound('task');
  return drops;
}

function clearSecretDungeon(dungeonId: string): DropResult[] {
  let drops: DropResult[] = [];
  setState((s) => {
    const dungeon = SECRET_DUNGEONS.find((d) => d.id === dungeonId);
    if (!dungeon || !s.secretDungeonAvailable || s.secretDungeonId !== dungeonId) return s;
    if (s.secretDungeonExpiresAt !== null && s.secretDungeonExpiresAt < Date.now()) return s;
    const next = addPoints(s, dungeon.rewardXp, dungeon.rewardXp);
    return { ...next, secretDungeonAvailable: false, secretDungeonId: null, secretDungeonExpiresAt: null, dungeonsCleared: next.dungeonsCleared + 1 };
  });
  playSound('rankup');
  return drops;
}

function claimLoginReward(): { reward: any; newIndex: number } | null {
  let result: { reward: any; newIndex: number } | null = null;
  setState((s) => {
    const today = todayStr();
    if (s.lastLoginClaimDate === today) return s;
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const newStreak = s.lastLoginClaimDate === yesterday ? s.loginStreak + 1 : 1;
    const index = (newStreak - 1) % 30;
    const reward = DAILY_LOGIN_REWARDS[index];
    result = { reward, newIndex: index };
    let next: AppState = { ...s, lastLoginClaimDate: today, loginStreak: newStreak };
    if (reward.type === 'coins') next = { ...next, coins: next.coins + reward.amount };
    else if (reward.type === 'xp') next = addPoints(next, reward.amount, 0);
    else if (reward.type === 'chest') next = { ...next, chestInventory: { ...next.chestInventory, common_chest: (next.chestInventory.common_chest ?? 0) + reward.amount } };
    else if (reward.type === 'aura') {
      const pool = AURAS.filter((a) => a.rarity === reward.aura);
      const pick = pool[Math.floor(Math.random() * pool.length)];
      if (pick && !next.inventory.some((i) => i.id === pick.id && i.type === 'aura')) next = { ...next, inventory: [...next.inventory, { id: pick.id, type: 'aura', obtainedAt: Date.now(), favorite: false }] };
      else if (pick) next = { ...next, coins: next.coins + 150 };
    }
    if (reward.shield) next = { ...next, streakShield: next.streakShield + 1 };
    return next;
  });
  if (result) playSound('reward');
  return result;
}

function spinWheel(): DropResult | null {
  let result: DropResult | null = null;
  setState((s) => {
    const today = todayStr();
    if (s.lastSpinDate === today) return s;
    const totalWeight = SPIN_REWARDS.reduce((a, r) => a + r.weight, 0);
    let roll = Math.random() * totalWeight;
    let chosen = SPIN_REWARDS[0];
    for (const r of SPIN_REWARDS) {
      roll -= r.weight;
      if (roll <= 0) { chosen = r; break; }
    }
    let next: AppState = { ...s, lastSpinDate: today, lastSpinRewardId: chosen.id };
    if (chosen.type === 'coins') {
      next = { ...next, coins: next.coins + chosen.amount };
      result = { type: 'coins', amount: chosen.amount, label: `${chosen.amount} Coins` };
    } else if (chosen.type === 'xp') {
      next = addPoints(next, chosen.amount, 0);
      result = { type: 'xp', amount: chosen.amount, label: `${chosen.amount} XP` };
    } else if (chosen.type === 'shards') {
      const coins = chosen.amount * 10;
      next = { ...next, coins: next.coins + coins };
      result = { type: 'coins', amount: coins, label: `${coins} Coins (Aura Shards converted)` };
    } else if (chosen.type === 'double_xp') {
      next = { ...next, doubleXpUntil: Date.now() + 3600 * 1000 };
      result = { type: 'xp', amount: 0, label: 'Double XP for 1 hour' };
    } else if (chosen.type === 'chest') {
      next = { ...next, chestInventory: { ...next.chestInventory, common_chest: (next.chestInventory.common_chest ?? 0) + 1 } };
      result = { type: 'chest', amount: 1, label: 'Mystery Chest' };
    } else if (chosen.type === 'weapon' || chosen.type === 'aura') {
      const pool = chosen.type === 'weapon' ? WEAPONS : AURAS;
      const rarity = rollRarity();
      const item = pickFromRarity(pool as any, rarity) as any;
      if (item && !next.inventory.some((i) => i.id === item.id && i.type === chosen.type)) {
        next = { ...next, inventory: [...next.inventory, { id: item.id, type: chosen.type, obtainedAt: Date.now(), favorite: false }] };
        result = { type: chosen.type, itemId: item.id, rarity, label: item.name };
      } else {
        const coins = chosen.type === 'weapon' ? 100 : 150;
        next = { ...next, coins: next.coins + coins };
        result = { type: 'coins', amount: coins, label: `${coins} Coins (duplicate conversion)` };
      }
    }
    return next;
  });
  playSound('reward');
  return result;
}

function claimChallenge(challengeId: string) {
  setState((s) => {
    const challenge = DAILY_CHALLENGES.find((c) => c.id === challengeId);
    if (!challenge) return s;
    if (s.dailyChallengeCompleted[challengeId]) return s;
    if (!challenge.check(s)) return s;
    let next = addPoints(s, challenge.xp, 0);
    next = { ...next, coins: next.coins + challenge.coins + 25, dailyChallengeCompleted: { ...next.dailyChallengeCompleted, [challengeId]: true } };
    return next;
  });
  playSound('task');
}

function equipItem(type: 'aura' | 'weapon' | 'title' | 'shield' | 'frame' | 'background', itemId: string) {
  setState((s) => {
    if (!s.inventory.some((item) => item.id === itemId && item.type === type)) return s;
    return { ...s, equipped: { ...s.equipped, [type]: itemId } };
  });
}

function unequipItem(type: 'aura' | 'weapon' | 'title' | 'shield' | 'frame' | 'background') {
  setState((s) => ({ ...s, equipped: { ...s.equipped, [type]: null } }));
}

function toggleFavorite(itemId: string) {
  setState((s) => ({ ...s, inventory: s.inventory.map((i) => (i.id === itemId ? { ...i, favorite: !i.favorite } : i)) }));
}

function addItem(item: { id: string; type: InventoryItem['type'] }) {
  setState((s) => {
    if (s.inventory.some((i) => i.id === item.id && i.type === item.type)) return s;
    return { ...s, inventory: [...s.inventory, { id: item.id, type: item.type, obtainedAt: Date.now(), favorite: false }] };
  });
}

function setCustomBackground(dataUrl: string | null) {
  setState((s) => ({ ...s, customBackground: dataUrl, backgroundType: dataUrl ? 'image' : s.backgroundVideo ? 'video' : s.selectedBackgroundId ? 'animated' : 'default' }));
}

function setBackgroundVideo(dataUrl: string | null) {
  setState((s) => ({ ...s, backgroundVideo: dataUrl, backgroundType: dataUrl ? 'video' : s.customBackground ? 'image' : s.selectedBackgroundId ? 'animated' : 'default' }));
}

function setBackgroundType(type: 'default' | 'image' | 'video' | 'animated') {
  setState((s) => ({ ...s, backgroundType: type }));
}

function setBackgroundBlur(n: number) {
  setState((s) => ({ ...s, backgroundBlur: n }));
}

function setBackgroundDarken(n: number) {
  setState((s) => ({ ...s, backgroundDarken: n }));
}

function setBackgroundBrightness(n: number) {
  setState((s) => ({ ...s, backgroundBrightness: n }));
}

function setSelectedBackground(id: string | null) {
  setState((s) => ({ ...s, selectedBackgroundId: id }));
}

function toggleSound() {
  setState((s) => ({ ...s, soundEnabled: !s.soundEnabled }));
}

function updateNotifications(patch: Partial<AppState['notifications']>) {
  setState((s) => ({ ...s, notifications: { ...s.notifications, ...patch } }));
}

function sendChat(text: string) {
  const userMsg = { id: uid(), role: 'user' as const, text, at: Date.now() };
  setState((s) => ({ ...s, chat: [...s.chat, userMsg] }));
}

function addAIMessage(text: string) {
  const aiMsg = { id: uid(), role: 'ai' as const, text, at: Date.now() };
  setState((s) => ({ ...s, chat: [...s.chat, aiMsg] }));
}

function addFriend(name: string) {
  setState((s) => ({
    ...s,
    friends: [...s.friends, { id: uid(), name, level: 1, rankId: 'E' as const, streak: 0, xp: 0, auraColor: '#ff7a18' }],
  }));
}

function removeFriend(id: string) {
  setState((s) => ({ ...s, friends: s.friends.filter((f) => f.id !== id) }));
}

function sendMotivation(_id: string) {
  playSound('task');
}

function setNote(date: string, text: string) {
  setState((s) => ({ ...s, notes: { ...s.notes, [date]: text } }));
}

function resetAll() {
  globalState = createDefaultState();
  notify();
  scheduleAutoSave();
}

function purchaseItem(itemId: string, category: string, price: number): boolean {
  let success = false;
  setState((s) => {
    const marketItem = getMarketItem(itemId, category as MarketCategory);
    if (!marketItem || price !== marketItem.price) return s;
    if (s.xp < marketItem.xpRequired || s.coins < marketItem.price) return s;
    const typeMap: Record<MarketCategory, InventoryItem['type']> = {
      weapons: 'weapon', auras: 'aura', titles: 'title',
      shields: 'shield', frames: 'frame', backgrounds: 'background',
    };
    const type = typeMap[marketItem.category];
    if (s.inventory.some((i) => i.id === itemId && i.type === type)) return s;
    success = true;
    playSound('reward');
    return {
      ...s,
      coins: s.coins - marketItem.price,
      inventory: [...s.inventory, { id: itemId, type, obtainedAt: Date.now(), favorite: false }],
    };
  });
  return success;
}

function completeStoryMission(missionId: string, reward: { xp: number; coins: number }) {
  setState((s) => {
    if (s.storyCompletedMissions[missionId]) return s;
    const mission = ALL_CHAPTERS.flatMap((chapter) => chapter.missions).find((m) => m.id === missionId);
    const boss = mission ? undefined : ALL_CHAPTERS.map((chapter) => chapter.boss).find((b) => `boss_${b.id}` === missionId);
    if (!mission && !boss) return s;
    const expectedXp = mission?.xpReward ?? boss?.xpReward ?? 0;
    const expectedCoins = mission?.coinReward ?? boss?.coinReward ?? 0;
    if (reward.xp !== expectedXp || reward.coins !== expectedCoins) return s;
    let next = addPoints(s, expectedXp, 0);
    next = { ...next, coins: next.coins + expectedCoins, storyCompletedMissions: { ...next.storyCompletedMissions, [missionId]: true } };
    return next;
  });
  playSound('reward');
}

function setStoryChoice(chapterId: string, choiceId: string) {
  setState((s) => ({
    ...s,
    storyChoices: { ...s.storyChoices, [chapterId]: choiceId },
  }));
}

function defeatStoryBoss(bossId: string) {
  setState((s) => {
    if (s.storyBossDefeated[bossId]) return s;
    return { ...s, storyBossDefeated: { ...s.storyBossDefeated, [bossId]: true } };
  });
  playSound('rankup');
}

function advanceStoryChapter() {
  setState((s) => {
    const maxCompletedIndex = ALL_STORY_CHAPTER_COUNT;
    if (s.storyChapter >= maxCompletedIndex) return s;
    return {
      ...s,
      storyChapter: Math.min(s.storyChapter + 1, maxCompletedIndex),
      storyMission: 0,
    };
  });
  playSound('rankup');
}

function setStoryMission(missionIndex: number) {
  setState((s) => ({ ...s, storyMission: missionIndex }));
}

function interactNPC(npcId: string, repChange: number) {
  setState((s) => ({
    ...s,
    storyNpcReputation: { ...s.storyNpcReputation, [npcId]: (s.storyNpcReputation[npcId] ?? 0) + repChange },
  }));
}

function unlockLore(loreId: string) {
  setState((s) => {
    if (s.storyLoreUnlocked.includes(loreId)) return s;
    return { ...s, storyLoreUnlocked: [...s.storyLoreUnlocked, loreId] };
  });
}

function unlockStoryAchievement(achievementId: string) {
  setState((s) => {
    if (s.storyAchievements.includes(achievementId)) return s;
    return { ...s, storyAchievements: [...s.storyAchievements, achievementId] };
  });
  playSound('rankup');
}

function unlockAchievements(ids: string[]) {
  if (ids.length === 0) return;
  setState((s) => {
    const existing = new Set(s.achievements.map((a) => a.id));
    const toAdd = ids.filter((id) => !existing.has(id));
    if (toAdd.length === 0) return s;
    return {
      ...s,
      achievements: [
        ...s.achievements,
        ...toAdd.map((id) => ({ id, unlockedAt: Date.now() })),
      ],
    };
  });
}

function removeAchievements(ids: string[]) {
  if (ids.length === 0) return;
  setState((s) => {
    const toRemove = new Set(ids);
    const filtered = s.achievements.filter((a) => !toRemove.has(a.id));
    if (filtered.length === s.achievements.length) return s;
    return { ...s, achievements: filtered };
  });
}

function clearChat() {
  setState((s) => ({ ...s, chat: [] }));
}

function foundEasterEgg(id: string) {
  setState((s) => {
    if (s.easterEggsFound.includes(id)) return s;
    return { ...s, easterEggsFound: [...s.easterEggsFound, id] };
  });
}

function engageBoss(bossId: string) {
  setState((s) => ({ ...s, activeBossId: bossId }));
  playSound('whoosh');
}

function attackBoss(bossId: string, damage: number): DropResult[] {
  let drops: DropResult[] = [];
  setState((s) => {
    if (s.bossDefeated[bossId]) return s;
    const currentHp = s.bossHpRemaining[bossId] ?? 0;
    const safeDamage = Math.max(0, Math.min(100, Math.floor(Number.isFinite(damage) ? damage : 0)));
    if (safeDamage <= 0 || currentHp <= 0) return s;
    const actualDamage = Math.min(safeDamage, currentHp);
    const newHp = Math.max(0, currentHp - actualDamage);
    let next = addPoints(s, actualDamage, actualDamage);
    next = { ...next, bossHpRemaining: { ...next.bossHpRemaining, [bossId]: newHp } };
    if (newHp === 0) {
      next = { ...next, bossDefeated: { ...next.bossDefeated, [bossId]: true }, activeBossId: null, coins: next.coins + 500 };
      drops = [{ type: 'coins', amount: 500, label: '500 Coins' }];
      playSound('rankup');
    } else playSound('task');
    return next;
  });
  return drops;
}

function openChest(chestId: string): DropResult | null {
  let result: DropResult | null = null;
  setState((s) => {
    const count = s.chestInventory[chestId] ?? 0;
    const chest = getChestById(chestId);
    if (count <= 0 || !chest) return s;
    const dropType = ['coins', 'xp', 'weapon', 'aura', 'title'] as const;
    const pick = dropType[Math.floor(Math.random() * dropType.length)];
    if (pick === 'coins') {
      const amt = 50 + Math.floor(Math.random() * 200);
      result = { type: 'coins', amount: amt, label: `${amt} Coins` };
      return { ...s, chestInventory: { ...s.chestInventory, [chestId]: count - 1 }, coins: s.coins + amt };
    }
    if (pick === 'xp') {
      const amt = 50 + Math.floor(Math.random() * 150);
      result = { type: 'xp', amount: amt, label: `${amt} XP` };
      const next = addPoints(s, amt, 0);
      return { ...next, chestInventory: { ...next.chestInventory, [chestId]: count - 1 } };
    }
    const rarity = rollRarity();
    const pool = pick === 'weapon' ? WEAPONS : pick === 'aura' ? AURAS : TITLES;
    const item = pickFromRarity(pool, rarity);
    if (!item) {
      result = { type: 'coins', amount: 100, label: '100 Coins' };
      return { ...s, chestInventory: { ...s.chestInventory, [chestId]: count - 1 }, coins: s.coins + 100 };
    }
    const itemType = pick as InventoryItem['type'];
    if (s.inventory.some((i) => i.id === item.id && i.type === itemType)) {
      const duplicateValue = Math.max(25, Math.floor(chest.price * 0.5));
      result = { type: 'coins', amount: duplicateValue, label: `${duplicateValue} Coins (duplicate conversion)` };
      return { ...s, chestInventory: { ...s.chestInventory, [chestId]: count - 1 }, coins: s.coins + duplicateValue };
    }
    result = { type: itemType as DropResult['type'], itemId: item.id, rarity, label: item.name };
    return { ...s, chestInventory: { ...s.chestInventory, [chestId]: count - 1 }, inventory: [...s.inventory, { id: item.id, type: itemType, obtainedAt: Date.now(), favorite: false }] };
  });
  if (result) playSound('reward');
  return result;
}

function buyChest(chestId: string, price: number): boolean {
  let success = false;
  setState((s) => {
    const chest = getChestById(chestId);
    if (!chest || price !== chest.price || s.coins < chest.price) return s;
    success = true;
    playSound('click');
    return { ...s, coins: s.coins - chest.price, chestInventory: { ...s.chestInventory, [chestId]: (s.chestInventory[chestId] ?? 0) + 1 } };
  });
  return success;
}

function equipPet(petId: string) {
  setState((s) => ({ ...s, petId }));
  playSound('click');
}

function unequipPet() {
  setState((s) => ({ ...s, petId: null }));
  playSound('click');
}

function claimBattlePassReward(tier: number, premium: boolean) {
  setState((s) => {
    const rewardTier = getBattlePassReward(tier);
    if (!rewardTier || tier > s.battlePassTier) return s;
    if (premium && !s.battlePassPremium) return s;
    const claimed = premium ? s.battlePassClaimedPremium : s.battlePassClaimedFree;
    if (claimed.includes(tier)) return s;
    const reward = premium ? rewardTier.premiumReward : rewardTier.freeReward;
    let next = { ...s };
    if (reward.type === 'coins') next = { ...next, coins: next.coins + (reward.amount ?? 0) };
    else if (reward.type === 'xp') next = addPoints(next, reward.amount ?? 0, 0);
    else if (reward.type === 'item' && reward.itemId) {
      const itemType: InventoryItem['type'] = reward.itemId.includes('aura') ? 'aura' : reward.itemId.includes('weapon') ? 'weapon' : 'title';
      if (!next.inventory.some((i) => i.id === reward.itemId && i.type === itemType)) next = { ...next, inventory: [...next.inventory, { id: reward.itemId, type: itemType, obtainedAt: Date.now(), favorite: false }] };
    }
    playSound('reward');
    return premium ? { ...next, battlePassClaimedPremium: [...next.battlePassClaimedPremium, tier] } : { ...next, battlePassClaimedFree: [...next.battlePassClaimedFree, tier] };
  });
}

function claimDailyFortune() {
  setState((s) => {
    const today = todayStr();
    if (s.lastFortuneDate === today) return s;
    const luck = 1 + Math.floor(Math.abs(hashString(today)) % 5);
    const quotes = [
      'The System has chosen you. Rise, Hunter.',
      'Shadows gather strength from discipline.',
      'Every gate you clear makes you stronger.',
      'The Monarch within awakens through effort.',
      'Your discipline shapes your destiny.',
    ];
    const quote = quotes[Math.abs(hashString(today + 'q')) % quotes.length];
    const bonusCoins = luck * 20;
    playSound('reward');
    return { ...s, lastFortuneDate: today, lastFortuneLuck: luck, lastFortuneQuote: quote, coins: s.coins + bonusCoins };
  });
}

function claimMilestone(milestoneId: string) {
  setState((s) => {
    if (s.milestoneClaimed.includes(milestoneId)) return s;
    const milestone = getMilestoneById(milestoneId);
    if (!milestone) return s;
    let next = addPoints(s, milestone.reward.xp, 0);
    next = { ...next, coins: next.coins + milestone.reward.coins };
    const existing = new Set(next.inventory.map((i) => `${i.type}:${i.id}`));
    const rewardItems: InventoryItem[] = [];
    if (milestone.reward.badgeId && !existing.has(`badge:${milestone.reward.badgeId}`)) rewardItems.push({ id: milestone.reward.badgeId, type: 'badge', obtainedAt: Date.now(), favorite: false });
    if (milestone.reward.auraId && !existing.has(`aura:${milestone.reward.auraId}`)) rewardItems.push({ id: milestone.reward.auraId, type: 'aura', obtainedAt: Date.now(), favorite: false });
    playSound('rankup');
    return { ...next, inventory: [...next.inventory, ...rewardItems], milestoneClaimed: [...next.milestoneClaimed, milestoneId] };
  });
}

function prestige() {
  setState((s) => {
    if (s.xp < 12000000) return s;
    playSound('rankup');
    return {
      ...s,
      xp: 0,
      level: 1,
      prestigeLevel: s.prestigeLevel + 1,
      prestigeMultiplier: s.prestigeMultiplier + 0.5,
      coins: s.coins + 100000,
    };
  });
}

function refreshDailyShop() {
  setState((s) => {
    const today = todayStr();
    if (s.dailyShopDate === today && s.dailyShopSeed) return s;
    return { ...s, dailyShopDate: today, dailyShopSeed: crypto.randomUUID() };
  });
}

async function syncLeaderboard() {
  await syncLeaderboardInternal(globalState);
}

function saveWorkoutSession(type: WorkoutSessionRecord['type'], durationSeconds: number) {
  const session: WorkoutSessionRecord = {
    id: uid(),
    type,
    durationSeconds,
    completedAt: Date.now(),
  };
  setState((s) => ({
    ...s,
    workoutSessions: [...s.workoutSessions, session],
    totalWorkoutSeconds: s.totalWorkoutSeconds + durationSeconds,
    lastWorkoutDate: todayStr(),
  }));
  if (isSupabaseConfigured() && globalUserId) {
    void supabase.from('workout_sessions').insert({
      user_id: globalUserId,
      workout_type: type,
      duration_seconds: durationSeconds,
    }).then(({ error }) => {
      if (error) console.error('[saveWorkoutSession] insert error:', error);
    });
  }
  playSound('reward');
}

function claimRankReward(rankId: string) {
  setState((s) => {
    if (s.rankRewardsClaimed.includes(rankId)) return s;
    const rank = RANKS.find((r) => r.id === rankId);
    if (!rank) return s;
    if (s.xp < rank.xpRequired) return s;
    playSound('rankup');
    const newItems: InventoryItem[] = rank.rewards
      .map((r) => ({ id: r.itemId, type: r.type as InventoryItem['type'], obtainedAt: Date.now(), favorite: false }));
    const existing = new Set(s.inventory.map((i) => `${i.type}:${i.id}`));
    const toAdd = newItems.filter((i) => !existing.has(`${i.type}:${i.id}`));
    return {
      ...s,
      inventory: [...s.inventory, ...toAdd],
      rankRewardsClaimed: [...s.rankRewardsClaimed, rankId],
    };
  });
}

async function loadFromCloud(userId: string) {
  globalUserId = userId;
  dailyResetDone = false;
  if (!isSupabaseConfigured()) {
    globalCloudLoaded = true;
    notify();
    return;
  }
  try {
    const { data } = await supabase.from('user_state').select('state').eq('user_id', userId).maybeSingle();
    if (data?.state) {
      const cloudState = data.state as AppState;
      const def = createDefaultState();
      globalState = normalizeLoadedState(cloudState, def);
      notify();
    } else {
      // New user — seed initial state to cloud
      void saveToCloudInternal(globalState);
    }
    // Load workout sessions from cloud
    const { data: sessions } = await supabase
      .from('workout_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })
      .limit(500);
    if (sessions && sessions.length > 0) {
      globalState = {
        ...globalState,
        workoutSessions: sessions.map((sess: any) => ({
          id: sess.id,
          type: sess.workout_type,
          durationSeconds: sess.duration_seconds,
          completedAt: new Date(sess.completed_at).getTime(),
        })),
        totalWorkoutSeconds: sessions.reduce((acc: number, sess: any) => acc + sess.duration_seconds, 0),
      };
      notify();
    }
  } catch (err) {
    console.error('[loadFromCloud] error:', err);
  } finally {
    globalCloudLoaded = true;
    notify();
  }
}

async function saveToCloud(_userId: string) {
  await saveToCloudInternal(globalState);
}

function setUserId(userId: string | null) {
  if (userId) {
    globalUserId = userId;
  } else {
    // Logout: flush current state to cloud, then reset
    flushSave();
    globalUserId = null;
    globalCloudLoaded = false;
    dailyResetDone = false;
    globalState = createDefaultState();
    notify();
  }
}

// ---------------------------------------------------------------------------
// Store interface & hook
// ---------------------------------------------------------------------------

export interface StoreActions {
  state: AppState;
  cloudLoaded: boolean;
  // Profile
  updateProfile: (patch: Partial<Pick<AppState, 'username' | 'avatar' | 'avatarColor' | 'bannerColor' | 'nameColor' | 'theme'>>) => void;
  // Tasks
  toggleCoreTask: (id: string) => void;
  toggleCustomTask: (id: string) => void;
  addCustomTask: (label: string, emoji: string, points: number) => void;
  updateCustomTask: (id: string, patch: { label?: string; emoji?: string; points?: number }) => void;
  deleteCustomTask: (id: string) => void;
  // Main tasks (editable core tasks)
  addMainTask: (data: { label: string; emoji: string; points: number; description?: string; category?: 'body' | 'mind' | 'spirit' | 'work' }) => void;
  updateMainTask: (id: string, patch: { label?: string; emoji?: string; points?: number; description?: string; category?: 'body' | 'mind' | 'spirit' | 'work'; enabled?: boolean }) => void;
  deleteMainTask: (id: string) => void;
  reorderMainTask: (id: string, direction: 'up' | 'down') => void;
  // Workout
  toggleExercise: (dayId: 'push' | 'pull' | 'leg', exerciseId: string) => void;
  addExercise: (dayId: 'push' | 'pull' | 'leg', name: string, sets: number, reps: string, section: 'stretching' | 'main' | 'plyometric') => void;
  updateExercise: (dayId: 'push' | 'pull' | 'leg', exerciseId: string, patch: { name?: string; sets?: number; reps?: string }) => void;
  deleteExercise: (dayId: 'push' | 'pull' | 'leg', exerciseId: string) => void;
  // Schedule
  addScheduleSlot: (slot: { start: string; end: string; label: string; color: string }) => void;
  updateScheduleSlot: (id: string, patch: { start?: string; end?: string; label?: string; color?: string }) => void;
  toggleScheduleSlot: (id: string) => void;
  deleteScheduleSlot: (id: string) => void;
  // Dungeons
  clearDungeon: (dungeonId: string) => DropResult[];
  damageBoss: (amount: number) => DropResult[];
  clearSecretDungeon: (dungeonId: string) => DropResult[];
  // Rewards
  claimLoginReward: () => { reward: any; newIndex: number } | null;
  spinWheel: () => DropResult | null;
  claimChallenge: (challengeId: string) => void;
  // Inventory
  equipItem: (type: 'aura' | 'weapon' | 'title' | 'shield' | 'frame' | 'background', itemId: string) => void;
  unequipItem: (type: 'aura' | 'weapon' | 'title' | 'shield' | 'frame' | 'background') => void;
  toggleFavorite: (itemId: string) => void;
  addItem: (item: { id: string; type: InventoryItem['type'] }) => void;
  // Background
  setCustomBackground: (dataUrl: string | null) => void;
  setBackgroundVideo: (dataUrl: string | null) => void;
  setBackgroundType: (type: 'default' | 'image' | 'video' | 'animated') => void;
  setBackgroundBlur: (n: number) => void;
  setBackgroundDarken: (n: number) => void;
  setBackgroundBrightness: (n: number) => void;
  setSelectedBackground: (id: string | null) => void;
  // Settings
  toggleSound: () => void;
  updateNotifications: (patch: Partial<AppState['notifications']>) => void;
  // AI
  sendChat: (text: string) => void;
  addAIMessage: (text: string) => void;
  clearChat: () => void;
  // Friends
  addFriend: (name: string) => void;
  removeFriend: (id: string) => void;
  sendMotivation: (id: string) => void;
  // Notes
  setNote: (date: string, text: string) => void;
  // Reset
  resetAll: () => void;
  // Marketplace
  purchaseItem: (itemId: string, category: string, price: number) => boolean;
  completeStoryMission: (missionId: string, reward: { xp: number; coins: number }) => void;
  setStoryChoice: (chapterId: string, choiceId: string) => void;
  defeatStoryBoss: (bossId: string) => void;
  advanceStoryChapter: () => void;
  setStoryMission: (missionIndex: number) => void;
  interactNPC: (npcId: string, repChange: number) => void;
  unlockLore: (loreId: string) => void;
  unlockStoryAchievement: (achievementId: string) => void;
  // Achievements (scoped — no raw setState)
  unlockAchievements: (ids: string[]) => void;
  removeAchievements: (ids: string[]) => void;
  foundEasterEgg: (id: string) => void;
  // Boss Battles
  engageBoss: (bossId: string) => void;
  attackBoss: (bossId: string, damage: number) => DropResult[];
  // Chests
  openChest: (chestId: string) => DropResult | null;
  buyChest: (chestId: string, price: number) => boolean;
  // Pets
  equipPet: (petId: string) => void;
  unequipPet: () => void;
  // Battle Pass
  claimBattlePassReward: (tier: number, premium: boolean) => void;
  // Fortune
  claimDailyFortune: () => void;
  // Milestones
  claimMilestone: (milestoneId: string) => void;
  // Prestige
  prestige: () => void;
  // Daily Shop
  refreshDailyShop: () => void;
  // Sync leaderboard
  syncLeaderboard: () => Promise<void>;
  // Workout sessions
  saveWorkoutSession: (type: WorkoutSessionRecord['type'], durationSeconds: number) => void;
  // Rank rewards
  claimRankReward: (rankId: string) => void;
  // Cloud persistence
  loadFromCloud: (userId: string) => Promise<void>;
  saveToCloud: (userId: string) => Promise<void>;
  setUserId: (userId: string | null) => void;
}

export function useStore(): StoreActions {
  const [, forceRender] = useReducer((x: number) => x + 1, 0);

  useEffect(() => {
    listeners.add(forceRender);
    return () => { listeners.delete(forceRender); };
  }, [forceRender]);

  const cloudLoaded = globalCloudLoaded;

  // Daily reset — runs once after cloud state is loaded
  useEffect(() => {
    if (dailyResetDone || !globalCloudLoaded) return;
    dailyResetDone = true;
    doDailyReset();
  }, [cloudLoaded]);

  // Midnight auto-reset timer — triggers daily reset without page refresh
  useEffect(() => {
    if (!globalCloudLoaded) return;
    const checkAndReset = () => {
      const today = todayStr();
      if (globalState.lastDailyResetDate !== today) {
        dailyResetDone = true;
        doDailyReset();
      }
    };
    // Check every 30 seconds if date has changed
    const interval = window.setInterval(checkAndReset, 30000);
    // Also check on window focus (user returning to tab)
    const onFocus = () => checkAndReset();
    window.addEventListener('focus', onFocus);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [cloudLoaded]);

  // Auto-sync leaderboard (throttled, only after cloud loaded)
  useEffect(() => {
    if (!isSupabaseConfigured() || !cloudLoaded) return;
    if (leaderboardSyncTimer) window.clearTimeout(leaderboardSyncTimer);
    leaderboardSyncTimer = window.setTimeout(() => {
      void syncLeaderboardInternal(globalState);
    }, 4000);
    return () => {
      if (leaderboardSyncTimer) window.clearTimeout(leaderboardSyncTimer);
    };
  }, [globalState.xp, globalState.totalPoints, globalState.streak, globalState.username, globalState.equipped.aura, cloudLoaded]);

  // Flush pending saves when the page is hidden or unloaded
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') flushSave();
    };
    window.addEventListener('beforeunload', flushSave);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('beforeunload', flushSave);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  return {
    state: globalState,
    cloudLoaded,
    updateProfile,
    toggleCoreTask,
    toggleCustomTask,
    addCustomTask,
    updateCustomTask,
    deleteCustomTask,
    addMainTask,
    updateMainTask,
    deleteMainTask,
    reorderMainTask,
    toggleExercise,
    addExercise,
    updateExercise,
    deleteExercise,
    addScheduleSlot,
    updateScheduleSlot,
    toggleScheduleSlot,
    deleteScheduleSlot,
    clearDungeon,
    damageBoss,
    clearSecretDungeon,
    claimLoginReward,
    spinWheel,
    claimChallenge,
    equipItem,
    unequipItem,
    toggleFavorite,
    addItem,
    setCustomBackground,
    setBackgroundVideo,
    setBackgroundType,
    setBackgroundBlur,
    setBackgroundDarken,
    setBackgroundBrightness,
    setSelectedBackground,
    toggleSound,
    updateNotifications,
    sendChat,
    addAIMessage,
    clearChat,
    addFriend,
    removeFriend,
    sendMotivation,
    setNote,
    resetAll,
    purchaseItem,
    completeStoryMission,
    setStoryChoice,
    defeatStoryBoss,
    advanceStoryChapter,
    setStoryMission,
    interactNPC,
    unlockLore,
    unlockStoryAchievement,
    unlockAchievements,
    removeAchievements,
    foundEasterEgg,
    engageBoss,
    attackBoss,
    openChest,
    buyChest,
    equipPet,
    unequipPet,
    claimBattlePassReward,
    claimDailyFortune,
    claimMilestone,
    prestige,
    refreshDailyShop,
    syncLeaderboard,
    saveWorkoutSession,
    claimRankReward,
    loadFromCloud,
    saveToCloud,
    setUserId,
  };
}

export { RARITY_META };
