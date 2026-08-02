import { useState } from 'react';
import { useStore, getQuestProgress } from '../store/useStore';
import type { AppState } from '../store/types';
import { QUESTS, getQuestsByCategory, type QuestCategory, type QuestDifficulty } from '../data/quests';
import { toast } from '../components/ui/Toast';
import { playSound } from '../lib/sound';
import { Check, Star, Trophy, Zap, Coins, Clock, ChevronRight, Sparkles } from 'lucide-react';
import { triggerConfetti } from '../components/ui/Confetti';

const CATEGORIES: QuestCategory[] = ['daily', 'weekly', 'monthly', 'story', 'challenge', 'hidden'];

const CATEGORY_LABELS: Record<QuestCategory, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  story: 'Story',
  challenge: 'Challenge',
  hidden: 'Hidden',
};

const DIFFICULTY_COLORS: Record<QuestDifficulty, { bg: string; border: string; text: string; badge: string }> = {
  easy: { bg: 'bg-emerald2-500/10', border: 'border-emerald2-500/40', text: 'text-emerald2-400', badge: 'bg-emerald2-500/20 text-emerald2-400' },
  medium: { bg: 'bg-frost-500/10', border: 'border-frost-500/40', text: 'text-frost-400', badge: 'bg-frost-500/20 text-frost-400' },
  hard: { bg: 'bg-ember-500/10', border: 'border-ember-500/40', text: 'text-ember-400', badge: 'bg-ember-500/20 text-ember-400' },
  extreme: { bg: 'bg-danger-500/10', border: 'border-danger-500/40', text: 'text-danger-400', badge: 'bg-danger-500/20 text-danger-400' },
  mythic: { bg: 'bg-purple-500/10', border: 'border-purple-500/40', text: 'text-purple-400', badge: 'bg-purple-500/20 text-purple-400' },
};

function getProgressValue(state: any, metric: string): number {
  return getQuestProgress(state as AppState, metric);
}

export function Quests() {
  const { state, claimQuest } = useStore();
  const [activeCategory, setActiveCategory] = useState<QuestCategory>('daily');

  const currentQuests = getQuestsByCategory(activeCategory);
  const unclaimedCompleted = QUESTS.filter(
    (q) => state.questCompleted[q.id] === false && getProgressValue(state, q.metric) >= q.target
  ).length;

  const hasUnclaimedCompleted = unclaimedCompleted > 0;

  const handleClaimQuest = (questId: string) => {
    const quest = QUESTS.find((q) => q.id === questId);
    if (!quest) return;

    const progress = getProgressValue(state, quest.metric);
    if (progress < quest.target) return;

    claimQuest(questId);
    playSound('reward');
    triggerConfetti(40);
    toast({
      title: 'Quest Completed!',
      message: `+${quest.xpReward} XP, +${quest.coinReward} Coins`,
      type: 'reward',
      icon: '🎉',
    });
  };

  const handleClaimAll = () => {
    let claimed = 0;
    QUESTS.forEach((quest) => {
      if (!state.questCompleted[quest.id]) {
        const progress = getProgressValue(state, quest.metric);
        if (progress >= quest.target) {
          claimQuest(quest.id);
          claimed++;
        }
      }
    });
    if (claimed > 0) {
      playSound('rankup');
      triggerConfetti(60);
      toast({
        title: `${claimed} Quests Claimed!`,
        message: 'All completed quests have been rewarded.',
        type: 'reward',
        icon: '✨',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="section-title">Quest Board</h1>
        <p className="text-sm text-ink-300">Complete quests to earn XP, coins, and legendary rewards</p>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-4 flex flex-col items-center justify-center">
          <div className="flex items-center gap-2 mb-1">
            <Zap size={16} className="text-ember-400" />
            <span className="text-xs text-ink-300">Total XP</span>
          </div>
          <p className="font-bold text-lg text-ember-300">{state.xp.toLocaleString()}</p>
        </div>
        <div className="card p-4 flex flex-col items-center justify-center">
          <div className="flex items-center gap-2 mb-1">
            <Coins size={16} className="text-gold-400" />
            <span className="text-xs text-ink-300">Coins</span>
          </div>
          <p className="font-bold text-lg text-gold-300">{state.coins.toLocaleString()}</p>
        </div>
        <div className="card p-4 flex flex-col items-center justify-center">
          <div className="flex items-center gap-2 mb-1">
            <Trophy size={16} className="text-frost-400" />
            <span className="text-xs text-ink-300">Streak</span>
          </div>
          <p className="font-bold text-lg text-frost-300">{state.streak}</p>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="card p-2 flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
              activeCategory === cat
                ? 'bg-ember-500/30 text-ember-300 border border-ember-500/50'
                : 'bg-ink-900/40 text-ink-300 border border-ink-800/40 hover:bg-ink-800/40'
            }`}
          >
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* Claim All Button */}
      {hasUnclaimedCompleted && (
        <button onClick={handleClaimAll} className="btn-primary w-full flex items-center justify-center gap-2">
          <Sparkles size={16} /> Claim All Completed ({unclaimedCompleted})
        </button>
      )}

      {/* Quest Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {currentQuests.map((quest) => {
          const progress = getProgressValue(state, quest.metric);
          const isCompleted = state.questCompleted[quest.id];
          const isReady = progress >= quest.target && !isCompleted;
          const pct = Math.min(100, (progress / quest.target) * 100);
          const colors = DIFFICULTY_COLORS[quest.difficulty];

          return (
            <div
              key={quest.id}
              className={`card p-5 border-2 transition ${colors.border} ${colors.bg} relative overflow-hidden group`}
            >
              {/* Completed overlay */}
              {isCompleted && (
                <div className="absolute inset-0 bg-emerald2-500/20 backdrop-blur-[2px] flex items-center justify-center z-10">
                  <div className="bg-emerald2-500/30 rounded-full p-3 border border-emerald2-500/50">
                    <Check size={28} className="text-emerald2-400" />
                  </div>
                </div>
              )}

              {/* Content */}
              <div className="relative">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-base mb-1 truncate">{quest.name}</h3>
                    <p className="text-xs text-ink-300 line-clamp-2">{quest.description}</p>
                  </div>
                  <span className={`chip whitespace-nowrap text-xs font-semibold ${colors.badge}`}>
                    {quest.difficulty.charAt(0).toUpperCase() + quest.difficulty.slice(1)}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-ink-300 font-medium">Progress</span>
                    <span className="text-xs font-bold text-ink-200">
                      {Math.floor(progress)} / {quest.target}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-ink-900/60 rounded-full overflow-hidden border border-ink-800/40">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isCompleted
                          ? 'bg-emerald2-500'
                          : quest.difficulty === 'mythic'
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                          : quest.difficulty === 'extreme'
                          ? 'bg-danger-500'
                          : quest.difficulty === 'hard'
                          ? 'bg-ember-500'
                          : quest.difficulty === 'medium'
                          ? 'bg-frost-500'
                          : 'bg-emerald2-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {/* Rewards & Time */}
                <div className="flex items-center gap-3 mb-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Zap size={14} className="text-ember-400" />
                    <span className="text-ink-200 font-semibold">{quest.xpReward}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Coins size={14} className="text-gold-400" />
                    <span className="text-ink-200 font-semibold">{quest.coinReward}</span>
                  </div>
                  <div className="flex items-center gap-1 ml-auto">
                    <Clock size={14} className="text-frost-400" />
                    <span className="text-ink-300 text-xs">{quest.estimatedTime}</span>
                  </div>
                </div>

                {/* Action Button */}
                {isCompleted ? (
                  <div className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-emerald2-500/15 border border-emerald2-500/30">
                    <Check size={16} className="text-emerald2-400" />
                    <span className="text-xs font-semibold text-emerald2-300">Completed</span>
                  </div>
                ) : isReady ? (
                  <button
                    onClick={() => handleClaimQuest(quest.id)}
                    className="btn-primary w-full flex items-center justify-center gap-2 text-sm"
                  >
                    <Star size={14} /> Claim Reward
                  </button>
                ) : (
                  <button disabled className="btn-ghost w-full opacity-50 cursor-not-allowed text-sm">
                    <ChevronRight size={14} /> In Progress
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {currentQuests.length === 0 && (
        <div className="card p-12 text-center">
          <Trophy size={32} className="mx-auto mb-4 text-ink-500" />
          <p className="text-ink-300 font-medium">No quests available in this category</p>
          <p className="text-xs text-ink-400 mt-1">Complete quests in other categories to unlock new ones</p>
        </div>
      )}
    </div>
  );
}
