import type { AppState, DayRecord } from '../store/types';
import { getRankByXp, getNextRank, getRankIndex, RANKS } from '../data/ranks';
import { todayStr } from '../store/defaults';

export interface DailyReport {
  date: string;
  tasksCompleted: number;
  tasksMissed: number;
  xpEarned: number;
  coinsEarned: number;
  disciplineScore: number;
  streak: number;
  productivityRating: number;
  bestAchievement: string;
  biggestWeakness: string;
  advice: string;
}

export interface WeeklyReport {
  totalXp: number;
  totalTasks: number;
  bestDay: { date: string; score: number };
  worstDay: { date: string; score: number };
  consistencyRating: number;
  improvementScore: number;
  strengths: string[];
  weaknesses: string[];
  advice: string;
}

export interface MonthlyReport {
  xpGrowth: number;
  rankProgress: { from: string; to: string };
  longestStreak: number;
  taskCompletionPct: number;
  mostProductiveWeek: number;
  biggestImprovement: string;
  areasNeedingWork: string[];
}

export interface Insight {
  label: string;
  value: string;
  icon: string;
}

export interface Warning {
  level: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  recommendation: string;
}

export interface Recommendation {
  priority: 'high' | 'medium' | 'low';
  text: string;
  reason: string;
}

export interface GoalSuggestion {
  type: string;
  label: string;
  description: string;
  target: string;
  realistic: boolean;
}

const MOTIVATION_QUOTES = [
  'Every completed task brings you closer to becoming stronger.',
  "You've already defeated yesterday's version of yourself.",
  'Discipline is built through repetition, not perfection.',
  'The shadow grows when you hesitate. Move.',
  'A Hunter does not wait for motivation. They act.',
  'Your only competition is who you were yesterday.',
  'Strength is not given. It is taken, one task at a time.',
  'The System rewards those who show up, not those who feel ready.',
  'Ranks are not earned in a day. They are earned in consistency.',
  'A perfect day is not required. An honest one is.',
  'The gap between who you are and who you want to be is closed by action.',
  'Rest if you must. But do not quit.',
  'The dungeon does not care about your mood. Neither should you.',
  'Every rep, every page, every task is a brick in the fortress of your discipline.',
  'You are not behind. You are building. Keep going.',
];

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function daysAgoStr(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function getHistoryRange(history: DayRecord[], days: number): DayRecord[] {
  const cutoff = daysAgoStr(days);
  return history.filter((h) => h.date >= cutoff).sort((a, b) => a.date.localeCompare(b.date));
}

export function generateDailyReport(state: AppState): DailyReport {
  const today = todayStr();
  const todayRecord = state.history.find((h) => h.date === today);
  const enabledMain = state.mainTasks.filter((t) => t.enabled);
  const mainDone = enabledMain.filter((t) => state.coreCompleted[t.id]).length;
  const mainMissed = enabledMain.length - mainDone;
  const extraDone = Object.values(state.customCompleted).filter(Boolean).length;
  const extraMissed = state.customTasks.length - extraDone;
  const tasksCompleted = mainDone + extraDone;
  const tasksMissed = mainMissed + extraMissed;
  const xpEarned = todayRecord?.xpGained ?? state.dailyXp;
  const disciplineScore = todayRecord?.disciplineScore ?? 0;
  const productivityRating = clamp(Math.round((tasksCompleted / Math.max(tasksCompleted + tasksMissed, 1)) * 100), 0, 100);

  let bestAchievement = 'No achievements recorded yet today.';
  if (mainDone === enabledMain.length && enabledMain.length > 0) bestAchievement = 'All main tasks completed — a perfect day.';
  else if (mainDone >= Math.ceil(enabledMain.length * 0.75)) bestAchievement = `${mainDone}/${enabledMain.length} main tasks completed — strong effort.`;
  else if (state.workoutsCompletedToday > 0) bestAchievement = 'Workout session completed — body strengthened.';
  else if (tasksCompleted > 0) bestAchievement = `${tasksCompleted} tasks completed — momentum building.`;

  let biggestWeakness = 'No data to analyze yet.';
  if (tasksMissed > tasksCompleted && tasksMissed > 0) biggestWeakness = `${tasksMissed} tasks left incomplete — focus on completion.`;
  else if (mainMissed > 0) biggestWeakness = `${mainMissed} core tasks missed — these are your foundation.`;
  else if (state.workoutsCompletedToday === 0) biggestWeakness = 'No workout completed — your body needs training.';
  else if (disciplineScore < 50) biggestWeakness = `Discipline score at ${disciplineScore}% — below target.`;

  let advice = 'Begin completing tasks to receive personalized advice.';
  if (disciplineScore >= 80) advice = 'Outstanding discipline today. Maintain this momentum tomorrow — consistency is your greatest weapon.';
  else if (disciplineScore >= 50) advice = 'Solid progress. Identify the two most important tasks remaining and complete them before anything else tomorrow.';
  else if (tasksCompleted > 0) advice = 'You started, but left too much on the table. Tomorrow, complete your core tasks first — before any distractions.';
  else advice = 'Today was a missed opportunity. Tomorrow, start with a single task. One win creates momentum.';

  return {
    date: today,
    tasksCompleted,
    tasksMissed,
    xpEarned,
    coinsEarned: Math.round(xpEarned * 0.1),
    disciplineScore,
    streak: state.streak,
    productivityRating,
    bestAchievement,
    biggestWeakness,
    advice,
  };
}

export function generateWeeklyReport(state: AppState): WeeklyReport {
  const last7 = getHistoryRange(state.history, 7);
  const prev7 = getHistoryRange(state.history, 14).filter((h) => h.date < daysAgoStr(7));

  const totalXp = last7.reduce((a, h) => a + h.xpGained, 0);
  const totalTasks = last7.reduce((a, h) => a + Object.values(h.coreCompleted).filter(Boolean).length + Object.values(h.customCompleted).filter(Boolean).length, 0);

  const dayScores = last7.map((h) => ({ date: h.date, score: h.disciplineScore }));
  const bestDay = dayScores.reduce((best, d) => (d.score > best.score ? d : best), { date: 'N/A', score: 0 });
  const worstDay = dayScores.reduce((worst, d) => (d.score < worst.score ? d : worst), { date: 'N/A', score: 100 });

  const activeDays = last7.filter((h) => h.disciplineScore > 0).length;
  const consistencyRating = Math.round((activeDays / 7) * 100);

  const prevAvg = prev7.length > 0 ? prev7.reduce((a, h) => a + h.disciplineScore, 0) / prev7.length : 0;
  const currAvg = last7.length > 0 ? last7.reduce((a, h) => a + h.disciplineScore, 0) / last7.length : 0;
  const improvementScore = Math.round(currAvg - prevAvg);

  const strengths: string[] = [];
  const weaknesses: string[] = [];

  if (consistencyRating >= 80) strengths.push('Excellent consistency — active almost every day.');
  else if (consistencyRating >= 50) strengths.push('Decent consistency — building a habit.');
  else weaknesses.push('Low consistency — too many inactive days.');

  if (bestDay.score >= 80) strengths.push(`Peak performance on ${new Date(bestDay.date).toLocaleDateString('en', { weekday: 'long' })} (${bestDay.score}%).`);
  if (worstDay.score < 30 && worstDay.date !== 'N/A') weaknesses.push(`Weak performance on ${new Date(worstDay.date).toLocaleDateString('en', { weekday: 'long' })} (${worstDay.score}%).`);

  const workoutDays = last7.filter((h) => h.workoutCompleted).length;
  if (workoutDays >= 3) strengths.push(`Trained ${workoutDays} days this week — body is getting stronger.`);
  else if (workoutDays === 0) weaknesses.push('No workouts completed — physical training is slipping.');

  const perfectDays = last7.filter((h) => h.allMainDone).length;
  if (perfectDays >= 3) strengths.push(`${perfectDays} perfect days — outstanding discipline.`);

  if (improvementScore > 0) strengths.push(`Improvement of ${improvementScore} points vs last week.`);
  else if (improvementScore < -5) weaknesses.push(`Decline of ${Math.abs(improvementScore)} points vs last week.`);

  let advice = 'Continue showing up. The System rewards consistency above all else.';
  if (improvementScore > 10) advice = 'You are accelerating. Push harder — but do not burn out. Rest is part of the protocol.';
  else if (improvementScore < -10) advice = 'You are losing ground. This week, focus on completing your core tasks only. Forget optimization — just finish.';
  else if (consistencyRating < 50) advice = 'Your biggest enemy is not difficulty — it is absence. Show up every day, even if only for one task.';

  return {
    totalXp,
    totalTasks,
    bestDay,
    worstDay,
    consistencyRating,
    improvementScore,
    strengths,
    weaknesses,
    advice,
  };
}

export function generateMonthlyReport(state: AppState): MonthlyReport {
  const last30 = getHistoryRange(state.history, 30);
  const prev30 = getHistoryRange(state.history, 60).filter((h) => h.date < daysAgoStr(30));

  const xpGrowth = last30.reduce((a, h) => a + h.xpGained, 0);
  const prevXp = prev30.reduce((a, h) => a + h.xpGained, 0);
  const xpDelta = xpGrowth - prevXp;

  const rank30DaysAgo = getRankByXp(state.xp - xpGrowth);
  const currentRank = getRankByXp(state.xp);

  let longestStreak = 0;
  let currentRun = 0;
  for (const h of last30) {
    if (h.disciplineScore > 0) {
      currentRun++;
      longestStreak = Math.max(longestStreak, currentRun);
    } else {
      currentRun = 0;
    }
  }

  const totalTasks = last30.reduce((a, h) => a + Object.values(h.coreCompleted).filter(Boolean).length + Object.values(h.customCompleted).filter(Boolean).length, 0);
  const totalPossible = last30.reduce((a, h) => {
    const mainCount = Object.keys(h.coreCompleted).length;
    const customCount = Object.keys(h.customCompleted).length;
    return a + mainCount + customCount;
  }, 0);
  const taskCompletionPct = totalPossible > 0 ? Math.round((totalTasks / totalPossible) * 100) : 0;

  // Find most productive week
  const weeks: { week: number; xp: number }[] = [];
  for (let w = 0; w < 4; w++) {
    const weekData = last30.slice(w * 7, (w + 1) * 7);
    weeks.push({ week: w + 1, xp: weekData.reduce((a, h) => a + h.xpGained, 0) });
  }
  const mostProductiveWeek = weeks.reduce((best, w) => (w.xp > best.xp ? w : best), { week: 0, xp: 0 }).week;

  const biggestImprovement = xpDelta > 0
    ? `+${xpDelta.toLocaleString()} XP compared to last month — steady growth.`
    : xpDelta === 0
      ? 'XP growth held steady — no decline, but no acceleration either.'
      : `${Math.abs(xpDelta).toLocaleString()} XP less than last month — course correction needed.`;

  const areasNeedingWork: string[] = [];
  const workoutDays = last30.filter((h) => h.workoutCompleted).length;
  if (workoutDays < 8) areasNeedingWork.push(`Workout frequency: only ${workoutDays} days this month. Target 12+.`);
  if (taskCompletionPct < 60) areasNeedingWork.push(`Task completion rate at ${taskCompletionPct}%. Target 80%+.`);
  const perfectDays = last30.filter((h) => h.allMainDone).length;
  if (perfectDays < 10) areasNeedingWork.push(`Only ${perfectDays} perfect days. Aim for 15+ next month.`);
  if (state.streak < 5) areasNeedingWork.push('Streak is fragile — focus on daily consistency.');

  return {
    xpGrowth,
    rankProgress: { from: rank30DaysAgo.name, to: currentRank.name },
    longestStreak,
    taskCompletionPct,
    mostProductiveWeek,
    biggestImprovement,
    areasNeedingWork: areasNeedingWork.length > 0 ? areasNeedingWork : ['No critical areas — maintain your current trajectory.'],
  };
}

export function generateInsights(state: AppState): Insight[] {
  const insights: Insight[] = [];
  const last30 = getHistoryRange(state.history, 30);

  // Most productive weekday
  const dayMap: Record<string, { total: number; count: number }> = {};
  for (const h of last30) {
    const day = new Date(h.date + 'T00:00:00').toLocaleDateString('en', { weekday: 'long' });
    if (!dayMap[day]) dayMap[day] = { total: 0, count: 0 };
    dayMap[day].total += h.disciplineScore;
    dayMap[day].count++;
  }
  let bestDay = 'N/A';
  let bestAvg = 0;
  for (const [day, { total, count }] of Object.entries(dayMap)) {
    const avg = count > 0 ? total / count : 0;
    if (avg > bestAvg) { bestAvg = avg; bestDay = day; }
  }
  if (bestDay !== 'N/A') insights.push({ label: 'Most Productive Day', value: `${bestDay} (${Math.round(bestAvg)}% avg)`, icon: '📅' });

  // Average completion rate
  const avgCompletion = last30.length > 0
    ? Math.round(last30.reduce((a, h) => a + h.disciplineScore, 0) / last30.length)
    : 0;
  insights.push({ label: 'Avg Completion Rate', value: `${avgCompletion}%`, icon: '📊' });

  // Strongest habit (most completed task)
  const taskCounts: Record<string, number> = {};
  for (const h of last30) {
    for (const [id, done] of Object.entries(h.coreCompleted)) {
      if (done) taskCounts[id] = (taskCounts[id] ?? 0) + 1;
    }
  }
  let strongestTaskId = '';
  let strongestCount = 0;
  for (const [id, count] of Object.entries(taskCounts)) {
    if (count > strongestCount) { strongestCount = count; strongestTaskId = id; }
  }
  const strongestTask = state.mainTasks.find((t) => t.id === strongestTaskId);
  if (strongestTask) insights.push({ label: 'Strongest Habit', value: `${strongestTask.emoji} ${strongestTask.label} (${strongestCount}x)`, icon: '💪' });

  // Most skipped task
  let weakestTaskId = '';
  let weakestCount = 999;
  for (const id of Object.keys(taskCounts)) {
    if (taskCounts[id] < weakestCount) { weakestCount = taskCounts[id]; weakestTaskId = id; }
  }
  const weakestTask = state.mainTasks.find((t) => t.id === weakestTaskId);
  if (weakestTask) insights.push({ label: 'Most Skipped Task', value: `${weakestTask.emoji} ${weakestTask.label} (${weakestCount}x)`, icon: '⚠️' });

  // Total workout time
  const totalMin = Math.floor(state.totalWorkoutSeconds / 60);
  insights.push({ label: 'Total Training Time', value: `${totalMin} min`, icon: '🏋️' });

  // Longest streak
  insights.push({ label: 'Longest Streak', value: `${state.bestStreak} days`, icon: '🔥' });

  return insights;
}

export function generateWarnings(state: AppState): Warning[] {
  const warnings: Warning[] = [];
  const last7 = getHistoryRange(state.history, 7);
  const today = todayStr();

  // Streak risk
  const todayRecord = state.history.find((h) => h.date === today);
  const enabledMain = state.mainTasks.filter((t) => t.enabled);
  const mainDone = enabledMain.filter((t) => state.coreCompleted[t.id]).length;
  if (state.streak > 0 && mainDone < enabledMain.length && !todayRecord?.allMainDone) {
    const hour = new Date().getHours();
    if (hour >= 20) {
      warnings.push({
        level: 'critical',
        title: 'Streak in Danger',
        message: `Your ${state.streak}-day streak is at risk. ${enabledMain.length - mainDone} core tasks remain today.`,
        recommendation: 'Complete your remaining core tasks now. Even one keeps the streak alive.',
      });
    }
  }

  // Low consistency
  const activeDays = last7.filter((h) => h.disciplineScore > 0).length;
  if (activeDays < 4 && last7.length >= 5) {
    warnings.push({
      level: 'warning',
      title: 'Low Consistency',
      message: `Only active ${activeDays} out of ${last7.length} days this week.`,
      recommendation: 'Aim for at least 5 active days per week. Start small — one task per day.',
    });
  }

  // Too many missed tasks
  const missedTasks = last7.reduce((a, h) => {
    const main = Object.keys(h.coreCompleted).length - Object.values(h.coreCompleted).filter(Boolean).length;
    return a + Math.max(0, main);
  }, 0);
  if (missedTasks > 10) {
    warnings.push({
      level: 'warning',
      title: 'High Miss Rate',
      message: `${missedTasks} core tasks missed this week.`,
      recommendation: 'Review your task list. Remove tasks you consistently skip, or reduce their difficulty.',
    });
  }

  // XP slowdown
  const recentXp = last7.reduce((a, h) => a + h.xpGained, 0);
  const prevXp = getHistoryRange(state.history, 14).filter((h) => h.date < daysAgoStr(7)).reduce((a, h) => a + h.xpGained, 0);
  if (prevXp > 0 && recentXp < prevXp * 0.6) {
    warnings.push({
      level: 'warning',
      title: 'XP Declining',
      message: `XP earned this week (${recentXp.toLocaleString()}) is ${Math.round((1 - recentXp / prevXp) * 100)}% lower than last week.`,
      recommendation: 'Focus on completing high-value tasks first. Consider enabling double XP from the wheel.',
    });
  }

  // Workout skipped
  const workoutDays = last7.filter((h) => h.workoutCompleted).length;
  if (workoutDays === 0 && last7.length >= 5) {
    warnings.push({
      level: 'warning',
      title: 'Workout Gap',
      message: 'No workouts completed in the last 7 days.',
      recommendation: 'Start with a 10-minute session. Any movement counts.',
    });
  }

  return warnings;
}

export function generateRecommendations(state: AppState): Recommendation[] {
  const recs: Recommendation[] = [];
  const last7 = getHistoryRange(state.history, 7);
  const today = todayStr();
  const enabledMain = state.mainTasks.filter((t) => t.enabled);
  const mainDone = enabledMain.filter((t) => state.coreCompleted[t.id]).length;
  const hour = new Date().getHours();

  // Workout timing
  if (state.workoutsCompletedToday === 0 && hour < 12) {
    recs.push({
      priority: 'high',
      text: 'Complete your workout before noon.',
      reason: 'Data shows your completion rate is higher when you train early in the day.',
    });
  }

  // Core tasks first
  if (mainDone < enabledMain.length) {
    recs.push({
      priority: 'high',
      text: `Complete your remaining ${enabledMain.length - mainDone} core tasks.`,
      reason: 'Core tasks are the foundation of your discipline score and streak.',
    });
  }

  // Reading before sleep
  if (hour >= 21 && !state.coreCompleted['read']) {
    recs.push({
      priority: 'medium',
      text: 'Read for 10 minutes before sleeping.',
      reason: 'Night reading improves sleep quality and builds a calm mind.',
    });
  }

  // Consistency over XP
  const avgDiscipline = last7.length > 0 ? last7.reduce((a, h) => a + h.disciplineScore, 0) / last7.length : 0;
  if (avgDiscipline < 50) {
    recs.push({
      priority: 'medium',
      text: 'Focus on consistency instead of XP.',
      reason: `Your average discipline score is ${Math.round(avgDiscipline)}%. Completing tasks daily matters more than earning high XP occasionally.`,
    });
  }

  // Streak protection
  if (state.streak >= 3 && mainDone < enabledMain.length) {
    recs.push({
      priority: 'high',
      text: 'Your streak is in danger. Complete at least one more task.',
      reason: `A ${state.streak}-day streak is valuable. Breaking it resets your progress.`,
    });
  }

  // Water
  if (!state.coreCompleted['water']) {
    recs.push({
      priority: 'low',
      text: 'Drink a glass of water now.',
      reason: 'Hydration improves focus and energy. A simple win.',
    });
  }

  return recs;
}

export function generateGoalSuggestions(state: AppState): GoalSuggestion[] {
  const avgDiscipline = getHistoryRange(state.history, 7).reduce((a, h) => a + h.disciplineScore, 0) / Math.max(getHistoryRange(state.history, 7).length, 1);
  const nextRank = getNextRank(state.xp);

  return [
    {
      type: 'streak',
      label: '7-Day Streak',
      description: 'Maintain a 7-day streak by completing all core tasks every day.',
      target: '7 days',
      realistic: avgDiscipline > 40,
    },
    {
      type: 'rank',
      label: `Reach ${nextRank?.name ?? 'Next Rank'}`,
      description: `Earn ${(nextRank ? nextRank.xpRequired - state.xp : 0).toLocaleString()} XP to reach ${nextRank?.name ?? 'the next rank'}.`,
      target: `${nextRank?.xpRequired.toLocaleString() ?? 'N/A'} XP`,
      realistic: true,
    },
    {
      type: 'workout',
      label: '30-Day Workout Goal',
      description: 'Complete at least 3 workouts per week for 30 days.',
      target: '12 sessions',
      realistic: true,
    },
    {
      type: 'discipline',
      label: '80% Discipline Score',
      description: 'Maintain an average discipline score of 80% for 14 days.',
      target: '80% avg',
      realistic: avgDiscipline > 60,
    },
    {
      type: 'perfect',
      label: '15 Perfect Days',
      description: 'Complete all core tasks for 15 days in a 30-day period.',
      target: '15 days',
      realistic: avgDiscipline > 50,
    },
  ];
}

export function getMotivationQuote(state: AppState): string {
  const day = new Date().getDate();
  const index = (day + state.streak) % MOTIVATION_QUOTES.length;
  return MOTIVATION_QUOTES[index];
}

export function generateShadowGreeting(state: AppState): string {
  const rank = getRankByXp(state.xp);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const enabledMain = state.mainTasks.filter((t) => t.enabled);
  const mainDone = enabledMain.filter((t) => state.coreCompleted[t.id]).length;
  const remaining = enabledMain.length - mainDone;

  if (remaining === 0 && enabledMain.length > 0) {
    return `${greeting}, ${state.username}. All core tasks complete. The System acknowledges your discipline today. Rest well — tomorrow brings new gates to clear.`;
  }
  if (remaining > 0) {
    return `${greeting}, ${state.username}. You are ${rank.name} with ${remaining} core tasks remaining. The shadow grows when you hesitate. Begin now.`;
  }
  return `${greeting}, ${state.username}. I am Shadow — your System Guide and Discipline Mentor. I analyze your progress, generate reports, and help you grow stronger every day. Ask me anything.`;
}

export function generateShadowResponse(state: AppState, userText: string): string {
  const rank = getRankByXp(state.xp);
  const nextRank = getNextRank(state.xp);
  const enabledMain = state.mainTasks.filter((t) => t.enabled);
  const mainDone = enabledMain.filter((t) => state.coreCompleted[t.id]).length;
  const extraDone = Object.values(state.customCompleted).filter(Boolean).length;
  const last7 = getHistoryRange(state.history, 7);
  const avgDiscipline = last7.length > 0 ? Math.round(last7.reduce((a, h) => a + h.disciplineScore, 0) / last7.length) : 0;
  const lower = userText.toLowerCase();

  if (lower.includes('report') || lower.includes('summary')) {
    const daily = generateDailyReport(state);
    return `Daily Report — ${daily.date}:\n• Tasks completed: ${daily.tasksCompleted}\n• Tasks missed: ${daily.tasksMissed}\n• XP earned: ${daily.xpEarned.toLocaleString()}\n• Discipline score: ${daily.disciplineScore}%\n• Streak: ${daily.streak} days\n• Productivity rating: ${daily.productivityRating}%\n\nBest achievement: ${daily.bestAchievement}\nBiggest weakness: ${daily.biggestWeakness}\n\nAdvice: ${daily.advice}`;
  }
  if (lower.includes('week')) {
    const weekly = generateWeeklyReport(state);
    return `Weekly Report:\n• Total XP: ${weekly.totalXp.toLocaleString()}\n• Total tasks: ${weekly.totalTasks}\n• Consistency: ${weekly.consistencyRating}%\n• Improvement: ${weekly.improvementScore >= 0 ? '+' : ''}${weekly.improvementScore} pts\n\nBest day: ${weekly.bestDay.date} (${weekly.bestDay.score}%)\nWorst day: ${weekly.worstDay.date} (${weekly.worstDay.score}%)\n\nStrengths: ${weekly.strengths.join('; ')}\nWeaknesses: ${weekly.weaknesses.join('; ')}\n\nAdvice: ${weekly.advice}`;
  }
  if (lower.includes('month')) {
    const monthly = generateMonthlyReport(state);
    return `Monthly Report:\n• XP growth: ${monthly.xpGrowth.toLocaleString()}\n• Rank progress: ${monthly.rankProgress.from} → ${monthly.rankProgress.to}\n• Longest streak: ${monthly.longestStreak} days\n• Task completion: ${monthly.taskCompletionPct}%\n• Most productive week: Week ${monthly.mostProductiveWeek}\n\n${monthly.biggestImprovement}\n\nAreas needing work: ${monthly.areasNeedingWork.join('; ')}`;
  }
  if (lower.includes('recommend') || lower.includes('suggest')) {
    const recs = generateRecommendations(state);
    if (recs.length === 0) return 'No urgent recommendations. You are on track. Maintain your current pace.';
    return recs.map((r, i) => `${i + 1}. ${r.text}\n   Reason: ${r.reason}`).join('\n\n');
  }
  if (lower.includes('insight') || lower.includes('analy')) {
    const insights = generateInsights(state);
    return insights.map((ins) => `${ins.icon} ${ins.label}: ${ins.value}`).join('\n');
  }
  if (lower.includes('warning') || lower.includes('alert') || lower.includes('problem')) {
    const warnings = generateWarnings(state);
    if (warnings.length === 0) return 'No active warnings. Your discipline is stable.';
    return warnings.map((w) => `[${w.level.toUpperCase()}] ${w.title}\n${w.message}\nRecommendation: ${w.recommendation}`).join('\n\n');
  }
  if (lower.includes('goal')) {
    const goals = generateGoalSuggestions(state);
    return goals.map((g) => `${g.realistic ? '✓' : '○'} ${g.label}\n   ${g.description}\n   Target: ${g.target}`).join('\n\n');
  }
  if (lower.includes('motivat') || lower.includes('quote')) {
    return getMotivationQuote(state);
  }
  if (lower.includes('task') || lower.includes('todo')) {
    const incomplete = enabledMain.filter((t) => !state.coreCompleted[t.id]);
    if (incomplete.length === 0) return 'All core tasks complete. Your discipline today is recognized.';
    return `Remaining core tasks:\n${incomplete.map((t) => `• ${t.emoji} ${t.label} (+${t.points} XP)`).join('\n')}\n\nComplete these to grow your streak and push toward ${nextRank?.name ?? 'the next rank'}.`;
  }
  if (lower.includes('rank')) {
    return nextRank
      ? `You are ${rank.name} (${rank.emoji}). ${(nextRank.xpRequired - state.xp).toLocaleString()} XP to reach ${nextRank.name} ${nextRank.emoji}. At your current pace (${avgDiscipline}% avg discipline), you are on ${avgDiscipline >= 60 ? 'track' : 'thin ice'}.`
      : `You are ${rank.name} (${rank.emoji}) — the apex rank. There is nothing above. Only maintaining the throne.`;
  }
  if (lower.includes('streak')) {
    return `Current streak: ${state.streak} days. Best: ${state.bestStreak} days. ${state.streak > 0 ? 'The flame is lit — protect it.' : 'The flame is out. Reignite it with a single task today.'}`;
  }
  if (lower.includes('workout') || lower.includes('train')) {
    const totalMin = Math.floor(state.totalWorkoutSeconds / 60);
    return `Workout sessions: ${state.workoutSessions.length}. Total training time: ${totalMin} minutes. Today: ${state.workoutsCompletedToday} session(s). ${state.workoutsCompletedToday === 0 ? 'Your body awaits. Begin.' : 'Training complete. Recover well.'}`;
  }
  if (lower.includes('discipline')) {
    return `Your 7-day average discipline score is ${avgDiscipline}%. ${avgDiscipline >= 70 ? 'Strong — you are building unbreakable habits.' : avgDiscipline >= 40 ? 'Moderate — consistency is your next frontier.' : 'Low — focus on showing up daily, even for one task.'}`;
  }
  if (lower.includes('help')) {
    return `I can help you with:\n• Daily, weekly, and monthly reports\n• Personalized recommendations\n• Performance insights\n• Smart warnings\n• Goal planning\n• Motivation\n\nAsk me about your tasks, rank, streak, workouts, or discipline score.`;
  }

  return `I hear you, ${state.username}. As your System Guide, I track ${state.streak} days of streak, ${state.xp.toLocaleString()} XP, and ${avgDiscipline}% avg discipline. Ask me for a report, recommendations, insights, warnings, or goals — and I will analyze your data.`;
}
