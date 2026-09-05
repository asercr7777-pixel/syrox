import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { useAuth } from '../lib/auth';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { RANKS, getRankByXp, getRankIndex, getNextRank, type Rank } from '../data/ranks';
import { RankBadge } from '../components/ui/RankBadge';
import { UserAvatar } from '../components/ui/UserAvatar';
import { Crown, RefreshCw, Users, Trophy, Flame, Target, Lock, Check, Zap, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from '../components/ui/Toast';
import { triggerConfetti } from '../components/ui/Confetti';

type SortKey = 'xp' | 'streak' | 'total_points' | 'discipline_score';
interface LeaderboardRow { user_id: string; username: string; avatar: string; xp: number; level: number; total_points: number; streak: number; discipline_score: number; tasks_completed: number; rank_id: string; rank_name: string; rank_emoji: string; aura_color: string; background_type?: 'default' | 'image' | 'video' | 'animated' | null; background_value?: string | null; }
const SORT_OPTIONS: { key: SortKey; label: string; icon: typeof Trophy }[] = [
  { key: 'xp', label: 'XP', icon: Trophy }, { key: 'discipline_score', label: 'Discipline', icon: Target }, { key: 'streak', label: 'Streak', icon: Flame }, { key: 'total_points', label: 'Score', icon: Zap },
];
const TIER_GLOW: Record<Rank['tier'], string> = { bronze: 'rgba(180,83,9,.28)', silver: 'rgba(148,163,184,.25)', green: 'rgba(16,185,129,.28)', blue: 'rgba(59,130,246,.28)', purple: 'rgba(168,85,247,.32)', gold: 'rgba(245,158,11,.34)', fire: 'rgba(249,115,22,.35)', lightning: 'rgba(250,204,21,.35)', shadow: 'rgba(124,58,237,.38)', monarch: 'rgba(251,191,36,.42)' };

function RankCard({ rank, index, currentXp, claimed, onClaim }: { rank: Rank; index: number; currentXp: number; claimed: boolean; onClaim: () => void }) {
  const unlocked = currentXp >= rank.xpRequired;
  const current = getRankByXp(currentXp).id === rank.id;
  const previous = index > 0 ? RANKS[index - 1] : null;
  const progress = unlocked ? 100 : previous ? Math.max(0, Math.min(100, ((currentXp - previous.xpRequired) / (rank.xpRequired - previous.xpRequired)) * 100)) : 0;
  return <article className={`relative overflow-hidden rounded-2xl border p-5 transition-transform hover:-translate-y-0.5 ${current ? 'border-ember-500/40' : unlocked ? 'border-white/10' : 'border-white/5'}`} style={{ boxShadow: unlocked ? `0 0 35px ${TIER_GLOW[rank.tier]}` : undefined }}>
    <div className="absolute inset-0 opacity-20" style={{ background: `radial-gradient(circle at 15% 0%, ${rank.color}, transparent 60%)` }} />
    <div className="relative flex items-start gap-4">
      <RankBadge rank={rank} size="md" />
      <div className="min-w-0 flex-1"><p className="font-mono text-[10px] uppercase tracking-[.22em] text-ink-500">Rank {String(index + 1).padStart(2, '0')}</p><h3 className="mt-1 truncate font-display text-lg font-bold" style={{ color: unlocked ? rank.color : undefined }}>{rank.name}</h3><p className="mt-1 line-clamp-2 text-xs text-ink-400">{rank.description}</p></div>
      <span className={`chip shrink-0 ${current ? 'bg-ember-500/15 text-ember-400' : unlocked ? 'bg-emerald2-500/10 text-emerald2-400' : 'bg-white/5 text-ink-500'}`}>{current ? 'Current' : unlocked ? 'Unlocked' : 'Locked'}</span>
    </div>
    <div className="relative mt-5 flex items-center justify-between text-xs"><span className="text-ink-500">Required</span><span className="font-mono font-bold" style={{ color: rank.color }}>{rank.xpRequired.toLocaleString()} XP</span></div>
    <div className="relative mt-2 h-1.5 overflow-hidden rounded-full bg-ink-950"><div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: rank.color }} /></div>
    {unlocked && !claimed && rank.rewards.length > 0 && <button onClick={onClaim} className="relative mt-4 btn-primary w-full text-sm"><Sparkles size={14} /> Claim Rank Rewards</button>}
    {unlocked && claimed && <div className="relative mt-4 flex items-center justify-center gap-1.5 rounded-xl border border-emerald2-500/20 bg-emerald2-500/10 py-2 text-xs font-semibold text-emerald2-400"><Check size={14} /> Rewards Claimed</div>}
  </article>;
}

function ProfileBackdrop({ type, value }: { type?: LeaderboardRow['background_type']; value?: string | null }) {
  if (!value || (type !== 'image' && type !== 'video')) return null;
  return <div className="absolute inset-0 overflow-hidden pointer-events-none"><div className="absolute inset-0 bg-black/60" />{type === 'video' ? <video src={value} autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover opacity-25" /> : <div className="absolute inset-0 bg-cover bg-center opacity-25" style={{ backgroundImage: `url("${value}")` }} />}</div>;
}

export function Leaderboard() {
  const { state, syncLeaderboard, claimRankReward } = useStore();
  const { user } = useAuth();
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>('xp');
  const [expanded, setExpanded] = useState(false);
  const currentRank = getRankByXp(state.xp);
  const nextRank = getNextRank(state.xp);
  const currentIndex = getRankIndex(currentRank.id);

  const fetchLeaderboard = async (key: SortKey = sortKey) => {
    if (!isSupabaseConfigured()) { setLoading(false); return; }
    setLoading(true);
    try { const { data, error } = await supabase.from('leaderboard').select('*').order(key, { ascending: false }).limit(100); if (error) throw error; setRows((data ?? []) as LeaderboardRow[]); }
    catch { setRows([]); }
    finally { setLoading(false); }
  };
  useEffect(() => { void fetchLeaderboard(); }, []);
  const changeSort = (key: SortKey) => { setSortKey(key); void fetchLeaderboard(key); };
  const refresh = async () => { await syncLeaderboard(); await fetchLeaderboard(); toast({ title: 'Leaderboard refreshed', type: 'success' }); };
  const claim = (id: string) => { claimRankReward(id); triggerConfetti(40); toast({ title: 'Rank rewards claimed!', type: 'reward' }); };
  const visibleRanks = expanded ? RANKS : RANKS.slice(0, 4);
  const myPosition = rows.findIndex((row) => row.user_id === user?.id) + 1;
  const progress = nextRank ? Math.min(100, Math.max(0, Math.round(((state.xp - currentRank.xpRequired) / (nextRank.xpRequired - currentRank.xpRequired)) * 100))) : 100;
  const topThree = rows.slice(0, 3);

  return <div className="space-y-6 pb-8">
    <header className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-ink-950/70 p-5 sm:p-8">
      <div className="absolute -right-24 -top-28 h-72 w-72 rounded-full bg-gold-500/10 blur-3xl" />
      <div className="relative grid gap-7 lg:grid-cols-[1.1fr_.9fr] lg:items-end">
        <div><div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.3em] text-gold-400"><Crown size={14} /> Ranking Command</div><h1 className="font-display text-3xl font-black uppercase tracking-tight sm:text-5xl">Global Hunters</h1><p className="mt-3 max-w-xl text-sm leading-6 text-ink-300">A live ranking of discipline, consistency and progression. Your XP determines your position.</p></div>
        <div className="rounded-2xl border border-white/10 bg-black/30 p-5"><div className="flex items-center justify-between text-xs uppercase tracking-widest text-ink-500"><span>Your standing</span><span className="font-mono text-ink-300">Rank {currentIndex + 1}/{RANKS.length}</span></div><div className="mt-3 flex items-end justify-between gap-4"><div><p className="font-display text-2xl font-black" style={{ color: currentRank.color }}>{currentRank.name}</p><p className="mt-1 text-xs text-ink-500">{state.xp.toLocaleString()} XP</p></div><div className="text-right"><p className="font-mono text-xl font-bold text-ink-100">{progress}%</p><p className="text-[10px] uppercase tracking-wider text-ink-500">to next rank</p></div></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-ink-900"><div className="h-full rounded-full bg-gradient-to-r from-ember-500 to-gold-500" style={{ width: `${progress}%` }} /></div>{nextRank && <p className="mt-2 text-right text-[10px] text-ink-500">{(nextRank.xpRequired - state.xp).toLocaleString()} XP to {nextRank.name}</p>}</div>
      </div>
    </header>

    <section><div className="mb-3 flex items-end justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.25em] text-ember-400">Progression ladder</p><h2 className="mt-1 font-display text-xl font-bold uppercase">The Ranks</h2></div><span className="font-mono text-xs text-ink-500">{RANKS.length} tiers</span></div><div className="grid gap-3 md:grid-cols-2">{visibleRanks.map((rank, index) => <RankCard key={rank.id} rank={rank} index={index} currentXp={state.xp} claimed={state.rankRewardsClaimed.includes(rank.id)} onClaim={() => claim(rank.id)} />)}</div>{RANKS.length > 4 && <button onClick={() => setExpanded(!expanded)} className="mt-3 btn-ghost w-full text-xs uppercase tracking-widest">{expanded ? <><ChevronUp size={15} /> Collapse ladder</> : <><ChevronDown size={15} /> Reveal all {RANKS.length} ranks</>}</button>}</section>

    <section className="rounded-[1.5rem] border border-white/10 bg-black/25 p-4 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.25em] text-ember-400">Live standings</p><h2 className="mt-1 font-display text-xl font-bold uppercase">Hunter Ladder</h2><p className="mt-1 text-xs text-ink-500">Top 100 hunters · sorted by performance</p></div><div className="flex flex-wrap gap-1.5">{SORT_OPTIONS.map(({ key, label, icon: Icon }) => <button key={key} onClick={() => changeSort(key)} className={`btn-ghost text-xs ${sortKey === key ? 'bg-ember-500/15 text-ember-400' : ''}`}><Icon size={13} /> {label}</button>)}<button onClick={() => void refresh()} className="btn-ghost text-xs"><RefreshCw size={13} /> Refresh</button></div></div>

      {topThree.length > 0 && !loading && <div className="mt-5 grid gap-2 md:grid-cols-3">{topThree.map((row, index) => { const rank = RANKS.find((r) => r.id === row.rank_id) ?? RANKS[0]; return <div key={row.user_id} className={`relative overflow-hidden rounded-2xl border p-4 ${index === 0 ? 'border-gold-400/30 bg-gold-500/[.06]' : 'border-white/5 bg-white/[.02]'}`}><ProfileBackdrop type={row.background_type} value={row.background_value} /><div className="relative flex items-center gap-3"><span className="font-display text-2xl font-black text-ink-500">#{index + 1}</span><UserAvatar avatar={row.avatar} rank={rank} size="sm" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{row.username}</p><p className="truncate text-[10px] uppercase tracking-wider text-ink-500">{row.rank_name}</p></div><div className="text-right"><p className="font-mono text-sm font-bold text-ink-100">{row.xp.toLocaleString()}</p><p className="text-[9px] uppercase text-ink-600">XP</p></div></div></div>; })}</div>}

      {myPosition > 0 && <div className="mt-3 flex items-center justify-between rounded-xl border border-ember-500/25 bg-ember-500/[.06] px-4 py-3"><span className="text-xs text-ink-300">Your current position</span><span className="font-mono text-sm font-bold text-ember-400">#{myPosition}</span></div>}
      <div className="mt-3 overflow-hidden rounded-xl border border-white/5">{loading ? <div className="py-12 text-center"><Users size={28} className="mx-auto mb-2 animate-pulse text-ink-500" /><p className="text-sm text-ink-400">Synchronizing hunters...</p></div> : rows.length === 0 ? <div className="py-12 text-center"><Users size={28} className="mx-auto mb-2 text-ink-600" /><p className="text-sm text-ink-400">No leaderboard data available.</p></div> : <div>{rows.map((row, index) => { const rank = RANKS.find((item) => item.id === row.rank_id) ?? RANKS[0]; const hasImage = /^https?:\/\//.test(row.avatar ?? '') || (row.avatar ?? '').startsWith('data:image/'); const isMe = row.user_id === user?.id; return <div key={row.user_id} className={`relative flex min-h-[68px] items-center gap-3 border-b border-white/5 px-3 py-3 last:border-b-0 sm:px-4 ${isMe ? 'bg-ember-500/[.08]' : 'hover:bg-white/[.025]'}`}><ProfileBackdrop type={row.background_type} value={row.background_value} /><span className={`relative z-10 w-7 shrink-0 text-center font-mono text-xs font-bold ${index < 3 ? 'text-gold-400' : 'text-ink-600'}`}>{index + 1}</span><div className="relative z-10 h-9 w-9 shrink-0">{hasImage ? <UserAvatar avatar={row.avatar} rank={rank} size="sm" /> : <RankBadge rank={rank} size="sm" compact />}</div><div className="relative z-10 min-w-0 flex-1"><p className="truncate text-sm font-semibold text-ink-100">{row.username} {isMe && <span className="text-[10px] font-bold text-ember-400">YOU</span>}</p><p className="truncate text-[10px] text-ink-500">{row.rank_name} · {row.streak} day streak · {row.discipline_score}% discipline</p></div><div className="relative z-10 shrink-0 text-right"><p className="font-mono text-sm font-bold text-ink-100">{row.xp.toLocaleString()}</p><p className="text-[9px] uppercase tracking-wider text-ink-600">XP</p></div></div>; })}</div>}</div>
    </section>
  </div>;
}
