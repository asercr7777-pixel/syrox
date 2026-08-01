import type { AppState, DayRecord } from '../store/types';
import { RANKS, getRankByXp, getRankIndex, type Rank } from '../data/ranks';
import { levelFromXp } from '../store/defaults';

export interface AIMetrics {
  totalTasksCompleted: number;
  successRate: number;
  failureRate: number;
  avgCompletionPct: number;
  avgDailyXp: number;
  avgWeeklyXp: number;
  avgMonthlyXp: number;
  longestStreak: number;
  bestMonth: { month: string; xp: number; tasks: number } | null;
  mostProductiveHour: string;
  mostProductiveDay: string;
  leastProductiveDay: string;
  totalPerfectDays: number;
  totalDaysActive: number;
  accountAgeDays: number;
  weeklyPerformance: number;
  monthlyGrowth: number;
  dailyScore: number;
  overallDisciplineRating: number;
}

export interface AIInsight {
  id: string;
  text: string;
  type: 'positive' | 'warning' | 'neutral';
}

export interface AIPrediction {
  chanceCompleteToday: number;
  chanceBreakStreak: number;
  expectedLevel: number;
  expectedRank: string;
  expectedXp: number;
  burnoutRisk: number;
  recoveryTrend: 'up' | 'down' | 'stable';
  futureGrowth: number;
  confidence: number;
}

export interface DisciplineTrait {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  icon: string;
}

export interface RankProgressEntry {
  rank: Rank;
  unlocked: boolean;
  xpRequired: number;
  dateReached: string | null;
}

export interface HeatmapEntry {
  date: string;
  value: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface StreakEntry {
  start: string;
  end: string;
  length: number;
}

const HABIT_COLORS: Record<string, string> = {
  Sleep: '#8b5cf6',
  Workout: '#ff7a18',
  Prayer: '#a855f7',
  Reading: '#10b981',
  Water: '#06b6d4',
  'Healthy Food': '#fbbf24',
};

export function getHabitColors(): Record<string, string> {
  return HABIT_COLORS;
}

function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function monthKey(dateStr: string): string {
  return dateStr.slice(0, 7);
}

function getDayName(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d.getDay()];
}

export function computeMetrics(state: AppState): AIMetrics {
  const history = state.history;

  const totalTasksCompleted = history.reduce(
    (a, h) => a + Object.values(h.coreCompleted).filter(Boolean).length + Object.values(h.customCompleted).filter(Boolean).length,
    0,
  );

  const perfectDays = history.filter((h) => h.allMainDone).length;
  const totalDays = history.length;
  const successRate = totalDays > 0 ? Math.round((perfectDays / totalDays) * 100) : 0;
  const failureRate = totalDays > 0 ? 100 - successRate : 0;

  const avgCompletionPct = totalDays > 0
    ? Math.round(history.reduce((a, h) => a + h.disciplineScore, 0) / totalDays)
    : 0;

  const totalXp = history.reduce((a, h) => a + h.xpGained, 0);
  const avgDailyXp = totalDays > 0 ? Math.round(totalXp / totalDays) : 0;

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86400000);
  const monthAgo = new Date(now.getTime() - 30 * 86400000);

  const last7 = history.filter((h) => new Date(h.date + 'T00:00:00') >= weekAgo);
  const last30 = history.filter((h) => new Date(h.date + 'T00:00:00') >= monthAgo);

  const avgWeeklyXp = last7.length > 0
    ? Math.round(last7.reduce((a, h) => a + h.xpGained, 0) / (last7.length / 7))
    : avgDailyXp * 7;
  const avgMonthlyXp = last30.length > 0
    ? Math.round(last30.reduce((a, h) => a + h.xpGained, 0) / (last30.length / 30))
    : avgDailyXp * 30;

  const longestStreak = state.bestStreak;

  // Best month by XP
  const monthMap: Record<string, { xp: number; tasks: number }> = {};
  for (const h of history) {
    const mk = monthKey(h.date);
    if (!monthMap[mk]) monthMap[mk] = { xp: 0, tasks: 0 };
    monthMap[mk].xp += h.xpGained;
    monthMap[mk].tasks += Object.values(h.coreCompleted).filter(Boolean).length + Object.values(h.customCompleted).filter(Boolean).length;
  }
  let bestMonth: { month: string; xp: number; tasks: number } | null = null;
  for (const [mk, data] of Object.entries(monthMap)) {
    if (!bestMonth || data.xp > bestMonth.xp) bestMonth = { month: mk, ...data };
  }

  // Most/least productive days
  const dayPerf: Record<string, { tasks: number; count: number }> = {};
  for (const h of history) {
    const dn = getDayName(h.date);
    if (!dayPerf[dn]) dayPerf[dn] = { tasks: 0, count: 0 };
    dayPerf[dn].tasks += Object.values(h.coreCompleted).filter(Boolean).length + Object.values(h.customCompleted).filter(Boolean).length;
    dayPerf[dn].count += 1;
  }
  let mostProductiveDay = '—';
  let leastProductiveDay = '—';
  let maxAvg = -1;
  let minAvg = Infinity;
  for (const [dn, d] of Object.entries(dayPerf)) {
    const avg = d.tasks / d.count;
    if (avg > maxAvg) { maxAvg = avg; mostProductiveDay = dn; }
    if (avg < minAvg) { minAvg = avg; leastProductiveDay = dn; }
  }

  // Most productive hour — based on workout sessions and task completion times
  const hourCounts: Record<number, number> = {};
  for (const s of state.workoutSessions) {
    const hr = new Date(s.completedAt).getHours();
    hourCounts[hr] = (hourCounts[hr] ?? 0) + 1;
  }
  let mostProductiveHour = '—';
  let maxHour = -1;
  for (const [hr, cnt] of Object.entries(hourCounts)) {
    if (cnt > maxHour) { maxHour = cnt; mostProductiveHour = `${hr}:00`; }
  }

  const accountAgeDays = Math.max(1, Math.floor((Date.now() - state.createdAt) / 86400000));

  const weeklyPerformance = last7.length > 0
    ? Math.round(last7.reduce((a, h) => a + h.disciplineScore, 0) / last7.length)
    : 0;

  const prev30 = history.filter((h) => {
    const d = new Date(h.date + 'T00:00:00');
    return d >= new Date(now.getTime() - 60 * 86400000) && d < monthAgo;
  });
  const monthlyGrowth = last30.length > 0 && prev30.length > 0
    ? Math.round(((last30.reduce((a, h) => a + h.disciplineScore, 0) / last30.length) -
        (prev30.reduce((a, h) => a + h.disciplineScore, 0) / prev30.length)) * 100 / 100)
    : 0;

  const dailyScore = state.history.length > 0
    ? state.history[state.history.length - 1].disciplineScore
    : 0;

  const overallDisciplineRating = Math.round(
    (avgCompletionPct * 0.4 + successRate * 0.3 + Math.min(100, state.streak * 5) * 0.15 + weeklyPerformance * 0.15),
  );

  return {
    totalTasksCompleted,
    successRate,
    failureRate,
    avgCompletionPct,
    avgDailyXp,
    avgWeeklyXp,
    avgMonthlyXp,
    longestStreak,
    bestMonth,
    mostProductiveHour,
    mostProductiveDay,
    leastProductiveDay,
    totalPerfectDays: perfectDays,
    totalDaysActive: totalDays,
    accountAgeDays,
    weeklyPerformance,
    monthlyGrowth,
    dailyScore,
    overallDisciplineRating,
  };
}

export function computeInsights(state: AppState): AIInsight[] {
  const insights: AIInsight[] = [];
  const history = state.history;
  if (history.length < 3) {
    insights.push({
      id: 'early',
      text: 'The System is calibrating. Complete a few more days of tasks to unlock deep behavioral insights.',
      type: 'neutral',
    });
    return insights;
  }

  // Insight: workout consistency trend
  const last14 = history.slice(-14);
  const first7 = last14.slice(0, 7);
  const last7 = last14.slice(-7);
  const earlyWorkoutRate = first7.filter((h) => h.workoutCompleted).length / Math.max(first7.length, 1);
  const recentWorkoutRate = last7.filter((h) => h.workoutCompleted).length / Math.max(last7.length, 1);
  if (recentWorkoutRate > earlyWorkoutRate && earlyWorkoutRate > 0) {
    const pct = Math.round(((recentWorkoutRate - earlyWorkoutRate) / earlyWorkoutRate) * 100);
    insights.push({
      id: 'workout-trend',
      text: `Workout consistency has increased by ${pct}%. Your body is adapting to the discipline.`,
      type: 'positive',
    });
  }

  // Insight: day-specific misses
  const dayMissCount: Record<string, number> = {};
  for (const h of history) {
    if (!h.allMainDone) {
      const dn = getDayName(h.date);
      dayMissCount[dn] = (dayMissCount[dn] ?? 0) + 1;
    }
  }
  const sortedMisses = Object.entries(dayMissCount).sort((a, b) => b[1] - a[1]);
  if (sortedMisses.length > 0 && sortedMisses[0][1] >= 2) {
    insights.push({
      id: 'day-miss',
      text: `You usually miss tasks on ${sortedMisses[0][0]}s. Plan ahead to protect that day.`,
      type: 'warning',
    });
  }

  // Insight: perfect day performance boost
  const perfectDays = history.filter((h) => h.allMainDone);
  const imperfectDays = history.filter((h) => !h.allMainDone);
  if (perfectDays.length > 0 && imperfectDays.length > 0) {
    const perfectAvgXp = perfectDays.reduce((a, h) => a + h.xpGained, 0) / perfectDays.length;
    const imperfectAvgXp = imperfectDays.reduce((a, h) => a + h.xpGained, 0) / imperfectDays.length;
    if (imperfectAvgXp > 0) {
      const boost = Math.round(((perfectAvgXp - imperfectAvgXp) / imperfectAvgXp) * 100);
      if (boost > 0) {
        insights.push({
          id: 'perfect-boost',
          text: `Perfect days yield ${boost}% more XP than incomplete days. Complete all core tasks to maximize growth.`,
          type: 'positive',
        });
      }
    }
  }

  // Insight: streak momentum
  if (state.streak >= 7) {
    insights.push({
      id: 'streak-momentum',
      text: `${state.streak}-day streak active. Your discipline is compounding — each consecutive day strengthens the neural pathway.`,
      type: 'positive',
    });
  }

  // Insight: dungeon efficiency
  if (state.dungeonsCleared > 0) {
    insights.push({
      id: 'dungeon-eff',
      text: `${state.dungeonsCleared} dungeons cleared. Each clearance adds significant XP and drops to your arsenal.`,
      type: 'neutral',
    });
  }

  // Insight: discipline rating
  const metrics = computeMetrics(state);
  if (metrics.overallDisciplineRating >= 80) {
    insights.push({
      id: 'high-discipline',
      text: `Overall discipline rating: ${metrics.overallDisciplineRating}/100. You are in the elite tier of hunters.`,
      type: 'positive',
    });
  } else if (metrics.overallDisciplineRating < 40 && history.length > 7) {
    insights.push({
      id: 'low-discipline',
      text: `Discipline rating at ${metrics.overallDisciplineRating}/100. The System recommends completing core tasks early in the day.`,
      type: 'warning',
    });
  }

  return insights.slice(0, 6);
}

export function computePredictions(state: AppState): AIPrediction {
  const history = state.history;
  const metrics = computeMetrics(state);
  const enabledMain = state.mainTasks.filter((t) => t.enabled);
  const mainDone = enabledMain.filter((t) => state.coreCompleted[t.id]).length;
  const todayProgress = enabledMain.length > 0 ? mainDone / enabledMain.length : 0;

  // Chance of completing today's tasks based on current progress + historical perfect day rate
  const perfectRate = history.length > 0 ? history.filter((h) => h.allMainDone).length / history.length : 0;
  const chanceCompleteToday = Math.round((todayProgress * 0.5 + perfectRate * 0.5) * 100);

  // Chance of breaking streak — higher if recent discipline is declining
  const last7 = history.slice(-7);
  const recentAvg = last7.length > 0 ? last7.reduce((a, h) => a + h.disciplineScore, 0) / last7.length : 0;
  const chanceBreakStreak = state.streak > 0
    ? Math.min(95, Math.max(5, Math.round(100 - recentAvg * 0.8)))
    : 0;

  // Expected XP 30 days from now
  const avgDailyXp = metrics.avgDailyXp > 0 ? metrics.avgDailyXp : 50;
  const projected30DayXp = avgDailyXp * 30;
  const expectedXp = state.xp + projected30DayXp;
  const expectedLevel = levelFromXp(expectedXp);

  const expectedRank = getRankByXp(expectedXp).name;

  // Burnout risk — based on high activity + declining discipline
  const recentActivity = last7.filter((h) => h.disciplineScore > 70).length;
  const disciplineDecline = last7.length >= 4
    ? last7.slice(0, 3).reduce((a, h) => a + h.disciplineScore, 0) / 3 >
      last7.slice(-3).reduce((a, h) => a + h.disciplineScore, 0) / 3
    : false;
  const burnoutRisk = Math.min(95, Math.max(5,
    Math.round(recentActivity / 7 * 40 + (disciplineDecline ? 30 : 10)),
  ));

  const recoveryTrend: 'up' | 'down' | 'stable' = metrics.monthlyGrowth > 5
    ? 'up' : metrics.monthlyGrowth < -5 ? 'down' : 'stable';

  const futureGrowth = Math.round(projected30DayXp / Math.max(state.xp, 1) * 100);

  const confidence = Math.min(95, Math.max(40, Math.round(history.length / 30 * 100)));

  return {
    chanceCompleteToday: Math.min(99, Math.max(1, chanceCompleteToday)),
    chanceBreakStreak,
    expectedLevel,
    expectedRank,
    expectedXp,
    burnoutRisk,
    recoveryTrend,
    futureGrowth,
    confidence,
  };
}

export function computeTraits(state: AppState): DisciplineTrait[] {
  const history = state.history;
  const metrics = computeMetrics(state);
  const perfectDays = history.filter((h) => h.allMainDone).length;
  const nightSessions = state.workoutSessions.filter((s) => {
    const hr = new Date(s.completedAt).getHours();
    return hr >= 22 || hr < 5;
  }).length;

  const traits: DisciplineTrait[] = [
    {
      id: 'iron-will',
      name: 'Iron Will',
      description: 'Maintain a 7+ day streak',
      unlocked: state.streak >= 7,
      icon: '🔥',
    },
    {
      id: 'perfect-discipline',
      name: 'Perfect Discipline',
      description: 'Complete 10 perfect days',
      unlocked: perfectDays >= 10,
      icon: '⭐',
    },
    {
      id: 'silent-warrior',
      name: 'Silent Warrior',
      description: 'Maintain discipline rating above 75',
      unlocked: metrics.overallDisciplineRating >= 75,
      icon: '🥷',
    },
    {
      id: 'night-grinder',
      name: 'Night Grinder',
      description: 'Complete 5 workouts after 10 PM',
      unlocked: nightSessions >= 5,
      icon: '🌙',
    },
    {
      id: 'limit-breaker',
      name: 'Limit Breaker',
      description: 'Reach a 30-day streak',
      unlocked: state.bestStreak >= 30,
      icon: '⚡',
    },
    {
      id: 'focused-mind',
      name: 'Focused Mind',
      description: 'Complete 100 total tasks',
      unlocked: metrics.totalTasksCompleted >= 100,
      icon: '🧠',
    },
    {
      id: 'relentless',
      name: 'Relentless',
      description: 'Stay active for 30 days',
      unlocked: metrics.accountAgeDays >= 30 && metrics.totalDaysActive >= 20,
      icon: '💀',
    },
  ];

  return traits;
}

export function computeRankProgress(state: AppState): RankProgressEntry[] {
  const xp = state.xp;
  return RANKS.map((rank) => {
    const unlocked = xp >= rank.xpRequired;
    let dateReached: string | null = null;
    if (unlocked) {
      // Find the earliest history day where cumulative XP would have reached this rank
      let cumulative = 0;
      for (const h of state.history) {
        cumulative += h.xpGained;
        if (cumulative + (xp - state.history.reduce((a, h2) => a + h2.xpGained, 0)) >= rank.xpRequired) {
          dateReached = h.date;
          break;
        }
      }
      if (!dateReached && rank === RANKS[0]) dateReached = new Date(state.createdAt).toISOString().slice(0, 10);
    }
    return { rank, unlocked, xpRequired: rank.xpRequired, dateReached };
  });
}

export function computeHeatmap(state: AppState): HeatmapEntry[] {
  const historyMap = new Map(state.history.map((h) => [h.date, h.disciplineScore]));
  const entries: HeatmapEntry[] = [];
  const today = new Date();
  for (let i = 364; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 86400000);
    const ds = dateKey(d);
    const score = historyMap.get(ds) ?? 0;
    const level: 0 | 1 | 2 | 3 | 4 = score === 0 ? 0 : score < 25 ? 1 : score < 50 ? 2 : score < 75 ? 3 : 4;
    entries.push({ date: ds, value: score, level });
  }
  return entries;
}

export function computeStreakHistory(state: AppState): StreakEntry[] {
  const streaks: StreakEntry[] = [];
  let currentStart: string | null = null;
  let currentLen = 0;
  let prevDate: string | null = null;

  const sorted = [...state.history].sort((a, b) => a.date.localeCompare(b.date));
  for (const h of sorted) {
    if (h.allMainDone) {
      if (currentStart === null) {
        currentStart = h.date;
        currentLen = 1;
      } else if (prevDate) {
        const prev = new Date(prevDate + 'T00:00:00');
        const curr = new Date(h.date + 'T00:00:00');
        const diff = (curr.getTime() - prev.getTime()) / 86400000;
        if (diff === 1) {
          currentLen++;
        } else {
          if (currentLen >= 2) streaks.push({ start: currentStart, end: prevDate, length: currentLen });
          currentStart = h.date;
          currentLen = 1;
        }
      }
      prevDate = h.date;
    } else {
      if (currentStart && currentLen >= 2) {
        streaks.push({ start: currentStart, end: prevDate!, length: currentLen });
      }
      currentStart = null;
      currentLen = 0;
      prevDate = h.date;
    }
  }
  if (currentStart && currentLen >= 2) {
    streaks.push({ start: currentStart, end: prevDate!, length: currentLen });
  }
  return streaks.sort((a, b) => b.length - a.length).slice(0, 20);
}

export function computeHabitData(state: AppState): { date: string; [key: string]: number | string }[] {
  const history = state.history.slice(-14);
  return history.map((h) => {
    const row: { date: string; [key: string]: number | string } = { date: h.date };
    for (const t of state.mainTasks.filter((x) => x.enabled)) {
      row[t.label] = h.coreCompleted[t.id] ? 1 : 0;
    }
    return row;
  });
}

export function computeGrowthComparison(state: AppState) {
  const now = new Date();
  const history = state.history;

  const thisWeek = history.filter((h) => new Date(h.date + 'T00:00:00') >= new Date(now.getTime() - 7 * 86400000));
  const lastWeek = history.filter((h) => {
    const d = new Date(h.date + 'T00:00:00');
    return d >= new Date(now.getTime() - 14 * 86400000) && d < new Date(now.getTime() - 7 * 86400000);
  });
  const thisMonth = history.filter((h) => new Date(h.date + 'T00:00:00') >= new Date(now.getTime() - 30 * 86400000));
  const lastMonth = history.filter((h) => {
    const d = new Date(h.date + 'T00:00:00');
    return d >= new Date(now.getTime() - 60 * 86400000) && d < new Date(now.getTime() - 30 * 86400000);
  });

  const sumXp = (arr: DayRecord[]) => arr.reduce((a, h) => a + h.xpGained, 0);

  return [
    {
      label: 'This Week',
      value: sumXp(thisWeek),
      compareLabel: 'Last Week',
      compareValue: sumXp(lastWeek),
    },
    {
      label: 'This Month',
      value: sumXp(thisMonth),
      compareLabel: 'Last Month',
      compareValue: sumXp(lastMonth),
    },
  ];
}

export function computeTaskDistribution(state: AppState) {
  const history = state.history;
  const completed = history.reduce(
    (a, h) => a + Object.values(h.coreCompleted).filter(Boolean).length + Object.values(h.customCompleted).filter(Boolean).length,
    0,
  );
  const skipped = history.reduce(
    (a, h) => a + Object.values(h.coreCompleted).filter((v) => !v).length + Object.values(h.customCompleted).filter((v) => !v).length,
    0,
  );
  return [
    { name: 'Completed', value: completed, color: '#10b981' },
    { name: 'Skipped', value: skipped, color: '#64748b' },
    { name: 'Failed', value: 0, color: '#f43f5e' },
    { name: 'Expired', value: 0, color: '#fb923c' },
  ].filter((d) => d.value > 0 || d.name === 'Completed');
}

export function computeDisciplineTimeline(state: AppState, range: 'week' | 'month' | 'year' | 'all'): { date: string; score: number }[] {
  const history = state.history;
  const now = Date.now();
  const cutoff = range === 'week' ? 7 : range === 'month' ? 30 : range === 'year' ? 365 : Infinity;
  const filtered = history.filter((h) => {
    if (cutoff === Infinity) return true;
    return (now - new Date(h.date + 'T00:00:00').getTime()) / 86400000 <= cutoff;
  });
  return filtered.map((h) => ({ date: h.date, score: h.disciplineScore }));
}

export function computeXpProgress(state: AppState): { date: string; xp: number }[] {
  let cumulative = 0;
  return state.history.map((h) => {
    cumulative += h.xpGained;
    return { date: h.date, xp: cumulative };
  });
}

export function computeRadarData(state: AppState): { metric: string; value: number }[] {
  const m = computeMetrics(state);
  const workoutCount = state.workoutSessions.length;
  const dungeonCount = state.dungeonsCleared;
  const achievementsCount = state.achievements.length;

  return [
    { metric: 'Discipline', value: m.overallDisciplineRating },
    { metric: 'Focus', value: Math.min(100, m.avgCompletionPct + 10) },
    { metric: 'Health', value: Math.min(100, workoutCount * 5 + (state.history.filter((h) => h.workoutCompleted).length / Math.max(state.history.length, 1)) * 100) },
    { metric: 'Strength', value: Math.min(100, Math.floor(state.totalWorkoutSeconds / 60) / 10 + workoutCount * 3) },
    { metric: 'Consistency', value: Math.min(100, state.streak * 5 + (m.totalDaysActive / Math.max(m.accountAgeDays, 1)) * 50) },
    { metric: 'Knowledge', value: Math.min(100, achievementsCount * 8 + dungeonCount * 5) },
    { metric: 'Productivity', value: Math.min(100, m.avgDailyXp / 10) },
  ];
}

export function computePredictionData(state: AppState): { date: string; projected: number; confidence: number }[] {
  const history = state.history.slice(-30);
  if (history.length < 3) return [];
  const scores = history.map((h) => h.disciplineScore);
  const trend = scores.length > 1
    ? (scores[scores.length - 1] - scores[0]) / scores.length
    : 0;

  const result: { date: string; projected: number; confidence: number }[] = [];
  const today = new Date();
  let lastScore = scores[scores.length - 1] ?? 50;
  for (let i = 1; i <= 30; i++) {
    const d = new Date(today.getTime() + i * 86400000);
    lastScore = Math.max(0, Math.min(100, lastScore + trend * 0.8 + (Math.random() - 0.5) * 2));
    const confidence = Math.max(40, Math.min(95, 90 - i * 1.5));
    result.push({ date: d.toISOString().slice(0, 10), projected: Math.round(lastScore), confidence: Math.round(confidence) });
  }
  return result;
}

export function getDailyCoach(state: AppState): string {
  const history = state.history;
  const metrics = computeMetrics(state);
  const predictions = computePredictions(state);
  const enabledMain = state.mainTasks.filter((t) => t.enabled);
  const incomplete = enabledMain.filter((t) => !state.coreCompleted[t.id]);

  if (incomplete.length > 0) {
    const next = incomplete[0];
    return `Your next priority: ${next.label}. Complete it now to push your discipline score from ${metrics.dailyScore} toward 100. Projected 30-day XP: ${(predictions.expectedXp - state.xp).toLocaleString()}.`;
  }

  if (history.length > 0 && history[history.length - 1].allMainDone) {
    return `All core tasks complete today. Discipline rating at ${metrics.overallDisciplineRating}. ${predictions.burnoutRisk > 50 ? 'Burnout risk elevated — consider active recovery.' : 'You are on track. Maintain the rhythm.'}`;
  }

  return `The System sees ${metrics.totalTasksCompleted} tasks completed across ${metrics.totalDaysActive} active days. Focus on completing all core tasks today to strengthen your streak of ${state.streak} days.`;
}

// Re-export for convenience
export { RANKS, getRankByXp, getRankIndex };
