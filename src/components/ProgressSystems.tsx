import { useMemo } from 'react';
import { BarChart3, Eye, Flag, History, Sparkles, Trophy, TrendingUp } from 'lucide-react';
import type { AppState } from '../store/types';

const clamp = (n:number,min=0,max=100) => Math.max(min,Math.min(max,n));
const dayMs = 86400000;
const daysSince = (date:string|null) => date ? Math.max(0,Math.floor((Date.now()-new Date(date+'T00:00:00').getTime())/dayMs)) : 0;

export function ProgressSystems({ state }: { state: AppState }) {
  const analytics = useMemo(() => {
    const history = [...state.history].sort((a,b)=>a.date.localeCompare(b.date));
    const avg = history.length ? Math.round(history.reduce((s,d)=>s+d.disciplineScore,0)/history.length) : 0;
    const best = history.reduce((m,d)=>Math.max(m,d.disciplineScore),0);
    const week = history.filter(d=>daysSince(d.date)<7);
    const previous = history.filter(d=>daysSince(d.date)>=7 && daysSince(d.date)<14);
    const weekScore = week.length ? Math.round(week.reduce((s,d)=>s+d.disciplineScore,0)/week.length) : 0;
    const prevScore = previous.length ? Math.round(previous.reduce((s,d)=>s+d.disciplineScore,0)/previous.length) : 0;
    const trend = weekScore-prevScore;
    return { avg,best,weekScore,trend,days:history.length };
  },[state.history]);

  const records = useMemo(() => {
    const dailyXp = state.history.reduce((m,d)=>Math.max(m,d.xpGained),0);
    const weeklyTasks = Array.from({length:12},(_,i)=>state.history.filter(d=>daysSince(d.date)>=i*7 && daysSince(d.date)<(i+1)*7).reduce((s,d)=>s+Object.values(d.coreCompleted).filter(Boolean).length+Object.values(d.customCompleted).filter(Boolean).length,0));
    const bestWeek = Math.max(0,...weeklyTasks);
    return { bestStreak:state.bestStreak, dailyXp, bestWeek, workouts:state.workoutSessions.length };
  },[state.history,state.bestStreak,state.workoutSessions.length]);

  const mirror = useMemo(() => {
    const first = state.history[0];
    const firstScore = first?.disciplineScore ?? 0;
    const current = analytics.avg;
    return { firstScore,current,delta:current-firstScore, startXp:first?.xpGained ?? 0 };
  },[state.history,analytics.avg]);

  const future = useMemo(() => {
    const daily = state.history.length ? state.xp / Math.max(1,state.history.length) : 0;
    const current30 = Math.round(state.xp + daily*30);
    const strong30 = Math.round(state.xp + Math.max(daily*1.35,20)*30);
    return { current30,strong30,gain:Math.max(0,strong30-current30) };
  },[state.xp,state.history]);

  const milestones = [
    ['7 DAY STREAK',state.bestStreak>=7],['30 DAY STREAK',state.bestStreak>=30],['100 WORKOUTS',state.workoutSessions.length>=100],['RANK A',/\bA\b/i.test(String(state.xp))],['STORY ARC',Object.values(state.storyBossDefeated).filter(Boolean).length>=1],
  ];
  const completedMilestones = milestones.filter(([,done])=>done).length;

  return <div className="progress-systems">
    <section className="progress-system-panel"><div className="progress-system-heading"><div><span>LIVE ANALYTICS</span><h2>Progress Analytics</h2></div><BarChart3 size={19}/></div><div className="progress-system-grid"><Metric label="Consistency" value={`${analytics.avg}%`} /><Metric label="Best Day" value={`${analytics.best}%`} /><Metric label="7-Day Score" value={`${analytics.weekScore}%`} /><Metric label="Trend" value={`${analytics.trend>=0?'+':''}${analytics.trend}%`} /></div></section>

    <section className="progress-system-panel mirror-panel"><div className="progress-system-heading"><div><span>IDENTITY SYSTEM</span><h2><Eye size={18}/> The Mirror</h2></div><Sparkles size={19}/></div><p>Day 1 → Today. Your record is compared against your own starting point.</p><div className="mirror-values"><Metric label="Starting Discipline" value={`${mirror.firstScore}%`} /><Metric label="Current Discipline" value={`${mirror.current}%`} /><Metric label="Change" value={`${mirror.delta>=0?'+':''}${mirror.delta}%`} /></div></section>

    <section className="progress-system-panel"><div className="progress-system-heading"><div><span>PERSONAL RECORDS</span><h2><Trophy size={18}/> Records</h2></div><Flag size={19}/></div><div className="progress-system-grid"><Metric label="Longest Streak" value={`${records.bestStreak}d`} /><Metric label="Most XP / Day" value={records.dailyXp.toLocaleString()} /><Metric label="Best Week Tasks" value={String(records.bestWeek)} /><Metric label="Workouts" value={String(records.workouts)} /></div></section>

    <section className="progress-system-panel"><div className="progress-system-heading"><div><span>MILESTONES</span><h2>Major Checkpoints</h2></div><Flag size={19}/></div><div className="milestone-list">{milestones.map(([label,done])=><div key={label} className={done?'is-done':''}><span>{done?'✓':'○'}</span><b>{label}</b></div>)}</div><small>{completedMilestones}/{milestones.length} unlocked</small></section>

    <section className="progress-system-panel future-panel"><div className="progress-system-heading"><div><span>STRYVEN SIMULATION</span><h2><TrendingUp size={18}/> Future You</h2></div><Sparkles size={19}/></div><p>30-day projection based on your current recorded pace. This is a simulation, not a real-world guarantee.</p><div className="future-bars"><div><span>Current Pace</span><b>{current30Label(future.current30)}</b><i style={{width:`${clamp((future.current30/Math.max(1,future.strong30))*100)}%`}}/></div><div><span>High Performance</span><b>{current30Label(future.strong30)}</b><i style={{width:'100%'}}/></div></div></section>

    <section className="progress-system-panel"><div className="progress-system-heading"><div><span>LEGACY</span><h2><History size={18}/> Permanent Record</h2></div><History size={19}/></div><div className="progress-system-grid"><Metric label="Season XP" value={state.seasonXp.toLocaleString()} /><Metric label="Lifetime Days" value={String(analytics.days)} /><Metric label="Best Streak" value={`${state.bestStreak}d`} /><Metric label="Prestige" value={String(state.prestigeLevel)} /></div></section>
  </div>;
}
function current30Label(n:number){ return n.toLocaleString()+' XP'; }
function Metric({label,value}:{label:string;value:string}){ return <div className="progress-metric"><span>{label}</span><strong>{value}</strong></div>; }
