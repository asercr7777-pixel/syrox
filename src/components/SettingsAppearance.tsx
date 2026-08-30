import { useEffect, useState } from 'react';
import { Check, Palette } from 'lucide-react';
import type { SiteTheme } from '../store/types';
import { useStore } from '../store/useStore';

const THEMES: Array<{ id: SiteTheme; label: string; accent: string; description: string }> = [
  { id: 'forge', label: 'FORGE', accent: '#ff6a1a', description: 'Industrial heat' },
  { id: 'void', label: 'VOID', accent: '#8b5cf6', description: 'Cosmic depth' },
  { id: 'nexus', label: 'NEXUS', accent: '#22d3ee', description: 'Cyber command' },
  { id: 'shogun', label: 'SHOGUN', accent: '#ef4444', description: 'Warrior discipline' },
  { id: 'titan', label: 'TITAN', accent: '#eab308', description: 'Monumental power' },
  { id: 'rogue', label: 'ROGUE', accent: '#84cc16', description: 'Wasteland survival' },
  { id: 'eclipse', label: 'ECLIPSE', accent: '#a78bfa', description: 'Occult night' },
  { id: 'overdrive', label: 'OVERDRIVE', accent: '#facc15', description: 'Velocity mode' },
];
const COLORS = ['#050505', '#0b1220', '#111827', '#1e1033', '#190b0b', '#092019', '#1a1407', '#101010'];

export function SettingsAppearance() {
  const { state, updateProfile } = useStore();
  const [customColor, setCustomColor] = useState(() => localStorage.getItem('stryven-custom-bg-color') || '');

  useEffect(() => {
    const onStorage = () => setCustomColor(localStorage.getItem('stryven-custom-bg-color') || '');
    window.addEventListener('stryven-background-change', onStorage);
    return () => window.removeEventListener('stryven-background-change', onStorage);
  }, []);

  const chooseTheme = (theme: SiteTheme) => {
    updateProfile({ theme });
    localStorage.removeItem('stryven-custom-bg-color');
    setCustomColor('');
    window.dispatchEvent(new Event('stryven-background-change'));
  };

  const chooseColor = (color: string) => {
    localStorage.setItem('stryven-custom-bg-color', color);
    setCustomColor(color);
    window.dispatchEvent(new Event('stryven-background-change'));
  };

  return (
    <div className="card p-5 space-y-6">
      <div>
        <h2 className="font-display text-lg font-bold flex items-center gap-2"><Palette size={18} /> Visual Identity</h2>
        <p className="text-xs text-ink-400 mt-1">Choose a STRYVEN theme or replace its background with your own visual.</p>
      </div>

      <div>
        <div className="label mb-2">Themes</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {THEMES.map((theme) => {
            const active = state.theme === theme.id && !customColor;
            return (
              <button key={theme.id} type="button" onClick={() => chooseTheme(theme.id)} className={`relative overflow-hidden text-left p-3 rounded-xl border transition-all ${active ? 'border-white/40 bg-white/10' : 'border-white/5 bg-ink-950/50 hover:bg-white/5'}`}>
                <span className="absolute left-0 top-0 bottom-0 w-1" style={{ background: theme.accent }} />
                <div className="pl-2">
                  <div className="font-display font-black text-xs tracking-wider">{theme.label}</div>
                  <div className="text-[10px] text-ink-400 mt-1">{theme.description}</div>
                </div>
                {active && <Check size={14} className="absolute right-2 top-2" />}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="label mb-2">Custom Site Color</div>
        <div className="flex flex-wrap gap-2 mb-3">
          {COLORS.map((color) => (
            <button key={color} type="button" aria-label={`Use ${color}`} onClick={() => chooseColor(color)} className={`w-9 h-9 rounded-lg border transition ${customColor.toLowerCase() === color.toLowerCase() ? 'ring-2 ring-white ring-offset-2 ring-offset-ink-900' : 'border-white/10'}`} style={{ backgroundColor: color }} />
          ))}
          <label className={`w-9 h-9 rounded-lg border border-dashed border-white/20 cursor-pointer overflow-hidden ${customColor ? 'ring-2 ring-white/50' : ''}`} title="Pick any color">
            <input type="color" value={customColor || '#080808'} onChange={(e) => chooseColor(e.target.value)} className="w-full h-full opacity-0 cursor-pointer" />
            <span className="block -mt-9 w-full h-full pointer-events-none" style={{ background: customColor || 'conic-gradient(#ff7a18,#8b5cf6,#22d3ee,#84cc16,#ff7a18)' }} />
          </label>
        </div>
        <p className="text-xs text-ink-400">Choosing a custom color or your own image/video turns off the theme atmosphere until you switch back.</p>
      </div>
    </div>
  );
}
