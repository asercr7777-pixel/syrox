import { useState, useEffect, useMemo } from 'react';
import { useStore } from '../../store/useStore';
import { DAILY_LOGIN_REWARDS } from '../../data/tasks';
import { triggerConfetti } from './Confetti';
import { Modal } from './Modal';
import { Coins, Zap, Sparkles, Award, Lock, Check, Flame, ChevronRight } from 'lucide-react';

const REWARD_ICONS: Record<string, typeof Coins> = {
  coins: Coins,
  xp: Zap,
  shards: Sparkles,
  chest: Award,
  aura: Sparkles,
};

const REWARD_COLORS: Record<string, string> = {
  coins: '#fbbf24',
  xp: '#ff7a18',
  shards: '#06b6d4',
  chest: '#10b981',
  aura: '#a855f7',
};

function getNextRewardTime(lastClaimDate: string | null): Date | null {
  if (!lastClaimDate) return null;
  const last = new Date(lastClaimDate + 'T00:00:00');
  last.setDate(last.getDate() + 1);
  return last;
}

function formatCountdown(target: Date): string {
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  if (diff <= 0) return 'Available now';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function DailyRewards() {
  const { state, claimLoginReward } = useStore();
  const [showModal, setShowModal] = useState(false);
  const [countdown, setCountdown] = useState('');
  const [claimedReward, setClaimedReward] = useState<any>(null);

  const today = new Date().toISOString().slice(0, 10);
  const claimedToday = state.lastLoginClaimDate === today;
  const nextRewardTime = useMemo(() => getNextRewardTime(state.lastLoginClaimDate), [state.lastLoginClaimDate]);

  useEffect(() => {
    if (!nextRewardTime) return;
    const update = () => setCountdown(formatCountdown(nextRewardTime));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [nextRewardTime]);

  const handleClaim = () => {
    const result = claimLoginReward();
    if (result) {
      setClaimedReward(result.reward);
      setShowModal(false);
      triggerConfetti(60);
      setTimeout(() => setClaimedReward(null), 5000);
    }
  };

  const currentStreakIndex = state.loginStreak > 0 ? (state.loginStreak - 1) % 30 : 0;
  const nextReward = DAILY_LOGIN_REWARDS[currentStreakIndex];

  return (
    <>
      <div className="card-premium p-5 page-enter relative overflow-hidden" style={{ animationDelay: '0.03s' }}>
        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ background: 'radial-gradient(circle at 50% 0%, rgba(251,191,36,0.2), transparent 70%)' }} />
        <div className="relative">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Flame size={18} className="text-gold-400" />
              <h2 className="section-title">Daily Rewards</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="chip bg-gold-500/15 text-gold-400 border border-gold-500/30">
                {state.loginStreak} day streak
              </span>
            </div>
          </div>

          {/* Next reward preview */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-ink-950/40 border border-white/5 mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${REWARD_COLORS[nextReward.type]}20` }}>
              {(() => {
                const Icon = REWARD_ICONS[nextReward.type] ?? Coins;
                return <Icon size={18} style={{ color: REWARD_COLORS[nextReward.type] }} />;
              })()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-ink-400">Next Reward (Day {state.loginStreak + 1})</p>
              <p className="text-sm font-semibold text-ink-100 truncate">{nextReward.label}</p>
            </div>
            {claimedToday ? (
              <div className="text-right">
                <div className="flex items-center gap-1 text-emerald2-400">
                  <Check size={14} />
                  <span className="text-xs font-semibold">Claimed</span>
                </div>
                <p className="text-xs text-ink-400 tabular-nums mt-0.5">{countdown}</p>
              </div>
            ) : (
              <button onClick={handleClaim} className="btn-primary btn-sheen text-xs px-3 py-2">
                Claim
              </button>
            )}
          </div>

          {/* 7-day strip */}
          <div className="grid grid-cols-7 gap-1.5">
            {DAILY_LOGIN_REWARDS.slice(0, 7).map((reward, i) => {
              const isClaimed = i < (state.loginStreak % 30 || state.loginStreak > 0 ? state.loginStreak % 7 : 0);
              const isCurrent = i === (state.loginStreak % 7);
              const isLocked = i > state.loginStreak;
              const color = REWARD_COLORS[reward.type] ?? '#fbbf24';
              const Icon = REWARD_ICONS[reward.type] ?? Coins;

              return (
                <div
                  key={i}
                  className={`relative p-2 rounded-lg border text-center transition-all ${
                    isClaimed
                      ? 'bg-emerald2-500/10 border-emerald2-500/30'
                      : isCurrent && !claimedToday
                        ? 'bg-gold-500/10 border-gold-500/40 animate-pulse'
                        : 'bg-ink-950/40 border-white/5'
                  }`}
                >
                  <div className="text-[10px] text-ink-400 mb-1">D{i + 1}</div>
                  <Icon size={14} className="mx-auto mb-0.5" style={{ color }} />
                  <div className="text-[9px] text-ink-300 truncate">{reward.label.split(' ')[0]}</div>
                  {isClaimed && (
                    <div className="absolute top-0.5 right-0.5">
                      <Check size={10} className="text-emerald2-400" />
                    </div>
                  )}
                  {isLocked && (
                    <div className="absolute inset-0 flex items-center justify-center bg-ink-950/60 rounded-lg">
                      <Lock size={10} className="text-ink-500" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Countdown timer */}
          {claimedToday && nextRewardTime && (
            <div className="mt-3 text-center">
              <p className="text-xs text-ink-400">Next reward in</p>
              <p className="text-lg font-bold font-mono tabular-nums text-gold-400">{countdown}</p>
            </div>
          )}

          {/* View all rewards */}
          <button onClick={() => setShowModal(true)} className="w-full mt-3 text-xs text-ink-300 hover:text-ember-400 transition-colors flex items-center justify-center gap-1">
            View 30-day rewards <ChevronRight size={12} />
          </button>
        </div>
      </div>

      {/* Claimed reward popup */}
      {claimedReward && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 stagger-in">
          <div className="card-premium px-6 py-4 flex items-center gap-3" style={{ boxShadow: '0 0 40px rgba(251,191,36,0.4)' }}>
            {(() => {
              const Icon = REWARD_ICONS[claimedReward.type] ?? Coins;
              return <Icon size={24} style={{ color: REWARD_COLORS[claimedReward.type] }} />;
            })()}
            <div>
              <p className="text-xs text-ink-400">Reward Claimed!</p>
              <p className="text-sm font-bold text-gold-400">{claimedReward.label}</p>
            </div>
          </div>
        </div>
      )}

      {/* Full 30-day rewards modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="30-Day Login Rewards" size="lg">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {DAILY_LOGIN_REWARDS.map((reward, i) => {
            const isClaimed = i < (state.loginStreak % 30);
            const isCurrent = i === (state.loginStreak % 30);
            const color = REWARD_COLORS[reward.type] ?? '#fbbf24';
            const Icon = REWARD_ICONS[reward.type] ?? Coins;
            return (
              <div
                key={i}
                className={`p-3 rounded-xl border text-center transition-all ${
                  isClaimed
                    ? 'bg-emerald2-500/10 border-emerald2-500/30'
                    : isCurrent && !claimedToday
                      ? 'bg-gold-500/10 border-gold-500/40'
                      : 'bg-ink-950/40 border-white/5'
                }`}
              >
                <div className="text-xs text-ink-400 mb-1">Day {i + 1}</div>
                <Icon size={20} className="mx-auto mb-1" style={{ color }} />
                <p className="text-xs font-medium text-ink-200">{reward.label}</p>
                {reward.shield && <p className="text-[10px] text-emerald2-400 mt-0.5">+ Shield</p>}
                {isClaimed && <Check size={12} className="mx-auto mt-1 text-emerald2-400" />}
              </div>
            );
          })}
        </div>
      </Modal>
    </>
  );
}
