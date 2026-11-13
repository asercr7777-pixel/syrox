import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Award,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Dumbbell,
  Flame,
  GitBranch,
  History,
  Lock,
  Save,
  Shield,
  Target,
  TrendingUp,
  Zap,
} from 'lucide-react';
import type { WorkoutSessionRecord } from '../store/types';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useStore } from '../store/useStore';
import { getRankByXp, getNextRank, RANKS } from '../data/ranks';
import { SKILL_BRANCHES, SKILL_NODES, type SkillNode } from '../data/skillTree';
import {
  calculateAverageDiscipline,
  countFullClearDays,
  countTodayCompletedQuests,
  countTotalCompletedQuests,
  evaluateRequirement,
  snapshotFromState,
} from '../lib/progression';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { toast } from '../components/ui/Toast';

type EvolutionTab = 'analytics' | 'attributes' | 'skills' | 'timeline';
type RangeDays = 7 | 14 | 30;

const dateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const todayKey = () => dateKey(new Date());

function formatDuration(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds || 0));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  return hours ? `${hours}h ${minutes}m` : `${minutes}m`;
}

function prettyDate(value: string): string {
  return new Date(`${value}T12:00:00`).toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

const tooltipStyle = {
  contentStyle: {
    backgroundColor: '#0d111a',
    border: '1px solid rgba(255,255,255,0.14)',
    borderRadius: 12,
    color: '#f4f7ff',
    fontSize: 12,
  },
  labelStyle: { color: '#94a3b8' },
};

export function Evolution() {
  const { state, setNote } = useStore();
  const [tab, setTab] = useState<EvolutionTab>('analytics');
  const [range, setRange] = useState<RangeDays>(14);
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const [noteDraft, setNoteDraft] = useState(() => state.notes[todayKey()] ?? '');
  const [selectedNode, setSelectedNode] = useState<SkillNode>(SKILL_NODES[0]);

  useEffect(() => {
    setNoteDraft(state.notes[selectedDate] ?? '');
  }, [selectedDate, state.notes]);

  const rank = getRankByXp(state.xp);
  const nextRank = getNextRank(state.xp);
  const today = todayKey();
  const snap = snapshotFromState(state);
  const disciplineAvg = calculateAverageDiscipline(state);
  const totalQuests = countTotalCompletedQuests(state);
  const fullClearDays = countFullClearDays(state);
  const todayQuests = countTodayCompletedQuests(state.coreCompleted, state.customCompleted);

  const historyByDate = useMemo(() => new Map(state.history.map((day) => [day.date, day])), [state.history]);
  const sessionsByDate = useMemo(() => {
    const grouped = new Map<string, WorkoutSessionRecord[]>();
    state.workoutSessions.forEach((session) => {
      const key = dateKey(new Date(session.completedAt));
      grouped.set(key, [...(grouped.get(key) ?? []), session]);
    });
    return grouped;
  }, [state.workoutSessions]);

  const chartData = useMemo(() => {
    const rows = [];
    for (let offset = range - 1; offset >= 0; offset--) {
      const date = new Date();
      date.setHours(12, 0, 0, 0);
      date.setDate(date.getDate() - offset);
      const key = dateKey(date);
      const record = historyByDate.get(key);
      const current = key === today;
      const core = current ? state.coreCompleted : record?.coreCompleted ?? {};
      const custom = current ? state.customCompleted : record?.customCompleted ?? {};
      const taskCount = Object.values(core).filter(Boolean).length + Object.values(custom).filter(Boolean).length;
      const sessions = sessionsByDate.get(key) ?? [];
      const fallbackWorkout = !sessions.length && (current ? state.workoutsCompletedToday > 0 : Boolean(record?.workoutCompleted));
      rows.push({
        date: key,
        label: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        xp: current ? state.dailyXp : record?.xpGained ?? 0,
        tasks: taskCount,
        workouts: sessions.length || (fallbackWorkout ? 1 : 0),
        minutes: Math.round(sessions.reduce((sum, session) => sum + session.durationSeconds, 0) / 60),
      });
    }
    return rows;
  }, [range, historyByDate, sessionsByDate, today, state.coreCompleted, state.customCompleted, state.dailyXp, state.workoutsCompletedToday]);

  const selectedRecord = historyByDate.get(selectedDate);
  const isToday = selectedDate === today;
  const selCore = isToday ? state.coreCompleted : selectedRecord?.coreCompleted ?? {};
  const selCustom = isToday ? state.customCompleted : selectedRecord?.customCompleted ?? {};
  const completedCore = state.mainTasks.filter((task) => Boolean(selCore[task.id]));
  const completedCustom = state.customTasks.filter((task) => Boolean(selCustom[task.id]));
  const selectedSessions = sessionsByDate.get(selectedDate) ?? [];
  const fallbackWorkout = selectedSessions.length === 0 && (isToday ? state.workoutsCompletedToday > 0 : Boolean(selectedRecord?.workoutCompleted));
  const selectedWorkoutCount = selectedSessions.length || (fallbackWorkout ? 1 : 0);
  const selectedDuration = selectedSessions.reduce((sum, session) => sum + session.durationSeconds, 0);
  const selectedXp = isToday ? state.dailyXp : selectedRecord?.xpGained ?? 0;
  const selectedTasks = completedCore.length + completedCustom.length;

  const unlockedSkillCount = useMemo(
    () => SKILL_NODES.filter((n) => evaluateRequirement(n.requirement, snap).unlocked).length,
    [snap],
  );

  const timelineEvents = useMemo(() => {
    const workouts = state.workoutSessions.map((s) => ({
      id: `w-${s.id}`,
      at: s.completedAt,
      title: `${s.type.toUpperCase()} Training Logged`,
      detail: `${formatDuration(s.durationSeconds)} completed`,
      kind: 'workout' as const,
    }));
    const days = state.history.map((h) => ({
      id: `d-${h.date}`,
      at: new Date(`${h.date}T21:00:00`).getTime(),
      title: h.allMainDone ? 'Full-Clear Day' : 'Daily Activity Logged',
      detail: `${h.date} · +${h.xpGained.toLocaleString()} XP · ${h.disciplineScore}% discipline`,
      kind: 'day' as const,
    }));
    const honors = state.achievements.map((a) => ({
      id: `a-${a.id}`,
      at: a.unlockedAt,
      title: `Honor Earned: ${a.id.replace(/[_-]/g, ' ')}`,
      detail: new Date(a.unlockedAt).toLocaleDateString(),
      kind: 'honor' as const,
    }));
    return [...workouts, ...days, ...honors].sort((a, b) => b.at - a.at).slice(0, 30);
  }, [state.workoutSessions, state.history, state.achievements]);

  const handleSaveNote = () => {
    setNote(selectedDate, noteDraft.trim());
    toast({ title: 'Daily note saved', message: `Saved note for ${selectedDate}.`, type: 'success' });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Hunter Development"
        title="Evolution"
        description="Unified telemetry across your recorded analytics, real-world attributes, deterministic skill tree, and history timeline."
        right={
          <div className="sv-surface px-4 py-2.5 flex items-center gap-2.5 text-xs font-mono tabular-nums">
            <span style={{ color: rank.color }}>{rank.emoji}</span>
            <span className="font-bold text-ink-100">{rank.name}</span>
            <span className="text-ink-500">·</span>
            <span className="text-ink-300">LVL {state.level}</span>
          </div>
        }
      />

      {/* Module Switcher */}
      <nav
        aria-label="Evolution sections"
        className="grid grid-cols-2 sm:grid-cols-4 gap-2 sv-surface p-1.5"
      >
        {(
          [
            { id: 'analytics', label: 'Progress & Analytics', shortLabel: 'Analytics', icon: Activity },
            { id: 'attributes', label: 'Attributes', shortLabel: 'Attributes', icon: Shield },
            { id: 'skills', label: 'Skill Tree', shortLabel: 'Skill Tree', icon: GitBranch },
            { id: 'timeline', label: 'Evolution Timeline', shortLabel: 'Timeline', icon: History },
          ] as const
        ).map((item) => {
          const Icon = item.icon;
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`flex items-center justify-center sm:justify-start gap-2 rounded-xl px-3 sm:px-3.5 min-h-[44px] text-xs font-bold transition ${
                active ? 'btn-primary !min-h-[44px]' : 'text-ink-400 hover:bg-white/5 hover:text-ink-100'
              }`}
            >
              <Icon size={15} className="shrink-0" />
              <span className="sm:hidden">{item.shortLabel}</span>
              <span className="hidden sm:inline truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* TAB A: Progress & Analytics */}
      {tab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MiniStat icon={<Zap size={17} />} label="XP Today" value={state.dailyXp.toLocaleString()} />
            <MiniStat icon={<Target size={17} />} label="Quests Today" value={String(todayQuests)} />
            <MiniStat
              icon={<Dumbbell size={17} />}
              label="Workouts Today"
              value={String((sessionsByDate.get(today) ?? []).length || state.workoutsCompletedToday)}
            />
            <MiniStat
              icon={<Clock3 size={17} />}
              label="Training Today"
              value={formatDuration((sessionsByDate.get(today) ?? []).reduce((s, x) => s + x.durationSeconds, 0))}
            />
          </div>

          <section className="sv-surface p-5 sm:p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="eyebrow-label text-ember-400">Performance Charts</p>
                <h2 className="mt-1 font-display text-xl font-bold text-ink-100">Activity Timeline</h2>
                <p className="text-xs text-ink-400 mt-0.5">All series reflect saved logs from the selected window.</p>
              </div>
              <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-ink-950/90 p-1">
                {([7, 14, 30] as RangeDays[]).map((days) => (
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="glass-soft p-4 space-y-2">
                <h3 className="font-display text-sm font-bold text-ink-100 flex items-center gap-2">
                  <Zap size={14} className="text-ember-400" /> XP Earned
                </h3>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="evXpFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="rgb(var(--accent-500))" stopOpacity={0.36} />
                          <stop offset="100%" stopColor="rgb(var(--accent-500))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                      <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis width={36} tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip {...tooltipStyle} />
                      <Area type="monotone" dataKey="xp" name="XP" stroke="rgb(var(--accent-400))" strokeWidth={2} fill="url(#evXpFill)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="glass-soft p-4 space-y-2">
                <h3 className="font-display text-sm font-bold text-ink-100 flex items-center gap-2">
                  <Target size={14} className="text-frost-400" /> Quests Completed
                </h3>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <BarChart data={chartData}>
                      <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                      <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis width={30} allowDecimals={false} tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip {...tooltipStyle} />
                      <Bar dataKey="tasks" name="Quests" fill="rgb(var(--frost-400))" radius={[5, 5, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="glass-soft p-4 space-y-2">
                <h3 className="font-display text-sm font-bold text-ink-100 flex items-center gap-2">
                  <Dumbbell size={14} className="text-danger-400" /> Training Sessions
                </h3>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <BarChart data={chartData}>
                      <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                      <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis width={30} allowDecimals={false} tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip {...tooltipStyle} />
                      <Bar dataKey="workouts" name="Sessions" fill="#fb7185" radius={[5, 5, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="glass-soft p-4 space-y-2">
                <h3 className="font-display text-sm font-bold text-ink-100 flex items-center gap-2">
                  <Clock3 size={14} className="text-emerald-400" /> Training Duration (min)
                </h3>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <LineChart data={chartData}>
                      <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                      <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis width={30} tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip {...tooltipStyle} />
                      <Line type="monotone" dataKey="minutes" name="Minutes" stroke="#34d399" strokeWidth={2.5} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </section>

          {/* Daily Inspector & Notes */}
          <section className="sv-surface p-5 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="eyebrow-label text-frost-400 flex items-center gap-1.5">
                  <CalendarDays size={13} /> Daily Log Inspector
                </p>
                <h2 className="mt-1 font-display text-xl font-bold text-ink-100">{prettyDate(selectedDate)}</h2>
              </div>
              <input
                aria-label="Select date to inspect"
                type="date"
                value={selectedDate}
                max={today}
                onChange={(e) => setSelectedDate(e.target.value || today)}
                className="input !w-auto font-mono text-xs"
                style={{ colorScheme: 'dark' }}
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="glass-soft p-3">
                <span className="eyebrow-label">XP Earned</span>
                <strong className="mt-1 block font-display text-lg font-bold tabular-nums text-ink-100">{selectedXp.toLocaleString()}</strong>
              </div>
              <div className="glass-soft p-3">
                <span className="eyebrow-label">Quests</span>
                <strong className="mt-1 block font-display text-lg font-bold tabular-nums text-ink-100">{selectedTasks}</strong>
              </div>
              <div className="glass-soft p-3">
                <span className="eyebrow-label">Workouts</span>
                <strong className="mt-1 block font-display text-lg font-bold tabular-nums text-ink-100">{selectedWorkoutCount}</strong>
              </div>
              <div className="glass-soft p-3">
                <span className="eyebrow-label">Duration</span>
                <strong className="mt-1 block font-display text-lg font-bold tabular-nums text-ink-100">{formatDuration(selectedDuration)}</strong>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-1">
              <div className="glass-soft p-4 space-y-2.5">
                <h3 className="font-display text-sm font-bold text-ink-100">Recorded Quests &amp; Sessions</h3>
                {completedCore.length + completedCustom.length + selectedSessions.length > 0 ? (
                  <div className="space-y-1.5">
                    {[...completedCore, ...completedCustom].map((task) => (
                      <div key={task.id} className="flex items-center gap-2.5 text-xs rounded-lg bg-ink-950/60 px-3 py-2">
                        <span>{task.emoji}</span>
                        <span className="text-ink-100 font-medium truncate">{task.label}</span>
                      </div>
                    ))}
                    {selectedSessions.map((s) => (
                      <div key={s.id} className="flex items-center justify-between gap-2 text-xs rounded-lg bg-ink-950/60 px-3 py-2">
                        <span className="text-ink-100 font-medium">{s.type.toUpperCase()} Training</span>
                        <span className="font-mono text-ink-400 tabular-nums">{formatDuration(s.durationSeconds)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-ink-400 py-3">No activity recorded for this date.</p>
                )}
              </div>

              <div className="glass-soft p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-sm font-bold text-ink-100 flex items-center gap-2">
                    <BookOpen size={15} className="text-frost-400" /> Daily Note
                  </h3>
                  <button type="button" onClick={handleSaveNote} className="btn-primary !min-h-[38px] px-3 text-xs">
                    <Save size={14} />
                    <span>Save Note</span>
                  </button>
                </div>
                <textarea
                  rows={4}
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                  placeholder="Write reflections, training cues, or adjustments for this date…"
                  className="input resize-y min-h-[100px]"
                  maxLength={1000}
                />
              </div>
            </div>
          </section>
        </div>
      )}

      {/* TAB B: Attributes */}
      {tab === 'attributes' && (
        <section className="sv-surface p-5 sm:p-6 space-y-5">
          <div>
            <p className="eyebrow-label text-frost-400">Attribute Register</p>
            <h2 className="mt-1 font-display text-xl font-bold text-ink-100">Tracked &amp; Unmeasured Attributes</h2>
            <p className="text-xs text-ink-400 mt-1">
              Every displayed figure derives strictly from your logged activity. Attributes without dedicated trackers remain clearly marked.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <AttrCard label="Strength" value={`${state.workoutSessions.length} sessions`} note="Verified training count" tracked />
            <AttrCard label="Endurance" value={formatDuration(state.totalWorkoutSeconds)} note="Total timed training" tracked />
            <AttrCard
              label="Discipline"
              value={disciplineAvg === null ? 'Not tracked' : `${disciplineAvg}% avg`}
              note={state.history.length ? `Across ${state.history.length} saved days` : 'No saved daily history yet'}
              tracked={disciplineAvg !== null}
            />
            <AttrCard label="Consistency" value={`${state.streak}d current`} note={`Best streak: ${state.bestStreak} days`} tracked />
            <AttrCard label="Throughput" value={`${totalQuests} quests`} note={`${fullClearDays} full-clear days`} tracked />
            <AttrCard label="Mobility" value="Not tracked" note="No dedicated metric logged" tracked={false} />
            <AttrCard label="Flexibility" value="Not tracked" note="No dedicated metric logged" tracked={false} />
            <AttrCard label="Focus / Learning" value="Not tracked" note="No dedicated metric logged" tracked={false} />
          </div>
        </section>
      )}

      {/* TAB C: Deterministic Skill Tree */}
      {tab === 'skills' && (
        <div className="space-y-5">
          <section className="sv-surface p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="eyebrow-label text-ember-400">Progression Architecture</p>
              <h2 className="mt-1 font-display text-xl font-bold text-ink-100">Skill Tree</h2>
              <p className="text-xs text-ink-400 mt-0.5">
                Skills unlock automatically once verified training, quest, streak, and XP milestones are reached.
              </p>
            </div>
            <div className="glass-soft px-4 py-2.5 text-xs font-mono tabular-nums">
              <strong className="text-ink-100">{unlockedSkillCount}</strong> / {SKILL_NODES.length} Unlocked
            </div>
          </section>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
            <div className="xl:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              {SKILL_BRANCHES.map((branch) => {
                const nodes = SKILL_NODES.filter((n) => n.branch === branch.id).sort((a, b) => a.tier - b.tier);
                return (
                  <div key={branch.id} className="sv-surface p-4 sm:p-5 space-y-3">
                    <div className="border-b border-white/10 pb-3">
                      <h3 className="font-display text-base font-bold text-ink-100" style={{ color: branch.accent }}>
                        {branch.name}
                      </h3>
                      <p className="text-xs text-ink-400 mt-0.5">{branch.subtitle}</p>
                    </div>
                    <div className="space-y-2.5">
                      {nodes.map((node) => {
                        const ev = evaluateRequirement(node.requirement, snap);
                        const isSelected = selectedNode.id === node.id;
                        return (
                          <button
                            key={node.id}
                            type="button"
                            onClick={() => setSelectedNode(node)}
                            className={`w-full text-left rounded-xl border p-3 transition min-h-[56px] ${
                              isSelected
                                ? 'border-ember-400 bg-ember-500/15'
                                : ev.unlocked
                                  ? 'border-emerald-500/35 bg-emerald-500/10 hover:border-emerald-400/60'
                                  : 'border-white/10 bg-ink-950/60 hover:border-white/25'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                {ev.unlocked ? (
                                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                                ) : (
                                  <Lock size={15} className="text-ink-500 shrink-0" />
                                )}
                                <span className="text-sm font-semibold text-ink-100 truncate">{node.name}</span>
                              </div>
                              <span className="font-mono text-[11px] tabular-nums text-ink-400 shrink-0">
                                Tier {node.tier} · {ev.pct}%
                              </span>
                            </div>
                            <div className="mt-2 h-1.5 rounded-full bg-ink-950 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${ev.unlocked ? 'bg-emerald-400' : 'bg-ember-500'}`}
                                style={{ width: `${ev.pct}%` }}
                              />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Node Inspector */}
            <aside className="xl:col-span-4 sv-surface p-5 space-y-4 xl:sticky xl:top-20">
              {(() => {
                const ev = evaluateRequirement(selectedNode.requirement, snap);
                return (
                  <>
                    <div className="flex items-center justify-between gap-2">
                      <span className="eyebrow-label text-frost-400">Tier {selectedNode.tier} Node</span>
                      <span
                        className={`font-mono text-xs font-bold uppercase ${
                          ev.unlocked ? 'text-emerald-400' : 'text-ink-400'
                        }`}
                      >
                        {ev.unlocked ? 'Unlocked' : 'Locked'}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-display text-xl font-bold text-ink-100">{selectedNode.name}</h3>
                      <p className="mt-1.5 text-sm text-ink-300 leading-relaxed">{selectedNode.description}</p>
                    </div>
                    <div className="glass-soft p-3.5 text-xs text-ink-200">
                      <span className="eyebrow-label block text-ember-400 mb-1">Verified Status</span>
                      {selectedNode.benefit}
                    </div>
                    <div className="space-y-2.5 pt-2 border-t border-white/10">
                      <span className="eyebrow-label block">Unlock Thresholds</span>
                      {ev.checks.map((c) => (
                        <div key={c.label} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className={c.met ? 'text-emerald-400 font-medium' : 'text-ink-300'}>{c.label}</span>
                            <span className="font-mono tabular-nums text-ink-200">
                              {c.current.toLocaleString()} / {c.target.toLocaleString()}
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-ink-950 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${c.met ? 'bg-emerald-400' : 'bg-frost-500'}`}
                              style={{ width: `${Math.min(100, Math.round((c.current / Math.max(1, c.target)) * 100))}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                );
              })()}
            </aside>
          </div>
        </div>
      )}

      {/* TAB D: Evolution Timeline */}
      {tab === 'timeline' && (
        <div className="space-y-5">
          <section className="sv-surface p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="eyebrow-label text-gold-400">Rank Trajectory</p>
                <h2 className="mt-1 font-display text-xl font-bold text-ink-100">Hunter Rank Ladder</h2>
              </div>
              <TrendingUp size={19} className="text-gold-400" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2.5">
              {RANKS.slice(0, 10).map((r) => {
                const reached = state.xp >= r.xpRequired;
                const isCurrent = rank.id === r.id;
                return (
                  <div
                    key={r.id}
                    className={`rounded-xl border p-3 transition ${
                      isCurrent
                        ? 'border-ember-400 bg-ember-500/15'
                        : reached
                          ? 'border-white/15 bg-ink-950/75'
                          : 'border-white/5 bg-ink-950/35 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span style={{ color: r.color }} className="text-base">
                        {r.emoji}
                      </span>
                      <span className="font-mono text-[10px] text-ink-400 tabular-nums">
                        {r.xpRequired.toLocaleString()} XP
                      </span>
                    </div>
                    <p className="mt-1.5 font-display text-xs font-bold text-ink-100 truncate">{r.name}</p>
                  </div>
                );
              })}
            </div>
            {nextRank && (
              <p className="text-xs text-ink-400">
                Next rank threshold: <strong className="text-ink-100">{nextRank.name}</strong> at{' '}
                <span className="font-mono tabular-nums">{nextRank.xpRequired.toLocaleString()} XP</span>.
              </p>
            )}
          </section>

          <section className="sv-surface p-5 sm:p-6 space-y-4">
            <div>
              <p className="eyebrow-label text-frost-400">Chronological Log</p>
              <h2 className="mt-1 font-display text-xl font-bold text-ink-100">Recorded History</h2>
              <p className="text-xs text-ink-400 mt-0.5">Real sessions, full-clear days, and earned honors in order.</p>
            </div>

            {timelineEvents.length > 0 ? (
              <div className="space-y-2.5">
                {timelineEvents.map((ev) => (
                  <div key={ev.id} className="glass-soft px-3.5 py-3 flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] text-ember-400">
                      {ev.kind === 'workout' ? (
                        <Dumbbell size={16} />
                      ) : ev.kind === 'honor' ? (
                        <Award size={16} className="text-gold-400" />
                      ) : (
                        <Flame size={16} className="text-frost-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-ink-100 truncate">{ev.title}</p>
                      <p className="text-xs text-ink-400 truncate">{ev.detail}</p>
                    </div>
                    <span className="font-mono text-[11px] tabular-nums text-ink-500 shrink-0">
                      {new Date(ev.at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<History size={20} />}
                title="Timeline is ready"
                description="Your completed workouts, saved days, and earned milestones will appear here chronologically."
              />
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <article className="sv-surface p-3.5 sm:p-4 flex items-center gap-2.5 sm:gap-3">
      <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-ember-500/12 border border-ember-500/30 text-ember-400">
        {icon}
      </div>
      <div className="min-w-0">
        <span className="text-[10px] font-mono uppercase tracking-[0.1em] text-ink-400 leading-tight block">{label}</span>
        <strong className="mt-0.5 block font-display text-lg sm:text-xl font-bold tabular-nums text-ink-100">
          {value}
        </strong>
      </div>
    </article>
  );
}

function AttrCard({ label, value, note, tracked }: { label: string; value: string; note: string; tracked: boolean }) {
  return (
    <article className="glass-soft p-4 space-y-1.5">
      <span className="eyebrow-label block">{label}</span>
      <strong className={`block font-display text-lg font-bold tabular-nums ${tracked ? 'text-ink-100' : 'text-ink-500'}`}>
        {value}
      </strong>
      <p className="text-xs text-ink-400">{note}</p>
    </article>
  );
}
