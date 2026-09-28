import { lazy, Suspense } from 'react';
import type { ViewId } from '../components/Navigation';
import { useStore } from '../store/useStore';
import { getRankByXp, getNextRank } from '../data/ranks';
import { UserAvatar } from '../components/ui/UserAvatar';
import { XpBar } from '../components/ui/XpBar';
import { Activity, Dumbbell, Settings, Target } from 'lucide-react';

const Tasks = lazy(() => import('./Tasks').then(m => ({ default: m.Tasks })));

interface DashboardProps { onNavigate: (v: ViewId) => void; }

export function Dashboard({ onNavigate }: DashboardProps) {
  const { state } = useStore();
  const rank = getRankByXp(state.xp);
  const nextRank = getNextRank(state.xp);
  const activeTasks = state.mainTasks.filter(t => t.enabled);
  const mainDone = activeTasks.filter(t => state.coreCompleted[t.id]).length;
  const bonusDone = state.customTasks.filter(t => state.customCompleted[t.id]).length;
  const totalTasks = activeTasks.length + state.customTasks.length;
  const totalDone = mainDone + bonusDone;
  const progress = totalTasks ? Math.round((totalDone / totalTasks) * 100) : 0;

  return <div className="space-y-5 pb-10">
    <section className="relative overflow-hidden rounded-[26px] border border-white/10 bg-[#080808] p-5 sm:p-7 lg:p-8">
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full blur-3xl opacity-20" style={{ background: rank.glow }} />
      <div className="relative grid gap-7 lg:grid-cols-[1.2fr_.8fr] lg:items-end">
        <div className="flex min-w-0 items-center gap-4 sm:gap-5">
          <UserAvatar avatar={state.avatar} rank={rank} size="lg" />
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-2 text-[9px] font-black uppercase tracking-[.28em] text-ember-400"><Activity size={12}/> System active</div>
            <h1 className="truncate font-display text-2xl font-black uppercase sm:text-4xl" style={{ color: state.nameColor }}>{state.username}</h1>
            <p className="mt-1 text-xs text-ink-400">{rank.name} · Level {state.level} · {state.streak} day streak</p>
          </div>
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-[.18em] text-ink-500"><span>XP progression</span><span className="text-ink-200">{state.xp.toLocaleString()} XP</span></div>
          <XpBar xp={state.xp} />
          {nextRank && <p className="mt-2 text-[11px] text-ink-500"><b className="text-ember-400">{(nextRank.xpRequired - state.xp).toLocaleString()}</b> XP to {nextRank.name}</p>}
        </div>
      </div>
    </section>

    <section className="grid gap-2 sm:grid-cols-3">
      <SystemStat label="Today's missions" value={`${totalDone}/${totalTasks}`} />
      <SystemStat label="Mission progress" value={`${progress}%`} />
      <SystemStat label="XP today" value={state.dailyXp.toLocaleString()} />
    </section>

    <section className="rounded-[22px] border border-white/10 bg-[#090909] p-4 sm:p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><p className="text-[9px] font-black uppercase tracking-[.3em] text-ember-400">Command center</p><h2 className="mt-1 font-display text-xl font-black uppercase sm:text-2xl">Today's focus</h2></div>
        <div className="flex gap-2">
          <button onClick={() => onNavigate('workout')} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.03] px-3 py-2 text-xs font-bold text-ink-200 transition hover:border-ember-500/30 hover:text-ember-400"><Dumbbell size={14}/> Training</button>
          <button onClick={() => onNavigate('profile')} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.03] px-3 py-2 text-xs font-bold text-ink-200 transition hover:border-ember-500/30 hover:text-ember-400"><Target size={14}/> Profile</button>
        </div>
      </div>
      <Suspense fallback={<div className="py-12 text-center text-sm text-ink-500">Loading missions…</div>}><Tasks /></Suspense>
    </section>

    <button onClick={() => onNavigate('settings')} className="mx-auto flex items-center gap-2 text-[9px] font-bold uppercase tracking-[.22em] text-ink-600 transition hover:text-ink-300"><Settings size={12}/> System settings</button>
  </div>;
}

function SystemStat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-white/10 bg-[#090909] px-4 py-3"><p className="text-[9px] font-bold uppercase tracking-[.18em] text-ink-600">{label}</p><p className="mt-1 font-display text-lg font-black text-ink-100">{value}</p></div>;
}
