import { lazy, Suspense, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { ViewId } from '../components/Navigation';
import { useStore } from '../store/useStore';
import { getRankByXp, getNextRank } from '../data/ranks';
import { XpBar } from '../components/ui/XpBar';
import { Activity, ArrowUpRight, Check, Dumbbell, Flame, Target, UserRound, Zap } from 'lucide-react';

const Tasks=lazy(()=>import('./Tasks').then(m=>({default:m.Tasks})));
interface DashboardProps{onNavigate:(v:ViewId)=>void}

export function Dashboard({onNavigate}:DashboardProps){
 const {state}=useStore(); const rank=getRankByXp(state.xp); const next=getNextRank(state.xp);
 const main=state.mainTasks.filter(t=>t.enabled); const mainDone=main.filter(t=>state.coreCompleted[t.id]).length;
 const customDone=state.customTasks.filter(t=>state.customCompleted[t.id]).length; const total=main.length+state.customTasks.length; const done=mainDone+customDone;
 const dayPct=total?Math.round(done/total*100):0; const nextPct=next?Math.min(100,Math.max(0,((state.xp-(rank.xpRequired||0))/Math.max(1,next.xpRequired-(rank.xpRequired||0)))*100)):100;
 const directive=useMemo(()=>{const a=main.find(t=>!state.coreCompleted[t.id]);if(a)return {label:'CORE MISSION',title:a.label,xp:a.points,icon:a.emoji};const b=state.customTasks.find(t=>!state.customCompleted[t.id]);if(b)return {label:'PERSONAL COMMAND',title:b.label,xp:b.points,icon:'✦'};return {label:'SYSTEM DIRECTIVE',title:'Enter training protocol',xp:150,icon:'◈'}},[main,state.coreCompleted,state.customTasks,state.customCompleted]);
 return <div className="sx-command-page">
  <header className="sx-command-head"><div><div className="sx-kicker"><i/> STRYVEN // COMMAND CENTER</div><h1>Good to see you, <em style={{color:state.nameColor}}>{state.username||'Hunter'}</em>.</h1><p>Execute with intent. Every completed action advances your system.</p></div><div className="sx-head-meta"><span>CORE STATUS</span><b>ONLINE</b><small>LVL {state.level} · {rank.name}</small></div></header>

  <section className="sx-command-hero">
   <div className="sx-hero-main"><div className="sx-kicker">CURRENT DIRECTIVE // 01</div><div className="sx-directive-icon">{directive.icon}</div><span className="sx-command-type">{directive.label}</span><h2>{directive.title}</h2><p>One action. One conversion. Push the Core forward.</p><div className="sx-actions"><button className="sx-btn sx-btn-primary" onClick={()=>onNavigate('workout')}><Dumbbell size={16}/> START TRAINING <ArrowUpRight size={14}/></button><button className="sx-btn" onClick={()=>onNavigate('profile')}><UserRound size={16}/> IDENTITY</button></div></div>
   <div className="sx-hero-rank"><span>RANK PROGRESSION</span><strong style={{color:rank.color}}>{rank.name}</strong><div className="sx-rank-line"><b>{state.xp.toLocaleString()}</b><small>XP</small></div><div className="sx-progress"><i style={{width:`${nextPct}%`}}/></div><div className="sx-rank-foot"><span>{next?next.name:'MAXIMUM RANK'}</span><span>{next?Math.max(0,next.xpRequired-state.xp).toLocaleString()+' XP REMAINING':'ASCENDED'}</span></div></div>
  </section>

  <section className="sx-metrics">{<Metric icon={<Target/>} label="DAILY CLEARANCE" value={`${done}/${total}`} note={`${dayPct}% COMPLETE`}/>}<Metric icon={<Zap/>} label="XP TODAY" value={`+${state.dailyXp.toLocaleString()}`} note={`${state.xp.toLocaleString()} TOTAL`}/><Metric icon={<Flame/>} label="STREAK" value={`${state.streak}D`} note={`BEST ${state.bestStreak} DAYS`}/><Metric icon={<Dumbbell/>} label="TRAINING" value={state.workoutsCompletedToday?'CLEAR':'READY'} note={`${Math.round(state.totalWorkoutSeconds/60)} MIN TOTAL`}/></section>

  <div className="sx-dashboard-grid">
   <section className="sx-panel sx-operations"><div className="sx-panel-head"><div><span>02 // OPERATIONS</span><h2>Command Queue</h2><p>Your active objectives live here.</p></div><button onClick={()=>onNavigate('settings')}>CONFIGURE</button></div><div className="sx-task-board"><Suspense fallback={<div className="sx-empty">LOADING QUEUE…</div>}><Tasks/></Suspense></div></section>
   <aside className="sx-side-stack">
    <section className="sx-panel sx-quick"><div className="sx-panel-head"><div><span>03 // SYSTEM SIGNALS</span><h2>Core State</h2></div></div><Signal label="Discipline" value={dayPct}/><Signal label="Strength" value={Math.min(100,state.workoutSessions.length*5)}/><Signal label="Focus" value={Math.min(100,customDone*4)}/><Signal label="Endurance" value={Math.min(100,Math.round(state.totalWorkoutSeconds/360))}/></section>
    <button className="sx-panel sx-route" onClick={()=>onNavigate('profile')}><span>IDENTITY RECORD</span><strong>View progression <ArrowUpRight size={16}/></strong><small>Rank · attributes · achievements · history</small></button>
   </aside>
  </div>

  <section className="sx-system-strip"><span><i/> SYSTEM ONLINE</span><b>{done}/{total} OBJECTIVES</b><b>{state.dailyXp.toLocaleString()} XP TODAY</b><b>{state.workoutsCompletedToday?'TRAINING COMPLETE':'TRAINING PENDING'}</b></section>
 </div>
}
function Metric({icon,label,value,note}:{icon:ReactNode;label:string;value:string;note:string}){return <div className="sx-metric"><div className="sx-metric-icon">{icon}</div><span>{label}</span><strong>{value}</strong><small>{note}</small></div>}
function Signal({label,value}:{label:string;value:number}){return <div className="sx-signal"><div><span>{label}</span><b>{value}</b></div><i><em style={{width:`${value}%`}}/></i></div>}
