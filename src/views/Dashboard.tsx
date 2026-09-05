import { useStore } from '../store/useStore';
import { getRankByXp, getNextRank } from '../data/ranks';
import { UserAvatar } from '../components/ui/UserAvatar';
import { XpBar } from '../components/ui/XpBar';
import type { ViewId } from '../components/Navigation';
import { Flame, ChevronRight, Target, Check, BookOpen, Dumbbell, Swords, Trophy } from 'lucide-react';
import { ALL_CHAPTERS } from '../data/story';

interface DashboardProps { onNavigate: (v: ViewId) => void; }

function JourneyCard({ onNavigate, storyChapter, storyBossDefeated }: { onNavigate: (v: ViewId) => void; storyChapter: number; storyBossDefeated: Record<string, boolean> }) {
  const chapter = ALL_CHAPTERS[Math.min(storyChapter, ALL_CHAPTERS.length - 1)];
  const bossesDefeated = Object.values(storyBossDefeated).filter(Boolean).length;
  const totalChapters = ALL_CHAPTERS.length;

  return (
    <button onClick={() => onNavigate('story')} className="group card-premium relative w-full overflow-hidden p-5 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-ember-500/25">
      <div className="absolute inset-0 opacity-20 transition-opacity duration-300 group-hover:opacity-30 pointer-events-none" style={{ background: chapter.bgGradient }} />
      <div className="relative flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-black/30 text-3xl" style={{ filter: 'drop-shadow(0 0 14px rgba(167,139,250,.3))' }}>{chapter.emoji}</div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-ember-400"><BookOpen size={13} /> Current Journey</div>
          <h2 className="truncate font-display text-lg font-bold text-ink-100">Chapter {chapter.number}: {chapter.title}</h2>
          <p className="mt-1 truncate text-xs text-ink-400">{chapter.subtitle}</p>
          <div className="mt-2 flex items-center gap-2 text-[11px] text-ink-500"><span>{bossesDefeated}/{totalChapters} bosses defeated</span><span>•</span><span className="font-semibold text-ember-400">Continue</span><ChevronRight size={12} className="text-ember-400 transition-transform group-hover:translate-x-1" /></div>
        </div>
        <div className="hidden shrink-0 text-right sm:block"><div className="text-2xl font-black text-ink-200">{chapter.number}</div><div className="text-[10px] uppercase tracking-wider text-ink-500">of {totalChapters}</div></div>
      </div>
    </button>
  );
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const { state, toggleCoreTask, toggleCustomTask } = useStore();
  const rank = getRankByXp(state.xp);
  const nextRank = getNextRank(state.xp);
  const enabledMainTasks = state.mainTasks.filter((t) => t.enabled);
  const completedCount = enabledMainTasks.filter((t) => state.coreCompleted[t.id]).length;
  const extraCompleted = Object.values(state.customCompleted).filter(Boolean).length;
  const totalTasks = enabledMainTasks.length + state.customTasks.length;
  const totalDone = completedCount + extraCompleted;
  const dailyPct = state.dailyCap > 0 ? Math.min(100, (state.dailyXp / state.dailyCap) * 100) : 0;

  return (
    <div className="space-y-5 sm:space-y-6">
      <section className="card-premium relative overflow-hidden p-5 sm:p-7">
        <div className="pointer-events-none absolute inset-0 opacity-25" style={{ background: `radial-gradient(circle at 15% 0%, ${rank.glow}, transparent 55%)` }} />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center">
          <div className="flex min-w-0 items-center gap-4 sm:gap-5">
            <UserAvatar avatar={state.avatar} rank={rank} size="xl" />
            <div className="min-w-0">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.22em] text-ember-400">Welcome back, Hunter</p>
              <h1 className="truncate font-display text-2xl font-black sm:text-3xl" style={{ color: state.nameColor, textShadow: `0 0 20px ${rank.glow}40` }}>{state.username}</h1>
              <p className="mt-1 text-sm text-ink-300">{rank.name} <span className="text-ink-600">•</span> Level {state.level}</p>
            </div>
          </div>
          <div className="w-full lg:ml-auto lg:max-w-md">
            <XpBar xp={state.xp} />
            {nextRank && <p className="mt-2 text-center text-[11px] text-ink-500"><span className="font-semibold text-ember-400">{(nextRank.xpRequired - state.xp).toLocaleString()}</span> XP to {nextRank.name}</p>}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={<Trophy size={18} />} label="Rank" value={rank.name} />
        <StatCard icon={<Target size={18} />} label="Level" value={String(state.level)} />
        <StatCard icon={<Flame size={18} />} label="Streak" value={`${state.streak} days`} />
        <StatCard icon={<Check size={18} />} label="Today" value={`${totalDone}/${totalTasks}`} />
      </section>

      <section className="card-premium p-5 sm:p-6">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-ember-400">Daily Mission</p><h2 className="mt-1 section-title">Today’s Progress</h2></div>
          <span className="text-sm font-bold tabular-nums text-ink-200">{Math.round(dailyPct)}%</span>
        </div>
        <div className="relative h-3 overflow-hidden rounded-full border border-white/5 bg-ink-950">
          <div className="h-full rounded-full bg-gradient-to-r from-ember-500 to-gold-500 transition-all duration-700 progress-glow" style={{ width: `${dailyPct}%` }} />
        </div>
        <div className="mt-3 flex justify-between text-xs text-ink-500"><span>{state.dailyXp.toLocaleString()} / {state.dailyCap.toLocaleString()} XP</span><span>{completedCount}/{enabledMainTasks.length} core objectives</span></div>
      </section>

      <JourneyCard onNavigate={onNavigate} storyChapter={state.storyChapter} storyBossDefeated={state.storyBossDefeated} />

      <section className="card-premium p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-ember-400">Objectives</p><h2 className="mt-1 section-title">Today’s Objectives</h2></div>
          <button onClick={() => onNavigate('tasks')} className="btn-ghost btn-sheen text-sm">View all <ChevronRight size={15} /></button>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {enabledMainTasks.slice(0, 6).map((task, i) => <TaskCard key={task.id} emoji={task.emoji} label={task.label} points={task.points} done={!!state.coreCompleted[task.id]} onClick={() => toggleCoreTask(task.id)} index={i} />)}
          {state.customTasks.slice(0, Math.max(0, 6 - enabledMainTasks.length)).map((task, i) => <TaskCard key={task.id} emoji={task.emoji} label={task.label} points={task.points} done={!!state.customCompleted[task.id]} onClick={() => toggleCustomTask(task.id)} index={i + enabledMainTasks.length} />)}
          {totalTasks === 0 && <div className="col-span-full py-8 text-center text-sm text-ink-500">No objectives configured yet.</div>}
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <QuickAction icon={<Dumbbell size={19} />} label="Training" description="Enter workout" onClick={() => onNavigate('workout')} />
        <QuickAction icon={<Swords size={19} />} label="Dungeons" description="Face a challenge" onClick={() => onNavigate('dungeons')} />
        <QuickAction icon={<Trophy size={19} />} label="Leaderboard" description="Check your rank" onClick={() => onNavigate('leaderboard')} />
      </section>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="card-premium flex min-w-0 items-center gap-3 p-3.5 sm:p-4"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-ember-500/15 bg-ember-500/10 text-ember-400">{icon}</div><div className="min-w-0"><p className="text-[10px] uppercase tracking-wider text-ink-500">{label}</p><p className="truncate text-sm font-bold text-ink-100 sm:text-base">{value}</p></div></div>;
}

function QuickAction({ icon, label, description, onClick }: { icon: React.ReactNode; label: string; description: string; onClick: () => void }) {
  return <button onClick={onClick} className="group card-premium flex items-center gap-3 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-ember-500/20"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-ember-400 transition-colors group-hover:bg-ember-500/10">{icon}</div><div className="min-w-0"><p className="text-sm font-bold text-ink-100">{label}</p><p className="text-xs text-ink-500">{description}</p></div><ChevronRight size={15} className="ml-auto shrink-0 text-ink-600 transition-transform group-hover:translate-x-1 group-hover:text-ember-400" /></button>;
}

function TaskCard({ emoji, label, points, done, onClick, index }: { emoji: string; label: string; points: number; done: boolean; onClick: () => void; index: number }) {
  return <button onClick={onClick} className={`page-enter rounded-xl border p-3 text-left transition-all duration-200 ${done ? 'border-emerald2-500/30 bg-emerald2-500/10' : 'border-white/5 bg-ink-950/40 hover:border-ember-500/20 hover:bg-white/[0.03]'}`} style={{ animationDelay: `${index * 0.025}s` }}><div className="flex items-center gap-3"><span className={`text-lg ${done ? 'opacity-50' : ''}`}>{done ? '✓' : emoji}</span><div className="min-w-0 flex-1"><p className={`truncate text-sm font-medium ${done ? 'text-ink-400 line-through' : 'text-ink-100'}`}>{label}</p><p className="text-[11px] text-ink-500">+{points} XP</p></div><Check size={15} className={done ? 'text-emerald2-400' : 'text-ink-700'} /></div></button>;
}
