import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { useAuth } from '../lib/auth';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { RANKS, getRankByXp, getRankIndex, getNextRank, type Rank } from '../data/ranks';
import { RankBadge } from '../components/ui/RankBadge';
import { UserAvatar } from '../components/ui/UserAvatar';
import { Crown, RefreshCw, Users, Trophy, Flame, Coins, Target, Lock, Check, Zap, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
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

type SortKey = 'xp' | 'streak' | 'total_points' | 'discipline_score';
interface LeaderboardRow { user_id: string; username: string; avatar: string; xp: number; level: number; total_points: number; streak: number; discipline_score: number; tasks_completed: number; rank_id: string; rank_name: string; rank_emoji: string; aura_color: string; background_type?: 'default' | 'image' | 'video' | 'animated' | null; background_value?: string | null; }
const SORT_OPTIONS: { key: SortKey; label: string; icon: typeof Trophy }[] = [
  { key: 'xp', label: 'XP', icon: Trophy }, { key: 'discipline_score', label: 'Discipline', icon: Target }, { key: 'streak', label: 'Streak', icon: Flame }, { key: 'total_points', label: 'Points', icon: Coins },
];

function RankCard({ rank, index, currentXp, claimed, onClaim }: { rank: Rank; index: number; currentXp: number; claimed: boolean; onClaim: () => void }) {
  const style = TIER_STYLES[rank.tier];
  const unlocked = currentXp >= rank.xpRequired;
  const current = getRankByXp(currentXp).id === rank.id;
  const previous = index > 0 ? RANKS[index - 1] : null;
  const progress = unlocked ? 100 : previous ? Math.min(100, ((currentXp - previous.xpRequired) / (rank.xpRequired - previous.xpRequired)) * 100) : 0;
  return <div className={`card p-4 relative overflow-hidden ${style.border} bg-gradient-to-br ${style.bg}`} style={{ boxShadow: unlocked ? `0 0 30px ${style.glow}` : 'none' }}>
    <div className="absolute top-3 right-3">{current ? <span className="chip bg-ember-500/20 text-ember-400 border border-ember-500/40"><Zap size={10} /> Current</span> : unlocked ? <span className="chip bg-emerald2-500/20 text-emerald2-400 border border-emerald2-500/40"><Check size={10} /> Unlocked</span> : <span className="chip bg-ink-800 text-ink-400 border border-white/5"><Lock size={10} /> Locked</span>}</div>
    <div className="flex items-start gap-3 mb-3"><RankBadge rank={rank} size="md" /><div className="min-w-0 flex-1"><p className="text-xs text-ink-400 font-mono">RANK {String(index + 1).padStart(2, '0')}</p><h3 className="font-display text-lg font-bold truncate" style={{ color: unlocked ? rank.color : undefined }}>{rank.name}</h3><p className="text-xs text-ink-300 mt-0.5">{rank.description}</p></div></div>
    <div className="flex justify-between text-xs mb-1.5"><span className="text-ink-300">XP Required</span><span className="font-bold" style={{ color: rank.color }}>{rank.xpRequired.toLocaleString()} XP</span></div>
    <div className="h-2 bg-ink-950 rounded-full overflow-hidden mb-3"><div className="h-full rounded-full" style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${rank.color}, ${style.particle})` }} /></div>
    {unlocked && !claimed && rank.rewards.length > 0 && <button onClick={onClaim} className="btn-primary w-full text-sm"><Sparkles size={14} /> Claim Rewards</button>}
    {unlocked && claimed && <div className="w-full py-2 rounded-xl bg-emerald2-500/10 border border-emerald2-500/30 text-center text-xs font-semibold text-emerald2-400"><Check size={14} className="inline mr-1" /> Rewards Claimed</div>}
  </div>;
}

function ProfileBackdrop({ type, value }: { type?: LeaderboardRow['background_type']; value?: string | null }) {
  if (!value || (type !== 'image' && type !== 'video')) return null;
  return <div className="absolute inset-0 overflow-hidden pointer-events-none"><div className="absolute inset-0 bg-black/55" />{type === 'video' ? <video src={value} autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover opacity-35" /> : <div className="absolute inset-0 bg-cover bg-center opacity-35" style={{ backgroundImage: `url("${value}")` }} />}</div>;
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
  const progress = nextRank ? Math.min(100, Math.round(((state.xp - currentRank.xpRequired) / (nextRank.xpRequired - currentRank.xpRequired)) * 100)) : 100;

  return <div className="space-y-6">
    <section className="space-y-4"><div className="card p-5"><div className="flex items-center gap-2 mb-2"><Crown size={22} className="text-gold-400" /><h1 className="section-title">Rank Progression</h1></div><p className="text-sm text-ink-300">You are <span className="font-bold" style={{ color: currentRank.color }}>{currentRank.name}</span> · Rank {currentIndex + 1} of {RANKS.length}</p><div className="mt-3 h-3 bg-ink-950 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-ember-500 to-gold-500 rounded-full" style={{ width: `${progress}%` }} /></div></div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">{visibleRanks.map((rank, index) => <RankCard key={rank.id} rank={rank} index={index} currentXp={state.xp} claimed={state.rankRewardsClaimed.includes(rank.id)} onClaim={() => claim(rank.id)} />)}</div>
      {RANKS.length > 4 && <button onClick={() => setExpanded(!expanded)} className="btn-ghost w-full text-sm">{expanded ? <><ChevronUp size={16} /> Show Less</> : <><ChevronDown size={16} /> Show All {RANKS.length} Ranks</>}</button>}
    </section>
    <div className="flex items-center justify-between flex-wrap gap-3"><div><h2 className="section-title">Global Leaderboard</h2><p className="text-sm text-ink-300">Compete with real hunters worldwide</p></div><div className="flex gap-2 flex-wrap">{SORT_OPTIONS.map(({ key, label, icon: Icon }) => <button key={key} onClick={() => changeSort(key)} className={`btn-ghost text-xs ${sortKey === key ? 'bg-ember-500/15 text-ember-400' : ''}`}><Icon size={14} /> {label}</button>)}<button onClick={() => void refresh()} className="btn-ghost text-xs"><RefreshCw size={14} /> Refresh</button></div></div>
    {myPosition > 0 && <div className="card p-3 border-ember-500/30 bg-ember-500/5"><p className="text-xs text-ink-300">Your position</p><div className="flex justify-between mt-1"><span className="font-bold text-ember-400">#{myPosition}</span><span className="text-sm font-mono">{state.xp.toLocaleString()} XP</span></div></div>}
    {loading ? <div className="card p-8 text-center"><Users size={28} className="mx-auto text-ink-400 animate-pulse mb-2" /><p className="text-sm text-ink-300">Loading hunters...</p></div> : <div className="card p-3"><div className="space-y-1">{rows.map((row, index) => { const rank = RANKS.find((item) => item.id === row.rank_id) ?? RANKS[0]; const hasImage = /^https?:\/\//.test(row.avatar ?? '') || (row.avatar ?? '').startsWith('data:image/'); const isMe = row.user_id === user?.id; return <div key={row.user_id} className={`relative overflow-hidden flex items-center gap-3 p-3 rounded-xl min-h-[64px] ${isMe ? 'bg-ember-500/10 border border-ember-500/30' : 'hover:bg-white/5'}`}><ProfileBackdrop type={row.background_type} value={row.background_value} /><span className="relative z-10 w-8 shrink-0 text-center font-bold text-ink-300">{index + 1}</span><div className="relative z-10 w-10 h-10 shrink-0 flex items-center justify-center">{hasImage ? <UserAvatar avatar={row.avatar} rank={rank} size="sm" /> : <RankBadge rank={rank} size="sm" compact />}</div><div className="relative z-10 flex-1 min-w-0"><p className="font-semibold truncate">{row.username} {isMe && <span className="text-xs text-ember-400">(You)</span>}</p><p className="text-xs text-ink-300 truncate">{row.rank_name} · {row.streak} day streak · {row.discipline_score}% discipline</p></div><div className="relative z-10 text-right shrink-0"><p className="font-mono font-bold text-sm">{row.xp.toLocaleString()}</p><p className="text-xs text-ink-400">XP</p></div></div>; })}</div></div>}
  </div>;
}
