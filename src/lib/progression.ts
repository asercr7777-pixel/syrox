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
