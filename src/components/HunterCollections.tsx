import { Award, Backpack, Check, Heart, Lock, Shield, Sparkles, Sword, Trophy, UserRound, Zap } from 'lucide-react';
import { useState } from 'react';
import { useStore } from '../store/useStore';
import { AURAS, WEAPONS, TITLES, SHIELDS, FRAMES, BACKGROUNDS, BADGES, RARITY_META } from '../data/collections';
import type { InventoryItem } from '../store/types';

const ACHIEVEMENT_META: Record<string, { name: string; emoji: string }> = {
  first_steps: { name: 'First Steps', emoji: '👣' }, week_streak: { name: 'Week Warrior', emoji: '🔥' }, month_streak: { name: 'Iron Discipline', emoji: '⛓️' },
  first_dungeon: { name: 'Dungeon Clearer', emoji: '🏰' }, boss_slayer: { name: 'Boss Slayer', emoji: '💀' }, dungeon_conqueror: { name: 'Dungeon Conqueror', emoji: '👑' },
  rank_d: { name: 'Awakened', emoji: '🟢' }, rank_s: { name: 'S-Class', emoji: '🔥' }, rank_shadow: { name: 'Shadow Hunter', emoji: '🐺' }, rank_monarch: { name: 'The Monarch', emoji: '👑' },
  aura_collector: { name: 'Aura Collector', emoji: '✨' }, legendary_aura: { name: 'Legendary Aura', emoji: '🌟' }, secret_finder: { name: 'Secret Finder', emoji: '🗝️' }, perfect_day: { name: 'Perfect Day', emoji: '💯' },
  spin_lucky: { name: 'Lucky Spin', emoji: '🎡' }, no_skip: { name: 'No Skip November', emoji: '🛡️' }, easter_shadow: { name: 'Shadow Whisperer', emoji: '🌑' }, easter_monarch: { name: 'Rise of the Monarch', emoji: '👑' },
};

const COLLECTIONS = [
  ...AURAS.map((x) => ({ ...x, kind: 'aura' as const })),
  ...WEAPONS.map((x) => ({ ...x, kind: 'weapon' as const })),
  ...TITLES.map((x) => ({ ...x, kind: 'title' as const })),
  ...SHIELDS.map((x) => ({ ...x, kind: 'shield' as const })),
  ...FRAMES.map((x) => ({ ...x, kind: 'frame' as const })),
  ...BACKGROUNDS.map((x) => ({ ...x, kind: 'background' as const })),
  ...BADGES.map((x) => ({ ...x, kind: 'badge' as const })),
];

type Filter = 'all' | InventoryItem['type'];

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' }, { id: 'weapon', label: 'Weapons' }, { id: 'aura', label: 'Auras' },
  { id: 'title', label: 'Titles' }, { id: 'shield', label: 'Shields' }, { id: 'frame', label: 'Frames' },
  { id: 'background', label: 'Backgrounds' }, { id: 'badge', label: 'Badges' },
];

const TYPE_ICONS: Record<InventoryItem['type'], typeof Sword> = {
  weapon: Sword, aura: Sparkles, title: UserRound, shield: Shield, frame: Trophy, background: Sparkles, badge: Award,
};

function rarityColor(rarity?: string) {
  return RARITY_META[rarity as keyof typeof RARITY_META]?.color ?? '#94a3b8';
}

export function HunterCollections() {
  const { state, equipItem, unequipItem, toggleFavorite } = useStore();
  const [filter, setFilter] = useState<Filter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const unlocked = new Set(state.achievements.map((a) => a.id));
  const owned = state.inventory
    .map((item) => ({ item, def: COLLECTIONS.find((x) => x.id === item.id && x.kind === item.type) }))
    .filter((x): x is { item: InventoryItem; def: (typeof COLLECTIONS)[number] } => Boolean(x.def));
  const filtered = owned
    .filter(({ item }) => filter === 'all' || item.type === filter)
    .sort((a, b) => Number(b.item.favorite) - Number(a.item.favorite) || b.item.obtainedAt - a.item.obtainedAt);
  const selected = filtered.find((x) => `${x.item.type}:${x.item.id}` === selectedId) ?? filtered[0];

  const isEquipped = (item: InventoryItem) => state.equipped[item.type as keyof typeof state.equipped] === item.id;
  const canEquip = (type: InventoryItem['type']): type is Exclude<InventoryItem['type'], 'badge'> => type !== 'badge';

  return <div className="space-y-5">
    <section className="card-premium p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div><h2 className="section-title flex items-center gap-2"><Trophy size={18} className="text-gold-400" /> Achievements</h2><p className="mt-1 text-xs text-ink-400">{unlocked.size} unlocked • Your hunter milestones</p></div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-500/10 text-gold-400"><Award size={19} /></div>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {Object.entries(ACHIEVEMENT_META).map(([id, meta]) => { const ok = unlocked.has(id); return <div key={id} className={`relative overflow-hidden rounded-xl border p-3 transition ${ok ? 'border-gold-500/25 bg-gold-500/[0.06]' : 'border-white/5 bg-ink-950/40 opacity-45'}`}><div className="flex items-center gap-2"><span className="text-xl">{ok ? meta.emoji : <Lock size={17} className="text-ink-500" />} </span><span className="min-w-0 truncate text-xs font-semibold">{meta.name}</span></div>{ok && <span className="mt-1 block text-[10px] uppercase tracking-wider text-gold-400">Unlocked</span>}</div>; })}
      </div>
    </section>

    <section className="card-premium p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><h2 className="section-title flex items-center gap-2"><Backpack size={18} className="text-emerald-400" /> Inventory</h2><p className="mt-1 text-xs text-ink-400">{state.inventory.length} items owned • Equip and manage your collection</p></div>
        <div className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-xs text-ink-300"><Zap size={14} className="text-amber-400" /> Equipped gear changes your Hunter profile</div>
      </div>

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {FILTERS.map((tab) => <button key={tab.id} type="button" onClick={() => setFilter(tab.id)} className={`shrink-0 rounded-xl border px-3 py-2 text-xs font-semibold transition ${filter === tab.id ? 'border-ember-400/40 bg-ember-500/10 text-ember-300' : 'border-white/5 bg-white/[0.03] text-ink-400 hover:bg-white/5'}`}>{tab.label}</button>)}
      </div>

      {filtered.length === 0 ? <div className="rounded-2xl border border-dashed border-white/10 bg-ink-950/30 p-8 text-center"><Backpack size={28} className="mx-auto mb-3 text-ink-600" /><p className="text-sm font-semibold text-ink-300">No items in this category</p><p className="mt-1 text-xs text-ink-500">Earn or purchase items to expand your collection.</p></div> : <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
          {filtered.map(({ item, def }) => {
            const color = rarityColor(def.rarity);
            const Icon = TYPE_ICONS[item.type];
            const equipped = isEquipped(item);
            const active = selected && selected.item.id === item.id && selected.item.type === item.type;
            return <button key={`${item.type}:${item.id}`} type="button" onClick={() => setSelectedId(`${item.type}:${item.id}`)} className={`relative min-w-0 rounded-2xl border p-3 text-left transition-all hover:-translate-y-0.5 ${active ? 'ring-1 ring-ember-400/50' : ''} ${equipped ? 'border-emerald-400/40 bg-emerald-500/[0.06]' : 'border-white/5 bg-ink-950/40 hover:border-white/10'}`} style={{ boxShadow: active ? `0 0 25px ${color}18` : undefined }}>
              {item.favorite && <Heart size={13} fill="currentColor" className="absolute right-2 top-2 text-rose-400" />}
              {equipped && <span className="absolute left-2 top-2 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-300">Equipped</span>}
              <div className="mb-3 mt-1 flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: `${color}18`, color }}><Icon size={22} /></div>
              <p className="truncate text-xs font-bold text-ink-100">{def.name}</p>
              <p className="mt-1 text-[10px] uppercase tracking-wider" style={{ color }}>{RARITY_META[def.rarity as keyof typeof RARITY_META]?.label ?? def.rarity}</p>
              {item.type === 'weapon' && 'xpBoost' in def && <p className="mt-1 text-[10px] font-semibold text-amber-300">+{def.xpBoost}% XP</p>}
            </button>;
          })}
        </div>

        {selected && <aside className="rounded-2xl border border-white/10 bg-ink-950/55 p-4 lg:sticky lg:top-4 lg:h-fit">
          <div className="mb-4 flex items-start justify-between gap-3"><div><p className="text-[10px] uppercase tracking-[0.18em] text-ink-500">{selected.item.type}</p><h3 className="mt-1 text-base font-bold text-ink-100">{selected.def.name}</h3></div><button type="button" onClick={() => toggleFavorite(selected.item.id)} className={`rounded-xl p-2 ${selected.item.favorite ? 'bg-rose-500/10 text-rose-400' : 'bg-white/5 text-ink-500'}`} aria-label="Favorite item"><Heart size={16} fill={selected.item.favorite ? 'currentColor' : 'none'} /></button></div>
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: `${rarityColor(selected.def.rarity)}18`, color: rarityColor(selected.def.rarity) }}><Sparkles size={20} /></div><div><p className="text-xs font-bold" style={{ color: rarityColor(selected.def.rarity) }}>{RARITY_META[selected.def.rarity as keyof typeof RARITY_META]?.label ?? selected.def.rarity}</p><p className="text-[10px] text-ink-500">Acquired {new Date(selected.item.obtainedAt).toLocaleDateString()}</p></div></div>
          {selected.item.type === 'weapon' && 'xpBoost' in selected.def && <div className="mb-4 rounded-xl bg-amber-500/5 p-3"><p className="text-[10px] uppercase tracking-wider text-amber-400">Combat Bonus</p><p className="mt-1 text-sm font-bold text-amber-200">+{selected.def.xpBoost}% XP</p></div>}
          {canEquip(selected.item.type) ? <button type="button" onClick={() => isEquipped(selected.item) ? unequipItem(selected.item.type) : equipItem(selected.item.type, selected.item.id)} className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition ${isEquipped(selected.item) ? 'bg-white/5 text-ink-300 hover:bg-rose-500/10 hover:text-rose-300' : 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25'}`}><Check size={16} /> {isEquipped(selected.item) ? 'Unequip' : selected.item.type === 'background' ? 'Use Background' : 'Equip'}</button> : <div className="rounded-xl bg-white/5 p-3 text-center text-xs text-ink-400">Badges are collectible profile achievements.</div>}
        </aside>}
      </div>}
    </section>
  </div>;
}
