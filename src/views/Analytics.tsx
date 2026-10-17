import { Activity, CalendarDays, Flame, Trophy, Zap, Dumbbell } from 'lucide-react';
import { useStore } from '../store/useStore';
import { getRankByXp, getNextRank } from '../data/ranks';

export function Analytics() {
  const { state } = useStore();
  const rank = getRankByXp(state.xp);
  const nextRank = getNextRank(state.xp);
  const days = [...state.history].sort((a,b)=>a.date.localeCompare(b.date)).slice(-14);
  const maxXp = Math.max(1, ...days.map(day=>day.xpGained));
  const sessions = state.workoutSessions.length;
  const completedMissions = days.reduce((sum,day)=>sum+Object.values(day.coreCompleted).filter(Boolean).length+Object.values(day.customCompleted).filter(Boolean).length,0);
  const formatDuration = (seconds:number) => `${Math.floor(seconds/3600)}h ${Math.floor(seconds%3600/60)}m`;
  return <div className="sv-command sv-page-module">
    <header className="sv-module-header"><div><p className="sv-eyebrow"><Activity size={14}/> STRYVEN / INTELLIGENCE</p><h1>Progress &amp; Analytics</h1><p>Measured from your saved activity. No estimated stats.</p></div><div className="sv-identity-rank"><span style={{color:rank.color}}>{rank.emoji}</span><b>{rank.name}</b></div></header>
    <div className="sv-metric-row sv-analytics-metrics">
      <article className="sv-metric"><span className="sv-metric__icon"><Zap size={17}/></span><div><small>TOTAL XP</small><strong>{state.xp.toLocaleString()}</strong></div></article>
      <article className="sv-metric"><span className="sv-metric__icon"><Trophy size={17}/></span><div><small>MISSIONS IN HISTORY</small><strong>{completedMissions}</strong></div></article>
      <article className="sv-metric"><span className="sv-metric__icon"><Dumbbell size={17}/></span><div><small>TRAINING SESSIONS</small><strong>{sessions}</strong></div></article>
      <article className="sv-metric"><span className="sv-metric__icon"><Flame size={17}/></span><div><small>CURRENT STREAK</small><strong>{state.streak} days</strong></div></article>
    </div>
    <section className="sv-section sv-surface"><div className="sv-section-head"><div><p className="sv-eyebrow">RECENT ACTIVITY</p><h2>XP Output / Last 14 Recorded Days</h2><p>Only dates present in your saved history are shown.</p></div><CalendarDays size={19}/></div>
      {days.length ? <div className="sv-chart-bars">{days.map(day=><div className="sv-chart-column" key={day.date} title={`${day.date}: ${day.xpGained} XP`}><strong>{day.xpGained}</strong><span><i style={{height:`${Math.max(3,day.xpGained/maxXp*100)}%`}}/></span><small>{day.date.slice(5)}</small></div>)}</div> : <div className="sv-empty-record">NO SAVED DAILY HISTORY YET</div>}
    </section>
    <section className="sv-section sv-surface"><div className="sv-section-head"><div><p className="sv-eyebrow">RANK PROGRESSION</p><h2>{rank.name}</h2><p>{nextRank ? `Next rank: ${nextRank.name}` : 'Highest rank reached.'}</p></div><strong>{state.xp.toLocaleString()} XP</strong></div>
      {nextRank ? <><div className="sv-page-progress"><span style={{width:`${Math.max(0,Math.min(100,(state.xp-rank.xpRequired)/(nextRank.xpRequired-rank.xpRequired)*100))}%`}}/></div><div className="sv-analytics-foot"><span>Current rank threshold: {rank.xpRequired.toLocaleString()} XP</span><span>Next threshold: {nextRank.xpRequired.toLocaleString()} XP</span></div></> : <p>All rank thresholds completed.</p>}
      <div className="sv-analytics-summary"><div><small>BEST STREAK</small><b>{state.bestStreak} days</b></div><div><small>TOTAL TRAINING TIME</small><b>{formatDuration(state.totalWorkoutSeconds)}</b></div><div><small>RECORDED DAYS</small><b>{state.history.length}</b></div></div>
    </section>
  </div>;
}
