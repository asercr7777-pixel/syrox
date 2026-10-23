import { Crown, Shield, Swords, Ghost, Sparkles, Orbit, Flame, Crosshair } from 'lucide-react';
import { useStore } from '../store/useStore';
import { ALL_CHAPTERS } from '../data/story';
import { AURAS, TITLES, WEAPONS } from '../data/collections';

export function ShadowArmy() {
  const {state}=useStore();
  const shadows=ALL_CHAPTERS.flatMap(chapter=>chapter.boss ? [{id:chapter.boss.id,name:chapter.boss.name,chapter:chapter.title,defeated:Boolean(state.storyBossDefeated[chapter.boss.id])}] : []).filter(boss=>boss.defeated);
  const equipped=state.equipped;
  const collections=[
    {label:'SHADOWS BOUND',value:shadows.length,detail:'Confirmed victories'},
    {label:'AURAS COLLECTED',value:state.inventory.filter(i=>i.type==='aura').length,detail:'Saved collection'},
    {label:'WEAPONS COLLECTED',value:state.inventory.filter(i=>i.type==='weapon').length,detail:'Saved collection'},
    {label:'RELICS & TITLES',value:state.inventory.filter(i=>i.type==='title'||i.type==='shield').length,detail:'Saved collection'}
  ];
  const itemName=(type:'aura'|'weapon'|'title'|'shield',id:string|null)=>{
    if(!id)return 'Not equipped';
    if(type==='aura')return AURAS.find(item=>item.id===id)?.name??id;
    if(type==='weapon')return WEAPONS.find(item=>item.id===id)?.name??id;
    if(type==='title')return TITLES.find(item=>item.id===id)?.name??id;
    return id;
  };
  const loadout=[
    {label:'AURA CORE',value:itemName('aura',equipped.aura),icon:Flame},
    {label:'PRIMARY WEAPON',value:itemName('weapon',equipped.weapon),icon:Swords},
    {label:'MONARCH TITLE',value:itemName('title',equipped.title),icon:Crown},
    {label:'DEFENSE RELIC',value:itemName('shield',equipped.shield),icon:Shield}
  ];

  return <div className="sv-command sv-page-module sv-shadow-army-page">
    <section className="sv-shadow-dominion" aria-labelledby="shadow-army-title">
      <div className="sv-shadow-dominion-top">
        <span className="sv-shadow-signal"><i/> STRYVEN / DOMINION PROTOCOL</span>
        <span className="sv-shadow-rank-chip"><Crown size={14}/> MONARCH'S ARCHIVE</span>
      </div>
      <div className="sv-shadow-dominion-hero">
        <div className="sv-shadow-dominion-copy">
          <p className="sv-eyebrow"><Ghost size={14}/> SHADOW COMMAND // 07</p>
          <h2 id="shadow-army-title">THE FALLEN<br/><em>RISE AGAIN.</em></h2>
          <p>Your dominion is built from your actual progression. Every bound shadow comes from a confirmed story-boss victory—no invented units, no fabricated progress.</p>
          <div className="sv-shadow-subline">YOUR WILL. THEIR ETERNAL LOYALTY.</div>
        </div>
        <div className="sv-shadow-crest" aria-hidden="true"><Ghost strokeWidth={1.1}/></div>
      </div>
      <div className="sv-shadow-metrics">
        {collections.map((item,index)=><div className="sv-shadow-metric" key={item.label}>
          <small>{String(index+1).padStart(2,'0')} / {item.label}</small>
          <strong>{item.value.toLocaleString()}</strong>
          <span>{item.detail}</span>
        </div>)}
      </div>
    </section>

    <div className="sv-shadow-command-grid">
      <section className="sv-shadow-panel">
        <div className="sv-shadow-panel-head">
          <div><p className="sv-eyebrow">01 // COMMAND EQUIPMENT</p><h2>Monarch's Loadout</h2><p>Your current saved equipment, linked to your Hunter Profile.</p></div>
          <Orbit size={20} color="#a58bff"/>
        </div>
        <div className="sv-shadow-loadout-grid">
          {loadout.map(item=>{const Icon=item.icon;return <article className="sv-shadow-loadout-slot" key={item.label}>
            <span className="sv-shadow-loadout-icon"><Icon size={18}/></span>
            <div><small>{item.label}</small><b>{item.value}</b></div>
          </article>;})}
        </div>
        <p className="sv-shadow-footnote">Equipment shown here reflects your current saved profile. Change your equipped items in the existing equipment controls where available.</p>
      </section>

      <section className="sv-shadow-panel">
        <div className="sv-shadow-panel-head">
          <div><p className="sv-eyebrow">02 // POWER RESERVE</p><h2>Collected Arsenal</h2><p>Only items present in your saved inventory are counted.</p></div>
          <Sparkles size={20} color="#a58bff"/>
        </div>
        <div className="sv-shadow-loadout-grid">
          {[{label:'AURAS',value:state.inventory.filter(i=>i.type==='aura').length},{label:'WEAPONS',value:state.inventory.filter(i=>i.type==='weapon').length},{label:'TITLES',value:state.inventory.filter(i=>i.type==='title').length},{label:'SHIELDS',value:state.inventory.filter(i=>i.type==='shield').length}].map(item=><article className="sv-shadow-loadout-slot" key={item.label}>
            <span className="sv-shadow-loadout-icon"><Crosshair size={17}/></span><div><small>{item.label}</small><b>{item.value} recorded</b></div>
          </article>)}
        </div>
        <p className="sv-shadow-footnote">No separate inventory or marketplace is simulated on this page. These counts are read from your account state.</p>
      </section>
    </div>

    <section className="sv-shadow-panel" style={{marginTop:16}}>
      <div className="sv-shadow-panel-head">
        <div><p className="sv-eyebrow">03 // CONFIRMED SUMMONS</p><h2>Shadow Roster</h2><p>Shadows enter this roster only after their boss victory is saved.</p></div>
        <span className="sv-shadow-rank-chip"><Ghost size={14}/>{shadows.length} BOUND</span>
      </div>
      {shadows.length ? <div className="sv-shadow-roster">{shadows.map((shadow,index)=><article className="sv-shadow-unit" key={shadow.id}>
        <div className="sv-shadow-unit-mark"><Ghost size={23}/></div>
        <span className="sv-eyebrow">BOUND SHADOW / {String(index+1).padStart(2,'0')}</span>
        <h3>{shadow.name}</h3><p>{shadow.chapter}</p><small>✓ VICTORY RECORD CONFIRMED</small>
      </article>)}</div> : <div className="sv-shadow-empty">
        <span className="sv-shadow-empty-icon"><Ghost size={26}/></span>
        <b>THE THRONE AWAITS ITS FIRST SHADOW</b>
        <p>Progress through story encounters and defeat a boss. Once the victory is saved to your account, the shadow will appear here.</p>
      </div>}
    </section>
  </div>;
}
