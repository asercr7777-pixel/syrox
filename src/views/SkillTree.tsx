import { useMemo, useState } from 'react';
import { Lock, Check, Sparkles, RotateCcw, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useStore } from '../store/useStore';
import { SKILL_BRANCHES, SKILL_NODES, type SkillBranch } from '../data/skillTree';

function storageKey(username: string) { return `syrox-skill-tree:${username || 'hunter'}`; }
function loadUnlocked(username: string): string[] { try { const raw = localStorage.getItem(storageKey(username)); return raw ? JSON.parse(raw) : []; } catch { return []; } }

export function getEarnedSkillPoints(state: ReturnType<typeof useStore>['state']): number {
  return state.history.reduce((total, day) => total + Object.values(day.coreCompleted ?? {}).filter(Boolean).length + Object.values(day.customCompleted ?? {}).filter(Boolean).length, 0);
}

export function SkillTree() {
  const { state } = useStore();
  const [unlocked, setUnlocked] = useState<string[]>(() => loadUnlocked(state.username));
  const [activeBranch, setActiveBranch] = useState<SkillBranch>('strength');
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState('');
  const earned = getEarnedSkillPoints(state);
  const spent = useMemo(() => unlocked.reduce((sum, id) => sum + (SKILL_NODES.find((node) => node.id === id)?.cost ?? 0), 0), [unlocked]);
  const available = Math.max(0, earned - spent);
  const branch = SKILL_BRANCHES.find((item) => item.id === activeBranch)!;
  const branchNodes = useMemo(() => SKILL_NODES.filter((node) => node.branch === activeBranch), [activeBranch]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? branchNodes.filter((node) => `${node.name} ${node.description} ${node.tier}`.toLowerCase().includes(q)) : branchNodes;
  }, [branchNodes, query]);
  const pageSize = 20;
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const visibleNodes = filtered.slice(safePage * pageSize, safePage * pageSize + pageSize);

  const save = (next: string[]) => { setUnlocked(next); localStorage.setItem(storageKey(state.username), JSON.stringify(next)); };
  const selectBranch = (id: SkillBranch) => { setActiveBranch(id); setPage(0); setQuery(''); setMessage(''); };
  const unlock = (id: string) => {
    const node = SKILL_NODES.find((item) => item.id === id);
    if (!node || unlocked.includes(id)) return;
    if (available < node.cost) { setMessage(`You need ${node.cost} Skill Points.`); return; }
    if (node.requires && !unlocked.includes(node.requires)) { setMessage(`Unlock ${node.requires} first.`); return; }
    save([...unlocked, id]);
    setMessage(`${node.name} unlocked.`);
  };
  const reset = () => { save([]); setMessage('Skill Tree reset. Your earned points remain available.'); };

  return <section className="space-y-5">
    <div className="rounded-2xl border border-ember-500/20 bg-black/40 p-5 backdrop-blur-xl">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div><p className="text-xs uppercase tracking-[0.25em] text-ember-400">Hunter Development</p><h1 className="mt-1 text-3xl font-black text-white">Skill Tree</h1><p className="mt-1 text-sm text-ink-400">10,000 Skills • 10 Paths • 1 Skill Point per completed task. You decide your build.</p></div>
        <div className="flex items-center gap-3"><div className="rounded-xl border border-ember-500/30 bg-ember-500/10 px-5 py-3 text-center"><div className="text-xs uppercase tracking-wider text-ember-300">Available SP</div><div className="text-3xl font-black text-white">{available}</div><div className="text-[10px] text-ink-500">{spent} spent / {earned} earned</div></div><button onClick={reset} className="rounded-xl border border-white/10 bg-white/5 p-3 text-ink-300 hover:bg-white/10" title="Reset spent skills"><RotateCcw size={18} /></button></div>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-2 md:grid-cols-5 xl:grid-cols-10">
      {SKILL_BRANCHES.map((item) => <button key={item.id} onClick={() => selectBranch(item.id)} className={`rounded-xl border p-3 text-left transition ${activeBranch === item.id ? 'border-ember-500/50 bg-ember-500/10' : 'border-white/10 bg-black/30 hover:bg-white/5'}`}><div className="text-xl">{item.icon}</div><div className="mt-1 text-xs font-bold text-white">{item.name}</div><div className="mt-1 text-[10px] text-ink-500">1,000 skills</div></button>)}
    </div>

    <div className="rounded-2xl border border-white/10 bg-black/35 p-5 backdrop-blur-xl">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between"><div className="flex items-center gap-3"><span className="text-4xl">{branch.icon}</span><div><h2 className="text-2xl font-black text-white">{branch.name}</h2><p className="text-sm text-ink-400">{branch.description}</p></div></div><div className="relative w-full xl:w-80"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" size={16} /><input value={query} onChange={(e) => { setQuery(e.target.value); setPage(0); }} placeholder="Search this path..." className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-9 pr-3 text-sm text-white outline-none focus:border-ember-500/40" /></div></div>

      <div className="mt-5 flex items-center justify-between rounded-xl border border-ember-500/10 bg-ember-500/[0.03] px-4 py-3"><div className="text-xs text-ink-400">Showing <span className="font-bold text-white">{filtered.length ? safePage * pageSize + 1 : 0}-{Math.min((safePage + 1) * pageSize, filtered.length)}</span> of <span className="font-bold text-white">{filtered.length}</span> skills in this path</div><div className="flex items-center gap-2"><button disabled={safePage === 0} onClick={() => setPage((p) => Math.max(0, p - 1))} className="rounded-lg border border-white/10 p-2 text-ink-300 disabled:opacity-30"><ChevronLeft size={16} /></button><span className="min-w-20 text-center text-xs text-ink-400">Tier {Math.floor((safePage * pageSize) / 10) + 1} • {safePage + 1}/{pageCount}</span><button disabled={safePage >= pageCount - 1} onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))} className="rounded-lg border border-white/10 p-2 text-ink-300 disabled:opacity-30"><ChevronRight size={16} /></button></div></div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        {visibleNodes.map((node) => { const isUnlocked = unlocked.includes(node.id); const blocked = Boolean(node.requires && !unlocked.includes(node.requires)); return <div key={node.id} className={`relative rounded-2xl border p-4 transition ${isUnlocked ? 'border-emerald-400/40 bg-emerald-500/10' : blocked ? 'border-white/10 bg-white/[0.02]' : 'border-ember-500/15 bg-white/[0.03] hover:border-ember-500/35'}`}><div className="flex items-start justify-between"><span className="text-2xl">{node.icon}</span>{isUnlocked ? <Check className="text-emerald-400" size={18} /> : blocked ? <Lock className="text-ink-600" size={18} /> : <Sparkles className="text-ember-400" size={18} />}</div><div className="mt-2 text-[10px] uppercase tracking-wider text-ink-600">Tier {node.tier} • #{node.index}</div><h3 className="mt-1 font-bold text-white">{node.name}</h3><p className="mt-1 min-h-[58px] text-xs leading-5 text-ink-400">{node.description}</p><button disabled={isUnlocked} onClick={() => unlock(node.id)} className={`mt-3 w-full rounded-lg px-3 py-2 text-xs font-bold ${isUnlocked ? 'cursor-default bg-emerald-500/10 text-emerald-300' : blocked ? 'bg-white/5 text-ink-600' : 'bg-ember-500/15 text-ember-300 hover:bg-ember-500/25'}`}>{isUnlocked ? 'UNLOCKED' : `UNLOCK • ${node.cost} SP`}</button></div>; })}
      </div>
      {message && <p className="mt-4 rounded-lg border border-ember-500/20 bg-ember-500/5 px-3 py-2 text-sm text-ember-300">{message}</p>}
    </div>
  </section>;
}

export default SkillTree;
