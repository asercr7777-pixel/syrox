import { useState } from 'react';
import { Palette, Check, X } from 'lucide-react';
import { useStore } from '../store/useStore';
import type { SiteTheme } from '../store/types';

const THEMES: Array<{ id: SiteTheme; name: string; description: string; colors: string[] }> = [
  { id: 'shadow', name: 'Shadow', description: 'Tactical • dark • angular', colors: ['#0b0c13', '#8b5cf6', '#c4b5fd'] },
  { id: 'ember', name: 'Ember', description: 'Forge • heat • aggressive', colors: ['#1e0e06', '#ff7a18', '#ffb27a'] },
  { id: 'frost', name: 'Frost', description: 'Crystal • glass • clean', colors: ['#0d1d2a', '#38bdf8', '#a5f3fc'] },
  { id: 'ocean', name: 'Ocean', description: 'Deep • holographic • calm', colors: ['#051220', '#2563eb', '#67e8f9'] },
  { id: 'emerald', name: 'Emerald', description: 'Nature • status • growth', colors: ['#071811', '#10b981', '#86efac'] },
  { id: 'crimson', name: 'Crimson', description: 'Boss arena • sharp • intense', colors: ['#22070b', '#e11d48', '#fda4af'] },
  { id: 'royal', name: 'Royal', description: 'Fantasy • premium • legendary', colors: ['#140d28', '#6366f1', '#c4b5fd'] },
  { id: 'gold', name: 'Gold', description: 'Luxury • achievement • elite', colors: ['#201908', '#f59e0b', '#fde68a'] },
];

export function ThemePicker() {
  const { state, updateProfile, setNote } = useStore();
  const [open, setOpen] = useState(false);
  const firstTime = state.xp === 0 && state.totalPoints === 0 && !state.notes.__theme_selected__;

  const choose = (theme: SiteTheme) => {
    updateProfile({ theme });
    setNote('__theme_selected__', theme);
    setOpen(false);
  };

  return <>
    <button onClick={() => setOpen(true)} aria-label="Choose site design" className="fixed right-3 bottom-20 lg:bottom-5 z-[80] w-11 h-11 rounded-full border border-white/10 bg-ink-900/90 backdrop-blur-xl flex items-center justify-center shadow-xl hover:scale-105 transition-transform"><Palette size={19} className="text-[rgb(var(--accent-400))]" /></button>
    {(open || firstTime) && <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 bg-ink-950/95 p-5 sm:p-7 shadow-2xl">
        <div className="flex items-start justify-between gap-4 mb-6"><div><p className="text-xs uppercase tracking-[0.25em] text-[rgb(var(--accent-400))]">Forged System</p><h2 className="font-display text-2xl sm:text-3xl font-bold mt-1">Choose Your Design</h2><p className="text-sm text-ink-300 mt-1">The choice changes the entire interface — cards, buttons, surfaces, borders and atmosphere.</p></div>{!firstTime && <button onClick={() => setOpen(false)} className="p-2 rounded-xl hover:bg-white/10"><X size={20} /></button>}</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">{THEMES.map((theme) => <button key={theme.id} onClick={() => choose(theme.id)} className={`text-left rounded-2xl p-4 border transition-all hover:-translate-y-1 ${state.theme === theme.id ? 'border-[rgb(var(--accent-400))] ring-1 ring-[rgb(var(--accent-400)/35%)]' : 'border-white/10 hover:border-white/25'}`} style={{ background: `linear-gradient(145deg, ${theme.colors[0]}, #08090e)` }}>
          <div className="flex gap-1.5 mb-4">{theme.colors.map((c) => <span key={c} className="w-7 h-7 rounded-full border border-white/10" style={{ background: c }} />)}</div><div className="flex items-center justify-between"><div><p className="font-bold">{theme.name}</p><p className="text-xs text-ink-300 mt-0.5">{theme.description}</p></div>{state.theme === theme.id && <Check size={18} className="text-[rgb(var(--accent-400))]" />}</div>
        </button>)}</div>
      </div>
    </div>}
  </>;
}
