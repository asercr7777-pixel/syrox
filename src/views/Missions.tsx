import { useEffect, useState, type FormEvent } from 'react';
import { CheckCircle2, Circle, Plus, Target, Zap, Trash2, Pencil, Save, X } from 'lucide-react';
import { useStore } from '../store/useStore';
import { capTaskXp } from '../lib/progression';

export function Missions() {
  const { state, toggleCoreTask, toggleCustomTask, addCustomTask, updateCustomTask, deleteCustomTask, addMainTask, updateMainTask, deleteMainTask } = useStore();
  const [essentialLabel, setEssentialLabel] = useState('');
  const [essentialXp, setEssentialXp] = useState('100');
  const [extraLabel, setExtraLabel] = useState('');
  const [extraXp, setExtraXp] = useState('50');
  const [editing, setEditing] = useState<{id:string; kind:'essential'|'extra'; label:string; points:string}|null>(null);

  useEffect(() => {
    if (!editing) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setEditing(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [editing]);

  const essential = [...state.mainTasks].filter(task => task.enabled).sort((a,b)=>a.order-b.order);
  const extra = state.customTasks;
  const essentialDone = essential.filter(task => Boolean(state.coreCompleted[task.id])).length;
  const extraDone = extra.filter(task => Boolean(state.customCompleted[task.id])).length;
  const total = essential.length + extra.length;
  const done = essentialDone + extraDone;
  const progress = total ? Math.round(done / total * 100) : 0;

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

  return <div className="sv-command sv-page-module sv-missions-rebuild">
    <header className="sv-module-header">
      <div><p className="sv-eyebrow"><Target size={14}/> STRYVEN / OBJECTIVES</p><h1>Missions</h1><p>Two mission classes. One system. Every completion is confirmed by you.</p></div>
      <div className="sv-identity-rank"><Zap size={16}/><b>{done}/{total} TODAY</b></div>
    </header>

    <section className="sv-section sv-surface sv-mission-overview">
      <div className="sv-section-head"><div><p className="sv-eyebrow">DAILY OBJECTIVES</p><h2>Mission Progress</h2><p>{done} of {total} missions confirmed today.</p></div><strong>{progress}%</strong></div>
      <div className="sv-page-progress"><span style={{width:`${progress}%`}}/></div>
      <div className="sv-mission-xp-goal"><div><span>DAILY XP LIMIT</span><b>{state.dailyXp.toLocaleString()} / 10,000 XP</b></div><div className="sv-page-progress"><span style={{width:`${Math.min(100,state.dailyXp/10000*100)}%`}}/></div></div>
    </section>

    <section className="sv-section sv-surface sv-mission-class sv-mission-class--essential">
      <div className="sv-section-head"><div><p className="sv-eyebrow">01 // CORE PROTOCOL</p><h2>Basic Tasks</h2><p>Your essential daily commitments. Complete these first.</p></div><span>{essentialDone}/{essential.length}</span></div>
      <div className="sv-mission-list">
        {essential.map(task => { const complete=Boolean(state.coreCompleted[task.id]); return <article className={`sv-mission-row ${complete?'is-complete':''}`} key={task.id}>
          <button type="button" disabled={complete} aria-label={complete?'Mission completed':'Confirm mission complete'} onClick={()=>toggleCoreTask(task.id)}>{complete?<CheckCircle2 size={21}/>:<Circle size={21}/>}</button>
          <span className="sv-mission-icon">{task.emoji}</span>
          <div className="sv-mission-copy"><b>{task.label}</b><small>{task.description || task.category.toUpperCase()}</small></div>
          {complete && <span className="sv-claimed-badge">CLAIMED</span>}
          <strong>+{task.points} XP</strong>
          <button type="button" className="sv-mission-edit" aria-label={`Edit ${task.label}`} onClick={()=>setEditing({id:task.id,kind:'essential',label:task.label,points:String(task.points)})}><Pencil size={14}/></button>
          <button type="button" className="sv-mission-delete" aria-label={`Delete ${task.label}`} onClick={()=>deleteMainTask(task.id)}><Trash2 size={14}/></button>
        </article>; })}
        {!essential.length && <div className="sv-empty-record">NO BASIC TASKS. ADD YOUR FIRST CORE COMMITMENT BELOW.</div>}
      </div>
      <form className="sv-add-mission" onSubmit={addEssential}>
        <label><span>NEW BASIC TASK</span><input value={essentialLabel} onChange={e=>setEssentialLabel(e.target.value)} maxLength={90} placeholder="Add a core basic task…" required/></label>
        <label className="sv-xp-input"><span>XP</span><input type="number" min="0" max="200" value={essentialXp} onChange={e=>setEssentialXp(e.target.value)}/></label>
        <button type="submit"><Plus size={16}/> Add basic task</button>
      </form>
    </section>

    <section className="sv-section sv-surface sv-mission-class sv-mission-class--extra">
      <div className="sv-section-head"><div><p className="sv-eyebrow">02 // BONUS PROTOCOL</p><h2>Non-Basic Tasks</h2><p>Extra challenges and custom objectives beyond the basics.</p></div><span>{extraDone}/{extra.length}</span></div>
      <div className="sv-mission-list">
        {extra.map(task => { const complete=Boolean(state.customCompleted[task.id]); return <article className={`sv-mission-row ${complete?'is-complete':''}`} key={task.id}>
          <button type="button" disabled={complete} aria-label={complete?'Mission completed':'Confirm mission complete'} onClick={()=>toggleCustomTask(task.id)}>{complete?<CheckCircle2 size={21}/>:<Circle size={21}/>}</button>
          <span className="sv-mission-icon">✦</span>
          <div className="sv-mission-copy"><b>{task.label}</b><small>NON-BASIC / PERSONAL MISSION</small></div>
          {complete && <span className="sv-claimed-badge">CLAIMED</span>}
          <strong>+{task.points} XP</strong>
          <button type="button" className="sv-mission-edit" aria-label={`Edit ${task.label}`} onClick={()=>setEditing({id:task.id,kind:'extra',label:task.label,points:String(task.points)})}><Pencil size={14}/></button>
          <button type="button" className="sv-mission-delete" aria-label={`Delete ${task.label}`} onClick={()=>deleteCustomTask(task.id)}><Trash2 size={14}/></button>
        </article>; })}
        {!extra.length && <div className="sv-empty-record">NO NON-BASIC TASKS ADDED YET.</div>}
      </div>
      <form className="sv-add-mission" onSubmit={addExtra}>
        <label><span>NEW NON-BASIC TASK</span><input value={extraLabel} onChange={e=>setExtraLabel(e.target.value)} maxLength={90} placeholder="Add a non-basic task…" required/></label>
        <label className="sv-xp-input"><span>XP</span><input type="number" min="0" max="200" value={extraXp} onChange={e=>setExtraXp(e.target.value)}/></label>
        <button type="submit"><Plus size={16}/> Add non-basic task</button>
      </form>
    </section>

    {editing && <div className="sv-mission-edit-overlay" role="dialog" aria-modal="true" aria-label="Edit mission" onClick={() => setEditing(null)}>
      <form className="sv-mission-edit-modal" onSubmit={saveEdit} onClick={e => e.stopPropagation()}>
        <div><span className="sv-eyebrow">MISSION CONFIGURATION</span><button type="button" onClick={()=>setEditing(null)} aria-label="Close"><X size={18}/></button></div>
        <label>Mission name<input autoFocus value={editing.label} onChange={e=>setEditing({...editing,label:e.target.value})} maxLength={90} required/></label>
        <label>XP reward<input type="number" min="0" max="200" value={editing.points} onChange={e=>setEditing({...editing,points:e.target.value})}/></label>
        <button type="submit"><Save size={15}/> Save changes</button>
      </form>
    </div>}
  </div>;
}
