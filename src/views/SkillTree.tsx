import { useMemo, useState } from 'react';
import { Lock, Check, Sparkles, RotateCcw } from 'lucide-react';
import { useStore } from '../store/useStore';
import { SKILL_BRANCHES, SKILL_NODES, type SkillBranch } from '../data/skillTree';

function storageKey(username: string) {
  return `syrox-skill-tree:${username || 'hunter'}`;
}

function loadUnlocked(username: string): string[] {
  try {
    const raw = localStorage.getItem(storageKey(username));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getEarnedSkillPoints(state: ReturnType<typeof useStore>['state']): number {
  return state.history.reduce((total, day) => {
    const main = Object.values(day.coreCompleted ?? {}).filter(Boolean).length;
    const custom = Object.values(day.customCompleted ?? {}).filter(Boolean).length;
    return total + main + custom;
  }, 0);
}

export function SkillTree() {
  const { state } = useStore();
  const [unlocked, setUnlocked] = useState<string[]>(() => loadUnlocked(state.username));
  const [activeBranch, setActiveBranch] = useState<SkillBranch>('strength');
  const [message, setMessage] = useState('');

  const earned = getEarnedSkillPoints(state);
  const spent = useMemo(() => unlocked.reduce((sum, id) => sum + (SKILL_NODES.find((node) => node.id === id)?.cost ?? 0), 0), [unlocked]);
  const available = Math.max(0, earned - spent);
  const branch = SKILL_BRANCHES.find((item) => item.id === activeBranch)!;
  const nodes = SKILL_NODES.filter((node) => node.branch === activeBranch);

  const save = (next: string[]) => {
    setUnlocked(next);
    localStorage.setItem(storageKey(state.username), JSON.stringify(next));
  };

  const unlock = (id: string) => {
    const node = SKILL_NODES.find((item) => item.id === id);
    if (!node || unlocked.includes(id)) return;
    if (available < node.cost) {
      setMessage(`You need ${node.cost} Skill Points.`);
      return;
    }
    if (node.requires && !unlocked.includes(node.requires)) {
      setMessage('Unlock the previous node first.');
      return;
    }
    save([...unlocked, id]);
    setMessage(`${node.name} unlocked.`);
  };

  const reset = () => {
    save([]);
    setMessage('Skill Tree reset. Your earned points remain available.');
  };

  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-ember-500/20 bg-black/40 p-5 backdrop-blur-xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-ember-400">Hunter Development</p>
            <h1 className="mt-1 text-2xl font-black text-white">Skill Tree</h1>
            <p className="mt-1 text-sm text-ink-400">Every completed task grants exactly 1 Skill Point. You decide where it goes.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-ember-500/30 bg-ember-500/10 px-4 py-3 text-center">
              <div className="text-xs uppercase tracking-wider text-ember-300">Available</div>
              <div className="text-2xl font-black text-white">{available}</div>
            </div>
            <button onClick={reset} className="rounded-xl border border-white/10 bg-white/5 p-3 text-ink-300 hover:bg-white/10" title="Reset spent skills">
              <RotateCcw size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {SKILL_BRANCHES.map((item) => (
          <button key={item.id} onClick={() => setActiveBranch(item.id)} className={`rounded-xl border p-3 text-left transition ${activeBranch === item.id ? 'border-ember-500/50 bg-ember-500/10' : 'border-white/10 bg-black/30 hover:bg-white/5'}`}>
            <div className="text-xl">{item.icon}</div>
            <div className="mt-1 text-sm font-bold text-white">{item.name}</div>
            <div className="mt-1 hidden text-xs text-ink-500 sm:block">{item.description}</div>
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/35 p-5 backdrop-blur-xl">
        <div className="mb-5 flex items-center gap-3">
          <span className="text-3xl">{branch.icon}</span>
          <div><h2 className="text-xl font-black text-white">{branch.name}</h2><p className="text-sm text-ink-400">{branch.description}</p></div>
        </div>
        <div className="grid gap-3 md:grid-cols-5">
          {nodes.map((node, index) => {
            const isUnlocked = unlocked.includes(node.id);
            const blocked = Boolean(node.requires && !unlocked.includes(node.requires));
            return (
              <div key={node.id} className={`relative rounded-2xl border p-4 ${isUnlocked ? 'border-emerald-400/40 bg-emerald-500/10' : 'border-white/10 bg-white/[0.03]'}`}>
                {index < nodes.length - 1 && <div className="absolute left-full top-1/2 hidden h-px w-3 bg-white/10 md:block" />}
                <div className="flex items-start justify-between"><span className="text-2xl">{node.icon}</span>{isUnlocked ? <Check className="text-emerald-400" size={18} /> : blocked ? <Lock className="text-ink-600" size={18} /> : <Sparkles className="text-ember-400" size={18} />}</div>
                <h3 className="mt-3 font-bold text-white">{node.name}</h3>
                <p className="mt-1 min-h-[54px] text-xs leading-5 text-ink-400">{node.description}</p>
                <button disabled={isUnlocked} onClick={() => unlock(node.id)} className={`mt-3 w-full rounded-lg px-3 py-2 text-xs font-bold ${isUnlocked ? 'cursor-default bg-emerald-500/10 text-emerald-300' : blocked ? 'bg-white/5 text-ink-600' : 'bg-ember-500/15 text-ember-300 hover:bg-ember-500/25'}`}>
                  {isUnlocked ? 'UNLOCKED' : `UNLOCK • ${node.cost} SP`}
                </button>
              </div>
            );
          })}
        </div>
        {message && <p className="mt-4 rounded-lg border border-ember-500/20 bg-ember-500/5 px-3 py-2 text-sm text-ember-300">{message}</p>}
      </div>
    </section>
  );
}

export default SkillTree;
