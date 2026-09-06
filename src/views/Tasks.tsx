import { useState } from 'react';
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { Modal, ConfirmModal } from '../components/ui/Modal';
import { toast } from '../components/ui/Toast';
import { Check, ChevronDown, ChevronUp, Crosshair, GripVertical, ListChecks, Loader2, Pencil, Plus, Power, Target, Trash2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import type { MainTask } from '../store/types';

const EMOJI_CHOICES = ['💪','🏃','📚','🧘','💧','🥗','😴','💼','🕌','📖','🎯','⚡','🔥','⭐','🌟','🦵','🧠','❤️','☀️','🛏️','🥤','🍎','🧹','✍️','🎨','🎵','🤝','🌱','⏰','🏆'];
const CATEGORIES: { id: MainTask['category']; label: string }[] = [
  { id: 'body', label: 'Body' },
  { id: 'mind', label: 'Mind' },
  { id: 'spirit', label: 'Spirit' },
  { id: 'work', label: 'Work' },
];
interface FormData { label: string; emoji: string; points: number; description: string; category: MainTask['category']; }

export function Tasks() {
  const { state, toggleCoreTask, toggleCustomTask, addCustomTask, updateCustomTask, deleteCustomTask, addMainTask, updateMainTask, deleteMainTask, reorderMainTask } = useStore();
  const [mainAddOpen, setMainAddOpen] = useState(false);
  const [mainEditId, setMainEditId] = useState<string | null>(null);
  const [mainDeleteId, setMainDeleteId] = useState<string | null>(null);
  const [customAddOpen, setCustomAddOpen] = useState(false);
  const [customEditId, setCustomEditId] = useState<string | null>(null);
  const [customDeleteId, setCustomDeleteId] = useState<string | null>(null);
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const [form, setForm] = useState<FormData>({ label: '', emoji: '🎯', points: 50, description: '', category: 'body' });

  const resetForm = () => setForm({ label: '', emoji: '🎯', points: 50, description: '', category: 'body' });
  const markBusy = (id: string) => {
    setBusyIds((prev) => new Set(prev).add(id));
    window.setTimeout(() => setBusyIds((prev) => { const next = new Set(prev); next.delete(id); return next; }), 350);
  };
  const completeCore = (id: string) => {
    if (busyIds.has(id)) return;
    markBusy(id);
    try { toggleCoreTask(id); toast({ title: state.coreCompleted[id] ? 'Mission reopened' : 'Mission completed', type: 'success' }); }
    catch { toast({ title: 'Could not update mission', type: 'error' }); }
  };
  const completeCustom = (id: string) => {
    if (busyIds.has(id)) return;
    markBusy(id);
    try { toggleCustomTask(id); toast({ title: state.customCompleted[id] ? 'Objective reopened' : 'Objective completed', type: 'success' }); }
    catch { toast({ title: 'Could not update objective', type: 'error' }); }
  };
  const openMainAdd = () => { resetForm(); setMainAddOpen(true); };
  const openMainEdit = (task: MainTask) => { setForm({ label: task.label, emoji: task.emoji, points: task.points, description: task.description ?? '', category: task.category }); setMainEditId(task.id); };
  const openCustomAdd = () => { resetForm(); setCustomAddOpen(true); };
  const openCustomEdit = (id: string) => { const task = state.customTasks.find((t) => t.id === id); if (!task) return; setForm({ label: task.label, emoji: task.emoji, points: task.points, description: '', category: 'body' }); setCustomEditId(id); };
  const saveMain = () => {
    const label = form.label.trim();
    if (!label) return toast({ title: 'Mission name is required', type: 'error' });
    const points = Math.max(1, Math.min(1000, Math.floor(Number(form.points) || 0)));
    const payload = { label, emoji: form.emoji, points, description: form.description.trim(), category: form.category };
    try {
      if (mainEditId) { updateMainTask(mainEditId, payload); toast({ title: 'Mission updated', type: 'success' }); setMainEditId(null); }
      else { addMainTask(payload); toast({ title: 'Mission added', type: 'success' }); setMainAddOpen(false); }
      resetForm();
    } catch { toast({ title: 'Could not save mission', type: 'error' }); }
  };
  const saveCustom = () => {
    const label = form.label.trim();
    if (!label) return toast({ title: 'Objective name is required', type: 'error' });
    const points = Math.max(1, Math.min(1000, Math.floor(Number(form.points) || 0)));
    try {
      if (customEditId) { updateCustomTask(customEditId, { label, emoji: form.emoji, points }); toast({ title: 'Objective updated', type: 'success' }); setCustomEditId(null); }
      else { addCustomTask(label, form.emoji, points); toast({ title: 'Objective added', type: 'success' }); setCustomAddOpen(false); }
      resetForm();
    } catch { toast({ title: 'Could not save objective', type: 'error' }); }
  };

  const sorted = [...state.mainTasks].sort((a, b) => a.order - b.order);
  const active = sorted.filter((t) => t.enabled);
  const completed = active.filter((t) => !!state.coreCompleted[t.id]).length;
  const completedXP = active.filter((t) => !!state.coreCompleted[t.id]).reduce((sum, t) => sum + t.points, 0);
  const missionPct = active.length ? Math.round((completed / active.length) * 100) : 0;
  const dailyXP = Math.max(0, Math.min(1000, state.dailyXp));
  const dailyPct = Math.round((dailyXP / 1000) * 100);
  const remainingXP = Math.max(0, 1000 - dailyXP);

  return <div className="space-y-6 pb-8">
    <header className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/30 p-5 sm:p-7">
      <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-ember-500/10 blur-3xl" />
      <div className="relative">
        <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-ember-400"><Crosshair size={13}/> Mission Control</div>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div><h1 className="font-display text-3xl font-black uppercase tracking-tight sm:text-4xl">Today's Objectives</h1><p className="mt-2 max-w-xl text-sm text-ink-300">Complete your missions and push your progression forward.</p></div>
          <div className="grid grid-cols-3 gap-2 sm:min-w-[330px]"><Metric label="Missions" value={`${completed}/${active.length}`} /><Metric label="Mission XP" value={`${completedXP}`} /><Metric label="Daily XP" value={`${dailyXP}/1000`} /></div>
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-2"><ProgressPanel label="Mission progress" value={`${completed}/${active.length}`} percent={missionPct}/><ProgressPanel label="Daily XP cap" value={`${dailyXP} / 1000 XP`} percent={dailyPct} sub={`${remainingXP} XP remaining today`}/></div>
      </div>
    </header>

    <section className="card overflow-hidden">
      <SectionHeader icon={<ListChecks size={18}/>} title="Core Missions" subtitle="Primary daily progression objectives" action="Add Mission" onAction={openMainAdd}/>
      <div className="divide-y divide-white/5">
        {sorted.map((task, idx) => {
          const done = !!state.coreCompleted[task.id]; const busy = busyIds.has(task.id); const cat = CATEGORIES.find((c) => c.id === task.category);
          return <div key={task.id} className={`group grid grid-cols-[30px_1fr_auto] gap-3 px-4 py-4 sm:grid-cols-[40px_1fr_auto] sm:px-5 ${done ? 'bg-emerald2-500/[0.04]' : 'hover:bg-white/[0.025]'} ${!task.enabled ? 'opacity-45' : ''}`}>
            <div className="flex flex-col items-center justify-center"><button aria-label="Move mission up" onClick={() => reorderMainTask(task.id,'up')} disabled={idx===0} className="rounded p-0.5 text-ink-500 hover:bg-white/10 disabled:opacity-20"><ChevronUp size={13}/></button><GripVertical size={13} className="text-ink-700"/><button aria-label="Move mission down" onClick={() => reorderMainTask(task.id,'down')} disabled={idx===sorted.length-1} className="rounded p-0.5 text-ink-500 hover:bg-white/10 disabled:opacity-20"><ChevronDown size={13}/></button></div>
            <button aria-label={`${done ? 'Reopen' : 'Complete'} ${task.label}`} onClick={() => task.enabled && completeCore(task.id)} disabled={!task.enabled || busy} className="flex min-w-0 items-center gap-3 text-left"><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-xl ${done ? 'border-emerald2-500/30 bg-emerald2-500/10' : 'border-white/5 bg-white/[0.025]'}`}>{busy ? <Loader2 size={18} className="animate-spin text-ember-400"/> : task.emoji}</span><span className="min-w-0"><span className={`block truncate text-sm font-semibold ${done ? 'text-emerald2-400 line-through' : 'text-white'}`}>{task.label}</span><span className="mt-1 flex flex-wrap gap-2 text-[10px] uppercase tracking-wider text-ink-500"><span className="text-ember-400">+{task.points} XP</span>{cat && <span>{cat.label}</span>}{!task.enabled && <span>Disabled</span>}</span>{task.description && <span className="mt-1 block truncate text-xs text-ink-500">{task.description}</span>}</span></button>
            <div className="flex items-center gap-1"><button aria-label={`${done ? 'Reopen' : 'Complete'} mission`} onClick={() => task.enabled && completeCore(task.id)} disabled={!task.enabled || busy} className={`mr-1 flex h-8 w-8 items-center justify-center rounded-lg border transition-all ${done ? 'border-emerald2-500 bg-emerald2-500 text-white' : 'border-white/10 text-transparent hover:border-ember-500/50'}`}>{busy ? <Loader2 size={14} className="animate-spin"/> : <Check size={15}/>}</button><button aria-label="Edit mission" onClick={() => openMainEdit(task)} className="hidden rounded-lg p-2 hover:bg-white/10 sm:block"><Pencil size={14} className="text-ink-400"/></button><button aria-label={task.enabled ? 'Disable mission' : 'Enable mission'} onClick={() => updateMainTask(task.id,{enabled:!task.enabled})} className="hidden rounded-lg p-2 hover:bg-white/10 sm:block"><Power size={14} className={task.enabled?'text-emerald2-400':'text-ink-500'}/></button><button aria-label="Delete mission" onClick={() => setMainDeleteId(task.id)} className="hidden rounded-lg p-2 text-danger-400 hover:bg-danger-500/10 sm:block"><Trash2 size={14}/></button></div>
          </div>;
        })}
        {sorted.length===0 && <EmptyState title="No core missions" action="Add your first mission" onClick={openMainAdd}/>} 
      </div>
    </section>

    <section className="card overflow-hidden">
      <SectionHeader icon={<Target size={18}/>} title="Bonus Objectives" subtitle="Optional missions for extra XP" action="Add Objective" onAction={openCustomAdd}/>
      <div className="divide-y divide-white/5">
        {state.customTasks.map((task) => { const done=!!state.customCompleted[task.id]; const busy=busyIds.has(task.id); return <div key={task.id} className={`flex items-center gap-3 px-4 py-4 sm:px-5 ${done?'bg-emerald2-500/[0.04]':'hover:bg-white/[0.025]'}`}><button aria-label={`${done?'Reopen':'Complete'} ${task.label}`} onClick={()=>completeCustom(task.id)} disabled={busy} className="flex min-w-0 flex-1 items-center gap-3 text-left"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/5 bg-white/[0.025] text-lg">{busy?<Loader2 size={16} className="animate-spin text-ember-400"/>:task.emoji}</span><span className="min-w-0"><span className={`block truncate text-sm font-medium ${done?'text-emerald2-400 line-through':'text-white'}`}>{task.label}</span><span className="text-[10px] uppercase tracking-wider text-ink-500">+{task.points} XP · Bonus</span></span></button><button aria-label={`${done?'Reopen':'Complete'} objective`} onClick={()=>completeCustom(task.id)} disabled={busy} className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md border ${done?'border-emerald2-500 bg-emerald2-500 text-white':'border-white/10 text-transparent'}`}>{busy?<Loader2 size={13} className="animate-spin"/>:<Check size={14}/>}</button><div className="hidden items-center sm:flex"><button aria-label="Edit objective" onClick={()=>openCustomEdit(task.id)} className="rounded-lg p-2 hover:bg-white/10"><Pencil size={14} className="text-ink-400"/></button><button aria-label="Delete objective" onClick={()=>setCustomDeleteId(task.id)} className="rounded-lg p-2 text-danger-400 hover:bg-danger-500/10"><Trash2 size={14}/></button></div></div>; })}
        {state.customTasks.length===0 && <EmptyState title="No bonus objectives" action="Add an objective" onClick={openCustomAdd}/>} 
      </div>
    </section>

    <Modal open={mainAddOpen||mainEditId!==null} onClose={()=>{setMainAddOpen(false);setMainEditId(null);resetForm();}} title={mainEditId?'Edit Core Mission':'Add Core Mission'}><TaskForm form={form} setForm={setForm} showDetails onSave={saveMain} onCancel={()=>{setMainAddOpen(false);setMainEditId(null);resetForm();}} saveLabel={mainEditId?'Save Changes':'Add Mission'}/></Modal>
    <Modal open={customAddOpen||customEditId!==null} onClose={()=>{setCustomAddOpen(false);setCustomEditId(null);resetForm();}} title={customEditId?'Edit Objective':'Add Bonus Objective'}><TaskForm form={form} setForm={setForm} onSave={saveCustom} onCancel={()=>{setCustomAddOpen(false);setCustomEditId(null);resetForm();}} saveLabel={customEditId?'Save Changes':'Add Objective'}/></Modal>
    <ConfirmModal open={mainDeleteId!==null} onClose={()=>setMainDeleteId(null)} onConfirm={()=>{if(mainDeleteId){deleteMainTask(mainDeleteId);toast({title:'Mission deleted',type:'success'});setMainDeleteId(null);}}} title="Delete Core Mission" message="This removes the mission and its completion state." confirmLabel="Delete" danger/>
    <ConfirmModal open={customDeleteId!==null} onClose={()=>setCustomDeleteId(null)} onConfirm={()=>{if(customDeleteId){deleteCustomTask(customDeleteId);toast({title:'Objective deleted',type:'success'});setCustomDeleteId(null);}}} title="Delete Bonus Objective" message="This removes the objective and its completion state." confirmLabel="Delete" danger/>
  </div>;
}

function Metric({label,value}:{label:string;value:string}) { return <div className="rounded-xl border border-white/5 bg-white/[0.025] px-3 py-2.5"><div className="text-[9px] font-bold uppercase tracking-widest text-ink-500">{label}</div><div className="mt-1 font-display text-sm font-bold text-white sm:text-base">{value}</div></div>; }
function ProgressPanel({label,value,percent,sub}:{label:string;value:string;percent:number;sub?:string}) { return <div className="rounded-xl border border-white/5 bg-white/[0.025] p-4"><div className="flex items-center justify-between gap-3 text-[10px] font-bold uppercase tracking-widest"><span className="text-ink-400">{label}</span><span className="text-white">{value}</span></div><div className="stryven-progress mt-3"><div className="stryven-progress-fill" style={{width:`${percent}%`}}/></div>{sub&&<div className="mt-2 text-[10px] text-ink-500">{sub}</div>}</div>; }
function SectionHeader({icon,title,subtitle,action,onAction}:{icon:ReactNode;title:string;subtitle:string;action:string;onAction:()=>void}) { return <div className="border-b border-white/5 px-4 py-4 sm:px-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ember-500/10 text-ember-400">{icon}</div><div><h2 className="font-display text-base font-bold uppercase tracking-wide">{title}</h2><p className="text-xs text-ink-400">{subtitle}</p></div></div><button onClick={onAction} className="btn-primary w-full sm:w-auto"><Plus size={16}/>{action}</button></div></div>; }
function EmptyState({title,action,onClick}:{title:string;action:string;onClick:()=>void}) { return <div className="px-5 py-12 text-center"><p className="text-sm font-semibold text-ink-300">{title}</p><button onClick={onClick} className="btn-ghost mt-3">{action}</button></div>; }
function TaskForm({form,setForm,showDetails,onSave,onCancel,saveLabel}:{form:FormData;setForm:Dispatch<SetStateAction<FormData>>;showDetails?:boolean;onSave:()=>void;onCancel:()=>void;saveLabel:string}) {
  return <div className="space-y-4 p-1"><label className="block"><span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-400">Name</span><input autoFocus value={form.label} onChange={(e)=>setForm({...form,label:e.target.value})} maxLength={80} className="stryven-input w-full" placeholder="e.g. Train for 60 minutes"/></label>
    <div className="grid gap-4 sm:grid-cols-2"><label className="block"><span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-400">XP Reward</span><input type="number" min={1} max={1000} value={form.points} onChange={(e)=>setForm({...form,points:Number(e.target.value)})} className="stryven-input w-full"/></label><label className="block"><span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-400">Category</span><select value={form.category} onChange={(e)=>setForm({...form,category:e.target.value as MainTask['category']})} disabled={!showDetails} className="stryven-input w-full">{CATEGORIES.map((c)=><option key={c.id} value={c.id}>{c.label}</option>)}</select></label></div>
    <div><span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-400">Icon</span><div className="grid grid-cols-10 gap-1 rounded-xl border border-white/5 bg-white/[0.02] p-2">{EMOJI_CHOICES.map((emoji)=><button type="button" key={emoji} onClick={()=>setForm({...form,emoji})} className={`rounded-lg p-2 text-lg transition ${form.emoji===emoji?'bg-ember-500/15 ring-1 ring-ember-500/40':'hover:bg-white/5'}`} aria-label={`Choose ${emoji}`}>{emoji}</button>)}</div></div>
    {showDetails&&<label className="block"><span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-400">Description</span><textarea value={form.description} onChange={(e)=>setForm({...form,description:e.target.value})} maxLength={180} rows={3} className="stryven-input w-full resize-none" placeholder="Optional mission details"/></label>}
    <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={onCancel} className="btn-ghost">Cancel</button><button type="button" onClick={onSave} className="btn-primary">{saveLabel}</button></div>
  </div>;
}