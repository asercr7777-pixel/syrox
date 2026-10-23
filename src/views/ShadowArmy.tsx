import { useMemo, useState } from 'react';
import { ArrowUpRight, Check, Crown, Ghost, LockKeyhole, Orbit, Shield, Sparkles, Swords, X, Zap } from 'lucide-react';
import { useStore } from '../store/useStore';
import { ALL_CHAPTERS } from '../data/story';
import { AURAS, TITLES, WEAPONS } from '../data/collections';
import { getRankByXp, getNextRank } from '../data/ranks';

type RosterFilter = 'all' | 'extracted' | 'ready' | 'locked';

export function ShadowArmy() {
  const { state, extractShadow } = useStore();
  const [filter, setFilter] = useState<RosterFilter>('all');
  const [revealedShadow, setRevealedShadow] = useState<{id:string;name:string;chapter:string}|null>(null);
  const extractedIds = state.shadowExtractedBossIds ?? [];
  const rank = getRankByXp(state.xp);
  const nextRank = getNextRank(state.xp);
  const canExtract = state.level >= 10 || state.streak >= 30;
  const bossRoster = useMemo(() => ALL_CHAPTERS.flatMap(chapter => chapter.boss ? [{
    id: chapter.boss.id, name: chapter.boss.name, chapter: chapter.title,
    defeated: Boolean(state.storyBossDefeated[chapter.boss.id]),
    extracted: extractedIds.includes(chapter.boss.id),
  }] : []), [state.storyBossDefeated, extractedIds]);
  const defeated = bossRoster.filter(boss => boss.defeated);
  const extractedCount = bossRoster.filter(boss => boss.extracted).length;
  const available = defeated.find(boss => !boss.extracted) ?? null;
  const totalBosses = bossRoster.length;
  const xpBuff = Math.min(15, extractedCount);
  const roster = bossRoster.filter(boss => {
    if (filter === 'extracted') return boss.extracted;
    if (filter === 'ready') return boss.defeated && !boss.extracted;
    if (filter === 'locked') return !boss.defeated;
    return true;
  });
  const equipped = state.equipped;
  const itemName = (type:'aura'|'weapon'|'title'|'shield', id:string|null) => {
    if (!id) return 'Not equipped';
    if (type === 'aura') return AURAS.find(item => item.id === id)?.name ?? id;
    if (type === 'weapon') return WEAPONS.find(item => item.id === id)?.name ?? id;
    if (type === 'title') return TITLES.find(item => item.id === id)?.name ?? id;
    return id;
  };
  const loadout = [
    {label:'AURA CORE',value:itemName('aura',equipped.aura),icon:Sparkles},
    {label:'PRIMARY WEAPON',value:itemName('weapon',equipped.weapon),icon:Swords},
    {label:'MONARCH TITLE',value:itemName('title',equipped.title),icon:Crown},
    {label:'DEFENSE RELIC',value:itemName('shield',equipped.shield),icon:Shield},
  ];
  const extractionMessage = !canExtract
    ? `Reach Level 10 or maintain a 30-day streak. Current level: ${state.level} · streak: ${state.streak} days.`
    : !available
      ? 'Defeat a story boss first. Every extraction is tied to a confirmed victory.'
      : 'Extraction gate is open. One confirmed boss can now be bound to your Shadow Army.';

  const handleExtract = () => {
    if (!canExtract || !available) return;
    if (extractShadow(available.id)) setRevealedShadow({id:available.id,name:available.name,chapter:available.chapter});
  };

  return <div className="sv-command sv-page-module sv-shadow-army-page sv-shadow-command-center">
    <section className="sv-shadow-dominion" aria-labelledby="shadow-army-title">
      <div className="sv-shadow-dominion-top">
        <span className="sv-shadow-signal"><i/> STRYVEN / SHADOW COMMAND</span>
        <span className="sv-shadow-rank-chip"><Crown size={14}/> {rank.name.toUpperCase()} HUNTER</span>
      </div>
      <div className="sv-shadow-dominion-hero">
        <div className="sv-shadow-dominion-copy">
          <p className="sv-eyebrow"><Ghost size={14}/> TACTICAL HABIT & SKILL SYSTEM</p>
          <h2 id="shadow-army-title">THE SHADOW<br/><em>DOMINION.</em></h2>
          <p>Every soldier begins with a confirmed victory. Extract defeated story bosses, build your roster, and earn a persistent quest XP bonus through your actual saved progress.</p>
          <div className="sv-shadow-subline">YOUR DISCIPLINE. THEIR POWER.</div>
        </div>
        <div className="sv-shadow-crest" aria-hidden="true"><Ghost strokeWidth={1.1}/></div>
      </div>
      <div className="sv-shadow-metrics">
        <div className="sv-shadow-metric"><small>01 / SHADOWS EXTRACTED</small><strong>{extractedCount} <span className="sv-shadow-metric-total">/ {totalBosses}</span></strong><span>Bound to your saved account</span></div>
        <div className="sv-shadow-metric"><small>02 / DAILY QUEST XP BUFF</small><strong>+{xpBuff}%</strong><span>{extractedCount} extracted · +1% each, capped at 15%</span></div>
        <div className="sv-shadow-metric"><small>03 / BOSS VICTORIES</small><strong>{defeated.length}</strong><span>{totalBosses - defeated.length} encounters not yet cleared</span></div>
        <div className="sv-shadow-metric"><small>04 / EXTRACTION GATE</small><strong className={canExtract && available ? 'is-gate-open' : ''}>{canExtract && available ? 'OPEN' : 'LOCKED'}</strong><span>{canExtract ? (available ? 'Victory record ready' : 'No unbound victory') : 'Level 10 or 30-day streak'}</span></div>
      </div>
      <div className="sv-shadow-progression">
        <div className="sv-shadow-progression-copy"><span>HUNTER PROGRESSION</span><b>{state.xp.toLocaleString()} XP · {rank.name}</b><small>{nextRank ? `${Math.max(0,nextRank.xpRequired-state.xp).toLocaleString()} XP to ${nextRank.name}` : 'Maximum hunter rank reached'}</small></div>
        <div className="sv-shadow-progression-track" role="progressbar" aria-label="Shadow extraction progress" aria-valuemin={0} aria-valuemax={Math.max(1,totalBosses)} aria-valuenow={extractedCount}><span style={{width:`${totalBosses ? extractedCount/totalBosses*100 : 0}%`}}/></div>
        <div className="sv-shadow-rank-meta"><span>EXTRACTION RATE</span><b>{totalBosses ? Math.round(extractedCount/totalBosses*100) : 0}%</b><span>{extractedCount} / {totalBosses} bound</span></div>
      </div>
    </section>

    <div className="sv-shadow-command-grid">
      <section className="sv-shadow-panel">
        <div className="sv-shadow-panel-head"><div><p className="sv-eyebrow">01 // COMMAND EQUIPMENT</p><h2>Monarch's Loadout</h2><p>Equipment linked to your saved Hunter Profile.</p></div><Orbit size={20} color="#a58bff"/></div>
        <div className="sv-shadow-loadout-grid">{loadout.map(item=>{const Icon=item.icon;return <article className="sv-shadow-loadout-slot" key={item.label}><span className="sv-shadow-loadout-icon"><Icon size={18}/></span><div><small>{item.label}</small><b>{item.value}</b></div></article>;})}</div>
        <p className="sv-shadow-footnote">Equipment is read from your account state. No imaginary items or stats are added here.</p>
      </section>
      <section className="sv-shadow-panel sv-arise-panel">
        <div className="sv-shadow-panel-head"><div><p className="sv-eyebrow">02 // EXTRACTION SHRINE</p><h2>Arise Protocol</h2><p>Bind one defeated story boss to your persistent roster.</p></div><Zap size={20} color="#a58bff"/></div>
        <div className={canExtract && available ? 'sv-arise-seal is-ready' : 'sv-arise-seal'}><span><Ghost size={31}/></span><small>{canExtract && available ? 'GATE OPEN' : 'AWAITING REQUIREMENTS'}</small></div>
        <div className="sv-arise-requirement"><LockKeyhole size={16}/><div><b>REQUIRES: LEVEL 10 OR 30-DAY STREAK</b><span>{extractionMessage}</span></div></div>
        <button className="sv-arise-button" disabled={!canExtract || !available} onClick={handleExtract}><Ghost size={18}/><span>EXTRACT SHADOW</span><b>ARISE</b></button>
        <p className="sv-shadow-footnote">Each extracted shadow permanently adds +1% XP to daily quests, up to +15%. Extraction records sync with your saved account.</p>
      </section>
    </div>

    <section className="sv-shadow-panel sv-shadow-roster-panel">
      <div className="sv-shadow-panel-head"><div><p className="sv-eyebrow">03 // SHADOW ROSTER</p><h2>Bound & Awaiting</h2><p>Only real story bosses and saved extraction records appear here.</p></div><span className="sv-shadow-rank-chip"><Ghost size={14}/>{extractedCount} EXTRACTED</span></div>
      <div className="sv-shadow-filters" role="group" aria-label="Filter shadow roster">
        {([{id:'all',label:'ALL'},{id:'extracted',label:'EXTRACTED'},{id:'ready',label:'READY TO EXTRACT'},{id:'locked',label:'LOCKED'}] as const).map(option=><button key={option.id} className={filter===option.id?'is-active':''} aria-pressed={filter===option.id} onClick={()=>setFilter(option.id)}>{option.label}</button>)}
      </div>
      {roster.length ? <div className="sv-shadow-roster">{roster.map((boss,index)=><article className={`sv-shadow-unit ${boss.extracted?'is-extracted':boss.defeated?'is-ready':'is-locked'}`} key={boss.id}>
        <div className="sv-shadow-unit-mark">{boss.extracted ? <Check size={23}/> : boss.defeated ? <Ghost size={23}/> : <LockKeyhole size={21}/>}</div>
        <span className="sv-eyebrow">{boss.extracted ? 'SHADOW BOUND' : boss.defeated ? 'VICTORY CONFIRMED' : 'ENCOUNTER LOCKED'} / {String(index+1).padStart(2,'0')}</span>
        <h3>{boss.name}</h3><p>{boss.chapter}</p>
        <small>{boss.extracted ? '✓ EXTRACTED · XP BONUS ACTIVE' : boss.defeated ? 'READY FOR EXTRACTION' : 'DEFEAT THIS BOSS TO UNLOCK'}</small>
      </article>)}</div> : <div className="sv-shadow-empty"><span className="sv-shadow-empty-icon"><Ghost size={26}/></span><b>NO SHADOWS MATCH THIS FILTER</b><p>Change the roster filter or clear a story encounter to begin extraction.</p></div>}
    </section>

    {revealedShadow && <div className="sv-arise-overlay" role="dialog" aria-modal="true" aria-labelledby="arise-title">
      <div className="sv-arise-backdrop" onClick={()=>setRevealedShadow(null)}/>
      <div className="sv-arise-cinematic">
        <button className="sv-arise-close" onClick={()=>setRevealedShadow(null)} aria-label="Close extraction result"><X size={19}/></button>
        <div className="sv-arise-lightning" aria-hidden="true"><i/><i/><i/><i/><i/><i/></div>
        <div className="sv-arise-reveal-icon"><Ghost size={48}/></div>
        <p className="sv-eyebrow">EXTRACTION CONFIRMED // SHADOW BOUND</p><h2 id="arise-title">ARISE.</h2>
        <div className="sv-arise-new-card"><span>NEW SHADOW SOLDIER</span><b>{revealedShadow.name}</b><small>{revealedShadow.chapter}</small><i><Check size={13}/> SAVED TO YOUR ARMY</i></div>
        <p className="sv-arise-bonus">DAILY QUEST XP BONUS NOW +{Math.min(15,extractedCount)}%</p>
        <button className="sv-btn sv-btn--primary" onClick={()=>setRevealedShadow(null)}>RETURN TO COMMAND <ArrowUpRight size={15}/></button>
      </div>
    </div>}
  </div>;
}
