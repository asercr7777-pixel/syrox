import { useMemo, useState } from 'react';
import { ArrowLeft, Check, ChevronRight, Coins, Lock, Music, Shield, Swords, Target, Trophy, Volume2, VolumeX, Zap } from 'lucide-react';
import { useStore } from '../store/useStore';
import { ALL_CHAPTERS } from '../data/story';
import type { StoryChapter, StoryMission } from '../data/story/types';
import { isMusicEnabled, setMusicEnabled } from '../lib/audioEngine';
import { toast } from '../components/ui/Toast';
import { triggerConfetti } from '../components/ui/Confetti';

type Screen = 'chapters' | 'chapter' | 'boss' | 'reward';
const chapters = [...ALL_CHAPTERS].sort((a,b)=>a.number-b.number).slice(0,30);
const chapterFor=(n:number)=>chapters.find(c=>c.number===n) ?? chapters[0];
const dateKey=(t:number)=>new Date(t).toISOString().slice(0,10);

function progress(state:ReturnType<typeof useStore>['state'], m:StoryMission){
 switch(m.type){
  case 'tasks': return Math.min(m.target,Object.values(state.coreCompleted).filter(Boolean).length+Object.values(state.customCompleted).filter(Boolean).length);
  case 'workout': { const today=dateKey(Date.now()); const session=state.workoutSessions.filter(s=>dateKey(s.completedAt)===today).length; const history=state.history.some(d=>d.date===today&&d.workoutCompleted); return Math.min(m.target,Math.max(state.workoutsCompletedToday,session,history?1:0)); }
  case 'pray': return state.coreCompleted.pray?1:0;
  case 'water': return state.coreCompleted.water?1:0;
  case 'sleep': return state.coreCompleted.sleep?1:0;
  case 'read_quran': return state.coreCompleted.read_quran?1:0;
  case 'read_book': return state.coreCompleted.read?1:0;
  case 'streak': return Math.min(m.target,state.streak);
  case 'dungeon': return Math.min(m.target,state.dungeonsCleared);
  case 'discipline_score': { const enabled=state.mainTasks.filter(t=>t.enabled); const done=enabled.filter(t=>state.coreCompleted[t.id]).length; return enabled.length?Math.round(done/enabled.length*100):0; }
  default:return 0;
 }
}

export default function StoryModeSimple(){
 const {state,completeStoryMission,defeatStoryBoss,advanceStoryChapter,unlockLore,unlockStoryAchievement}=useStore();
 const [screen,setScreen]=useState<Screen>('chapters');
 const [selected,setSelected]=useState<StoryChapter>(()=>chapterFor(Math.min(state.storyChapter+1,30)));
 const [bossPhase,setBossPhase]=useState(0);
 const [reward,setReward]=useState<{xp:number;coins:number;title?:string;lore?:string}|null>(null);
 const [music,setMusic]=useState(isMusicEnabled());
 const current=Math.min(state.storyChapter+1,30);
 const rows=useMemo(()=>selected.missions.map(m=>({m,p:progress(state,m),done:Boolean(state.storyCompletedMissions[m.id])})),[selected,state]);
 const done=rows.filter(x=>x.done).length;
 const readyBoss=done===selected.missions.length;
 const open=(c:StoryChapter)=>{if(c.number>current)return;setSelected(c);setScreen('chapter');};
 const complete=(m:StoryMission)=>{
  if(state.storyCompletedMissions[m.id])return;
  const p=progress(state,m);
  if(p<m.target){toast({title:'Mission not complete',message:`Do the objective first: ${m.title}`,type:'info',icon:'◈'});return;}
  completeStoryMission(m.id,{xp:m.xpReward,coins:m.coinReward});
  toast({title:'Mission complete',message:`+${m.xpReward} XP · +${m.coinReward} coins`,type:'success',icon:'✓'});
 };
 const startBoss=()=>{if(!readyBoss){toast({title:'Boss locked',message:'Finish every mission in this chapter first.',type:'info',icon:'◈'});return}setBossPhase(0);setScreen('boss');};
 const hitBoss=()=>{
  if(bossPhase<2){setBossPhase(v=>v+1);return;}
  const b=selected.boss;
  defeatStoryBoss(b.id);
  if(b.rewardTitle)unlockStoryAchievement(b.rewardTitle);
  if(b.rewardLore)unlockLore(b.rewardLore);
  completeStoryMission(`boss_${b.id}`,{xp:b.xpReward,coins:b.coinReward});
  setReward({xp:b.xpReward,coins:b.coinReward,title:b.rewardTitle,lore:b.rewardLore});
  triggerConfetti(30);setScreen('reward');
 };
 const claim=()=>{setReward(null);if(selected.number===current&&selected.number<30)advanceStoryChapter();setScreen('chapters');};
 const toggleMusic=()=>{const next=!music;setMusic(next);setMusicEnabled(next);};

 if(screen==='reward'&&reward)return <div className="story-simple space-y-4"><button className="story-back" onClick={()=>setScreen('chapters')}><ArrowLeft size={15}/> Story</button><section className="story-card story-reward"><div className="story-icon"><Trophy size={28}/></div><div className="story-kicker">CHAPTER CLEARED</div><h1>{selected.title}</h1><p>The gate is open. Your progress is saved.</p><div className="story-rewards"><span><Zap size={15}/> +{reward.xp} XP</span><span><Coins size={15}/> +{reward.coins}</span></div>{reward.title&&<div className="story-loot"><b>{reward.title}</b><span>New achievement unlocked</span></div>}<button className="story-primary" onClick={claim}>Continue <ChevronRight size={17}/></button></section></div>;

 if(screen==='boss')return <div className="story-simple space-y-4"><button className="story-back" onClick={()=>setScreen('chapter')}><ArrowLeft size={15}/> Chapter {selected.number}</button><section className="story-card"><div className="story-kicker">FINAL ENCOUNTER</div><div className="story-boss-head"><div className="story-icon danger"><Swords size={25}/></div><div><h1>{selected.boss.name}</h1><p>Phase {bossPhase+1} of 3</p></div></div><div className="story-boss-bar"><span style={{width:`${100-(bossPhase*33.33)}%`}}/></div><div className="story-phase"><b>{['Hold your ground.','Break the pattern.','Finish the fight.'][bossPhase]}</b><p>{['Stay controlled and complete the focus round.','Keep clean form. Do not rush the movement.','One final push. Finish with quality.'][bossPhase]}</p></div><button className="story-primary" onClick={hitBoss}>{bossPhase===2?'Defeat Boss':'Complete Phase'} <ChevronRight size={17}/></button></section></div>;

 if(screen==='chapter')return <div className="story-simple space-y-4"><div className="story-top"><button className="story-back" onClick={()=>setScreen('chapters')}><ArrowLeft size={15}/> Chapters</button><button className="story-icon-button" onClick={toggleMusic}>{music?<Volume2 size={16}/>:<VolumeX size={16}/>}</button></div><section className="story-card"><div className="story-kicker">CHAPTER {String(selected.number).padStart(2,'0')} · {selected.region.name}</div><div className="story-title-row"><div><h1>{selected.title}</h1><p>{selected.description}</p></div><div className="story-percent">{Math.round(done/Math.max(1,rows.length)*100)}%</div></div><div className="story-progress"><span style={{width:`${done/Math.max(1,rows.length)*100}%`}}/></div></section><section className="story-card"><div className="story-section-head"><div><b>Mission</b><span>{done}/{rows.length} complete</span></div><Target size={17}/></div><div className="story-missions">{rows.map(({m,p,done:d})=><button key={m.id} onClick={()=>complete(m)} className={`story-mission ${d?'done':''}`}><span className="mission-check">{d?<Check size={14}/>:<Target size={14}/>}</span><span className="mission-copy"><b>{m.title}</b><small>{m.description}</small></span><span className="mission-value">{d?'DONE':`${p}/${m.target}`}</span></button>)}</div>{readyBoss?<button className="story-boss-button" onClick={startBoss}><Swords size={16}/> Enter Boss Arena <ChevronRight size={16}/></button>:<div className="story-hint"><Lock size={13}/> Complete all missions to unlock the boss.</div>}</section></div>;

 return <div className="story-simple space-y-4"><div className="story-top"><div><div className="story-kicker">SYROX STORY</div><h1 className="story-main-title">The Chronicle</h1><p className="story-subtitle">30 chapters. One clear path.</p></div><button className="story-icon-button" onClick={toggleMusic}>{music?<Music size={16}/>:<VolumeX size={16}/>}</button></div><section className="story-card story-status"><div><span>Progress</span><b>{state.storyChapter} / 30</b></div><div><span>Next</span><b>Chapter {String(current).padStart(2,'0')}</b></div><div><span>Streak</span><b>{state.streak}</b></div></section><section className="story-chapters">{chapters.map(c=>{const unlocked=c.number<=current;const completed=c.number<=state.storyChapter;return <button key={c.id} disabled={!unlocked} onClick={()=>open(c)} className={`story-chapter ${completed?'done':''} ${c.number===current?'current':''}`}><span className="chapter-number">{completed?<Check size={15}/>:unlocked?c.emoji:<Lock size={14}/>}</span><span><small>CHAPTER {String(c.number).padStart(2,'0')}</small><b>{c.title}</b><em>{c.boss.name}</em></span><ChevronRight size={17}/></button>})}</section><div className="story-hint"><Shield size={13}/> Tap any unlocked chapter. Everything important is shown on one screen.</div></div>;
}
