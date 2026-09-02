import { useMemo, useState, type ReactNode } from 'react';
import { Activity, Brain, Flame, Moon, Shield, Sparkles, Target, Zap } from 'lucide-react';
import { useStore } from '../store/useStore';

type Props={children:ReactNode};
type Mood='locked-in'|'normal'|'recovery';

const readNumber=(value:unknown,fallback=0)=>typeof value==='number'&&Number.isFinite(value)?value:fallback;

export function ShadowCoach({children}:Props){
 const {state}=useStore();
 const raw=state as unknown as Record<string,unknown>;
 const streak=readNumber(raw.streak,readNumber(raw.currentStreak));
 const level=readNumber(raw.level,1);
 const xp=readNumber(raw.xp,0);
 const today=new Date().toISOString().slice(0,10);
 const [mood,setMood]=useState<Mood>(()=>{try{return(localStorage.getItem('syrox-shadow-mood') as Mood)||'normal';}catch{return'normal'}});
 const [checked,setChecked]=useState(false);
 const readiness=useMemo(()=>{let score=68+Math.min(18,streak*2);if(mood==='locked-in')score+=10;if(mood==='recovery')score-=18;return Math.max(35,Math.min(98,score));},[streak,mood]);
 const phase=level<10?'Foundation':level<25?'Build':level<50?'Ascend':'Elite';
 const brief=mood==='recovery'?'Today is controlled recovery. Keep intensity honest and protect tomorrow.':mood==='locked-in'?'You are locked in. Push quality, not random volume.':'Stay consistent. One clean session beats an ambitious plan you will abandon.';
 const setMoodSafe=(next:Mood)=>{setMood(next);try{localStorage.setItem('syrox-shadow-mood',next);}catch{}};
 return <div className="space-y-4">
   <div className="relative overflow-hidden rounded-3xl border border-ember-500/25 bg-gradient-to-br from-black/80 via-ember-950/30 to-violet-950/20 p-4 sm:p-6 shadow-2xl">
    <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-ember-500/10 blur-3xl"/>
    <div className="relative grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
      <div className="flex items-start gap-3"><div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-ember-400/30 bg-ember-500/10"><div className="absolute inset-1 rounded-xl border border-white/5"/><Shield size={23} className="text-ember-300"/></div><div><div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.24em] text-ember-300"><Sparkles size={13}/> Shadow Coach · {phase}</div><h2 className="mt-1 text-lg font-black sm:text-xl">{brief}</h2><p className="mt-1 text-xs leading-5 text-slate-500">Shadow adapts the coaching layer around your current consistency instead of giving the same advice every day.</p></div></div>
      <div className="grid grid-cols-3 gap-2 sm:flex sm:items-center"><div className="rounded-xl border border-white/10 bg-white/[.03] px-3 py-2 text-center"><Flame size={14} className="mx-auto text-orange-300"/><b className="mt-1 block text-sm">{streak}</b><span className="text-[9px] text-slate-600">STREAK</span></div><div className="rounded-xl border border-white/10 bg-white/[.03] px-3 py-2 text-center"><Zap size={14} className="mx-auto text-yellow-300"/><b className="mt-1 block text-sm">{readiness}%</b><span className="text-[9px] text-slate-600">READINESS</span></div><div className="rounded-xl border border-white/10 bg-white/[.03] px-3 py-2 text-center"><Target size={14} className="mx-auto text-violet-300"/><b className="mt-1 block text-sm">Lv {level}</b><span className="text-[9px] text-slate-600">LEVEL</span></div></div>
    </div>
   </div>
   <div className="grid gap-3 lg:grid-cols-[1fr_280px]">
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4"><div className="flex items-center gap-2"><Brain size={17} className="text-violet-300"/><b className="text-sm">Daily check-in</b><span className="ml-auto text-[10px] text-slate-600">{today}</span></div><div className="mt-3 grid grid-cols-3 gap-2"><button onClick={()=>setMoodSafe('locked-in')} className={`rounded-xl border px-3 py-3 text-xs font-bold ${mood==='locked-in'?'border-ember-500/50 bg-ember-500/10 text-ember-200':'border-white/10 bg-white/[.02] text-slate-500'}`}>Locked in</button><button onClick={()=>setMoodSafe('normal')} className={`rounded-xl border px-3 py-3 text-xs font-bold ${mood==='normal'?'border-white/20 bg-white/[.07] text-white':'border-white/10 bg-white/[.02] text-slate-500'}`}>Normal</button><button onClick={()=>setMoodSafe('recovery')} className={`rounded-xl border px-3 py-3 text-xs font-bold ${mood==='recovery'?'border-violet-500/50 bg-violet-500/10 text-violet-200':'border-white/10 bg-white/[.02] text-slate-500'}`}>Recovery</button></div><button onClick={()=>setChecked(true)} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-4 py-2.5 text-xs font-black text-slate-300">{checked?'Check-in recorded':'Confirm today’s state'} <Activity size={14}/></button></div>
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4"><div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500"><Moon size={14}/> Coach rule</div><p className="mt-3 text-sm leading-6 text-slate-300">{mood==='recovery'?'Reduce volume before you reduce consistency.':'Progress when performance is stable; recover when quality drops.'}</p><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full bg-ember-500 transition-all" style={{width:`${readiness}%`}}/></div><div className="mt-1 flex justify-between text-[9px] text-slate-600"><span>Readiness</span><span>{xp.toLocaleString()} XP</span></div></div>
   </div>
   {children}
 </div>;
}
