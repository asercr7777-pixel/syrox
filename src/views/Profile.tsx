import { useRef, useState } from 'react';
import { useStore } from '../store/useStore';
import { useAuth } from '../lib/auth';
import { AURAS, WEAPONS, TITLES, SHIELDS, FRAMES, RARITY_META } from '../data/collections';
import { getRankByXp, getNextRank } from '../data/ranks';
import { XpBar } from '../components/ui/XpBar';
import { AICommandCenter } from '../components/AICommandCenter';
import { Upload, Flame, Coins, Star, Zap, Dumbbell, Calendar, TrendingUp, Award, Shield, Swords, Sparkles, BookOpen, Target, Trophy } from 'lucide-react';
import { uploadBackground } from '../lib/backgroundUpload';
import { isSupabaseConfigured } from '../lib/supabase';
import { toast } from '../components/ui/Toast';

export function Profile() {
  const { state, updateProfile } = useStore();
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const rank = getRankByXp(state.xp); const nextRank = getNextRank(state.xp);
  const aura = state.equipped.aura ? AURAS.find((a) => a.id === state.equipped.aura) : null;
  const weapon = state.equipped.weapon ? WEAPONS.find((w) => w.id === state.equipped.weapon) : null;
  const title = state.equipped.title ? TITLES.find((t) => t.id === state.equipped.title) : null;
  const shield = state.equipped.shield ? SHIELDS.find((s) => s.id === state.equipped.shield) : null;
  const frame = state.equipped.frame ? FRAMES.find((f) => f.id === state.equipped.frame) : null;
  const accountAgeDays = Math.max(1, Math.floor((Date.now() - state.createdAt) / 86400000));
  const totalTasks = state.history.reduce((a, h) => a + Object.values(h.coreCompleted).filter(Boolean).length + Object.values(h.customCompleted).filter(Boolean).length, 0);
  const perfectDays = state.history.filter((h) => h.allMainDone).length;
  const successRate = state.history.length > 0 ? Math.round((perfectDays / state.history.length) * 100) : 0;
  const totalWorkoutMin = Math.floor(state.totalWorkoutSeconds / 60);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type) || file.size > 2 * 1024 * 1024) { toast({ title: 'Invalid profile image', message: 'Use JPG, PNG, WebP or GIF up to 2MB.', type: 'error' }); e.target.value = ''; return; }
    setUploading(true);
    try {
      if (user && isSupabaseConfigured()) {
        const result = await uploadBackground(user.id, file, 'image');
        if (result.error || !result.url) throw new Error(result.error || 'Upload failed');
        updateProfile({ avatar: result.url });
      } else {
        const url = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(file); });
        updateProfile({ avatar: url });
      }
      toast({ title: 'Profile image updated', type: 'success' });
    } catch (err) { toast({ title: 'Upload failed', message: err instanceof Error ? err.message : 'Please try again.', type: 'error' }); }
    finally { setUploading(false); e.target.value = ''; }
  };

  const equippedItems = [
    { type: 'Weapon', item: weapon, icon: Swords }, { type: 'Aura', item: aura, icon: Sparkles }, { type: 'Title', item: title, icon: Award }, { type: 'Shield', item: shield, icon: Shield }, { type: 'Frame', item: frame, icon: Star },
  ];
  const avatarIsImage = /^https?:\/\//.test(state.avatar) || state.avatar.startsWith('data:image/');

  return <div className="space-y-6">
    <div className="card-premium relative overflow-hidden p-4 sm:p-6 md:p-8 page-enter">
      <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ background: `radial-gradient(circle at 30% 0%, ${rank.glow}, transparent 60%)` }} />
      <div className="relative flex flex-col md:flex-row md:items-end gap-4">
        <div className="relative shrink-0">
          <div className="absolute -inset-3 rounded-full pointer-events-none" style={{ background: `radial-gradient(circle, ${aura?.color ?? rank.glow}35, transparent 70%)` }} />
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl flex items-center justify-center text-5xl bg-ink-900 border-4 overflow-hidden" style={{ borderColor: frame?.color ?? rank.color, boxShadow: `0 0 40px ${aura?.color ?? rank.glow}` }}>
            {avatarIsImage ? <img src={state.avatar} alt="Profile" className="h-full w-full object-cover" /> : state.avatar}
          </div>
          <button onClick={() => inputRef.current?.click()} disabled={uploading} className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-ink-900 text-ink-200 shadow-lg hover:text-white" title="Upload profile image"><Upload size={16} className={uploading ? 'animate-spin' : ''} /></button>
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleAvatarUpload} className="hidden" />
        </div>
        <div className="flex-1 min-w-0 pb-1"><h1 className="font-display text-2xl sm:text-3xl font-bold truncate" style={{ color: state.nameColor }}>{state.username}</h1><div className="mt-2 flex flex-wrap items-center gap-2"><span className="chip" style={{ background: `${rank.color}20`, color: rank.color, border: `1px solid ${rank.color}40` }}>{rank.emoji} {rank.name}</span><span className="chip bg-ink-800/60 text-ink-200 border border-white/5">Level {state.level}</span>{title && <span className="chip" style={{ background: `${RARITY_META[title.rarity]?.color ?? '#888'}20`, color: RARITY_META[title.rarity]?.color ?? '#888', border: `1px solid ${RARITY_META[title.rarity]?.color ?? '#888'}40` }}>{title.name}</span>}</div><p className="text-xs text-ink-400 mt-2">Click the image button to use your own profile picture.</p></div>
      </div>
      <div className="mt-5"><XpBar xp={state.xp} />{nextRank && <p className="text-xs text-ink-300 mt-2 text-center"><span className="text-ember-400 font-semibold">{(nextRank.xpRequired - state.xp).toLocaleString()}</span> XP to {nextRank.name} {nextRank.emoji}</p>}</div>
    </div>

    <div className="card-premium p-5"><h2 className="section-title mb-4 flex items-center gap-2"><Swords size={18} className="text-ember-400" /> Equipped Gear</h2><div className="grid grid-cols-2 md:grid-cols-5 gap-3">{equippedItems.map(({ type, item, icon: Icon }) => { const rarity = item ? (item as any).rarity : null; const meta = rarity ? RARITY_META[rarity as keyof typeof RARITY_META] : null; return <div key={type} className="rounded-xl border p-4 text-center" style={{ borderColor: meta ? `${meta.color}40` : 'rgba(255,255,255,.05)', background: meta ? `${meta.color}08` : 'rgba(255,255,255,.02)' }}><div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: meta ? `${meta.color}20` : 'rgba(255,255,255,.05)' }}><Icon size={20} style={{ color: meta?.color }} /></div><p className="text-xs text-ink-400 uppercase tracking-wider">{type}</p><p className="mt-1 truncate text-sm font-semibold" style={{ color: meta?.color }}>{item ? (item as any).name : 'Not equipped'}</p></div>; })}</div></div>

    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3"><StatBox icon={Zap} label="Total XP" value={state.xp.toLocaleString()} color="#ff7a18" /><StatBox icon={Coins} label="Coins" value={state.coins.toLocaleString()} color="#fbbf24" /><StatBox icon={Flame} label="Highest Streak" value={`${state.bestStreak} days`} color="#f43f5e" /><StatBox icon={Dumbbell} label="Workout Time" value={`${totalWorkoutMin} min`} color="#a855f7" /><StatBox icon={Calendar} label="Account Age" value={`${accountAgeDays} days`} color="#3b82f6" /><StatBox icon={TrendingUp} label="Success Rate" value={`${successRate}%`} color="#10b981" /></div>

    <div className="card-premium p-5"><h2 className="section-title mb-4 flex items-center gap-2"><BookOpen size={18} className="text-ember-400" /> Hunter Statistics</h2><div className="space-y-2.5">{[
      [Zap, 'Total XP Earned', state.xp.toLocaleString(), '#ff7a18'], [Star, 'Total Points', state.totalPoints.toLocaleString(), '#fbbf24'], [Flame, 'Current Streak', `${state.streak} days`, '#f43f5e'], [Award, 'Best Streak', `${state.bestStreak} days`, '#f43f5e'], [Dumbbell, 'Workout Sessions', String(state.workoutSessions.length), '#a855f7'], [Dumbbell, 'Total Workout Time', `${totalWorkoutMin} minutes`, '#a855f7'], [Target, 'Dungeons Cleared', String(state.dungeonsCleared), '#8b5cf6'], [Trophy, 'Achievements', String(state.achievements.length), '#f59e0b'], [Star, 'Inventory Items', String(state.inventory.length), '#10b981'], [Calendar, 'Account Age', `${accountAgeDays} days`, '#3b82f6'], [TrendingUp, 'Success Rate', `${successRate}%`, '#10b981'], [Star, 'Total Tasks Completed', String(totalTasks), '#10b981'], [Award, 'Perfect Days', String(perfectDays), '#10b981']
    ].map(([Icon, label, value, color]) => <div key={String(label)} className="flex items-center justify-between rounded-xl border border-white/5 bg-ink-950/40 p-3"><span className="flex items-center gap-2.5 text-sm text-ink-200"><Icon size={16} style={{ color: String(color) }} />{String(label)}</span><span className="text-sm font-bold" style={{ color: String(color) }}>{String(value)}</span></div>)}</div></div>

    {user && <div className="card-premium p-5"><h2 className="section-title mb-4">Account</h2><div className="space-y-2"><div className="flex items-center justify-between rounded-xl border border-white/5 bg-ink-950/40 p-3"><span className="text-sm text-ink-300">Email</span><span className="text-sm font-mono text-ink-200">{user.email}</span></div><div className="flex items-center justify-between rounded-xl border border-white/5 bg-ink-950/40 p-3"><span className="text-sm text-ink-300">Member Since</span><span className="text-sm text-ink-200">{new Date(state.createdAt).toLocaleDateString()}</span></div></div></div>}
    <AICommandCenter />
  </div>;
}

function StatBox({ icon: Icon, label, value, color }: { icon: typeof Flame; label: string; value: string; color: string }) { return <div className="card-premium p-3 sm:p-4"><div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: `${color}20`, color }}><Icon size={16} /></div><p className="truncate text-lg font-bold tabular-nums sm:text-xl">{value}</p><p className="text-xs text-ink-300">{label}</p></div>; }
