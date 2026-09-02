import { useMemo, useState } from 'react';
import { Activity, ArrowRight, Brain, Check, ChevronLeft, Dumbbell, Flame, Gauge, RotateCcw, Target, Timer, UserRound } from 'lucide-react';

type Profile = { weight:number; height:number; age:number; level:string; goal:string; days:number; duration:number; equipment:string; focus:string };
type Exercise = { name:string; sets:number; reps:string; rest:string; note:string; level:number };

const defaults:Profile={weight:70,height:175,age:18,level:'intermediate',goal:'strength',days:4,duration:50,equipment:'none',focus:'full body'};
const library:Record<string,Exercise[]>={
 strength:[
  {name:'Tempo Push-Ups',sets:4,reps:'8–15',rest:'60–90s',note:'3 sec down, explosive up.',level:2},
  {name:'Pike Push-Ups',sets:4,reps:'6–12',rest:'75s',note:'Keep hips high and control the descent.',level:2},
  {name:'Split Squats',sets:4,reps:'10–14 / leg',rest:'75s',note:'Drive through the front foot.',level:1},
  {name:'Single-Leg Glute Bridge',sets:3,reps:'12–18 / leg',rest:'45s',note:'Pause hard at the top.',level:1},
  {name:'Hollow Body Hold',sets:3,reps:'25–45 sec',rest:'45s',note:'Lower back stays pressed down.',level:1},
  {name:'Explosive Push-Ups',sets:3,reps:'5–8',rest:'90s',note:'Leave a rep in reserve; land softly.',level:3},
 ],
 muscle:[
  {name:'Push-Up Mechanical Drop Set',sets:3,reps:'8–15 + 6–10',rest:'90s',note:'Standard → knees without resting.',level:2},
  {name:'Pike Push-Ups',sets:4,reps:'8–12',rest:'75s',note:'Shoulders lead the movement.',level:2},
  {name:'Reverse Lunges',sets:4,reps:'10–15 / leg',rest:'60s',note:'Controlled range, stable knee.',level:1},
  {name:'Squat 1.5 Reps',sets:4,reps:'10–15',rest:'60s',note:'Halfway up, return down, then stand.',level:2},
  {name:'Plank Shoulder Taps',sets:3,reps:'20–30 total',rest:'45s',note:'Minimize hip rotation.',level:1},
 ],
 athletic:[
  {name:'Pogo Jumps',sets:4,reps:'20',rest:'45s',note:'Quick contacts; stay springy.',level:1},
  {name:'Broad Jumps',sets:5,reps:'4',rest:'90s',note:'Full reset between jumps.',level:2},
  {name:'Explosive Push-Ups',sets:4,reps:'5–8',rest:'90s',note:'Maximum quality, never grind.',level:3},
  {name:'Jump Squats',sets:4,reps:'6–10',rest:'75s',note:'Soft landing and full reset.',level:2},
  {name:'Reverse Lunges',sets:3,reps:'10 / leg',rest:'60s',note:'Stay tall and controlled.',level:1},
  {name:'Hollow Body Hold',sets:3,reps:'30–45 sec',rest:'45s',note:'Brace throughout.',level:1},
 ]
};

function bmi(p:Profile){const h=p.height/100;return p.weight/(h*h)}
function levelScore(p:Profile){return Math.round(Math.min(100,25+(p.level==='beginner'?10:p.level==='advanced'?35:25)+(p.days*4)+(p.duration>=60?15:8)))}
function buildPlan(p:Profile):Exercise[]{const key=p.focus==='explosiveness'||p.goal==='athletic'?'athletic':p.goal==='muscle'?'muscle':'strength';const max=p.level==='beginner'?2:p.level==='advanced'?3:3;return library[key].filter(e=>e.level<=max).slice(0, p.duration<40?4:6)}

export default function ShadowAICinematic(){
 const [profile,setProfile]=useState<Profile>(defaults);
 const [onboarded,setOnboarded]=useState(false);
 const [tab,setTab]=useState<'plan'|'profile'>('plan');
 const [completed,setCompleted]=useState<number[]>([]);
 const [week,setWeek]=useState(1);
 const plan=useMemo(()=>buildPlan(profile),[profile]);
 const score=levelScore(profile);
 const finishAssessment=()=>{setOnboarded(true);setCompleted([])};
 const toggle=(i:number)=>setCompleted(v=>v.includes(i)?v.filter(x=>x!==i):[...v,i]);
 if(!onboarded)return <div className="min-h-[70vh] rounded-3xl border border-white/10 bg-black/40 p-5 sm:p-8 text-white shadow-2xl backdrop-blur-xl">
  <div className="mx-auto max-w-3xl"><div className="mb-8 flex items-center gap-3"><div className="rounded-2xl bg-white/10 p-3"><Brain/></div><div><div className="text-xs font-bold uppercase tracking-[.28em] text-white/50">SHADOW // COACH</div><h1 className="text-3xl font-black sm:text-5xl">Build your body.<br/><span className="text-white/50">No generic plans.</span></h1></div></div>
  <p className="mb-7 max-w-2xl text-sm leading-6 text-white/60">Shadow starts with a fitness assessment, then builds a training plan around your body, goal, time and available equipment.</p>
  <div className="grid gap-4 sm:grid-cols-2">
   {[['weight','Weight (kg)','number'],['height','Height (cm)','number'],['age','Age','number']].map(([k,l,t])=><label key={k} className="text-xs font-bold uppercase tracking-wider text-white/50">{l}<input type="number" value={(profile as any)[k]} onChange={e=>setProfile({...profile,[k]:Number(e.target.value)})} className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-base text-white outline-none"/></label>)}
   <label className="text-xs font-bold uppercase tracking-wider text-white/50">Training level<select value={profile.level} onChange={e=>setProfile({...profile,level:e.target.value})} className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white"><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></label>
   <label className="text-xs font-bold uppercase tracking-wider text-white/50">Main goal<select value={profile.goal} onChange={e=>setProfile({...profile,goal:e.target.value})} className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white"><option value="strength">Strength</option><option value="muscle">Muscle</option><option value="athletic">Athletic / Explosive</option></select></label>
   <label className="text-xs font-bold uppercase tracking-wider text-white/50">Primary focus<select value={profile.focus} onChange={e=>setProfile({...profile,focus:e.target.value})} className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white"><option>full body</option><option>explosiveness</option><option>upper body</option><option>lower body</option></select></label>
   <label className="text-xs font-bold uppercase tracking-wider text-white/50">Training days / week<input type="number" min="2" max="7" value={profile.days} onChange={e=>setProfile({...profile,days:Math.max(2,Math.min(7,Number(e.target.value)))})} className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white"/></label>
   <label className="text-xs font-bold uppercase tracking-wider text-white/50">Session length<select value={profile.duration} onChange={e=>setProfile({...profile,duration:Number(e.target.value)})} className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white"><option value="30">30 min</option><option value="45">45 min</option><option value="50">50 min</option><option value="60">60 min</option><option value="75">75 min</option></select></label>
   <label className="text-xs font-bold uppercase tracking-wider text-white/50 sm:col-span-2">Equipment<select value={profile.equipment} onChange={e=>setProfile({...profile,equipment:e.target.value})} className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white"><option value="none">No equipment</option><option value="home">Home equipment</option><option value="gym">Full gym</option></select></label>
  </div><button onClick={finishAssessment} className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-white py-4 font-black text-black transition hover:translate-y-[-1px]">GENERATE MY PLAN <ArrowRight size={18}/></button>
 </div></div>;
 return <div className="min-h-[70vh] text-white">
  <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><div className="text-xs font-bold uppercase tracking-[.28em] text-white/40">SHADOW // PERSONAL COACH</div><h1 className="text-3xl font-black sm:text-4xl">Your Training System</h1></div><button onClick={()=>setOnboarded(false)} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold"><RotateCcw size={14}/> Reassess</button></div>
  <div className="mb-4 grid gap-3 sm:grid-cols-4"><Stat icon={<Gauge/>} label="Coach score" value={`${score}/100`}/><Stat icon={<Target/>} label="Goal" value={profile.goal}/><Stat icon={<Flame/>} label="Week" value={`${week} / 4`}/><Stat icon={<Activity/>} label="BMI" value={bmi(profile).toFixed(1)}/></div>
  <div className="mb-4 flex gap-2"><button onClick={()=>setTab('plan')} className={`rounded-xl px-4 py-2 text-sm font-bold ${tab==='plan'?'bg-white text-black':'bg-white/5 text-white/60'}`}>Today's Plan</button><button onClick={()=>setTab('profile')} className={`rounded-xl px-4 py-2 text-sm font-bold ${tab==='profile'?'bg-white text-black':'bg-white/5 text-white/60'}`}>Athlete Profile</button></div>
  {tab==='profile'?<div className="rounded-2xl border border-white/10 bg-black/30 p-5"><div className="mb-5 flex items-center gap-3"><UserRound/><div><b className="block">Assessment profile</b><span className="text-xs text-white/50">Used to personalize progression.</span></div></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{[['Weight',`${profile.weight} kg`],['Height',`${profile.height} cm`],['Level',profile.level],['Days',`${profile.days}/week`],['Duration',`${profile.duration} min`],['Equipment',profile.equipment],['Goal',profile.goal],['Focus',profile.focus]].map(([a,b])=><div key={a} className="rounded-xl bg-white/5 p-3"><span className="block text-[10px] uppercase tracking-wider text-white/40">{a}</span><b className="mt-1 block capitalize">{b}</b></div>)}</div></div>:<>
   <div className="mb-4 rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-transparent p-5"><div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/50"><Dumbbell size={14}/> Day 01 · {profile.goal} protocol</div><h2 className="text-2xl font-black">Progressive {profile.goal} session</h2><p className="mt-1 text-sm text-white/50">{plan.length} movements · {profile.duration} min · {profile.equipment==='none'?'bodyweight':'equipment-assisted'}</p></div>
   <div className="space-y-2">{plan.map((e,i)=><button key={e.name} onClick={()=>toggle(i)} className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition ${completed.includes(i)?'border-white/20 bg-white/10 opacity-60':'border-white/10 bg-black/30 hover:bg-white/5'}`}><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${completed.includes(i)?'bg-white text-black':'bg-white/5'}`}>{completed.includes(i)?<Check size={17}/>:<span className="text-xs font-black">{i+1}</span>}</span><span className="min-w-0 flex-1"><b className="block">{e.name}</b><span className="text-xs text-white/45">{e.sets} sets · {e.reps} · Rest {e.rest}</span><small className="mt-1 block text-xs text-white/35">{e.note}</small></span><Timer size={16} className="text-white/30"/></button>)}</div>
   <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4"><div className="mb-2 flex justify-between text-xs font-bold"><span>Session progress</span><span>{completed.length}/{plan.length}</span></div><div className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-white transition-all" style={{width:`${completed.length/Math.max(1,plan.length)*100}%`}}/></div>{completed.length===plan.length&&<p className="mt-3 text-xs font-bold text-white/70">Session complete. Shadow will use this result to tune the next progression.</p>}</div>
  </>}
  <div className="mt-5 flex items-center gap-2 text-[11px] leading-5 text-white/35"><Brain size={13}/> Training recommendations are rule-based and should be adjusted for pain, injury, recovery and real-world limits.</div>
 </div>
}
function Stat({icon,label,value}:{icon:React.ReactNode;label:string;value:string}){return <div className="rounded-2xl border border-white/10 bg-black/30 p-4"><div className="mb-3 text-white/40">{icon}</div><span className="block text-[10px] uppercase tracking-widest text-white/35">{label}</span><b className="mt-1 block capitalize">{value}</b></div>}
