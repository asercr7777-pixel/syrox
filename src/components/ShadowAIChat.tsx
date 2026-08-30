import { useMemo, useState } from 'react';
import { ArrowRight, Brain, Check, Dumbbell, Send, Sparkles, Target, User, Wand2 } from 'lucide-react';

type Goal='strength'|'fitness'|'mobility'|'sports';
type Equipment='bodyweight'|'home'|'gym';
type Difficulty='beginner'|'intermediate'|'advanced';
type Group='push'|'pull'|'legs'|'core'|'plyometric'|'mobility'|'conditioning';
type Exercise={name:string;group:Group;target:string;reps:string;rest:number;equipment:Equipment[]};
type Day={title:string;items:Exercise[]};
type Message={role:'user'|'ai';text:string};

const DB:Exercise[]=[
{name:'Push-up',group:'push',target:'Chest + triceps',reps:'3 × 8–15',rest:75,equipment:['bodyweight','home','gym']},
{name:'Pike Push-up',group:'push',target:'Shoulders + triceps',reps:'3 × 5–12',rest:90,equipment:['bodyweight','home','gym']},
{name:'Close-grip Push-up',group:'push',target:'Triceps + chest',reps:'2–3 × 6–12',rest:75,equipment:['bodyweight','home','gym']},
{name:'Backpack Floor Press',group:'push',target:'Chest + triceps',reps:'3 × 8–15',rest:90,equipment:['home']},
{name:'Backpack Row',group:'pull',target:'Back + biceps',reps:'3 × 8–15',rest:75,equipment:['home']},
{name:'Band Row',group:'pull',target:'Upper back',reps:'3 × 10–15',rest:75,equipment:['home']},
{name:'Assisted Pull-up',group:'pull',target:'Lats + arms',reps:'3 × 5–10',rest:105,equipment:['gym']},
{name:'Lat Pulldown',group:'pull',target:'Lats',reps:'3 × 8–12',rest:90,equipment:['gym']},
{name:'Bodyweight Squat',group:'legs',target:'Quads + glutes',reps:'3 × 8–20',rest:75,equipment:['bodyweight','home','gym']},
{name:'Reverse Lunge',group:'legs',target:'Quads + glutes',reps:'3 × 6–12/side',rest:75,equipment:['bodyweight','home','gym']},
{name:'Split Squat',group:'legs',target:'Quads + glutes',reps:'3 × 6–12/side',rest:90,equipment:['bodyweight','home','gym']},
{name:'Glute Bridge',group:'legs',target:'Glutes + hips',reps:'3 × 10–20',rest:60,equipment:['bodyweight','home','gym']},
{name:'Calf Raise',group:'legs',target:'Calves',reps:'3 × 10–20',rest:50,equipment:['bodyweight','home','gym']},
{name:'Hip Hinge',group:'legs',target:'Posterior chain',reps:'3 × 8–15',rest:75,equipment:['bodyweight','home','gym']},
{name:'Dead Bug',group:'core',target:'Core control',reps:'3 × 6–12/side',rest:50,equipment:['bodyweight','home','gym']},
{name:'Front Plank',group:'core',target:'Core',reps:'3 × 20–60s',rest:50,equipment:['bodyweight','home','gym']},
{name:'Side Plank',group:'core',target:'Lateral stability',reps:'2–3 × 15–45s/side',rest:50,equipment:['bodyweight','home','gym']},
{name:'Pogo Hops',group:'plyometric',target:'Elasticity + landing',reps:'3 × 10–20s',rest:75,equipment:['bodyweight','home','gym']},
{name:'Snap-down',group:'plyometric',target:'Landing mechanics',reps:'3 × 4–6',rest:75,equipment:['bodyweight','home','gym']},
{name:'Squat Jump',group:'plyometric',target:'Vertical power',reps:'3 × 4–8',rest:105,equipment:['bodyweight','home','gym']},
{name:'Lateral Bound',group:'plyometric',target:'Lateral power',reps:'3 × 4–8/side',rest:105,equipment:['bodyweight','home','gym']},
{name:'Mountain Climber',group:'conditioning',target:'Conditioning + core',reps:'3 × 20–45s',rest:50,equipment:['bodyweight','home','gym']},
{name:'Jumping Jack',group:'conditioning',target:'Conditioning',reps:'3 × 30–60s',rest:45,equipment:['bodyweight','home','gym']},
{name:'Mobility Flow',group:'mobility',target:'Full-body mobility',reps:'6–10 min',rest:30,equipment:['bodyweight','home','gym']},
{name:'World’s Greatest Stretch',group:'mobility',target:'Hips + T-spine',reps:'3–5/side',rest:30,equipment:['bodyweight','home','gym']},
{name:'Ankle Rocks',group:'mobility',target:'Ankles',reps:'10/side',rest:20,equipment:['bodyweight','home','gym']},
];

const pick=(group:Group,equipment:Equipment,count:number)=>DB.filter(x=>x.group===group&&x.equipment.includes(equipment)).slice(0,count);
const makePlan=(days:number,equipment:Equipment,goal:Goal,difficulty:Difficulty):Day[]=>{
 const names=days===6?['Push','Pull','Legs','Upper','Lower','Conditioning']:days===5?['Push','Pull','Legs','Upper + Core','Conditioning + Mobility']:days===4?['Upper Strength','Lower Strength','Recovery + Core','Full Body']:days===3?['Upper','Lower','Mobility + Core']:days===2?['Full Body A','Full Body B']:['Full Body'];
 const result:Day[]=[];
 names.forEach((title,index)=>{
  let items:Exercise[]=[];
  if(title==='Push')items=[...pick('push',equipment,3),...pick('core',equipment,1)];
  else if(title==='Pull')items=[...pick('pull',equipment,3),...pick('core',equipment,1)];
  else if(title==='Legs')items=[...pick('legs',equipment,5)];
  else if(title==='Lower')items=[...pick('legs',equipment,4),...(goal==='sports'?pick('plyometric',equipment,2):[])];
  else if(title==='Upper'||title.includes('Upper'))items=[...pick('push',equipment,2),...pick('pull',equipment,2),...pick('core',equipment,1)];
  else if(title.includes('Conditioning'))items=[...pick('conditioning',equipment,2),...(goal==='sports'?pick('plyometric',equipment,2):[]),...pick('core',equipment,1),...pick('mobility',equipment,1)];
  else if(title.includes('Recovery')||title.includes('Mobility'))items=[...pick('mobility',equipment,2),...pick('core',equipment,1)];
  else {items=[...pick('legs',equipment,2),...pick('push',equipment,1),...pick('pull',equipment,1),...pick('core',equipment,1)];}
  if(difficulty==='beginner')items=items.slice(0,Math.min(items.length,4));
  result.push({title,items});
 });
 return result;
};

const parse=(text:string,current:{days:number;equipment:Equipment;goal:Goal;difficulty:Difficulty})=>{
 const t=text.toLowerCase();
 const daysMatch=t.match(/(?:6|5|4|3|2|1)\s*(?:days?|أيام|يوم)/); const days=daysMatch?Number(daysMatch[0].match(/\d+/)?.[0]):current.days;
 const equipment:Equipment=t.includes('gym')||t.includes('جيم')?'gym':t.includes('home')||t.includes('بيت')||t.includes('منزل')?'home':t.includes('equipment')||t.includes('أدوات')?current.equipment:'bodyweight';
 const goal:Goal=t.includes('jump')||t.includes('dunk')||t.includes('basket')||t.includes('قفز')||t.includes('سلة')?'sports':t.includes('strength')||t.includes('قوة')?'strength':t.includes('mobility')||t.includes('مرونة')?'mobility':current.goal;
 const difficulty:Difficulty=t.includes('beginner')||t.includes('مبتد')?'beginner':t.includes('advanced')||t.includes('متقدم')?'advanced':current.difficulty;
 return {days:Math.min(6,Math.max(1,days)),equipment,goal,difficulty};
};

export function ShadowAIChat(){
 const [settings,setSettings]=useState({days:6,equipment:'bodyweight' as Equipment,goal:'strength' as Goal,difficulty:'intermediate' as Difficulty});
 const [messages,setMessages]=useState<Message[]>([{role:'ai',text:'أنا Shadow AI. كلمني عادي زي ما تكلم أي مدرب. قولي هدفك، عدد الأيام، الوقت والمعدات، وأنا أبني لك نظام كامل وأقدر أعدله معاك خطوة بخطوة.'}]);
 const [input,setInput]=useState(''); const [plan,setPlan]=useState<Day[]|null>(null); const [applied,setApplied]=useState(false);
 const total=useMemo(()=>plan?.reduce((n,d)=>n+d.items.length,0)||0,[plan]);
 const send=(preset?:string)=>{const text=(preset??input).trim();if(!text)return;const next=parse(text,settings);setSettings(next);setMessages(m=>[...m,{role:'user',text}]);setTimeout(()=>{setMessages(m=>[...m,{role:'ai',text:`تمام. فهمت إنك عايز ${next.days} أيام، ${next.equipment==='bodyweight'?'من غير أدوات':next.equipment==='home'?'بأدوات منزلية':'جيم'}، والهدف ${next.goal}. هبني الجدول على تقسيمة حقيقية بحيث كل يوم له وظيفته ومفيش تمرين رجل داخل Push أو تمرين Push داخل Pull.`}]);setPlan(makePlan(next.days,next.equipment,next.goal,next.difficulty));},120);setInput('');setApplied(false);};
 const apply=()=>{if(!plan)return;const payload=plan.flatMap((d,di)=>d.items.map(e=>({day:di+1,name:e.name,sets:Number(e.reps.match(/\d+/)?.[0]||3),reps:e.reps.replace(/^\d+\s*[×x]\s*/,'').replace(/^\d+–\d+\s*/,'').trim(),section:e.group==='mobility'?'stretching':e.group==='plyometric'?'plyometric':'main',group:e.group})));localStorage.setItem('forged-shadow-ai-workout-plan',JSON.stringify({id:`shadow-chat-${Date.now()}`,days:settings.days,goal:settings.goal,equipment:settings.equipment,exercises:payload}));setApplied(true);};
 return <section className="mx-auto flex min-h-[70vh] max-w-5xl flex-col gap-4 pb-10">
  <div className="relative overflow-hidden rounded-3xl border border-ember-500/20 bg-gradient-to-br from-ember-500/10 via-black/40 to-black/20 p-5 sm:p-7"><div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-ember-500/10 blur-3xl"/><div className="relative flex items-center gap-4"><div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-ember-500/30 bg-ember-500/10"><Brain className="text-ember-400" size={28}/></div><div><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.2em] text-ember-400"><Sparkles size={13}/> Shadow AI</div><h1 className="mt-1 text-2xl font-black sm:text-3xl">Talk to your training AI.</h1><p className="mt-1 text-sm text-slate-400">Describe what you want. Shadow builds and reshapes the whole plan.</p></div></div></div>
  <div className="grid flex-1 gap-4 lg:grid-cols-[1fr_310px]">
   <div className="flex min-h-[560px] flex-col rounded-3xl border border-white/10 bg-black/30">
    <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">{messages.map((m,i)=><div key={i} className={`flex gap-3 ${m.role==='user'?'justify-end':''}`}><div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${m.role==='ai'?'border border-ember-500/20 bg-ember-500/10 text-ember-400':'bg-white/10 text-slate-300'}`}>{m.role==='ai'?<Wand2 size={17}/>:<User size={17}/>}</div><div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${m.role==='ai'?'border border-white/5 bg-white/[.03] text-slate-200':'bg-ember-500 text-white'}`}>{m.text}</div></div>)}</div>
    <div className="border-t border-white/10 p-3"><div className="flex gap-2"><input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')send()}} placeholder="مثال: عايز 6 أيام قوة وقفزة أعلى من غير أدوات" className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-ember-500/50"/><button onClick={()=>send()} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-ember-500 text-white"><Send size={18}/></button></div><div className="mt-2 flex gap-2 overflow-x-auto">{['عايز 6 أيام من غير أدوات','خلّيها أصعب','عايز قفزة أعلى','غيّر النظام'].map(x=><button key={x} onClick={()=>send(x)} className="shrink-0 rounded-xl border border-white/5 bg-white/[.03] px-3 py-2 text-[11px] text-slate-400 hover:text-white">{x}</button>)}</div></div>
   </div>
   <aside className="rounded-3xl border border-white/10 bg-black/30 p-4 sm:p-5"><div className="flex items-center gap-2"><Target size={18} className="text-ember-400"/><h2 className="font-bold">Current plan</h2></div>{plan?<><div className="mt-4 grid grid-cols-2 gap-2"><div className="rounded-xl border border-white/5 p-3"><div className="text-[10px] text-slate-500">DAYS</div><b>{settings.days}</b></div><div className="rounded-xl border border-white/5 p-3"><div className="text-[10px] text-slate-500">EXERCISES</div><b>{total}</b></div></div><div className="mt-4 max-h-[360px] space-y-2 overflow-y-auto">{plan.map((d,i)=><div key={i} className="rounded-xl border border-white/5 bg-white/[.02] p-3"><div className="flex items-center justify-between"><b className="text-sm">Day {i+1}</b><span className="text-[10px] text-ember-400">{d.title}</span></div><div className="mt-2 space-y-1">{d.items.map(e=><div key={e.name} className="flex items-center gap-2 text-xs text-slate-400"><Check size={12} className="text-emerald-400"/>{e.name}</div>)}</div></div>)}</div><button onClick={apply} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-ember-500 to-orange-600 px-4 py-3 text-sm font-black text-white"><Dumbbell size={16}/>{applied?'Applied to Workout':'Apply to Workout'}<ArrowRight size={16}/></button></>:<div className="mt-5 rounded-2xl border border-dashed border-white/10 p-5 text-center text-sm text-slate-500">ابدأ المحادثة، وShadow هيبني الخطة هنا.</div>}</aside>
  </div>
 </section>;
}
