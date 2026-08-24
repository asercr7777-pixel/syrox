import { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { RARITY_META, type Rarity } from '../data/collections';
import { MARKET_ITEMS, CATEGORY_LABELS, type MarketCategory, type MarketItem } from '../data/marketplace';
import { RANKS } from '../data/ranks';
import { Modal } from '../components/ui/Modal';
import { toast } from '../components/ui/Toast';
import { playSound } from '../lib/sound';
import { WeaponArt } from '../art/WeaponArt';
import { AuraArt } from '../art/AuraArt';
import { ShieldArt } from '../art/ShieldArt';
import { FrameArt } from '../art/FrameArt';
import { BackgroundArt } from '../art/BackgroundArt';
import { Search, Coins, Lock, Check, Sparkles } from 'lucide-react';
import '../styles/marketplace.css';

const CATEGORIES: MarketCategory[] = ['weapons', 'auras', 'titles', 'shields', 'frames', 'backgrounds'];

const CATEGORY_ICONS: Record<MarketCategory, string> = {
  weapons: '⚔️', auras: '✨', titles: '🏷️', shields: '🛡️', frames: '🖼️', backgrounds: '🌌',
};

const RARITY_ORDER: Record<Rarity, number> = {
  secret: 6, mythic: 5, legendary: 4, epic: 3, rare: 2, common: 1,
};

type SortMode = 'rarity' | 'price-low' | 'price-high' | 'name';

export function Marketplace() {
  const { state, purchaseItem, equipItem, unequipItem } = useStore();
  const [category, setCategory] = useState<MarketCategory>('weapons');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortMode>('rarity');
  const [previewItem, setPreviewItem] = useState<MarketItem | null>(null);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [filterRarity, setFilterRarity] = useState<Rarity | 'all'>('all');

  const items = useMemo(() => {
    let list = MARKET_ITEMS.filter((m) => m.category === category);
    if (filterRarity !== 'all') list = list.filter((m) => m.rarity === filterRarity);
    if (search) list = list.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()));
    list.sort((a, b) => {
      switch (sort) {
        case 'rarity': return RARITY_ORDER[b.rarity] - RARITY_ORDER[a.rarity];
        case 'price-low': return a.price - b.price;
        case 'price-high': return b.price - a.price;
        case 'name': return a.name.localeCompare(b.name);
      }
    });
    return list;
  }, [category, search, sort, filterRarity]);

  const ownedIds = useMemo(() => {
    const typeMap: Record<MarketCategory, string> = {
      weapons: 'weapon', auras: 'aura', titles: 'title', shields: 'shield', frames: 'frame', backgrounds: 'background',
    };
    return new Set(state.inventory.filter((i) => i.type === typeMap[category]).map((i) => i.id));
  }, [state.inventory, category]);

  const equippedId = useMemo(() => {
    const typeMap: Record<MarketCategory, 'weapon' | 'aura' | 'title' | 'shield' | 'frame' | 'background'> = {
      weapons: 'weapon', auras: 'aura', titles: 'title', shields: 'shield', frames: 'frame', backgrounds: 'background',
    };
    return state.equipped[typeMap[category]];
  }, [state.equipped, category]);

  const handlePurchase = (item: MarketItem) => {
    if (ownedIds.has(item.id)) {
      toast({ title: 'Already owned', message: `${item.name} is already in your inventory.`, type: 'info' });
      return;
    }
    if (state.xp < item.xpRequired) {
      toast({ title: 'Locked', message: `You need ${item.xpRequired.toLocaleString()} XP to unlock this item.`, type: 'error' });
      playSound('error');
      return;
    }
    if (state.coins < item.price) {
      toast({ title: 'Not enough coins', message: `You need ${item.price.toLocaleString()} coins.`, type: 'error' });
      playSound('error');
      return;
    }
    setPurchasing(item.id);
    playSound('whoosh');
    const success = purchaseItem(item.id, item.category, item.price);
    setPurchasing(null);
    if (success) toast({ title: 'Purchase Successful!', message: `${item.name} added to your inventory.`, type: 'reward', icon: '🪙' });
    else {
      toast({ title: 'Purchase failed', message: 'The item could not be purchased. Your balance was not changed.', type: 'error' });
      playSound('error');
    }
  };

  const handleEquip = (item: MarketItem) => {
    const typeMap: Record<MarketCategory, 'weapon' | 'aura' | 'title' | 'shield' | 'frame' | 'background'> = {
      weapons: 'weapon', auras: 'aura', titles: 'title', shields: 'shield', frames: 'frame', backgrounds: 'background',
    };
    equipItem(typeMap[category], item.id);
    playSound('click');
    toast({ title: 'Equipped', message: item.name, type: 'success' });
  };

  const handleUnequip = () => {
    const typeMap: Record<MarketCategory, 'weapon' | 'aura' | 'title' | 'shield' | 'frame' | 'background'> = {
      weapons: 'weapon', auras: 'aura', titles: 'title', shields: 'shield', frames: 'frame', backgrounds: 'background',
    };
    unequipItem(typeMap[category]);
    playSound('click');
    toast({ title: 'Unequipped', type: 'info' });
  };

  const renderArtwork = (item: MarketItem, size: number) => {
    switch (item.category) {
      case 'weapons': return <WeaponArt id={item.id} name={item.name} rarity={item.rarity} size={size} />;
      case 'auras': { const color = RARITY_META[item.rarity].color; return <AuraArt id={item.id} name={item.name} rarity={item.rarity} color={color} size={size} />; }
      case 'shields': return <ShieldArt id={item.id} name={item.name} rarity={item.rarity} size={size} />;
      case 'frames': { const color = RARITY_META[item.rarity].color; return <FrameArt id={item.id} name={item.name} rarity={item.rarity} color={color} size={size} />; }
      case 'backgrounds': return <BackgroundArt id={item.id} name={item.name} size={size} />;
      case 'titles': return <TitleArt item={item} size={size} />;
    }
  };

  return (
    <div className="marketplace-shell space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4 page-enter">
        <div>
          <h1 className="section-title marketplace-title">Marketplace</h1>
          <p className="text-sm text-ink-300 marketplace-subtitle">Purchase unique items with coins. Each item has its own artwork.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="card-premium px-4 py-2.5 flex items-center gap-2">
            <Coins size={18} className="text-gold-400" />
            <span className="font-bold text-gold-400 text-lg tabular-nums">{state.coins.toLocaleString()}</span>
          </div>
          <div className="card-premium px-4 py-2.5 flex items-center gap-2">
            <Sparkles size={16} className="text-ember-400" />
            <span className="text-sm text-ink-200">{state.xp.toLocaleString()} XP</span>
          </div>
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {CATEGORIES.map((cat) => {
          const count = MARKET_ITEMS.filter((m) => m.category === cat).length;
          const active = category === cat;
          return (
            <button
              key={cat}
              onClick={() => { setCategory(cat); setFilterRarity('all'); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                active
                  ? 'bg-gradient-to-r from-ember-500/20 to-transparent text-ember-400 border border-ember-500/30 shadow-lg shadow-ember-500/10'
                  : 'bg-ink-900/60 text-ink-300 border border-white/5 hover:bg-white/5 hover:border-white/10'
              }`}
            >
              <span>{CATEGORY_ICONS[cat]}</span>
              <span>{CATEGORY_LABELS[cat]}</span>
              <span className="text-xs text-ink-400">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Search + filters */}
      <div className="grid grid-cols-1 sm:flex sm:flex-wrap gap-2">
        <div className="relative min-w-0 sm:flex-1 sm:min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input className="input pl-10" placeholder="Search items..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input w-full sm:w-auto" value={filterRarity} onChange={(e) => setFilterRarity(e.target.value as Rarity | 'all')}>
          <option value="all">All Rarities</option>
          <option value="common">Common</option>
          <option value="rare">Rare</option>
          <option value="epic">Epic</option>
          <option value="legendary">Legendary</option>
          <option value="mythic">Mythic</option>
          <option value="secret">Secret</option>
        </select>
        <select className="input w-full sm:w-auto" value={sort} onChange={(e) => setSort(e.target.value as SortMode)}>
          <option value="rarity">Sort: Rarity</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
          <option value="name">Name: A-Z</option>
        </select>
      </div>

      {/* Grid */}
      {items.length === 0 ? (
        <div className="card-premium p-8 text-center">
          <p className="text-ink-300">No items found.</p>
        </div>
      ) : (
        <div className="marketplace-grid grid grid-cols-1 min-[380px]:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {items.map((item, idx) => {
            const meta = RARITY_META[item.rarity];
            const owned = ownedIds.has(item.id);
            const isEquipped = equippedId === item.id;
            const locked = state.xp < item.xpRequired;
            const canAfford = state.coins >= item.price;
            const isPurchasing = purchasing === item.id;
            const isHighRarity = item.rarity === 'legendary' || item.rarity === 'mythic' || item.rarity === 'secret';

            return (
              <div
                key={item.id}
                className={`card-premium p-3 relative group stagger-in ${isHighRarity ? 'glow-ring' : ''}`}
                style={{
                  borderColor: `${meta.color}30`,
                  ['--glow-color' as any]: meta.color,
                  animationDelay: `${Math.min(idx * 0.03, 0.5)}s`,
                }}
              >
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{ boxShadow: `0 0 30px ${meta.glow}, inset 0 0 20px ${meta.color}10` }} />
                {isHighRarity && <div className="absolute inset-0 rounded-2xl opacity-20 pointer-events-none" style={{ background: `radial-gradient(circle at 50% 30%, ${meta.color}30, transparent 70%)` }} />}
                {owned && <div className="absolute top-2 right-2 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald2-500/20 border border-emerald2-500/30"><Check size={10} className="text-emerald2-400" /><span className="text-[10px] font-semibold text-emerald2-400">Owned</span></div>}
                {isEquipped && <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-full bg-ember-500/20 border border-ember-500/30"><span className="text-[10px] font-semibold text-ember-400">Equipped</span></div>}
                <button onClick={() => { setPreviewItem(item); playSound('click'); }} className="w-full flex flex-col items-center mt-2 relative">
                  <div className={`relative flex items-center justify-center mb-2 transition-transform duration-300 group-hover:scale-110 ${locked ? 'opacity-50 grayscale' : ''}`} style={{ filter: locked ? 'blur(2px)' : 'none' }}>
                    {renderArtwork(item, 100)}
                  </div>
                  <p className="text-sm font-semibold text-center leading-tight line-clamp-1">{item.name}</p>
                  <p className="text-xs font-semibold uppercase tracking-wider mt-0.5" style={{ color: meta.color, textShadow: isHighRarity ? `0 0 8px ${meta.glow}` : 'none' }}>{meta.label}</p>
                </button>
                <div className="flex items-center justify-between mt-2 px-1">
                  <div className="flex items-center gap-1"><Coins size={12} className="text-gold-400" /><span className="text-xs font-bold text-gold-400 tabular-nums">{item.price.toLocaleString()}</span></div>
                  {locked ? <div className="flex items-center gap-1"><Lock size={10} className="text-danger-400" /><span className="text-[10px] text-danger-400">{item.xpRequired.toLocaleString()} XP</span></div> : <span className="text-[10px] text-ink-400">{item.xpRequired.toLocaleString()} XP</span>}
                </div>
                <div className="mt-2">
                  {isPurchasing ? <div className="w-full py-2 rounded-xl bg-gradient-to-r from-ember-500/30 to-gold-500/30 border border-ember-500/40 flex items-center justify-center gap-2 animate-pulse"><Sparkles size={14} className="text-ember-400 animate-spin" /><span className="text-xs font-semibold text-ember-400">Purchasing...</span></div> : owned ? (isEquipped ? <button onClick={handleUnequip} className="w-full btn-ghost btn-sm">Unequip</button> : <button onClick={() => handleEquip(item)} className="w-full btn-primary btn-sm">Equip</button>) : <button onClick={() => handlePurchase(item)} disabled={locked || !canAfford} className="w-full btn-primary btn-sm disabled:opacity-40 disabled:cursor-not-allowed">{locked ? `Requires ${item.xpRequired.toLocaleString()} XP` : canAfford ? `Buy · ${item.price.toLocaleString()}` : 'Not enough coins'}</button>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {previewItem && <Modal isOpen={!!previewItem} onClose={() => setPreviewItem(null)} title={previewItem.name}><div className="flex flex-col items-center gap-4 p-4">{renderArtwork(previewItem, 180)}<p className="text-center text-sm text-ink-300">{CATEGORY_LABELS[previewItem.category]}</p></div></Modal>}
    </div>
  );
}

function TitleArt({ item, size }: { item: MarketItem; size: number }) {
  return <div className="flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] px-4" style={{ width: size * 1.6, height: size * 0.65 }}><span className="text-sm font-bold text-ember-300">{item.name}</span></div>;
}
