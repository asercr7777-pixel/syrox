import { useMemo, useState } from 'react';
import { ArrowUpRight, Check, Crown, Ghost, LockKeyhole, Orbit, Shield, Sparkles, Swords, X, Zap, Crosshair, Skull, Users, ChevronRight } from 'lucide-react';
import { useStore } from '../store/useStore';
import { ALL_CHAPTERS } from '../data/story';
import { AURAS, TITLES, WEAPONS } from '../data/collections';
import { getRankByXp, getNextRank } from '../data/ranks';

type RosterFilter = 'all' | 'extracted' | 'ready' | 'locked';
const EMPTY_EXTRACTED_BOSS_IDS: string[] = [];

export function ShadowArmy() {
  const { state, extractShadow } = useStore();
  const [filter, setFilter] = useState<RosterFilter>('all');
  const [revealedShadow, setRevealedShadow] = useState<{id:string;name:string;chapter:string}|null>(null);
  const extractedIds = state.shadowExtractedBossIds ?? EMPTY_EXTRACTED_BOSS_IDS;
  const rank = getRankByXp(state.xp);
  const nextRank = getNextRank(state.xp);
  const canExtract = state.level >= 10 || state.streak >= 30;
  const bossRoster = useMemo(() => ALL_CHAPTERS.flatMap(chapter => chapter.boss ? [{
    id: chapter.boss.id, name: chapter.boss.name, chapter: chapter.title,
    defeated: Boolean(state.storyBossDefeated[chapter.boss.id]),
    extracted: extractedIds.includes(chapter.boss.id),
  }] : []), [state.storyBossDefeated, extractedIds]);
  const defeated = bossRoster.filter(boss => boss.defeated);
  const extracted = bossRoster.filter(boss => boss.extracted);
  const extractedCount = extracted.length;
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
      : 'A defeated boss is ready. Bind this victory to your persistent legion.';
  const handleExtract = () => {
    if (!canExtract || !available) return;
    if (extractShadow(available.id)) setRevealedShadow({id:available.id,name:available.name,chapter:available.chapter});
  };

  return <div className="sv-command sv-page-module sv-shadow-army-page sv-shadow-command-center sv-legion-game">
    <header className="legion-topline">
      <div><span className="legion-live"><i/> COMMAND NETWORK ACTIVE</span><span className="legion-coordinate">STRYVEN / MILITARY DIVISION / 07</span></div>
      <div className="legion-player-rank"><Crown size={15}/><span>{rank.name.toUpperCase()}</span><b>LVL {state.level}</b></div>
    </header>

    <section className="legion-war-hero" aria-labelledby="shadow-army-title">
      <div className="legion-hero-grid" aria-hidden="true"/>
      <div className="legion-hero-copy">
        <p className="legion-kicker"><Crosshair size={14}/> HUNTER COMMAND // LEGION CONTROL</p>
        <h1 id="shadow-army-title">SHADOW<br/><em>LEGION</em></h1>
        <p className="legion-intro">A monarch does not fight alone. Build your force from conquered story bosses, command your formation, and grow stronger with every shadow bound to your name.</p>
        <div className="legion-hero-actions"><span><Users size={15}/>{extractedCount} UNITS IN FORMATION</span><span><Zap size={15}/> +{xpBuff}% QUEST XP</span></div>
      </div>
      <div className="legion-monarch-visual" aria-hidden="true">
        <div className="legion-ring legion-ring-one"/><div className="legion-ring legion-ring-two"/><div className="legion-ring legion-ring-three"/>
        <div className="legion-monarch-silhouette"><span/><i/><b/></div>
        <div className="legion-visual-label"><i/> MONARCH LINK ESTABLISHED</div>
      </div>
      <div className="legion-hero-footer"><span>YOUR ARMY. YOUR RULES.</span><span>PERSONAL LEGION DATA // SYNCED</span></div>
    </section>

    <section className="legion-command-stats" aria-label="Legion status">
      <article><small>LEGION STRENGTH</small><strong>{String(extractedCount).padStart(2,'0')}<i> / {totalBosses}</i></strong><span>Shadows recruited</span></article>
      <article><small>CONFIRMED VICTORIES</small><strong>{String(defeated.length).padStart(2,'0')}</strong><span>Bosses defeated</span></article>
      <article><small>QUEST REWARD BOOST</small><strong className="legion-stat-red">+{xpBuff}%</strong><span>+1% per extracted shadow · max 15%</span></article>
      <article><small>NEXT EXTRACTION</small><strong className={canExtract && available?'legion-stat-ready':''}>{canExtract && available?'READY':'LOCKED'}</strong><span>{canExtract ? (available ? 'Victory can be bound' : 'No eligible victory') : 'Level 10 or 30-day streak'}</span></article>
    </section>

    <section className="legion-battlefield" aria-labelledby="formation-title">
      <div className="legion-section-head"><div><p className="legion-kicker">01 / ACTIVE DEPLOYMENT</p><h2 id="formation-title">THE FORMATION</h2><p>Only shadows you have actually extracted appear in your ranks.</p></div><div className="legion-head-coordinates">FORMATION / {String(extractedCount).padStart(2,'0')} ACTIVE</div></div>
      <div className="legion-field">
        <div className="legion-field-lines" aria-hidden="true"/>
        <div className="legion-field-label"><span>FRONTLINE</span><span>MONARCH COMMAND</span><span>REAR GUARD</span></div>
        {extracted.length ? <div className="legion-formation">
          {extracted.map((unit,index)=><article className="legion-soldier" key={unit.id} style={{animationDelay: `${index * 70}ms`}}>
            <div className="legion-soldier-aura"><div className="legion-soldier-figure"><span/><i/><b/></div><span className="legion-soldier-level">SHADOW {String(index+1).padStart(2,'0')}</span></div>
            <div className="legion-soldier-info"><b>{unit.name}</b><small>{unit.chapter}</small><span><i/> BOUND TO MONARCH</span></div>
          </article>)}
        </div> : <div className="legion-empty-army">
          <div className="legion-empty-sigil"><Ghost size={37}/></div>
          <span className="legion-empty-title">YOUR LEGION AWAITS ITS FIRST COMMAND</span>
          <p>No shadows recruited yet. Clear a story boss, meet the extraction requirement, then bring your first soldier into formation.</p>
          <div className="legion-empty-slots" aria-hidden="true">{[0,1,2,3,4,5,6].map(slot=><div key={slot}><Ghost size={19}/><span>EMPTY SLOT</span></div>)}</div>
        </div>}
        <div className="legion-field-footer"><span><i/> LIVE FORMATION</span><span>SHADOWS REGISTERED: {extractedCount}</span></div>
      </div>
    </section>

    <div className="legion-lower-grid">
      <section className="legion-panel legion-recruit-panel">
        <div className="legion-section-head"><div><p className="legion-kicker">02 / RECRUITMENT RITUAL</p><h2>ARISE PROTOCOL</h2><p>Bind a confirmed boss victory to your account.</p></div><div className={canExtract && available?'legion-gate-open':'legion-gate-closed'}><i/>{canExtract && available?'GATE OPEN':'GATE SEALED'}</div></div>
        <div className="legion-ritual">
          <div className={canExtract && available?'legion-ritual-core is-ready':'legion-ritual-core'}><div className="legion-ritual-ring"/><div className="legion-ritual-symbol"><Ghost size={42}/></div><span>{canExtract && available?'READY FOR BINDING':'AWAITING OFFERING'}</span></div>
          <div className="legion-ritual-copy"><small>ELIGIBILITY CHECK</small><b>{available ? available.name : 'No confirmed boss available'}</b><p>{extractionMessage}</p>{available&&<span className="legion-target-chapter"><Skull size={13}/>{available.chapter}</span>}</div>
        </div>
        <button className="legion-arise-button" disabled={!canExtract || !available} onClick={handleExtract}><Ghost size={19}/><span>EXTRACT SHADOW</span><b>ARISE <ArrowUpRight size={15}/></b></button>
        <p className="legion-fineprint">Extraction is permanent and account-saved. Each recruited shadow adds +1% XP to daily quests, capped at +15%.</p>
      </section>

      <section className="legion-panel">
        <div className="legion-section-head"><div><p className="legion-kicker">03 / MONARCH EQUIPMENT</p><h2>COMMAND LOADOUT</h2><p>Current equipment from your Hunter Profile.</p></div><Orbit size={19}/></div>
        <div className="legion-loadout">{loadout.map(item=>{const Icon=item.icon;return <article key={item.label}><span><Icon size={17}/></span><div><small>{item.label}</small><b>{item.value}</b></div><ChevronRight size={14}/></article>})}</div>
        <div className="legion-xp-progress"><div><span>HUNTER PROGRESSION</span><b>{state.xp.toLocaleString()} XP</b></div><div className="legion-xp-track"><span style={{width:`${nextRank ? Math.max(0,Math.min(100,((state.xp-rank.xpRequired)/Math.max(1,nextRank.xpRequired-rank.xpRequired))*100)) : 100}%`}}/></div><small>{nextRank ? `${Math.max(0,nextRank.xpRequired-state.xp).toLocaleString()} XP TO ${nextRank.name.toUpperCase()}` : 'MAXIMUM RANK REACHED'}</small></div>
      </section>
    </div>

    <section className="legion-contracts">
      <div className="legion-section-head"><div><p className="legion-kicker">04 / HUNTING BOARD</p><h2>SHADOW CONTRACTS</h2><p>Every name comes from your real story-boss records. Defeat the target in Story Mode before extraction.</p></div><span className="legion-contract-count">{roster.length} TARGETS</span></div>
      <div className="legion-filters" role="group" aria-label="Filter shadow contracts">
        {([{id:'all',label:'ALL TARGETS'},{id:'extracted',label:'RECRUITED'},{id:'ready',label:'READY TO BIND'},{id:'locked',label:'UNDEFEATED'}] as const).map(option=><button key={option.id} className={filter===option.id?'is-active':''} aria-pressed={filter===option.id} onClick={()=>setFilter(option.id)}>{option.label}</button>)}
      </div>
      {roster.length ? <div className="legion-contract-list">{roster.map((boss,index)=><article key={boss.id} className={`legion-contract ${boss.extracted?'is-recruited':boss.defeated?'is-ready':'is-locked'}`}>
        <div className="legion-contract-index">{String(index+1).padStart(2,'0')}</div>
        <div className="legion-contract-emblem">{boss.extracted?<Check size={19}/>:boss.defeated?<Ghost size={20}/>:<LockKeyhole size={18}/>}</div>
        <div className="legion-contract-details"><small>{boss.extracted?'LEGION MEMBER':boss.defeated?'EXTRACTION ELIGIBLE':'TARGET NOT CLEARED'}</small><b>{boss.name}</b><span>{boss.chapter}</span></div>
        <div className="legion-contract-status">{boss.extracted?'RECRUITED':boss.defeated?'READY':'LOCKED'}</div>
      </article>)}</div> : <div className="legion-no-contracts">No targets match this command. Select another contract filter.</div>}
    </section>

    {revealedShadow && <div className="sv-arise-overlay legion-arise-overlay" role="dialog" aria-modal="true" aria-labelledby="arise-title">
      <div className="sv-arise-backdrop" onClick={()=>setRevealedShadow(null)}/>
      <div className="sv-arise-cinematic legion-arise-cinematic">
        <button className="sv-arise-close" onClick={()=>setRevealedShadow(null)} aria-label="Close extraction result"><X size={19}/></button>
        <div className="sv-arise-lightning" aria-hidden="true"><i/><i/><i/><i/><i/><i/></div>
        <div className="sv-arise-reveal-icon"><Ghost size={48}/></div>
        <p className="legion-kicker">EXTRACTION CONFIRMED // LEGION MEMBER BOUND</p><h2 id="arise-title">ARISE.</h2>
        <div className="sv-arise-new-card"><span>NEW SHADOW SOLDIER</span><b>{revealedShadow.name}</b><small>{revealedShadow.chapter}</small><i><Check size={13}/> SAVED TO YOUR LEGION</i></div>
        <p className="sv-arise-bonus">DAILY QUEST XP BONUS NOW +{Math.min(15,extractedCount)}%</p>
        <button className="sv-btn sv-btn--primary" onClick={()=>setRevealedShadow(null)}>RETURN TO COMMAND <ArrowUpRight size={15}/></button>
      </div>
    </div>}
  </div>;
}
