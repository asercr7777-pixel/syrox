import { lazy, Suspense, useMemo } from 'react';
import type { ViewId } from '../components/Navigation';
import { useStore } from '../store/useStore';
import { getRankByXp, getNextRank } from '../data/ranks';
import { UserAvatar } from '../components/ui/UserAvatar';
import { XpBar } from '../components/ui/XpBar';
import { ActionNotes } from '../components/ActionNotes';
import { Activity, ArrowUpRight, CheckCircle2, Dumbbell, Target, UserRound, Zap } from 'lucide-react';

const Tasks = lazy(() => import('./Tasks').then(m => ({ default: m.Tasks })));
interface DashboardProps { onNavigate: (v: ViewId) => void; }

export function Dashboard({ onNavigate }: DashboardProps) {
  const { state } = useStore();
  const rank = getRankByXp(state.xp);
  const nextRank = getNextRank(state.xp);
  const activeTasks = state.mainTasks.filter(t => t.enabled);
  const mainDone = activeTasks.filter(t => state.coreCompleted[t.id]).length;
  const actionDone = state.customTasks.filter(t => state.customCompleted[t.id]).length;
  const total = activeTasks.length + state.customTasks.length;
  const done = mainDone + actionDone;
  const progress = total ? Math.round((done / total) * 100) : 0;
  const todayActions = state.customTasks.filter(t => state.customCompleted[t.id]).reduce((sum,t)=>sum+t.points,0);
  const directive = useMemo(() => {
    const mission = activeTasks.find(t => !state.coreCompleted[t.id]);
    if (mission) return { title: mission.label, xp: mission.points, type: 'MISSION', icon: mission.emoji };
    const action = state.customTasks.find(t => !state.customCompleted[t.id]);
    if (action) return { title: action.label, xp: action.points, type: 'ACTION', icon: '✦' };
    return { title: 'ENTER TRAINING', xp: 150, type: 'SYSTEM', icon: '⚔' };
  }, [activeTasks, state.coreCompleted, state.customTasks, state.customCompleted]);

  return <div className="sv-command">
    <section className="sv-command-hero">
      <div className="sv-command-hero__scan"/>
      <div className="sv-command-hero__main">
        <div className="sv-eyebrow"><span className="sv-online-dot"/> STRYVEN // COMMAND CENTER</div>
        <div className="sv-hero-identity">
          <UserAvatar avatar={state.avatar} rank={rank} size="lg"/>
          <div>
            <span>OPERATIVE ONLINE</span>
            <h1 style={{color:state.nameColor}}>{state.username || 'Hunter'}</h1>
            <p><b style={{color:rank.color}}>{rank.name}</b><i/> LEVEL {state.level}</p>
          </div>
        </div>
        <p className="sv-hero-copy">Your day is not a list of intentions. It is a system of actions. Choose the next command and execute.</p>
        <div className="sv-hero-actions">
          <button className="sv-btn sv-btn--primary" onClick={()=>onNavigate('workout')}><Dumbbell size={16}/> START TRAINING <ArrowUpRight size={14}/></button>
          <button className="sv-btn sv-btn--ghost" onClick={()=>onNavigate('profile')}><UserRound size={16}/> OPEN IDENTITY</button>
        </div>
      </div>
      <div className="sv-command-hero__progress">
        <span>PROGRESSION CORE</span>
        <strong>{state.xp.toLocaleString()} <small>XP</small></strong>
        <div className="sv-rank-seal" style={{borderColor:rank.color,boxShadow:'0 0 50px '+rank.glow}}>
          <b>{rank.emoji}</b><span style={{color:rank.color}}>{rank.name}</span>
        </div>
        <XpBar xp={state.xp}/>
        <small>{nextRank ? (Math.max(0,nextRank.xpRequired-state.xp).toLocaleString()+' XP UNTIL '+nextRank.name.toUpperCase()) : 'MAXIMUM RANK'}</small>
      </div>
    </section>

    <section className="sv-directive">
      <div className="sv-directive__label"><span>01 // TODAY'S DIRECTIVE</span><b>EXECUTE NEXT</b></div>
      <div className="sv-directive__body">
        <div className="sv-directive__icon">{directive.icon}</div>
        <div><span>{directive.type}</span><h2>{directive.title}</h2><p>Complete this command and move to the next.</p></div>
        <strong>+{directive.xp} XP</strong>
      </div>
    </section>

    <section className="sv-metric-row">
      <Metric icon={<Target size={15}/>} label="MISSIONS" value={mainDone+'/'+activeTasks.length} detail={progress+'% SYSTEM COMPLETION'}/>
      <Metric icon={<Zap size={15}/>} label="TODAY XP" value={'+'+state.dailyXp.toLocaleString()} detail={todayActions+' XP FROM ACTIONS'}/>
      <Metric icon={<Activity size={15}/>} label="LEVEL" value={String(state.level)} detail={rank.name}/>
      <Metric icon={<CheckCircle2 size={15}/>} label="ACTIONS" value={String(actionDone)} detail={state.customTasks.length+' QUEUED'}/>
    </section>

    <section className="sv-section sv-missions">
      <div className="sv-section-head"><div><span>02 // CORE OPERATIONS</span><h2>Mission Board</h2><p>Recurring missions live directly inside Command.</p></div><button onClick={()=>onNavigate('settings')} aria-label="Open system settings">SYSTEM</button></div>
      <div className="sv-board"><Suspense fallback={<div className="sv-loading">LOADING COMMAND BOARD…</div>}><Tasks/></Suspense></div>
    </section>

    <ActionNotes/>

    <section className="sv-lower-grid">
      <button className="sv-route-card sv-route-card--training" onClick={()=>onNavigate('workout')}>
        <span>04 // PHYSICAL SYSTEM</span><h3>Training Chamber</h3><p>Enter the dedicated training experience. Keep the rest of the system out of the way.</p><b><Dumbbell size={17}/> ENTER <ArrowUpRight size={14}/></b>
      </button>
      <button className="sv-route-card" onClick={()=>onNavigate('profile')}>
        <span>05 // HUNTER IDENTITY</span><h3>Identity Record</h3><p>Review your rank, attributes, achievements and the history you are building.</p><b><UserRound size={17}/> OPEN <ArrowUpRight size={14}/></b>
      </button>
    </section>

    <section className="sv-today-strip">
      <span>TODAY // SYSTEM STATUS</span><b>{done+'/'+total} OBJECTIVES COMPLETE</b><i/><b>{state.dailyXp.toLocaleString()} XP EARNED</b><i/><b>{state.workoutsCompletedToday > 0 ? 'TRAINING COMPLETE' : 'TRAINING PENDING'}</b>
    </section>
  </div>;
}

function Metric({icon,label,value,detail}:{icon:React.ReactNode;label:string;value:string;detail:string}) {
  return <div className="sv-metric"><div className="sv-metric__icon">{icon}</div><div><span>{label}</span><strong>{value}</strong><small>{detail}</small></div></div>;
}
