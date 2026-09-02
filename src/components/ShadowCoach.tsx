import { useMemo, useState, type ReactNode } from 'react';
import { Activity, Brain, CalendarDays, CheckCircle2, Flame, MessageCircle, Shield, Sparkles, Target, TrendingUp, Zap } from 'lucide-react';
import { useStore } from '../store/useStore';

type Props={children:ReactNode};
type Mode='home'|'train'|'plan'|'analyze'|'chat';
const num=(v:unknown,f=0)=>typeof v==='number'&&Number.isFinite(v)?v:f;

export function ShadowCoach({children}:Props){
 const {state}=useStore(); const raw=state as unknown as Record<string,unknown>;
 const streak=num(raw.streak); const level=num(raw.level,1); const xp=num(raw.xp); const [mode,setMode]=useState<Mode>('home');
 const history=Array.isArray(raw.history)?raw.history as Array<Record<string,unknown>>:[];
 const recent=history.slice(-7); const workouts=recent.filter(x=>x.workoutCompleted===true).length; const completed=recent.filter(x=>x.allMainDone===true).length;
 const consistency=recent.length?Math.round(((completed+workouts)/(recent.length*2))*100):Math.min(100,streak*12);
 const score=Math.max(35,Math.min(98,Math.round(consistency*.65+Math.min(30,streak*3))));
 const phase=level<10?'Foundation':level<25?'Build':level<50?'Ascend':'Elite';
 const greeting=score>=80?'You are on track. Keep the standard.':score>=60?'Momentum is building. Stay consistent.':'Reset the rhythm. Small wins first.';
 const modeTitle={train:'TRAIN',plan:'TODAY\'S PLAN',analyze:'YOUR PROGRESS',chat:'TALK TO SHADOW'}[mode as Exclude<Mode,'home'>];
 const actionText=useMemo(()=>({train:'Open your workout and execute the session cleanly.',plan:'Your priority is consistency. Finish the important tasks before adding more.',analyze:`Last 7 days: ${completed} complete days and ${workouts} workout days. Consistency is ${consistency}%.`,chat:'Use the coach below when you want a direct conversation with Shadow.'}),[completed,workouts,consistency]);
 return <div className="space-y-4 sm:space-y-5">
   <section className="rounded-2xl border border-white/10 bg-black/45 p-4 sm:p-6">
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-ember-400/30 bg-ember-500/10"><Shield size={20} className="text-ember-300"/></div>
      <div className="min-w-0 flex-1"><div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.22em] text-ember-300"><Sparkles size={11}/> Shadow · Personal Coach</div><h1 className="mt-1 text-lg font-black sm:text-2xl">{greeting}</h1><p className="mt-1 text-[11px] text-slate-500">Phase: {phase} · Level {level} · {xp.toLocaleString()} XP</p></div>
      <div className="hidden sm:block rounded-xl border border-white/10 bg-white/[.03] px-3 py-2 text-center"><div className="text-[8px] text-slate-600">STREAK</div><b className="text-lg">{streak}</b></div>
    </div>
   </section>

   <section className="grid grid-cols-2 gap-2 sm:grid-cols-4">
    <CoachButton icon={<Activity size={17}/>} title="Train" text="Workout" active={mode==='train'} onClick={()=>setMode('train')}/>
    <CoachButton icon={<Target size={17}/>} title="Plan" text="Today" active={mode==='plan'} onClick={()=>setMode('plan')}/>
    <CoachButton icon={<TrendingUp size={17}/>} title="Analyze" text="Progress" active={mode==='analyze'} onClick={()=>setMode('analyze')}/>
    <CoachButton icon={<MessageCircle size={17}/>} title="Talk" text="Shadow" active={mode==='chat'} onClick={()=>setMode('chat')}/>
   </section>

   {mode!=='home'&&<section className="rounded-2xl border border-ember-500/20 bg-ember-500/[.04] p-4 sm:p-5">
     <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.2em] text-ember-300"><Brain size={13}/>{modeTitle}</div>
     <p className="mt-3 text-sm leading-6 text-slate-300">{actionText[mode as Exclude<Mode,'home'>]}</p>
     <div className="mt-3 flex flex-wrap gap-2 text-[10px] text-slate-500"><span className="rounded-lg bg-white/[.04] px-2 py-1">Streak {streak}</span><span className="rounded-lg bg-white/[.04] px-2 py-1">Level {level}</span><span className="rounded-lg bg-white/[.04] px-2 py-1">Score {score}</span></div>
   </section>}

   <section className="grid gap-3 sm:grid-cols-3">
    <Mini title="Readiness" value={`${score}%`} icon={<Zap size={14}/>}/><Mini title="Week" value={`${consistency}%`} icon={<CalendarDays size={14}/>}/><Mini title="Streak" value={String(streak)} icon={<Flame size={14}/>}/>
   </section>

   {mode==='chat'&&<div className="rounded-2xl border border-white/10 bg-black/25 p-2 sm:p-3">{children}</div>}
   {mode!=='chat'&&<div className="rounded-xl border border-white/[.07] bg-black/20 px-3 py-2 text-[10px] text-slate-500">Shadow only shows the detailed coach interface when you choose <b className="text-slate-300">Talk</b>. This keeps the page fast and clear.</div>}
 </div>;
}
function CoachButton({icon,title,text,active,onClick}:{icon:ReactNode;title:string;text:string;active:boolean;onClick:()=>void}){return <button onClick={onClick} className={`min-w-0 rounded-2xl border p-3 text-left ${active?'border-ember-500/35 bg-ember-500/[.08]':'border-white/10 bg-black/25 hover:bg-white/[.03]'}`}><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[.04] text-slate-300">{icon}</span><b className="mt-2 block text-sm text-white">{title}</b><span className="text-[9px] text-slate-600">{text}</span></button>}
function Mini({title,value,icon}:{title:string;value:string;icon:ReactNode}){return <div className="rounded-xl border border-white/10 bg-black/25 p-3"><div className="flex items-center gap-1 text-[9px] uppercase tracking-wider text-slate-600">{icon}{title}</div><b className="mt-1 block text-base text-white">{value}</b></div>}
