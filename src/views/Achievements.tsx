import { useMemo } from 'react';
import { Award, LockKeyhole, ShieldCheck, Zap, Flame, Dumbbell, Target } from 'lucide-react';
import { useStore } from '../store/useStore';

const TRACKED = [
  {id:'first_steps',name:'First Steps',description:'Earn at least 100 XP.',icon:Zap,goal:(s:any)=>s.xp>=100,progress:(s:any)=>Math.min(100,s.xp/100*100),detail:(s:any)=>`${Math.min(s.xp,100)} / 100 XP`},
  {id:'consistent_7',name:'Unbroken Will',description:'Reach a 7-day streak.',icon:Flame,goal:(s:any)=>s.bestStreak>=7,progress:(s:any)=>Math.min(100,s.bestStreak/7*100),detail:(s:any)=>`${Math.min(s.bestStreak,7)} / 7 days`},
  {id:'training_10',name:'Training Protocol',description:'Log 10 workout sessions.',icon:Dumbbell,goal:(s:any)=>s.workoutSessions.length>=10,progress:(s:any)=>Math.min(100,s.workoutSessions.length/10*100),detail:(s:any)=>`${Math.min(s.workoutSessions.length,10)} / 10 sessions`},
  {id:'missions_25',name:'Objective Specialist',description:'Complete 25 missions in saved daily history.',icon:Target,goal:(s:any)=>s.history.reduce((n:number,d:any)=>n+Object.values(d.coreCompleted).filter(Boolean).length+Object.values(d.customCompleted).filter(Boolean).length,0)>=25,progress:(s:any)=>Math.min(100,s.history.reduce((n:number,d:any)=>n+Object.values(d.coreCompleted).filter(Boolean).length+Object.values(d.customCompleted).filter(Boolean).length,0)/25*100),detail:(s:any)=>`${Math.min(25,s.history.reduce((n:number,d:any)=>n+Object.values(d.coreCompleted).filter(Boolean).length+Object.values(d.customCompleted).filter(Boolean).length,0))} / 25 missions`},
  {id:'xp_1000',name:'Awakening',description:'Accumulate 1,000 XP.',icon:Award,goal:(s:any)=>s.xp>=1000,progress:(s:any)=>Math.min(100,s.xp/1000*100),detail:(s:any)=>`${Math.min(s.xp,1000)} / 1,000 XP`},
];

export function Achievements() {
  const {state,unlockAchievements}=useStore();
  const earned=useMemo(()=>new Set(state.achievements.map(a=>a.id)),[state.achievements]);
  const unlockable=TRACKED.filter(a=>a.goal(state)&&!earned.has(a.id));
  const unlockedCount=TRACKED.filter(a=>earned.has(a.id)).length;
  return <div className="sv-command sv-page-module">
    <header className="sv-module-header"><div><p className="sv-eyebrow"><Award size={14}/> STRYVEN / HONORS</p><h1>Achievements</h1><p>Earned records and measurable milestones.</p></div><div className="sv-identity-rank"><ShieldCheck size={16}/><b>{unlockedCount}/{TRACKED.length} TRACKED</b></div></header>
    {unlockable.length>0&&<section className="sv-achievement-notice"><div><b>Milestone verified</b><p>{unlockable.length} achievement(s) meet their requirement. Confirm to add them to your collection.</p></div><button onClick={()=>unlockAchievements(unlockable.map(a=>a.id))}>Claim verified</button></section>}
    <section className="sv-achievement-grid">{TRACKED.map(item=>{const unlocked=earned.has(item.id);const Icon=item.icon;return <article key={item.id} className={`sv-achievement-card ${unlocked?'is-unlocked':''}`}><div className="sv-achievement-emblem">{unlocked?<Icon size={25}/>:<LockKeyhole size={23}/>}</div><span className="sv-eyebrow">{unlocked?'ACHIEVEMENT UNLOCKED':'LOCKED MILESTONE'}</span><h2>{item.name}</h2><p>{item.description}</p><div className="sv-page-progress"><span style={{width:`${item.progress(state)}%`}}/></div><small>{unlocked?'Recorded in your collection':item.detail(state)}</small></article>})}</section>
    <section className="sv-section sv-surface"><div className="sv-section-head"><div><p className="sv-eyebrow">LEGACY</p><h2>Existing achievements</h2><p>Records already saved to your account are preserved.</p></div><strong>{state.achievements.length}</strong></div>
      {state.achievements.length ? <div className="sv-earned-list">{state.achievements.map(item=><div key={item.id}><Award size={17}/><b>{item.id.replace(/[_-]/g,' ')}</b><small>{new Date(item.unlockedAt).toLocaleDateString()}</small></div>)}</div> : <div className="sv-empty-record">YOUR LEGACY STARTS WITH YOUR NEXT ACTION</div>}
    </section>
  </div>;
}
