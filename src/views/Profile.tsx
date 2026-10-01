import { useMemo } from 'react';
import { Award, CalendarDays, CheckCircle2, Clock3, Crown, Dumbbell, Shield, Target, Trophy, Zap, Flame, Activity } from 'lucide-react';
import { useStore } from '../store/useStore';
import { getRankByXp, getNextRank } from '../data/ranks';
import { TITLES } from '../data/collections';
import { XpBar } from '../components/ui/XpBar';

const formatDuration = (seconds:number) => { const safe=Math.max(0,Math.floor(seconds)); const h=Math.floor(safe/3600); const m=Math.floor((safe%3600)/60); return h ? `${h}h ${m}m` : `${m}m`; };

export function Profile(){
  const { state } = useStore();
  const rank=getRankByXp(state.xp); const next=getNextRank(state.xp);
  const completedMissions=state.history.reduce((sum,day)=>sum+Object.values(day.coreCompleted).filter(Boolean).length,0);
  const completedActions=state.history.reduce((sum,day)=>sum+Object.values(day.customCompleted).filter(Boolean).length,0);
  const completedDays=state.history.filter(day=>day.allMainDone).length;
  const discipline=state.history.length?Math.min(100,Math.round(completedDays/state.history.length*100)):0;
  const focus=Math.min(100,completedActions*4);
  const strength=Math.min(100,state.workoutSessions.length*5);
  const endurance=Math.min(100,Math.round(state.totalWorkoutSeconds/360));
  const consistency=Math.min(100,Math.round((completedMissions+completedActions)/Math.max(1,state.history.length*5)*100));
  const accountAge=Math.max(1,Math.floor((Date.now()-state.createdAt)/86400000));
  const equippedTitle=TITLES.find(t=>t.id===state.equipped.title);
  const initials=(state.username||'ST').slice(0,2).toUpperCase();
  const history=useMemo(()=>state.history.slice(-8).reverse(),[state.history]);

  return <div className="sv-identity-page">
    <header className="sv-identity-head"><div><span className="sv-eyebrow">SYSTEM // IDENTITY RECORD</span><h1>System Identity</h1><p>Your progression, records and accumulated proof of action.</p></div><div className="sv-identity-rank"><span>{rank.emoji}</span><b style={{color:rank.color}}>{rank.name}</b></div></header>

    <section className="sv-identity-hero">
      <div className="sv-identity-portrait"><div className="sv-identity-seal">{initials}</div></div>
      <div className="sv-identity-main"><span>OPERATIVE SIGNATURE</span><h2 style={{color:state.nameColor}}>{state.username||'Hunter'}</h2><div className="sv-title-line"><Crown size={14}/>{equippedTitle?.name||'THE UNBOUND'}</div><div className="sv-identity-level"><b>LEVEL {state.level}</b><span>{state.xp.toLocaleString()} XP</span><span>{state.streak} DAY STREAK</span></div><XpBar xp={state.xp}/>{next&&<small>{Math.max(0,next.xpRequired-state.xp).toLocaleString()} XP UNTIL {next.name.toUpperCase()}</small>}</div>
      <div className="sv-identity-xp"><span>TOTAL XP</span><strong>{state.xp.toLocaleString()}</strong><small>BEST STREAK {state.bestStreak} DAYS</small></div>
    </section>

    <section className="sv-attribute-grid"><Attribute icon={<Shield size={15}/>} name="DISCIPLINE" value={discipline}/><Attribute icon={<Dumbbell size={15}/>} name="STRENGTH" value={strength}/><Attribute icon={<Activity size={15}/>} name="CONSISTENCY" value={consistency}/><Attribute icon={<Target size={15}/>} name="FOCUS" value={focus}/></section>

    <section className="sv-identity-grid">
      <div className="sv-identity-panel"><PanelHead icon={<Trophy size={17}/>} eyebrow="PROGRESSION" title="Core Record"/><div className="sv-record-grid"><Record label="MISSIONS COMPLETED" value={String(completedMissions)}/><Record label="ACTIONS COMPLETED" value={String(completedActions)}/><Record label="TRAINING SESSIONS" value={String(state.workoutSessions.length)}/><Record label="TRAINING TIME" value={formatDuration(state.totalWorkoutSeconds)}/><Record label="ACCOUNT AGE" value={`${accountAge} DAYS`}/><Record label="CURRENT LEVEL" value={String(state.level)}/></div></div>

      <div className="sv-identity-panel"><PanelHead icon={<Award size={17}/>} eyebrow="ACHIEVEMENTS" title="System Relics"/><div className="sv-feat-list"><Feat label="FIRST AWAKENING" unlocked={state.xp>0}/><Feat label="FIRST TRAINING" unlocked={state.workoutSessions.length>0}/><Feat label="1,000 XP" unlocked={state.xp>=1000}/><Feat label="5,000 XP" unlocked={state.xp>=5000}/><Feat label="50 ACTIONS" unlocked={completedActions>=50}/><Feat label="10 DAY STREAK" unlocked={state.bestStreak>=10}/></div></div>

      <div className="sv-identity-panel"><PanelHead icon={<Clock3 size={17}/>} eyebrow="ASCENSION HISTORY" title="Recent Record"/><div className="sv-record-list">{history.length===0?<div className="sv-empty-record">NO ASCENSION RECORD YET</div>:history.map(day=><div key={day.date}><span>{day.date}</span><b>{day.allMainDone?'FULL SYSTEM CLEAR':'FIELD ACTIVITY'}</b><small>+{day.xpGained} XP</small></div>)}</div></div>

      <div className="sv-identity-panel"><PanelHead icon={<Zap size={17}/>} eyebrow="NEXT ASCENSION" title="Rank Path"/><div style={{padding:'4px 0 14px'}}><div style={{display:'flex',justifyContent:'space-between',fontSize:9,letterSpacing:'.12em',color:'#666671'}}><span>{rank.name}</span><span>{next?.name||'MAX'}</span></div><div style={{height:3,background:'#17171f',marginTop:9}}><div style={{height:'100%',width:`${next?Math.min(100,Math.max(0,(state.xp-(rank.xpRequired||0))/Math.max(1,next.xpRequired-(rank.xpRequired||0))*100)):100}%`,background:'linear-gradient(90deg,#427fff,#8c62ff)'}}/></div></div><div className="sv-record-grid"><Record label="XP TO NEXT" value={next?`${Math.max(0,next.xpRequired-state.xp)}`:'MAX'}/><Record label="TODAY XP" value={`+${state.dailyXp}`}/><Record label="RANK" value={rank.name}/></div></div>

      <div className="sv-identity-panel"><PanelHead icon={<Flame size={17}/>} eyebrow="STREAK RECORD" title="Consistency"/><div className="sv-facts"><Fact icon={<Flame size={14}/>} label="CURRENT STREAK" value={`${state.streak} DAYS`}/><Fact icon={<Trophy size={14}/>} label="BEST STREAK" value={`${state.bestStreak} DAYS`}/><Fact icon={<CheckCircle2 size={14}/>} label="ACTIVE DAYS" value={String(state.history.length)}/><Fact icon={<CalendarDays size={14}/>} label="CREATED" value={new Date(state.createdAt).toLocaleDateString()}/></div></div>

      <div className="sv-identity-panel"><PanelHead icon={<Target size={17}/>} eyebrow="SYSTEM FACTS" title="Current State"/><div className="sv-facts"><Fact icon={<Target size={14}/>} label="CURRENT RANK" value={rank.name}/><Fact icon={<Zap size={14}/>} label="TODAY XP" value={`+${state.dailyXp}`}/><Fact icon={<Trophy size={14}/>} label="ACHIEVEMENTS" value={String(state.achievements.length)}/><Fact icon={<Dumbbell size={14}/>} label="TRAINING TODAY" value={state.workoutsCompletedToday?'CLEAR':'PENDING'}/></div></div>
    </section>
  </div>;
}
function Attribute({icon,name,value}:{icon:React.ReactNode;name:string;value:number}){return <div className="sv-attribute"><div>{icon}</div><span>{name}</span><strong>{value}</strong><i><b style={{width:`${value}%`}}/></i></div>}
function PanelHead({icon,eyebrow,title}:{icon:React.ReactNode;eyebrow:string;title:string}){return <div className="sv-panel-head"><div>{icon}</div><span>{eyebrow}</span><h2>{title}</h2></div>}
function Record({label,value}:{label:string;value:string}){return <div className="sv-record"><span>{label}</span><strong>{value}</strong></div>}
function Feat({label,unlocked}:{label:string;unlocked:boolean}){return <div className={unlocked?'is-unlocked':''}><span>{unlocked?'◆':'◇'}</span><b>{label}</b><small>{unlocked?'UNLOCKED':'LOCKED'}</small></div>}
function Fact({icon,label,value}:{icon:React.ReactNode;label:string;value:string}){return <div><span>{icon}</span><label>{label}</label><b>{value}</b></div>}
