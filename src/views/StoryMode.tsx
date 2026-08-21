import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, BookOpen, Check, Coins, Map as MapIcon, Music, Skull, Sparkles, Swords, Target, Trophy, VolumeX, Zap } from 'lucide-react';
import { useStore } from '../store/useStore';
import { toast } from '../components/ui/Toast';
import { triggerConfetti } from '../components/ui/Confetti';
import { ALL_CHAPTERS } from '../data/story';
import type { StoryChapter, StoryMission, DialogueLine } from '../data/story/types';
import { initAudio, isMusicEnabled, playMusic, playSfx, setMusicEnabled, stopMusic, stopNarration } from '../lib/audioEngine';
import { CutscenePlayer } from '../components/story/CutscenePlayer';

type StoryView = 'map' | 'missions' | 'cutscene' | 'boss' | 'reward';
type CutsceneKind = 'missionBefore' | 'missionAfter';
const CHAPTERS = [...ALL_CHAPTERS].sort((a, b) => a.number - b.number).slice(0, 30);
const getChapter = (number: number) => CHAPTERS.find((chapter) => chapter.number === number) ?? CHAPTERS[0];

function missionProgress(state: ReturnType<typeof useStore>['state'], mission: StoryMission) {
  switch (mission.type) {
    case 'tasks': return Math.min(mission.target, Object.values(state.coreCompleted).filter(Boolean).length + Object.values(state.customCompleted).filter(Boolean).length);
    case 'workout': return Math.min(mission.target, state.workoutsCompletedToday);
    case 'pray': return state.coreCompleted.pray ? 1 : 0;
    case 'water': return state.coreCompleted.water ? 1 : 0;
    case 'sleep': return state.coreCompleted.sleep ? 1 : 0;
    case 'read_quran': return state.coreCompleted.read_quran ? 1 : 0;
    case 'read_book': return state.coreCompleted.read ? 1 : 0;
    case 'streak': return Math.min(mission.target, state.streak);
    case 'dungeon': return Math.min(mission.target, state.dungeonsCleared);
    case 'discipline_score': { const enabled = state.mainTasks.filter((t) => t.enabled); const done = enabled.filter((t) => state.coreCompleted[t.id]).length; return enabled.length ? Math.round(done / enabled.length * 100) : 0; }
    default: return 0;
  }
}
function missionDone(state: ReturnType<typeof useStore>['state'], mission: StoryMission) { return Boolean(state.storyCompletedMissions[mission.id]) || missionProgress(state, mission) >= mission.target; }

type BossExercise = { name: string; reps: number; unit: 'reps' | 'seconds'; note: string };
function getBossExercise(chapterNumber: number): BossExercise {
  const exercises: BossExercise[] = [
    { name: 'Push-ups', reps: 10, unit: 'reps', note: 'Use a comfortable range and controlled form.' },
    { name: 'Bodyweight Squats', reps: 15, unit: 'reps', note: 'Keep the movement controlled and pain-free.' },
    { name: 'Plank', reps: 20, unit: 'seconds', note: 'Keep your body steady; stop if you feel pain.' },
    { name: 'Push-ups', reps: 20, unit: 'reps', note: 'Break the reps into smaller sets if needed.' },
    { name: 'Bodyweight Squats', reps: 25, unit: 'reps', note: 'Move at a steady pace and keep good form.' },
    { name: 'Plank', reps: 30, unit: 'seconds', note: 'Keep breathing normally and stop when form breaks.' },
    { name: 'Push-ups', reps: 30, unit: 'reps', note: 'Split into sets if necessary; quality matters.' },
    { name: 'Bodyweight Squats', reps: 35, unit: 'reps', note: 'Use a comfortable depth and controlled tempo.' },
    { name: 'Plank', reps: 40, unit: 'seconds', note: 'Keep your core steady and breathe normally.' },
    { name: 'Push-ups', reps: 40, unit: 'reps', note: 'You can split this into several easy sets.' },
  ];
  return exercises[(chapterNumber - 1) % exercises.length];
}

export default function StoryMode() {
  const { state, completeStoryMission, defeatStoryBoss, advanceStoryChapter, unlockLore, unlockStoryAchievement } = useStore();
  const [view, setView] = useState<StoryView>('map');
  const [selected, setSelected] = useState<StoryChapter>(() => getChapter(Math.min(state.storyChapter + 1, 30)));
  const [pendingMission, setPendingMission] = useState<StoryMission | null>(null);
  const [cutsceneLines, setCutsceneLines] = useState<DialogueLine[]>([]);
  const [cutsceneKind, setCutsceneKind] = useState<CutsceneKind>('missionBefore');
  const [musicOn, setMusicOn] = useState(isMusicEnabled());
  const [bossHp, setBossHp] = useState(0);
  const [bossPhase, setBossPhase] = useState<'intro' | 'battle' | 'defeat'>('intro');
  const [reward, setReward] = useState<{ xp: number; coins: number; title?: string; lore?: string } | null>(null);
  const [exerciseDone, setExerciseDone] = useState(false);

  const bossExercise = useMemo(() => getBossExercise(selected.number), [selected.number]);

  useEffect(() => { initAudio(); const params = new URLSearchParams(window.location.search); const requested = Number(params.get('chapter')); if (requested >= 1 && requested <= 30) { setSelected(getChapter(requested)); setView('missions'); } return () => { stopMusic(); stopNarration(); }; }, []);
  useEffect(() => { if (!musicOn) { stopMusic(); return; } if (view === 'map') playMusic('mystery'); else if (selected) playMusic(selected.musicTheme); }, [view, musicOn, selected]);

  const selectChapter = (chapter: StoryChapter) => { setSelected(chapter); setView('missions'); const url = new URL(window.location.href); url.searchParams.set('view', 'story'); url.searchParams.set('chapter', String(chapter.number)); window.history.replaceState({}, '', url); playSfx('click'); };
  const backToMap = () => { setView('map'); const url = new URL(window.location.href); url.searchParams.set('view', 'story'); url.searchParams.delete('chapter'); window.history.replaceState({}, '', url); };
  const toggleMusic = () => { const next = !musicOn; setMusicOn(next); setMusicEnabled(next); if (!next) stopMusic(); };

  const openMission = (mission: StoryMission) => { setPendingMission(mission); const alreadyDone = Boolean(state.storyCompletedMissions[mission.id]); setCutsceneLines(alreadyDone ? (mission.cutsceneAfter.length ? mission.cutsceneAfter : mission.cutsceneBefore) : (mission.cutsceneBefore.length ? mission.cutsceneBefore : [{ speaker: 'Shadow', voice: 'guardian', text: 'The path is waiting. Complete the task, then return.', emotion: 'mysterious' }])); setCutsceneKind(alreadyDone ? 'missionAfter' : 'missionBefore'); setView('cutscene'); playSfx('door'); };

  const finishCutscene = () => {
    if (!pendingMission) { setView('missions'); return; }
    if (cutsceneKind === 'missionBefore') {
      if (!missionDone(state, pendingMission)) { toast({ title: 'Mission not complete', message: 'Complete the mission in the story or the linked real task, then return.', type: 'info', icon: '📋' }); setView('missions'); return; }
      completeStoryMission(pendingMission.id, { xp: pendingMission.xpReward, coins: pendingMission.coinReward }); playSfx('quest_complete'); triggerConfetti(25);
      if (pendingMission.cutsceneAfter.length) { setCutsceneLines(pendingMission.cutsceneAfter); setCutsceneKind('missionAfter'); setView('cutscene'); return; }
    }
    setPendingMission(null); setView('missions');
  };

  const startBoss = () => {
    if (state.storyBossDefeated[selected.boss.id]) { setReward({ xp: selected.boss.xpReward, coins: selected.boss.coinReward, title: selected.boss.rewardTitle, lore: selected.boss.rewardLore }); setView('reward'); return; }
    if (!selected.missions.every((m) => state.storyCompletedMissions[m.id])) { toast({ title: 'Boss locked', message: 'Complete every chapter mission first.', type: 'info' }); return; }
    setExerciseDone(false); setBossHp(selected.boss.hp); setBossPhase('intro'); setView('boss'); playSfx('boss_roar');
  };

  const completeBossExercise = () => {
    if (bossPhase !== 'battle' || exerciseDone) return;
    setExerciseDone(true);
    const next = Math.max(0, bossHp - 100);
    setBossHp(next);
    playSfx(next === 0 ? 'success' : 'sword_clash');
    if (next === 0) {
      setBossPhase('defeat');
      const boss = selected.boss;
      defeatStoryBoss(boss.id);
      if (boss.rewardTitle) unlockStoryAchievement(boss.rewardTitle);
      if (boss.rewardLore) unlockLore(boss.rewardLore);
      completeStoryMission(`boss_${boss.id}`, { xp: boss.xpReward, coins: boss.coinReward });
      setReward({ xp: boss.xpReward, coins: boss.coinReward, title: boss.rewardTitle, lore: boss.rewardLore });
      triggerConfetti(60);
      setTimeout(() => setView('reward'), 800);
    }
  };

  const claimReward = () => { setReward(null); if (selected.number === Math.min(state.storyChapter + 1, 30) && selected.number < 30) advanceStoryChapter(); setView('map'); };

  const currentNumber = Math.min(state.storyChapter + 1, 30);
  const selectedProgress = useMemo(() => selected.missions.map((m) => ({ mission: m, progress: missionProgress(state, m), done: Boolean(state.storyCompletedMissions[m.id]) })), [selected, state]);
  const allMissionsDone = selected.missions.length > 0 && selected.missions.every((m) => state.storyCompletedMissions[m.id]);

  if (view === 'cutscene') return <div className="space-y-4"><button onClick={() => setView('missions')} className="btn-ghost"><ArrowLeft size={16} /> Back to missions</button><CutscenePlayer lines={cutsceneLines} onComplete={finishCutscene} bgGradient={selected.bgGradient} chapterEmoji={selected.emoji} chapterTitle={selected.title} shadowGuide /></div>;
  if (view === 'missions') return <section className="space-y-6">
    <div className="flex items-center justify-between gap-3"><button onClick={backToMap} className="btn-ghost"><MapIcon size={16} /> World Map</button><button onClick={toggleMusic} className="btn-ghost">{musicOn ? <Music size={15} /> : <VolumeX size={15} />}{musicOn ? 'Music On' : 'Music Off'}</button></div>
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-3xl border border-ember-500/25 bg-black/45 p-5 sm:p-7"><div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-violet-600/10 blur-3xl" /><div className="relative"><div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-ember-400">Arc I · Chapter {selected.number} · {selected.region.name}</div><h1 className="mt-1 font-display text-3xl font-black text-white sm:text-5xl">{selected.title}</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-ink-300">{selected.description}</p><div className="mt-4 h-2 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full bg-gradient-to-r from-ember-500 to-shadow-500 transition-all" style={{ width: `${selected.missions.length ? selectedProgress.filter((x) => x.done).length / selected.missions.length * 100 : 0}%` }} /></div></div></motion.div>
    <div className="relative overflow-hidden rounded-3xl border border-violet-500/25 bg-[#07070d] p-5 sm:p-6"><div className="grid gap-5 md:grid-cols-[170px_1fr]"><div className="mx-auto w-36 overflow-hidden rounded-2xl border border-violet-400/30 bg-black/50 shadow-[0_0_35px_rgba(124,58,237,.18)]"><img src="/shadow-guide.svg" alt="Shadow" className="aspect-[3/4] w-full object-cover" /></div><div className="self-center"><div className="flex items-center gap-2"><Sparkles size={15} className="text-violet-300" /><span className="text-[10px] font-bold uppercase tracking-[0.3em] text-violet-300">SHADOW · INSIDE THE STORY</span></div><h2 className="mt-1 font-display text-2xl font-black text-white">The masked guide speaks from the path.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-ink-300">Shadow is not a separate page. He appears in scenes, gives direction before difficult missions, and returns when the story changes.</p><div className="mt-4 rounded-xl border border-violet-500/20 bg-violet-500/5 p-3 text-sm italic text-violet-100">“Complete the task in your world. Then come back. I will show you what changed.”</div></div></div></div>
    <div className="grid gap-3 lg:grid-cols-2">{selectedProgress.map(({ mission, progress, done }, i) => <motion.div key={mission.id} initial={{ opacity: 0, x: i % 2 ? 10 : -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i * .035, .25) }} className={`rounded-2xl border p-4 ${done ? 'border-emerald-500/25 bg-emerald-500/5' : 'border-white/10 bg-black/30'}`}><div className="flex items-start gap-3"><div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${done ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-ember-500/20 bg-ember-500/10 text-ember-300'}`}>{done ? <Check size={18} /> : <Target size={18} />}</div><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><h3 className="font-display text-lg font-bold text-white">{mission.title}</h3><span className="text-xs font-mono text-ink-500">{progress}/{mission.target}</span></div><p className="mt-1 text-xs leading-5 text-ink-400">{mission.description}</p><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/5"><div className={`h-full rounded-full ${done ? 'bg-emerald-500' : 'bg-ember-500'}`} style={{ width: `${Math.min(100, progress / Math.max(1, mission.target) * 100)}%` }} /></div><div className="mt-3 flex items-center justify-between gap-2"><span className="flex items-center gap-1 text-[11px] text-ink-500"><Zap size={12} /> +{mission.xpReward} XP · <Coins size={12} /> +{mission.coinReward}</span><button onClick={() => openMission(mission)} className="btn-primary px-3 py-1.5 text-xs">{done ? 'Replay Scene' : 'Enter Mission'} <ArrowRight size={13} /></button></div></div></div></motion.div>)}</div>
    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-[10px] uppercase tracking-wider text-amber-300">Chapter Gate</p><h3 className="mt-1 font-display text-xl font-black text-white">{selected.boss.name}</h3><p className="text-xs text-ink-400">{allMissionsDone ? 'All missions complete. The gate is open.' : 'Finish every mission to challenge the boss.'}</p></div><button disabled={!allMissionsDone} onClick={startBoss} className="btn-primary disabled:opacity-40"><Skull size={16} /> Challenge Boss</button></div></div>
  </section>;
  if (view === 'boss') return <section className="mx-auto max-w-3xl space-y-5"><button onClick={() => setView('missions')} className="btn-ghost"><ArrowLeft size={16} /> Back to missions</button><div className="relative overflow-hidden rounded-3xl border border-rose-500/30 bg-black/60 p-6 text-center sm:p-10"><div className="text-6xl">{selected.boss.emoji}</div><p className="mt-3 text-[10px] uppercase tracking-[0.3em] text-rose-300">{selected.boss.title}</p><h1 className="font-display text-3xl font-black text-white">{selected.boss.name}</h1><p className="mx-auto mt-2 max-w-xl text-sm text-ink-300">{selected.boss.description}</p>{bossPhase === 'intro' ? <><div className="mx-auto mt-6 max-w-md rounded-2xl border border-violet-500/20 bg-violet-500/5 p-5"><div className="text-xs font-bold uppercase tracking-[0.2em] text-violet-300">Physical Trial</div><div className="mt-2 text-2xl font-black text-white">{bossExercise.name}</div><div className="mt-1 text-4xl font-black text-ember-300">{bossExercise.reps} {bossExercise.unit}</div><p className="mt-2 text-xs leading-5 text-ink-400">{bossExercise.note}</p><p className="mt-3 text-[10px] uppercase tracking-wider text-ink-600">Need less? Split the reps into comfortable sets.</p></div><button onClick={() => setBossPhase('battle')} className="btn-primary mt-7"><Swords size={16} /> Begin Physical Trial</button></> : bossPhase === 'battle' ? <><div className="mx-auto mt-6 max-w-md rounded-2xl border border-ember-500/20 bg-ember-500/5 p-5"><div className="text-xs font-bold uppercase tracking-[0.2em] text-ember-300">Defeat the boss</div><div className="mt-2 text-2xl font-black text-white">Complete the trial</div><div className="mt-2 text-4xl font-black text-white">{bossExercise.reps} {bossExercise.unit}</div><p className="mt-2 text-xs text-ink-400">{bossExercise.note}</p><button onClick={completeBossExercise} disabled={exerciseDone} className="btn-primary mt-5 disabled:opacity-50">{exerciseDone ? 'Trial Complete' : 'I completed the trial'} <Check size={15} /></button></div><div className="mx-auto mt-6 max-w-xl"><div className="mb-2 flex justify-between text-xs text-ink-400"><span>Boss HP</span><span>{bossHp} / {selected.boss.hp}</span></div><div className="h-4 overflow-hidden rounded-full bg-white/5"><div className="h-full bg-gradient-to-r from-rose-600 to-red-400 transition-all" style={{ width: `${bossHp / selected.boss.hp * 100}%` }} /></div></div></> : <div className="mt-7 rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-5"><Trophy size={28} className="mx-auto text-emerald-300" /><h2 className="mt-2 font-display text-2xl font-black text-white">Victory</h2><p className="text-sm text-ink-300">Shadow watches as the gate falls.</p></div>}</div></section>;
  if (view === 'reward' && reward) return <section className="mx-auto max-w-2xl space-y-5"><div className="rounded-3xl border border-gold-500/30 bg-black/60 p-7 text-center sm:p-10"><div className="text-5xl">🏆</div><p className="mt-3 text-[10px] uppercase tracking-[0.3em] text-gold-300">Chapter Cleared</p><h1 className="font-display text-3xl font-black text-white">{selected.title}</h1><div className="mt-6 grid grid-cols-2 gap-3"><div className="rounded-2xl border border-ember-500/20 bg-ember-500/5 p-4"><Zap size={18} className="mx-auto text-ember-300" /><p className="mt-2 text-2xl font-black text-white">+{reward.xp}</p><p className="text-xs text-ink-500">XP</p></div><div className="rounded-2xl border border-gold-500/20 bg-gold-500/5 p-4"><Coins size={18} className="mx-auto text-gold-300" /><p className="mt-2 text-2xl font-black text-white">+{reward.coins}</p><p className="text-xs text-ink-500">Coins</p></div></div>{reward.title && <p className="mt-5 text-sm text-gold-200">Title unlocked: {reward.title}</p>}{reward.lore && <p className="mt-2 text-xs text-ink-400">Lore unlocked: {reward.lore}</p>}<button onClick={claimReward} className="btn-primary mt-7"><ArrowRight size={16} /> Continue to World Map</button></div></section>;

  return <section className="space-y-6 pb-8"><div className="relative overflow-hidden rounded-3xl border border-ember-500/25 bg-[#07080d] p-5 sm:p-8"><div className="absolute -right-28 -top-28 h-72 w-72 rounded-full bg-ember-500/10 blur-3xl" /><div className="absolute -left-24 bottom-0 h-52 w-52 rounded-full bg-violet-600/10 blur-3xl" /><div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between"><div className="max-w-3xl"><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.34em] text-ember-400"><MapIcon size={14} /> World Map · Arc I</div><h1 className="mt-2 font-display text-4xl font-black tracking-tight text-white sm:text-6xl">THE BROKEN REALITY</h1><p className="mt-3 text-sm leading-6 text-ink-300 sm:text-base">Arc I is a single 30-chapter route. The map is open from the start and is not locked by level. Choose a chapter to go directly to its missions. Shadow only appears inside the story itself.</p><div className="mt-4 flex flex-wrap gap-2"><span className="chip border border-ember-500/25 bg-ember-500/10 text-ember-300"><BookOpen size={12} /> 30 Chapters</span><span className="chip border border-violet-500/25 bg-violet-500/10 text-violet-300"><Sparkles size={12} /> Shadow inside story</span><span className="chip border border-white/10 bg-white/[0.03] text-ink-300">No level gate</span></div></div><button onClick={toggleMusic} className="btn-ghost shrink-0">{musicOn ? <Music size={16} /> : <VolumeX size={16} />}{musicOn ? 'Music On' : 'Music Off'}</button></div></div>
    <div className="rounded-3xl border border-white/10 bg-black/35 p-4 sm:p-6"><div className="mb-6 flex items-end justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.3em] text-ember-400">Arc I · Main Route</p><h2 className="mt-1 font-display text-2xl font-black text-white">The Awakening Path</h2></div><div className="text-right text-xs text-ink-500">Current Chapter <span className="font-bold text-ember-300">{currentNumber}/30</span></div></div><div className="relative mx-auto max-w-5xl"><div className="absolute bottom-6 left-1/2 top-6 w-px -translate-x-1/2 bg-gradient-to-b from-ember-500/60 via-violet-500/40 to-transparent" /><div className="space-y-3">{CHAPTERS.map((chapter, index) => { const done = Boolean(state.storyBossDefeated[chapter.boss.id]); const current = chapter.number === currentNumber; const left = index % 2 === 0; return <motion.div key={chapter.id} initial={{ opacity: 0, x: left ? -14 : 14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(index * .018, .4) }} className={`relative flex ${left ? 'justify-start' : 'justify-end'}`}><button onClick={() => selectChapter(chapter)} className={`group relative w-[calc(50%-18px)] min-w-0 rounded-2xl border p-3 text-left transition-all duration-200 sm:p-4 ${current ? 'border-violet-400/55 bg-violet-500/10 shadow-[0_0_30px_rgba(139,92,246,.14)]' : done ? 'border-emerald-500/25 bg-emerald-500/5' : 'border-white/[0.07] bg-white/[0.018] hover:border-ember-400/40 hover:bg-ember-500/5'}`}><span className={`absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full ${left ? '-right-[22px]' : '-left-[22px]'} ${done ? 'bg-emerald-400' : current ? 'bg-violet-300 shadow-[0_0_14px_rgba(167,139,250,.9)]' : 'bg-ember-400/70'}`} /><div className="flex items-start gap-3"><div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border font-mono text-sm font-bold ${done ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : current ? 'border-violet-400/40 bg-violet-500/10 text-violet-200' : 'border-ember-500/20 bg-ember-500/5 text-ember-300'}`}>{done ? <Check size={17} /> : String(chapter.number).padStart(2, '0')}</div><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><span className="text-[9px] font-bold uppercase tracking-wider text-ink-600">Chapter {chapter.number}</span>{current && <span className="chip border border-violet-400/25 bg-violet-500/10 px-1.5 py-0 text-[9px] text-violet-300">CURRENT</span>}</div><h3 className="truncate font-display text-sm font-bold text-white sm:text-base">{chapter.title}</h3><p className="mt-0.5 truncate text-[11px] text-ink-400">{chapter.subtitle}</p></div></div></button></motion.div>; })}</div></div></div><p className="text-center text-[10px] uppercase tracking-[0.25em] text-ink-600">Arc I · 30 chapters · select a node to open its missions</p></section>;
}
