import type { AppState } from '../store/types';

export const DAILY_XP_CAP_DEFAULT = 10000;

export function cleanSupabaseUrl(url?: string): string {
  if (!url) return '';
  let cleaned = url.trim();
  cleaned = cleaned.replace(/\/+$/, '');
  cleaned = cleaned.replace(/\/rest\/v1\/?$/i, '');
  return cleaned;
}

export function capTaskXp(value: number): number {
  return Math.min(200, Math.max(0, Math.floor(Number.isFinite(value) ? value : 0)));
}

export function calculateDailyXpAward(
  currentDailyXp: number,
  requestedXp: number,
  doubleXpActive: boolean,
  dailyCap = DAILY_XP_CAP_DEFAULT,
): { awardedXp: number; newDailyXp: number; capped: boolean } {
  const safeDaily = Math.max(0, Math.min(dailyCap, Math.floor(Number.isFinite(currentDailyXp) ? currentDailyXp : 0)));
  const safeRequested = Math.max(0, Math.floor(Number.isFinite(requestedXp) ? requestedXp : 0));
  const multiplier = doubleXpActive ? 2 : 1;
  const remaining = Math.max(0, dailyCap - safeDaily);
  const effectiveRequest = Math.floor(safeRequested * multiplier);
  const awardedXp = Math.min(effectiveRequest, remaining);
  const newDailyXp = Math.min(dailyCap, safeDaily + awardedXp);
  return {
    awardedXp,
    newDailyXp,
    capped: effectiveRequest > remaining || newDailyXp >= dailyCap,
  };
}

export function calculateDisciplineScoreFromTasks(
  coreTasks: ReadonlyArray<{ id: string; enabled: boolean }>,
  coreCompleted: Readonly<Record<string, boolean>>,
  customTasks: ReadonlyArray<{ id: string }>,
  customCompleted: Readonly<Record<string, boolean>>,
): number {
  const enabledMain = coreTasks.filter((t) => t.enabled);
  const mainDone = enabledMain.filter((t) => Boolean(coreCompleted[t.id])).length;
  const extraDone = customTasks.filter((t) => Boolean(customCompleted[t.id])).length;
  const totalPossible = enabledMain.length + customTasks.length;
  if (totalPossible <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round(((mainDone + extraDone) / totalPossible) * 100)));
}

export function sanitizeDayIndex(active: unknown, totalDays = 6): number {
  if (typeof active !== 'number' || !Number.isInteger(active)) return 0;
  if (active < 0 || active >= totalDays) return 0;
  return active;
}

export function formatTimerClock(seconds: number): string {
  const safe = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
  const hrs = Math.floor(safe / 3600);
  const mins = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function countTodayCompletedQuests(
  coreCompleted: Readonly<Record<string, boolean>>,
  customCompleted: Readonly<Record<string, boolean>>,
): number {
  return (
    Object.values(coreCompleted ?? {}).filter(Boolean).length +
    Object.values(customCompleted ?? {}).filter(Boolean).length
  );
}

export function countTotalCompletedQuests(state: Pick<AppState, 'history' | 'coreCompleted' | 'customCompleted' | 'lastDailyResetDate'>): number {
  const historyTotal = (state.history ?? []).reduce(
    (sum, day) =>
      sum +
      Object.values(day.coreCompleted ?? {}).filter(Boolean).length +
      Object.values(day.customCompleted ?? {}).filter(Boolean).length,
    0,
  );
  if (historyTotal > 0) return historyTotal;
  return countTodayCompletedQuests(state.coreCompleted, state.customCompleted);
}

export function countFullClearDays(state: Pick<AppState, 'history'>): number {
  return (state.history ?? []).filter((day) => Boolean(day.allMainDone)).length;
}

export function calculateAverageDiscipline(state: Pick<AppState, 'history'>): number | null {
  const list = state.history ?? [];
  if (!list.length) return null;
  return Math.round(list.reduce((sum, day) => sum + Math.max(0, day.disciplineScore ?? 0), 0) / list.length);
}

export interface RequirementSpec {
  minXp?: number;
  minStreak?: number;
  minBestStreak?: number;
  minWorkouts?: number;
  minTrainingMinutes?: number;
  minQuestsCompleted?: number;
  minFullClearDays?: number;
}

export interface ProgressionSnapshot {
  xp: number;
  streak: number;
  bestStreak: number;
  workouts: number;
  trainingMinutes: number;
  questsCompleted: number;
  fullClearDays: number;
}

export function snapshotFromState(state: AppState): ProgressionSnapshot {
  return {
    xp: Math.max(0, state.xp ?? 0),
    streak: Math.max(0, state.streak ?? 0),
    bestStreak: Math.max(0, state.bestStreak ?? 0),
    workouts: (state.workoutSessions ?? []).length,
    trainingMinutes: Math.floor((state.totalWorkoutSeconds ?? 0) / 60),
    questsCompleted: countTotalCompletedQuests(state),
    fullClearDays: countFullClearDays(state),
  };
}

export interface RequirementEvaluation {
  unlocked: boolean;
  pct: number;
  checks: { label: string; current: number; target: number; met: boolean }[];
}

export function evaluateRequirement(req: RequirementSpec, snap: ProgressionSnapshot): RequirementEvaluation {
  const checks: { label: string; current: number; target: number; met: boolean }[] = [];

  if (req.minXp !== undefined) {
    checks.push({ label: 'Total XP', current: snap.xp, target: req.minXp, met: snap.xp >= req.minXp });
  }
  if (req.minWorkouts !== undefined) {
    checks.push({ label: 'Training Sessions', current: snap.workouts, target: req.minWorkouts, met: snap.workouts >= req.minWorkouts });
  }
  if (req.minTrainingMinutes !== undefined) {
    checks.push({ label: 'Training Minutes', current: snap.trainingMinutes, target: req.minTrainingMinutes, met: snap.trainingMinutes >= req.minTrainingMinutes });
  }
  if (req.minQuestsCompleted !== undefined) {
    checks.push({ label: 'Quests Completed', current: snap.questsCompleted, target: req.minQuestsCompleted, met: snap.questsCompleted >= req.minQuestsCompleted });
  }
  if (req.minStreak !== undefined) {
    checks.push({ label: 'Current Streak', current: snap.streak, target: req.minStreak, met: snap.streak >= req.minStreak });
  }
  if (req.minBestStreak !== undefined) {
    checks.push({ label: 'Best Streak', current: snap.bestStreak, target: req.minBestStreak, met: snap.bestStreak >= req.minBestStreak });
  }
  if (req.minFullClearDays !== undefined) {
    checks.push({ label: 'Full-Clear Days', current: snap.fullClearDays, target: req.minFullClearDays, met: snap.fullClearDays >= req.minFullClearDays });
  }

  if (checks.length === 0) {
    return { unlocked: true, pct: 100, checks: [] };
  }

  const totalRatio = checks.reduce((acc, c) => acc + Math.min(1, c.current / Math.max(1, c.target)), 0);
  const pct = Math.round((totalRatio / checks.length) * 100);
  return {
    unlocked: checks.every((c) => c.met),
    pct,
    checks,
  };
}
