import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, LockKeyhole, Target, Zap, Eye, Flame, Swords } from 'lucide-react';
import type { StoryMission } from '../../data/story/types';
import { useStore } from '../../store/useStore';
import {
  STORY_MILESTONES,
  addMilestone,
  applyChoice,
  applyMissionEvolution,
  decodeStoryEvolution,
  getShadowReaction,
  mergeEncodedStoryEvolution,
} from '../../data/story/storyEvolution';
import { getShadowAction, getShadowMemory, getShadowMoment } from '../../data/story/shadowAI';

interface StoryObjectivePanelProps {
  mission: StoryMission;
  progress: number;
  complete: boolean;
}

const ACTION_LABELS: Record<ReturnType<typeof getShadowAction>, string> = {
  recover: 'Recover your rhythm',
  complete_tasks: 'Finish today\'s tasks',
  train: 'Train before you return',
  protect_streak: 'Protect your streak',
  seek_truth: 'Keep searching for the truth',
  continue_story: 'Continue the story',
  rest_and_return: 'Rest — then return',
};

export function StoryObjectivePanel({ mission, progress, complete }: StoryObjectivePanelProps) {
  const { state, unlockStoryAchievement, setStoryChoice } = useStore();
  const percent = complete ? 100 : Math.min(100, (progress / Math.max(1, mission.target)) * 100);
  const selectedChoiceId = state.storyChoices[mission.chapterId];
  const evolutionBefore = decodeStoryEvolution(state.storyAchievements, state.storyLoreUnlocked);
  let evolutionAfter = complete ? applyMissionEvolution(evolutionBefore, mission) : evolutionBefore;

  if (complete) {
    evolutionAfter = addMilestone(evolutionAfter, STORY_MILESTONES.firstMission);
    if (mission.type === 'workout') evolutionAfter = addMilestone(evolutionAfter, STORY_MILESTONES.firstWorkout);
    if (mission.id.startsWith('boss_')) evolutionAfter = addMilestone(evolutionAfter, STORY_MILESTONES.firstBoss);
    const text = `${mission.id} ${mission.title} ${mission.description}`.toLowerCase();
    if (/archive|black archive/.test(text)) evolutionAfter = addMilestone(evolutionAfter, STORY_MILESTONES.archiveOpened);
    if (/system.*enemy|enemy.*system|system declared/.test(text)) evolutionAfter = addMilestone(evolutionAfter, STORY_MILESTONES.systemDeclaredEnemy);
    if (/shadow.*truth|truth.*shadow|shadow.*revealed|truth revealed/.test(text)) evolutionAfter = addMilestone(evolutionAfter, STORY_MILESTONES.shadowTruth);
    if (selectedChoiceId) {
      const selectedChoice = mission.choices?.find((choice) => choice.id === selectedChoiceId);
      if (selectedChoice) evolutionAfter = applyChoice(evolutionAfter, selectedChoice);
    }
  }

  useEffect(() => {
    if (!complete) return;
    const encoded = mergeEncodedStoryEvolution(state.storyAchievements, evolutionBefore, evolutionAfter);
    const newTokens = encoded.filter((token) => !state.storyAchievements.includes(token));
    if (newTokens.length > 0) newTokens.forEach((token) => unlockStoryAchievement(token));
  }, [complete, evolutionAfter, evolutionBefore, state.storyAchievements, unlockStoryAchievement]);

  const choose = (choiceId: string) => {
    if (selectedChoiceId) return;
    const choice = mission.choices?.find((item) => item.id === choiceId);
    if (!choice) return;
    setStoryChoice(mission.chapterId, choice.id);
    const before = decodeStoryEvolution(state.storyAchievements, state.storyLoreUnlocked);
    let after = applyChoice(before, choice);
    if (choice.reward?.type === 'lore') after = addMilestone(after, STORY_MILESTONES.shadowTruth);
    if (/final|end|fate|last choice/i.test(`${mission.id} ${choice.label} ${choice.consequence}`)) after = addMilestone(after, STORY_MILESTONES.finalChoice);
    const encoded = mergeEncodedStoryEvolution(state.storyAchievements, before, after);
    encoded.filter((token) => !state.storyAchievements.includes(token)).forEach((token) => unlockStoryAchievement(token));
  };

  const reaction = getShadowReaction(evolutionAfter)[0];
  const shadowMoment = getShadowMoment(state, mission.chapterId ? Number(mission.chapterId.match(/\d+/)?.[0] ?? state.storyChapter + 1) : state.storyChapter + 1, complete);
  const shadowMemory = getShadowMemory(state);
  const shadowAction = getShadowAction(state, state.storyChapter + 1, complete);

  return (
    <div className="space-y-3">
      <motion.div layout className={`relative overflow-hidden rounded-2xl border p-4 backdrop-blur-xl ${complete ? 'border-emerald-400/30 bg-emerald-500/[.07] shadow-[0_0_45px_rgba(16,185,129,.08)]' : 'border-ember-400/20 bg-black/55 shadow-[0_0_45px_rgba(245,158,11,.06)]'}`}>
        <AnimatePresence>{complete && <motion.div initial={{ opacity: 0, scale: .85 }} animate={{ opacity: 1, scale: 1 }} className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_20%_50%,rgba(16,185,129,.16),transparent_35%)]" />}</AnimatePresence>
        <div className="relative flex items-center gap-3">
          <motion.div animate={complete ? { scale: [1, 1.12, 1], rotate: [0, -4, 4, 0] } : { scale: 1 }} transition={{ duration: .5 }} className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${complete ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300' : 'border-ember-400/20 bg-ember-500/10 text-ember-300'}`}>
            {complete ? <Check size={18} /> : <Target size={18} />}
          </motion.div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2"><span className="text-[9px] font-black uppercase tracking-[.28em] text-ink-500">Story Objective</span><span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[8px] font-black uppercase tracking-[.18em] ${complete ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-300' : 'border-amber-400/20 bg-amber-500/10 text-amber-200'}`}>{complete ? <><Check size={10} /> Complete</> : <><LockKeyhole size={9} /> Active</>}</span></div>
            <h3 className="mt-1 truncate font-display text-base font-black text-white">{mission.title}</h3>
            <p className="mt-0.5 text-[11px] leading-5 text-ink-400">{mission.description}</p>
          </div>
          <div className="shrink-0 text-right"><div className={`font-mono text-sm font-black ${complete ? 'text-emerald-300' : 'text-ink-200'}`}>{progress}/{mission.target}</div><div className="mt-0.5 flex items-center justify-end gap-1 text-[8px] font-bold uppercase tracking-wider text-ink-600"><Zap size={9} /> +{mission.xpReward} XP</div></div>
        </div>
        <div className="relative mt-3 h-1.5 overflow-hidden rounded-full bg-white/[.06]"><motion.div className={`h-full rounded-full ${complete ? 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,.45)]' : 'bg-gradient-to-r from-violet-500 to-ember-400'}`} animate={{ width: `${percent}%` }} transition={{ duration: .45, ease: 'easeOut' }} /></div>
        <AnimatePresence mode="wait"><motion.p key={complete ? 'complete' : 'active'} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className={`relative mt-2 text-[9px] font-black uppercase tracking-[.2em] ${complete ? 'text-emerald-300' : 'text-ink-500'}`}>{complete ? 'OBJECTIVE COMPLETE · Continue unlocked' : 'Complete the objective to unlock Continue'}</motion.p></AnimatePresence>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-violet-400/15 bg-violet-500/[.045] p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-[.28em] text-violet-300"><Eye size={11} /> Shadow // {shadowMoment.mode}</div>
            <p className="mt-1 text-sm font-bold leading-6 text-white">{shadowMoment.line}</p>
          </div>
          <div className="shrink-0 rounded-lg border border-white/10 bg-black/20 px-2 py-1 text-[8px] font-black uppercase tracking-wider text-ink-500">Pressure {shadowMoment.pressure}</div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="rounded-xl border border-white/5 bg-black/20 p-2"><div className="flex items-center gap-1 text-[8px] uppercase tracking-wider text-ink-600"><Flame size={9} /> Streak</div><div className="mt-1 font-mono text-xs font-black text-white">{shadowMemory.currentStreak}</div></div>
          <div className="rounded-xl border border-white/5 bg-black/20 p-2"><div className="flex items-center gap-1 text-[8px] uppercase tracking-wider text-ink-600"><Swords size={9} /> Missions</div><div className="mt-1 font-mono text-xs font-black text-white">{shadowMemory.completedMissions}</div></div>
          <div className="rounded-xl border border-white/5 bg-black/20 p-2"><div className="text-[8px] uppercase tracking-wider text-ink-600">Consistency</div><div className="mt-1 font-mono text-xs font-black text-white">{shadowMemory.recentConsistency}%</div></div>
          <div className="rounded-xl border border-white/5 bg-black/20 p-2"><div className="text-[8px] uppercase tracking-wider text-ink-600">Path</div><div className="mt-1 font-mono text-xs font-black uppercase text-white">{shadowMemory.dominantPath}</div></div>
        </div>
        <div className="mt-3 rounded-xl border border-amber-400/10 bg-amber-500/[.04] px-3 py-2 text-[10px] text-amber-100/80"><span className="font-black uppercase tracking-wider text-amber-300">Shadow directive:</span> {ACTION_LABELS[shadowAction]}</div>
      </motion.div>

      {complete && mission.choices && mission.choices.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-amber-400/15 bg-black/35 p-4">
          <div className="text-[8px] font-black uppercase tracking-[.28em] text-amber-300">Choose your path</div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {mission.choices.map((choice) => {
              const selected = selectedChoiceId === choice.id;
              return (
                <button key={choice.id} type="button" onClick={() => choose(choice.id)} disabled={Boolean(selectedChoiceId)} className={`rounded-xl border px-3 py-3 text-left transition ${selected ? 'border-amber-300/40 bg-amber-500/10' : 'border-white/10 bg-white/[.02] hover:border-amber-400/25 hover:bg-amber-500/[.05]'} disabled:cursor-default`}>
                  <div className="text-xs font-black text-white">{choice.label}</div>
                  <div className="mt-1 text-[10px] leading-4 text-ink-500">{choice.consequence}</div>
                </button>
              );
            })}
          </div>
        </motion.div>
      )}

      {complete && reaction && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-violet-400/15 bg-violet-500/[.045] px-4 py-3">
          <div className="text-[8px] font-black uppercase tracking-[.28em] text-violet-300">Shadow · {reaction.emotion}</div>
          <p className="mt-1 text-xs leading-5 text-ink-300">{reaction.text}</p>
        </motion.div>
      )}
    </div>
  );
}
