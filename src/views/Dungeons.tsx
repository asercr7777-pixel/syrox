import { useState } from 'react';
import { useStore } from '../store/useStore';
import { RANKS, getRankByXp, getRankIndex } from '../data/ranks';
import { DUNGEONS, type Dungeon, type DungeonReward } from '../data/dungeons';
import { RARITY_META, type Rarity } from '../data/collections';
import { Modal } from '../components/ui/Modal';
import { toast } from '../components/ui/Toast';
import { triggerConfetti } from '../components/ui/Confetti';
import { playSound } from '../lib/sound';
import { Swords, Lock, Check, Zap, Coins, Sparkles, Trophy, Award, Shield, Dumbbell, X } from 'lucide-react';

const RARITY_COLORS: Record<string, string> = {
  common: '#9ca3af',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#f59e0b',
  mythic: '#ef4444',
  secret: '#fbbf24',
};

export function Dungeons() {
  const { state, clearDungeon } = useStore();
  const [selectedDungeon, setSelectedDungeon] = useState<Dungeon | null>(null);
  const [activeDungeon, setActiveDungeon] = useState<Dungeon | null>(null);
  const [completedExercise, setCompletedExercise] = useState<Record<number, boolean>>({});
  const [showReward, setShowReward] = useState<Dungeon | null>(null);
  const [rewardDrops, setRewardDrops] = useState<any[]>([]);

  const currentRank = getRankByXp(state.xp);
  const currentRankIndex = getRankIndex(currentRank.id);
  const dungeonCompletedToday = state.dungeonClearedToday;

  const rankIds = RANKS.map((r) => r.id);

  const handleEnterDungeon = (dungeon: Dungeon) => {
    if (dungeonCompletedToday) {
      toast({ title: 'Already Cleared', message: 'You have already cleared a dungeon today. Return after midnight.', type: 'info' });
      return;
    }
    setSelectedDungeon(null);
    setActiveDungeon(dungeon);
    setCompletedExercise({});
    playSound('whoosh');
  };

  const handleCompleteExercise = (index: number) => {
    setCompletedExercise((prev) => {
      const next = { ...prev, [index]: true };
      playSound('task');
      return next;
    });
  };

  const handleCompleteDungeon = () => {
    if (!activeDungeon) return;
    const drops = clearDungeon(activeDungeon.id) ?? [];
    setRewardDrops(drops);
    setShowReward(activeDungeon);
    setActiveDungeon(null);
    triggerConfetti(80);
  };

  const allExercisesDone = activeDungeon && activeDungeon.exercises.length > 0 && activeDungeon.exercises.every((_, i) => completedExercise[i]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card-premium p-6 md:p-8 relative overflow-hidden page-enter">
        <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ background: `radial-gradient(circle at 30% 0%, ${currentRank.glow}, transparent 60%)` }} />
        <div className="relative flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: `${currentRank.color}20`, border: `1px solid ${currentRank.color}40` }}>
            <Swords size={24} style={{ color: currentRank.color }} />
          </div>
          <div>
            <h1 className="section-title">Daily Dungeon</h1>
            <p className="text-sm text-ink-300 mt-1">
              {dungeonCompletedToday
                ? "Today's dungeon has been cleared. The gate resets at midnight."
                : `Your rank's dungeon awaits, ${currentRank.name} hunter.`}
            </p>
          </div>
        </div>
      </div>

      {/* Dungeon grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {DUNGEONS.map((dungeon, idx) => {
          const rankIdx = rankIds.indexOf(dungeon.rankId);
          const isUnlocked = rankIdx <= currentRankIndex;
          const isCurrent = rankIdx === currentRankIndex;
          const rank = RANKS.find((r) => r.id === dungeon.rankId)!;

          return (
            <div
              key={dungeon.id}
              className={`card-premium p-5 relative overflow-hidden stagger-in ${isCurrent && !dungeonCompletedToday ? 'glow-ring' : ''}`}
              style={{
                borderColor: isUnlocked ? `${rank.color}30` : 'rgba(255,255,255,0.05)',
                ['--glow-color' as any]: rank.color,
                animationDelay: `${Math.min(idx * 0.04, 0.5)}s`,
              }}
            >
              {/* Rank-colored ambient glow */}
              {isUnlocked && (
                <div className="absolute inset-0 opacity-15 pointer-events-none" style={{ background: `radial-gradient(circle at 50% 0%, ${rank.color}, transparent 70%)` }} />
              )}

              {/* Lock overlay */}
              {!isUnlocked && (
                <div className="absolute inset-0 bg-ink-950/80 backdrop-blur-sm flex items-center justify-center z-10">
                  <div className="text-center">
                    <Lock size={28} className="mx-auto text-ink-500 mb-2" />
                    <p className="text-sm font-semibold text-ink-400">{rank.name}</p>
                    <p className="text-xs text-ink-500 mt-1">Reach {rank.name} to unlock</p>
                  </div>
                </div>
              )}

              {/* Completed overlay */}
              {isCurrent && dungeonCompletedToday && (
                <div className="absolute top-3 right-3 z-10 flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald2-500/20 border border-emerald2-500/30">
                  <Check size={12} className="text-emerald2-400" />
                  <span className="text-xs font-semibold text-emerald2-400">Cleared</span>
                </div>
              )}

              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{rank.emoji}</span>
                  <div>
                    <h3 className="font-display text-lg font-bold" style={{ color: isUnlocked ? rank.color : '#64748b' }}>{dungeon.name}</h3>
                    <p className="text-xs text-ink-400">{dungeon.theme}</p>
                  </div>
                </div>
                <p className="text-sm text-ink-300 mb-3">{dungeon.description}</p>

                {/* Exercises */}
                <div className="space-y-1.5 mb-4">
                  {dungeon.exercises.map((ex, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <Dumbbell size={14} className="text-ember-400" />
                      <span className="text-ink-200">{ex.name}</span>
                      <span className="text-ink-400 ml-auto font-semibold tabular-nums">
                        {ex.reps}{ex.isTime ? 's' : ' reps'}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Rewards preview */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {dungeon.rewards.map((reward, i) => (
                    <RewardChip key={i} reward={reward} />
                  ))}
                </div>

                {/* Enter button */}
                {isCurrent && !dungeonCompletedToday && (
                  <button onClick={() => setSelectedDungeon(dungeon)} className="btn-primary btn-sheen w-full">
                    <Swords size={16} /> Enter Dungeon
                  </button>
                )}
                {isCurrent && dungeonCompletedToday && (
                  <div className="w-full py-2 rounded-xl bg-emerald2-500/10 border border-emerald2-500/20 text-center text-sm text-emerald2-400 font-semibold">
                    Completed Today
                  </div>
                )}
                {!isCurrent && isUnlocked && (
                  <div className="w-full py-2 rounded-xl bg-ink-800/60 border border-white/5 text-center text-sm text-ink-400">
                    Available at {rank.name}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pre-enter preview modal */}
      <Modal open={selectedDungeon !== null} onClose={() => setSelectedDungeon(null)} title="Dungeon Preview" size="md">
        {selectedDungeon && (
          <div className="text-center">
            <div className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-4" style={{ background: `${currentRank.color}20`, boxShadow: `0 0 40px ${currentRank.glow}` }}>
              <Swords size={32} style={{ color: currentRank.color }} />
            </div>
            <h3 className="font-display text-xl font-bold">{selectedDungeon.name}</h3>
            <p className="text-sm text-ink-300 mt-1">{selectedDungeon.description}</p>

            {/* Exercises */}
            <div className="mt-4 space-y-2 text-left">
              <p className="text-xs font-semibold uppercase tracking-wider text-ember-400">Exercises</p>
              {selectedDungeon.exercises.map((ex, i) => (
                <div key={i} className="flex items-center gap-2 p-3 rounded-xl bg-ink-950/40 border border-white/5">
                  <Dumbbell size={16} className="text-ember-400" />
                  <span className="text-sm text-ink-200">{ex.name}</span>
                  <span className="text-sm font-bold text-ember-400 ml-auto tabular-nums">{ex.reps}{ex.isTime ? 's' : ' reps'}</span>
                </div>
              ))}
            </div>

            {/* Rewards */}
            <div className="mt-4 text-left">
              <p className="text-xs font-semibold uppercase tracking-wider text-gold-400 mb-2">Rewards</p>
              <div className="grid grid-cols-2 gap-2">
                {selectedDungeon.rewards.map((reward, i) => (
                  <RewardCard key={i} reward={reward} />
                ))}
              </div>
            </div>

            <button onClick={() => handleEnterDungeon(selectedDungeon)} className="btn-primary btn-sheen w-full mt-5">
              <Swords size={18} /> Enter Dungeon
            </button>
          </div>
        )}
      </Modal>

      {/* Active dungeon modal */}
      <Modal open={activeDungeon !== null} onClose={() => setActiveDungeon(null)} title="" size="md">
        {activeDungeon && (
          <div className="text-center">
            <div className="flex items-center justify-between mb-3">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center energy-pulse" style={{ background: `${currentRank.color}20` }}>
                <Swords size={24} style={{ color: currentRank.color }} />
              </div>
              <button onClick={() => setActiveDungeon(null)} className="p-2 rounded-lg text-ink-400 hover:text-ink-200 hover:bg-white/5 transition">
                <X size={18} />
              </button>
            </div>
            <h3 className="font-display text-xl font-bold">{activeDungeon.name}</h3>
            <p className="text-xs text-ink-400 mt-1">Complete all exercises to clear the dungeon</p>

            {/* Progress */}
            <div className="h-2 bg-ink-950 rounded-full overflow-hidden my-4 border border-white/5">
              <div
                className="h-full bg-gradient-to-r from-ember-500 to-gold-500 rounded-full transition-all duration-500"
                style={{ width: `${activeDungeon.exercises.length > 0 ? (Object.values(completedExercise).filter(Boolean).length / activeDungeon.exercises.length) * 100 : 0}%` }}
              />
            </div>

            {/* Exercises */}
            <div className="space-y-2 text-left">
              {activeDungeon.exercises.map((ex, i) => {
                const done = completedExercise[i];
                return (
                  <button
                    key={i}
                    onClick={() => !done && handleCompleteExercise(i)}
                    disabled={done}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      done
                        ? 'bg-emerald2-500/10 border-emerald2-500/40'
                        : 'bg-ink-950/40 border-white/5 hover:border-ember-500/30 hover:bg-ink-800/60'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${done ? 'bg-emerald2-500 border-emerald2-500' : 'border-ink-500'}`}>
                      {done && <Check size={14} className="text-white check-pop" />}
                    </div>
                    <Dumbbell size={16} className={done ? 'text-emerald2-400' : 'text-ember-400'} />
                    <span className={`text-sm flex-1 text-left ${done ? 'text-emerald2-400 line-through' : 'text-ink-200'}`}>{ex.name}</span>
                    <span className={`text-sm font-bold tabular-nums ${done ? 'text-emerald2-400' : 'text-ember-400'}`}>
                      {ex.reps}{ex.isTime ? 's' : ' reps'}
                    </span>
                  </button>
                );
              })}
            </div>

            {allExercisesDone && (
              <button onClick={handleCompleteDungeon} className="btn-primary btn-sheen w-full mt-5 animate-pulse">
                <Trophy size={18} /> Claim Rewards
              </button>
            )}
          </div>
        )}
      </Modal>

      {/* Reward screen */}
      <Modal open={showReward !== null} onClose={() => setShowReward(null)} title="Dungeon Cleared!" size="md">
        {showReward && (
          <div className="text-center">
            <div className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-4 rank-burst" style={{ background: `${currentRank.color}20`, boxShadow: `0 0 50px ${currentRank.glow}` }}>
              <Trophy size={32} style={{ color: currentRank.color }} />
            </div>
            <h3 className="font-display text-2xl font-bold text-gradient-gold">Dungeon Cleared!</h3>
            <p className="text-sm text-ink-300 mt-1">{showReward.name}</p>

            {/* Rewards */}
            <div className="mt-5 space-y-2">
              {showReward.rewards.map((reward, i) => (
                <RewardDisplayCard key={i} reward={reward} index={i} />
              ))}
              {rewardDrops.length > 0 && (
                <>
                  <p className="text-xs font-semibold uppercase tracking-wider text-shadow-400 mt-3 mb-1">Bonus Drops</p>
                  {rewardDrops.map((drop, i) => (
                    <div key={`drop-${i}`} className="stagger-in flex items-center gap-3 p-3 rounded-xl bg-ink-950/40 border border-white/5" style={{ animationDelay: `${(showReward.rewards.length + i) * 0.1}s` }}>
                      <Sparkles size={16} className="text-shadow-400" />
                      <span className="text-sm text-ink-200 flex-1 text-left">{drop.label}</span>
                      {drop.rarity && (
                        <span className="text-xs font-semibold uppercase" style={{ color: RARITY_META[drop.rarity as Rarity]?.color }}>
                          {RARITY_META[drop.rarity as Rarity]?.label}
                        </span>
                      )}
                    </div>
                  ))}
                </>
              )}
            </div>

            <button onClick={() => setShowReward(null)} className="btn-ghost btn-sheen w-full mt-5">
              Continue
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}

function RewardChip({ reward }: { reward: DungeonReward }) {
  const color = reward.rarity ? RARITY_COLORS[reward.rarity] ?? '#9ca3af' : '#fbbf24';
  const icons: Record<string, typeof Zap> = {
    xp: Zap, coins: Coins, aura: Sparkles, title: Award, weapon: Swords, shield: Shield, badge: Trophy,
  };
  const Icon = icons[reward.type] ?? Zap;
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium" style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}>
      <Icon size={10} />
      <span className="truncate max-w-[100px]">{reward.label}</span>
    </div>
  );
}

function RewardCard({ reward }: { reward: DungeonReward }) {
  const color = reward.rarity ? RARITY_COLORS[reward.rarity] ?? '#9ca3af' : '#fbbf24';
  const icons: Record<string, typeof Zap> = {
    xp: Zap, coins: Coins, aura: Sparkles, title: Award, weapon: Swords, shield: Shield, badge: Trophy,
  };
  const Icon = icons[reward.type] ?? Zap;
  return (
    <div className="flex items-center gap-2 p-2.5 rounded-xl border" style={{ background: `${color}08`, borderColor: `${color}20` }}>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${color}20` }}>
        <Icon size={14} style={{ color }} />
      </div>
      <span className="text-xs font-medium text-ink-200 truncate">{reward.label}</span>
    </div>
  );
}

function RewardDisplayCard({ reward, index }: { reward: DungeonReward; index: number }) {
  const color = reward.rarity ? RARITY_COLORS[reward.rarity] ?? '#9ca3af' : '#fbbf24';
  const icons: Record<string, typeof Zap> = {
    xp: Zap, coins: Coins, aura: Sparkles, title: Award, weapon: Swords, shield: Shield, badge: Trophy,
  };
  const Icon = icons[reward.type] ?? Zap;
  return (
    <div
      className="stagger-in flex items-center gap-3 p-3 rounded-xl border"
      style={{ background: `${color}10`, borderColor: `${color}30`, animationDelay: `${index * 0.1}s` }}
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}20`, boxShadow: `0 0 15px ${color}40` }}>
        <Icon size={18} style={{ color }} />
      </div>
      <div className="flex-1 text-left">
        <p className="text-sm font-semibold text-ink-100">{reward.label}</p>
        {reward.rarity && (
          <p className="text-xs font-semibold uppercase" style={{ color }}>{RARITY_META[reward.rarity as Rarity]?.label ?? reward.rarity}</p>
        )}
      </div>
    </div>
  );
}
