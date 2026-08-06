import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen, Lock, CheckCircle2, ChevronRight, Swords, Map as MapIcon,
  VolumeX, Music, Zap, Coins, Star, Sparkles, Heart, Skull,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { toast } from '../components/ui/Toast';
import { triggerConfetti } from '../components/ui/Confetti';
import {
  ALL_CHAPTERS, getTotalChapters,
} from '../data/story';
import type { StoryChapter, StoryMission, DialogueLine } from '../data/story/types';
import {
  initAudio, playMusic, stopMusic, playSfx, setMusicEnabled, isMusicEnabled,
  narrate, stopNarration,
} from '../lib/audioEngine';
import { CutscenePlayer } from '../components/story/CutscenePlayer';
import { ParticleField } from '../components/story/ParticleField';
import { ScreenShake } from '../components/story/ScreenShake';
import { ChapterTransition, FadeTransition } from '../components/story/FadeTransition';

type ViewMode = 'map' | 'cutscene' | 'missions' | 'boss' | 'reward';
type CutsceneType = 'intro' | 'missionBefore' | 'missionAfter' | 'boss';

export default function StoryMode() {
  const {
    state,
    completeStoryMission,
    defeatStoryBoss,
    advanceStoryChapter,
    unlockLore,
    unlockStoryAchievement,
  } = useStore();

  const [view, setView] = useState<ViewMode>('map');
  const [selectedChapter, setSelectedChapter] = useState<StoryChapter | null>(null);
  const [showChapterTransition, setShowChapterTransition] = useState(false);
  const [musicOn, setMusicOn] = useState(isMusicEnabled());
  const [shakeTrigger, setShakeTrigger] = useState(0);
  const [bossHp, setBossHp] = useState(0);
  const [bossDialogueIndex, setBossDialogueIndex] = useState(0);
  const [bossPhase, setBossPhase] = useState<'intro' | 'battle' | 'defeat'>('intro');
  const [rewardData, setRewardData] = useState<{ xp: number; coins: number; title?: string; lore?: string } | null>(null);
  const [cutsceneLines, setCutsceneLines] = useState<DialogueLine[]>([]);
  const [cutsceneChapter, setCutsceneChapter] = useState<StoryChapter | null>(null);
  const [cutsceneType, setCutsceneType] = useState<CutsceneType>('intro');
  const [pendingMission, setPendingMission] = useState<StoryMission | null>(null);

  const currentChapterNum = state.storyChapter;

  // Initialize audio on mount
  useEffect(() => {
    initAudio();
    return () => {
      stopMusic();
      stopNarration();
    };
  }, []);

  // Play chapter music when view changes
  useEffect(() => {
    if (view === 'map' && musicOn) {
      playMusic('mystery');
    }
  }, [view, musicOn]);

  // Check mission completion based on real task data
  const checkMissionComplete = useCallback((mission: StoryMission): boolean => {
    if (state.storyCompletedMissions[mission.id]) return true;
    switch (mission.type) {
      case 'tasks': {
        const todayDone = Object.values(state.coreCompleted).filter(Boolean).length
          + Object.values(state.customCompleted).filter(Boolean).length;
        return todayDone >= mission.target;
      }
      case 'workout':
        return state.workoutsCompletedToday >= mission.target;
      case 'pray':
        return state.coreCompleted.pray ? true : false;
      case 'water':
        return state.coreCompleted.water ? true : false;
      case 'sleep':
        return state.coreCompleted.sleep ? true : false;
      case 'read_quran':
        return state.coreCompleted.read_quran ? true : false;
      case 'read_book':
        return state.coreCompleted.read ? true : false;
      case 'streak':
        return state.streak >= mission.target;
      case 'dungeon':
        return state.dungeonsCleared >= mission.target;
      case 'discipline_score': {
        const enabledMain = state.mainTasks.filter((t) => t.enabled);
        const doneCount = enabledMain.filter((t) => state.coreCompleted[t.id]).length;
        const score = enabledMain.length > 0 ? Math.round((doneCount / enabledMain.length) * 100) : 0;
        return score >= mission.target;
      }
      default:
        return false;
    }
  }, [state]);

  const currentChapter = useMemo(() => getChapterByNumber(currentChapterNum), [currentChapterNum]);

  // Handle chapter intro cutscene
  const handleStartChapter = useCallback((chapter: StoryChapter) => {
    if (!isChapterUnlocked(chapter, state)) {
      toast({ title: 'Chapter Locked', message: 'Complete the current chapter to unlock this one.', type: 'info' });
      return;
    }
    setSelectedChapter(chapter);
    setCutsceneLines(chapter.introCutscene);
    setCutsceneChapter(chapter);
    setCutsceneType('intro');
    setView('cutscene');
    if (musicOn) playMusic(chapter.musicTheme);
    playSfx('door');
  }, [currentChapterNum, musicOn, state]);

  // Cutscene complete
  const handleCutsceneComplete = useCallback(() => {
    if (cutsceneType === 'intro') {
      setView('missions');
      if (musicOn && cutsceneChapter) playMusic(cutsceneChapter.musicTheme);
    } else if (cutsceneType === 'missionAfter') {
      setView('missions');
    } else if (cutsceneType === 'missionBefore' && pendingMission) {
      // Check if mission is complete
      if (checkMissionComplete(pendingMission)) {
        completeStoryMission(pendingMission.id, { xp: pendingMission.xpReward, coins: pendingMission.coinReward });
        playSfx('quest_complete');
        triggerConfetti(30);
        toast({
          title: 'Mission Complete!',
          message: `+${pendingMission.xpReward} XP, +${pendingMission.coinReward} Coins`,
          type: 'reward',
          icon: '⭐',
        });
        // Show mission after-cutscene
        if (pendingMission.cutsceneAfter.length > 0) {
          setCutsceneLines(pendingMission.cutsceneAfter);
          setCutsceneType('missionAfter');
          setPendingMission(null);
          setView('cutscene');
        } else {
          setView('missions');
        }
      } else {
        toast({
          title: 'Mission Not Complete',
          message: 'Complete the real-life task to finish this mission.',
          type: 'info',
          icon: '📋',
        });
        setView('missions');
      }
    } else if (cutsceneType === 'boss') {
      setView('boss');
    }
  }, [cutsceneType, pendingMission, checkMissionComplete, completeStoryMission, musicOn, cutsceneChapter]);

  // Handle mission click
  const handleMissionClick = useCallback((mission: StoryMission) => {
    if (state.storyCompletedMissions[mission.id]) {
      // Replay the resolved scene without attempting to award again.
      setCutsceneLines(mission.cutsceneAfter.length > 0 ? mission.cutsceneAfter : mission.cutsceneBefore);
      setCutsceneChapter(selectedChapter);
      setCutsceneType('missionAfter');
      setPendingMission(null);
      setView('cutscene');
      return;
    }
    setCutsceneLines(mission.cutsceneBefore);
    setCutsceneChapter(selectedChapter);
    setCutsceneType('missionBefore');
    setPendingMission(mission);
    setView('cutscene');
    playSfx('click');
  }, [state.storyCompletedMissions, selectedChapter]);

  // Start boss battle
  const handleStartBoss = useCallback(() => {
    if (!selectedChapter) return;
    if (state.storyBossDefeated[selectedChapter.boss.id]) {
      // Already defeated - show rewards
      setRewardData({
        xp: selectedChapter.boss.xpReward,
        coins: selectedChapter.boss.coinReward,
        title: selectedChapter.boss.rewardTitle,
        lore: selectedChapter.boss.rewardLore,
      });
      setView('reward');
      return;
    }
    // Check all missions complete
    const allMissionsDone = selectedChapter.missions.every((m) => state.storyCompletedMissions[m.id]);
    if (!allMissionsDone) {
      toast({ title: 'Boss Locked', message: 'Complete all missions in this chapter first.', type: 'info' });
      return;
    }
    setBossHp(selectedChapter.boss.hp);
    setBossDialogueIndex(0);
    setBossPhase('intro');
    setView('boss');
    if (musicOn) playMusic('boss_battle');
    playSfx('boss_roar');
    setShakeTrigger((t) => t + 1);
  }, [selectedChapter, state, musicOn]);

  // Boss attack
  const handleBossAttack = useCallback(() => {
    if (!selectedChapter || bossPhase !== 'battle') return;
    const damage = 20 + Math.floor(Math.random() * 20);
    const newHp = Math.max(0, bossHp - damage);
    setBossHp(newHp);
    playSfx('sword_clash');
    setShakeTrigger((t) => t + 1);
    if (newHp <= 0) {
      setBossPhase('defeat');
      // Play defeat dialogue
      const boss = selectedChapter.boss;
      narrate(boss.defeatDialogue[0]?.text ?? '', 'narrator', 'neutral');
      playSfx('success');
      setTimeout(() => {
        defeatStoryBoss(boss.id);
        if (boss.rewardTitle) {
          unlockStoryAchievement(boss.rewardTitle);
        }
        if (boss.rewardLore) {
          unlockLore(boss.rewardLore);
        }
        setRewardData({
          xp: boss.xpReward,
          coins: boss.coinReward,
          title: boss.rewardTitle,
          lore: boss.rewardLore,
        });
        // Add XP and coins
        completeStoryMission(`boss_${boss.id}`, { xp: boss.xpReward, coins: boss.coinReward });
        triggerConfetti(80);
        playSfx('level_up');
        setView('reward');
        if (musicOn) playMusic('victory');
      }, 3000);
    }
  }, [selectedChapter, bossHp, bossPhase, defeatStoryBoss, unlockStoryAchievement, unlockLore, completeStoryMission, musicOn]);

  // Claim rewards and advance
  const handleClaimReward = useCallback(() => {
    if (!selectedChapter) return;
    if (selectedChapter.number < getTotalChapters()) {
      if (!state.storyBossDefeated[selectedChapter.boss.id]) {
        toast({ title: 'Boss Not Defeated', message: 'Defeat the chapter boss before advancing.', type: 'info' });
        return;
      }
      advanceStoryChapter();
      setShowChapterTransition(true);
      setTimeout(() => {
        setShowChapterTransition(false);
        setView('map');
        if (musicOn) playMusic('mystery');
      }, 2500);
    } else {
      setView('map');
      toast({ title: 'Story Complete!', message: 'You have completed all chapters. More coming soon!', type: 'info' });
    }
  }, [selectedChapter, state.storyBossDefeated, advanceStoryChapter, musicOn]);

  // Toggle music
  const toggleMusic = useCallback(() => {
    const v = !musicOn;
    setMusicOn(v);
    setMusicEnabled(v);
    if (v) {
      if (view === 'map') playMusic('mystery');
      else if (selectedChapter) playMusic(selectedChapter.musicTheme);
    } else {
      stopMusic();
    }
  }, [musicOn, view, selectedChapter]);

  // Get mission progress
  const getMissionProgress = useCallback((mission: StoryMission): number => {
    switch (mission.type) {
      case 'tasks': {
        const done = Object.values(state.coreCompleted).filter(Boolean).length
          + Object.values(state.customCompleted).filter(Boolean).length;
        return Math.min(mission.target, done);
      }
      case 'workout': return Math.min(mission.target, state.workoutsCompletedToday);
      case 'pray': return state.coreCompleted.pray ? 1 : 0;
      case 'water': return state.coreCompleted.water ? 1 : 0;
      case 'sleep': return state.coreCompleted.sleep ? 1 : 0;
      case 'read_quran': return state.coreCompleted.read_quran ? 1 : 0;
      case 'read_book': return state.coreCompleted.read ? 1 : 0;
      case 'streak': return Math.min(mission.target, state.streak);
      case 'dungeon': return Math.min(mission.target, state.dungeonsCleared);
      case 'discipline_score': {
        const enabled = state.mainTasks.filter((t) => t.enabled);
        const done = enabled.filter((t) => state.coreCompleted[t.id]).length;
        return enabled.length > 0 ? Math.round((done / enabled.length) * 100) : 0;
      }
      default: return 0;
    }
  }, [state]);

  // Chapter transition
  if (showChapterTransition && selectedChapter) {
    const nextChapter = getChapterByNumber(selectedChapter.number);
    return (
      <ChapterTransition
        show={showChapterTransition}
        chapterNumber={Math.min(selectedChapter.number + 1, getTotalChapters())}
        title={nextChapter?.title ?? selectedChapter.title}
        subtitle={nextChapter?.subtitle ?? selectedChapter.subtitle}
        emoji={nextChapter?.emoji ?? selectedChapter.emoji}
      />
    );
  }

  // ===== WORLD MAP VIEW =====
  if (view === 'map') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="section-title">The Broken Reality</h1>
            <p className="text-sm text-ink-300 mt-1">Restore the world by restoring yourself</p>
          </div>
          <button onClick={toggleMusic} className="btn-ghost btn-sheen text-sm flex items-center gap-2">
            {musicOn ? <Music size={16} /> : <VolumeX size={16} />}
            {musicOn ? 'Music On' : 'Music Off'}
          </button>
        </div>

        {/* Current Progress */}
        <div className="card-premium p-5 page-enter">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-ember-500/15 flex items-center justify-center">
              <BookOpen size={20} className="text-ember-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-ink-100">Chapter {currentChapterNum + 1} of {getTotalChapters()}</p>
              <p className="text-xs text-ink-300">
                {currentChapter ? currentChapter.title : 'The Awakening'}
              </p>
            </div>
          </div>
          <div className="h-2 bg-ink-950 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-ember-500 to-gold-500 rounded-full transition-all duration-700"
              style={{ width: `${((currentChapterNum + 1) / getTotalChapters()) * 100}%` }}
            />
          </div>
        </div>

        {/* World Map */}
        <div className="card-premium p-4 md:p-6 page-enter" style={{ animationDelay: '0.05s' }}>
          <h2 className="section-title mb-4 flex items-center gap-2">
            <MapIcon size={18} className="text-ember-400" /> World Map
          </h2>
          <div className="relative w-full" style={{ aspectRatio: '2 / 1', minHeight: '300px' }}>
            {/* Map background */}
            <div
              className="absolute inset-0 rounded-xl overflow-hidden"
              style={{
                background: 'radial-gradient(ellipse at center, #1a1a2e 0%, #0a0a1a 100%)',
                border: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              {/* Grid overlay */}
              <div
                className="absolute inset-0 opacity-5"
                style={{
                  backgroundImage: 'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)',
                  backgroundSize: '40px 40px',
                }}
              />
              {/* Fog of war */}
              <div className="absolute inset-0 bg-black/40" style={{
                maskImage: 'radial-gradient(ellipse at 50% 50%, transparent 20%, black 60%)',
                WebkitMaskImage: 'radial-gradient(ellipse at 50% 50%, transparent 20%, black 60%)',
              }} />

              {/* Chapter nodes */}
              {ALL_CHAPTERS.map((ch, i) => {
                const isUnlocked = ch.number <= currentChapterNum + 1;
                const isCompleted = ch.number < currentChapterNum + 1;
                const isCurrent = ch.number === currentChapterNum + 1;
                const isBossDefeated = state.storyBossDefeated[ch.boss.id];

                return (
                  <button
                    key={ch.id}
                    onClick={() => isUnlocked ? handleStartChapter(ch) : playSfx('click')}
                    className="absolute group"
                    style={{
                      left: `${ch.region.x}%`,
                      top: `${ch.region.y}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                    disabled={!isUnlocked}
                  >
                    {/* Connection line to next */}
                    {i < ALL_CHAPTERS.length - 1 && (
                      <svg className="absolute inset-0 pointer-events-none" style={{ width: '200px', height: '200px', left: '-100px', top: '-100px' }}>
                        <line
                          x1="100" y1="100"
                          x2={100 + (ALL_CHAPTERS[i + 1].region.x - ch.region.x) * 3}
                          y2={100 + (ALL_CHAPTERS[i + 1].region.y - ch.region.y) * 3}
                          stroke={isCompleted ? '#ff7a18' : 'rgba(255,255,255,0.1)'}
                          strokeWidth="2"
                          strokeDasharray={isCompleted ? '0' : '4 4'}
                        />
                      </svg>
                    )}

                    {/* Node */}
                    <motion.div
                      whileHover={isUnlocked ? { scale: 1.15 } : {}}
                      className={`relative w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center text-xl md:text-2xl transition-all ${
                        !isUnlocked
                          ? 'bg-ink-900 border-2 border-white/5 opacity-40'
                          : isCurrent
                          ? 'bg-gradient-to-br from-ember-500/30 to-gold-500/30 border-2 border-ember-500/60'
                          : isCompleted
                          ? 'bg-emerald2-500/15 border-2 border-emerald2-500/40'
                          : 'bg-ink-800 border-2 border-white/10'
                      }`}
                      style={isCurrent ? { boxShadow: '0 0 20px rgba(255,122,24,0.4)' } : {}}
                    >
                      {isUnlocked ? ch.emoji : <Lock size={18} className="text-ink-500" />}
                      {isBossDefeated && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald2-500 rounded-full flex items-center justify-center">
                          <CheckCircle2 size={12} className="text-white" />
                        </div>
                      )}
                      {isCurrent && (
                        <div className="absolute inset-0 rounded-full border-2 border-ember-400 animate-ping" />
                      )}
                    </motion.div>

                    {/* Label */}
                    <div className={`absolute top-full mt-1 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-medium ${
                      isCurrent ? 'text-ember-300' : isCompleted ? 'text-emerald2-300' : 'text-ink-400'
                    }`}>
                      {isUnlocked ? `Ch ${ch.number}` : '???'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Chapter List */}
        <div className="space-y-3">
          {ALL_CHAPTERS.map((ch) => {
            const isUnlocked = ch.number <= currentChapterNum + 1;
            const isCompleted = ch.number < currentChapterNum + 1;
            const isCurrent = ch.number === currentChapterNum + 1;
            const missionsDone = ch.missions.filter((m) => state.storyCompletedMissions[m.id]).length;
            const bossDefeated = state.storyBossDefeated[ch.boss.id];

            return (
              <button
                key={ch.id}
                onClick={() => isUnlocked ? handleStartChapter(ch) : playSfx('click')}
                disabled={!isUnlocked}
                className={`card-premium p-4 w-full text-left transition-all page-enter ${
                  isCurrent ? 'border-ember-500/40' : ''
                } ${!isUnlocked ? 'opacity-40 cursor-not-allowed' : 'hover:border-white/20'}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${
                    isCompleted ? 'bg-emerald2-500/15' : isCurrent ? 'bg-ember-500/15' : 'bg-ink-900'
                  }`}>
                    {isUnlocked ? ch.emoji : <Lock size={20} className="text-ink-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-ink-400 font-medium">Chapter {ch.number}</span>
                      {isCurrent && <span className="chip bg-ember-500/20 text-ember-300 text-xs">Current</span>}
                      {bossDefeated && <span className="chip bg-emerald2-500/15 text-emerald2-300 text-xs">Boss Defeated</span>}
                    </div>
                    <h3 className={`font-bold text-sm md:text-base ${isUnlocked ? 'text-ink-100' : 'text-ink-500'}`}>
                      {isUnlocked ? ch.title : '???'}
                    </h3>
                    <p className="text-xs text-ink-300 mt-0.5 line-clamp-1">
                      {isUnlocked ? ch.subtitle : 'Locked — complete the previous chapter'}
                    </p>
                    {isUnlocked && (
                      <div className="flex items-center gap-3 mt-2 text-xs text-ink-400">
                        <span>{missionsDone}/{ch.missions.length} missions</span>
                        <span>·</span>
                        <span>{bossDefeated ? 'Boss Defeated' : 'Boss Available'}</span>
                      </div>
                    )}
                  </div>
                  {isUnlocked && <ChevronRight size={20} className="text-ink-400 flex-shrink-0" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ===== CUTSCENE VIEW =====
  if (view === 'cutscene' && cutsceneChapter) {
    return (
      <div className="space-y-4">
        <CutscenePlayer
          lines={cutsceneLines}
          onComplete={handleCutsceneComplete}
          bgGradient={cutsceneChapter.bgGradient}
          chapterEmoji={cutsceneChapter.emoji}
          chapterTitle={cutsceneType === 'intro' ? cutsceneChapter.title : undefined}
        />
      </div>
    );
  }

  // ===== MISSIONS VIEW =====
  if (view === 'missions' && selectedChapter) {
    const missions = selectedChapter.missions;
    const allMissionsDone = missions.every((m) => state.storyCompletedMissions[m.id]);
    const bossDefeated = state.storyBossDefeated[selectedChapter.boss.id];

    return (
      <div className="space-y-6">
        {/* Chapter header */}
        <div className="card-premium p-5 page-enter">
          <div className="flex items-center gap-4">
            <div className="text-4xl">{selectedChapter.emoji}</div>
            <div>
              <p className="text-xs text-ink-400 uppercase tracking-wider">Chapter {selectedChapter.number}</p>
              <h1 className="font-display text-2xl font-bold text-ink-100">{selectedChapter.title}</h1>
              <p className="text-sm text-ink-300 mt-1">{selectedChapter.description}</p>
            </div>
          </div>
          {/* Progress */}
          <div className="mt-4 flex items-center gap-3">
            <div className="flex-1 h-2 bg-ink-950 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-ember-500 to-gold-500 rounded-full transition-all duration-500"
                style={{ width: `${(missions.filter((m) => state.storyCompletedMissions[m.id]).length / missions.length) * 100}%` }}
              />
            </div>
            <span className="text-xs text-ink-300 font-medium">
              {missions.filter((m) => state.storyCompletedMissions[m.id]).length}/{missions.length}
            </span>
          </div>
        </div>

        {/* Missions list */}
        <div className="space-y-3">
          {missions.map((mission, i) => {
            const isDone = state.storyCompletedMissions[mission.id];
            const progress = getMissionProgress(mission);
            const pct = Math.min(100, (progress / mission.target) * 100);
            const isLocked = i > 0 && !state.storyCompletedMissions[missions[i - 1].id] && !isDone;

            return (
              <button
                key={mission.id}
                onClick={() => !isLocked ? handleMissionClick(mission) : playSfx('click')}
                disabled={isLocked}
                className={`card-premium p-4 w-full text-left transition-all page-enter ${
                  isDone ? 'border-emerald2-500/30' : isLocked ? 'opacity-40 cursor-not-allowed' : 'hover:border-white/20'
                }`}
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    isDone ? 'bg-emerald2-500/15' : isLocked ? 'bg-ink-900' : 'bg-ember-500/10'
                  }`}>
                    {isDone ? <CheckCircle2 size={20} className="text-emerald2-400" /> : isLocked ? <Lock size={16} className="text-ink-500" /> : <span className="text-sm font-bold text-ember-400">{i + 1}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-bold text-sm ${isDone ? 'text-emerald2-300' : 'text-ink-100'}`}>
                      {mission.title}
                    </h3>
                    <p className="text-xs text-ink-300 mt-0.5">{mission.description}</p>
                    {/* Progress bar */}
                    {!isDone && !isLocked && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs text-ink-400 mb-1">
                          <span>{getMissionTypeLabel(mission.type)}</span>
                          <span>{progress}/{mission.target}</span>
                        </div>
                        <div className="h-1.5 bg-ink-950 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-ember-500 to-gold-500 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )}
                    {/* Rewards */}
                    <div className="flex items-center gap-3 mt-2 text-xs">
                      <span className="flex items-center gap-1 text-ember-400">
                        <Zap size={12} /> {mission.xpReward}
                      </span>
                      <span className="flex items-center gap-1 text-gold-400">
                        <Coins size={12} /> {mission.coinReward}
                      </span>
                    </div>
                  </div>
                  {!isLocked && <ChevronRight size={18} className="text-ink-400 flex-shrink-0 mt-1" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Boss button */}
        <div className="card-premium p-5 page-enter" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl flex-shrink-0 ${
              bossDefeated ? 'bg-emerald2-500/15' : allMissionsDone ? 'bg-danger-500/15' : 'bg-ink-900'
            }`}>
              {selectedChapter.boss.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-ink-400 uppercase tracking-wider">Chapter Boss</p>
              <h3 className="font-bold text-base text-ink-100">{selectedChapter.boss.name}</h3>
              <p className="text-xs text-ink-300 mt-0.5">{selectedChapter.boss.title}</p>
              {bossDefeated ? (
                <div className="flex items-center gap-2 mt-2 text-xs text-emerald2-400">
                  <CheckCircle2 size={14} /> Defeated
                </div>
              ) : allMissionsDone ? (
                <button onClick={handleStartBoss} className="btn-primary text-sm mt-2 flex items-center gap-2">
                  <Swords size={16} /> Face the Boss
                </button>
              ) : (
                <div className="flex items-center gap-2 mt-2 text-xs text-ink-400">
                  <Lock size={14} /> Complete all missions to unlock
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Back to map */}
        <button onClick={() => { setView('map'); if (musicOn) playMusic('mystery'); }} className="btn-ghost btn-sheen w-full text-sm">
          Back to World Map
        </button>
      </div>
    );
  }

  // ===== BOSS BATTLE VIEW =====
  if (view === 'boss' && selectedChapter) {
    const boss = selectedChapter.boss;
    const hpPct = (bossHp / boss.hp) * 100;
    const currentDialogue = bossPhase === 'defeat'
      ? boss.defeatDialogue[Math.min(bossDialogueIndex, boss.defeatDialogue.length - 1)]
      : boss.dialogue[Math.min(bossDialogueIndex, boss.dialogue.length - 1)];

    return (
      <ScreenShake trigger={shakeTrigger} intensity={12}>
        <div className="space-y-6">
          {/* Boss arena */}
          <div
            className="relative rounded-2xl overflow-hidden border border-danger-500/20 min-h-[400px]"
            style={{ background: selectedChapter.bgGradient }}
          >
            <ParticleField count={25} color="#dc2626" type="embers" />

            {/* Boss figure */}
            <div className="relative h-full flex flex-col items-center justify-center p-6 min-h-[400px]">
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', duration: 0.8 }}
                className="text-7xl md:text-8xl mb-4"
                style={{ filter: 'drop-shadow(0 0 30px rgba(220,38,38,0.5))' }}
              >
                {boss.emoji}
              </motion.div>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-danger-300 mb-1">{boss.name}</h2>
              <p className="text-sm text-ink-300 italic mb-6">{boss.title}</p>

              {/* HP Bar */}
              <div className="w-full max-w-md">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-danger-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    <Heart size={12} /> Boss HP
                  </span>
                  <span className="text-xs text-ink-300 tabular-nums">{bossHp}/{boss.hp}</span>
                </div>
                <div className="h-4 bg-ink-950 rounded-full overflow-hidden border border-danger-500/20">
                  <motion.div
                    animate={{ width: `${hpPct}%` }}
                    transition={{ duration: 0.3 }}
                    className="h-full boss-hp rounded-full"
                  />
                </div>
              </div>

              {/* Dialogue */}
              {bossPhase !== 'battle' && (
                <motion.div
                  key={bossDialogueIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 w-full max-w-2xl"
                >
                  <div className="p-4 rounded-xl bg-ink-950/80 backdrop-blur-md border border-danger-500/20">
                    <p className="text-sm md:text-base text-ink-100 leading-relaxed text-center italic">
                      "{currentDialogue?.text ?? ''}"
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Attack button */}
              {bossPhase === 'battle' && (
                <motion.button
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleBossAttack}
                  className="btn-primary mt-6 text-lg px-8 py-3 flex items-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #dc2626, #991b1b)' }}
                >
                  <Swords size={20} /> Attack!
                </motion.button>
              )}

              {/* Start battle */}
              {bossPhase === 'intro' && (
                <button
                  onClick={() => {
                    setBossPhase('battle');
                    setBossDialogueIndex(0);
                    playSfx('boss_roar');
                    setShakeTrigger((t) => t + 1);
                  }}
                  className="btn-primary mt-6 flex items-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #dc2626, #991b1b)' }}
                >
                  <Skull size={18} /> Begin Battle
                </button>
              )}

              {/* Defeat */}
              {bossPhase === 'defeat' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-6 text-center"
                >
                  <p className="text-2xl font-display font-bold text-gold-400 mb-2">VICTORY</p>
                  <p className="text-sm text-ink-300">The boss has been defeated...</p>
                </motion.div>
              )}
            </div>
          </div>

          {/* Back */}
          {bossPhase !== 'defeat' && (
            <button onClick={() => { setView('missions'); if (musicOn) playMusic(selectedChapter.musicTheme); }} className="btn-ghost btn-sheen w-full text-sm">
              Retreat to Missions
            </button>
          )}
        </div>
      </ScreenShake>
    );
  }

  // ===== REWARD VIEW =====
  if (view === 'reward' && rewardData && selectedChapter) {
    return (
      <div className="space-y-6">
        <FadeTransition show={true}>
          <div className="card-premium p-8 text-center page-enter">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', duration: 0.8 }}
              className="text-6xl mb-4"
            >
              {selectedChapter.boss.emoji}
            </motion.div>
            <h2 className="font-display text-3xl font-bold text-gold-400 mb-2">Chapter Complete!</h2>
            <p className="text-sm text-ink-300 mb-6">You have defeated {selectedChapter.boss.name}</p>

            {/* Rewards */}
            <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto mb-6">
              <div className="card p-4">
                <Zap size={24} className="text-ember-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-ember-300">{rewardData.xp.toLocaleString()}</p>
                <p className="text-xs text-ink-300">XP Earned</p>
              </div>
              <div className="card p-4">
                <Coins size={24} className="text-gold-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gold-300">{rewardData.coins.toLocaleString()}</p>
                <p className="text-xs text-ink-300">Coins Earned</p>
              </div>
            </div>

            {/* Title reward */}
            {rewardData.title && (
              <div className="card p-4 mb-4 max-w-sm mx-auto">
                <Star size={20} className="text-gold-400 mx-auto mb-2" />
                <p className="text-sm font-bold text-gold-300">New Title: {rewardData.title}</p>
              </div>
            )}

            {/* Lore reward */}
            {rewardData.lore && (
              <div className="card p-4 mb-6 max-w-sm mx-auto">
                <BookOpen size={20} className="text-frost-400 mx-auto mb-2" />
                <p className="text-sm font-bold text-frost-300">Lore Unlocked</p>
              </div>
            )}

            <button onClick={handleClaimReward} className="btn-primary text-sm flex items-center gap-2 mx-auto">
              <Sparkles size={16} /> Claim Rewards & Continue
            </button>
          </div>
        </FadeTransition>
      </div>
    );
  }

  return null;
}

// Helper functions
function isChapterUnlocked(chapter: StoryChapter, state: { storyChapter: number }): boolean {
  return chapter.number <= state.storyChapter + 1;
}

function getChapterByNumber(num: number): StoryChapter | undefined {
  return ALL_CHAPTERS.find((c) => c.number === num + 1);
}

function getMissionTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    workout: 'Workout',
    pray: 'Prayer',
    water: 'Water',
    sleep: 'Sleep',
    read_quran: 'Read Quran',
    read_book: 'Read Book',
    streak: 'Day Streak',
    dungeon: 'Dungeon',
    tasks: 'Tasks',
    discipline_score: 'Discipline Score',
  };
  return labels[type] ?? type;
}
