import { useMemo, useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import {
  Award,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Crown,
  Dumbbell,
  Shield,
  Sparkles,
  Target,
  Trophy,
  Upload,
  Zap,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { useAuth } from '../lib/auth';
import { RANKS, getRankByXp, getNextRank } from '../data/ranks';
import { AURAS, BADGES, FRAMES, TITLES } from '../data/collections';
import { calculateAverageDiscipline, countFullClearDays, countTotalCompletedQuests } from '../lib/progression';
import { XpBar } from '../components/ui/XpBar';
import { UserAvatar } from '../components/ui/UserAvatar';
import { RankBadge } from '../components/ui/RankBadge';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { uploadBackground } from '../lib/backgroundUpload';
import { isSupabaseConfigured } from '../lib/supabase';
import { toast } from '../components/ui/Toast';

const BANNER_PRESETS = ['#1e1b4b', '#0c4a6e', '#14532d', '#4c1d95', '#0f172a', '#7f1d1d', '#78350f', '#831843'];

function formatDuration(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  return hours ? `${hours}h ${minutes}m` : `${minutes}m`;
}

export function Profile() {
  const { state, updateProfile, equipItem, unequipItem, claimRankReward } = useStore();
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const rank = getRankByXp(state.xp);
  const nextRank = getNextRank(state.xp);
  const completedQuests = countTotalCompletedQuests(state);
  const fullClearDays = countFullClearDays(state);
  const disciplineAverage = calculateAverageDiscipline(state);

  const equippedTitle = TITLES.find((item) => item.id === state.equipped.title);
  const equippedAura = AURAS.find((item) => item.id === state.equipped.aura);
  const equippedFrame = FRAMES.find((item) => item.id === state.equipped.frame);

  const unlockedTitles = useMemo(
    () =>
      state.inventory
        .filter((i) => i.type === 'title')
        .map((i) => TITLES.find((t) => t.id === i.id))
        .filter((x): x is NonNullable<typeof x> => Boolean(x)),
    [state.inventory],
  );
  const unlockedFrames = useMemo(
    () =>
      state.inventory
        .filter((i) => i.type === 'frame')
        .map((i) => FRAMES.find((f) => f.id === i.id))
        .filter((x): x is NonNullable<typeof x> => Boolean(x)),
    [state.inventory],
  );
  const unlockedAuras = useMemo(
    () =>
      state.inventory
        .filter((i) => i.type === 'aura')
        .map((i) => AURAS.find((a) => a.id === i.id))
        .filter((x): x is NonNullable<typeof x> => Boolean(x)),
    [state.inventory],
  );

  const claimableRanks = useMemo(
    () => RANKS.filter((r) => state.xp >= r.xpRequired && !state.rankRewardsClaimed.includes(r.id)),
    [state.xp, state.rankRewardsClaimed],
  );

  const recentRecord = useMemo(() => [...state.history].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6), [state.history]);

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
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
      toast({ title: 'Portrait updated', type: 'success' });
    } catch (error) {
      toast({ title: 'Upload failed', message: error instanceof Error ? error.message : 'Please try again.', type: 'error' });
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Hunter Identity"
        title="Hunter Profile"
        description="Your identity card, progression stats, and earned customization rewards unlocked through real activity."
        right={
          <div className="sv-surface px-4 py-2.5 flex items-center gap-2.5 text-xs font-mono">
            <span style={{ color: rank.color }}>{rank.emoji}</span>
            <strong style={{ color: rank.color }}>{rank.name}</strong>
          </div>
        }
      />

      {/* Identity Hero Card */}
      <section className="sv-surface overflow-hidden">
        <div
          className="h-20 sm:h-24 w-full border-b border-white/10"
          style={{
            background: `linear-gradient(125deg, ${state.bannerColor || '#1e1b4b'}cc, rgb(var(--ink-950)))`,
          }}
        />
        <div className="p-5 sm:p-7 -mt-12 sm:-mt-14 space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex flex-wrap items-end gap-4">
              <div className="relative">
                <UserAvatar avatar={state.avatar} rank={rank} size="xl" frameColor={equippedFrame?.color} />
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  disabled={uploading}
                  aria-label="Upload profile image"
                  title="Upload custom portrait"
                  className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-ink-900 text-ink-100 shadow-lg hover:border-ember-400 transition"
                >
                  <Upload size={15} />
                </button>
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleUpload}
                  hidden
                />
              </div>

              <div className="pb-1 min-w-0">
                <h2 className="font-display text-2xl sm:text-3xl font-bold truncate" style={{ color: state.nameColor || undefined }}>
                  {state.username || 'Hunter'}
                </h2>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-ink-300">
                  <Crown size={14} className="text-gold-400" />
                  <span>{equippedTitle?.name || 'No title equipped'}</span>
                  <span className="text-ink-600">·</span>
                  <span className="text-ink-400">{user?.email || 'Local profile'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <RankBadge rank={rank} size="md" auraColor={equippedAura?.color} />
              <div className="text-right">
                <span className="eyebrow-label block">Level</span>
                <strong className="font-display text-2xl font-bold tabular-nums text-ink-100">{state.level}</strong>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <XpBar xp={state.xp} />
            <div className="flex flex-wrap justify-between gap-2 text-xs text-ink-400 font-mono tabular-nums">
              <span>{state.xp.toLocaleString()} total XP</span>
              <span>
                {nextRank ? `${Math.max(0, nextRank.xpRequired - state.xp).toLocaleString()} XP to ${nextRank.name}` : 'Maximum rank reached'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Tracked KPIs */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={<Zap size={17} />} label="Total XP" value={state.xp.toLocaleString()} detail={`Level ${state.level}`} />
        <StatCard icon={<Target size={17} />} label="Quests Completed" value={String(completedQuests)} detail={`${fullClearDays} full-clear days`} />
        <StatCard
          icon={<Dumbbell size={17} />}
          label="Training Sessions"
          value={String(state.workoutSessions.length)}
          detail={`${formatDuration(state.totalWorkoutSeconds)} logged`}
        />
        <StatCard icon={<Shield size={17} />} label="Current Streak" value={`${state.streak} days`} detail={`Best: ${state.bestStreak} days`} />
      </section>

      {/* Claimable Rank Rewards */}
      {claimableRanks.length > 0 && (
        <section className="sv-surface p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="eyebrow-label text-gold-400">Rank Milestones Unlocked</p>
              <h2 className="mt-1 font-display text-lg font-bold text-ink-100">Claim Rank Rewards</h2>
            </div>
            <Sparkles size={18} className="text-gold-400" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {claimableRanks.map((r) => (
              <div key={r.id} className="glass-soft p-4 flex items-center justify-between gap-3 border-gold-500/35">
                <div className="min-w-0">
                  <p className="font-display text-sm font-bold" style={{ color: r.color }}>
                    {r.emoji} {r.name}
                  </p>
                  <p className="text-xs text-ink-400 truncate mt-0.5">
                    {r.rewards
                      .filter((rw) => rw.type === 'aura' || rw.type === 'title')
                      .map((rw) => rw.label)
                      .join(' · ')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    claimRankReward(r.id);
                    toast({ title: `${r.name} rewards claimed`, message: 'Added to your profile customization.', type: 'reward' });
                  }}
                  className="btn-primary !min-h-[40px] px-3 text-xs shrink-0"
                >
                  Claim
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Progression-Unlocked Customization (No Currency / No Shop) */}
      <section className="sv-surface p-5 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="eyebrow-label text-ember-400">Earned Loadout</p>
            <h2 className="mt-1 font-display text-xl font-bold text-ink-100">Profile Customization</h2>
            <p className="text-xs text-ink-400 mt-0.5">
              Titles, Frames, and Auras are earned exclusively by reaching Ranks, Milestones, and Boss Challenges.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="eyebrow-label">Banner:</span>
            <div className="flex gap-1.5">
              {BANNER_PRESETS.map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-label={`Set banner color ${color}`}
                  onClick={() => updateProfile({ bannerColor: color })}
                  style={{ background: color }}
                  className={`h-7 w-7 rounded-lg border-2 transition ${
                    state.bannerColor === color ? 'border-white scale-110' : 'border-transparent hover:scale-105'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Titles */}
          <div className="glass-soft p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="eyebrow-label text-gold-400">Titles ({unlockedTitles.length})</span>
              {state.equipped.title && (
                <button type="button" onClick={() => unequipItem('title')} className="text-xs text-ink-400 hover:text-ink-100">
                  Clear
                </button>
              )}
            </div>
            {unlockedTitles.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {unlockedTitles.map((t) => {
                  const active = state.equipped.title === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => (active ? unequipItem('title') : equipItem('title', t.id))}
                      className={`min-h-[40px] px-3 rounded-xl border text-xs font-semibold transition ${
                        active ? 'border-gold-400 bg-gold-500/20 text-gold-400' : 'border-white/10 bg-ink-950/60 text-ink-200 hover:border-white/25'
                      }`}
                    >
                      {t.name}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-ink-400">Earn rank milestones or clear Boss Challenges to unlock titles.</p>
            )}
          </div>

          {/* Frames */}
          <div className="glass-soft p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="eyebrow-label text-frost-400">Avatar Frames ({unlockedFrames.length})</span>
              {state.equipped.frame && (
                <button type="button" onClick={() => unequipItem('frame')} className="text-xs text-ink-400 hover:text-ink-100">
                  Clear
                </button>
              )}
            </div>
            {unlockedFrames.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {unlockedFrames.map((f) => {
                  const active = state.equipped.frame === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => (active ? unequipItem('frame') : equipItem('frame', f.id))}
                      className={`min-h-[40px] px-3 rounded-xl border text-xs font-semibold flex items-center gap-2 transition ${
                        active ? 'border-frost-400 bg-frost-500/15 text-ink-100' : 'border-white/10 bg-ink-950/60 text-ink-200 hover:border-white/25'
                      }`}
                    >
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: f.color }} />
                      <span>{f.name}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-ink-400">Complete Boss Challenges in Challenges to unlock avatar frames.</p>
            )}
          </div>

          {/* Auras */}
          <div className="glass-soft p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="eyebrow-label text-ember-400">Rank Auras ({unlockedAuras.length})</span>
              {state.equipped.aura && (
                <button type="button" onClick={() => unequipItem('aura')} className="text-xs text-ink-400 hover:text-ink-100">
                  Clear
                </button>
              )}
            </div>
            {unlockedAuras.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {unlockedAuras.map((a) => {
                  const active = state.equipped.aura === a.id;
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => (active ? unequipItem('aura') : equipItem('aura', a.id))}
                      className={`min-h-[40px] px-3 rounded-xl border text-xs font-semibold flex items-center gap-2 transition ${
                        active ? 'border-ember-400 bg-ember-500/20 text-ink-100' : 'border-white/10 bg-ink-950/60 text-ink-200 hover:border-white/25'
                      }`}
                    >
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: a.color }} />
                      <span>{a.name}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-ink-400">Claim Rank Rewards above as your XP increases.</p>
            )}
          </div>
        </div>
      </section>

      {/* Attributes & Recent Records */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <section className="sv-surface p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="eyebrow-label text-frost-400">Attribute Register</p>
              <h2 className="mt-1 font-display text-lg font-bold text-ink-100">Verified Metrics</h2>
            </div>
            <Target size={18} className="text-frost-400" />
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <AttrTile label="Strength" value={`${state.workoutSessions.length} sessions`} />
            <AttrTile label="Endurance" value={formatDuration(state.totalWorkoutSeconds)} />
            <AttrTile label="Discipline" value={disciplineAverage === null ? 'Not tracked' : `${disciplineAverage}% avg`} />
            <AttrTile label="Consistency" value={`${state.streak}-day streak`} />
            <AttrTile label="Mobility" value="Not tracked" />
            <AttrTile label="Focus" value="Not tracked" />
          </div>
        </section>

        <section className="sv-surface p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="eyebrow-label text-ember-400">Progression Log</p>
              <h2 className="mt-1 font-display text-lg font-bold text-ink-100">Recent Daily Records</h2>
            </div>
            <CalendarDays size={18} className="text-ember-400" />
          </div>
          {recentRecord.length > 0 ? (
            <div className="space-y-2">
              {recentRecord.map((day) => (
                <div key={day.date} className="glass-soft px-3.5 py-2.5 flex items-center gap-3">
                  <div className="text-emerald-400 shrink-0">
                    {day.allMainDone ? <CheckCircle2 size={17} /> : <Clock3 size={17} className="text-ink-400" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-mono font-bold text-ink-100">{day.date}</p>
                    <p className="text-[11px] text-ink-400">{day.allMainDone ? 'All main quests complete' : 'Recorded activity'}</p>
                  </div>
                  <strong className="font-mono text-xs font-bold tabular-nums text-ember-400">+{day.xpGained.toLocaleString()} XP</strong>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<CalendarDays size={18} />}
              title="No saved daily records yet"
              description="Complete quests or training sessions to log your daily progression."
            />
          )}
        </section>
      </div>

      {/* Achievement Honors */}
      <section className="sv-surface p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="eyebrow-label text-gold-400">Honors</p>
            <h2 className="mt-1 font-display text-lg font-bold text-ink-100">Earned Badges &amp; Honors</h2>
          </div>
          <Trophy size={18} className="text-gold-400" />
        </div>

        {state.achievements.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[...state.achievements]
              .sort((a, b) => b.unlockedAt - a.unlockedAt)
              .slice(0, 8)
              .map((item) => {
                const badge = BADGES.find((b) => b.id === item.id);
                return (
                  <div key={item.id} className="glass-soft p-3.5 flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold-500/15 text-gold-400">
                      {badge ? <span className="text-lg">{badge.emoji}</span> : <Award size={18} />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-ink-100 truncate capitalize">
                        {badge?.name || item.id.replace(/[_-]/g, ' ')}
                      </p>
                      <p className="text-[11px] font-mono text-ink-400">{new Date(item.unlockedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                );
              })}
          </div>
        ) : (
          <EmptyState
            icon={<Trophy size={18} />}
            title="No honors earned yet"
            description="Claim milestones and Boss Challenges to record honors on your profile."
          />
        )}

        <div className="grid grid-cols-3 gap-3 pt-3 border-t border-white/10 text-xs">
          <div className="glass-soft p-3">
            <span className="eyebrow-label block">Member Since</span>
            <strong className="mt-1 block font-mono text-ink-100">{new Date(state.createdAt).toLocaleDateString()}</strong>
          </div>
          <div className="glass-soft p-3">
            <span className="eyebrow-label block">Full-Clear Days</span>
            <strong className="mt-1 block font-mono tabular-nums text-ink-100">{fullClearDays}</strong>
          </div>
          <div className="glass-soft p-3">
            <span className="eyebrow-label block">Current Rank</span>
            <strong className="mt-1 block font-display" style={{ color: rank.color }}>
              {rank.name}
            </strong>
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({ icon, label, value, detail }: { icon: ReactNode; label: string; value: string; detail: string }) {
  return (
    <article className="sv-surface p-4 sm:p-5 flex items-start gap-3.5">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-ember-500/30 bg-ember-500/12 text-ember-400">
        {icon}
      </div>
      <div className="min-w-0">
        <span className="eyebrow-label block">{label}</span>
        <strong className="mt-1 block font-display text-2xl font-bold tabular-nums text-ink-100 truncate">{value}</strong>
        <p className="mt-0.5 text-xs text-ink-400 truncate">{detail}</p>
      </div>
    </article>
  );
}

function AttrTile({ label, value }: { label: string; value: string }) {
  const untracked = value === 'Not tracked';
  return (
    <div className="glass-soft p-3">
      <span className="eyebrow-label block">{label}</span>
      <strong className={`mt-1 block text-xs font-semibold tabular-nums ${untracked ? 'text-ink-500' : 'text-ink-100'}`}>{value}</strong>
    </div>
  );
}
