import { useEffect, useRef, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { getRankByXp, getNextRank } from '../data/ranks';
import { RankBadge } from '../components/ui/RankBadge';
import { XpBar } from '../components/ui/XpBar';
import { DisciplineLineChart, buildDisciplineData } from '../components/ui/DisciplineLineChart';
import { DailyRewards } from '../components/ui/DailyRewards';
import { getAuraById } from '../data/collections';
import { triggerConfetti } from '../components/ui/Confetti';
import type { ViewId } from '../components/Navigation';
import { Flame, Coins, Zap, ChevronRight, Dumbbell, TrendingUp, Target, Check, BookOpen, Star } from 'lucide-react';
import { ALL_CHAPTERS } from '../data/story';

interface DashboardProps {
  onNavigate: (v: ViewId) => void;
}

function StoryModeHero({ onNavigate, storyChapter, storyBossDefeated }: { onNavigate: (v: ViewId) => void; storyChapter: number; storyBossDefeated: Record<string, boolean> }) {
  const chapter = ALL_CHAPTERS[Math.min(storyChapter, ALL_CHAPTERS.length - 1)];
  const bossesDefeated = Object.values(storyBossDefeated).filter(Boolean).length;
  const totalChapters = ALL_CHAPTERS.length;

  return (
    <div
      className="card-premium p-5 md:p-6 page-enter relative overflow-hidden cursor-pointer group"
      onClick={() => onNavigate('story')}
      style={{ animationDelay: '0.03s' }}
    >
      <div
        className="absolute inset-0 opacity-20 pointer-events-none transition-opacity group-hover:opacity-30"
        style={{ background: chapter.bgGradient }}
      />
      <div className="relative flex items-center gap-4">
        <div className="text-4xl md:text-5xl flex-shrink-0" style={{ filter: `drop-shadow(0 0 15px rgba(167,139,250,0.4))` }}>
          {chapter.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <BookOpen size={14} className="text-ember-400" />
            <span className="text-xs uppercase tracking-wider text-ember-400 font-bold">Story Mode</span>
          </div>
          <h3 className="font-display text-lg md:text-xl font-bold text-ink-100 truncate">
            Chapter {chapter.number}: {chapter.title}
          </h3>
          <p className="text-xs text-ink-300 mt-0.5 line-clamp-1">{chapter.subtitle}</p>
          <div className="flex items-center gap-3 mt-2 text-xs">
            <span className="text-ink-400">{bossesDefeated}/{totalChapters} bosses defeated</span>
            <span className="text-ink-500">·</span>
            <span className="text-ember-400 font-medium flex items-center gap-1">
              Continue <ChevronRight size={12} />
            </span>
          </div>
        </div>
        <div className="hidden md:flex flex-col items-center gap-1">
          <Star size={20} className="text-gold-400" />
          <span className="text-xs text-gold-400 font-bold">{chapter.number}/{totalChapters}</span>
        </div>
      </div>
    </div>
  );
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const { state, toggleCoreTask, toggleCustomTask } = useStore();
  const rank = getRankByXp(state.xp);
  const nextRank = getNextRank(state.xp);
  const aura = state.equipped.aura ? getAuraById(state.equipped.aura) : null;
  const enabledMainTasks = state.mainTasks.filter((t) => t.enabled);
  const completedCount = enabledMainTasks.filter((t) => state.coreCompleted[t.id]).length;
  const allDone = enabledMainTasks.length > 0 && completedCount === enabledMainTasks.length;
  const prevAllDone = useRef(false);

  const extraCompleted = Object.values(state.customCompleted).filter(Boolean).length;
  const totalTasks = enabledMainTasks.length + state.customTasks.length;
  const totalDone = completedCount + extraCompleted;
  const dailyPct = state.dailyCap > 0 ? Math.min(100, (state.dailyXp / state.dailyCap) * 100) : 0;
  const disciplineScore = totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0;

  useEffect(() => {
    if (allDone && !prevAllDone.current) {
      triggerConfetti(60);
    }
    prevAllDone.current = allDone;
  }, [allDone]);

  const disciplineData = useMemo(() => buildDisciplineData(state.history, 30), [state.history]);
  const todayWorkoutSeconds = useMemo(() => state.workoutSessions
    .filter((s) => new Date(s.completedAt).toISOString().slice(0, 10) === new Date().toISOString().slice(0, 10))
    .reduce((acc, s) => acc + s.durationSeconds, 0), [state.workoutSessions]);
  const todayWorkoutMin = Math.floor(todayWorkoutSeconds / 60);

  return (
    <div className="space-y-6">
      {/* Welcome / Hero header */}
      <div className="card-premium p-6 md:p-8 page-enter">
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{ background: `radial-gradient(circle at 30% 0%, ${rank.glow}, transparent 60%)` }}
        />
        <div className="relative flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex items-center gap-5">
            <RankBadge rank={rank} size="xl" auraColor={aura?.color} />
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h1 className="font-display text-2xl md:text-4xl font-bold" style={{ color: state.nameColor, textShadow: `0 0 20px ${rank.glow}40` }}>
                  {state.username}
                </h1>
                {state.equipped.title && (
                  <span className="chip bg-gold-500/15 text-gold-400 border border-gold-500/30">
                    {state.equipped.title.replace(/_/g, ' ')}
                  </span>
                )}
              </div>
              <p className="text-ink-300 text-sm">
                {rank.emoji} {rank.name} · Level {state.level}
              </p>
              <p className="text-xs text-ink-400 mt-1 italic">{rank.description}</p>
            </div>
          </div>
          <div className="flex-1 md:max-w-md md:ml-auto">
            <XpBar xp={state.xp} />
            {nextRank && (
              <p className="text-xs text-ink-300 mt-2 text-center">
                <span className="text-ember-400 font-semibold">{(nextRank.xpRequired - state.xp).toLocaleString()}</span> XP to {nextRank.name} {nextRank.emoji}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Coins & Streak compact cards */}
      <div className="grid grid-cols-2 gap-3 page-enter">
        <div className="card-premium p-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gold-500/15 flex items-center justify-center flex-shrink-0">
            <Coins size={20} className="text-gold-400" />
          </div>
          <div className="min-w-0">
            <p className="text-lg font-bold tabular-nums text-gold-400">{state.coins.toLocaleString()}</p>
            <p className="text-xs text-ink-300">Coins</p>
          </div>
        </div>
        <div className="card-premium p-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-ember-500/15 flex items-center justify-center flex-shrink-0">
            <Flame size={20} className="text-ember-400" />
          </div>
          <div className="min-w-0">
            <p className="text-lg font-bold tabular-nums text-ember-400">{state.streak} <span className="text-sm text-ink-400">days</span></p>
            <p className="text-xs text-ink-300">Daily Streak</p>
          </div>
        </div>
      </div>

      {/* Daily Rewards */}
      <DailyRewards />

      {/* Story Mode Hero */}
      <StoryModeHero onNavigate={onNavigate} storyChapter={state.storyChapter} storyBossDefeated={state.storyBossDefeated} />

      {/* Daily Progress */}
      <div className="card-premium p-5 page-enter" style={{ animationDelay: '0.05s' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target size={18} className="text-ember-400" />
            <h2 className="section-title">Today's Progress</h2>
          </div>
          <span className="text-sm text-ink-300 tabular-nums">
            {totalDone}/{totalTasks} tasks · {disciplineScore}% discipline
          </span>
        </div>
        <div className="h-3 bg-ink-950 rounded-full overflow-hidden mb-3 border border-white/5 relative">
          <div
            className="h-full bg-gradient-to-r from-ember-500 to-gold-500 rounded-full transition-all duration-700 ease-out progress-glow"
            style={{ width: `${dailyPct}%`, ['--progress-color' as any]: '#ff7a18' }}
          />
          <div className="absolute inset-x-0 top-0 h-1/2 rounded-full pointer-events-none" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.15), transparent)' }} />
        </div>
        <div className="flex items-center justify-between text-xs text-ink-300">
          <span>Daily XP: {state.dailyXp.toLocaleString()} / {state.dailyCap.toLocaleString()}</span>
          <span>Discipline Score: <span className="text-ember-400 font-bold">{disciplineScore}%</span></span>
        </div>
      </div>

      {/* Main Tasks */}
      <div className="card-premium p-5 page-enter" style={{ animationDelay: '0.1s' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="section-title">Main Tasks</h2>
            <p className="text-xs text-ink-300 mt-0.5">{completedCount}/{enabledMainTasks.length} complete · {allDone ? 'Perfect day!' : 'Keep going'}</p>
          </div>
          <button onClick={() => onNavigate('tasks')} className="btn-ghost btn-sheen text-sm">
            All Tasks <ChevronRight size={16} />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {enabledMainTasks.map((task, i) => (
            <TaskCard
              key={task.id}
              emoji={task.emoji}
              label={task.label}
              points={task.points}
              done={!!state.coreCompleted[task.id]}
              onClick={() => toggleCoreTask(task.id)}
              index={i}
            />
          ))}
        </div>
      </div>

      {/* Extra Tasks */}
      <div className="card-premium p-5 page-enter" style={{ animationDelay: '0.15s' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="section-title">Extra Tasks</h2>
            <p className="text-xs text-ink-300 mt-0.5">{extraCompleted}/{state.customTasks.length} complete · Bonus XP</p>
          </div>
          <button onClick={() => onNavigate('tasks')} className="btn-ghost btn-sheen text-sm">
            Manage <ChevronRight size={16} />
          </button>
        </div>
        {state.customTasks.length === 0 ? (
          <div className="text-center py-6 text-ink-400">
            <p className="text-sm">No extra tasks yet.</p>
            <button onClick={() => onNavigate('tasks')} className="btn-ghost btn-sheen mt-3 text-sm">
              Add your first extra task
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {state.customTasks.slice(0, 6).map((task, i) => (
              <TaskCard
                key={task.id}
                emoji={task.emoji}
                label={task.label}
                points={task.points}
                done={!!state.customCompleted[task.id]}
                onClick={() => toggleCustomTask(task.id)}
                index={i}
              />
            ))}
          </div>
        )}
      </div>

      {/* Stats: Level, Rank, XP */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard icon={Zap} label="Level" value={`${state.level}`} sub="Current" color="ember" index={0} />
        <StatCard icon={TrendingUp} label="Rank" value={rank.name} sub={rank.emoji} color="shadow" index={1} />
        <StatCard icon={Zap} label="XP" value={state.xp.toLocaleString()} sub={`/${nextRank ? nextRank.xpRequired.toLocaleString() : 'MAX'}`} color="frost" index={2} />
      </div>

      {/* Discipline Graph */}
      <div className="card-premium p-5 page-enter" style={{ animationDelay: '0.2s' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-ember-400" />
            <h2 className="section-title">Discipline Graph</h2>
          </div>
          <button onClick={() => onNavigate('leaderboard')} className="btn-ghost btn-sheen text-sm">
            Leaderboard <ChevronRight size={16} />
          </button>
        </div>
        <p className="text-xs text-ink-300 mb-3">Last 30 days · Based on Main + Extra tasks completed</p>
        <DisciplineLineChart data={disciplineData} height={200} />
      </div>

      {/* Workout Summary */}
      <div className="card-premium p-5 page-enter" style={{ animationDelay: '0.25s' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Dumbbell size={18} className="text-ember-400" />
            <h2 className="section-title">Workout Summary</h2>
          </div>
          <button onClick={() => onNavigate('workout')} className="btn-ghost btn-sheen text-sm">
            Train <ChevronRight size={16} />
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <WorkoutStat label="Today" value={`${todayWorkoutMin}`} unit="min" color="#ff7a18" />
          <WorkoutStat label="All-time" value={`${Math.floor(state.totalWorkoutSeconds / 60)}`} unit="min" color="#fbbf24" />
          <WorkoutStat label="Sessions" value={`${state.workoutSessions.length}`} unit="" color="#38bdf8" />
          <WorkoutStat label="Streak" value={`${state.streak}`} unit="🔥" color="#a78bfa" />
        </div>
      </div>
    </div>
  );
}

function TaskCard({ emoji, label, points, done, onClick, index }: { emoji: string; label: string; points: number; done: boolean; onClick: () => void; index: number }) {
  return (
    <button
      onClick={onClick}
      className={`stagger-in flex items-center gap-3 p-3 rounded-xl border transition-all text-left group ${
        done
          ? 'bg-emerald2-500/10 border-emerald2-500/40'
          : 'bg-ink-950/40 border-white/5 hover:border-ember-500/30 hover:bg-ink-800/60 hover:-translate-y-0.5'
      }`}
      style={{ animationDelay: `${index * 0.03}s` }}
    >
      <span className={`text-2xl transition-transform duration-300 ${done ? 'scale-110' : 'grayscale opacity-70 group-hover:opacity-90'}`}>{emoji}</span>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate transition-colors ${done ? 'text-emerald2-400 line-through' : ''}`}>{label}</p>
        <p className="text-xs text-ink-400">+{points} XP</p>
      </div>
      <div
        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
          done ? 'bg-emerald2-500 border-emerald2-500' : 'border-ink-500 group-hover:border-ember-500/50'
        }`}
      >
        {done && <Check size={12} className="text-white check-pop" />}
      </div>
    </button>
  );
}

function WorkoutStat({ label, value, unit, color }: { label: string; value: string; unit: string; color: string }) {
  return (
    <div className="p-3 rounded-xl bg-ink-950/40 border border-white/5 hover:border-white/10 transition-colors">
      <p className="text-2xl font-bold tabular-nums" style={{ color }}>
        {value}<span className="text-sm text-ink-400">{unit}</span>
      </p>
      <p className="text-xs text-ink-300">{label}</p>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, color, index }: { icon: typeof Flame; label: string; value: string; sub: string; color: string; index: number }) {
  const colors: Record<string, string> = {
    ember: 'text-ember-400 bg-ember-500/10',
    gold: 'text-gold-400 bg-gold-500/10',
    frost: 'text-frost-400 bg-frost-500/10',
    shadow: 'text-shadow-400 bg-shadow-500/10',
  };
  return (
    <div className="card-premium p-4 stagger-in" style={{ animationDelay: `${index * 0.05}s` }}>
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2 ${colors[color]}`}>
        <Icon size={18} />
      </div>
      <p className="text-xl font-bold tabular-nums truncate">{value}</p>
      <p className="text-xs text-ink-300">{label}</p>
      <p className="text-xs text-ink-400 mt-0.5">{sub}</p>
    </div>
  );
}
