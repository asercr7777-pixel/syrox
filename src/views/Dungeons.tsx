import { useState } from 'react';
import { useStore } from '../store/useStore';
import { getRankByXp, getRankIndex, RANKS } from '../data/ranks';
import { DUNGEONS, type Dungeon } from '../data/dungeons';
import { Modal } from '../components/ui/Modal';
import { toast } from '../components/ui/Toast';
import { triggerConfetti } from '../components/ui/Confetti';
import { playSound } from '../lib/sound';
import { Swords, Lock, Check, Zap, Trophy, Dumbbell, X, ChevronRight, Skull, Target, Crown } from 'lucide-react';
import '../stryven-dungeons.css';
import '../dungeons-performance.css';

const DUNGEON_IMAGES: Record<string, string> = {
  'Awakening Gate': '/awakening-gate.webp.jpg','Whispering Hollow': '/whispering-hollow.webp.jpg','Stone Trial': '/stone-trial.webp.jpg','Frost Cavern': '/frost-cavern.webp.jpg','Storm Spire': '/storm-spire.webp.jpg','Crimson Sanctum': '/crimson-sanctum.webp.jpg','Inferno Keep': '/inferno-keep.webp.jpg','Thunder Vault': '/thunder-vault.webp.jpg','Dark Abyss': '/dark-abyss.webp.jpg','Shadow Labyrinth': '/shadow-labyrinth.webp.jpg',"Hunter's Gauntlet": '/hunters-gauntlet.webp.jpg',"Monarch's Throne": '/monarchs-throne.webp.jpg',"Slayer's Coliseum": '/slayers-coliseum.webp.jpg','Nightmare Sanctum': '/nightmare-sanctum.webp.jpg','Doom Crucible': '/doom-crucible.webp.jpg',"Executioner's Block": '/executioners-block.webp.jpg','Mythic Sanctuary': '/mythic-sanctuary.webp.jpg','Hall of the Immortal': '/hall-of-the-immortal.webp.jpg',"Shadow King's Court": '/shadow-kings-court.webp.jpg','System Overlord Citadel': '/system-overlord-citadel.webp.jpg',
};

export function Dungeons() {
  const { state, clearDungeon } = useStore();
  const [selected, setSelected] = useState<Dungeon | null>(null);
  const [active, setActive] = useState<Dungeon | null>(null);
  const [done, setDone] = useState<Record<number, boolean>>({});
  const [reward, setReward] = useState<Dungeon | null>(null);
  const [drops, setDrops] = useState<any[]>([]);
  const rank = getRankByXp(state.xp);
  const rankIndex = getRankIndex(rank.id);
  const cleared = state.dungeonClearedToday;

  const enter = (d: Dungeon) => {
    if (cleared) return toast({ title: 'Already Cleared', message: 'Your daily raid is complete. Return after midnight.', type: 'info' });
    setSelected(null); setActive(d); setDone({}); playSound('whoosh');
  };
  const finish = () => {
    if (!active) return;
    const result = clearDungeon(active.id) ?? [];
    setDrops(result); setReward(active); setActive(null); triggerConfetti(60);
  };
  const progress = active ? Object.values(done).filter(Boolean).length / active.exercises.length * 100 : 0;

  return <div className="stryven-raids">
    <section className="raid-hero"><div className="raid-hero__image"/><div className="raid-hero__veil"/><div className="raid-hero__content"><div className="raid-kicker"><span className="raid-kicker__line"/> DAILY RAID <span className="raid-kicker__line"/></div><h1 className="raid-title">THE DUNGEONS</h1><p className="raid-subtitle">Twenty trials. One hunter. Conquer the path from Awakening Gate to the System Overlord.</p><div className="raid-status-row"><div className="raid-status"><Target size={15}/><span>RANK</span><strong>{rank.name}</strong></div><div className="raid-status"><Zap size={15}/><span>XP</span><strong>{state.xp.toLocaleString()}</strong></div><div className={`raid-status ${cleared ? 'is-cleared' : ''}`}><Swords size={15}/><span>DAILY RAID</span><strong>{cleared ? 'CLEARED' : 'READY'}</strong></div></div></div></section>
    <section className="raid-section-head"><div><div className="raid-section-kicker">THE RAID PATH</div><h2>Choose your trial</h2></div><div className="raid-count">20 <span>RAIDS</span></div></section>
    <section className="raid-rail" aria-label="Dungeon raids">{DUNGEONS.map((d, i) => { const ri = RANKS.findIndex(r => r.id === d.rankId); const unlocked = ri <= rankIndex; const current = ri === rankIndex; const r = RANKS.find(x => x.id === d.rankId)!; return <button key={d.id} className={`raid-card ${current?'is-current':''} ${!unlocked?'is-locked':''} ${cleared&&current?'is-cleared':''}`} style={{['--rank-color' as any]:r.color,['--delay' as any]:`${Math.min(i*30,450)}ms`}} onClick={() => unlocked && setSelected(d)} disabled={!unlocked}><img src={DUNGEON_IMAGES[d.name]} alt="" className="raid-card__image" loading={i<2?'eager':'lazy'} decoding="async"/><span className="raid-card__shade"/><span className="raid-card__top"><span className="raid-card__number">{String(i+1).padStart(2,'0')}</span><span className="raid-card__rank">{r.name}</span></span><span className="raid-card__bottom"><span className="raid-card__theme">{d.theme}</span><strong>{d.name}</strong><span className="raid-card__meta"><Zap size={11}/> {d.rewardXp.toLocaleString()} XP <i/> {d.exercises.length} TRIALS</span></span>{!unlocked&&<span className="raid-card__lock"><Lock size={18}/><small>LOCKED</small><em>{r.name}</em></span>}{cleared&&current&&<span className="raid-card__clear"><Check size={13}/> CLEARED TODAY</span>}{current&&!cleared&&<span className="raid-card__current">CURRENT TRIAL</span>}</button>})}</section>
    <div className="raid-scroll-hint"><ChevronRight size={14}/> DRAG OR SHIFT + SCROLL TO EXPLORE ALL RAIDS <ChevronRight size={14}/></div>
    <section className="raid-footer-panel"><div className="raid-footer-art"/><div className="raid-footer-copy"><span>THE FINAL DESTINATION</span><strong>Every raid gets harder.<br/>The last gate waits.</strong></div><div className="raid-footer-stats"><div><Skull size={17}/><b>20</b><span>RAIDS</span></div><div><Crown size={17}/><b>SS</b><span>APEX TIER</span></div><div><Trophy size={17}/><b>1</b><span>DAILY CLEAR</span></div></div></section>
    <Modal open={!!selected} onClose={()=>setSelected(null)} title="" size="lg">{selected&&<Preview dungeon={selected} rank={rank} onEnter={enter}/>}</Modal>
    <Modal open={!!active} onClose={()=>setActive(null)} title="" size="md">{active&&<div className="raid-run-modal"><div className="raid-run-art" style={{backgroundImage:`url(${DUNGEON_IMAGES[active.name]})`}}><div><span>RAID IN PROGRESS</span><strong>{active.name}</strong></div><button onClick={()=>setActive(null)} aria-label="Close"><X size={18}/></button></div><div className="raid-run-body"><p className="raid-run-copy">Complete every trial to clear the raid.</p><div className="raid-progress"><span style={{width:`${progress}%`}}/></div><div className="raid-exercises">{active.exercises.map((e,i)=>{const isDone=!!done[i];return <button key={i} disabled={isDone} onClick={()=>{setDone(x=>({...x,[i]:true}));playSound('task')}} className={isDone?'done':''}><span className="raid-exercise-check">{isDone&&<Check size={13}/>}</span><Dumbbell size={16}/><span>{e.name}</span><b>{e.reps}{e.isTime?'s':' reps'}</b></button>})}</div>{Object.values(done).filter(Boolean).length===active.exercises.length&&<button onClick={finish} className="raid-claim"><Trophy size={17}/> CLAIM RAID REWARDS</button>}</div></div>}</Modal>
    <Modal open={!!reward} onClose={()=>setReward(null)} title="" size="md">{reward&&<div className="raid-reward-modal"><div className="raid-reward-art" style={{backgroundImage:`url(${DUNGEON_IMAGES[reward.name]})`}}><div className="raid-reward-badge"><Trophy size={27}/></div></div><div className="raid-reward-body"><span>RAID CLEARED</span><h3>{reward.name}</h3><div className="raid-reward-list"><div className="raid-reward-display"><div><Zap size={17}/></div><span>{reward.rewardXp.toLocaleString()} XP</span><b>PROGRESSION</b></div>{drops.map((d,i)=><div key={i} className="raid-drop"><span>{d.label}</span></div>)}</div><button onClick={()=>setReward(null)} className="raid-continue">CONTINUE</button></div></div>}</Modal>
  </div>;
}

function Preview({dungeon,rank,onEnter}:{dungeon:Dungeon;rank:ReturnType<typeof getRankByXp>;onEnter:(d:Dungeon)=>void}) { return <div className="raid-preview"><div className="raid-preview__art" style={{backgroundImage:`url(${DUNGEON_IMAGES[dungeon.name]})`}}><div className="raid-preview__overlay"/><div className="raid-preview__title"><span>{dungeon.theme}</span><h3>{dungeon.name}</h3><p>{dungeon.description}</p></div></div><div className="raid-preview__body"><div className="raid-preview__stats"><div><Zap size={15}/><span>REWARD XP</span><b>{dungeon.rewardXp.toLocaleString()}</b></div><div><Target size={15}/><span>TRIALS</span><b>{dungeon.exercises.length}</b></div><div><Crown size={15}/><span>RANK</span><b>{rank.name}</b></div></div><div className="raid-preview__label">TRIAL REQUIREMENTS</div><div className="raid-preview__exercises">{dungeon.exercises.map((e,i)=><div key={i}><Dumbbell size={15}/><span>{e.name}</span><b>{e.reps}{e.isTime?'s':' reps'}</b></div>)}</div><div className="raid-preview__label">REWARD</div><div className="raid-preview__rewards"><div className="raid-reward-chip"><Zap size={14}/><span>{dungeon.rewardXp.toLocaleString()} XP</span></div></div><button onClick={()=>onEnter(dungeon)} className="raid-enter"><Swords size={17}/> ENTER RAID</button></div></div>; }
