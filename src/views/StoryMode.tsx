import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, CheckCircle2, RotateCcw, BookOpen, Sparkles, Coins, Zap, Lock } from 'lucide-react';
import { useStore } from '../store/useStore';
import { toast } from '../components/ui/Toast';
import { triggerConfetti } from '../components/ui/Confetti';
import {
  STORY_SCENES, getTotalScenes, getShadowEmoji,
} from '../data/storyScenes';

export default function StoryMode() {
  const { state, advanceStoryScene, claimStorySceneReward, checkAndAdvanceStoryScene } = useStore();
  const [dialogueIndex, setDialogueIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showReward, setShowReward] = useState(false);
  const [showChapterTransition, setShowChapterTransition] = useState(false);

  const currentScene = STORY_SCENES[Math.min(state.storySceneIndex, STORY_SCENES.length - 1)];
  const isLastScene = state.storySceneIndex >= STORY_SCENES.length - 1;
  const rewardClaimed = !!state.storySceneRewardsClaimed[currentScene.id];
  const objectiveCompleted = !!state.storySceneObjectivesCompleted[currentScene.id];
  const hasObjective = !!currentScene.objective;

  // Auto-detect objective completion whenever state changes
  useEffect(() => {
    checkAndAdvanceStoryScene();
  }, [state.coreCompleted, state.dungeonsCleared, state.dungeonClearedToday, state.questCompleted, state.achievements, state.storySceneIndex, checkAndAdvanceStoryScene]);

  // Reset dialogue when scene changes
  useEffect(() => {
    setDialogueIndex(0);
    setDisplayedText('');
    setShowReward(false);
  }, [state.storySceneIndex]);

  // Chapter transition animation when chapter changes
  const prevChapter = useMemo(() => {
    if (state.storySceneIndex === 0) return currentScene.chapter;
    return STORY_SCENES[state.storySceneIndex - 1].chapter;
  }, [state.storySceneIndex]);

  useEffect(() => {
    if (currentScene.chapter !== prevChapter) {
      setShowChapterTransition(true);
      const timer = setTimeout(() => setShowChapterTransition(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [currentScene.chapter, prevChapter]);

  // Typewriter effect
  useEffect(() => {
    if (!currentScene || dialogueIndex >= currentScene.dialogue.length) return;
    const line = currentScene.dialogue[dialogueIndex];
    setDisplayedText('');
    setIsTyping(true);
    let i = 0;
    const interval = setInterval(() => {
      if (i < line.text.length) {
        setDisplayedText(line.text.slice(0, i + 1));
        i++;
      } else {
        setIsTyping(false);
        clearInterval(interval);
      }
    }, 25);
    return () => clearInterval(interval);
  }, [dialogueIndex, currentScene]);

  const handleNextDialogue = useCallback(() => {
    if (isTyping) {
      // Skip typewriter — show full text immediately
      const line = currentScene.dialogue[dialogueIndex];
      setDisplayedText(line.text);
      setIsTyping(false);
      return;
    }

    if (dialogueIndex < currentScene.dialogue.length - 1) {
      setDialogueIndex(dialogueIndex + 1);
    } else {
      // Dialogue finished — show reward if available
      if (currentScene.reward && !rewardClaimed) {
        setShowReward(true);
      }
    }
  }, [isTyping, dialogueIndex, currentScene, rewardClaimed]);

  const handleClaimReward = useCallback(() => {
    if (!currentScene.reward || rewardClaimed) return;
    claimStorySceneReward(currentScene.id);
    const r = currentScene.reward;
    toast({
      title: 'Reward Earned!',
      message: r.label,
      type: 'reward',
      icon: r.type === 'xp' ? '⚡' : '💰',
    });
    triggerConfetti(30);
  }, [currentScene, rewardClaimed, claimStorySceneReward]);

  const handleAdvance = useCallback(() => {
    if (isLastScene) {
      toast({ title: 'Story Complete!', message: 'You have reached the end of the current story. More chapters coming soon!', type: 'info' });
      return;
    }
    advanceStoryScene();
  }, [isLastScene, advanceStoryScene]);

  const handleRestart = useCallback(() => {
    setDialogueIndex(0);
    setShowReward(false);
  }, []);

  const currentLine = currentScene.dialogue[dialogueIndex];
  const dialogueComplete = dialogueIndex >= currentScene.dialogue.length - 1 && !isTyping;
  const canAdvance = dialogueComplete && (!hasObjective || objectiveCompleted) && (!currentScene.reward || rewardClaimed);

  // Auto-advance when objective is completed and reward is claimed (or no reward)
  const prevObjectiveCompleted = useRef(objectiveCompleted);
  useEffect(() => {
    if (objectiveCompleted && !prevObjectiveCompleted.current && dialogueComplete && (rewardClaimed || !currentScene.reward) && !isLastScene) {
      const timer = setTimeout(() => advanceStoryScene(), 800);
      return () => clearTimeout(timer);
    }
    prevObjectiveCompleted.current = objectiveCompleted;
  }, [objectiveCompleted, dialogueComplete, rewardClaimed, currentScene, isLastScene, advanceStoryScene]);
  const progress = ((state.storySceneIndex + 1) / getTotalScenes()) * 100;

  return (
    <div className="min-h-[calc(100vh-120px)] flex flex-col">
      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-purple-300 font-medium uppercase tracking-wider">
            Scene {state.storySceneIndex + 1} / {getTotalScenes()}
          </span>
          <span className="text-xs text-purple-300/60">{Math.round(progress)}% Complete</span>
        </div>
        <div className="h-1.5 bg-ink-950/60 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #7c3aed, #a855f7, #06b6d4)', boxShadow: '0 0 8px rgba(168,85,247,0.5)' }}
          />
        </div>
      </div>

      {/* Scene viewport */}
      <div
        className="relative flex-1 rounded-2xl border border-purple-500/20 overflow-hidden"
        style={{ background: currentScene.bgGradient, minHeight: '400px' }}
      >
        {/* Ambient particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 15 }, (_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-purple-300/20"
              style={{
                left: `${(i * 37) % 100}%`,
                top: `${(i * 53) % 100}%`,
                width: `${2 + (i % 3)}px`,
                height: `${2 + (i % 3)}px`,
                animation: `floatParticle ${4 + (i % 4)}s ease-in-out infinite`,
                animationDelay: `${i * 0.3}s`,
              }}
            />
          ))}
        </div>

        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(rgba(168,85,247,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.5) 1px, transparent 1px)',
            backgroundSize: '30px 30px',
          }}
        />

        {/* Chapter transition overlay */}
        <AnimatePresence>
          {showChapterTransition && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.5, opacity: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="text-center"
              >
                <p className="text-xs uppercase tracking-[0.4em] text-purple-400 mb-2">Chapter</p>
                <p className="font-display text-4xl font-bold text-white" style={{ textShadow: '0 0 30px rgba(168,85,247,0.6)' }}>
                  {currentScene.chapter}
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scene content */}
        <div className="relative h-full flex flex-col items-center justify-center p-6 md:p-10">
          {/* Scene emoji */}
          <motion.div
            key={currentScene.id + '-emoji'}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', duration: 0.6 }}
            className="text-6xl md:text-7xl mb-4"
            style={{ filter: 'drop-shadow(0 0 20px rgba(168,85,247,0.4))' }}
          >
            {currentScene.emoji}
          </motion.div>

          {/* Scene title */}
          <motion.h2
            key={currentScene.id + '-title'}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="font-display text-xl md:text-2xl font-bold text-purple-100 mb-6 text-center"
            style={{ textShadow: '0 0 15px rgba(168,85,247,0.3)' }}
          >
            {currentScene.title}
          </motion.h2>

          {/* Dialogue box */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentScene.id + '-' + dialogueIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-2xl"
            >
              <DialogueBox line={currentLine} displayedText={displayedText} isTyping={isTyping} />
            </motion.div>
          </AnimatePresence>

          {/* Action area */}
          <div className="mt-6 w-full max-w-2xl">
            {/* Reward claim */}
            {showReward && currentScene.reward && !rewardClaimed && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-3"
              >
                <div className="px-5 py-3 rounded-xl border border-gold-500/30 bg-gold-500/10 flex items-center gap-3">
                  {currentScene.reward.type === 'xp' ? (
                    <Zap size={20} className="text-ember-400" />
                  ) : (
                    <Coins size={20} className="text-gold-400" />
                  )}
                  <span className="text-sm font-bold text-gold-300">{currentScene.reward.label}</span>
                </div>
                <button onClick={handleClaimReward} className="btn-primary text-sm flex items-center gap-2">
                  <Sparkles size={16} /> Claim Reward
                </button>
              </motion.div>
            )}

            {/* Reward already claimed */}
            {rewardClaimed && dialogueComplete && (
              <div className="flex items-center justify-center gap-2 text-emerald2-400 text-sm">
                <CheckCircle2 size={16} /> Reward Claimed
              </div>
            )}

            {/* Objective locked — cannot advance yet */}
            {dialogueComplete && hasObjective && !objectiveCompleted && (rewardClaimed || !currentScene.reward) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-2"
              >
                <div className="flex items-center gap-2 text-amber-400/80 text-sm">
                  <Lock size={14} />
                  <span>Complete the objective to continue</span>
                </div>
              </motion.div>
            )}

            {/* Next / Advance buttons — only when all conditions met */}
            {canAdvance && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center gap-3"
              >
                {!isLastScene ? (
                  <button onClick={handleAdvance} className="btn-primary text-sm flex items-center gap-2">
                    Continue <ChevronRight size={16} />
                  </button>
                ) : (
                  <div className="text-center">
                    <p className="text-sm text-purple-300 mb-2">You have completed the current story!</p>
                    <button onClick={handleRestart} className="btn-ghost text-sm flex items-center gap-2 mx-auto">
                      <RotateCcw size={14} /> Replay Scene
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* Tap to advance dialogue */}
            {!dialogueComplete && (
              <button
                onClick={handleNextDialogue}
                className="w-full text-center text-xs text-purple-300/50 hover:text-purple-300 transition py-2"
              >
                {isTyping ? 'Tap to skip' : 'Tap to continue'}
                <ChevronRight size={12} className="inline ml-1 animate-pulse" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Objective hint — shows Active or Completed state */}
      {currentScene.objective && dialogueComplete && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mt-4 p-3 rounded-xl border flex items-center gap-3 ${
            objectiveCompleted
              ? 'border-emerald2-500/30 bg-emerald2-500/5'
              : 'border-purple-500/20 bg-purple-500/5'
          }`}
        >
          {objectiveCompleted ? (
            <CheckCircle2 size={16} className="text-emerald2-400 flex-shrink-0" />
          ) : (
            <BookOpen size={16} className="text-purple-400 flex-shrink-0" />
          )}
          <div>
            <p className={`text-xs font-semibold ${objectiveCompleted ? 'text-emerald2-300' : 'text-purple-300'}`}>
              {currentScene.objective.label}
              {objectiveCompleted && ' — Complete'}
            </p>
            <p className={`text-xs ${objectiveCompleted ? 'text-emerald2-400/60' : 'text-purple-300/60'}`}>
              {currentScene.objective.hint}
            </p>
          </div>
        </motion.div>
      )}

      {/* Scene map — locked/unlocked indicator */}
      <div className="mt-4 flex items-center justify-center gap-1.5 flex-wrap">
        {STORY_SCENES.map((scene, i) => {
          const isCurrent = i === state.storySceneIndex;
          const isUnlocked = i <= state.storySceneIndex;
          const isCompleted = i < state.storySceneIndex;
          return (
            <div
              key={scene.id}
              className={`w-2 h-2 rounded-full transition-all ${
                isCurrent ? 'w-6 bg-purple-400' : isCompleted ? 'bg-emerald2-400' : isUnlocked ? 'bg-purple-400/40' : 'bg-ink-700'
              }`}
              style={isCurrent ? { boxShadow: '0 0 8px rgba(168,85,247,0.6)' } : undefined}
            />
          );
        })}
      </div>

      <style>{`
        @keyframes floatParticle {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.2; }
          50% { transform: translateY(-30px) scale(1.5); opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}

function DialogueBox({
  line,
  displayedText,
  isTyping,
}: {
  line: { speaker: 'shadow' | 'narrator' | 'system'; text: string; emotion?: string };
  displayedText: string;
  isTyping: boolean;
}) {
  const isShadow = line.speaker === 'shadow';
  const isNarrator = line.speaker === 'narrator';

  if (isNarrator) {
    return (
      <div className="relative p-5 rounded-xl border border-white/10 bg-black/40 backdrop-blur-md">
        <p className="text-sm md:text-base text-ink-200 italic leading-relaxed text-center">
          {displayedText}
          {isTyping && <span className="animate-pulse">|</span>}
        </p>
      </div>
    );
  }

  return (
    <div className="relative p-5 rounded-xl border border-purple-500/30 bg-gradient-to-r from-purple-950/50 to-slate-950/60 backdrop-blur-md">
      <div className="flex items-start gap-3">
        {/* Shadow avatar */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, rgba(168,85,247,0.2), rgba(124,58,237,0.05))',
            border: '1px solid rgba(168,85,247,0.3)',
            boxShadow: '0 0 15px rgba(168,85,247,0.2)',
          }}
        >
          {isShadow ? getShadowEmoji(line.emotion as any) : '⚙️'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-1">
            {isShadow ? 'Shadow' : 'System'}
          </p>
          <p className="text-sm md:text-base text-purple-100 leading-relaxed">
            {displayedText}
            {isTyping && <span className="animate-pulse">|</span>}
          </p>
        </div>
      </div>
    </div>
  );
}
