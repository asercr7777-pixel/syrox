import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  Circle,
  Clock3,
  Dumbbell,
  Flame,
  Target,
  TrendingUp,
  Trophy,
  Zap,
} from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useStore } from '../store/useStore';
import { getRankByXp, getNextRank } from '../data/ranks';
import { AURAS, FRAMES, TITLES } from '../data/collections';
import { DAILY_CHALLENGES } from '../data/tasks';
import { BOSS_CHALLENGES } from '../data/challenges';
import { calculateAverageDiscipline, countTotalCompletedQuests, evaluateRequirement, snapshotFromState } from '../lib/progression';
import { UserAvatar } from '../components/ui/UserAvatar';
import { RankBadge } from '../components/ui/RankBadge';
import { XpBar } from '../components/ui/XpBar';
import { EmptyState } from '../components/ui/EmptyState';
import type { ViewId } from '../components/Navigation';

interface DashboardProps {
  onNavigate: (v: ViewId) => void;
}

type ChartRange = 7 | 14 | 30;

function formatDuration(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds || 0));
  const hrs = Math.floor(safe / 3600);
  const mins = Math.floor((safe % 3600) / 60);
  return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
}

function dateKeyLocal(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const { state, toggleCoreTask, toggleCustomTask } = useStore();
  const [range, setRange] = useState<ChartRange>(14);
  const [refreshSeconds, setRefreshSeconds] = useState(() => {
    const next = new Date();
    next.setHours(24, 0, 0, 0);
    return Math.max(0, Math.floor((next.getTime() - Date.now()) / 1000));
  });

  useEffect(() => {
    const update = () => {
      const next = new Date();
      next.setHours(24, 0, 0, 0);
      setRefreshSeconds(Math.max(0, Math.floor((next.getTime() - Date.now()) / 1000)));
    };
    const timer = window.setInterval(update, 1000);
    update();
    return () => window.clearInterval(timer);
  }, []);

  const rank = getRankByXp(state.xp);
  const nextRank = getNextRank(state.xp);
  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 18 ? 'Good afternoon' : 'Good evening';
  const dateLabel = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(now);
  const refreshCountdown = `${String(Math.floor(refreshSeconds / 3600)).padStart(2, '0')}:${String(
    Math.floor((refreshSeconds % 3600) / 60),
  ).padStart(2, '0')}:${String(refreshSeconds % 60).padStart(2, '0')}`;

  const core = state.mainTasks.filter((t) => t.enabled);
  const missions = [
    ...core.map((task) => ({
      id: task.id,
      label: task.label,
      icon: task.emoji,
      xp: task.points,
      done: Boolean(state.coreCompleted[task.id]),
      custom: false,
    })),
    ...state.customTasks.map((task) => ({
      id: task.id,
      label: task.label,
      icon: '✦',
      xp: task.points,
      done: Boolean(state.customCompleted[task.id]),
      custom: true,
    })),
  ];
  const completedToday = missions.filter((m) => m.done).length;
  const totalQuestsRecorded = countTotalCompletedQuests(state);
  const lastSession = [...state.workoutSessions].sort((a, b) => b.completedAt - a.completedAt)[0];
  const disciplineAverage = calculateAverageDiscipline(state);
  const nextRankProgress = nextRank
    ? Math.max(0, Math.min(100, ((state.xp - rank.xpRequired) / Math.max(1, nextRank.xpRequired - rank.xpRequired)) * 100))
    : 100;

  const equippedTitle = TITLES.find((item) => item.id === state.equipped.title);
  const equippedAura = AURAS.find((item) => item.id === state.equipped.aura);
  const equippedFrame = FRAMES.find((item) => item.id === state.equipped.frame);

  const todayStrKey = dateKeyLocal(now);
  const historyMap = useMemo(() => new Map(state.history.map((d) => [d.date, d])), [state.history]);
  const chartData = useMemo(() => {
    const rows: { label: string; xp: number }[] = [];
    for (let offset = range - 1; offset >= 0; offset--) {
      const d = new Date();
      d.setHours(12, 0, 0, 0);
      d.setDate(d.getDate() - offset);
      const key = dateKeyLocal(d);
      const rec = historyMap.get(key);
      rows.push({
        label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        xp: key === todayStrKey ? state.dailyXp : rec?.xpGained ?? 0,
      });
    }
    return rows;
  }, [range, historyMap, todayStrKey, state.dailyXp]);

  const hasAnyHistory = state.history.length > 0 || state.dailyXp > 0;
  const chartXpSum = chartData.reduce((s, r) => s + r.xp, 0);

  const activeChallenges = DAILY_CHALLENGES.filter((c) => state.dailyChallengeIds.includes(c.id));
  const snap = snapshotFromState(state);
  const nextBossChallenge =
    BOSS_CHALLENGES.find((b) => !state.bossDefeated?.[b.id]) ?? BOSS_CHALLENGES[BOSS_CHALLENGES.length - 1];
  const nextBossEval = evaluateRequirement(nextBossChallenge.requirement, snap);

  const recentActivity = useMemo(() => {
    const workoutEvents = state.workoutSessions.map((s) => ({
      id: `w-${s.id}`,
      title: `${s.type.toUpperCase()} Training`,
      detail: `${formatDuration(s.durationSeconds)} logged`,
      at: s.completedAt,
      kind: 'training' as const,
    }));
    const dayEvents = state.history.map((h) => ({
      id: `d-${h.date}`,
      title: h.allMainDone ? 'All Main Quests Completed' : 'Daily Activity Saved',
      detail: `${h.date} · +${h.xpGained.toLocaleString()} XP`,
      at: new Date(`${h.date}T20:00:00`).getTime(),
      kind: 'daily' as const,
    }));
    return [...workoutEvents, ...dayEvents].sort((a, b) => b.at - a.at).slice(0, 5);
  }, [state.workoutSessions, state.history]);

  return (
    <div className="space-y-6">
      {/* Hunter Command Center Hero */}
      <section className="sv-surface p-5 sm:p-7">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          <div className="xl:col-span-7 space-y-5">
            <div className="flex flex-wrap items-center gap-4">
              <UserAvatar
                avatar={state.avatar}
                rank={rank}
                size="lg"
                frameColor={equippedFrame?.color}
              />
              <div className="min-w-0 flex-1">
                <p className="eyebrow-label text-frost-400">
                  {greeting} · {dateLabel}
                </p>
                <h1
                  className="mt-1 font-display text-2xl sm:text-3xl font-bold tracking-tight truncate"
                  style={{ color: state.nameColor || undefined }}
                >
                  {state.username || 'Hunter'}
                </h1>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-300">
                  <span className="font-semibold" style={{ color: rank.color }}>
                    {rank.name}
                  </span>
                  <span className="text-ink-600">·</span>
                  <span className="font-mono tabular-nums">Level {state.level}</span>
                  {equippedTitle && (
                    <>
                      <span className="text-ink-600">·</span>
                      <span className="text-ink-200">{equippedTitle.name}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <p className="text-sm text-ink-300 leading-relaxed max-w-2xl">
              Your command center tracks verified daily quests, structured training logs, and long-term consistency.
            </p>

            <div className="flex flex-wrap gap-2.5">
              <button type="button" onClick={() => onNavigate('workout')} className="btn-primary">
                <Dumbbell size={16} />
                <span>Start Training</span>
                <ArrowUpRight size={15} />
              </button>
              <button type="button" onClick={() => onNavigate('quests')} className="btn-ghost">
                <Target size={16} />
                <span>Open Quests</span>
              </button>
              <button type="button" onClick={() => onNavigate('evolution')} className="btn-ghost">
                <TrendingUp size={16} />
                <span>Evolution</span>
              </button>
            </div>
          </div>

          <div className="xl:col-span-5 glass-soft p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <span className="eyebrow-label">Total Progression</span>
                <p className="mt-1 font-display text-2xl sm:text-3xl font-bold tabular-nums text-ink-100">
                  {state.xp.toLocaleString()} <span className="text-sm font-mono text-ink-400">XP</span>
                </p>
              </div>
              <RankBadge rank={rank} size="md" auraColor={equippedAura?.color} />
            </div>

            <XpBar xp={state.xp} />

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-ink-400">
                  {nextRank ? `Until ${nextRank.name}` : 'Maximum Rank Reached'}
                </span>
                <span className="font-mono font-semibold tabular-nums text-ink-200">
                  {nextRank ? `${Math.max(0, nextRank.xpRequired - state.xp).toLocaleString()} XP (${Math.round(nextRankProgress)}%)` : '100%'}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-ink-950 overflow-hidden border border-white/5">
                <div
                  className="h-full rounded-full bg-ember-500 transition-all duration-500"
                  style={{ width: `${nextRankProgress}%` }}
                />
              </div>
            </div>

            <div className="space-y-1.5 pt-1 border-t border-white/10">
              <div className="flex items-center justify-between text-xs">
                <span className="text-ink-400">Daily XP Cap</span>
                <span className="font-mono font-semibold tabular-nums text-frost-400">
                  {state.dailyXp.toLocaleString()} / 10,000 XP
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-ink-950 overflow-hidden border border-white/5">
                <div
                  className="h-full rounded-full bg-frost-500 transition-all duration-500"
                  style={{ width: `${Math.min(100, (state.dailyXp / 10000) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Primary KPI Metrics */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4" aria-label="Key metrics">
        <MetricCard icon={<Zap size={18} />} label="Total XP" value={state.xp.toLocaleString()} detail={`Level ${state.level}`} />
        <MetricCard
          icon={<CheckCircle2 size={18} />}
          label="Quests Completed"
          value={String(totalQuestsRecorded)}
          detail={`${completedToday}/${missions.length} confirmed today`}
        />
        <MetricCard
          icon={<Dumbbell size={18} />}
          label="Training Sessions"
          value={String(state.workoutSessions.length)}
          detail={`${formatDuration(state.totalWorkoutSeconds)} logged`}
        />
        <MetricCard
          icon={<Flame size={18} />}
          label="Current Streak"
          value={`${state.streak} days`}
          detail={`Best: ${state.bestStreak} days`}
        />
      </section>

      {/* Daily Quests & Training Chamber */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <section className="lg:col-span-7 sv-surface p-5 sm:p-6 flex flex-col gap-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="eyebrow-label text-ember-400">Daily Quests · Resets in {refreshCountdown}</p>
              <h2 className="mt-1 font-display text-xl font-bold text-ink-100">Today&apos;s Mission Board</h2>
              <p className="text-xs text-ink-400 mt-0.5 tabular-nums">
                {completedToday} of {missions.length} quests confirmed today
              </p>
            </div>
            <button type="button" onClick={() => onNavigate('quests')} className="btn-ghost text-xs">
              <span>Manage Quests</span>
              <ArrowUpRight size={14} />
            </button>
          </div>

          <div className="h-2 w-full rounded-full bg-ink-950 overflow-hidden border border-white/5">
            <div
              className="h-full rounded-full bg-ember-500 transition-all duration-300"
              style={{ width: `${missions.length ? (completedToday / missions.length) * 100 : 0}%` }}
            />
          </div>

          {missions.length > 0 ? (
            <div className="space-y-2">
              {missions.slice(0, 5).map((mission) => (
                <div
                  key={mission.id}
                  className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition ${
                    mission.done
                      ? 'border-emerald-500/30 bg-emerald-500/10'
                      : 'border-white/10 bg-ink-950/60 hover:border-white/20'
                  }`}
                >
                  <button
                    type="button"
                    disabled={mission.done}
                    onClick={() => (mission.custom ? toggleCustomTask(mission.id) : toggleCoreTask(mission.id))}
                    aria-label={mission.done ? `${mission.label} completed` : `Complete ${mission.label}`}
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition ${
                      mission.done
                        ? 'text-emerald-400 cursor-default'
                        : 'text-ink-400 hover:bg-white/5 hover:text-ember-400'
                    }`}
                  >
                    {mission.done ? <CheckCircle2 size={21} /> : <Circle size={21} />}
                  </button>
                  <span className="text-lg shrink-0" aria-hidden="true">
                    {mission.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-medium truncate ${mission.done ? 'line-through text-ink-400' : 'text-ink-100'}`}>
                      {mission.label}
                    </p>
                    <p className="text-[11px] font-mono text-ink-400">
                      {mission.custom ? 'Extra Quest' : 'Main Quest'}
                    </p>
                  </div>
                  <span className="font-mono text-xs font-semibold tabular-nums text-ember-400 shrink-0">
                    +{mission.xp} XP
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Target size={20} />}
              title="No active quests"
              description="Create your first daily quest in Quests to begin tracking XP."
              action={
                <button type="button" onClick={() => onNavigate('quests')} className="btn-primary text-xs">
                  Add Quests
                </button>
              }
            />
          )}
        </section>

        <section className="lg:col-span-5 sv-surface p-5 sm:p-6 flex flex-col justify-between gap-4">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="eyebrow-label text-frost-400">Training Overview</p>
                <h2 className="mt-1 font-display text-xl font-bold text-ink-100">Training Chamber</h2>
                <p className="text-xs text-ink-400 mt-0.5">Structured 6-day plans and live workout timer.</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-frost-500/10 border border-frost-500/30 text-frost-400">
                <Dumbbell size={18} />
              </div>
            </div>

            {lastSession ? (
              <div className="glass-soft p-4 flex items-center gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ember-500/15 text-ember-400">
                  <Clock3 size={18} />
                </div>
                <div className="min-w-0">
                  <p className="eyebrow-label">Last Recorded Session</p>
                  <p className="text-sm font-semibold text-ink-100 truncate mt-0.5">
                    {lastSession.type.toUpperCase()} Training
                  </p>
                  <p className="text-xs text-ink-400 tabular-nums mt-0.5">
                    {new Intl.DateTimeFormat(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    }).format(lastSession.completedAt)}{' '}
                    · {formatDuration(lastSession.durationSeconds)}
                  </p>
                </div>
              </div>
            ) : (
              <EmptyState
                icon={<Dumbbell size={20} />}
                title="No training logged yet"
                description="Start a workout timer in Training to log sets, reps, and duration."
              />
            )}

            <div className="grid grid-cols-3 gap-2.5">
              <div className="glass-soft p-3 text-center">
                <span className="eyebrow-label block">Sessions</span>
                <strong className="mt-1 block font-display text-lg font-bold tabular-nums text-ink-100">
                  {state.workoutSessions.length}
                </strong>
              </div>
              <div className="glass-soft p-3 text-center">
                <span className="eyebrow-label block">Duration</span>
                <strong className="mt-1 block font-display text-lg font-bold tabular-nums text-ink-100">
                  {formatDuration(state.totalWorkoutSeconds)}
                </strong>
              </div>
              <div className="glass-soft p-3 text-center">
                <span className="eyebrow-label block">Today</span>
                <strong className="mt-1 block font-display text-sm font-bold text-ink-100">
                  {state.workoutsCompletedToday > 0 ? 'Logged' : 'Pending'}
                </strong>
              </div>
            </div>
          </div>

          <button type="button" onClick={() => onNavigate('workout')} className="btn-primary w-full">
            <Dumbbell size={16} />
            <span>Open Training</span>
            <ArrowUpRight size={15} />
          </button>
        </section>
      </div>

      {/* Weekly Development Graph */}
      <section className="sv-surface p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="eyebrow-label text-ember-400">Progress Trajectory</p>
            <h2 className="mt-1 font-display text-xl font-bold text-ink-100">Weekly Development</h2>
            <p className="text-xs text-ink-400 mt-0.5 tabular-nums">
              {chartXpSum.toLocaleString()} XP recorded across the selected {range}-day window
            </p>
          </div>
          <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-ink-950/90 p-1">
            {([7, 14, 30] as ChartRange[]).map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => setRange(days)}
                className={`min-h-[38px] px-3 rounded-lg font-mono text-xs font-semibold transition ${
                  range === days ? 'bg-ember-500/20 text-ember-400 border border-ember-500/40' : 'text-ink-400 hover:text-ink-100'
                }`}
              >
                {days}D
              </button>
            ))}
          </div>
        </div>

        {hasAnyHistory ? (
          <div className="h-[230px] w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="dashXpFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgb(var(--accent-500))" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="rgb(var(--accent-500))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis width={42} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0d111a',
                    border: '1px solid rgba(255,255,255,0.14)',
                    borderRadius: '12px',
                    color: '#f4f7ff',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="xp"
                  name="XP Earned"
                  stroke="rgb(var(--accent-400))"
                  strokeWidth={2.5}
                  fill="url(#dashXpFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState
            icon={<BarChart3 size={20} />}
            title="No daily history recorded yet"
            description="Complete a quest or workout session today to populate your development curve."
          />
        )}
      </section>

      {/* Attributes, Active Challenges & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <section className="lg:col-span-4 sv-surface p-5 sm:p-6 space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="eyebrow-label text-frost-400">Attribute Summary</p>
              <h2 className="mt-1 font-display text-lg font-bold text-ink-100">Tracked Metrics</h2>
            </div>
            <button type="button" onClick={() => onNavigate('evolution')} className="btn-ghost !min-h-[38px] px-3 text-xs">
              Details
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <AttrTile label="Strength" value={`${state.workoutSessions.length} sessions`} />
            <AttrTile label="Endurance" value={formatDuration(state.totalWorkoutSeconds)} />
            <AttrTile label="Discipline" value={disciplineAverage === null ? 'Not tracked' : `${disciplineAverage}%`} />
            <AttrTile label="Consistency" value={`${state.streak}d streak`} />
            <AttrTile label="Mobility" value="Not tracked" />
            <AttrTile label="Focus" value="Not tracked" />
          </div>
        </section>

        <section className="lg:col-span-4 sv-surface p-5 sm:p-6 flex flex-col justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="eyebrow-label text-gold-400">Active Challenges</p>
                <h2 className="mt-1 font-display text-lg font-bold text-ink-100">Trials &amp; Milestones</h2>
              </div>
              <Trophy size={18} className="text-gold-400 shrink-0" />
            </div>

            <div className="glass-soft p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-ink-100">{nextBossChallenge.title}</span>
                <span className="font-mono text-gold-400 tabular-nums">{nextBossEval.pct}%</span>
              </div>
              <p className="text-xs text-ink-400 line-clamp-2">{nextBossChallenge.description}</p>
              <div className="h-1.5 rounded-full bg-ink-950 overflow-hidden">
                <div className="h-full bg-gold-500 rounded-full" style={{ width: `${nextBossEval.pct}%` }} />
              </div>
            </div>

            <div className="space-y-1.5">
              {activeChallenges.slice(0, 2).map((ch) => {
                const done = Boolean(state.dailyChallengeCompleted[ch.id]);
                const met = ch.check(state);
                return (
                  <div key={ch.id} className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-ink-950/60 px-3 py-2 text-xs">
                    <span className="truncate text-ink-200">{ch.label}</span>
                    <span className={`font-mono shrink-0 ${done ? 'text-emerald-400' : met ? 'text-gold-400' : 'text-ink-400'}`}>
                      {done ? 'Claimed' : met ? 'Ready' : `+${ch.xp} XP`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <button type="button" onClick={() => onNavigate('challenges')} className="btn-ghost w-full text-xs">
            <span>View All Challenges</span>
            <ArrowUpRight size={14} />
          </button>
        </section>

        <section className="lg:col-span-4 sv-surface p-5 sm:p-6 space-y-3">
          <div>
            <p className="eyebrow-label text-ink-400">Recent Activity</p>
            <h2 className="mt-1 font-display text-lg font-bold text-ink-100">Latest Logs</h2>
          </div>

          {recentActivity.length > 0 ? (
            <div className="space-y-2">
              {recentActivity.map((item) => (
                <div key={item.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-ink-950/60 px-3 py-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-frost-400">
                    {item.kind === 'training' ? <Dumbbell size={15} /> : <CheckCircle2 size={15} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-ink-100 truncate">{item.title}</p>
                    <p className="text-[11px] text-ink-400 truncate">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Clock3 size={18} />}
              title="No recent activity"
              description="Saved quests and workouts appear here in chronological order."
            />
          )}
        </section>
      </div>

      {/* Personal Development Summary Bar */}
      <footer className="sv-surface px-4 py-3.5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-ink-300">
        <span className="eyebrow-label text-ember-400">Daily Summary</span>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 tabular-nums">
          <span>
            <strong className="text-ink-100">{completedToday}/{missions.length}</strong> Quests
          </span>
          <span>
            <strong className="text-ink-100">{state.dailyXp.toLocaleString()}</strong> / 10,000 Daily XP
          </span>
          <span>
            <strong className="text-ink-100">{state.workoutsCompletedToday > 0 ? 'Training Logged' : 'Training Pending'}</strong>
          </span>
        </div>
      </footer>
    </div>
  );
}

function MetricCard({ icon, label, value, detail }: { icon: ReactNode; label: string; value: string; detail: string }) {
  return (
    <article className="sv-surface p-4 sm:p-5 flex items-start gap-3.5">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-ember-500/30 bg-ember-500/12 text-ember-400">
        {icon}
      </div>
      <div className="min-w-0">
        <span className="eyebrow-label block">{label}</span>
        <strong className="mt-1 block font-display text-2xl font-bold tabular-nums text-ink-100 truncate">
          {value}
        </strong>
        <p className="mt-0.5 text-xs text-ink-400 truncate">{detail}</p>
      </div>
    </article>
  );
}

function AttrTile({ label, value }: { label: string; value: string }) {
  const untracked = value === 'Not tracked';
  return (
    <div className="glass-soft p-3">
      <span className="eyebrow-label block">{label}</span>
      <strong className={`mt-1 block text-xs font-semibold tabular-nums ${untracked ? 'text-ink-500' : 'text-ink-100'}`}>
        {value}
      </strong>
    </div>
  );
}
