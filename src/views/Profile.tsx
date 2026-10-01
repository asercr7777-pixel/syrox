import { useMemo } from 'react';
import { Award, CalendarDays, CheckCircle2, Clock3, Crown, Dumbbell, Shield, Target, Trophy, Zap, Flame, Activity } from 'lucide-react';
import { useStore } from '../store/useStore';
import { getRankByXp, getNextRank } from '../data/ranks';
import { TITLES } from '../data/collections';
import { XpBar } from '../components/ui/XpBar';

const duration=(s:number)=>{s=Math.max(0,Math.floor(s));const h=Math.floor(s/3600),m=Math.floor(s%3600/60);return h?`${h}h ${m}m`:`${m}m`};
export function Profile(){
 const {state}=useStore(); const rank=getRankByXp(state.xp),next=getNextRank(state.xp);
 const missions=state.history.reduce((n,d)=>n+Object.values(d.coreCompleted).filter(Boolean).length,0);
 const actions=state.history.reduce((n,d)=>n+Object.values(d.customCompleted).filter(Boolean).length,0);
 const days=state.history.filter(d=>d.allMainDone).length; const discipline=state.history.length?Math.round(days/state.history.length*100):0;
 const stats=[['DISCIPLINE',discipline,Shield],['STRENGTH',Math.min(100,state.workoutSessions.length*5),Dumbbell],['CONSISTENCY',Math.min(100,Math.round((missions+actions)/Math.max(1,state.history.length*5)*100)),Flame],['FOCUS',Math.min(100,actions*4),Target],['ENDURANCE',Math.min(100,Math.round(state.totalWorkoutSeconds/360)),Activity]];
 const title=TITLES.find(t=>t.id===state.equipped.title); const initials=(state.username||'ST').slice(0,2).toUpperCase(); const history=useMemo(()=>state.history.slice(-7).reverse(),[state.history]);
 return <div className="sx-profile-page">
  <header className="sx-command-head"><div><div className="sx-kicker"><i/> SYSTEM // IDENTITY RECORD</div><h1>Hunter <em>Profile.</em></h1><p>A complete record of progression, attributes and earned proof.</p></div><div className="sx-head-meta"><span>CURRENT RANK</span><b style={{color:rank.color}}>{rank.name}</b><small>LEVEL {state.level}</small></div></header>
  <section className="sx-profile-hero"><div className="sx-avatar">{initials}</div><div className="sx-profile-core"><span>OPERATIVE SIGNATURE</span><h2 style={{color:state.nameColor}}>{state.username||'Hunter'}</h2><div className="sx-title-line"><Crown size={14}/>{title?.name||'THE UNBOUND'}<i/> {rank.name}</div><div className="sx-profile-xp"><XpBar xp={state.xp}/><span>{state.xp.toLocaleString()} XP · {next?Math.max(0,next.xpRequired-state.xp).toLocaleString()+' XP TO NEXT RANK':'MAXIMUM RANK'}</span></div></div><div className="sx-profile-badge"><span>LEVEL</span><strong>{state.level}</strong><small>{state.streak} DAY STREAK</small></div></section>
  <section className="sx-profile-stats">{stats.map(([name,value,Icon])=>{const I=Icon as typeof Shield;return <div className="sx-attr" key={name as string}><header><span><I size={14}/>{name}</span><b>{value as number}</b></header><i><em style={{width:`${value}%`}}/></i></div>})}</section>
  <section className="sx-profile-grid">
   <Panel title="Core Record" eyebrow="01 // PROGRESSION" icon={<Trophy/>}><div className="sx-record-grid">{[['MISSIONS',missions],['ACTIONS',actions],['TRAINING',state.workoutSessions.length],['TRAINING TIME',duration(state.totalWorkoutSeconds)],['ACCOUNT AGE',`${Math.max(1,Math.floor((Date.now()-state.createdAt)/86400000))} DAYS`],['ACHIEVEMENTS',state.achievements.length]].map(([a,b])=><div className="sx-record" key={String(a)}><span>{a}</span><strong>{b}</strong></div>)}</div></Panel>
   <Panel title="System Relics" eyebrow="02 // ACHIEVEMENTS" icon={<Award/>}><div className="sx-achievements">{[['FIRST AWAKENING',state.xp>0],['FIRST TRAINING',state.workoutSessions.length>0],['1,000 XP',state.xp>=1000],['5,000 XP',state.xp>=5000],['50 ACTIONS',actions>=50],['10 DAY STREAK',state.bestStreak>=10]].map(([a,b])=><div className={b?'unlocked':''} key={String(a)}><span>{b?'◆':'◇'}</span><b>{a}</b><small>{b?'UNLOCKED':'LOCKED'}</small></div>)}</div></Panel>
   <Panel title="Ascension History" eyebrow="03 // RECENT RECORD" icon={<Clock3/>}><div className="sx-history">{history.length?history.map(d=><div key={d.date}><span>{d.date}</span><b>{d.allMainDone?'FULL CLEAR':'FIELD ACTIVITY'}</b><small>+{d.xpGained} XP</small></div>):<div className="sx-empty">NO RECORD YET</div>}</div></Panel>
   <Panel title="Rank Path" eyebrow="04 // NEXT ASCENSION" icon={<Zap/>}><div className="sx-rank-card"><div><span>{rank.name}</span><b>{next?.name||'MAXIMUM'}</b></div><div className="sx-progress"><i style={{width:`${next?Math.min(100,Math.max(0,(state.xp-(rank.xpRequired||0))/Math.max(1,next.xpRequired-(rank.xpRequired||0))*100)):100}%`}}/></div><small>{next?Math.max(0,next.xpRequired-state.xp).toLocaleString()+' XP REMAINING':'MAXIMUM RANK REACHED'}</small></div></Panel>
   <Panel title="Consistency" eyebrow="05 // STREAK RECORD" icon={<Flame/>}><div className="sx-facts"><Fact icon={<Flame/>} label="CURRENT STREAK" value={`${state.streak} DAYS`}/><Fact icon={<Trophy/>} label="BEST STREAK" value={`${state.bestStreak} DAYS`}/><Fact icon={<CheckCircle2/>} label="ACTIVE DAYS" value={String(state.history.length)}/><Fact icon={<CalendarDays/>} label="CREATED" value={new Date(state.createdAt).toLocaleDateString()}/></div></Panel>
   <Panel title="Current State" eyebrow="06 // SYSTEM FACTS" icon={<Target/>}><div className="sx-facts"><Fact icon={<Target/>} label="CURRENT RANK" value={rank.name}/><Fact icon={<Zap/>} label="TODAY XP" value={`+${state.dailyXp}`}/><Fact icon={<Dumbbell/>} label="TRAINING TODAY" value={state.workoutsCompletedToday?'CLEAR':'PENDING'}/><Fact icon={<Shield/>} label="BEST STREAK" value={`${state.bestStreak} DAYS`}/></div></Panel>
  </section>
 </div>
}
function Panel({title,eyebrow,icon,children}:{title:string;eyebrow:string;icon:ReactNode;children:ReactNode}){return <section className="sx-panel sx-profile-panel"><header><div className="sx-panel-icon">{icon}</div><div><span>{eyebrow}</span><h2>{title}</h2></div></header>{children}</section>}
function Fact({icon,label,value}:{icon:ReactNode;label:string;value:string}){return <div className="sx-fact"><span>{icon}</span><div><small>{label}</small><b>{value}</b></div></div>}
