import { Award, Lock, Trophy } from 'lucide-react';
import { useStore } from '../store/useStore';

const ACHIEVEMENT_META: Record<string, { name: string; emoji: string }> = {
  first_steps: { name: 'First Steps', emoji: '👣' }, week_streak: { name: 'Week Warrior', emoji: '🔥' }, month_streak: { name: 'Iron Discipline', emoji: '⛓️' },
  first_dungeon: { name: 'Dungeon Clearer', emoji: '🏰' }, boss_slayer: { name: 'Boss Slayer', emoji: '💀' }, dungeon_conqueror: { name: 'Dungeon Conqueror', emoji: '👑' },
  rank_d: { name: 'Awakened', emoji: '🟢' }, rank_s: { name: 'S-Class', emoji: '🔥' }, rank_shadow: { name: 'Shadow Hunter', emoji: '🐺' }, rank_monarch: { name: 'The Monarch', emoji: '👑' },
  aura_collector: { name: 'Aura Collector', emoji: '✨' }, legendary_aura: { name: 'Legendary Aura', emoji: '🌟' }, secret_finder: { name: 'Secret Finder', emoji: '🗝️' }, perfect_day: { name: 'Perfect Day', emoji: '💯' },
  spin_lucky: { name: 'Lucky Spin', emoji: '🎡' }, no_skip: { name: 'No Skip November', emoji: '🛡️' }, easter_shadow: { name: 'Shadow Whisperer', emoji: '🌑' }, easter_monarch: { name: 'Rise of the Monarch', emoji: '👑' },
};

export function HunterCollections() {
  const { state } = useStore();
  const unlocked = new Set(state.achievements.map((a) => a.id));

  return <section className="card-premium p-5">
    <div className="mb-4 flex items-center justify-between gap-3">
      <div><h2 className="section-title flex items-center gap-2"><Trophy size={18} className="theme-accent" /> Achievements</h2><p className="mt-1 text-xs text-ink-400">{unlocked.size} unlocked • Hunter milestones</p></div>
      <div className="flex h-10 w-10 items-center justify-center rounded-xl theme-accent-bg theme-accent"><Award size={19} /></div>
    </div>
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
      {Object.entries(ACHIEVEMENT_META).map(([id, meta]) => { const ok = unlocked.has(id); return <div key={id} className={`relative overflow-hidden rounded-xl border p-3 transition ${ok ? 'theme-accent-border theme-accent-bg' : 'border-white/5 bg-ink-950/40 opacity-45'}`}><div className="flex items-center gap-2"><span className="text-xl">{ok ? meta.emoji : <Lock size={17} className="text-ink-500" />}</span><span className="min-w-0 truncate text-xs font-semibold">{meta.name}</span></div>{ok && <span className="mt-1 block text-[10px] uppercase tracking-wider theme-accent">Unlocked</span>}</div>; })}
    </div>
  </section>;
}
