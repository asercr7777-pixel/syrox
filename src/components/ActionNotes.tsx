import { useMemo, useState } from 'react';
import { Check, Plus, Trash2, X, Zap } from 'lucide-react';
import { useStore } from '../store/useStore';
import { toast } from './ui/Toast';

const MAX_XP = 100;

export function ActionNotes() {
  const { state, addCustomTask, toggleCustomTask, deleteCustomTask } = useStore();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [xp, setXp] = useState(10);

  const notes = useMemo(() => [...state.customTasks].sort((a,b) => b.createdAt - a.createdAt), [state.customTasks]);
  const completed = notes.filter(note => state.customCompleted[note.id]).length;

  const create = () => {
    const label = text.trim();
    if (!label) return;
    addCustomTask(label, '✦', Math.min(MAX_XP, Math.max(5, xp)));
    setText('');
    setXp(10);
    setOpen(false);
    toast({ title: 'Action added', message: 'Complete it to claim its XP.', type: 'success' });
  };

  return <section className="sv-action-notes">
    <div className="sv-action-notes__head">
      <div>
        <span className="sv-eyebrow">02 // PERSONAL COMMANDS</span>
        <h2>Action Notes</h2>
        <p>Write what you need to do. Give it XP. Execute it.</p>
      </div>
      <button className="sv-action-add" onClick={() => setOpen(true)}><Plus size={16}/> ADD ACTION</button>
    </div>

    <div className="sv-action-notes__meta">
      <span><Zap size={13}/> {notes.reduce((sum,n)=>sum+n.points,0).toLocaleString()} XP AVAILABLE</span>
      <span>{completed}/{notes.length} COMPLETE</span>
    </div>

    <div className="sv-action-notes__list">
      {notes.length === 0 && <div className="sv-action-empty"><span>✦</span><strong>NO ACTIONS QUEUED</strong><small>Turn anything you need to do into an XP action.</small></div>}
      {notes.map(note => {
        const done = !!state.customCompleted[note.id];
        return <div key={note.id} className={'sv-action-note '+(done?'is-complete':'')}>
          <button className="sv-action-check" onClick={() => toggleCustomTask(note.id)} aria-label={done ? 'Reopen action' : 'Complete action'}><Check size={16}/></button>
          <div className="sv-action-note__body">
            <strong>{note.label}</strong>
            <span>{done ? 'COMPLETED' : 'READY FOR EXECUTION'}</span>
          </div>
          <b className="sv-action-xp">+{note.points} XP</b>
          <button className="sv-action-delete" onClick={() => deleteCustomTask(note.id)} aria-label="Delete action"><Trash2 size={14}/></button>
        </div>;
      })}
    </div>

    {open && <div className="sv-action-modal" role="dialog" aria-modal="true" aria-label="Add action">
      <button className="sv-action-modal__backdrop" onClick={() => setOpen(false)} aria-label="Close"/>
      <div className="sv-action-modal__panel">
        <button className="sv-action-modal__close" onClick={() => setOpen(false)} aria-label="Close"><X size={17}/></button>
        <span className="sv-eyebrow">NEW PERSONAL COMMAND</span>
        <h3>What will you execute?</h3>
        <p>Every completed action rewards the XP you assign.</p>
        <label>Action<input autoFocus maxLength={100} value={text} onChange={e=>setText(e.target.value)} placeholder="e.g. Study Physics for 30 minutes"/></label>
        <label>XP REWARD<input type="number" min={5} max={MAX_XP} value={xp} onChange={e=>setXp(Math.min(MAX_XP, Math.max(5, Number(e.target.value)||5)))} /></label>
        <div className="sv-action-presets">{[10,25,50,70,100].map(value=><button key={value} className={xp===value?'is-selected':''} onClick={()=>setXp(value)}>+{value}</button>)}</div>
        <button className="sv-action-create" onClick={create} disabled={!text.trim()}><Zap size={16}/> CREATE ACTION</button>
      </div>
    </div>}
  </section>;
}
