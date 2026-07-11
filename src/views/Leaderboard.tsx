import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { useAuth } from '../lib/auth';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { getRankByXp, RANKS } from '../data/ranks';
import { RankBadge } from '../components/ui/RankBadge';
import { Crown, RefreshCw, Users, WifiOff, Trophy, Flame, Coins, Target } from 'lucide-react';
import { toast } from '../components/ui/Toast';

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
  const { state, syncLeaderboard } = useStore();
  const { user } = useAuth();
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>('xp');

  const fetchLeaderboard = async () => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('leaderboard')
        .select('*')
        .order(sortKey, { ascending: false })
        .limit(100);
      if (error) throw error;
      setRows(data as LeaderboardRow[] ?? []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortKey]);

  const handleRefresh = async () => {
    await syncLeaderboard();
    await fetchLeaderboard();
    toast({ title: 'Leaderboard refreshed', type: 'success' });
  };

  const myRank = getRankByXp(state.xp);
  const myPosition = rows.findIndex((r) => r.user_id === user?.id) + 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="section-title">Leaderboard</h1>
          <p className="text-sm text-ink-300">Compete with real hunters worldwide</p>
        </div>
        <button onClick={handleRefresh} className="btn-ghost text-sm">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Sort options */}
      <div className="flex gap-2 flex-wrap">
        <div className="flex gap-1 p-1 bg-ink-950/60 rounded-xl border border-white/5">
          {SORT_OPTIONS.map((s) => {
            const Icon = s.icon;
            return (
              <button
                key={s.key}
                onClick={() => setSortKey(s.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  sortKey === s.key ? 'bg-ember-500/20 text-ember-400' : 'text-ink-300'
                }`}
              >
                <Icon size={12} />
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* My position */}
      <div className="card p-4 border-ember-500/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-ember-500/20 flex items-center justify-center font-bold text-ember-400">
            {myPosition > 0 ? `#${myPosition}` : '—'}
          </div>
          <div className="flex-1">
            <p className="font-semibold">{state.username} (You)</p>
            <p className="text-xs text-ink-300">{myRank.emoji} {myRank.name} · {state.xp.toLocaleString()} XP · {state.streak} day streak</p>
          </div>
          <RankBadge rank={myRank} size="sm" />
        </div>
      </div>

      {/* Offline notice */}
      {!isSupabaseConfigured() && (
        <div className="card p-4 border-gold-500/30 flex items-center gap-3">
          <WifiOff size={20} className="text-gold-400" />
          <p className="text-sm text-ink-200">Live leaderboard unavailable.</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && rows.length === 0 && isSupabaseConfigured() && (
        <div className="card p-12 text-center">
          <Users size={40} className="mx-auto text-ink-400 mb-4" />
          <p className="text-lg font-display font-bold text-ink-200 mb-2">No players yet</p>
          <p className="text-sm text-ink-300">Be the first Hunter to join the leaderboard!</p>
        </div>
      )}

      {/* Top 3 podium */}
      {rows.length >= 3 && (
        <div className="grid grid-cols-3 gap-3">
          {[1, 0, 2].map((idx) => {
            const r = rows[idx];
            const place = idx + 1;
            const heights = ['h-32', 'h-40', 'h-28'];
            const colors = ['#c0c0c0', '#fbbf24', '#cd7f32'];
            const rank = RANKS.find((rk) => rk.id === r.rank_id) ?? RANKS[0];
            return (
              <div key={r.user_id} className={`card p-4 flex flex-col items-center justify-end ${heights[idx]} relative`}>
                {place === 1 && <Crown size={20} className="text-gold-400 absolute top-2" />}
                <RankBadge rank={rank} size="md" auraColor={r.aura_color} />
                <p className="font-semibold text-sm mt-2 truncate w-full text-center">{r.username}</p>
                <p className="text-xs text-ink-300">{r.xp.toLocaleString()} XP</p>
                <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mt-1" style={{ background: `${colors[idx]}30`, color: colors[idx] }}>
                  {place}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full list */}
      {loading ? (
        <div className="card p-8 text-center">
          <Users size={28} className="mx-auto text-ink-400 animate-pulse mb-2" />
          <p className="text-sm text-ink-300">Loading hunters...</p>
        </div>
      ) : rows.length > 0 ? (
        <div className="card p-3">
          <div className="space-y-1">
            {rows.map((r, i) => {
              const rank = RANKS.find((rk) => rk.id === r.rank_id) ?? RANKS[0];
              const isMe = r.user_id === user?.id;
              return (
                <div
                  key={r.user_id}
                  className={`flex items-center gap-3 p-3 rounded-xl transition ${
                    isMe ? 'bg-ember-500/10 border border-ember-500/30' : 'hover:bg-white/5'
                  }`}
                >
                  <span className="w-8 text-center font-bold text-ink-300">{i + 1}</span>
                  <RankBadge rank={rank} size="sm" auraColor={r.aura_color} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{r.username} {isMe && <span className="text-xs text-ember-400">(You)</span>}</p>
                    <p className="text-xs text-ink-300">{r.rank_emoji} {r.rank_name} · {r.streak} day streak · {r.discipline_score}% discipline</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold text-sm">{r.xp.toLocaleString()}</p>
                    <p className="text-xs text-ink-400">XP</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
