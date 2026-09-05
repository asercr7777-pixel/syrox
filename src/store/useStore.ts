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
import { getMarketItem, type MarketCategory } from '../data/marketplace';
import { getChestById } from '../data/chests';
import { getBattlePassReward } from '../data/battlepass';
import { getMilestoneById } from '../data/milestones';

const ALL_STORY_CHAPTER_COUNT = getTotalChapters();
const VALID_STORY_MISSION_IDS = new Set(ALL_CHAPTERS.flatMap((chapter) => chapter.missions.map((mission) => mission.id)));
const VALID_STORY_BOSS_IDS = new Set(ALL_CHAPTERS.map((chapter) => chapter.boss.id));
const VALID_STORY_LORE_IDS = new Set(ALL_CHAPTERS.flatMap((chapter) => chapter.boss.rewardLore ? [chapter.boss.rewardLore] : []));
const DAILY_XP_CAP = 1000;

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
    dailyCap: DAILY_XP_CAP,
    dailyXp: Math.max(0, Math.min(Number.isFinite(cloudState.dailyXp) ? cloudState.dailyXp : 0, DAILY_XP_CAP)),
    dailyPoints: Math.max(0, Number.isFinite(cloudState.dailyPoints) ? cloudState.dailyPoints : def.dailyPoints),
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
        if (newStreakShield > 0) newStreakShield -= 1;
        else newStreak = 0;
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
    return {
      ...s,
      coreCompleted: Object.fromEntries(s.mainTasks.filter(t => t.enabled).map((t) => [t.id, false])),
      customCompleted: {},
      dailyXp: 0,
      dailyPoints: 0,
      dailyCap: DAILY_XP_CAP,
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
  if (leveledUp) setTimeout(() => playSound('levelup'), 50);
  const oldRank = getRankByXp(s.xp);
  const newRank = getRankByXp(xp);
  if (newRank.id !== oldRank.id && getRankIndex(newRank.id) > getRankIndex(oldRank.id)) setTimeout(() => playSound('rankup'), 150);
  return { ...s, xp, level, coins };
}

function addPoints(s: AppState, xp: number, points: number): AppState {
  const dailyRemaining = DAILY_XP_CAP - s.dailyXp;
  const cappedXp = Math.max(0, Math.min(xp, dailyRemaining));
  if (cappedXp <= 0) return s;
  let next = addXp(s, cappedXp);
  next = { ...next, totalPoints: next.totalPoints + points, dailyXp: next.dailyXp + cappedXp, dailyPoints: next.dailyPoints + points };
  const today = todayStr();
  const enabledMain = next.mainTasks.filter((t) => t.enabled);
  const allMain = enabledMain.every((t) => next.coreCompleted[t.id]);
  const disciplineScore = calculateDisciplineScore(next);
  const existing = next.history.find((h) => h.date === today);
  const dayRecord = { date: today, coreCompleted: next.coreCompleted, customCompleted: next.customCompleted, xpGained: next.dailyXp, pointsGained: next.dailyPoints, workoutCompleted: next.workoutsCompletedToday > 0, dungeonCleared: next.dungeonClearedToday, allMainDone: allMain, disciplineScore };
  next = existing ? { ...next, history: next.history.map((h) => (h.date === today ? dayRecord : h)) } : { ...next, history: [...next.history, dayRecord] };
  return next;
}

function rollRarity(bonusLegendary = 0): Rarity {
  const r = Math.random() * 100;
  let acc = 0;
  const tiers: { rarity: Rarity; weight: number }[] = [
    { rarity: 'common', weight: 50 }, { rarity: 'rare', weight: 30 }, { rarity: 'epic', weight: 15 }, { rarity: 'legendary', weight: 4.5 + bonusLegendary }, { rarity: 'mythic', weight: 0.4 }, { rarity: 'secret', weight: 0.1 },
  ];
  for (const t of tiers) { acc += t.weight; if (r < acc) return t.rarity; }
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
  if (Math.random() < 0.15) { const rarity = rollRarity(); const w = pickFromRarity(WEAPONS, rarity); if (w) drops.push({ type: 'weapon', itemId: w.id, rarity, label: w.name }); }
  if (Math.random() < 0.1) { const rarity = rollRarity(); const t = pickFromRarity(TITLES, rarity); if (t) drops.push({ type: 'title', itemId: t.id, rarity, label: t.name }); }
  return drops;
}

function hashString(str: string): number { let hash = 0; for (let i = 0; i < str.length; i++) { hash = ((hash << 5) - hash) + str.charCodeAt(i); hash |= 0; } return hash; }

function calculateDisciplineScore(state: AppState): number {
  const enabledMain = state.mainTasks.filter((t) => t.enabled);
  const mainDone = enabledMain.filter((t) => Boolean(state.coreCompleted[t.id])).length;
  const extraDone = state.customTasks.filter((t) => Boolean(state.customCompleted[t.id])).length;
  const totalPossible = enabledMain.length + state.customTasks.length;
  if (totalPossible <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round(((mainDone + extraDone) / totalPossible) * 100)));
}

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
    if (Object.keys(profilePatch).length > 0) void supabase.from('profiles').upsert({ id: globalUserId, ...profilePatch }).then(({ error }) => { if (error) console.error('[updateProfile] sync error:', error); });
  }
}

function toggleCoreTask(id: string) {
  setState((s) => {
    const task = s.mainTasks.find((t) => t.id === id);
    if (!task) return s;
    const wasCompleted = s.coreCompleted[id];
    const next = { ...s, coreCompleted: { ...s.coreCompleted, [id]: !wasCompleted } };
    if (!wasCompleted) {
      const withPoints = addPoints(next, task.points, task.points);
      playSound('task');
      const allDone = s.mainTasks.filter((t) => t.enabled).every((t) => withPoints.coreCompleted[t.id]);
      if (allDone) {
        const today = todayStr();
        if (s.lastActiveDate !== today) {
          const newStreak = s.streak + 1;
          return { ...withPoints, streak: newStreak, bestStreak: Math.max(s.bestStreak, newStreak), lastActiveDate: today };
        }
      }
      return withPoints;
    }
    const xp = Math.max(0, s.xp - task.points);
    return { ...next, xp, level: levelFromXp(xp), totalPoints: Math.max(0, s.totalPoints - task.points), dailyXp: Math.max(0, s.dailyXp - task.points), dailyPoints: Math.max(0, s.dailyPoints - task.points) };
  });
}

function toggleCustomTask(id: string) {
  setState((s) => {
    const task = s.customTasks.find((t) => t.id === id);
    if (!task) return s;
    const wasCompleted = s.customCompleted[id];
    const next = { ...s, customCompleted: { ...s.customCompleted, [id]: !wasCompleted } };
    if (!wasCompleted) {
      playSound('task');
      return addPoints(next, task.points, task.points);
    }
    const xp = Math.max(0, s.xp - task.points);
    return { ...next, xp, level: levelFromXp(xp), totalPoints: Math.max(0, s.totalPoints - task.points), dailyXp: Math.max(0, s.dailyXp - task.points), dailyPoints: Math.max(0, s.dailyPoints - task.points) };
  });
}

function addCustomTask(label: string, emoji: string, points: number) { setState((s) => ({ ...s, customTasks: [...s.customTasks, { id: uid(), label, emoji, points, createdAt: Date.now() }] })); }
function updateCustomTask(id: string, patch: { label?: string; emoji?: string; points?: number }) { setState((s) => ({ ...s, customTasks: s.customTasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) })); }
function deleteCustomTask(id: string) { setState((s) => ({ ...s, customTasks: s.customTasks.filter((t) => t.id !== id), customCompleted: Object.fromEntries(Object.entries(s.customCompleted).filter(([k]) => k !== id)) })); }
function addMainTask(data: { label: string; emoji: string; points: number; description?: string; category?: 'body' | 'mind' | 'spirit' | 'work' }) { setState((s) => { const newTask: MainTask = { id: uid(), label: data.label, emoji: data.emoji, points: data.points, description: data.description ?? '', category: data.category ?? 'body', enabled: true, order: s.mainTasks.length }; return { ...s, mainTasks: [...s.mainTasks, newTask], coreCompleted: { ...s.coreCompleted, [newTask.id]: false } }; }); }
function updateMainTask(id: string, patch: { label?: string; emoji?: string; points?: number; description?: string; category?: 'body' | 'mind' | 'spirit' | 'work'; enabled?: boolean }) { setState((s) => ({ ...s, mainTasks: s.mainTasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) })); }
function deleteMainTask(id: string) { setState((s) => { const remaining = s.mainTasks.filter((t) => t.id !== id).map((t, i) => ({ ...t, order: i })); const newCoreCompleted = { ...s.coreCompleted }; delete newCoreCompleted[id]; return { ...s, mainTasks: remaining, coreCompleted: newCoreCompleted }; }); }
function reorderMainTask(id: string, direction: 'up' | 'down') { setState((s) => { const tasks = [...s.mainTasks].sort((a, b) => a.order - b.order); const idx = tasks.findIndex((t) => t.id === id); const target = direction === 'up' ? idx - 1 : idx + 1; if (idx < 0 || target < 0 || target >= tasks.length) return s; [tasks[idx].order, tasks[target].order] = [tasks[target].order, tasks[idx].order]; return { ...s, mainTasks: tasks }; }); }

