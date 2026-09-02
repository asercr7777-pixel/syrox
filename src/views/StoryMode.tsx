import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Coins, Eye, Flame, Lock, Map as MapIcon, Music, ScrollText, Shield, Swords, Target, Trophy, VolumeX, Zap } from 'lucide-react';
import { useStore } from '../store/useStore';
import { toast } from '../components/ui/Toast';
import { triggerConfetti } from '../components/ui/Confetti';
import { ALL_CHAPTERS } from '../data/story';
import type { StoryChapter, StoryMission, DialogueLine } from '../data/story/types';
import { getShadowMoment, shadowDialogue } from '../data/story/shadowAI';
import { decodeStoryEvolution } from '../data/story/storyEvolution';
import { initAudio, isMusicEnabled, playMusic, playSfx, setMusicEnabled, stopMusic, stopNarration } from '../lib/audioEngine';
import { CutscenePlayer } from '../components/story/CutscenePlayer';
import { StoryObjectivePanel } from '../components/story/StoryObjectivePanel';

type StoryView='map'|'missions'|'cutscene'|'boss'|'reward';
type CutsceneKind='chapterIntro'|'missionBefore'|'missionAfter';
const CHAPTERS=[...ALL_CHAPTERS].sort((a,b)=>a.number-b.number).slice(0,30);
const getChapter=(n:number)=>CHAPTERS.find(c=>c.number===n)??CHAPTERS[0];
const dateKey=(t:number)=>{const d=new Date(t);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
const today=()=>dateKey(Date.now());
function progressOf(state:ReturnType<typeof useStore>['state'],m:StoryMission){switch(m.type){case'tasks':return Math.min(m.target,Object.values(state.coreCompleted).filter(Boolean).length+Object.values(state.customCompleted).filter(Boolean).length);case'workout':{const t=today();const sessions=state.workoutSessions.filter(s=>dateKey(s.completedAt)===t).length;const h=state.history.some(d=>d.date===t&&d.workoutCompleted);return Math.min(m.target,Math.max(state.workoutsCompletedToday,sessions,h?1:0))}case'pray':return state.coreCompleted.pray?1:0;case'water':return state.coreCompleted.water?1:0;case'sleep':return state.coreCompleted.sleep?1:0;case'read_quran':return state.coreCompleted.read_quran?1:0;case'read_book':return state.coreCompleted.read?1:0;case'streak':return Math.min(m.target,state.streak);case'dungeon':return Math.min(m.target,state.dungeonsCleared);case'discipline_score':{const e=state.mainTasks.filter(t=>t.enabled);const d=e.filter(t=>state.coreCompleted[t.id]).length;return e.length?Math.round(d/e.length*100):0}default:return 0}}
const isCompleted=(s:ReturnType<typeof useStore>['state'],m:StoryMission)=>Boolean(s.storyCompletedMissions[m.id]);
const isReady=(s:ReturnType<typeof useStore>['state'],m:StoryMission)=>!isCompleted(s,m)&&progressOf(s,m)>=m.target;
function Meter({value}:{value:number}){return <div className="h-1.5 overflow-hidden rounded-full bg-white/5"><motion.div animate={{width:`${Math.min(100,value)}%`}} className="h-full rounded-full bg-gradient-to-r from-ember-500 via-orange-400 to-shadow-500"/></div>}
function Stat({icon,label,value}:{icon:React.ReactNode;label:string;value:number}){return <div className="rounded-2xl border border-white/10 bg-black/35 px-4 py-3 backdrop-blur-md"><div className="flex items-center gap-2 text-[9px] font-black tracking-[.22em] text-ink-500">{icon}{label}</div><div className="mt-1 font-mono text-xl font-black text-white">{value}</div></div>}

export default function StoryMode(){
 const {state,completeStoryMission,defeatStoryBoss,advanceStoryChapter,unlockLore,unlockStoryAchievement}=useStore();
 const [view,setView]=useState<StoryView>('map');
 const [selected,setSelected]=useState<StoryChapter>(()=>getChapter(Math.min(state.storyChapter+1,30)));
 const [pending,setPending]=useState<StoryMission|null>(null); const [lines,setLines]=useState<DialogueLine[]>([]); const [kind,setKind]=useState<CutsceneKind>('chapterIntro'); const [musicOn,setMusicOn]=useState(isMusicEnabled());
 const [bossHp,setBossHp]=useState(0); const [bossPhase,setBossPhase]=useState<'intro'|'battle'|'defeat'>('intro'); const [bossIndex,setBossIndex]=useState(0); const [timeLeft,setTimeLeft]=useState(0); const [reward,setReward]=useState<{xp:number;coins:number;title?:string;lore?:string}|null>(null);
 const current=Math.min(state.storyChapter+1,30);
 const selectedProgress=useMemo(()=>selected.missions.map(m=>({mission:m,progress:progressOf(state,m),done:isCompleted(state,m),ready:isReady(state,m)})),[selected,state]);
 const doneCount=selectedProgress.filter(x=>x.done).length; const allDone=doneCount===selected.missions.length;
 const evo=useMemo(()=>decodeStoryEvolution(state.storyAchievements,state.storyLoreUnlocked),[state.storyAchievements,state.storyLoreUnlocked]);
 const shadow=getShadowMoment(state,selected.number,allDone);
 const bossExercises=useMemo(()=>[{name:'Focus Hold',duration:20,note:'Stay controlled. The battle rewards consistency, not speed.'},{name:'Bodyweight Squats',duration:25,note:'Smooth reps. Own the movement.'},{name:'Push-ups',duration:20,note:'Clean form. Stop if form breaks.'},{name:'High Knees',duration:25,note:'Stay light and keep the rhythm.'}],[]);
 const bossExercise=bossExercises[bossIndex];
 useEffect(()=>{initAudio();const p=new URLSearchParams(window.location.search);const n=Number(p.get('chapter'));if(n>=1&&n<=30){setSelected(getChapter(n));setView('missions')}return()=>{stopMusic();stopNarration()}},[]);
 useEffect(()=>{if(!musicOn){stopMusic();return}playMusic(view==='map'?'mystery':selected.musicTheme)},[view,musicOn,selected]);
 const finishBossRound=()=>{if(bossPhase!=='battle')return;const next=Math.max(0,bossHp-Math.ceil(selected.boss.hp/bossExercises.length));const ni=bossIndex+1;setBossHp(next);playSfx(next===0?'success':'sword_clash');if(next===0||ni>=bossExercises.length){setBossPhase('defeat');const b=selected.boss;defeatStoryBoss(b.id);if(b.rewardTitle)unlockStoryAchievement(b.rewardTitle);if(b.rewardLore)unlockLore(b.rewardLore);completeStoryMission(`boss_${b.id}`,{xp:b.xpReward,coins:b.coinReward});setReward({xp:b.xpReward,coins:b.coinReward,title:b.rewardTitle,lore:b.rewardLore});triggerConfetti(55);window.setTimeout(()=>setView('reward'),650);return}setBossIndex(ni)};
 useEffect(()=>{if(view!=='boss'||bossPhase!=='battle')return;setTimeLeft(bossExercise.duration);let done=false;const timer=window.setInterval(()=>setTimeLeft(v=>{if(v<=1){if(!done){done=true;window.clearInterval(timer);finishBossRound()}return 0}return v-1}),1000);return()=>window.clearInterval(timer)},[view,bossPhase,bossIndex,bossExercise.duration]);
 const openChapter=(c:StoryChapter)=>{setSelected(c);setPending(null);setLines(c.introCutscene);setKind('chapterIntro');setView('cutscene');playSfx('door');const u=new URL(window.location.href);u.searchParams.set('view','story');u.searchParams.set('chapter',String(c.number));window.history.replaceState({},'',u)};
 const backMap=()=>{setView('map');const u=new URL(window.location.href);u.searchParams.set('view','story');u.searchParams.delete('chapter');window.history.replaceState({},'',u);playSfx('click')};
 const openMission=(m:StoryMission)=>{setPending(m);const done=isCompleted(state,m);setLines(done?(m.cutsceneAfter.length?m.cutsceneAfter:m.cutsceneBefore):(m.cutsceneBefore.length?m.cutsceneBefore:[{speaker:'Shadow',voice:'mentor',text:'The path is waiting. Complete the real-world objective, then return.',emotion:'mysterious'}]);setKind(done?'missionAfter':'missionBefore');setView('cutscene');playSfx('click')};
 const finishCutscene=()=>{if(kind==='chapterIntro'){setView('missions');return}if(!pending){setView('missions');return}if(kind==='missionBefore'){if(!isReady(state,pending)){toast({title:'Objective not ready',message:'Complete the linked objective first. The scene will not mark itself complete automatically.',type:'info',icon:'◈'});setView('missions');return}completeStoryMission(pending.id,{xp:pending.xpReward,coins:pending.coinReward});playSfx('quest_complete');triggerConfetti(18);if(pending.cutsceneAfter.length){setLines([...pending.cutsceneAfter,...shadowDialogue(state,selected.number,true)]);setKind('missionAfter');setView('cutscene');return}}setPending(null);setView('missions')};
 const startBoss=()=>{if(state.storyBossDefeated[selected.boss.id]){setReward({xp:0,coins:0,title:selected.boss.rewardTitle,lore:selected.boss.rewardLore});setView('reward');return}if(!allDone){toast({title:'Boss sealed',message:'Every story beat must be explicitly completed before the gate opens.',type:'info'});return}setBossIndex(0);setBossHp(selected.boss.hp);setBossPhase('intro');setView('boss');playSfx('boss_roar')};
 const claim=()=>{setReward(null);if(selected.number===Math.min(state.storyChapter+1,30)&&selected.number<30)advanceStoryChapter();setView('map')};

 if(view==='map')return <section className="relative min-h-[760px] overflow-hidden rounded-[2rem] border border-white/10 bg-[#040408] p-4 sm:p-7">...</section>;
 if(view==='cutscene')return <section>...</section>;
 if(view==='missions')return <section>...</section>;
 if(view==='boss')return <section>...</section>;
 return <section>...</section>;
}
