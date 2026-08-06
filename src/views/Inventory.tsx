import { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { AURAS, WEAPONS, TITLES, SHIELDS, FRAMES, BACKGROUNDS, BADGES, RARITY_META, type Rarity } from '../data/collections';
import { Modal } from '../components/ui/Modal';
import { Search, Star, Check } from 'lucide-react';
import { toast } from '../components/ui/Toast';
import { AuraPreview } from '../components/ui/RankBadge';

type ItemType = 'aura' | 'weapon' | 'title' | 'shield' | 'frame' | 'background' | 'badge';
type SortMode = 'recent' | 'rarity' | 'name' | 'favorite';

const CATEGORIES: { id: ItemType; label: string; icon: string }[] = [
  { id: 'aura', label: 'Auras', icon: '✨' },
  { id: 'weapon', label: 'Weapons', icon: '⚔️' },
  { id: 'title', label: 'Titles', icon: '🏷️' },
  { id: 'shield', label: 'Shields', icon: '🛡️' },
  { id: 'frame', label: 'Frames', icon: '🖼️' },
  { id: 'background', label: 'Backgrounds', icon: '🌌' },
  { id: 'badge', label: 'Badges', icon: '🏅' },
];

const RARITY_ORDER: Record<Rarity, number> = {
  secret: 6, mythic: 5, legendary: 4, epic: 3, rare: 2, common: 1,
};

export function Inventory() {
  const { state, equipItem, unequipItem, toggleFavorite } = useStore();
  const [category, setCategory] = useState<ItemType>('aura');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortMode>('recent');
  const [previewId, setPreviewId] = useState<string | null>(null);

  const owned = useMemo(() => {
    return state.inventory.filter((i) => i.type === category);
  }, [state.inventory, category]);

  const allItems = useMemo(() => {
    switch (category) {
      case 'aura': return AURAS;
      case 'weapon': return WEAPONS;
      case 'title': return TITLES;
      case 'shield': return SHIELDS;
      case 'frame': return FRAMES;
      case 'background': return BACKGROUNDS;
      case 'badge': return BADGES;
    }
  }, [category]);

  const filtered = useMemo(() => {
    let list = owned.map((inv) => {
      const item = allItems.find((a) => a.id === inv.id);
      return item ? { ...item, inv } : null;
    }).filter(Boolean) as any[];

    if (search) {
      list = list.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()));
    }

    list.sort((a, b) => {
      switch (sort) {
        case 'recent': return b.inv.obtainedAt - a.inv.obtainedAt;
        case 'rarity': return RARITY_ORDER[b.rarity as Rarity] - RARITY_ORDER[a.rarity as Rarity];
        case 'name': return a.name.localeCompare(b.name);
        case 'favorite': return (b.inv.favorite ? 1 : 0) - (a.inv.favorite ? 1 : 0);
      }
    });
    return list;
  }, [owned, allItems, search, sort]);

  const equippedId = category === 'badge' ? null : (state.equipped as any)[category] as string | null;

  const handleEquip = (id: string) => {
    if (category === 'badge') {
      toast({ title: 'Badges cannot be equipped', type: 'error' });
      return;
    }
    equipItem(category as any, id);
    toast({ title: 'Equipped', type: 'success' });
  };

  const handleUnequip = () => {
    if (category === 'badge') return;
    unequipItem(category as any);
    toast({ title: 'Unequipped', type: 'success' });
  };

  const previewItem = previewId ? allItems.find((i) => i.id === previewId) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-title">Inventory</h1>
        <p className="text-sm text-ink-300">Manage your auras, weapons, titles, and more</p>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {CATEGORIES.map((c) => {
          const count = state.inventory.filter((i) => i.type === c.id).length;
          const active = category === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition ${
                active
                  ? 'bg-gradient-to-r from-ember-500/20 to-transparent text-ember-400 border border-ember-500/30'
                  : 'bg-ink-900/60 text-ink-300 border border-white/5 hover:bg-white/5'
              }`}
            >
              <span>{c.icon}</span>
              <span>{c.label}</span>
              <span className="text-xs text-ink-400">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Search + sort */}
      <div className="grid grid-cols-1 sm:flex sm:flex-wrap gap-2">
        <div className="relative min-w-0 sm:flex-1 sm:min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            className="input pl-10"
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input w-full sm:w-auto"
          value={sort}
          onChange={(e) => setSort(e.target.value as SortMode)}
        >
          <option value="recent">Most Recent</option>
          <option value="rarity">Rarity</option>
          <option value="name">Name</option>
          <option value="favorite">Favorites First</option>
        </select>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-ink-300">No items in this category yet.</p>
          <p className="text-xs text-ink-400 mt-1">Clear dungeons and spin the wheel to collect items.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 min-[380px]:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
          {filtered.map((item) => {
            const meta = RARITY_META[item.rarity as Rarity];
            const isEquipped = equippedId === item.id;
            return (
              <div
                key={item.id}
                className="card p-3 relative group"
                style={{ borderColor: `${meta.color}40` }}
              >
                <button
                  onClick={() => toggleFavorite(item.id)}
                  className="absolute top-2 right-2 z-10 p-1 rounded-lg hover:bg-white/10"
                >
                  <Star
                    size={14}
                    className={item.inv.favorite ? 'fill-gold-400 text-gold-400' : 'text-ink-400'}
                  />
                </button>

                <button
                  onClick={() => setPreviewId(item.id)}
                  className="w-full flex flex-col items-center"
                >
                  <div
                    className="w-16 h-16 rounded-xl flex items-center justify-center mb-2 relative"
                    style={{
                      background: `radial-gradient(circle, ${meta.color}30, transparent 70%)`,
                      boxShadow: `0 0 20px ${meta.glow}`,
                    }}
                  >
                    {category === 'aura' ? (
                      <AuraPreview auraId={item.id} size="sm" />
                    ) : (
                      <span className="text-3xl">
                        {category === 'weapon' ? '⚔️' : category === 'title' ? '🏷️' : category === 'shield' ? '🛡️' : category === 'frame' ? '🖼️' : category === 'background' ? '🌌' : '🏅'}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-center leading-tight line-clamp-2">{item.name}</p>
                  <p className="text-xs font-semibold uppercase tracking-wider mt-0.5" style={{ color: meta.color }}>
                    {meta.label}
                  </p>
                </button>

                <div className="flex gap-1 mt-2">
                  {isEquipped ? (
                    <button onClick={handleUnequip} className="flex-1 btn-ghost text-xs py-1.5">
                      <Check size={12} /> Equipped
                    </button>
                  ) : (
                    <button onClick={() => handleEquip(item.id)} className="flex-1 btn-primary text-xs py-1.5">
                      Equip
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Preview modal */}
      <Modal open={previewId !== null} onClose={() => setPreviewId(null)} title="Item Preview" size="sm">
        {previewItem && (
          <div className="text-center">
            <div
              className="w-32 h-32 mx-auto rounded-2xl flex items-center justify-center mb-4 relative"
              style={{
                background: `radial-gradient(circle, ${RARITY_META[previewItem.rarity as Rarity].color}40, transparent 70%)`,
                boxShadow: `0 0 40px ${RARITY_META[previewItem.rarity as Rarity].glow}`,
              }}
            >
              {category === 'aura' ? (
                <AuraPreview auraId={previewItem.id} size="lg" />
              ) : (
                <span className="text-6xl">
                  {category === 'weapon' ? '⚔️' : category === 'title' ? '🏷️' : category === 'shield' ? '🛡️' : category === 'frame' ? '🖼️' : category === 'background' ? '🌌' : '🏅'}
                </span>
              )}
            </div>
            <h3 className="font-display text-xl font-bold">{previewItem.name}</h3>
            <p className="text-sm font-semibold uppercase tracking-wider mt-1" style={{ color: RARITY_META[previewItem.rarity as Rarity].color }}>
              {RARITY_META[previewItem.rarity as Rarity].label}
            </p>
            {(previewItem as any).description && (
              <p className="text-sm text-ink-300 mt-3">{(previewItem as any).description}</p>
            )}
            {(previewItem as any).boost && (
              <p className="text-xs text-ember-400 mt-2">+{(previewItem as any).boost}% XP boost when equipped</p>
            )}
            {(previewItem as any).color && category === 'aura' && (
              <p className="text-xs text-ink-400 mt-2">Color: <span className="font-mono" style={{ color: (previewItem as any).color }}>{(previewItem as any).color}</span></p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
