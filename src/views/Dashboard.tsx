import { lazy, Suspense } from 'react';
import type { ViewId } from '../components/Navigation';
import { useStore } from '../store/useStore';
import { getRankByXp, getNextRank } from '../data/ranks';
import { UserAvatar } from '../components/ui/UserAvatar';
import { XpBar } from '../components/ui/XpBar';
import { Activity, ArrowUpRight, Dumbbell, Settings, Target, Zap } from 'lucide-react';

const Tasks = lazy(() => import('./Tasks').then(m => ({ default: m.Tasks })));
interface DashboardProps { onNavigate: (v: ViewId) => void; }

export function Dashboard({ onNavigate }: DashboardProps) {
  const { state } = useStore();
  const rank = getRankByXp(state.xp);
  const nextRank = getNextRank(state.xp);
  const activeTasks = state.mainTasks.filter(t => t.enabled);
  const mainDone = activeTasks.filter(t => state.coreCompleted[t.id]).length;
  const bonusDone = state.customTasks.filter(t => state.customCompleted[t.id]).length;
  const totalTasks = activeTasks.length + state.customTasks.length;
  const totalDone = mainDone + bonusDone;
  const progress = totalTasks ? Math.round((totalDone / totalTasks) * 100) : 0;
  return <div className="syrox-dashboard">
    <section className="syrox-hero"><div className="syrox-hero-grid"><div className="syrox-hero-copy"><div className="syrox-overline"><span className="syrox-status-dot"/><span>STRYVEN // COMMAND CENTER</span><span className="syrox-overline-line"/></div><div className="syrox-identity-row"><UserAvatar avatar={state.avatar} rank={rank} size="lg"/><div className="syrox-identity-copy"><p>OPERATIVE ONLINE</p><h1 style={{color:state.nameColor}}>{state.username||'Hunter'}</h1><div><span style={{color:rank.color}}>{rank.name}</span><b>LEVEL {state.level}</b></div></div></div><p className="syrox-hero-description">Four systems. One direction. Execute the mission, enter training, and build the identity you want to carry.</p><div className="syrox-hero-actions"><button onClick={()=>onNavigate('workout')} className="syrox-primary-action"><Dumbbell size={17}/> ENTER TRAINING <ArrowUpRight size={15}/></button><button onClick={()=>onNavigate('profile')} className="syrox-secondary-action"><Target size={16}/> OPEN IDENTITY</button></div></div><div className="syrox-xp-module"><div className="syrox-xp-top"><span>PROGRESSION CORE</span><strong>{state.xp.toLocaleString()} XP</strong></div><div className="syrox-rank-orbit"><div className="syrox-rank-core" style={{borderColor:rank.color,boxShadow:'0 0 50px '+rank.glow}}><span>{rank.emoji}</span><b style={{color:rank.color}}>{rank.name}</b></div></div><XpBar xp={state.xp}/>{nextRank?<p><strong>{Math.max(0,nextRank.xpRequired-state.xp).toLocaleString()}</strong> XP until {nextRank.name}</p>:<p>MAX RANK REACHED</p>}</div></div></section>
    <section className="syrox-metric-strip"><Metric icon={<Target size={15}/>} label="MISSIONS" value={totalDone+'/'+totalTasks} detail={progress+'% COMPLETE'}/><Metric icon={<Zap size={15}/>} label="TODAY XP" value={state.dailyXp.toLocaleString()} detail="XP EARNED"/><Metric icon={<Activity size={15}/>} label="LEVEL" value={String(state.level)} detail={rank.name}/><Metric icon={<Dumbbell size={15}/>} label="NEXT" value="TRAIN" detail="EXECUTE SESSION"/></section>
    <section className="syrox-focus"><div className="syrox-section-heading"><div><span>01 // DAILY OPERATIONS</span><h2>Mission Board</h2><p>Everything active for today, in one place.</p></div><button onClick={()=>onNavigate('settings')} aria-label="Open settings"><Settings size={17}/></button></div><div className="syrox-mission-board"><Suspense fallback={<div className="syrox-loading">Loading command board…</div>}><Tasks/></Suspense></div></section>
    <section className="syrox-next-grid"><button className="syrox-next-card syrox-next-card--training" onClick={()=>onNavigate('workout')}><div><span>02 // PHYSICAL SYSTEM</span><h3>Training</h3><p>Enter the dedicated training interface and complete your session.</p></div><span className="syrox-card-arrow"><Dumbbell size={18}/><ArrowUpRight size={15}/></span></button><button className="syrox-next-card" onClick={()=>onNavigate('profile')}><div><span>03 // HUNTER IDENTITY</span><h3>Identity</h3><p>Review progression, records and the profile you are building.</p></div><span className="syrox-card-arrow"><Target size={18}/><ArrowUpRight size={15}/></span></button></section>
  </div>;
}
function Metric({icon,label,value,detail}:{icon:React.ReactNode;label:string;value:string;detail:string}){return <div className="syrox-metric"><div className="syrox-metric-icon">{icon}</div><div><span>{label}</span><strong>{value}</strong><small>{detail}</small></div></div>;}
