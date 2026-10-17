import { useStore } from '../store/useStore';
import { getRankByXp, getNextRank } from '../data/ranks';
import { UserAvatar } from '../components/ui/UserAvatar';
import { XpBar } from '../components/ui/XpBar';
import { ALL_CHAPTERS } from '../data/story';
import { ArrowUpRight, Award, CheckCircle2, Circle, Clock3, Dumbbell, Flame, Ghost, Target, Zap } from 'lucide-react';
import type { ViewId } from '../components/Navigation';

interface DashboardProps { onNavigate: (v: ViewId) => void; }

export function Dashboard({ onNavigate }: DashboardProps) {
  const { state, toggleCoreTask, toggleCustomTask } = useStore();
  const rank = getRankByXp(state.xp);
  const nextRank = getNextRank(state.xp);
  const today = new Date();
  const greeting = today.getHours() < 12 ? 'Good morning' : today.getHours() < 18 ? 'Good afternoon' : 'Good evening';
  const dateLabel = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(today);
  const core = state.mainTasks.filter(task => task.enabled);
  const missions = [...core.map(task => ({ id: task.id, label: task.label, icon: task.emoji, xp: task.points, done: Boolean(state.coreCompleted[task.id]), custom: false })), ...state.customTasks.map(task => ({ id: task.id, label: task.label, icon: '✦', xp: task.points, done: Boolean(state.customCompleted[task.id]), custom: true }))];
  const completedToday = missions.filter(mission => mission.done).length;
  const recentHistory = [...state.history].sort((a,b) => a.date.localeCompare(b.date)).slice(-7);
  const totalCompleted = state.history.reduce((sum,day) => sum + Object.values(day.coreCompleted).filter(Boolean).length + Object.values(day.customCompleted).filter(Boolean).length, 0);
  const lastSession = [...state.workoutSessions].sort((a,b) => b.completedAt-a.completedAt)[0];
  const shadows = ALL_CHAPTERS.filter(chapter => Boolean(state.storyBossDefeated[chapter.boss.id])).length;
  const disciplineAverage = state.history.length ? Math.round(state.history.reduce((sum,day)=>sum+day.disciplineScore,0)/state.history.length) : null;
  const nextRankProgress = nextRank ? Math.max(0,Math.min(100,((state.xp-rank.xpRequired)/Math.max(1,nextRank.xpRequired-rank.xpRequired))*100)) : 100;
  const formatDuration = (seconds:number) => `${Math.floor(seconds/3600)}h ${Math.floor(seconds%3600/60)}m`;
  const formatSessionDate = (timestamp:number) => new Intl.DateTimeFormat(undefined,{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}).format(timestamp);

  return <div className="sv-command sv-dashboard">
    <section className="sv-command-hero">
      <div className="sv-command-hero__scan"/>
      <div className="sv-command-hero__main">
        <div className="sv-eyebrow"><span className="sv-online-dot"/> STRYVEN // COMMAND CENTER</div>
        <div className="sv-hero-identity">
          <UserAvatar avatar={state.avatar} rank={rank} size="lg"/>
          <div><span>{greeting.toUpperCase()} / HUNTER ONLINE</span><h1 style={{color:state.nameColor}}>{state.username || 'Hunter'}</h1><p><b style={{color:rank.color}}>{rank.name}</b><i/> LEVEL {state.level}</p></div>
        </div>
        <p className="sv-hero-copy">{dateLabel}. Your next level is built from the actions you confirm today. Choose a mission or enter training.</p>
        <div className="sv-hero-actions">
          <button className="sv-btn sv-btn--primary" onClick={()=>onNavigate('workout')}><Dumbbell size={16}/> START TRAINING <ArrowUpRight size={14}/></button>
          <button className="sv-btn sv-btn--ghost" onClick={()=>onNavigate('missions')}><Target size={16}/> VIEW MISSIONS</button>
        </div>
      </div>
      <div className="sv-command-hero__progress">
        <span>HUNTER PROGRESSION</span><strong>{state.xp.toLocaleString()} <small>XP</small></strong>
        <div className="sv-rank-seal" style={{borderColor:rank.color,boxShadow:'0 0 50px '+rank.glow}}><b>{rank.emoji}</b><span style={{color:rank.color}}>{rank.name}</span></div>
        <XpBar xp={state.xp}/>
        <small>{nextRank ? `${Math.max(0,nextRank.xpRequired-state.xp).toLocaleString()} XP UNTIL ${nextRank.name.toUpperCase()}` : 'MAXIMUM RANK'}</small>
        <div className="sv-dashboard-rankline"><span>Rank progress</span><b>{Math.round(nextRankProgress)}%</b></div><div className="sv-page-progress"><span style={{width:`${nextRankProgress}%`}}/></div>
      </div>
    </section>

    <section className="sv-dashboard-stat-grid">
      <Stat icon={<Zap size={17}/>} label="TOTAL XP" value={state.xp.toLocaleString()} detail="Lifetime progression"/>
      <Stat icon={<CheckCircle2 size={17}/>} label="MISSIONS COMPLETED" value={String(totalCompleted)} detail="Recorded in history"/>
      <Stat icon={<Dumbbell size={17}/>} label="TRAINING SESSIONS" value={String(state.workoutSessions.length)} detail={formatDuration(state.totalWorkoutSeconds) + ' logged'}/>
      <Stat icon={<Flame size={17}/>} label="CURRENT STREAK" value={`${state.streak} days`} detail={`Best: ${state.bestStreak} days`}/>
    </section>

    <div className="sv-dashboard-grid">
      <section className="sv-section sv-surface">
        <div className="sv-section-head"><div><span className="sv-eyebrow">01 // DAILY OBJECTIVES</span><h2>Mission Board</h2><p>{completedToday} of {missions.length} missions confirmed today.</p></div><button onClick={()=>onNavigate('missions')}>ALL MISSIONS <ArrowUpRight size={13}/></button></div>
        <div className="sv-page-progress"><span style={{width:`${missions.length?completedToday/missions.length*100:0}%`}}/></div>
        <div className="sv-dashboard-missions">{missions.slice(0,5).map(mission=><article key={mission.id} className={`sv-dashboard-mission ${mission.done?'is-complete':''}`}><button aria-label={mission.done?'Mark mission incomplete':'Confirm mission complete'} onClick={()=>mission.custom?toggleCustomTask(mission.id):toggleCoreTask(mission.id)}>{mission.done?<CheckCircle2 size={19}/>:<Circle size={19}/>}</button><span className="sv-dashboard-mission-icon">{mission.icon}</span><div><b>{mission.label}</b><small>{mission.custom?'PERSONAL MISSION':'SYSTEM MISSION'}</small></div><strong>+{mission.xp} XP</strong></article>)}
          {missions.length===0&&<div className="sv-empty-record">NO ACTIVE MISSIONS. ADD A MISSION TO BEGIN.</div>}
        </div>
      </section>

      <section className="sv-section sv-surface sv-training-command">
        <div className="sv-section-head"><div><span className="sv-eyebrow">02 // TRAINING COMMAND</span><h2>Training Chamber</h2><p>Choose exercises and record your session.</p></div><Dumbbell size={19}/></div>
        {lastSession ? <div className="sv-last-session"><div className="sv-last-session-icon"><Clock3 size={20}/></div><div><small>LAST RECORDED SESSION</small><b>{lastSession.type.toUpperCase()} TRAINING</b><span>{formatSessionDate(lastSession.completedAt)} · {formatDuration(lastSession.durationSeconds)}</span></div></div> : <div className="sv-training-empty"><Dumbbell size={24}/><b>No training session recorded yet</b><span>Your first session will appear here.</span></div>}
        <div className="sv-training-facts"><div><small>SESSIONS</small><b>{state.workoutSessions.length}</b></div><div><small>TOTAL TIME</small><b>{formatDuration(state.totalWorkoutSeconds)}</b></div><div><small>TODAY</small><b>{state.workoutsCompletedToday>0?'RECORDED':'NOT RECORDED'}</b></div></div>
        <button className="sv-btn sv-btn--primary sv-dashboard-full-button" onClick={()=>onNavigate('workout')}>OPEN TRAINING <ArrowUpRight size={15}/></button>
      </section>
    </div>

    <section className="sv-section sv-surface">
      <div className="sv-section-head"><div><span className="sv-eyebrow">03 // PROGRESS INTELLIGENCE</span><h2>Recent Progress</h2><p>XP earned on dates available in your saved history.</p></div><button onClick={()=>onNavigate('analytics')}>ANALYTICS <ArrowUpRight size={13}/></button></div>
      {recentHistory.length ? <div className="sv-chart-bars">{recentHistory.map(day=><div className="sv-chart-column" key={day.date} title={`${day.date}: ${day.xpGained} XP`}><strong>{day.xpGained}</strong><span><i style={{height:`${Math.max(3,day.xpGained/Math.max(1,...recentHistory.map(item=>item.xpGained))*100)}%`}}/></span><small>{day.date.slice(5)}</small></div>)}</div> : <div className="sv-empty-record">YOUR PROGRESS CHART WILL APPEAR AFTER YOUR FIRST SAVED DAY.</div>}
    </section>

    <div className="sv-dashboard-grid">
      <section className="sv-section sv-surface">
        <div className="sv-section-head"><div><span className="sv-eyebrow">04 // ATTRIBUTE REGISTER</span><h2>Hunter Attributes</h2><p>Only tracked records are shown as values.</p></div><button onClick={()=>onNavigate('profile')}>PROFILE <ArrowUpRight size={13}/></button></div>
        <div className="sv-dashboard-attributes">
          <Attribute label="STRENGTH" value={`${state.workoutSessions.length} sessions`} detail="Training log"/>
          <Attribute label="ENDURANCE" value={formatDuration(state.totalWorkoutSeconds)} detail="Training time"/>
          <Attribute label="MOBILITY" value="Not tracked" detail="No saved metric"/>
          <Attribute label="FLEXIBILITY" value="Not tracked" detail="No saved metric"/>
          <Attribute label="DISCIPLINE" value={disciplineAverage===null?'Not tracked':`${disciplineAverage}%`} detail="Saved daily score"/>
          <Attribute label="FOCUS" value="Not tracked" detail="No saved metric"/>
          <Attribute label="LEARNING" value="Not tracked" detail="No saved metric"/>
          <Attribute label="CONSISTENCY" value={`${state.streak}-day streak`} detail="Current streak"/>
        </div>
      </section>
      <section className="sv-section sv-surface">
        <div className="sv-section-head"><div><span className="sv-eyebrow">05 // SHADOW COMMAND</span><h2>Shadow Army</h2><p>Confirmed story-boss victories only.</p></div><Ghost size={19}/></div>
        <div className="sv-shadow-preview"><div className="sv-shadow-mark"><Ghost size={28}/></div><div><b>{shadows} bound shadow{shadows===1?'':'s'}</b><span>{shadows?'Victory records detected in your story data.':'No confirmed shadow victories recorded yet.'}</span></div></div>
        <button className="sv-btn sv-btn--ghost sv-dashboard-full-button" onClick={()=>onNavigate('shadows')}>OPEN SHADOW ARMY <ArrowUpRight size={15}/></button>
      </section>
    </div>

    <section className="sv-section sv-surface">
      <div className="sv-section-head"><div><span className="sv-eyebrow">06 // HONORS</span><h2>Recent Achievements</h2><p>Your saved achievement records.</p></div><button onClick={()=>onNavigate('achievements')}>VIEW ALL <ArrowUpRight size={13}/></button></div>
      {state.achievements.length ? <div className="sv-earned-list">{[...state.achievements].sort((a,b)=>b.unlockedAt-a.unlockedAt).slice(0,3).map(item=><div key={item.id}><Award size={17}/><b>{item.id.replace(/[_-]/g,' ')}</b><small>{new Date(item.unlockedAt).toLocaleDateString()}</small></div>)}</div> : <div className="sv-empty-record">NO ACHIEVEMENTS RECORDED YET. COMPLETE OBJECTIVES TO BUILD YOUR LEGACY.</div>}
    </section>

    <div className="sv-today-strip"><span>TODAY // SYSTEM STATUS</span><b>{completedToday}/{missions.length} OBJECTIVES CONFIRMED</b><i/><b>{state.dailyXp.toLocaleString()} XP EARNED</b><i/><b>{state.workoutsCompletedToday>0?'TRAINING RECORDED':'TRAINING PENDING'}</b></div>
  </div>;
}

function Stat({icon,label,value,detail}:{icon:React.ReactNode;label:string;value:string;detail:string}) {
  return <article className="sv-dashboard-stat"><span>{icon}</span><div><small>{label}</small><strong>{value}</strong><p>{detail}</p></div></article>;
}
function Attribute({label,value,detail}:{label:string;value:string;detail:string}) {
  return <div className="sv-dashboard-attribute"><small>{label}</small><b>{value}</b><span>{detail}</span></div>;
}
