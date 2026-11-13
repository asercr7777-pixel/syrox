import { useEffect, useState, type FormEvent } from 'react';
import { CheckCircle2, Circle, Plus, Target, Zap, Trash2, Pencil, Save, X } from 'lucide-react';
import { useStore } from '../store/useStore';
import { capTaskXp } from '../lib/progression';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';

type QuestFilter = 'all' | 'pending' | 'completed';

export function Missions() {
  const {
    state,
    toggleCoreTask,
    toggleCustomTask,
    addCustomTask,
    updateCustomTask,
    deleteCustomTask,
    addMainTask,
    updateMainTask,
    deleteMainTask,
  } = useStore();

  const [filter, setFilter] = useState<QuestFilter>('all');
  const [essentialLabel, setEssentialLabel] = useState('');
  const [essentialXp, setEssentialXp] = useState('100');
  const [extraLabel, setExtraLabel] = useState('');
  const [extraXp, setExtraXp] = useState('50');
  const [editing, setEditing] = useState<{
    id: string;
    kind: 'essential' | 'extra';
    label: string;
    points: string;
  } | null>(null);

  useEffect(() => {
    if (!editing) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setEditing(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [editing]);

  const essential = [...state.mainTasks].filter((task) => task.enabled).sort((a, b) => a.order - b.order);
  const extra = state.customTasks;
  const essentialDone = essential.filter((task) => Boolean(state.coreCompleted[task.id])).length;
  const extraDone = extra.filter((task) => Boolean(state.customCompleted[task.id])).length;
  const total = essential.length + extra.length;
  const done = essentialDone + extraDone;
  const progress = total ? Math.round((done / total) * 100) : 0;

  const filterMatch = (completed: boolean) =>
    filter === 'all' ? true : filter === 'completed' ? completed : !completed;

  const visibleEssential = essential.filter((t) => filterMatch(Boolean(state.coreCompleted[t.id])));
  const visibleExtra = extra.filter((t) => filterMatch(Boolean(state.customCompleted[t.id])));

  function addEssential(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const clean = essentialLabel.trim();
    if (!clean) return;
    addMainTask({ label: clean, emoji: '◆', points: capTaskXp(Number(essentialXp)), category: 'work' });
    setEssentialLabel('');
  }

  function addExtra(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const clean = extraLabel.trim();
    if (!clean) return;
    addCustomTask(clean, '✦', capTaskXp(Number(extraXp)));
    setExtraLabel('');
  }

  function saveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing || !editing.label.trim()) return;
    const patch = { label: editing.label.trim(), points: capTaskXp(Number(editing.points)) };
    if (editing.kind === 'essential') updateMainTask(editing.id, patch);
    else updateCustomTask(editing.id, patch);
    setEditing(null);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Mission Control"
        title="Quests"
        description="Confirm core daily commitments and custom objectives. Each completed quest awards XP once per day."
        right={
          <div className="sv-surface px-4 py-2.5 flex items-center gap-2.5 text-xs font-mono tabular-nums">
            <Zap size={16} className="text-ember-400" />
            <span className="font-bold text-ink-100">
              {done}/{total} Confirmed
            </span>
          </div>
        }
      />

      {/* Overview Progress & Filter */}
      <section className="sv-surface p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="eyebrow-label">Daily Execution</span>
            <p className="mt-1 text-sm text-ink-300 tabular-nums">
              {done} of {total} active quests completed ({progress}%)
            </p>
          </div>
          <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-ink-950/90 p-1" role="tablist" aria-label="Filter quests">
            {(['all', 'pending', 'completed'] as QuestFilter[]).map((key) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={filter === key}
                onClick={() => setFilter(key)}
                className={`min-h-[38px] px-3 rounded-lg text-xs font-semibold capitalize transition ${
                  filter === key ? 'bg-ember-500/20 text-ember-400 border border-ember-500/40' : 'text-ink-400 hover:text-ink-100'
                }`}
              >
                {key}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-ink-400">Quest Completion</span>
              <span className="font-mono font-semibold tabular-nums text-ink-100">{progress}%</span>
            </div>
            <div className="h-2 rounded-full bg-ink-950 overflow-hidden border border-white/5">
              <div className="h-full rounded-full bg-ember-500 transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-ink-400">Daily XP Cap</span>
              <span className="font-mono font-semibold tabular-nums text-frost-400">
                {state.dailyXp.toLocaleString()} / 10,000 XP
              </span>
            </div>
            <div className="h-2 rounded-full bg-ink-950 overflow-hidden border border-white/5">
              <div
                className="h-full rounded-full bg-frost-500 transition-all duration-300"
                style={{ width: `${Math.min(100, (state.dailyXp / 10000) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Main Quests */}
      <section className="sv-surface p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="eyebrow-label text-ember-400">Core Protocol</p>
            <h2 className="mt-1 font-display text-xl font-bold text-ink-100">Main Quests</h2>
            <p className="text-xs text-ink-400 mt-0.5">Essential daily commitments.</p>
          </div>
          <span className="font-mono text-sm font-bold tabular-nums text-ink-200">
            {essentialDone}/{essential.length}
          </span>
        </div>

        {visibleEssential.length > 0 ? (
          <div className="space-y-2">
            {visibleEssential.map((task) => {
              const complete = Boolean(state.coreCompleted[task.id]);
              return (
                <article
                  key={task.id}
                  className={`flex flex-wrap sm:flex-nowrap items-center gap-2.5 sm:gap-3 rounded-xl border px-3 py-2.5 transition ${
                    complete ? 'border-emerald-500/35 bg-emerald-500/10' : 'border-white/10 bg-ink-950/60'
                  }`}
                >
                  <button
                    type="button"
                    disabled={complete}
                    aria-label={complete ? `${task.label} completed` : `Complete ${task.label}`}
                    onClick={() => toggleCoreTask(task.id)}
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition ${
                      complete ? 'text-emerald-400 cursor-default' : 'text-ink-400 hover:bg-white/5 hover:text-ember-400'
                    }`}
                  >
                    {complete ? <CheckCircle2 size={21} /> : <Circle size={21} />}
                  </button>
                  <span className="text-lg shrink-0" aria-hidden="true">
                    {task.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-medium truncate ${complete ? 'line-through text-ink-400' : 'text-ink-100'}`}>
                      {task.label}
                    </p>
                    <p className="text-[11px] font-mono uppercase text-ink-400">
                      {task.description || task.category}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 ml-auto">
                    {complete && (
                      <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-400 px-2 py-1 rounded-md bg-emerald-500/10">
                        Claimed
                      </span>
                    )}
                    <span className="font-mono text-xs font-bold tabular-nums text-ember-400 px-1.5">
                      +{task.points} XP
                    </span>
                    <button
                      type="button"
                      aria-label={`Edit ${task.label}`}
                      onClick={() =>
                        setEditing({ id: task.id, kind: 'essential', label: task.label, points: String(task.points) })
                      }
                      className="flex h-10 w-10 items-center justify-center rounded-xl text-ink-400 hover:bg-white/5 hover:text-ink-100 transition"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete ${task.label}`}
                      onClick={() => deleteMainTask(task.id)}
                      className="flex h-10 w-10 items-center justify-center rounded-xl text-ink-400 hover:bg-danger-500/15 hover:text-danger-400 transition"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={<Target size={19} />}
            title={essential.length ? 'No matching main quests' : 'No main quests yet'}
            description={essential.length ? 'Try switching the filter above.' : 'Add your first core daily commitment below.'}
          />
        )}

        <form onSubmit={addEssential} className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 pt-2 border-t border-white/10">
          <input
            className="input sm:col-span-7"
            value={essentialLabel}
            onChange={(e) => setEssentialLabel(e.target.value)}
            maxLength={90}
            placeholder="Add a main daily quest…"
            aria-label="New main quest name"
            required
          />
          <input
            type="number"
            min="0"
            max="200"
            className="input sm:col-span-2 tabular-nums"
            value={essentialXp}
            onChange={(e) => setEssentialXp(e.target.value)}
            aria-label="Main quest XP reward (max 200)"
          />
          <button type="submit" className="btn-primary sm:col-span-3">
            <Plus size={16} />
            <span>Add Main</span>
          </button>
        </form>
      </section>

      {/* Extra Quests */}
      <section className="sv-surface p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="eyebrow-label text-frost-400">Personal Protocol</p>
            <h2 className="mt-1 font-display text-xl font-bold text-ink-100">Extra Quests</h2>
            <p className="text-xs text-ink-400 mt-0.5">Custom objectives beyond your core routine.</p>
          </div>
          <span className="font-mono text-sm font-bold tabular-nums text-ink-200">
            {extraDone}/{extra.length}
          </span>
        </div>

        {visibleExtra.length > 0 ? (
          <div className="space-y-2">
            {visibleExtra.map((task) => {
              const complete = Boolean(state.customCompleted[task.id]);
              return (
                <article
                  key={task.id}
                  className={`flex flex-wrap sm:flex-nowrap items-center gap-2.5 sm:gap-3 rounded-xl border px-3 py-2.5 transition ${
                    complete ? 'border-emerald-500/35 bg-emerald-500/10' : 'border-white/10 bg-ink-950/60'
                  }`}
                >
                  <button
                    type="button"
                    disabled={complete}
                    aria-label={complete ? `${task.label} completed` : `Complete ${task.label}`}
                    onClick={() => toggleCustomTask(task.id)}
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition ${
                      complete ? 'text-emerald-400 cursor-default' : 'text-ink-400 hover:bg-white/5 hover:text-frost-400'
                    }`}
                  >
                    {complete ? <CheckCircle2 size={21} /> : <Circle size={21} />}
                  </button>
                  <span className="text-lg shrink-0" aria-hidden="true">
                    ✦
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-medium truncate ${complete ? 'line-through text-ink-400' : 'text-ink-100'}`}>
                      {task.label}
                    </p>
                    <p className="text-[11px] font-mono uppercase text-ink-400">Personal Quest</p>
                  </div>
                  <div className="flex items-center gap-1.5 ml-auto">
                    {complete && (
                      <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-400 px-2 py-1 rounded-md bg-emerald-500/10">
                        Claimed
                      </span>
                    )}
                    <span className="font-mono text-xs font-bold tabular-nums text-frost-400 px-1.5">
                      +{task.points} XP
                    </span>
                    <button
                      type="button"
                      aria-label={`Edit ${task.label}`}
                      onClick={() =>
                        setEditing({ id: task.id, kind: 'extra', label: task.label, points: String(task.points) })
                      }
                      className="flex h-10 w-10 items-center justify-center rounded-xl text-ink-400 hover:bg-white/5 hover:text-ink-100 transition"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete ${task.label}`}
                      onClick={() => deleteCustomTask(task.id)}
                      className="flex h-10 w-10 items-center justify-center rounded-xl text-ink-400 hover:bg-danger-500/15 hover:text-danger-400 transition"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={<Plus size={19} />}
            title={extra.length ? 'No matching extra quests' : 'No extra quests added'}
            description={extra.length ? 'Adjust the filter above.' : 'Add optional objectives below whenever needed.'}
          />
        )}

        <form onSubmit={addExtra} className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 pt-2 border-t border-white/10">
          <input
            className="input sm:col-span-7"
            value={extraLabel}
            onChange={(e) => setExtraLabel(e.target.value)}
            maxLength={90}
            placeholder="Add an extra quest…"
            aria-label="New extra quest name"
            required
          />
          <input
            type="number"
            min="0"
            max="200"
            className="input sm:col-span-2 tabular-nums"
            value={extraXp}
            onChange={(e) => setExtraXp(e.target.value)}
            aria-label="Extra quest XP reward (max 200)"
          />
          <button type="submit" className="btn-ghost sm:col-span-3">
            <Plus size={16} />
            <span>Add Extra</span>
          </button>
        </form>
      </section>

      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Edit quest"
          onClick={() => setEditing(null)}
        >
          <form
            className="sv-surface w-full max-w-md p-5 sm:p-6 space-y-4"
            onSubmit={saveEdit}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <span className="eyebrow-label text-frost-400">Quest Configuration</span>
              <button
                type="button"
                onClick={() => setEditing(null)}
                aria-label="Close"
                className="flex h-10 w-10 items-center justify-center rounded-xl text-ink-400 hover:bg-white/5 hover:text-ink-100"
              >
                <X size={18} />
              </button>
            </div>
            <div>
              <label htmlFor="edit-quest-name" className="eyebrow-label text-ink-300">
                Quest name
              </label>
              <input
                id="edit-quest-name"
                autoFocus
                className="input mt-1.5"
                value={editing.label}
                onChange={(e) => setEditing({ ...editing, label: e.target.value })}
                maxLength={90}
                required
              />
            </div>
            <div>
              <label htmlFor="edit-quest-xp" className="eyebrow-label text-ink-300">
                XP reward (0 – 200)
              </label>
              <input
                id="edit-quest-xp"
                type="number"
                min="0"
                max="200"
                className="input mt-1.5 tabular-nums"
                value={editing.points}
                onChange={(e) => setEditing({ ...editing, points: e.target.value })}
              />
            </div>
            <button type="submit" className="btn-primary w-full">
              <Save size={15} />
              <span>Save Changes</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
