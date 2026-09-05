import { useStore } from '../store/useStore';
import { getRankByXp, getNextRank } from '../data/ranks';
import { UserAvatar } from '../components/ui/UserAvatar';
import { XpBar } from '../components/ui/XpBar';
import type { ViewId } from '../components/Navigation';
import { Flame, ChevronRight, Target, Check, BookOpen, Dumbbell, Swords, Trophy, ArrowUpRight } from 'lucide-react';
import { ALL_CHAPTERS } from '../data/story';

interface DashboardProps { onNavigate: (v: ViewId) => void; }

export function Dashboard({ onNavigate }: DashboardProps) {
  const { state, toggleCoreTask, toggleCustomTask } = useStore();
  const rank = getRankByXp(state.xp);
  const nextRank = getNextRank(state.xp);
  const enabledMainTasks = state.mainTasks.filter((t) => t.enabled).sort((a, b) => a.order - b.order);
  const customTasks = state.customTasks;
  const completedCount = enabledMainTasks.filter((t) => state.coreCompleted[t.id]).length;
  const extraCompleted = customTasks.filter((t) => state.customCompleted[t.id]).length;
  const totalTasks = enabledMainTasks.length + customTasks.length;
  const totalDone = completedCount + extraCompleted;
  const dailyPct = state.dailyCap > 0 ? Math.min(100, (state.dailyXp / state.dailyCap) * 100) : 0;
  const chapter = ALL_CHAPTERS[Math.min(state.storyChapter, ALL_CHAPTERS.length - 1)];
  const bossesDefeated = Object.values(state.storyBossDefeated).filter(Boolean).length;
  const allTasks = [
    ...enabledMainTasks.map((task) => ({ ...task, kind: 'core' as const })),
    ...customTasks.map((task) => ({ ...task, kind: 'extra' as const })),
  ];

  return (
    <div className="space-y-6 pb-8">
      <section className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#080808] p-6 sm:p-8 lg:p-10">
        <div className="absolute -right-28 -top-28 h-80 w-80 rounded-full opacity-20 blur-3xl" style={{ background: rank.glow }} />
        <div className="relative grid gap-8 lg:grid-cols-[1.35fr_.65fr] lg:items-end">
          <div>
            <div className="mb-5 flex items-center gap-2 text-[10px] font-black uppercase tracking-[.32em] text-ember-400"><span className="h-px w-8 bg-ember-500" />Command Deck</div>
            <div className="flex items-center gap-5">
              <UserAvatar avatar={state.avatar} rank={rank} size="xl" />
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[.2em] text-ink-500">Hunter identity</p>
                <h1 className="mt-1 truncate font-display text-3xl font-black sm:text-5xl" style={{ color: state.nameColor }}>{state.username}</h1>
                <p className="mt-2 text-sm text-ink-300">{rank.name} <span className="mx-2 text-ink-700">/</span> Level {state.level} <span className="mx-2 text-ink-700">/</span> {state.streak} day streak</p>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 pt-5 lg:border-l lg:border-t-0 lg:pl-8">
            <div className="mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-[.2em] text-ink-500"><span>XP progression</span><span className="text-ink-300">{state.xp.toLocaleString()} XP</span></div>
            <XpBar xp={state.xp} />
            {nextRank && <p className="mt-3 text-xs text-ink-500"><b className="text-ember-400">{(nextRank.xpRequired - state.xp).toLocaleString()}</b> XP until {nextRank.name}</p>}
          </div>
        </div>
      </section>

      <section className="grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-4">
        <StatusCell label="Rank" value={rank.name} icon={<Trophy size={16} />} />
        <StatusCell label="Level" value={String(state.level)} icon={<Target size={16} />} />
        <StatusCell label="Streak" value={`${state.streak} days`} icon={<Flame size={16} />} />
        <StatusCell label="Today" value={`${totalDone}/${totalTasks}`} icon={<Check size={16} />} />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
        <div className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-5 sm:p-6">
          <div className="mb-6 flex items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[.25em] text-ember-400">Daily operation</p><h2 className="mt-1 font-display text-xl font-black uppercase">Mission progress</h2></div><span className="font-display text-3xl font-black tabular-nums">{Math.round(dailyPct)}%</span></div>
          <div className="h-2 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full bg-gradient-to-r from-ember-500 to-gold-500 transition-all duration-700" style={{ width: `${dailyPct}%` }} /></div>
          <div className="mt-4 flex justify-between text-xs text-ink-500"><span>{state.dailyXp.toLocaleString()} / {state.dailyCap.toLocaleString()} XP</span><span>{completedCount} core missions cleared</span></div>
          <button onClick={() => onNavigate('tasks')} className="mt-6 flex w-full items-center justify-between border-t border-white/5 pt-4 text-left text-sm font-bold text-ink-200 hover:text-ember-400">Open mission board <ArrowUpRight size={16} /></button>
        </div>

        <button onClick={() => onNavigate('story')} className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a] p-5 text-left sm:p-6">
          <div className="absolute inset-0 opacity-25 transition-opacity group-hover:opacity-40" style={{ background: chapter.bgGradient }} />
          <div className="relative flex h-full flex-col justify-between">
            <div><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.25em] text-ember-400"><BookOpen size={13} /> Active journey</div><h2 className="mt-3 font-display text-2xl font-black">CH. {chapter.number} — {chapter.title}</h2><p className="mt-1 max-w-md text-xs text-ink-400">{chapter.subtitle}</p></div>
            <div className="mt-8 flex items-end justify-between"><span className="text-xs text-ink-500">{bossesDefeated}/{ALL_CHAPTERS.length} bosses defeated</span><span className="flex items-center gap-1 text-xs font-bold text-ember-400">Continue <ChevronRight size={14} className="transition-transform group-hover:translate-x-1" /></span></div>
          </div>
        </button>
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#090909]">
        <div className="flex flex-col gap-3 border-b border-white/5 p-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.25em] text-ember-400">Live objectives</p><h2 className="mt-1 font-display text-xl font-black uppercase">Today’s missions</h2></div><span className="text-xs text-ink-500">{totalDone} completed / {totalTasks} total</span></div>
        <div className="grid gap-2 p-3 sm:grid-cols-2 lg:grid-cols-3">
          {allTasks.map((task, i) => <MissionRow key={task.id} index={i + 1} kind={task.kind} emoji={task.emoji} label={task.label} xp={task.points} done={task.kind === 'core' ? !!state.coreCompleted[task.id] : !!state.customCompleted[task.id]} onClick={() => task.kind === 'core' ? toggleCoreTask(task.id) : toggleCustomTask(task.id)} />)}
          {allTasks.length === 0 && <div className="col-span-full py-10 text-center text-sm text-ink-500">No missions configured.</div>}
        </div>
      </section>

      <section className="grid gap-2 sm:grid-cols-3">
        <CommandAction icon={<Dumbbell size={18} />} title="Training" text="Enter workout console" onClick={() => onNavigate('workout')} />
        <CommandAction icon={<Swords size={18} />} title="Dungeons" text="Select a challenge" onClick={() => onNavigate('dungeons')} />
        <CommandAction icon={<Trophy size={18} />} title="Rankings" text="View hunter ladder" onClick={() => onNavigate('leaderboard')} />
      </section>
    </div>
  );
}

function StatusCell({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="bg-[#090909] p-4 sm:p-5"><div className="mb-2 flex items-center gap-2 text-ember-400">{icon}<span className="text-[9px] font-bold uppercase tracking-[.2em] text-ink-500">{label}</span></div><p className="truncate font-display text-lg font-black text-ink-100">{value}</p></div>;
}

function MissionRow({ index, kind, emoji, label, xp, done, onClick }: { index: number; kind: 'core' | 'extra'; emoji: string; label: string; xp: number; done: boolean; onClick: () => void }) {
  return <button onClick={onClick} className={`group flex min-w-0 items-center gap-3 rounded-xl border p-3 text-left transition-all ${done ? 'border-emerald2-500/25 bg-emerald2-500/[.07]' : 'border-white/5 bg-black/20 hover:border-ember-500/20 hover:bg-white/[.025]'}`}><span className="w-5 text-center font-mono text-[9px] text-ink-600">{String(index).padStart(2, '0')}</span><span className={`text-lg ${done ? 'opacity-50' : ''}`}>{done ? '✓' : emoji}</span><span className="min-w-0 flex-1"><span className="mb-0.5 flex items-center gap-2"><span className={`block min-w-0 truncate text-sm font-semibold ${done ? 'text-ink-500 line-through' : 'text-ink-100'}`}>{label}</span><span className="shrink-0 text-[8px] font-black uppercase tracking-[.16em] text-ink-600">{kind}</span></span><span className="text-[10px] uppercase tracking-wider text-ink-600">+{xp} XP</span></span><Check size={14} className={done ? 'text-emerald2-400' : 'text-ink-700 group-hover:text-ember-400'} /></button>;
}

function CommandAction({ icon, title, text, onClick }: { icon: React.ReactNode; title: string; text: string; onClick: () => void }) {
  return <button onClick={onClick} className="group flex items-center gap-4 border border-white/5 bg-[#090909] p-4 text-left transition-all hover:border-ember-500/20 hover:bg-white/[.02]"><span className="flex h-10 w-10 shrink-0 items-center justify-center border border-white/10 bg-white/[.02] text-ember-400">{icon}</span><span className="min-w-0"><span className="block font-display text-sm font-black uppercase">{title}</span><span className="text-xs text-ink-500">{text}</span></span><ChevronRight size={15} className="ml-auto text-ink-700 transition-transform group-hover:translate-x-1 group-hover:text-ember-400" /></button>;
}
