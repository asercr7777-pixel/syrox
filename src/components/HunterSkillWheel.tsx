import { useMemo, useState } from 'react';
import { Lock, Sparkles } from 'lucide-react';
import { useStore } from '../store/useStore';
import { SKILL_BRANCHES, SKILL_NODES, type SkillBranch } from '../data/skillTree';
import { playSound } from '../lib/sound';

function storageKey(username: string) { return `syrox-skill-tree:${username || 'hunter'}`; }
function loadUnlocked(username: string): string[] {
  try {
    const raw = localStorage.getItem(storageKey(username));
    const values = raw ? JSON.parse(raw) : [];
    return Array.isArray(values) ? values.filter((id) => SKILL_NODES.some((node) => node.id === id)) : [];
  } catch { return []; }
}

export function getEarnedSkillPoints(state: ReturnType<typeof useStore>['state']): number {
  return state.history.reduce((total, day) => total + Object.values(day.coreCompleted ?? {}).filter(Boolean).length + Object.values(day.customCompleted ?? {}).filter(Boolean).length, 0);
}

export function HunterSkillWheel() {
  const { state } = useStore();
  const [unlocked, setUnlocked] = useState<string[]>(() => loadUnlocked(state.username));
  const [hovered, setHovered] = useState<SkillBranch | null>(null);
  const earned = getEarnedSkillPoints(state);
  const spent = useMemo(() => unlocked.reduce((sum, id) => sum + (SKILL_NODES.find((node) => node.id === id)?.cost ?? 0), 0), [unlocked]);
  const available = Math.max(0, earned - spent);

  const progressFor = (branch: SkillBranch) => {
    let stage = 0;
    while (stage < 500 && unlocked.includes(`${branch}_${stage + 1}`)) stage += 1;
    return stage;
  };

  const forge = (branch: SkillBranch) => {
    const stage = progressFor(branch);
    if (stage >= 500) return;
    const next = SKILL_NODES.find((node) => node.branch === branch && node.index === stage + 1);
    if (!next || available < next.cost) return;
    const nextUnlocked = [...unlocked, next.id];
    setUnlocked(nextUnlocked);
    localStorage.setItem(storageKey(state.username), JSON.stringify(nextUnlocked));
    playSound('click');
  };

  return <section className="card-premium relative overflow-hidden p-4 sm:p-6 md:p-8">
    <div className="absolute inset-0 pointer-events-none opacity-40" style={{ background: 'radial-gradient(circle at center, rgba(255,122,24,.12), transparent 52%)' }} />
    <div className="relative flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-[11px] uppercase tracking-[0.3em] text-ember-400">Hunter Development</p><h2 className="mt-1 font-display text-2xl sm:text-3xl font-black text-white">FORGED SKILL CORE</h2><p className="mt-2 text-xs sm:text-sm text-ink-400">Hover a path to inspect it. Spend your Skill Points to forge the next stage.</p></div>
      <div className="shrink-0 rounded-xl border border-ember-500/25 bg-ember-500/10 px-4 py-2 text-right"><div className="text-[9px] uppercase tracking-widest text-ember-300">Available SP</div><div className="text-2xl font-black text-white">{available}</div></div>
    </div>

    <div className="relative mx-auto mt-5 aspect-square w-full max-w-[680px]">
      <div className="absolute inset-[12%] rounded-full border border-ember-500/15 bg-black/20 shadow-[0_0_80px_rgba(255,122,24,.08)]" />
      <div className="absolute inset-[27%] rounded-full border border-white/10 bg-black/55 shadow-[inset_0_0_40px_rgba(0,0,0,.8)]" />
      <div className="absolute left-1/2 top-1/2 z-10 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border border-ember-400/40 bg-black/80 text-center shadow-[0_0_35px_rgba(255,122,24,.18)] sm:h-28 sm:w-28">
        <Sparkles size={18} className="mb-1 text-ember-400" /><span className="text-[10px] uppercase tracking-[.18em] text-ink-500">Forged</span><span className="text-sm font-black text-white">CORE</span>
      </div>
      {SKILL_BRANCHES.map((branch, index) => {
        const angle = (index / SKILL_BRANCHES.length) * Math.PI * 2 - Math.PI / 2;
        const x = 50 + Math.cos(angle) * 39;
        const y = 50 + Math.sin(angle) * 39;
        const stage = progressFor(branch.id);
        const next = stage < 500 ? SKILL_NODES.find((node) => node.branch === branch.id && node.index === stage + 1) : null;
        const canForge = Boolean(next && available >= next.cost);
        const active = hovered === branch.id;
        return <div key={branch.id} className="absolute z-20" style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }} onMouseEnter={() => setHovered(branch.id)} onMouseLeave={() => setHovered(null)}>
          <button type="button" onClick={() => forge(branch.id)} className={`relative flex h-14 w-14 flex-col items-center justify-center rounded-2xl border transition-all duration-200 sm:h-16 sm:w-16 ${active ? 'scale-110 border-ember-400 bg-ember-500/20 shadow-[0_0_28px_rgba(255,122,24,.28)]' : stage > 0 ? 'border-ember-500/45 bg-ember-500/10' : 'border-white/10 bg-black/70 hover:border-white/25'}`} title={`${branch.name} — ${stage}/500`}>
            <span className="text-xl sm:text-2xl">{branch.icon}</span><span className="absolute -bottom-4 rounded-full bg-black/90 px-1.5 py-0.5 text-[8px] font-mono text-ink-400">{stage}</span>
          </button>
          {active && <div className="absolute left-1/2 top-[calc(100%+18px)] z-50 w-48 -translate-x-1/2 rounded-xl border border-ember-500/25 bg-black/95 p-3 text-left shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between gap-2"><span className="text-sm font-black text-white">{branch.name}</span><span className="text-[10px] text-ink-500">{stage}/500</span></div>
            <p className="mt-1 text-[10px] leading-4 text-ink-400">{branch.description}</p>
            {next ? <><div className="mt-2 text-[10px] text-ink-500">Next: <span className="text-ink-200">{next.name}</span> · {next.cost} SP</div><button type="button" onClick={() => forge(branch.id)} disabled={!canForge} className={`mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[10px] font-bold ${canForge ? 'bg-ember-500/20 text-ember-300 hover:bg-ember-500/30' : 'bg-white/5 text-ink-600 cursor-not-allowed'}`}>{canForge ? 'FORGE STAGE' : <><Lock size={11} /> NEED {next.cost - available} SP</>}</button></> : <div className="mt-2 text-[10px] font-bold text-emerald-300">PATH FULLY FORGED</div>}
          </div>}
        </div>;
      })}
    </div>
    <div className="relative mt-2 text-center text-[10px] text-ink-600">10 paths · 500 stages each · Skill Points are earned through completed tasks</div>
  </section>;
}
