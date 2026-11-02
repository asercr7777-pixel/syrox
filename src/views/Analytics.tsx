import { useMemo, useState } from 'react';
import { Activity, CalendarDays, Clock3, Dumbbell, Flame, Target, Trophy, Zap, BookOpen, ChevronRight, Swords } from 'lucide-react';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis
} from 'recharts';
import { useStore } from '../store/useStore';
import { getRankByXp, getNextRank } from '../data/ranks';

type RangeDays = 7 | 14 | 30;
const dateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
const todayKey = () => dateKey(new Date());
const formatDuration = (seconds:number) => {
  const safe = Math.max(0, Math.floor(seconds || 0));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  return hours ? `${hours}h ${minutes}m` : `${minutes}m`;
};
const prettyDate = (value:string) => new Date(`${value}T12:00:00`).toLocaleDateString(undefined,{weekday:'long',day:'numeric',month:'long',year:'numeric'});
const chartTooltip = { contentStyle:{background:'#101522',border:'1px solid #8c75dc55',borderRadius:12,color:'#f4f6ff'},labelStyle:{color:'#aab7d2'},itemStyle:{color:'#66e5f2'} };

export function Analytics() {
  const { state } = useStore();
  const [range,setRange] = useState<RangeDays>(14);
  const [selectedDate,setSelectedDate] = useState(todayKey());
  const rank = getRankByXp(state.xp);
  const nextRank = getNextRank(state.xp);
  const today = todayKey();
  const historyByDate = useMemo(()=>new Map(state.history.map(day=>[day.date,day])),[state.history]);
  const sessionsByDate = useMemo(()=>{
    const grouped = new Map<string,typeof state.workoutSessions>();
    state.workoutSessions.forEach(session=>{
      const key = dateKey(new Date(session.completedAt));
      grouped.set(key,[...(grouped.get(key)??[]),session]);
    });
    return grouped;
  },[state.workoutSessions]);
  const chartData = useMemo(()=>{
    const rows = [];
    for(let offset=range-1;offset>=0;offset--){
      const date = new Date();
      date.setHours(12,0,0,0);
      date.setDate(date.getDate()-offset);
      const key = dateKey(date);
      const record = historyByDate.get(key);
      const current = key===today;
      const core = current ? state.coreCompleted : record?.coreCompleted ?? {};
      const custom = current ? state.customCompleted : record?.customCompleted ?? {};
      const taskCount = Object.values(core).filter(Boolean).length + Object.values(custom).filter(Boolean).length;
      const sessions = sessionsByDate.get(key)??[];
      const fallbackWorkout = !sessions.length && (current ? state.workoutsCompletedToday>0 : Boolean(record?.workoutCompleted));
      rows.push({
        date:key,
        label:date.toLocaleDateString(undefined,{month:'short',day:'numeric'}),
        xp:current?state.dailyXp:(record?.xpGained??0),
        tasks:taskCount,
        workouts:sessions.length || (fallbackWorkout?1:0),
        minutes:Math.round(sessions.reduce((sum,session)=>sum+session.durationSeconds,0)/60)
      });
    }
    return rows;
  },[range,historyByDate,sessionsByDate,today,state.coreCompleted,state.customCompleted,state.dailyXp,state.workoutsCompletedToday]);
  const selectedRecord = historyByDate.get(selectedDate);
  const isToday = selectedDate===today;
  const coreCompleted = isToday ? state.coreCompleted : selectedRecord?.coreCompleted??{};
  const customCompleted = isToday ? state.customCompleted : selectedRecord?.customCompleted??{};
  const completedCore = state.mainTasks.filter(task=>Boolean(coreCompleted[task.id]));
  const completedCustom = state.customTasks.filter(task=>Boolean(customCompleted[task.id]));
  const selectedSessions = sessionsByDate.get(selectedDate)??[];
  const fallbackWorkout = selectedSessions.length===0 && (isToday ? state.workoutsCompletedToday>0 : Boolean(selectedRecord?.workoutCompleted));
  const selectedWorkoutCount = selectedSessions.length || (fallbackWorkout?1:0);
  const selectedDuration = selectedSessions.reduce((sum,session)=>sum+session.durationSeconds,0);
  const selectedXp = isToday ? state.dailyXp : selectedRecord?.xpGained??0;
  const selectedTasks = completedCore.length+completedCustom.length;
  const selectedNote = state.notes[selectedDate]??'';
  const maxXp = Math.max(1,...chartData.map(row=>row.xp));
  const maxTasks = Math.max(1,...chartData.map(row=>row.tasks));
  const maxWorkouts = Math.max(1,...chartData.map(row=>row.workouts));
  const maxMinutes = Math.max(1,...chartData.map(row=>row.minutes));
  const bestDay = chartData.reduce((best,row)=>row.xp>best.xp?row:best,chartData[0]);
  const avgXp = Math.round(chartData.reduce((sum,row)=>sum+row.xp,0)/chartData.length);
  const eventItems = [
    ...completedCore.map(task=>({key:`core-${task.id}`,time:0,icon:task.emoji,label:task.label,detail:'Core mission completed'})),
    ...completedCustom.map(task=>({key:`custom-${task.id}`,time:0,icon:task.emoji,label:task.label,detail:'Custom mission completed'})),
    ...selectedSessions.map(session=>({key:session.id,time:session.completedAt,icon:'🏋️',label:`${session.type.toUpperCase()} training`,detail:`${formatDuration(session.durationSeconds)} recorded`})),
    ...(selectedRecord?.dungeonCleared || (isToday&&state.dungeonClearedToday) ? [{key:'dungeon',time:0,icon:'⚔️',label:'Dungeon cleared',detail:'Daily dungeon completion'}] : []),
    ...(selectedRecord?.allMainDone ? [{key:'all-main',time:0,icon:'🏆',label:'All main missions completed',detail:'Every enabled core mission is done'}] : [])
  ].sort((a,b)=>a.time-b.time);
  const changeRange = (value:string) => setRange(Number(value) as RangeDays);

  return <div className="sv-command sv-page-module sv-progress">
    <style>{`
      .sv-progress{color:#eef2ff}.sv-progress .sv-module-header{display:flex;justify-content:space-between;align-items:flex-start;gap:18px;flex-wrap:wrap;margin-bottom:24px}
      .sv-progress .sv-eyebrow{display:flex;align-items:center;gap:8px;color:#8c9ab8;font:800 10px/1.5 ui-monospace,monospace;letter-spacing:.16em}
      .sv-progress h1{margin:8px 0;font-size:clamp(27px,4vw,42px);font-weight:950;letter-spacing:-.04em}
      .sv-progress .sv-subtitle{margin:0;color:#8e9ab3;font-size:13px}
      .sv-progress .sv-identity-rank{display:flex;align-items:center;gap:9px;padding:10px 14px;border:1px solid #9a6bff40;border-radius:12px;background:#9a6bff10}
      .sv-progress .sv-metric-row{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:20px 0}
      .sv-progress .sv-metric{display:flex;align-items:center;gap:13px;min-width:0;padding:17px;border:1px solid #a5b6ef20;border-radius:15px;background:linear-gradient(145deg,#141a2aee,#0b0e18f5);box-shadow:0 12px 32px #0002}
      .sv-progress .sv-metric__icon{display:grid;place-items:center;width:39px;height:39px;flex:none;border-radius:12px;background:#5cecff12;color:#62e6f3}
      .sv-progress .sv-metric small,.sv-progress .sv-summary small{display:block;color:#8793ad;font:800 9px/1.5 ui-monospace,monospace;letter-spacing:.12em}
      .sv-progress .sv-metric strong{display:block;margin-top:3px;color:#f6f7ff;font-size:22px;font-weight:900}
      .sv-progress .sv-section{margin-top:17px;padding:20px;border:1px solid #a5b6ef20;border-radius:17px;background:linear-gradient(145deg,#111624ed,#0b0e17f7);box-shadow:0 16px 42px #0002}
      .sv-progress .sv-section-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:18px}
      .sv-progress .sv-section-head h2{margin:4px 0;color:#f0f3ff;font-size:17px;font-weight:900}
      .sv-progress .sv-section-head p{margin:3px 0 0;color:#8390aa;font-size:11px}
      .sv-progress .sv-chart-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
      .sv-progress .sv-chart-card{min-width:0;padding:16px;border:1px solid #ffffff12;border-radius:14px;background:#090d17a8}
      .sv-progress .sv-chart-card h3{margin:0;color:#dce4f7;font-size:13px;font-weight:850}
      .sv-progress .sv-chart-card p{margin:4px 0 10px;color:#77849e;font-size:10px}
      .sv-progress .sv-chart-wrap{height:210px;width:100%}
      .sv-progress .sv-range-control{display:flex;gap:6px;padding:4px;border:1px solid #ffffff17;border-radius:11px;background:#080c15}
      .sv-progress .sv-range-control button{padding:7px 11px;border:1px solid transparent;border-radius:8px;background:transparent;color:#8793ad;font-size:10px;font-weight:850;cursor:pointer}
      .sv-progress .sv-range-control button.active{border-color:#5cecff45;background:#5cecff13;color:#72eaf4}
      .sv-progress .sv-day-layout{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.3fr);gap:16px}
      .sv-progress .sv-date-input{padding:10px 12px;border:1px solid #a5b6ef2b;border-radius:10px;background:#080c15;color:#eef2ff;color-scheme:dark;font:700 12px ui-monospace,monospace}
      .sv-progress .sv-day-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-bottom:16px}
      .sv-progress .sv-day-stat{padding:12px;border:1px solid #ffffff12;border-radius:11px;background:#ffffff05}
      .sv-progress .sv-day-stat b{display:block;margin-top:4px;color:#f5f7ff;font-size:17px}
      .sv-progress .sv-event-list{display:grid;gap:8px}
      .sv-progress .sv-event{display:flex;align-items:center;gap:11px;padding:10px 12px;border:1px solid #ffffff10;border-radius:11px;background:#ffffff04}
      .sv-progress .sv-event-icon{display:grid;place-items:center;width:32px;height:32px;flex:none;border-radius:9px;background:#9a6bff12;font-size:16px}
      .sv-progress .sv-event b{display:block;color:#e8edff;font-size:11px}.sv-progress .sv-event small{display:block;margin-top:3px;color:#8490a9;font-size:10px}
      .sv-progress .sv-empty{padding:24px 12px;border:1px dashed #ffffff20;border-radius:12px;color:#7f8ba4;text-align:center;font-size:11px}
      .sv-progress .sv-note{margin-top:12px;padding:13px;border-radius:11px;background:#5cecff09;border:1px solid #5cecff20;color:#9eacc5;font-size:11px;white-space:pre-wrap}
      .sv-progress .sv-rank-progress{height:9px;overflow:hidden;border-radius:99px;background:#ffffff12}.sv-progress .sv-rank-progress span{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#9a6bff,#5cecff);box-shadow:0 0 15px #5cecff55}
      .sv-progress .sv-summary{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:17px}.sv-progress .sv-summary>div{padding:13px;border:1px solid #ffffff12;border-radius:11px;background:#ffffff04}.sv-progress .sv-summary b{display:block;margin-top:5px;color:#eef2ff;font-size:14px}
      @media(max-width:760px){.sv-progress .sv-metric-row{grid-template-columns:repeat(2,minmax(0,1fr))}.sv-progress .sv-chart-grid,.sv-progress .sv-day-layout{grid-template-columns:1fr}}
      @media(max-width:440px){.sv-progress .sv-metric{padding:12px;gap:9px}.sv-progress .sv-metric strong{font-size:18px}.sv-progress .sv-section{padding:14px}.sv-progress .sv-day-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.sv-progress .sv-summary{grid-template-columns:1fr}.sv-progress .sv-range-control button{padding:7px 8px}}
    `}</style>
    <header className="sv-module-header">
      <div><p className="sv-eyebrow"><Activity size={14}/> STRYVEN / PERFORMANCE INTELLIGENCE</p><h1>Progress &amp; Analytics</h1><p className="sv-subtitle">Your real activity, measured day by day. No estimated stats.</p></div>
      <div className="sv-identity-rank"><span style={{color:rank.color,fontSize:22}}>{rank.emoji}</span><b>{rank.name}</b><small>LVL {state.level}</small></div>
    </header>
    <div className="sv-metric-row">
      <article className="sv-metric"><span className="sv-metric__icon"><Zap size={18}/></span><div><small>XP TODAY</small><strong>{state.dailyXp.toLocaleString()}</strong></div></article>
      <article className="sv-metric"><span className="sv-metric__icon"><Target size={18}/></span><div><small>TASKS COMPLETED</small><strong>{Object.values(state.coreCompleted).filter(Boolean).length+Object.values(state.customCompleted).filter(Boolean).length}</strong></div></article>
      <article className="sv-metric"><span className="sv-metric__icon"><Dumbbell size={18}/></span><div><small>WORKOUTS TODAY</small><strong>{(sessionsByDate.get(today)??[]).length||state.workoutsCompletedToday}</strong></div></article>
      <article className="sv-metric"><span className="sv-metric__icon"><Clock3 size={18}/></span><div><small>TRAINING TIME TODAY</small><strong>{formatDuration((sessionsByDate.get(today)??[]).reduce((sum,session)=>sum+session.durationSeconds,0))}</strong></div></article>
    </div>
    <section className="sv-section">
      <div className="sv-section-head"><div><p className="sv-eyebrow">PERFORMANCE TIMELINE</p><h2>Daily activity charts</h2><p>Each chart uses saved records for the selected period.</p></div><div className="sv-range-control" aria-label="Chart date range">{([7,14,30] as RangeDays[]).map(days=><button key={days} className={range===days?'active':''} onClick={()=>changeRange(String(days))}>{days}D</button>)}</div></div>
      <div className="sv-chart-grid">
        <div className="sv-chart-card"><h3><Zap size={14} style={{display:'inline',color:'#65e7f2'}}/> XP earned</h3><p>Daily XP earned during the selected period</p><div className="sv-chart-wrap"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData}><defs><linearGradient id="xpFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#9a6bff" stopOpacity={.38}/><stop offset="100%" stopColor="#9a6bff" stopOpacity={0}/></linearGradient></defs><CartesianGrid stroke="#ffffff10" vertical={false}/><XAxis dataKey="label" tick={{fill:'#77849e',fontSize:9}} axisLine={false} tickLine={false}/><YAxis width={34} tick={{fill:'#77849e',fontSize:9}} axisLine={false} tickLine={false} domain={[0,maxXp]}/><Tooltip {...chartTooltip}/><Area type="monotone" dataKey="xp" name="XP" stroke="#a98aff" strokeWidth={2.5} fill="url(#xpFill)"/></AreaChart></ResponsiveContainer></div></div>
        <div className="sv-chart-card"><h3><Target size={14} style={{display:'inline',color:'#65e7f2'}}/> Missions completed</h3><p>Completed core and custom tasks per day</p><div className="sv-chart-wrap"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData}><CartesianGrid stroke="#ffffff10" vertical={false}/><XAxis dataKey="label" tick={{fill:'#77849e',fontSize:9}} axisLine={false} tickLine={false}/><YAxis width={28} allowDecimals={false} tick={{fill:'#77849e',fontSize:9}} axisLine={false} tickLine={false} domain={[0,maxTasks]}/><Tooltip {...chartTooltip}/><Bar dataKey="tasks" name="Tasks" fill="#5cecff" radius={[5,5,0,0]}/></BarChart></ResponsiveContainer></div></div>
        <div className="sv-chart-card"><h3><Dumbbell size={14} style={{display:'inline',color:'#65e7f2'}}/> Training sessions</h3><p>Recorded workouts per day</p><div className="sv-chart-wrap"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData}><CartesianGrid stroke="#ffffff10" vertical={false}/><XAxis dataKey="label" tick={{fill:'#77849e',fontSize:9}} axisLine={false} tickLine={false}/><YAxis width={28} allowDecimals={false} tick={{fill:'#77849e',fontSize:9}} axisLine={false} tickLine={false} domain={[0,maxWorkouts]}/><Tooltip {...chartTooltip}/><Bar dataKey="workouts" name="Workouts" fill="#ff9a62" radius={[5,5,0,0]}/></BarChart></ResponsiveContainer></div></div>
        <div className="sv-chart-card"><h3><Clock3 size={14} style={{display:'inline',color:'#65e7f2'}}/> Training duration</h3><p>Minutes trained per day (from timed sessions)</p><div className="sv-chart-wrap"><ResponsiveContainer width="100%" height="100%"><LineChart data={chartData}><CartesianGrid stroke="#ffffff10" vertical={false}/><XAxis dataKey="label" tick={{fill:'#77849e',fontSize:9}} axisLine={false} tickLine={false}/><YAxis width={28} tick={{fill:'#77849e',fontSize:9}} axisLine={false} tickLine={false} domain={[0,maxMinutes]}/><Tooltip {...chartTooltip} formatter={(value)=>[`${value} min`,'Duration']}/><Line type="monotone" dataKey="minutes" name="Minutes" stroke="#76f5bd" strokeWidth={2.5} dot={{r:3,fill:'#76f5bd'}} activeDot={{r:5}}/></LineChart></ResponsiveContainer></div></div>
      </div>
    </section>
    <section className="sv-section">
      <div className="sv-section-head"><div><p className="sv-eyebrow"><CalendarDays size={13}/> DAILY LOG</p><h2>Explore any day</h2><p>Choose a date to inspect the activity saved for it.</p></div><input className="sv-date-input" type="date" value={selectedDate} max={today} onChange={event=>setSelectedDate(event.target.value)}/></div>
      <div className="sv-day-layout">
        <div>
          <h3 style={{margin:'0 0 12px',fontSize:14,color:'#e8edff'}}>{prettyDate(selectedDate)}</h3>
          <div className="sv-day-stats">
            <div className="sv-day-stat"><small>XP</small><b>{selectedXp.toLocaleString()}</b></div>
            <div className="sv-day-stat"><small>TASKS</small><b>{selectedTasks}</b></div>
            <div className="sv-day-stat"><small>WORKOUTS</small><b>{selectedWorkoutCount}</b></div>
            <div className="sv-day-stat"><small>TRAINING TIME</small><b>{formatDuration(selectedDuration)}</b></div>
            <div className="sv-day-stat"><small>DISCIPLINE</small><b>{selectedRecord?.disciplineScore??(isToday?selectedTasks:0)}{selectedRecord?'%':isToday?' tasks':''}</b></div>
            <div className="sv-day-stat"><small>DUNGEON</small><b>{selectedRecord?.dungeonCleared||(isToday&&state.dungeonClearedToday)?'Cleared':'—'}</b></div>
          </div>
          <div className="sv-chart-card"><h3>Completed missions</h3><p>Task names are matched against your current task list.</p>{completedCore.length+completedCustom.length ? <div className="sv-event-list">{[...completedCore,...completedCustom].map(task=><div className="sv-event" key={task.id}><span className="sv-event-icon">{task.emoji}</span><div><b>{task.label}</b><small>Mission completed</small></div></div>)}</div>:<div className="sv-empty">No completed missions recorded for this date.</div>}</div>
        </div>
        <div>
          <div className="sv-section-head" style={{marginBottom:12}}><div><h3 style={{margin:0,fontSize:14,color:'#e8edff'}}>Day events</h3><p>Every event shown here comes from a saved record.</p></div><BookOpen size={18} color="#68e5f1"/></div>
          {eventItems.length ? <div className="sv-event-list">{eventItems.map(item=><div className="sv-event" key={item.key}><span className="sv-event-icon">{item.icon}</span><div style={{minWidth:0,flex:1}}><b>{item.label}</b><small>{item.detail}</small></div>{item.time>0&&<small>{new Date(item.time).toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit'})}</small>}</div>)}</div>:<div className="sv-empty">No events saved for this day yet.</div>}
          {selectedNote&&<div className="sv-note"><b>Daily note</b><br/>{selectedNote}</div>}
          {!selectedNote&&<div className="sv-note">No daily note was saved for this date.</div>}
        </div>
      </div>
    </section>
    <section className="sv-section">
      <div className="sv-section-head"><div><p className="sv-eyebrow"><Trophy size={13}/> SYSTEM OVERVIEW</p><h2>Long-term progress</h2><p>Rank and consistency summary.</p></div><Flame size={20} color="#ff9a62"/></div>
      <div style={{display:'flex',justifyContent:'space-between',gap:12,marginBottom:9,fontSize:11,color:'#aab7d2'}}><span>{rank.name}</span><span>{state.xp.toLocaleString()} total XP</span></div>
      {nextRank?<><div className="sv-rank-progress"><span style={{width:`${Math.max(0,Math.min(100,(state.xp-rank.xpRequired)/(nextRank.xpRequired-rank.xpRequired)*100))}%`}}/></div><div style={{display:'flex',justifyContent:'space-between',gap:12,marginTop:8,fontSize:10,color:'#7f8ba4'}}><span>{rank.xpRequired.toLocaleString()} XP</span><span>Next: {nextRank.name} · {nextRank.xpRequired.toLocaleString()} XP</span></div></>:<p>Highest rank reached.</p>}
      <div className="sv-summary"><div><small>BEST STREAK</small><b>{state.bestStreak} days</b></div><div><small>BEST XP DAY</small><b>{bestDay.xp.toLocaleString()} XP · {bestDay.label}</b></div><div><small>AVERAGE XP / DAY</small><b>{avgXp.toLocaleString()} XP</b></div></div>
    </section>
  </div>;
}
