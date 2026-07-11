import { useStore } from '../store/useStore';
import { RANKS, getRankByXp, getRankIndex, type Rank } from '../data/ranks';
import { getAuraById, getWeaponById, getShieldById, getTitleById, RARITY_META } from '../data/collections';
import { Lock, Check, Crown, Zap, Swords, Shield, Sparkles, Star } from 'lucide-react';
import { toast } from '../components/ui/Toast';
import { triggerConfetti } from '../components/ui/Confetti';

const TIER_STYLES: Record<Rank['tier'], { bg: string; border: string; glow: string; particle: string }> = {
  bronze: { bg: 'from-amber-900/20 to-transparent', border: 'border-amber-700/40', glow: 'rgba(180,83,9,0.3)', particle: '#b45309' },
  silver: { bg: 'from-slate-600/20 to-transparent', border: 'border-slate-400/40', glow: 'rgba(148,163,184,0.3)', particle: '#94a3b8' },
  green: { bg: 'from-emerald-700/20 to-transparent', border: 'border-emerald-500/40', glow: 'rgba(16,185,129,0.3)', particle: '#10b981' },
  blue: { bg: 'from-blue-700/20 to-transparent', border: 'border-blue-500/40', glow: 'rgba(59,130,246,0.3)', particle: '#3b82f6' },
  purple: { bg: 'from-purple-700/20 to-transparent', border: 'border-purple-500/40', glow: 'rgba(168,85,247,0.4)', particle: '#a855f7' },
  gold: { bg: 'from-amber-600/20 to-transparent', border: 'border-amber-400/50', glow: 'rgba(245,158,11,0.4)', particle: '#f59e0b' },
  fire: { bg: 'from-orange-600/20 to-transparent', border: 'border-orange-500/50', glow: 'rgba(249,115,22,0.5)', particle: '#f97316' },
  lightning: { bg: 'from-yellow-500/20 to-transparent', border: 'border-yellow-400/50', glow: 'rgba(250,204,21,0.5)', particle: '#facc15' },
  shadow: { bg: 'from-violet-900/30 to-slate-900/30', border: 'border-violet-600/50', glow: 'rgba(124,58,237,0.5)', particle: '#7c3aed' },
  monarch: { bg: 'from-amber-500/20 via-purple-600/20 to-transparent', border: 'border-amber-300/60', glow: 'rgba(251,191,36,0.6)', particle: '#fbbf24' },
};

function RewardChip({ type, itemId, label }: { type: string; itemId: string; label: string }) {
  let item: any = null;
  let rarity: string = 'common';
  if (type === 'aura') { item = getAuraById(itemId); rarity = item?.rarity ?? 'common'; }
  else if (type === 'weapon') { item = getWeaponById(itemId); rarity = item?.rarity ?? 'common'; }
  else if (type === 'shield') { item = getShieldById(itemId); rarity = item?.rarity ?? 'common'; }
  else if (type === 'title') { item = getTitleById(itemId); rarity = item?.rarity ?? 'common'; }
  const meta = RARITY_META[rarity as keyof typeof RARITY_META] ?? RARITY_META.common;
  const icons: Record<string, string> = { aura: '✨', weapon: '⚔️', shield: '🛡️', title: '🏷️' };
  return (
    <div
      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs"
      style={{ borderColor: `${meta.color}40`, background: `${meta.color}10` }}
    >
      <span>{icons[type]}</span>
      <span className="font-medium" style={{ color: meta.color }}>{label}</span>
    </div>
  );
}

function RankCard({ rank, index, currentXp, claimed, onClaim }: { rank: Rank; index: number; currentXp: number; claimed: boolean; onClaim: () => void }) {
  const style = TIER_STYLES[rank.tier];
  const isUnlocked = currentXp >= rank.xpRequired;
  const isCurrent = getRankByXp(currentXp).id === rank.id;
  const isCompleted = currentXp > rank.xpRequired && !isCurrent;
  const prevRank = index > 0 ? RANKS[index - 1] : null;
  const progressInRank = prevRank ? currentXp - prevRank.xpRequired : currentXp;
  const rankSpan = rank.xpRequired - (prevRank?.xpRequired ?? 0);
  const progressPct = isUnlocked ? 100 : prevRank ? Math.min(100, (progressInRank / rankSpan) * 100) : 0;

  const status = isCurrent ? 'current' : isCompleted ? 'completed' : isUnlocked ? 'unlocked' : 'locked';

  return (
    <div
      className={`card p-5 md:p-6 relative overflow-hidden transition-all duration-500 hover:scale-[1.01] ${style.border} bg-gradient-to-br ${style.bg}`}
      style={{ boxShadow: isUnlocked ? `0 0 40px ${style.glow}` : 'none' }}
    >
      {/* Particle effects for high tiers */}
      {(rank.tier === 'monarch' || rank.tier === 'shadow' || rank.tier === 'fire') && isUnlocked && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 8 }, (_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 rounded-full"
              style={{
                left: `${(i * 12.5) % 100}%`,
                top: `${(i * 17) % 100}%`,
                background: style.particle,
                animation: `floatParticle ${3 + (i % 3)}s ease-in-out infinite`,
                animationDelay: `${i * 0.4}s`,
                opacity: 0.6,
              }}
            />
          ))}
        </div>
      )}

      {/* Status badge */}
      <div className="absolute top-3 right-3 z-10">
        {status === 'current' && (
          <span className="chip bg-ember-500/20 text-ember-400 border border-ember-500/40 animate-pulse">
            <Zap size={10} /> Current
          </span>
        )}
        {status === 'completed' && (
          <span className="chip bg-emerald2-500/20 text-emerald2-400 border border-emerald2-500/40">
            <Check size={10} /> Completed
          </span>
        )}
        {status === 'locked' && (
          <span className="chip bg-ink-800 text-ink-400 border border-white/5">
            <Lock size={10} /> Locked
          </span>
        )}
      </div>

      {/* Rank number */}
      <div className="relative flex items-start gap-4 mb-4">
        <div
          className="w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center text-4xl md:text-5xl flex-shrink-0"
          style={{
            background: `radial-gradient(circle, ${rank.color}30, transparent 70%)`,
            border: `2px solid ${rank.color}`,
            boxShadow: isUnlocked ? `0 0 30px ${rank.glow}` : 'none',
            filter: isUnlocked ? 'none' : 'grayscale(0.8) brightness(0.5)',
          }}
        >
          {rank.emoji}
        </div>
        <div className="flex-1 min-w-0 pt-1">
          <p className="text-xs text-ink-400 font-mono">RANK {String(index + 1).padStart(2, '0')}</p>
          <h3 className="font-display text-xl md:text-2xl font-bold truncate" style={{ color: isUnlocked ? rank.color : undefined }}>
            {rank.name}
          </h3>
          <p className="text-xs text-ink-300 mt-0.5">{rank.description}</p>
        </div>
      </div>

      {/* XP requirement */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-ink-300">XP Required</span>
        <span className="text-sm font-bold tabular-nums" style={{ color: rank.color }}>
          {rank.xpRequired.toLocaleString()} XP
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2.5 bg-ink-950 rounded-full overflow-hidden mb-4">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${progressPct}%`,
            background: `linear-gradient(90deg, ${rank.color}, ${style.particle})`,
            boxShadow: isUnlocked ? `0 0 10px ${rank.glow}` : 'none',
          }}
        />
      </div>

      {/* Dungeon */}
      <div className="p-3 rounded-xl bg-ink-950/40 border border-white/5 mb-3">
        <div className="flex items-center gap-2 mb-1">
          <Swords size={14} className="text-ember-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-ember-400">Dungeon</span>
        </div>
        <p className="text-sm font-medium">{rank.dungeon.name}</p>
        <p className="text-xs text-ink-400">+{rank.dungeon.xpReward} XP reward</p>
      </div>

      {/* Rewards */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Star size={14} className="text-gold-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-gold-400">Rewards</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {rank.rewards.map((r, i) => (
            <RewardChip key={i} type={r.type} itemId={r.itemId} label={r.label} />
          ))}
        </div>
      </div>

      {/* Claim button */}
      {isUnlocked && !claimed && rank.rewards.some((r) => r.type !== 'title') && (
        <button
          onClick={onClaim}
          className="btn-primary w-full text-sm"
        >
          <Sparkles size={14} /> Claim Rewards
        </button>
      )}
      {isUnlocked && claimed && (
        <div className="w-full py-2 rounded-xl bg-emerald2-500/10 border border-emerald2-500/30 text-center text-xs font-semibold text-emerald2-400 flex items-center justify-center gap-1.5">
          <Check size={14} /> Rewards Claimed
        </div>
      )}
      {status === 'locked' && (
        <div className="w-full py-2 rounded-xl bg-ink-800/60 border border-white/5 text-center text-xs font-medium text-ink-400 flex items-center justify-center gap-1.5">
          <Lock size={12} /> {(rank.xpRequired - currentXp).toLocaleString()} XP to unlock
        </div>
      )}

      <style>{`
        @keyframes floatParticle {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.3; }
          50% { transform: translateY(-20px) scale(1.5); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}

export function Ranks() {
  const { state, claimRankReward } = useStore();
  const currentRank = getRankByXp(state.xp);
  const currentIdx = getRankIndex(currentRank.id);

  const handleClaim = (rankId: string) => {
    claimRankReward(rankId);
    triggerConfetti(40);
    toast({ title: 'Rank rewards claimed!', message: 'Check your inventory for new items.', type: 'reward', icon: '🎁' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card p-6 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{ background: `radial-gradient(circle at 30% 0%, ${currentRank.glow}, transparent 60%)` }}
        />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <Crown size={24} className="text-gold-400" />
            <h1 className="section-title">Rank Progression</h1>
          </div>
          <p className="text-sm text-ink-300">
            You are <span className="font-bold" style={{ color: currentRank.color }}>{currentRank.name} {currentRank.emoji}</span> · Rank {currentIdx + 1} of {RANKS.length}
          </p>
          <p className="text-xs text-ink-400 mt-1">
            Reach the highest rank in ~90 days of consistent Main + Extra task completion.
          </p>
        </div>
      </div>

      {/* Rank cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {RANKS.map((rank, i) => (
          <RankCard
            key={rank.id}
            rank={rank}
            index={i}
            currentXp={state.xp}
            claimed={state.rankRewardsClaimed.includes(rank.id)}
            onClaim={() => handleClaim(rank.id)}
          />
        ))}
      </div>
    </div>
  );
}
