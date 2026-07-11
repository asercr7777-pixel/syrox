import { useStore } from '../store/useStore';
import { RARITY_META } from '../data/collections';
import { isAtOrAbove } from '../data/ranks';
import { Trophy, Lock, Check } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from '../components/ui/Toast';
import { triggerConfetti } from '../components/ui/Confetti';

interface AchievementDef {
  id: string;
  name: string;
  description: string;
  emoji: string;
  rarity: keyof typeof RARITY_META;
  check: (s: any) => boolean;
  reward: string;
}

const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first_steps', name: 'First Steps', description: 'Complete your first task.', emoji: '👣', rarity: 'common', check: (s) => s.totalPoints > 0, reward: '50 XP' },
  { id: 'week_streak', name: 'Week Warrior', description: 'Maintain a 7-day streak.', emoji: '🔥', rarity: 'rare', check: (s) => s.bestStreak >= 7, reward: '200 XP + Rare Title' },
  { id: 'month_streak', name: 'Iron Discipline', description: 'Maintain a 30-day streak.', emoji: '⛓️', rarity: 'epic', check: (s) => s.bestStreak >= 30, reward: '1000 XP + Epic Aura' },
  { id: 'first_dungeon', name: 'Dungeon Clearer', description: 'Clear your first dungeon.', emoji: '🏰', rarity: 'rare', check: (s) => s.dungeonsCleared >= 1, reward: '150 XP' },
  { id: 'boss_slayer', name: 'Boss Slayer', description: 'Defeat the Dungeon Boss.', emoji: '💀', rarity: 'legendary', check: (s) => s.bossDefeated, reward: 'Legendary Aura + Title' },
  { id: 'dungeon_conqueror', name: 'Dungeon Conqueror', description: 'Clear 10 dungeons.', emoji: '👑', rarity: 'legendary', check: (s) => s.dungeonsCleared >= 10, reward: '1000 XP + Exclusive Title' },
  { id: 'rank_d', name: 'Awakened', description: 'Reach D-Rank.', emoji: '🟢', rarity: 'rare', check: (s) => isAtOrAbove(s.xp, 'D'), reward: '100 XP' },
  { id: 'rank_s', name: 'S-Class', description: 'Reach S-Rank.', emoji: '🔥', rarity: 'epic', check: (s) => isAtOrAbove(s.xp, 'S'), reward: '500 XP' },
  { id: 'rank_shadow', name: 'Shadow Hunter', description: 'Reach Shadow Hunter rank.', emoji: '🐺', rarity: 'legendary', check: (s) => isAtOrAbove(s.xp, 'SHADOW_HUNTER'), reward: 'Legendary Aura' },
  { id: 'rank_monarch', name: 'The Monarch', description: 'Reach Mr. BYDA rank.', emoji: '👑', rarity: 'secret', check: (s) => isAtOrAbove(s.xp, 'MR_BYDA'), reward: 'Secret Aura + Title' },
  { id: 'aura_collector', name: 'Aura Collector', description: 'Own 10 different auras.', emoji: '✨', rarity: 'epic', check: (s) => s.inventory.filter((i: any) => i.type === 'aura').length >= 10, reward: 'Epic Aura' },
  { id: 'legendary_aura', name: 'Legendary Aura', description: 'Obtain a legendary aura.', emoji: '🌟', rarity: 'legendary', check: (s) => s.inventory.some((i: any) => i.type === 'aura' && i.id === 'shadow_monarch'), reward: 'Title' },
  { id: 'secret_finder', name: 'Secret Finder', description: 'Discover a secret dungeon.', emoji: '🗝️', rarity: 'secret', check: (s) => s.dungeonsCleared > 0 && s.secretDungeonAvailable, reward: 'Rare Title' },
  { id: 'perfect_day', name: 'Perfect Day', description: 'Complete all main tasks in one day.', emoji: '💯', rarity: 'epic', check: (s) => s.mainTasks.filter((t: any) => t.enabled).length > 0 && s.mainTasks.filter((t: any) => t.enabled).every((t: any) => s.coreCompleted[t.id]), reward: '200 XP' },
  { id: 'spin_lucky', name: 'Lucky Spin', description: 'Win a rare+ reward from the spin wheel.', emoji: '🎡', rarity: 'rare', check: (s) => s.lastSpinRewardId === 'aura' || s.lastSpinRewardId === 'weapon' || s.lastSpinRewardId === 'chest', reward: '100 XP' },
  { id: 'no_skip', name: 'No Skip November', description: '30 days without missing a main task.', emoji: '🛡️', rarity: 'mythic', check: (s) => s.bestStreak >= 30, reward: 'Mythic Title' },
  // Easter eggs
  { id: 'easter_shadow', name: 'Shadow Whisperer', description: 'Hidden achievement. Type "shadow" in the AI chat.', emoji: '🌑', rarity: 'secret', check: (s) => s.easterEggsFound.includes('shadow'), reward: 'Secret Aura' },
  { id: 'easter_monarch', name: 'Rise of the Monarch', description: 'Hidden achievement. Reach level 50.', emoji: '👑', rarity: 'secret', check: (s) => s.level >= 50, reward: 'Secret Title' },
];

export function Achievements() {
  const { state, unlockAchievements, foundEasterEgg } = useStore();

  // Check for newly unlocked achievements
  useEffect(() => {
    const newlyUnlocked: AchievementDef[] = [];
    for (const a of ACHIEVEMENTS) {
      const already = state.achievements.some((x) => x.id === a.id);
      if (!already && a.check(state)) {
        newlyUnlocked.push(a);
      }
    }
    if (newlyUnlocked.length > 0) {
      unlockAchievements(newlyUnlocked.map((a) => a.id));
      newlyUnlocked.forEach((a) => {
        toast({ title: `Achievement Unlocked!`, message: `${a.emoji} ${a.name}`, type: 'reward', icon: a.emoji });
      });
      if (newlyUnlocked.some((a) => a.rarity === 'legendary' || a.rarity === 'secret')) {
        triggerConfetti(80);
      }
    }
    // Easter egg: check chat for "shadow"
    if (state.chat.some((m) => m.role === 'user' && m.text.toLowerCase().includes('shadow')) && !state.easterEggsFound.includes('shadow')) {
      foundEasterEgg('shadow');
      toast({ title: 'Easter Egg Found!', message: '🌑 Shadow Whisperer', type: 'reward', icon: '🌑' });
    }
  }, [state, unlockAchievements, foundEasterEgg]);

  const unlockedCount = state.achievements.length;
  const totalCount = ACHIEVEMENTS.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-title">Achievements</h1>
        <p className="text-sm text-ink-300">{unlockedCount} / {totalCount} unlocked</p>
      </div>

      {/* Progress bar */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Trophy size={18} className="text-gold-400" />
            <span className="font-semibold">Completion</span>
          </div>
          <span className="text-sm font-mono">{Math.round((unlockedCount / totalCount) * 100)}%</span>
        </div>
        <div className="h-2.5 bg-ink-950 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-gold-500 to-ember-500 rounded-full transition-all duration-500"
            style={{ width: `${(unlockedCount / totalCount) * 100}%` }}
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {ACHIEVEMENTS.map((a) => {
          const unlocked = state.achievements.some((x) => x.id === a.id);
          const meta = RARITY_META[a.rarity];
          return (
            <div
              key={a.id}
              className={`card p-4 relative overflow-hidden transition-all ${
                unlocked ? '' : 'opacity-60'
              }`}
              style={{ borderColor: unlocked ? `${meta.color}40` : undefined }}
            >
              {unlocked && (
                <div
                  className="absolute inset-0 opacity-10 pointer-events-none"
                  style={{ background: `radial-gradient(circle at 50% 0%, ${meta.color}, transparent 60%)` }}
                />
              )}
              <div className="relative flex items-start gap-3">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${
                    unlocked ? '' : 'grayscale'
                  }`}
                  style={{
                    background: unlocked ? `radial-gradient(circle, ${meta.color}30, transparent 70%)` : 'rgba(255,255,255,0.05)',
                    boxShadow: unlocked ? `0 0 20px ${meta.glow}` : 'none',
                  }}
                >
                  {unlocked ? a.emoji : <Lock size={20} className="text-ink-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm">{a.name}</p>
                    {unlocked && <Check size={14} className="text-emerald2-400 flex-shrink-0" />}
                  </div>
                  <p className="text-xs text-ink-300 mt-0.5">{a.description}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: meta.color }}>
                      {meta.label}
                    </span>
                    <span className="text-xs text-ink-400">🎁 {a.reward}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
