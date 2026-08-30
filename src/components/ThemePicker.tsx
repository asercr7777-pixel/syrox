import { useEffect } from 'react';
import { Check, Palette, X } from 'lucide-react';
import type { SiteTheme } from '../store/types';
import '../theme-picker.css';

const THEMES: {id: SiteTheme; name: string; description: string; previewClass: string}[] = [
  {id:'forge',name:'FORGE',description:'Brutal industrial steel',previewClass:'theme-preview-forge'},
  {id:'void',name:'VOID',description:'Cosmic dark space',previewClass:'theme-preview-void'},
  {id:'nexus',name:'NEXUS',description:'Futuristic AI cyber',previewClass:'theme-preview-nexus'},
  {id:'shogun',name:'SHOGUN',description:'Japanese warrior',previewClass:'theme-preview-shogun'},
  {id:'titan',name:'TITAN',description:'Ancient godlike power',previewClass:'theme-preview-titan'},
  {id:'rogue',name:'ROGUE',description:'Post-apocalyptic survival',previewClass:'theme-preview-rogue'},
  {id:'eclipse',name:'ECLIPSE',description:'Dark fantasy mystery',previewClass:'theme-preview-eclipse'},
  {id:'overdrive',name:'OVERDRIVE',description:'Extreme speed and energy',previewClass:'theme-preview-overdrive'},
];

export function ThemePicker({value,onChange,onClose}:{value:SiteTheme;onChange:(theme:SiteTheme)=>void;onClose:()=>void}){
 useEffect(()=>{const onKey=(e:KeyboardEvent)=>e.key==='Escape'&&onClose();window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey)},[onClose]);
 return <div className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}><div className="card w-full max-w-3xl p-5 sm:p-7 shadow-2xl"><div className="flex items-center justify-between mb-5"><div className="flex items-center gap-3"><div className="w-11 h-11 rounded-xl theme-accent-bg flex items-center justify-center"><Palette className="theme-accent"/></div><div><p className="text-xs uppercase tracking-[.25em] theme-accent">STRYVEN</p><h2 className="font-display text-2xl font-black">Choose your Theme</h2><p className="text-xs text-ink-400 mt-1">Eight completely different visual identities for the entire system.</p></div></div><button className="btn-ghost p-2" onClick={onClose}><X/></button></div><div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{THEMES.map(t=><button key={t.id} onClick={()=>onChange(t.id)} className={`text-left rounded-2xl border p-2 transition-transform hover:-translate-y-1 ${value===t.id?'theme-accent-border ring-2 ring-[rgb(var(--accent-500)/.25)]':'border-white/10'}`}><div className={`h-20 rounded-xl mb-3 relative overflow-hidden ${t.previewClass}`}><div className="theme-preview-noise absolute inset-0"/>{value===t.id&&<span className="absolute top-2 right-2 rounded-full bg-black/60 p-1"><Check size={15}/></span>}</div><p className="font-bold tracking-wide">{t.name}</p><p className="text-xs text-ink-400 mt-0.5">{t.description}</p></button>)}</div></div></div>
}
export default ThemePicker;
