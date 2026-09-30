import { lazy, Suspense, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { ViewId } from '../components/Navigation';
import { useStore } from '../store/useStore';
import { getRankByXp, getNextRank } from '../data/ranks';
import { XpBar } from '../components/ui/XpBar';
import { ActionNotes } from '../components/ActionNotes';
import { Activity, ArrowUpRight, Check, CheckCircle2, Dumbbell, Flame, Target, UserRound, Zap } from 'lucide-react';

const Tasks = lazy(() => import('./Tasks').then(m => ({ default: m.Tasks })));
interface DashboardProps { onNavigate: (v: ViewId) => void; }

export function Dashboard({ onNavigate }: DashboardProps) {
  const { state, toggleCoreTask } = useStore();
  const rank = getRankByXp(state.xp);
  const nextRank = getNextRank(state.xp);
  const activeTasks = state.mainTasks.filter(t => t.enabled);
  const mainDone = activeTasks.filter(t => state.coreCompleted[t.id]).length;
  const customDone = state.customTasks.filter(t => state.customCompleted[t.id]).length;
  const total = activeTasks.length + state.customTasks.length;
  const done = mainDone + customDone;
  const progress = total ? Math.round(done / total * 100) : 0;
  const remaining = nextRank ? Math.max(0, nextRank.xpRequired - state.xp) : 0;
  const initials = (state.username || 'ST').slice(0, 2).toUpperCase();
  const directive = useMemo(() => {
    const mission = activeTasks.find(t => !state.coreCompleted[t.id]);
    if (mission) return { title: mission.label, xp: mission.points, type: 'CORE MISSION', icon: mission.emoji };
    const action = state.customTasks.find(t => !state.customCompleted[t.id]);
    if (action) return { title: action.label, xp: action.points, type: 'PERSONAL COMMAND', icon: '✦' };
    return { title: 'ENTER TRAINING', xp: 150, type: 'SYSTEM DIRECTIVE', icon: '◈' };
  }, [activeTasks, state.coreCompleted, state.customTasks, state.customCompleted]);

  return <div className="sv-command">
    <section className="sv-command-hero">
      <div className="sv-command-hero__scan" />
      <div className="sv-command-hero__main">
        <div className="sv-eyebrow"><span className="sv-online-dot"/> STRYVEN // COMMAND</div>
        <div className="sv-hero-identity">
          <div className="sv-identity-seal">{initials}</div>
          <div><span>SYSTEM IDENTITY // ONLINE</span><h1 style={{ color: state.nameColor }}>{state.username || 'Hunter'}</h1><p><b style={{ color: rank.color }}>{rank.name}</b><i /> LEVEL {state.level} <i /> {state.streak} DAY STREAK</p></div>
        </div>
        <p className="sv-hero-copy">Your day is built from actions. Execute the next command, convert it into XP, and push the system toward ascension.</p>
        <div className="sv-hero-actions"><button className="sv-btn sv-btn--primary" onClick={() => onNavigate('workout')}><Dumbbell size={16}/> START TRAINING <ArrowUpRight size={14}/></button><button className="sv-btn sv-btn--ghost" onClick={() => onNavigate('profile')}><UserRound size={16}/> OPEN IDENTITY</button></div>
      </div>
      <div className="sv-command-hero__progress"><span>STRYVEN CORE // PROGRESSION</span><strong>{state.xp.toLocaleString()} <small>XP</small></strong><div className="sv-rank-seal" style={{ borderColor: rank.color }}><b>{rank.emoji}</b><span style={{ color: rank.color }}>{rank.name}</span></div><XpBar xp={state.xp}/><small>{nextRank ? `${remaining.toLocaleString()} XP UNTIL ${nextRank.name.toUpperCase()}` : 'MAXIMUM RANK REACHED'}</small></div>
    </section>

    <section className="sv-directive"><div className="sv-directive__label"><span>01 // TODAY'S DIRECTIVE</span><b>EXECUTE NEXT</b></div><div className="sv-directive__body"><div className="sv-directive__icon">{directive.icon}</div><div><span>{directive.type}</span><h2>{directive.title}</h2><p>One completed action moves the Core forward.</p></div><strong>+{directive.xp} XP</strong></div></section>

    <section className="sv-metric-row"><Metric icon={<Target size={15}/>} label="OBJECTIVES" value={`${done}/${total}`} detail={`${progress}% DAILY CLEARANCE`}/><Metric icon={<Zap size={15}/>} label="XP TODAY" value={`+${state.dailyXp.toLocaleString()}`} detail={`${state.xp.toLocaleString()} TOTAL XP`}/><Metric icon={<Flame size={15}/>} label="STREAK" value={`${state.streak}D`} detail={`BEST ${state.bestStreak} DAYS`}/><Metric icon={<Dumbbell size={15}/>} label="TRAINING" value={state.workoutsCompletedToday ? 'CLEAR' : 'PENDING'} detail={`${Math.round(state.totalWorkoutSeconds / 60)} MIN TOTAL`}/></section>

    <section className="sv-section sv-missions"><div className="sv-section-head"><div><span>02 // COMMAND QUEUE</span><h2>Today's Operations</h2><p>Core missions stay inside Command. No separate mission page.</p></div><button onClick={() => onNavigate('settings')}>CONFIG</button></div><div className="sv-board"><Suspense fallback={<div className="sv-loading">LOADING COMMAND QUEUE…</div>}><Tasks/></Suspense></div><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:8,padding:'12px 14px 16px'}}>{activeTasks.slice(0,4).map(task=><button key={task.id} onClick={()=>toggleCoreTask(task.id)} style={{textAlign:'left',padding:'12px',border:'1px solid rgba(255,255,255,.07)',background:state.coreCompleted[task.id]?'#10090e':'#09090e',color:'#ddd'}}><span style={{fontSize:8,letterSpacing:'.14em',color:'#666671'}}>{state.coreCompleted[task.id]?'COMPLETED':'READY'}</span><strong style={{display:'block',marginTop:5,fontSize:11}}>{state.coreCompleted[task.id]?<Check size={13} style={{verticalAlign:'-2px',marginRight:5}}/>:null}{task.label}</strong><small style={{display:'block',marginTop:5,color:'#777783'}}>+{task.points} XP</small></button>)}</div></section>

    <ActionNotes/>
    <section className="sv-lower-grid"><button className="sv-route-card sv-route-card--training" onClick={() => onNavigate('workout')}><span>04 // PHYSICAL SYSTEM</span><h3>Training Protocol</h3><p>Enter the dedicated training experience. Your session feeds the same progression Core.</p><b><Dumbbell size={17}/> ENTER TRAINING <ArrowUpRight size={14}/></b></button><button className="sv-route-card" onClick={() => onNavigate('profile')}><span>05 // SYSTEM IDENTITY</span><h3>Identity Record</h3><p>Review rank, attributes, achievements, records and ascension history.</p><b><UserRound size={17}/> OPEN IDENTITY <ArrowUpRight size={14}/></b></button></section>
    <section className="sv-section" style={{padding:20}}><div className="sv-section-head" style={{padding:0,border:0,marginBottom:16}}><div><span>06 // CORE ATTRIBUTES</span><h2>System State</h2><p>Four signals that summarize the discipline loop.</p></div></div><div className="sv-attribute-grid" style={{border:0}}><Attribute icon={<Dumbbell size={15}/>} label="STRENGTH" value={Math.min(100,state.workoutSessions.length*5)}/><Attribute icon={<Activity size={15}/>} label="FOCUS" value={Math.min(100,customDone*4)}/><Attribute icon={<Activity size={15}/>} label="ENDURANCE" value={Math.min(100,Math.round(state.totalWorkoutSeconds/360))}/><Attribute icon={<Target size={15}/>} label="DISCIPLINE" value={progress}/></div></section>
    <section className="sv-today-strip"><span>TODAY // SYSTEM STATUS</span><b>{done}/{total} OBJECTIVES COMPLETE</b><i/><b>{state.dailyXp.toLocaleString()} XP EARNED</b><i/><b>{state.workoutsCompletedToday > 0 ? 'TRAINING COMPLETE' : 'TRAINING PENDING'}</b></section>
  </div>;
}
function Metric({icon,label,value,detail}:{icon:ReactNode;label:string;value:string;detail:string}){return <div className="sv-metric"><div className="sv-metric__icon">{icon}</div><div><span>{label}</span><strong>{value}</strong><small>{detail}</small></div></div>}
function Attribute({icon,label,value}:{icon:ReactNode;label:string;value:number}){return <div className="sv-attribute"><div>{icon}</div><span>{label}</span><strong>{value}</strong><i><b style={{width:`${value}%`}}/></i></div>}
