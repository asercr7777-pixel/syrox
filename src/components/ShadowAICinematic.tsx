import { useEffect, useMemo, useState } from 'react';
import { Brain, Check, Dumbbell, Flame, Gauge, RotateCcw, Target, Timer, Trophy } from 'lucide-react';

type Exercise={name:string;sets:number;reps:string;rest:string};
const KEY='syrox-shadow-coach-v3';
const EXERCISES:Exercise[]=[
{name:'Tempo Push-Ups',sets:4,reps:'8–15',rest:'75s'},
{name:'Pike Push-Ups',sets:4,reps:'6–12',rest:'90s'},
{name:'Reverse Lunges',sets:4,reps:'8–14 / leg',rest:'75s'},
{name:'Split Squats',sets:4,reps:'8–14 / leg',rest:'90s'},
{name:'Hollow Body Hold',sets:3,reps:'25–45 sec',rest:'45s'},
{name:'Pogo Jumps',sets:4,reps:'15–25',rest:'60s'}
];
const DAYS=['Push + Power','Pull + Core','Legs + Power','Upper + Core','Lower + Power','Conditioning + Mobility'];
export default function ShadowAICinematic(){
 const [day,setDay]=useState(1); const [week,setWeek]=useState(1); const [done,setDone]=useState<Record<string,boolean>>({}); const [seconds,setSeconds]=useState(0); const [running,setRunning]=useState(false);
 const exercises=useMemo(()=>EXERCISES.map((e,i)=>({...e,sets:week===4?Math.max(2,e.sets-1):week===3?Math.min(5,e.sets+1):e.sets})),[week]);
 useEffect(()=>{try{localStorage.setItem(KEY,JSON.stringify({day,week,done}))}catch{}},[day,week,done]);
 useEffect(()=>{if(!running)return;const id=window.setInterval(()=>setSeconds(v=>v+1),1000);return()=>window.clearInterval(id)},[running]);
 const completed=exercises.filter((_,i)=>done[`${week}-${day}-${i}`]).length;
 const finish=()=>{if(completed!==exercises.length)return;setDone({});if(day<6)setDay(day+1);else{setDay(1);setWeek(week<4?week+1:1)}};
 return <section className="min-h-[70vh] space-y-4 pb-8 text-white">
  <div className="flex flex-wrap items-center justify-between gap-3"><div><div className="flex items-center gap-2 text-xs font-black uppercase tracking-[.3em] text-white/35"><Brain size={15}/> SHADOW // PERSONAL COACH</div><h1 className="mt-1 text-3xl font-black sm:text-4xl">Adaptive Training System</h1></div><button onClick={()=>{setDay(1);setWeek(1);setDone({});setSeconds(0)}} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold"><RotateCcw size={14}/> Reset</button></div>
  <div className="grid gap-3 sm:grid-cols-4"><Stat icon={<Gauge/>} label="Coach score" value="90/100"/><Stat icon={<Flame/>} label="Cycle" value={`${week}/4`}/><Stat icon={<Target/>} label="Today" value={`${completed}/${exercises.length}`}/><Stat icon={<Trophy/>} label="Day" value={`${day}/6`}/></div>
  <div className="flex gap-2 overflow-x-auto pb-1">{DAYS.map((name,i)=><button key={name} onClick={()=>setDay(i+1)} className={`min-w-[145px] rounded-xl border p-3 text-left ${day===i+1?'border-white/25 bg-white/10':'border-white/10 bg-black/20'}`}><span className="text-[10px] font-bold uppercase tracking-widest text-white/35">DAY {i+1}</span><b className="mt-1 block text-xs">{name}</b></button>)}</div>
  <div className="rounded-[1.5rem] border border-white/10 bg-black/30 p-5"><div className="flex items-center justify-between"><div><div className="text-xs font-black uppercase tracking-widest text-white/35">WEEK {week} · DAY {day}</div><h2 className="mt-1 text-2xl font-black">{DAYS[day-1]}</h2></div><div className="text-2xl font-black">{Math.round(completed/exercises.length*100)}%</div></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-white transition-all" style={{width:`${completed/exercises.length*100}%`}}/></div></div>
  <div className="space-y-2">{exercises.map((e,i)=>{const key=`${week}-${day}-${i}`;const checked=!!done[key];return <div key={e.name} className={`rounded-2xl border p-4 ${checked?'border-white/15 bg-white/10 opacity-60':'border-white/10 bg-black/30'}`}><div className="flex items-center gap-3"><button onClick={()=>setDone(v=>({...v,[key]:!v[key]}))} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5">{checked?<Check size={17}/>:i+1}</button><div className="min-w-0 flex-1"><b className={checked?'line-through':''}>{e.name}</b><div className="mt-1 text-xs text-white/40">{e.sets} sets · {e.reps} · Rest {e.rest}</div></div><Dumbbell size={16} className="text-white/25"/></div></div>})}</div>
  <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/30 p-4"><div><b className="block">Session Timer</b><span className="text-xs text-white/35">{String(Math.floor(seconds/60)).padStart(2,'0')}:{String(seconds%60).padStart(2,'0')}</span></div><div className="flex gap-2"><button onClick={()=>setRunning(v=>!v)} className="rounded-xl bg-white px-4 py-2 text-xs font-black text-black">{running?'PAUSE':'START'}</button><button onClick={()=>{setRunning(false);setSeconds(0)}} className="rounded-xl border border-white/10 px-4 py-2 text-xs font-black">RESET</button><button onClick={finish} disabled={completed!==exercises.length} className="rounded-xl border border-white/10 px-4 py-2 text-xs font-black disabled:opacity-30">{day===6?'COMPLETE WEEK':'COMPLETE DAY'}</button></div></div>
 </section>;
}
function Stat({icon,label,value}:{icon:React.ReactNode;label:string;value:string}){return <div className="rounded-2xl border border-white/10 bg-black/30 p-4"><div className="mb-2 text-white/40">{icon}</div><span className="block text-[10px] uppercase tracking-widest text-white/35">{label}</span><b className="mt-1 block">{value}</b></div>}
