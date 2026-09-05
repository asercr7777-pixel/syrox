import { useState } from 'react';
import { useStore } from '../store/useStore';
import { Modal, ConfirmModal } from '../components/ui/Modal';
import { Plus, Pencil, Trash2, Check, ChevronUp, ChevronDown, Power, GripVertical, Target, Crosshair, Zap, ListChecks } from 'lucide-react';
import { toast } from '../components/ui/Toast';
import type { MainTask } from '../store/types';

const EMOJI_CHOICES = ['💪', '🏃', '📚', '🧘', '💧', '🥗', '😴', '💼', '🕌', '📖', '🎯', '⚡', '🔥', '⭐', '🌟', '🦵', '🧠', '❤️', '☀️', '🛏️', '🥤', '🍎', '🧹', '✍️', '🎨', '🎵', '🤝', '🌱', '⏰', '🏆'];
const CATEGORIES: { id: MainTask['category']; label: string; color: string }[] = [
  { id: 'body', label: 'Body', color: '#ff7a18' },
  { id: 'mind', label: 'Mind', color: '#3b82f6' },
  { id: 'spirit', label: 'Spirit', color: '#a855f7' },
  { id: 'work', label: 'Work', color: '#10b981' },
];

interface EditFormData { label: string; emoji: string; points: number; description: string; category: MainTask['category']; }

export function Tasks() {
  const { state, toggleCoreTask, toggleCustomTask, addCustomTask, updateCustomTask, deleteCustomTask, addMainTask, updateMainTask, deleteMainTask, reorderMainTask } = useStore();
  const [mainAddOpen, setMainAddOpen] = useState(false);
  const [mainEditId, setMainEditId] = useState<string | null>(null);
  const [mainDeleteId, setMainDeleteId] = useState<string | null>(null);
  const [customAddOpen, setCustomAddOpen] = useState(false);
  const [customEditId, setCustomEditId] = useState<string | null>(null);
  const [customDeleteId, setCustomDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState<EditFormData>({ label: '', emoji: '🎯', points: 50, description: '', category: 'body' });

  const resetForm = () => setFormData({ label: '', emoji: '🎯', points: 50, description: '', category: 'body' });
  const openMainAdd = () => { resetForm(); setMainAddOpen(true); };
  const openMainEdit = (task: MainTask) => { setFormData({ label: task.label, emoji: task.emoji, points: task.points, description: task.description ?? '', category: task.category }); setMainEditId(task.id); };
  const openCustomAdd = () => { resetForm(); setCustomAddOpen(true); };
  const openCustomEdit = (id: string) => { const t = state.customTasks.find((x) => x.id === id); if (!t) return; setFormData({ label: t.label, emoji: t.emoji, points: t.points, description: '', category: 'body' }); setCustomEditId(id); };

  const saveMain = () => {
    if (!formData.label.trim()) return toast({ title: 'Label required', type: 'error' });
    const payload = { label: formData.label, emoji: formData.emoji, points: formData.points, description: formData.description, category: formData.category };
    if (mainEditId) { updateMainTask(mainEditId, payload); toast({ title: 'Mission updated', type: 'success' }); setMainEditId(null); }
    else { addMainTask(payload); toast({ title: 'Mission added', type: 'success' }); setMainAddOpen(false); }
    resetForm();
  };
  const saveCustom = () => {
    if (!formData.label.trim()) return toast({ title: 'Label required', type: 'error' });
    if (customEditId) { updateCustomTask(customEditId, { label: formData.label, emoji: formData.emoji, points: formData.points }); toast({ title: 'Objective updated', type: 'success' }); setCustomEditId(null); }
    else { addCustomTask(formData.label, formData.emoji, formData.points); toast({ title: 'Objective added', type: 'success' }); setCustomAddOpen(false); }
    resetForm();
  };

  const sortedMainTasks = [...state.mainTasks].sort((a, b) => a.order - b.order);
  const activeTasks = sortedMainTasks.filter((t) => t.enabled);
  const completedMain = activeTasks.filter((t) => state.coreCompleted[t.id]).length;
  const totalXP = activeTasks.reduce((sum, t) => sum + t.points, 0);
  const earnedXP = activeTasks.filter((t) => state.coreCompleted[t.id]).reduce((sum, t) => sum + t.points, 0);
  const progress = activeTasks.length ? Math.round((completedMain / activeTasks.length) * 100) : 0;

  return (
    <div className="space-y-6 pb-8">
      <header className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/30 p-5 sm:p-7">
        <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-ember-500/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-ember-400"><Crosshair size={13} /> Mission Control</div>
            <h1 className="font-display text-3xl font-black uppercase tracking-tight sm:text-4xl">Today's Objectives</h1>
            <p className="mt-2 max-w-xl text-sm text-ink-300">Complete your core missions. Every check moves your progression forward.</p>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:min-w-[310px]">
            <Metric label="Progress" value={`${progress}%`} />
            <Metric label="Missions" value={`${completedMain}/${activeTasks.length}`} />
            <Metric label="XP Earned" value={`${earnedXP}`} />
          </div>
        </div>
        <div className="relative mt-6 h-1.5 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full bg-ember-500 transition-all duration-500" style={{ width: `${progress}%` }} /></div>
        <div className="mt-2 flex justify-between text-[10px] font-bold uppercase tracking-widest text-ink-500"><span>Daily mission</span><span>{earnedXP}/{totalXP} XP</span></div>
      </header>

      <section className="card overflow-hidden">
        <div className="border-b border-white/5 px-4 py-4 sm:px-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ember-500/10 text-ember-400"><ListChecks size={18} /></div><div><h2 className="font-display text-base font-bold uppercase tracking-wide">Core Missions</h2><p className="text-xs text-ink-400">Your primary progression objectives</p></div></div>
            <button onClick={openMainAdd} className="btn-primary w-full sm:w-auto"><Plus size={16} /> Add Mission</button>
          </div>
        </div>
        <div className="divide-y divide-white/5">
          {sortedMainTasks.map((task, idx) => {
            const done = !!state.coreCompleted[task.id];
            const cat = CATEGORIES.find((c) => c.id === task.category);
            return <div key={task.id} className={`group grid grid-cols-[28px_1fr_auto] gap-3 px-4 py-4 transition-colors sm:grid-cols-[40px_1fr_auto] sm:px-5 ${done ? 'bg-emerald2-500/[0.04]' : 'hover:bg-white/[0.025]'} ${!task.enabled ? 'opacity-45' : ''}`}>
              <div className="flex flex-col items-center justify-center"><button onClick={() => reorderMainTask(task.id, 'up')} disabled={idx === 0} className="rounded p-0.5 text-ink-500 hover:bg-white/10 disabled:opacity-20"><ChevronUp size={13} /></button><GripVertical size={13} className="text-ink-700" /><button onClick={() => reorderMainTask(task.id, 'down')} disabled={idx === sortedMainTasks.length - 1} className="rounded p-0.5 text-ink-500 hover:bg-white/10 disabled:opacity-20"><ChevronDown size={13} /></button></div>
              <button onClick={() => task.enabled && toggleCoreTask(task.id)} disabled={!task.enabled} className="flex min-w-0 items-center gap-3 text-left"><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-xl ${done ? 'border-emerald2-500/30 bg-emerald2-500/10' : 'border-white/5 bg-white/[0.025]'} ${task.enabled ? 'group-hover:border-ember-500/30' : ''}`}>{task.emoji}</span><span className="min-w-0"><span className={`block truncate text-sm font-semibold ${done ? 'text-emerald2-400 line-through' : 'text-white'}`}>{task.label}</span><span className="mt-1 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-wider text-ink-500"><span className="text-ember-400">+{task.points} XP</span>{cat && <span>{cat.label}</span>}{!task.enabled && <span>Disabled</span>}</span>{task.description && <span className="mt-1 block truncate text-xs text-ink-500">{task.description}</span>}</span></button>
              <div className="flex items-center gap-1"><button onClick={() => task.enabled && toggleCoreTask(task.id)} disabled={!task.enabled} className={`mr-1 flex h-8 w-8 items-center justify-center rounded-lg border transition-all ${done ? 'border-emerald2-500 bg-emerald2-500 text-white' : 'border-white/10 text-transparent hover:border-ember-500/50'}`}><Check size={15} /></button><button onClick={() => openMainEdit(task)} className="hidden rounded-lg p-2 hover:bg-white/10 sm:block"><Pencil size={14} className="text-ink-400" /></button><button onClick={() => updateMainTask(task.id, { enabled: !task.enabled })} className="hidden rounded-lg p-2 hover:bg-white/10 sm:block"><Power size={14} className={task.enabled ? 'text-emerald2-400' : 'text-ink-500'} /></button><button onClick={() => setMainDeleteId(task.id)} className="hidden rounded-lg p-2 text-danger-400 hover:bg-danger-500/10 sm:block"><Trash2 size={14} /></button></div>
            </div>;
          })}
          {sortedMainTasks.length === 0 && <EmptyState title="No core missions" action="Add your first mission" onClick={openMainAdd} />}
        </div>
      </section>

      <section className="card overflow-hidden">
        <div className="border-b border-white/5 px-4 py-4 sm:px-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-ink-300"><Target size={18} /></div><div><h2 className="font-display text-base font-bold uppercase tracking-wide">Bonus Objectives</h2><p className="text-xs text-ink-400">Optional missions for additional XP</p></div></div><div className="flex items-center gap-2"><span className="chip bg-white/5 text-ink-400">{state.customTasks.length} active</span><button onClick={openCustomAdd} className="btn-primary"><Plus size={16} /> Add</button></div></div></div>
        <div className="divide-y divide-white/5">
          {state.customTasks.map((task) => { const done = !!state.customCompleted[task.id]; return <div key={task.id} className={`flex items-center gap-3 px-4 py-4 sm:px-5 ${done ? 'bg-emerald2-500/[0.04]' : 'hover:bg-white/[0.025]'}`}><button onClick={() => toggleCustomTask(task.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/5 bg-white/[0.025] text-lg">{task.emoji}</span><span className="min-w-0"><span className={`block truncate text-sm font-medium ${done ? 'text-emerald2-400 line-through' : 'text-white'}`}>{task.label}</span><span className="text-[10px] uppercase tracking-wider text-ink-500">+{task.points} XP · Bonus</span></span></button><button onClick={() => toggleCustomTask(task.id)} className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md border ${done ? 'border-emerald2-500 bg-emerald2-500 text-white' : 'border-white/10 text-transparent'}`}><Check size={14} /></button><div className="hidden items-center sm:flex"><button onClick={() => openCustomEdit(task.id)} className="rounded-lg p-2 hover:bg-white/10"><Pencil size={14} className="text-ink-400" /></button><button onClick={() => setCustomDeleteId(task.id)} className="rounded-lg p-2 text-danger-400 hover:bg-danger-500/10"><Trash2 size={14} /></button></div></div>; })}
          {state.customTasks.length === 0 && <EmptyState title="No bonus objectives" action="Add an objective" onClick={openCustomAdd} />}
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2"><div className="rounded-xl border border-white/5 bg-white/[0.02] p-4"><div className="flex items-center gap-3"><Zap size={17} className="text-ember-400" /><div><p className="text-xs font-bold uppercase tracking-widest text-ink-400">XP Available</p><p className="mt-1 font-display text-xl font-bold">{totalXP} XP</p></div></div></div><div className="rounded-xl border border-white/5 bg-white/[0.02] p-4"><div className="flex items-center gap-3"><Check size={17} className="text-emerald2-400" /><div><p className="text-xs font-bold uppercase tracking-widest text-ink-400">Daily Status</p><p className="mt-1 font-display text-xl font-bold">{progress === 100 && activeTasks.length ? 'COMPLETE' : progress > 0 ? 'IN PROGRESS' : 'STANDBY'}</p></div></div></div></div>

      <Modal open={mainAddOpen || mainEditId !== null} onClose={() => { setMainAddOpen(false); setMainEditId(null); }} title={mainEditId ? 'Edit Core Mission' : 'Add Core Mission'}><TaskForm formData={formData} setFormData={setFormData} showCategory showDescription onSave={saveMain} onCancel={() => { setMainAddOpen(false); setMainEditId(null); }} saveLabel={mainEditId ? 'Save Changes' : 'Add Mission'} /></Modal>
      <Modal open={customAddOpen || customEditId !== null} onClose={() => { setCustomAddOpen(false); setCustomEditId(null); }} title={customEditId ? 'Edit Objective' : 'Add Bonus Objective'}><TaskForm formData={formData} setFormData={setFormData} onSave={saveCustom} onCancel={() => { setCustomAddOpen(false); setCustomEditId(null); }} saveLabel={customEditId ? 'Save Changes' : 'Add Objective'} /></Modal>
      <ConfirmModal open={mainDeleteId !== null} onClose={() => setMainDeleteId(null)} onConfirm={() => { if (mainDeleteId) { deleteMainTask(mainDeleteId); toast({ title: 'Mission deleted', type: 'success' }); setMainDeleteId(null); } }} title="Delete Core Mission" message="This will permanently remove the mission and its completion data." confirmLabel="Delete" danger />
      <ConfirmModal open={customDeleteId !== null} onClose={() => setCustomDeleteId(null)} onConfirm={() => { if (customDeleteId) { deleteCustomTask(customDeleteId); toast({ title: 'Objective deleted', type: 'success' }); setCustomDeleteId(null); } }} title="Delete Objective" message="This will remove the objective permanently." confirmLabel="Delete" danger />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-lg border border-white/5 bg-white/[0.025] px-3 py-2"><p className="text-[9px] font-bold uppercase tracking-widest text-ink-500">{label}</p><p className="mt-0.5 font-display text-sm font-bold text-white">{value}</p></div>; }
function EmptyState({ title, action, onClick }: { title: string; action: string; onClick: () => void }) { return <div className="px-5 py-10 text-center"><p className="text-sm text-ink-400">{title}</p><button onClick={onClick} className="btn-ghost mt-3 text-xs">{action}</button></div>; }

function TaskForm({ formData, setFormData, onSave, onCancel, saveLabel, showCategory, showDescription }: { formData: EditFormData; setFormData: (fn: (d: EditFormData) => EditFormData) => void; onSave: () => void; onCancel: () => void; saveLabel: string; showCategory?: boolean; showDescription?: boolean; }) {
  return <div className="space-y-4"><div><label className="label">Mission Label</label><input className="input mt-1" value={formData.label} onChange={(e) => setFormData((d) => ({ ...d, label: e.target.value }))} placeholder="e.g. Train for 60 minutes" autoFocus /></div><div><label className="label">Icon</label><div className="mt-2 grid grid-cols-8 gap-1.5">{EMOJI_CHOICES.map((e) => <button key={e} type="button" onClick={() => setFormData((d) => ({ ...d, emoji: e }))} className={`flex h-9 items-center justify-center rounded-lg text-lg transition ${formData.emoji === e ? 'border border-ember-500 bg-ember-500/20' : 'border border-white/5 bg-ink-950/60 hover:bg-white/5'}`}>{e}</button>)}</div></div><div><label className="label">XP Reward</label><input type="number" className="input mt-1" value={formData.points} onChange={(e) => setFormData((d) => ({ ...d, points: Math.max(1, Number(e.target.value)) }))} min={1} max={500} /></div>{showCategory && <div><label className="label">Category</label><div className="mt-2 grid grid-cols-2 gap-2">{CATEGORIES.map((c) => <button key={c.id} type="button" onClick={() => setFormData((d) => ({ ...d, category: c.id }))} className={`rounded-lg px-3 py-2 text-left text-sm font-medium transition ${formData.category === c.id ? 'border' : 'border border-white/5 bg-ink-950/60 hover:bg-white/5'}`} style={formData.category === c.id ? { backgroundColor: `${c.color}20`, borderColor: c.color, color: c.color } : {}}>{c.label}</button>)}</div></div>}{showDescription && <div><label className="label">Description</label><input className="input mt-1" value={formData.description} onChange={(e) => setFormData((d) => ({ ...d, description: e.target.value }))} placeholder="Optional mission details" /></div>}<div className="flex justify-end gap-2 pt-2"><button onClick={onCancel} className="btn-ghost">Cancel</button><button onClick={onSave} className="btn-primary">{saveLabel}</button></div></div>;
}
