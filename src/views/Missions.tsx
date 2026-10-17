import { useState } from 'react';
import { CheckCircle2, Circle, Plus, Target, Zap, CalendarDays } from 'lucide-react';
import { useStore } from '../store/useStore';
import { DAILY_CHALLENGES } from '../data/tasks';

export function Missions() {
  const { state, toggleCoreTask, toggleCustomTask, addCustomTask, claimChallenge } = useStore();
  const [label, setLabel] = useState('');
  const [points, setPoints] = useState('50');
  const core = state.mainTasks.filter(task => task.enabled);
  const done = core.filter(task => Boolean(state.coreCompleted[task.id])).length
    + state.customTasks.filter(task => Boolean(state.customCompleted[task.id])).length;
  const total = core.length + state.customTasks.length;
  const challenges = DAILY_CHALLENGES.filter(item => state.dailyChallengeIds.includes(item.id));
  const challengeDone = challenges.filter(item => Boolean(state.dailyChallengeCompleted[item.id])).length;

  function addMission(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const clean = label.trim();
    if (!clean) return;
    addCustomTask(clean, '✦', Math.max(0, Math.min(200, Number(points) || 0)));
    setLabel('');
  }

  return <div className="sv-command sv-page-module">
    <header className="sv-module-header"><div><p className="sv-eyebrow"><Target size={14}/> STRYVEN / OBJECTIVES</p><h1>Missions</h1><p>Every objective is completed only when you confirm it.</p></div><div className="sv-identity-rank"><Zap size={16}/><b>{done}/{total} TODAY</b></div></header>
    <section className="sv-section sv-surface"><div className="sv-section-head"><div><p className="sv-eyebrow">DAILY PROTOCOL</p><h2>Daily Missions</h2><p>Your core tasks and personal actions.</p></div><strong>{total ? Math.round(done / total * 100) : 0}%</strong></div>
      <div className="sv-page-progress"><span style={{width:`${total ? done / total * 100 : 0}%`}}/></div>
      <div className="sv-mission-list">{core.map(task => {const complete=Boolean(state.coreCompleted[task.id]);return <article className={`sv-mission-row ${complete?'is-complete':''}`} key={task.id}><button aria-label={complete?'Mark incomplete':'Confirm mission complete'} onClick={()=>toggleCoreTask(task.id)}>{complete?<CheckCircle2 size={22}/>:<Circle size={22}/>}</button><span className="sv-mission-icon">{task.emoji}</span><div className="sv-mission-copy"><b>{task.label}</b><small>{task.description || task.category.toUpperCase()}</small></div><strong>+{task.points} XP</strong></article>})}
      {state.customTasks.map(task => {const complete=Boolean(state.customCompleted[task.id]);return <article className={`sv-mission-row ${complete?'is-complete':''}`} key={task.id}><button aria-label={complete?'Mark incomplete':'Confirm mission complete'} onClick={()=>toggleCustomTask(task.id)}>{complete?<CheckCircle2 size={22}/>:<Circle size={22}/>}</button><span className="sv-mission-icon">✦</span><div className="sv-mission-copy"><b>{task.label}</b><small>PERSONAL MISSION</small></div><strong>+{task.points} XP</strong></article>})}
      </div>
      <form className="sv-add-mission" onSubmit={addMission}><label><span>ADD A PERSONAL MISSION</span><input value={label} onChange={e=>setLabel(e.target.value)} maxLength={90} placeholder="What will you accomplish?" required/></label><label className="sv-xp-input"><span>XP</span><input type="number" min="0" max="200" value={points} onChange={e=>setPoints(e.target.value)}/></label><button type="submit"><Plus size={16}/> Add mission</button></form>
    </section>
    <section className="sv-section sv-surface"><div className="sv-section-head"><div><p className="sv-eyebrow">SYSTEM CHALLENGES</p><h2>Special Challenges</h2><p>Rewards are claimable only after the requirement is met.</p></div><span>{challengeDone}/{challenges.length}</span></div>
      <div className="sv-challenge-grid">{challenges.map(challenge=>{const claimed=Boolean(state.dailyChallengeCompleted[challenge.id]);const eligible=challenge.check(state);return <article className="sv-challenge-card" key={challenge.id}><div className="sv-challenge-top"><CalendarDays size={18}/><span>{claimed?'CLAIMED':eligible?'READY TO CLAIM':'IN PROGRESS'}</span></div><h3>{challenge.label}</h3><p>{challenge.description}</p><div className="sv-challenge-reward">+{challenge.xp} XP <i/> {challenge.coins} COINS</div><button disabled={claimed||!eligible} onClick={()=>claimChallenge(challenge.id)}>{claimed?'Reward claimed':eligible?'Claim reward':'Complete requirement first'}</button></article>})}</div>
    </section>
  </div>;
}
