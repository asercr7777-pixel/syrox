import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, CSSProperties } from 'react';
import { useStore } from '../store/useStore';
import { useAuth } from '../lib/auth';
import { getRankByXp, getNextRank } from '../data/ranks';
import { XpBar } from '../components/ui/XpBar';
import { UserAvatar } from '../components/ui/UserAvatar';
import { WORKOUT_HISTORY_KEY, type WorkoutHistoryEntry } from '../components/SixDayWorkout';
import { uploadBackground } from '../lib/backgroundUpload';
import { isSupabaseConfigured } from '../lib/supabase';
import { toast } from '../components/ui/Toast';
import { Award, CalendarDays, Clock3, Dumbbell, Flame, Gauge, Shield, Target, Trophy, Upload, Zap } from 'lucide-react';

const formatDuration = (seconds: number) => {
  const safe = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  return hours ? `${hours}h ${minutes}m` : `${minutes}m`;
};

const formatDate = (timestamp: number) => new Date(timestamp).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
const formatTime = (timestamp: number) => new Date(timestamp).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

export function Profile() {
  const { state, updateProfile } = useStore();
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutHistoryEntry[]>([]);

  const rank = getRankByXp(state.xp);
  const nextRank = getNextRank(state.xp);
  const accountAgeDays = Math.max(1, Math.floor((Date.now() - state.createdAt) / 86400000));
  const totalTasks = useMemo(() => state.history.reduce((total, day) => total + Object.values(day.coreCompleted).filter(Boolean).length + Object.values(day.customCompleted).filter(Boolean).length, 0), [state.history]);
  const perfectDays = useMemo(() => state.history.filter((day) => day.allMainDone).length, [state.history]);
  const successRate = state.history.length ? Math.round((perfectDays / state.history.length) * 100) : 0;
  const totalWorkoutSeconds = useMemo(() => workoutHistory.reduce((sum, entry) => sum + Math.max(0, entry.durationSeconds), 0), [workoutHistory]);
  const clearedBosses = Object.values(state.storyBossDefeated).filter(Boolean).length;
  const clearedStoryMissions = Object.values(state.storyCompletedMissions).filter(Boolean).length;

  useEffect(() => {
    const loadHistory = () => {
      try {
        const raw = localStorage.getItem(WORKOUT_HISTORY_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        setWorkoutHistory(Array.isArray(parsed) ? parsed : []);
      } catch {
        setWorkoutHistory([]);
      }
    };
    loadHistory();
    window.addEventListener('storage', loadHistory);
    window.addEventListener('stryven-workout-history-updated', loadHistory);
    return () => {
      window.removeEventListener('storage', loadHistory);
      window.removeEventListener('stryven-workout-history-updated', loadHistory);
    };
  }, []);

  const handleAvatarUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type) || file.size > 2 * 1024 * 1024) {
      toast({ title: 'Invalid profile image', message: 'Use JPG, PNG, WebP or GIF up to 2MB.', type: 'error' });
      event.target.value = '';
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
      toast({ title: 'Hunter image updated', type: 'success' });
    } catch (error) {
      toast({ title: 'Upload failed', message: error instanceof Error ? error.message : 'Please try again.', type: 'error' });
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  return (
    <div className="stryven-character-sheet">
      <header className="character-sheet-header">
        <div>
          <p className="character-kicker">HUNTER // CHARACTER RECORD</p>
          <h1 className="character-title">Hunter Profile</h1>
          <p className="character-subtitle">Your identity, progression and field record in one command sheet.</p>
        </div>
        <div className="character-rank-mark" style={{ borderColor: `${rank.color}55`, color: rank.color }}>
          <span>{rank.emoji}</span><strong>{rank.name}</strong>
        </div>
      </header>

      <section className="character-identity">
        <div className="character-portrait">
          <UserAvatar avatar={state.avatar} rank={rank} size="lg" />
          <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading} className="character-upload" title="Upload profile image" aria-label="Upload profile image">
            <Upload size={15} className={uploading ? 'animate-spin' : ''} />
          </button>
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleAvatarUpload} className="hidden" />
        </div>
        <div className="character-identity-main">
          <span className="character-label">OPERATIVE</span>
          <h2 style={{ color: state.nameColor }}>{state.username || 'Hunter'}</h2>
          <div className="character-badges">
            <span className="character-badge" style={{ color: rank.color, borderColor: `${rank.color}40`, background: `${rank.color}12` }}>{rank.name}</span>
            <span className="character-badge">LEVEL {state.level}</span>
            <span className="character-badge">STREAK {state.streak}</span>
          </div>
          <div className="character-xp"><XpBar xp={state.xp} />{nextRank && <p><b>{Math.max(0, nextRank.xpRequired - state.xp).toLocaleString()}</b> XP until {nextRank.name}</p>}</div>
        </div>
        <div className="character-primary-stat"><span>TOTAL XP</span><strong>{state.xp.toLocaleString()}</strong><small>PROGRESSION</small></div>
      </section>

      <section className="character-stat-grid">
        <StatBox icon={Zap} label="Total XP" value={state.xp.toLocaleString()} color="#ff7a18" />
        <StatBox icon={Flame} label="Best Streak" value={`${state.bestStreak} days`} color="#f43f5e" />
        <StatBox icon={Dumbbell} label="Training Time" value={formatDuration(totalWorkoutSeconds)} color="#a855f7" />
        <StatBox icon={Target} label="Dungeons Cleared" value={String(state.dungeonsCleared)} color="#8b5cf6" />
        <StatBox icon={Gauge} label="Success Rate" value={`${successRate}%`} color="#10b981" />
      </section>

      <section className="character-panel">
        <PanelHeading eyebrow="PROGRESSION CORE" title="Hunter Overview" icon={<Shield size={19} />} />
        <div className="character-record-list">
          <Record icon={<Zap size={15} />} label="Current XP" value={state.xp.toLocaleString()} />
          <Record icon={<Trophy size={15} />} label="Level" value={String(state.level)} />
          <Record icon={<Flame size={15} />} label="Current Streak" value={`${state.streak} days`} />
          <Record icon={<Award size={15} />} label="Achievements" value={String(state.achievements.length)} />
          <Record icon={<Target size={15} />} label="Dungeons" value={String(state.dungeonsCleared)} />
          <Record icon={<Trophy size={15} />} label="Story Bosses" value={String(clearedBosses)} />
          <Record icon={<Target size={15} />} label="Story Objectives" value={String(clearedStoryMissions)} />
          <Record icon={<CalendarDays size={15} />} label="Perfect Days" value={String(perfectDays)} />
        </div>
      </section>

      <section className="character-panel">
        <PanelHeading eyebrow="FIELD PERFORMANCE" title="Combat Record" icon={<Gauge size={19} />} />
        <div className="character-stat-grid character-stat-grid-compact">
          <StatBox icon={Dumbbell} label="Sessions" value={String(workoutHistory.length)} color="#a855f7" />
          <StatBox icon={Clock3} label="Training Time" value={formatDuration(totalWorkoutSeconds)} color="#3b82f6" />
          <StatBox icon={Target} label="Tasks Done" value={String(totalTasks)} color="#10b981" />
          <StatBox icon={Trophy} label="Perfect Days" value={String(perfectDays)} color="#f59e0b" />
        </div>
      </section>

      <section className="character-panel character-history">
        <PanelHeading eyebrow="FIELD LOG" title="Workout History" icon={<Clock3 size={19} />} />
        {workoutHistory.length === 0 ? (
          <div className="character-empty">No completed workouts yet. Finish a session from Training and the field log will appear here.</div>
        ) : (
          <div className="character-history-list">
            {workoutHistory.slice(0, 12).map((entry) => (
              <div key={entry.id} className="character-history-row">
                <div><strong>{entry.dayName}</strong><span>{formatDate(entry.completedAt)} · Started {formatTime(entry.startedAt)}</span></div>
                <b><Clock3 size={14} />{formatDuration(entry.durationSeconds)}</b>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="character-panel character-account">
        <PanelHeading eyebrow="IDENTITY" title="Account Record" icon={<Shield size={19} />} />
        <div className="character-account-grid">
          {user?.email && <div><span>Email</span><strong>{user.email}</strong></div>}
          <div><span>Member Since</span><strong>{new Date(state.createdAt).toLocaleDateString()}</strong></div>
          <div><span>Account Age</span><strong>{accountAgeDays} days</strong></div>
          <div><span>System Theme</span><strong>{state.theme.toUpperCase()}</strong></div>
        </div>
      </section>
    </div>
  );
}

function PanelHeading({ eyebrow, title, icon }: { eyebrow: string; title: string; icon: React.ReactNode }) {
  return <div className="character-panel-heading"><div><span>{eyebrow}</span><h2>{title}</h2></div>{icon}</div>;
}

function Record({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div><span>{icon}{label}</span><strong>{value}</strong></div>;
}

function StatBox({ icon: Icon, label, value, color }: { icon: typeof Flame; label: string; value: string; color: string }) {
  return <div className="character-stat" style={{ '--stat-color': color } as CSSProperties}><div><Icon size={16} /></div><strong>{value}</strong><span>{label}</span></div>;
}
