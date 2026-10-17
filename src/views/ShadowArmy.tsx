import { Crown, Shield, Swords, Ghost } from 'lucide-react';
import { useStore } from '../store/useStore';
import { ALL_CHAPTERS } from '../data/story';

export function ShadowArmy() {
  const {state}=useStore();
  const shadows=ALL_CHAPTERS.flatMap(chapter=>chapter.boss ? [{id:chapter.boss.id,name:chapter.boss.name,chapter:chapter.title,defeated:Boolean(state.storyBossDefeated[chapter.boss.id])}] : []).filter(boss=>boss.defeated);
  const equipped=state.equipped;
  const collections=[{label:'AURAS',value:state.inventory.filter(i=>i.type==='aura').length},{label:'WEAPONS',value:state.inventory.filter(i=>i.type==='weapon').length},{label:'TITLES',value:state.inventory.filter(i=>i.type==='title').length},{label:'SHIELDS',value:state.inventory.filter(i=>i.type==='shield').length}];
  return <div className="sv-command sv-page-module">
    <header className="sv-module-header"><div><p className="sv-eyebrow"><Ghost size={14}/> STRYVEN / SHADOW COMMAND</p><h1>Shadow Army</h1><p>Your shadow roster is derived from saved story-boss victories. No synthetic units.</p></div><div className="sv-identity-rank"><Crown size={16}/><b>{shadows.length} SHADOWS</b></div></header>
    <section className="sv-shadow-hero sv-surface"><div className="sv-shadow-mark"><Ghost size={42}/></div><div><p className="sv-eyebrow">MONARCH'S ARCHIVE</p><h2>{shadows.length ? 'The fallen answer your call.' : 'Your army awaits its first shadow.'}</h2><p>Defeated story bosses appear here when their victory is present in your saved account. Shadow units are not fabricated when no victory record exists.</p></div></section>
    <div className="sv-metric-row sv-analytics-metrics">{collections.map(item=><article className="sv-metric" key={item.label}><span className="sv-metric__icon"><Shield size={17}/></span><div><small>{item.label}</small><strong>{item.value}</strong></div></article>)}</div>
    <section className="sv-section sv-surface"><div className="sv-section-head"><div><p className="sv-eyebrow">ACTIVE LOADOUT</p><h2>Command Inventory</h2><p>Current equipment selections from your saved profile.</p></div><Swords size={19}/></div><div className="sv-loadout-grid">{[{label:'Aura',id:equipped.aura},{label:'Weapon',id:equipped.weapon},{label:'Title',id:equipped.title},{label:'Shield',id:equipped.shield}].map(item=><div key={item.label}><small>{item.label.toUpperCase()}</small><b>{item.id || 'Not equipped'}</b></div>)}</div></section>
    <section className="sv-section sv-surface"><div className="sv-section-head"><div><p className="sv-eyebrow">SUMMONED RECORDS</p><h2>Shadow Roster</h2><p>Confirmed story victories only.</p></div><strong>{shadows.length}</strong></div>
      {shadows.length ? <div className="sv-shadow-grid">{shadows.map(shadow=><article className="sv-shadow-card" key={shadow.id}><div className="sv-shadow-avatar"><Ghost size={25}/></div><span className="sv-eyebrow">BOUND SHADOW</span><h3>{shadow.name}</h3><p>{shadow.chapter}</p><small>VICTORY RECORD CONFIRMED</small></article>)}</div> : <div className="sv-empty-record">NO SHADOWS RECORDED YET — STORY VICTORIES WILL APPEAR HERE</div>}
    </section>
  </div>;
}
