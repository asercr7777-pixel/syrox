import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { useAuth } from '../lib/auth';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { RANKS, getRankByXp, getRankIndex, getNextRank, type Rank } from '../data/ranks';
import { RankBadge } from '../components/ui/RankBadge';
import { getAuraById, getWeaponById, getShieldById, getTitleById, RARITY_META } from '../data/collections';
import { Crown, RefreshCw, Users, WifiOff, Trophy, Flame, Coins, Target, Lock, Check, Zap, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
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
    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs" style={{ borderColor: `${meta.color}40`, background: `${meta.color}10` }}>
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
    <div className={`card p-4 md:p-5 relative overflow-hidden transition-all duration-500 hover:scale-[1.01] ${style.border} bg-gradient-to-br ${style.bg}`} style={{ boxShadow: isUnlocked ? `0 0 30px ${style.glow}` : 'none' }}>
      {(rank.tier === 'monarch' || rank.tier === 'shadow' || rank.tier === 'fire') && isUnlocked && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="absolute w-1 h-1 rounded-full" style={{ left: `${(i * 17) % 100}%`, top: `${(i * 23) % 100}%`, background: style.particle, animation: `floatParticle ${3 + (i % 3)}s ease-in-out infinite`, animationDelay: `${i * 0.4}s`, opacity: 0.5 }} />
          ))}
        </div>
      )}
      <div className="absolute top-3 right-3 z-10">
        {status === 'current' && <span className="chip bg-ember-500/20 text-ember-400 border border-ember-500/40 animate-pulse"><Zap size={10} /> Current</span>}
        {status === 'completed' && <span className="chip bg-emerald2-500/20 text-emerald2-400 border border-emerald2-500/40"><Check size={10} /> Completed</span>}
        {status === 'locked' && <span className="chip bg-ink-800 text-ink-400 border border-white/5"><Lock size={10} /> Locked</span>}
      </div>
      <div className="relative flex items-start gap-3 mb-3">
        <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center text-3xl md:text-4xl flex-shrink-0" style={{ background: `radial-gradient(circle, ${rank.color}30, transparent 70%)`, border: `2px solid ${rank.color}`, boxShadow: isUnlocked ? `0 0 20px ${rank.glow}` : 'none', filter: isUnlocked ? 'none' : 'grayscale(0.8) brightness(0.5)' }}>
          {rank.emoji}
        </div>
        <div className="flex-1 min-w-0 pt-1">
          <p className="text-xs text-ink-400 font-mono">RANK {String(index + 1).padStart(2, '0')}</p>
          <h3 className="font-display text-lg md:text-xl font-bold truncate" style={{ color: isUnlocked ? rank.color : undefined }}>{rank.name}</h3>
          <p className="text-xs text-ink-300 mt-0.5">{rank.description}</p>
        </div>
      </div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-ink-300">XP Required</span>
        <span className="text-sm font-bold tabular-nums" style={{ color: rank.color }}>{rank.xpRequired.toLocaleString()} XP</span>
      </div>
      <div className="h-2 bg-ink-950 rounded-full overflow-hidden mb-3">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${progressPct}%`, background: `linear-gradient(90deg, ${rank.color}, ${style.particle})`, boxShadow: isUnlocked ? `0 0 10px ${style.glow}` : 'none' }} />
      </div>
      <div className="flex flex-wrap gap-2 mb-3">
        {rank.rewards.map((r, i) => <RewardChip key={i} type={r.type} itemId={r.itemId} label={r.label} />)}
      </div>
      {isUnlocked && !claimed && rank.rewards.some((r) => r.type !== 'title') && (
        <button onClick={onClaim} className="btn-primary w-full text-sm"><Sparkles size={14} /> Claim Rewards</button>
      )}
      {isUnlocked && claimed && (
        <div className="w-full py-2 rounded-xl bg-emerald2-500/10 border border-emerald2-500/30 text-center text-xs font-semibold text-emerald2-400 flex items-center justify-center gap-1.5"><Check size={14} /> Rewards Claimed</div>
      )}
      {status === 'locked' && (
        <div className="w-full py-2 rounded-xl bg-ink-800/60 border border-white/5 text-center text-xs font-medium text-ink-400 flex items-center justify-center gap-1.5"><Lock size={12} /> {(rank.xpRequired - currentXp).toLocaleString()} XP to unlock</div>
      )}
    </div>
  );
}

const floatParticleStyle = document.createElement('style');
floatParticleStyle.textContent = `@keyframes floatParticle { 0%, 100% { transform: translateY(0) scale(1); opacity: 0.3; } 50% { transform: translateY(-20px) scale(1.5); opacity: 0.8; } }`;
document.head.appendChild(floatParticleStyle);

// --- Leaderboard section ---

interface LeaderboardRow {
  user_id: string;
  username: string;
  avatar: string;
  xp: number;
  level: number;
  total_points: number;
  streak: number;
  discipline_score: number;
  tasks_completed: number;
  rank_id: string;
  rank_name: string;
  rank_emoji: string;
  aura_color: string;
}

type SortKey = 'xp' | 'streak' | 'total_points' | 'discipline_score';

const SORT_OPTIONS: { key: SortKey; label: string; icon: typeof Trophy }[] = [
  { key: 'xp', label: 'XP', icon: Trophy },
  { key: 'discipline_score', label: 'Discipline', icon: Target },
  { key: 'streak', label: 'Streak', icon: Flame },
  { key: 'total_points', label: 'Points', icon: Coins },
];

export function Leaderboard() {
  const { state, syncLeaderboard, claimRankReward } = useStore();
  const { user } = useAuth();
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>('xp');
  const [rankExpanded, setRankExpanded] = useState(false);

  const currentRank = getRankByXp(state.xp);
  const nextRank = getNextRank(state.xp);
  const currentIdx = getRankIndex(currentRank.id);
  const rankProgressPct = nextRank ? Math.min(100, Math.round(((state.xp - currentRank.xpRequired) / (nextRank.xpRequired - currentRank.xpRequired) * 100))) : 100;

  const fetchLeaderboard = async (key?: SortKey) => {
    if (!isSupabaseConfigured()) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.from('leaderboard').select('*').order(key ?? sortKey, { ascending: false }).limit(100);
      if (error) throw error;
      setRows(data as LeaderboardRow[] ?? []);
    } catch { setRows([]); } finally { setLoading(false); }
  };

  useEffect(() => { fetchLeaderboard(); /* eslint-disable-next-line */ }, []);

  const handleSortChange = (key: SortKey) => {
    setSortKey(key);
    fetchLeaderboard(key);
  };

  const handleRefresh = async () => {
    await syncLeaderboard();
    await fetchLeaderboard();
    toast({ title: 'Leaderboard refreshed', type: 'success' });
  };

  const handleClaim = (rankId: string) => {
    claimRankReward(rankId);
    triggerConfetti(40);
    toast({ title: 'Rank rewards claimed!', message: 'Check your inventory for new items.', type: 'reward', icon: '🎁' });
  };

  const myPosition = rows.findIndex((r) => r.user_id === user?.id) + 1;
  const visibleRanks = rankExpanded ? RANKS : RANKS.slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Rank Progression Section */}
      <div className="space-y-4">
        <div className="card p-5 relative overflow-hidden">
          <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ background: `radial-gradient(circle at 30% 0%, ${currentRank.glow}, transparent 60%)` }} />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <Crown size={22} className="text-gold-400" />
              <h1 className="section-title">Rank Progression</h1>
            </div>
            <p className="text-sm text-ink-300">
              You are <span className="font-bold" style={{ color: currentRank.color }}>{currentRank.name} {currentRank.emoji}</span> · Rank {currentIdx + 1} of {RANKS.length}
            </p>
            <div className="mt-3 h-3 bg-ink-950 rounded-full overflow-hidden border border-white/5 relative">
              <div className="h-full bg-gradient-to-r from-ember-500 to-gold-500 rounded-full transition-all duration-700 progress-glow" style={{ width: `${rankProgressPct}%`, ['--progress-color' as any]: currentRank.color }} />
              <div className="absolute inset-x-0 top-0 h-1/2 rounded-full pointer-events-none" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.15), transparent)' }} />
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-ink-300">
              <span>{currentRank.xpRequired.toLocaleString()} XP</span>
              <span className="font-semibold text-ember-400">{rankProgressPct}%</span>
              <span>{nextRank ? nextRank.xpRequired.toLocaleString() : 'MAX'} XP</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {visibleRanks.map((rank, i) => (
            <RankCard key={rank.id} rank={rank} index={i} currentXp={state.xp} claimed={state.rankRewardsClaimed.includes(rank.id)} onClaim={() => handleClaim(rank.id)} />
          ))}
        </div>

        {RANKS.length > 4 && (
          <button onClick={() => setRankExpanded(!rankExpanded)} className="btn-ghost w-full text-sm">
            {rankExpanded ? <><ChevronUp size={16} /> Show Less</> : <><ChevronDown size={16} /> Show All {RANKS.length} Ranks</>}
          </button>
        )}
      </div>

      {/* Leaderboard Section */}
      <div className="flex items-center justify-between flex-wrap gap-3 pt-2">
        <div>
          <h2 className="section-title">Global Leaderboard</h2>
          <p className="text-sm text-ink-300">Compete with real hunters worldwide</p>
        </div>
        <button onClick={handleRefresh} className="btn-ghost text-sm"><RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh</button>
      </div>

      <div className="flex gap-2 flex-wrap">
        <div className="flex gap-1 p-1 bg-ink-950/60 rounded-xl border border-white/5">
          {SORT_OPTIONS.map((s) => {
            const Icon = s.icon;
            return (
              <button key={s.key} onClick={() => handleSortChange(s.key)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${sortKey === s.key ? 'bg-ember-500/20 text-ember-400' : 'text-ink-300'}`}>
                <Icon size={12} /> {s.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="card p-4 border-ember-500/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-ember-500/20 flex items-center justify-center font-bold text-ember-400">{myPosition > 0 ? `#${myPosition}` : '—'}</div>
          <div className="flex-1"><p className="font-semibold">{state.username} (You)</p><p className="text-xs text-ink-300">{currentRank.emoji} {currentRank.name} · {state.xp.toLocaleString()} XP · {state.streak} day streak</p></div>
          <RankBadge rank={currentRank} size="sm" />
        </div>
      </div>

      {!isSupabaseConfigured() && <div className="card p-4 border-gold-500/30 flex items-center gap-3"><WifiOff size={20} className="text-gold-400" /><p className="text-sm text-ink-200">Live leaderboard unavailable.</p></div>}

      {!loading && rows.length === 0 && isSupabaseConfigured() && (
        <div className="card p-12 text-center"><Users size={40} className="mx-auto text-ink-400 mb-4" /><p className="text-lg font-display font-bold text-ink-200 mb-2">No players yet</p><p className="text-sm text-ink-300">Be the first Hunter to join the leaderboard!</p></div>
      )}

      {rows.length >= 3 && (
        <div className="grid grid-cols-3 gap-3">
          {[1, 0, 2].map((idx) => {
            const r = rows[idx]; const place = idx + 1;
            const heights = ['h-32', 'h-40', 'h-28']; const colors = ['#c0c0c0', '#fbbf24', '#cd7f32'];
            const rank = RANKS.find((rk) => rk.id === r.rank_id) ?? RANKS[0];
            return (
              <div key={r.user_id} className={`card p-4 flex flex-col items-center justify-end ${heights[idx]} relative`}>
                {place === 1 && <Crown size={20} className="text-gold-400 absolute top-2" />}
                <RankBadge rank={rank} size="md" auraColor={r.aura_color} />
                <p className="font-semibold text-sm mt-2 truncate w-full text-center">{r.username}</p>
                <p className="text-xs text-ink-300">{r.xp.toLocaleString()} XP</p>
                <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mt-1" style={{ background: `${colors[idx]}30`, color: colors[idx] }}>{place}</div>
              </div>
            );
          })}
        </div>
      )}

      {loading ? (
        <div className="card p-8 text-center"><Users size={28} className="mx-auto text-ink-400 animate-pulse mb-2" /><p className="text-sm text-ink-300">Loading hunters...</p></div>
      ) : rows.length > 0 ? (
        <div className="card p-3">
          <div className="space-y-1">
            {rows.map((r, i) => {
              const rank = RANKS.find((rk) => rk.id === r.rank_id) ?? RANKS[0];
              const isMe = r.user_id === user?.id;
              return (
                <div key={r.user_id} className={`flex items-center gap-3 p-3 rounded-xl transition ${isMe ? 'bg-ember-500/10 border border-ember-500/30' : 'hover:bg-white/5'}`}>
                  <span className="w-8 text-center font-bold text-ink-300">{i + 1}</span>
                  <RankBadge rank={rank} size="sm" auraColor={r.aura_color} />
                  <div className="flex-1 min-w-0"><p className="font-semibold truncate">{r.username} {isMe && <span className="text-xs text-ember-400">(You)</span>}</p><p className="text-xs text-ink-300">{r.rank_emoji} {r.rank_name} · {r.streak} day streak · {r.discipline_score}% discipline</p></div>
                  <div className="text-right"><p className="font-mono font-bold text-sm">{r.xp.toLocaleString()}</p><p className="text-xs text-ink-400">XP</p></div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
