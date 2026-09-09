import { useMemo } from 'react';
import { Eye, Lock, Map, Sparkles, Zap } from 'lucide-react';
import { useStore } from '../store/useStore';

type Props = { compact?: boolean };

export function WorldSystemsPanel({ compact = false }: Props) {
  const { state } = useStore();
  const completed = Math.max(0, Math.min(30, Number(state.storyChapter) || 0));
  const discipline = useMemo(() => {
    const tasks = state.mainTasks.filter(t => t.enabled);
    if (!tasks.length) return 0;
    return Math.round(tasks.filter(t => Boolean(state.coreCompleted[t.id])).length / tasks.length * 100);
  }, [state.mainTasks, state.coreCompleted]);
  const activity = Math.min(100, Math.round((discipline * 0.55) + (Math.min(state.streak, 30) / 30 * 45)));
  const regionState = completed >= 30 ? 'MASTERED' : completed >= 20 ? 'RESTORED' : completed >= 10 ? 'ACTIVE' : completed >= 1 ? 'DISCOVERED' : 'LOCKED';
  const decay = state.lastActiveDate && state.lastActiveDate !== new Date().toISOString().slice(0, 10) && state.streak === 0;
  const secretUnlocked = state.streak >= 7 && discipline >= 90 && completed >= 3;
  const simulation = [
    Math.min(100, activity + 8),
    Math.min(100, activity + 16),
    Math.min(100, activity + 24),
  ];

  return <section className={`rounded-[1.5rem] border border-white/10 bg-black/25 text-white ${compact ? 'p-4' : 'p-5 sm:p-6'}`}>
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.32em] text-amber-100/45"><Map size={12}/> Living World</div>
        <h2 className="mt-1 text-xl font-black">The Shattered Realm</h2>
      </div>
      <span className="rounded-lg border border-white/10 bg-white/[.04] px-2.5 py-1 text-[9px] font-black tracking-widest text-white/45">{regionState}</span>
    </div>
    <div className="mt-4 grid gap-2 sm:grid-cols-3">
      <div className="rounded-xl border border-white/5 bg-white/[.025] p-3"><p className="text-[8px] uppercase tracking-widest text-white/25">Territories</p><p className="mt-1 text-lg font-black">{completed}/30</p></div>
      <div className="rounded-xl border border-white/5 bg-white/[.025] p-3"><p className="text-[8px] uppercase tracking-widest text-white/25">World stability</p><p className="mt-1 text-lg font-black">{activity}%</p></div>
      <div className={`rounded-xl border p-3 ${decay ? 'border-red-400/20 bg-red-400/[.04]' : 'border-white/5 bg-white/[.025]'}`}><p className="text-[8px] uppercase tracking-widest text-white/25">Consequence</p><p className="mt-1 text-sm font-black">{decay ? 'DECAY ACTIVE' : 'STABLE'}</p></div>
    </div>
    {!compact && <>
      <div className="mt-5 rounded-xl border border-white/5 bg-white/[.02] p-4">
        <div className="flex items-center gap-2"><Zap size={14}/><b className="text-sm">Consequence Engine</b></div>
        <p className="mt-1 text-xs leading-5 text-white/35">Your real progression changes the world state. Consistency restores territory; inactivity can slow world stability.</p>
      </div>
      <div className="mt-2 rounded-xl border border-white/5 bg-white/[.02] p-4">
        <div className="flex items-center gap-2"><Sparkles size={14}/><b className="text-sm">Future You · Simulation</b></div>
        <div className="mt-3 grid grid-cols-3 gap-2">{simulation.map((value, i) => <div key={i}><div className="flex justify-between text-[8px] uppercase tracking-widest text-white/25"><span>{(i + 1) * 30}D</span><span>{value}%</span></div><div className="mt-1 h-1 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-white" style={{ width: `${value}%` }}/></div></div>)}</div>
      </div>
    </>}
    <div className="mt-2 flex items-center justify-between rounded-xl border border-white/5 bg-white/[.02] p-4">
      <div className="flex items-center gap-2"><Eye size={14}/><div><b className="block text-sm">Unknown System</b><span className="text-[10px] text-white/30">{secretUnlocked ? 'A hidden path has been discovered.' : 'Hidden paths remain sealed.'}</span></div></div>
      {secretUnlocked ? <span className="rounded-lg bg-white px-2.5 py-1 text-[8px] font-black text-black">DISCOVERED</span> : <Lock size={14} className="text-white/25"/>}
    </div>
  </section>;
}
