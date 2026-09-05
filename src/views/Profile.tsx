import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store/useStore';
import { useAuth } from '../lib/auth';
import { AURAS, WEAPONS, TITLES, SHIELDS, FRAMES, RARITY_META } from '../data/collections';
import { getRankByXp, getNextRank } from '../data/ranks';
import { XpBar } from '../components/ui/XpBar';
import { UserAvatar } from '../components/ui/UserAvatar';
import { WORKOUT_HISTORY_KEY, type WorkoutHistoryEntry } from '../components/SixDayWorkout';
import { Upload, Flame, Star, Zap, Dumbbell, Calendar, TrendingUp, Award, Shield, Swords, Sparkles, BookOpen, Target, Trophy, Clock } from 'lucide-react';
import { uploadBackground } from '../lib/backgroundUpload';
import { isSupabaseConfigured } from '../lib/supabase';
import { toast } from '../components/ui/Toast';

export function Profile() {
  const { state, updateProfile } = useStore();
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutHistoryEntry[]>([]);
  const rank = getRankByXp(state.xp);
  const nextRank = getNextRank(state.xp);
  const aura = state.equipped.aura ? AURAS.find((a) => a.id === state.equipped.aura) : null;
  const weapon = state.equipped.weapon ? WEAPONS.find((w) => w.id === state.equipped.weapon) : null;
  const title = state.equipped.title ? TITLES.find((t) => t.id === state.equipped.title) : null;
  const shield = state.equipped.shield ? SHIELDS.find((s) => s.id === state.equipped.shield) : null;
  const frame = state.equipped.frame ? FRAMES.find((f) => f.id === state.equipped.frame) : null;
  const accountAgeDays = Math.max(1, Math.floor((Date.now() - state.createdAt) / 86400000));
  const totalTasks = state.history.reduce((a, h) => a + Object.values(h.coreCompleted).filter(Boolean).length + Object.values(h.customCompleted).filter(Boolean).length, 0);
  const perfectDays = state.history.filter((h) => h.allMainDone).length;
  const successRate = state.history.length > 0 ? Math.round((perfectDays / state.history.length) * 100) : 0;
  const totalWorkoutSeconds = workoutHistory.reduce((sum, h) => sum + Math.max(0, h.durationSeconds), 0);
  const totalWorkoutMin = Math.floor(totalWorkoutSeconds / 60);
  const workoutSessions = workoutHistory.length;

  useEffect(() => {
    const loadHistory = () => {
      try {
        const raw = localStorage.getItem(WORKOUT_HISTORY_KEY);
        const value = raw ? JSON.parse(raw) : [];
        setWorkoutHistory(Array.isArray(value) ? value : []);
      } catch { setWorkoutHistory([]); }
    };
    loadHistory();
    window.addEventListener('storage', loadHistory);
    window.addEventListener('stryven-workout-history-updated', loadHistory);
    return () => {
      window.removeEventListener('storage', loadHistory);
      window.removeEventListener('stryven-workout-history-updated', loadHistory);
    };
  }, []);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type) || file.size > 2 * 1024 * 1024) {
      toast({ title: 'Invalid profile image', message: 'Use JPG, PNG, WebP or GIF up to 2MB.', type: 'error' });
      e.target.value = '';
      return;
    }
    setUploading(true);
    try {
      if (user && isSupabaseConfigured()) {
        const result = await uploadBackground(user.id, file, 'image');
        if (result.error || !result.url) throw new Error(result.error || 'Upload failed');
        updateProfile({ avatar: result.url });
      } else {
        const url = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        updateProfile({ avatar: url });
      }
      toast({ title: 'Profile image updated', type: 'success' });
    } catch (err) {
      toast({ title: 'Upload failed', message: err instanceof Error ? err.message : 'Please try again.', type: 'error' });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const equippedItems = [
    { type: 'Weapon', item: weapon, icon: Swords },
    { type: 'Aura', item: aura, icon: Sparkles },
    { type: 'Title', item: title, icon: Award },
    { type: 'Shield', item: shield, icon: Shield },
    { type: 'Frame', item: frame, icon: Star },
  ];
  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return h ? `${h}h ${m}m` : `${m}m ${s}s`;
  };
  const formatDate = (timestamp: number) => new Date(timestamp).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  const formatTime = (timestamp: number) => new Date(timestamp).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

  return (
    <div className="stryven-character-sheet">
      <header className="character-sheet-header">
        <div>
          <p className="character-kicker">HUNTER // CHARACTER RECORD</p>
          <h1 className="character-title">Hunter Profile</h1>
          <p className="character-subtitle">Your progression, combat identity and discipline record.</p>
        </div>
        <div className="character-rank-mark" style={{ borderColor: `${rank.color}55`, color: rank.color }}>
          <span>{rank.emoji}</span>
          <strong>{rank.name}</strong>
        </div>
      </header>

      <section className="character-identity">
        <div className="character-portrait">
          <UserAvatar avatar={state.avatar} rank={rank} size="lg" />
          <button onClick={() => inputRef.current?.click()} disabled={uploading} className="character-upload" title="Upload profile image">
            <Upload size={15} className={uploading ? 'animate-spin' : ''} />
          </button>
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleAvatarUpload} className="hidden" />
        </div>
        <div className="character-identity-main">
          <span className="character-label">OPERATIVE</span>
          <h2 style={{ color: state.nameColor }}>{state.username}</h2>
          <div className="character-badges">
            <span className="character-badge" style={{ color: rank.color, borderColor: `${rank.color}40`, background: `${rank.color}12` }}>{rank.name}</span>
            <span className="character-badge">LEVEL {state.level}</span>
            <span className="character-badge">STREAK {state.streak}</span>
            {title && <span className="character-badge" style={{ color: RARITY_META[title.rarity]?.color ?? '#aaa' }}>{title.name}</span>}
          </div>
          <div className="character-xp"><XpBar xp={state.xp} />{nextRank && <p><b>{(nextRank.xpRequired - state.xp).toLocaleString()}</b> XP until {nextRank.name}</p>}</div>
        </div>
        <div className="character-primary-stat">
          <span>TOTAL XP</span>
          <strong>{state.xp.toLocaleString()}</strong>
          <small>PROGRESSION</small>
        </div>
      </section>

      <section className="character-stat-grid">
        <StatBox icon={Zap} label="Total XP" value={state.xp.toLocaleString()} color="#ff7a18" />
        <StatBox icon={Flame} label="Highest Streak" value={`${state.bestStreak} days`} color="#f43f5e" />
        <StatBox icon={Dumbbell} label="Workout Time" value={`${totalWorkoutMin} min`} color="#a855f7" />
        <StatBox icon={Target} label="Dungeons" value={String(state.dungeonsCleared)} color="#8b5cf6" />
        <StatBox icon={TrendingUp} label="Success Rate" value={`${successRate}%`} color="#10b981" />
      </section>

      <section className="character-two-column">
        <div className="character-panel character-loadout">
          <div className="character-panel-heading"><div><span>LOADOUT</span><h2>Equipped Identity</h2></div><Swords size={19} /></div>
          <div className="character-equipment-grid">
            {equippedItems.map(({ type, item, icon: Icon }) => {
              const rarity = item ? (item as any).rarity : null;
              const meta = rarity ? RARITY_META[rarity as keyof typeof RARITY_META] : null;
              return <div key={type} className="character-equipment" style={{ borderColor: meta ? `${meta.color}35` : undefined }}>
                <div className="character-equipment-icon" style={{ color: meta?.color, background: meta ? `${meta.color}15` : undefined }}><Icon size={19} /></div>
                <span>{type}</span>
                <strong style={{ color: meta?.color }}>{item ? (item as any).name : 'Not equipped'}</strong>
              </div>;
            })}
          </div>
        </div>

        <div className="character-panel">
          <div className="character-panel-heading"><div><span>DISCIPLINE RECORD</span><h2>Performance</h2></div><BookOpen size={19} /></div>
          <div className="character-record-list">
            {[[Star, 'Total Points', state.totalPoints.toLocaleString(), '#fbbf24'], [Flame, 'Current Streak', `${state.streak} days`, '#f43f5e'], [Award, 'Best Streak', `${state.bestStreak} days`, '#f43f5e'], [Dumbbell, 'Workout Sessions', String(workoutSessions), '#a855f7'], [Trophy, 'Achievements', String(state.achievements.length), '#f59e0b'], [Calendar, 'Account Age', `${accountAgeDays} days`, '#3b82f6'], [TrendingUp, 'Perfect Days', String(perfectDays), '#10b981'], [Target, 'Tasks Completed', String(totalTasks), '#10b981']].map(([Icon, label, value, color]) => (
              <div key={String(label)}><span><Icon size={15} style={{ color: String(color) }} />{String(label)}</span><strong style={{ color: String(color) }}>{String(value)}</strong></div>
            ))}
          </div>
        </div>
      </section>

      <section className="character-panel character-history">
        <div className="character-panel-heading"><div><span>FIELD LOG</span><h2>Workout History</h2></div><Clock size={19} /></div>
        {workoutHistory.length === 0 ? <div className="character-empty">No completed workouts yet. Finish a workout from Training and it will appear here.</div> : <div className="character-history-list">{workoutHistory.map((entry) => <div key={entry.id} className="character-history-row"><div><strong>{entry.dayName}</strong><span>{formatDate(entry.completedAt)} · Started {formatTime(entry.startedAt)}</span></div><b><Clock size={14} />{formatDuration(entry.durationSeconds)}</b></div>)}</div>}
      </section>

      {user && <section className="character-panel character-account">
        <div className="character-panel-heading"><div><span>IDENTITY</span><h2>Account</h2></div><Shield size={19} /></div>
        <div className="character-account-grid"><div><span>Email</span><strong>{user.email}</strong></div><div><span>Member Since</span><strong>{new Date(state.createdAt).toLocaleDateString()}</strong></div></div>
      </section>}
    </div>
  );
}

function StatBox({ icon: Icon, label, value, color }: { icon: typeof Flame; label: string; value: string; color: string }) {
  return <div className="character-stat" style={{ '--stat-color': color } as React.CSSProperties}><div><Icon size={16} /></div><strong>{value}</strong><span>{label}</span></div>;
}
