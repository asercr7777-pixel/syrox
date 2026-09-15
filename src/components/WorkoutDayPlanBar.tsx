import { useEffect, useMemo, useState } from 'react';
import { Check, Pencil, RotateCcw } from 'lucide-react';

type Day = { id: string; fallback: string };
const DAYS: Day[] = [
  { id: 'day1', fallback: 'Day 1' },
  { id: 'day2', fallback: 'Day 2' },
  { id: 'day3', fallback: 'Day 3' },
  { id: 'day4', fallback: 'Day 4' },
  { id: 'day5', fallback: 'Day 5' },
  { id: 'day6', fallback: 'Day 6' },
];
const STORAGE_KEY = 'stryven-workout-day-names-v1';
const MODE_INDEX = [0, 1, 2, 3, 4, 5];

function readNames(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (Array.isArray(parsed) && parsed.length === 6) return parsed.map((v, i) => String(v || DAYS[i].fallback));
  } catch {}
  return DAYS.map(d => d.fallback);
}

export function WorkoutDayPlanBar() {
  const [names, setNames] = useState<string[]>(readNames);
  const [editing, setEditing] = useState<number | null>(null);
  const [draft, setDraft] = useState('');
  const [active, setActive] = useState(0);

  const saveNames = (next: string[]) => {
    setNames(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
  };

  const modeButtons = useMemo(() => () => Array.from(document.querySelectorAll<HTMLButtonElement>('.workout-v2-mode')), []);

  const selectDay = (index: number) => {
    const buttons = modeButtons();
    const target = buttons[MODE_INDEX[index]];
    if (target) {
      target.click();
      setActive(index);
      window.setTimeout(() => syncVisibleNames(index), 0);
    }
  };

  const syncVisibleNames = (index: number) => {
    const name = names[index] || DAYS[index].fallback;
    const commandTitle = document.querySelector<HTMLElement>('.workout-v2-command-top h2');
    if (commandTitle) commandTitle.textContent = `${name} Protocol`;
    const splitTitle = document.querySelector<HTMLElement>('.workout-v2-progress-card .workout-v2-section-head h2');
    if (splitTitle) splitTitle.textContent = name;
  };

  useEffect(() => {
    const observer = new MutationObserver(() => syncVisibleNames(active));
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    const timer = window.setTimeout(() => syncVisibleNames(active), 50);
    return () => { observer.disconnect(); window.clearTimeout(timer); };
  }, [active, names]);

  const startEdit = (index: number) => {
    setEditing(index);
    setDraft(names[index]);
  };

  const commitEdit = () => {
    if (editing === null) return;
    const value = draft.trim().slice(0, 32) || DAYS[editing].fallback;
    const next = [...names];
    next[editing] = value;
    saveNames(next);
    setEditing(null);
    setDraft('');
    window.setTimeout(() => syncVisibleNames(editing), 0);
  };

  const resetNames = () => {
    const next = DAYS.map(d => d.fallback);
    saveNames(next);
    setEditing(null);
    setDraft('');
    window.setTimeout(() => syncVisibleNames(active), 0);
  };

  return (
    <section className="stryven-six-day-plan">
      <div className="stryven-six-day-plan-head">
        <div>
          <span className="workout-v2-kicker">TRAINING PLAN</span>
          <h2>6-Day Training System</h2>
          <p>Choose the name of every training day. The day names are saved for this account/device.</p>
        </div>
        <button className="btn-ghost" onClick={resetNames} title="Reset day names"><RotateCcw size={15} /> Reset Names</button>
      </div>
      <div className="stryven-six-day-grid">
        {DAYS.map((day, index) => (
          <div key={day.id} className={`stryven-six-day ${active === index ? 'active' : ''}`}>
            <button className="stryven-six-day-main" onClick={() => selectDay(index)}>
              <span className="stryven-six-day-code">0{index + 1}</span>
              {editing === index ? (
                <input
                  autoFocus
                  value={draft}
                  maxLength={32}
                  onChange={e => setDraft(e.target.value)}
                  onClick={e => e.stopPropagation()}
                  onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditing(null); }}
                  aria-label={`Name for ${day.fallback}`}
                />
              ) : <strong>{names[index]}</strong>}
            </button>
            {editing === index ? (
              <button className="stryven-six-day-action" onClick={commitEdit} title="Save name"><Check size={15} /></button>
            ) : (
              <button className="stryven-six-day-action" onClick={() => startEdit(index)} title="Rename day"><Pencil size={14} /></button>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
