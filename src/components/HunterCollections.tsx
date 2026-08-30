import { Award, Backpack, Lock, Sparkles, Trophy } from 'lucide-react';
import { useStore } from '../store/useStore';
import { AURAS, WEAPONS, TITLES, SHIELDS, FRAMES, RARITY_META } from '../data/collections';

const ACHIEVEMENT_META: Record<string, { name: string; emoji: string }> = {
  first_steps: { name: 'First Steps', emoji: '👣' }, week_streak: { name: 'Week Warrior', emoji: '🔥' }, month_streak: { name: 'Iron Discipline', emoji: '⛓️' },
  first_dungeon: { name: 'Dungeon Clearer', emoji: '🏰' }, boss_slayer: { name: 'Boss Slayer', emoji: '💀' }, dungeon_conqueror: { name: 'Dungeon Conqueror', emoji: '👑' },
  rank_d: { name: 'Awakened', emoji: '🟢' }, rank_s: { name: 'S-Class', emoji: '🔥' }, rank_shadow: { name: 'Shadow Hunter', emoji: '🐺' }, rank_monarch: { name: 'The Monarch', emoji: '👑' },
  aura_collector: { name: 'Aura Collector', emoji: '✨' }, legendary_aura: { name: 'Legendary Aura', emoji: '🌟' }, secret_finder: { name: 'Secret Finder', emoji: '🗝️' }, perfect_day: { name: 'Perfect Day', emoji: '💯' },
  spin_lucky: { name: 'Lucky Spin', emoji: '🎡' }, no_skip: { name: 'No Skip November', emoji: '🛡️' }, easter_shadow: { name: 'Shadow Whisperer', emoji: '🌑' }, easter_monarch: { name: 'Rise of the Monarch', emoji: '👑' },
};

const COLLECTIONS = [
  ...AURAS.map((x) => ({ ...x, kind: 'Aura' })), ...WEAPONS.map((x) => ({ ...x, kind: 'Weapon' })), ...TITLES.map((x) => ({ ...x, kind: 'Title' })),
  ...SHIELDS.map((x) => ({ ...x, kind: 'Shield' })), ...FRAMES.map((x) => ({ ...x, kind: 'Frame' })),
];

export function HunterCollections() {
  const { state } = useStore();
  const unlocked = new Set(state.achievements.map((a) => a.id));
  const owned = state.inventory.map((item) => ({ item, def: COLLECTIONS.find((x) => x.id === item.id && x.kind.toLowerCase() === item.type) })).filter((x) => x.def);
  const recent = owned.slice().sort((a, b) => b.item.obtainedAt - a.item.obtainedAt).slice(0, 8);

  return <div className="space-y-5">
    <section className="card-premium p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div><h2 className="section-title flex items-center gap-2"><Trophy size={18} className="text-gold-400" /> Achievements</h2><p className="mt-1 text-xs text-ink-400">{unlocked.size} unlocked • Your hunter milestones</p></div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-500/10 text-gold-400"><Award size={19} /></div>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {Object.entries(ACHIEVEMENT_META).map(([id, meta]) => { const isUnlocked = unlocked.has(id); return <div key={id} className={`relative overflow-hidden rounded-xl border p-3 transition ${isUnlocked ? 'border-gold-500/25 bg-gold-500/[0.06]' : 'border-white/5 bg-ink-950/40 opacity-45'}`}><div className="flex items-center gap-2"><span className="text-xl">{isUnlocked ? meta.emoji : <Lock size={17} className="text-ink-500" />}</span><span className="min-w-0 truncate text-xs font-semibold">{meta.name}</span></div>{isUnlocked && <span className="mt-1 block text-[10px] uppercase tracking-wider text-gold-400">Unlocked</span>}</div>; })}
      </div>
    </section>

    <section className="card-premium p-5">
      <div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="section-title flex items-center gap-2"><Backpack size={18} className="text-emerald-400" /> Inventory</h2><p className="mt-1 text-xs text-ink-400">{state.inventory.length} items owned • Your collection</p></div><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400"><Sparkles size={18} /></div></div>
      {recent.length === 0 ? <div className="rounded-xl border border-dashed border-white/10 bg-ink-950/30 p-6 text-center text-sm text-ink-400">Your inventory is empty. Earn rewards from workouts, dungeons, spins and the marketplace.</div> : <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{recent.map(({ item, def }) => { const meta = RARITY_META[def!.rarity as keyof typeof RARITY_META]; return <div key={`${item.type}-${item.id}`} className="rounded-xl border p-3" style={{ borderColor: `${meta?.color ?? '#888'}35`, background: `${meta?.color ?? '#888'}08` }}><div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: `${meta?.color ?? '#888'}18`, color: meta?.color }}><Sparkles size={17} /></div><p className="truncate text-xs font-bold">{def!.name}</p><p className="mt-0.5 text-[10px] uppercase tracking-wider" style={{ color: meta?.color }}>{meta?.label ?? item.type}</p></div>; })}</div>}
    </section>
  </div>;
}
