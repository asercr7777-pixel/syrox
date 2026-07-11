import { useStore } from '../store/useStore';
import { useAuth } from '../lib/auth';
import { AURAS, WEAPONS, TITLES, SHIELDS, FRAMES, RARITY_META } from '../data/collections';
import { getRankByXp, getNextRank } from '../data/ranks';
import { RankBadge } from '../components/ui/RankBadge';
import { XpBar } from '../components/ui/XpBar';
import { Flame, Coins, Star, Zap, Dumbbell, Calendar, TrendingUp, Award, Shield, Swords, Sparkles, BookOpen, Target, Trophy } from 'lucide-react';

export function Profile() {
  const { state } = useStore();
  const { user } = useAuth();
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
  const totalWorkoutMin = Math.floor(state.totalWorkoutSeconds / 60);
  const dungeonsCleared = state.dungeonsCleared;
  const inventoryCount = state.inventory.length;
  const achievementsCount = state.achievements.length;

  const equippedItems = [
    { type: 'Weapon', item: weapon, icon: Swords, placeholder: '⚔️' },
    { type: 'Aura', item: aura, icon: Sparkles, placeholder: '✨' },
    { type: 'Title', item: title, icon: Award, placeholder: '🏷️' },
    { type: 'Shield', item: shield, icon: Shield, placeholder: '🛡️' },
    { type: 'Frame', item: frame, icon: Star, placeholder: '🖼️' },
  ];

  return (
    <div className="space-y-6">
      {/* Profile Hero Card */}
      <div className="card-premium p-6 md:p-8 relative overflow-hidden page-enter">
        <div
          className="absolute inset-0 opacity-40 pointer-events-none"
          style={{ background: `radial-gradient(circle at 30% 0%, ${rank.glow}, transparent 60%)` }}
        />
        {/* Banner */}
        <div
          className="h-28 md:h-32 rounded-xl mb-4 relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${state.bannerColor}, ${state.bannerColor}80)` }}
        >
          <div className="absolute inset-0 bg-grid opacity-30" />
          <div
            className="absolute inset-0 opacity-50"
            style={{ background: `radial-gradient(circle at 50% 100%, ${aura?.color ?? rank.glow}40, transparent 70%)` }}
          />
        </div>
        <div className="relative flex flex-col md:flex-row md:items-end gap-4 -mt-16 md:-mt-20">
          {/* Avatar with aura ring */}
          <div className="relative flex-shrink-0">
            {aura && (
              <div
                className="absolute -inset-3 rounded-full pointer-events-none"
                style={{
                  background: `radial-gradient(circle, ${aura.color}30, transparent 70%)`,
                  animation: 'pulseGlow 3s ease-in-out infinite',
                }}
              />
            )}
            <div
              className="w-24 h-24 md:w-28 md:h-28 rounded-2xl flex items-center justify-center text-5xl md:text-6xl bg-ink-900 border-4 relative"
              style={{ borderColor: frame?.color ?? rank.color, boxShadow: `0 0 40px ${aura?.color ?? rank.glow}` }}
            >
              {state.avatar}
            </div>
          </div>
          <div className="flex-1 pb-2">
            <h1 className="font-display text-2xl md:text-3xl font-bold" style={{ color: state.nameColor, textShadow: `0 0 20px ${rank.glow}40` }}>
              {state.username}
            </h1>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span
                className="chip"
                style={{ background: `${rank.color}20`, color: rank.color, border: `1px solid ${rank.color}40` }}
              >
                {rank.emoji} {rank.name}
              </span>
              <span className="chip bg-ink-800/60 text-ink-200 border border-white/5">
                Level {state.level}
              </span>
              {title && (
                <span
                  className="chip"
                  style={{
                    background: `${RARITY_META[title.rarity].color}20`,
                    color: RARITY_META[title.rarity].color,
                    border: `1px solid ${RARITY_META[title.rarity].color}40`,
                  }}
                >
                  {title.name}
                </span>
              )}
            </div>
            <p className="text-xs text-ink-400 mt-1.5 italic">{rank.description}</p>
          </div>
        </div>
        <div className="mt-4">
          <XpBar xp={state.xp} />
          {nextRank && (
            <p className="text-xs text-ink-300 mt-2 text-center">
              <span className="text-ember-400 font-semibold">{(nextRank.xpRequired - state.xp).toLocaleString()}</span> XP to {nextRank.name} {nextRank.emoji}
            </p>
          )}
        </div>
      </div>

      {/* Equipped Gear */}
      <div className="card-premium p-5 page-enter" style={{ animationDelay: '0.05s' }}>
        <h2 className="section-title mb-4 flex items-center gap-2">
          <Swords size={18} className="text-ember-400" />
          Equipped Gear
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {equippedItems.map(({ type, item, icon: Icon, placeholder }, i) => {
            const rarity = item ? (item as any).rarity : null;
            const meta = rarity ? RARITY_META[rarity as keyof typeof RARITY_META] : null;
            return (
              <div
                key={type}
                className={`p-4 rounded-xl border text-center stagger-in transition-all hover:-translate-y-0.5 ${
                  meta ? 'glow-ring' : ''
                }`}
                style={{
                  borderColor: meta ? `${meta.color}40` : 'rgba(255,255,255,0.05)',
                  background: meta ? `${meta.color}08` : 'rgba(255,255,255,0.02)',
                  ['--glow-color' as any]: meta?.color,
                  animationDelay: `${i * 0.05}s`,
                }}
              >
                <div
                  className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center mb-2 transition-transform hover:scale-110"
                  style={{ background: meta ? `${meta.color}20` : 'rgba(255,255,255,0.05)' }}
                >
                  <Icon size={20} style={{ color: meta?.color }} className={meta ? '' : 'text-ink-400'} />
                </div>
                <p className="text-xs text-ink-400 uppercase tracking-wider mb-1">{type}</p>
                {item ? (
                  <>
                    <p className="text-sm font-semibold truncate" style={{ color: meta?.color }}>
                      {(item as any).name}
                    </p>
                    {rarity && (
                      <p className="text-[10px] uppercase font-semibold mt-0.5" style={{ color: meta?.color }}>
                        {meta?.label}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-ink-500">Not equipped</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatBox icon={Zap} label="Total XP" value={state.xp.toLocaleString()} color="#ff7a18" index={0} />
        <StatBox icon={Coins} label="Coins" value={state.coins.toLocaleString()} color="#fbbf24" index={1} />
        <StatBox icon={Flame} label="Highest Streak" value={`${state.bestStreak} days`} color="#f43f5e" index={2} />
        <StatBox icon={Dumbbell} label="Workout Time" value={`${totalWorkoutMin} min`} color="#a855f7" index={3} />
        <StatBox icon={Calendar} label="Account Age" value={`${accountAgeDays} days`} color="#3b82f6" index={4} />
        <StatBox icon={TrendingUp} label="Success Rate" value={`${successRate}%`} color="#10b981" index={5} />
      </div>

      {/* Detailed Stats */}
      <div className="card-premium p-5 page-enter" style={{ animationDelay: '0.1s' }}>
        <h2 className="section-title mb-4 flex items-center gap-2">
          <BookOpen size={18} className="text-ember-400" />
          Hunter Statistics
        </h2>
        <div className="space-y-2.5">
          <StatRow icon={Zap} label="Total XP Earned" value={state.xp.toLocaleString()} color="#ff7a18" />
          <StatRow icon={Star} label="Total Points" value={state.totalPoints.toLocaleString()} color="#fbbf24" />
          <StatRow icon={Flame} label="Current Streak" value={`${state.streak} days`} color="#f43f5e" />
          <StatRow icon={Award} label="Best Streak" value={`${state.bestStreak} days`} color="#f43f5e" />
          <StatRow icon={Dumbbell} label="Workout Sessions" value={state.workoutSessions.length.toString()} color="#a855f7" />
          <StatRow icon={Dumbbell} label="Total Workout Time" value={`${totalWorkoutMin} minutes`} color="#a855f7" />
          <StatRow icon={Target} label="Dungeons Cleared" value={dungeonsCleared.toString()} color="#8b5cf6" />
          <StatRow icon={Trophy} label="Achievements" value={achievementsCount.toString()} color="#f59e0b" />
          <StatRow icon={Star} label="Inventory Items" value={inventoryCount.toString()} color="#10b981" />
          <StatRow icon={Calendar} label="Account Age" value={`${accountAgeDays} days`} color="#3b82f6" />
          <StatRow icon={TrendingUp} label="Success Rate (Perfect Days)" value={`${successRate}%`} color="#10b981" />
          <StatRow icon={Star} label="Total Tasks Completed" value={totalTasks.toString()} color="#10b981" />
          <StatRow icon={Award} label="Perfect Days" value={perfectDays.toString()} color="#10b981" />
        </div>
      </div>

      {/* Account Info */}
      {user && (
        <div className="card-premium p-5 page-enter" style={{ animationDelay: '0.15s' }}>
          <h2 className="section-title mb-4">Account</h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 rounded-xl bg-ink-950/40 border border-white/5">
              <span className="text-sm text-ink-300">Email</span>
              <span className="text-sm font-mono text-ink-200">{user.email}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-ink-950/40 border border-white/5">
              <span className="text-sm text-ink-300">Member Since</span>
              <span className="text-sm text-ink-200">{new Date(state.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatBox({ icon: Icon, label, value, color, index }: { icon: typeof Flame; label: string; value: string; color: string; index: number }) {
  return (
    <div className="card-premium p-4 stagger-in" style={{ animationDelay: `${index * 0.05}s` }}>
      <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-2" style={{ background: `${color}20`, color }}>
        <Icon size={18} />
      </div>
      <p className="text-xl font-bold tabular-nums">{value}</p>
      <p className="text-xs text-ink-300">{label}</p>
    </div>
  );
}

function StatRow({ icon: Icon, label, value, color }: { icon: typeof Flame; label: string; value: string; color: string }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-ink-950/40 border border-white/5 hover:border-white/10 transition-colors">
      <span className="flex items-center gap-2.5 text-sm text-ink-200">
        <Icon size={16} style={{ color }} />
        {label}
      </span>
      <span className="text-sm font-bold tabular-nums" style={{ color }}>
        {value}
      </span>
    </div>
  );
}
