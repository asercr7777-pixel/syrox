import { useMemo, useState } from 'react';
import { Activity, Brain, ChevronDown, Flame, Shield, Sparkles, Target, Zap } from 'lucide-react';
import { useStore } from '../store/useStore';
import { ShadowAIV2 } from './ShadowAIV2';

const promptSets = [
  { label: 'Build my plan', text: 'Build me a complete 6 day strength program, bodyweight, 50 minutes.' },
  { label: 'Make it harder', text: 'Make my program harder and more challenging.' },
  { label: 'Jump / dunk', text: 'Build a sports program for vertical jump and dunk, 6 days, bodyweight.' },
  { label: 'Recovery', text: 'Adjust my training for recovery and better movement quality.' },
];

export function ShadowAICinematic() {
  const { state } = useStore();
  const [showIntel, setShowIntel] = useState(true);
  const streak = Number(state.streak ?? 0);
  const level = Number(state.level ?? 1);
  const xp = Number(state.xp ?? 0);
  const todayTasks = Array.isArray(state.tasks) ? state.tasks.filter((task: any) => task.completed).length : 0;
  const totalTasks = Array.isArray(state.tasks) ? state.tasks.length : 0;

  const status = useMemo(() => {
    if (streak >= 14) return { label: 'LOCKED IN', text: 'Your consistency is high. Shadow will prioritize progression.' };
    if (streak >= 7) return { label: 'BUILDING', text: 'Your streak is building. Keep the workload controlled and consistent.' };
    return { label: 'AWAKENING', text: 'Shadow is calibrating around consistency first, then intensity.' };
  }, [streak]);

  return (
    <section className="relative space-y-4 pb-12">
      <div className="pointer-events-none absolute -top-20 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-ember-500/10 blur-3xl" />

      <div className="relative overflow-hidden rounded-[28px] border border-ember-500/20 bg-[radial-gradient(circle_at_78%_20%,rgba(255,90,0,.13),transparent_32%),linear-gradient(145deg,rgba(8,8,12,.98),rgba(18,12,22,.94),rgba(5,5,8,.98))] p-5 shadow-2xl sm:p-7">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.025)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:linear-gradient(to_bottom,black,transparent)]" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-[24px] border border-ember-400/30 bg-black/60 shadow-[0_0_45px_rgba(255,90,0,.12)]">
              <div className="absolute inset-2 rounded-[18px] border border-white/5" />
              <Brain size={34} className="text-ember-300" />
              <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-black bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,.6)]" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[.28em] text-ember-300">
                <Sparkles size={13} /> Shadow AI · {status.label}
              </div>
              <h1 className="mt-1 text-3xl font-black tracking-tight text-white sm:text-4xl">The system that adapts to you.</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">A dedicated training intelligence layer for SYROX. Ask naturally, rebuild the plan, swap movements, or change the difficulty without losing the structure.</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:min-w-[330px]">
            <div className="rounded-2xl border border-white/10 bg-black/35 p-3"><Flame size={16} className="text-ember-400"/><b className="mt-2 block text-lg">{streak}</b><span className="text-[10px] uppercase text-slate-500">Streak</span></div>
            <div className="rounded-2xl border border-white/10 bg-black/35 p-3"><Zap size={16} className="text-amber-300"/><b className="mt-2 block text-lg">{level}</b><span className="text-[10px] uppercase text-slate-500">Level</span></div>
            <div className="rounded-2xl border border-white/10 bg-black/35 p-3"><Activity size={16} className="text-emerald-300"/><b className="mt-2 block text-lg">{todayTasks}/{totalTasks || 0}</b><span className="text-[10px] uppercase text-slate-500">Tasks</span></div>
          </div>
        </div>

        <div className="relative mt-5 flex flex-wrap gap-2">
          {promptSets.map((item) => (
            <button key={item.label} onClick={() => { navigator.clipboard?.writeText(item.text); }} className="rounded-full border border-white/10 bg-white/[.035] px-3 py-2 text-xs font-bold text-slate-300 transition hover:border-ember-500/30 hover:bg-ember-500/10 hover:text-white">
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <button onClick={() => setShowIntel(v => !v)} className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-left">
        <span className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-400"><Shield size={15} className="text-emerald-400"/> Shadow intelligence</span>
        <ChevronDown size={16} className={`text-slate-500 transition ${showIntel ? 'rotate-180' : ''}`} />
      </button>

      {showIntel && (
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-black/25 p-4"><Target size={18} className="text-ember-400"/><b className="mt-2 block text-sm">Context aware</b><p className="mt-1 text-xs leading-5 text-slate-500">Shadow sees your current progression signals and keeps coaching focused on the next useful action.</p></div>
          <div className="rounded-2xl border border-white/10 bg-black/25 p-4"><Activity size={18} className="text-emerald-400"/><b className="mt-2 block text-sm">Load conscious</b><p className="mt-1 text-xs leading-5 text-slate-500">Movement groups, recovery spacing and exercise compatibility stay inside the generated plan.</p></div>
          <div className="rounded-2xl border border-white/10 bg-black/25 p-4"><Zap size={18} className="text-amber-300"/><b className="mt-2 block text-sm">No dead ends</b><p className="mt-1 text-xs leading-5 text-slate-500">Regenerate and smart-swap controls preserve the training role instead of randomly replacing exercises.</p></div>
        </div>
      )}

      <ShadowAIV2 />
    </section>
  );
}
