import { useMemo, useState } from 'react';
import { Check, RotateCcw, Sparkles, Lock } from 'lucide-react';
import { useStore } from '../store/useStore';
import { SKILL_BRANCHES, SKILL_NODES, type SkillBranch } from '../data/skillTree';

function storageKey(username: string) { return `syrox-skill-tree:${username || 'hunter'}`; }
function loadUnlocked(username: string): string[] {
  try {
    const raw = localStorage.getItem(storageKey(username));
    if (!raw) return [];
    const values = JSON.parse(raw);
    if (!Array.isArray(values)) return [];
    return values.filter((id) => { const node = SKILL_NODES.find((n) => n.id === id); return Boolean(node); });
  } catch { return []; }
}

export function getEarnedSkillPoints(state: ReturnType<typeof useStore>['state']): number {
  return state.history.reduce((total, day) => total + Object.values(day.coreCompleted ?? {}).filter(Boolean).length + Object.values(day.customCompleted ?? {}).filter(Boolean).length, 0);
}

export function SkillTree() {
  const { state } = useStore();
  const [unlocked, setUnlocked] = useState<string[]>(() => loadUnlocked(state.username));
  const [message, setMessage] = useState('');
  const earned = getEarnedSkillPoints(state);
  const spent = useMemo(() => unlocked.reduce((sum, id) => sum + (SKILL_NODES.find((node) => node.id === id)?.cost ?? 0), 0), [unlocked]);
  const available = Math.max(0, earned - spent);

  const save = (next: string[]) => { setUnlocked(next); localStorage.setItem(storageKey(state.username), JSON.stringify(next)); };
  const progressFor = (branch: SkillBranch) => {
    let stage = 0;
    while (stage < 500 && unlocked.includes(`${branch}_${stage + 1}`)) stage += 1;
    return stage;
  };
  const unlockNext = (branch: SkillBranch) => {
    const stage = progressFor(branch);
    if (stage >= 500) { setMessage(`${branch} is fully forged.`); return; }
    const next = SKILL_NODES.find((node) => node.branch === branch && node.index === stage + 1)!;
    if (available < next.cost) { setMessage(`You need ${next.cost} Skill Points for ${next.name}.`); return; }
    save([...unlocked, next.id]);
    setMessage(`${next.name} unlocked — next stage costs ${next.cost + 1} SP.`);
  };
  const reset = () => { save([]); setMessage('All skill stages reset. Your earned Skill Points remain available.'); };

  return <section className="space-y-6">
    <div className="relative overflow-hidden rounded-3xl border border-ember-500/20 bg-black/45 p-5 sm:p-7">
      <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-ember-500/10 blur-3xl" />
      <div className="relative flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div><p className="text-[11px] uppercase tracking-[0.3em] text-ember-400">Hunter Development</p><h1 className="mt-1 font-display text-4xl font-black text-white">SKILL TREE</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-ink-300">Ten main skills. One progression button per path. Each click advances exactly one stage, and the next stage costs one more Skill Point.</p></div>
        <div className="flex items-center gap-3"><div className="rounded-2xl border border-ember-500/30 bg-ember-500/10 px-5 py-3 text-center"><div className="text-[10px] uppercase tracking-wider text-ember-300">Available SP</div><div className="text-3xl font-black text-white">{available}</div><div className="text-[10px] text-ink-500">{spent} spent · {earned} earned</div></div><button onClick={reset} className="rounded-xl border border-white/10 bg-white/5 p-3 text-ink-300 hover:bg-white/10" title="Reset skill progression"><RotateCcw size={18} /></button></div>
      </div>
    </div>

    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {SKILL_BRANCHES.map((branch, i) => {
        const stage = progressFor(branch.id);
        const next = stage < 500 ? SKILL_NODES.find((n) => n.branch === branch.id && n.index === stage + 1)! : null;
        const current = stage > 0 ? SKILL_NODES.find((n) => n.branch === branch.id && n.index === stage)! : null;
        const complete = stage >= 500;
        return <div key={branch.id} className="group relative overflow-hidden rounded-2xl border border-white/10 bg-black/35 p-5 transition-all duration-200 hover:border-ember-500/30 hover:-translate-y-0.5" style={{ animationDelay: `${i * 0.03}s` }}>
          <div className="flex items-start gap-3"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-ember-500/20 bg-ember-500/10 text-2xl">{branch.icon}</div><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><h2 className="font-display text-xl font-black text-white">{branch.name}</h2><span className="text-xs font-mono text-ink-500">{stage}/500</span></div><p className="mt-1 text-xs leading-5 text-ink-400">{branch.description}</p></div></div>
          <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full bg-gradient-to-r from-ember-500 to-shadow-500 transition-all duration-300" style={{ width: `${(stage / 500) * 100}%` }} /></div>
          <div className="mt-4 min-h-[78px] rounded-xl border border-white/5 bg-white/[0.02] p-3"><p className="text-[10px] uppercase tracking-wider text-ink-600">{complete ? 'Path Complete' : current ? `Stage ${stage} Active` : 'Stage 1 Ready'}</p><p className="mt-1 text-sm font-semibold text-ink-100">{complete ? 'Every stage has been forged.' : next?.description}</p><p className="mt-1 text-[11px] text-ink-500">{current ? `Last unlocked: ${current.name}` : 'Start the path with your first Skill Point.'}</p></div>
          <button disabled={complete} onClick={() => unlockNext(branch.id)} className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition ${complete ? 'bg-emerald-500/10 text-emerald-300 cursor-default' : 'bg-ember-500/15 text-ember-300 hover:bg-ember-500/25'}`}>{complete ? <><Check size={16} /> 500 / 500 FORGED</> : <><Sparkles size={16} /> FORGE STAGE {stage + 1} · {stage + 1} SP</>}</button>
          {next && available < next.cost && <div className="mt-2 flex items-center justify-center gap-1 text-[10px] text-ink-600"><Lock size={11} /> Need {next.cost - available} more SP</div>}
        </div>;
      })}
    </div>
    {message && <div className="rounded-xl border border-ember-500/20 bg-ember-500/5 px-4 py-3 text-sm text-ember-300">{message}</div>}
  </section>;
}

export default SkillTree;
