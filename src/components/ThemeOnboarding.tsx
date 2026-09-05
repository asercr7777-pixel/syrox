import { useState } from 'react';
import type { SiteTheme } from '../store/types';

const themes: { id: SiteTheme; name: string; desc: string }[] = [
  { id: 'forge', name: 'Forge', desc: 'Forged fire' },
  { id: 'void', name: 'Void', desc: 'Dark precision' },
  { id: 'nexus', name: 'Nexus', desc: 'Neon command' },
  { id: 'shogun', name: 'Shogun', desc: 'Warrior focus' },
  { id: 'titan', name: 'Titan', desc: 'Heavy power' },
  { id: 'rogue', name: 'Rogue', desc: 'Silent speed' },
  { id: 'eclipse', name: 'Eclipse', desc: 'Dark celestial' },
  { id: 'overdrive', name: 'Overdrive', desc: 'Maximum intensity' },
];

export function ThemeOnboarding({ onChoose }: { onChoose: (theme: SiteTheme) => void }) {
  const [selected, setSelected] = useState<SiteTheme>('void');
  const choose = () => { localStorage.setItem('stryven-theme-selected', '1'); onChoose(selected); };
  return <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/90 backdrop-blur-md p-4 sm:p-8 flex items-center justify-center"><div className="w-full max-w-4xl"><div className="text-center mb-8"><p className="text-xs uppercase tracking-[0.35em] theme-accent">Welcome to</p><h1 className="font-display text-5xl sm:text-7xl font-black mt-2">STRYVEN</h1><p className="text-ink-300 mt-3">Choose your visual identity. You can change it later.</p></div><div className="grid grid-cols-2 md:grid-cols-4 gap-3">{themes.map(t => <button key={t.id} onClick={() => setSelected(t.id)} className={`card p-4 text-left min-h-28 transition-all ${selected === t.id ? 'theme-accent-border theme-accent-bg scale-[1.02]' : 'hover:border-white/20'}`}><div className="h-9 w-9 rounded-full mb-4 theme-accent-bg border theme-accent-border"/><p className="font-bold">{t.name}</p><p className="text-xs text-ink-400 mt-1">{t.desc}</p></button>)}</div><button onClick={choose} className="btn-primary w-full mt-6 py-3 text-base">Enter STRYVEN</button></div></div>;
}
export default ThemeOnboarding;
