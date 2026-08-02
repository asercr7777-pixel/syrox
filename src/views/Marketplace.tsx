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
    setTimeout(() => {
      const success = purchaseItem(item.id, item.category, item.price);
      setPurchasing(null);
      if (success) {
        toast({ title: 'Purchase Successful!', message: `${item.name} added to your inventory.`, type: 'reward', icon: '🪙' });
      } else {
        toast({ title: 'Purchase failed', type: 'error' });
      }
    }, 800);
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4 page-enter">
        <div>
          <h1 className="section-title">Marketplace</h1>
          <p className="text-sm text-ink-300">Purchase unique items with coins. Each item has its own artwork.</p>
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
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input className="input pl-10" placeholder="Search items..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input w-auto" value={filterRarity} onChange={(e) => setFilterRarity(e.target.value as Rarity | 'all')}>
          <option value="all">All Rarities</option>
          <option value="common">Common</option>
          <option value="rare">Rare</option>
          <option value="epic">Epic</option>
          <option value="legendary">Legendary</option>
          <option value="mythic">Mythic</option>
          <option value="secret">Secret</option>
        </select>
        <select className="input w-auto" value={sort} onChange={(e) => setSort(e.target.value as SortMode)}>
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
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
                {/* Rarity glow on hover */}
                <div
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{ boxShadow: `0 0 30px ${meta.glow}, inset 0 0 20px ${meta.color}10` }}
                />

                {/* High-rarity ambient glow */}
                {isHighRarity && (
                  <div
                    className="absolute inset-0 rounded-2xl opacity-20 pointer-events-none"
                    style={{ background: `radial-gradient(circle at 50% 30%, ${meta.color}30, transparent 70%)` }}
                  />
                )}

                {/* Owned / Equipped badge */}
                {owned && (
                  <div className="absolute top-2 right-2 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald2-500/20 border border-emerald2-500/30">
                    <Check size={10} className="text-emerald2-400" />
                    <span className="text-[10px] font-semibold text-emerald2-400">Owned</span>
                  </div>
                )}
                {isEquipped && (
                  <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-full bg-ember-500/20 border border-ember-500/30">
                    <span className="text-[10px] font-semibold text-ember-400">Equipped</span>
                  </div>
                )}

                {/* Artwork */}
                <button
                  onClick={() => { setPreviewItem(item); playSound('click'); }}
                  className="w-full flex flex-col items-center mt-2 relative"
                >
                  <div
                    className={`relative flex items-center justify-center mb-2 transition-transform duration-300 group-hover:scale-110 ${locked ? 'opacity-50 grayscale' : ''}`}
                    style={{ filter: locked ? 'blur(2px)' : 'none' }}
                  >
                    {renderArtwork(item, 100)}
                  </div>
                  <p className="text-sm font-semibold text-center leading-tight line-clamp-1">{item.name}</p>
                  <p className="text-xs font-semibold uppercase tracking-wider mt-0.5" style={{ color: meta.color, textShadow: isHighRarity ? `0 0 8px ${meta.glow}` : 'none' }}>
                    {meta.label}
                  </p>
                </button>

                {/* Price + XP requirement */}
                <div className="flex items-center justify-between mt-2 px-1">
                  <div className="flex items-center gap-1">
                    <Coins size={12} className="text-gold-400" />
                    <span className="text-xs font-bold text-gold-400 tabular-nums">{item.price.toLocaleString()}</span>
                  </div>
                  {locked ? (
                    <div className="flex items-center gap-1">
                      <Lock size={10} className="text-danger-400" />
                      <span className="text-[10px] text-danger-400">{item.xpRequired.toLocaleString()} XP</span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-ink-400">{item.xpRequired.toLocaleString()} XP</span>
                  )}
                </div>

                {/* Action button */}
                <div className="mt-2">
                  {isPurchasing ? (
                    <div className="w-full py-2 rounded-xl bg-gradient-to-r from-ember-500/30 to-gold-500/30 border border-ember-500/40 flex items-center justify-center gap-2 animate-pulse">
                      <Sparkles size={14} className="text-ember-400 animate-spin" />
                      <span className="text-xs font-semibold text-ember-400">Purchasing...</span>
                    </div>
                  ) : owned ? (
                    isEquipped ? (
                      <button onClick={handleUnequip} className="w-full btn-ghost btn-sheen text-xs py-2">
                        <Check size={12} /> Equipped
                      </button>
                    ) : (
                      <button onClick={() => handleEquip(item)} className="w-full btn-primary btn-sheen text-xs py-2">
                        Equip
                      </button>
                    )
                  ) : locked ? (
                    <button
                      onClick={() => { toast({ title: 'Locked', message: `Reach ${item.xpRequired.toLocaleString()} XP to unlock.`, type: 'error' }); playSound('error'); }}
                      className="w-full py-2 rounded-xl bg-ink-800/60 border border-white/5 text-xs font-medium text-ink-400 flex items-center justify-center gap-1.5"
                    >
                      <Lock size={12} /> Locked
                    </button>
                  ) : (
                    <button
                      onClick={() => handlePurchase(item)}
                      disabled={!canAfford}
                      className={`w-full py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition btn-sheen ${
                        canAfford
                          ? 'bg-gradient-to-r from-gold-500/20 to-ember-500/20 border border-gold-500/30 text-gold-400 hover:from-gold-500/30 hover:to-ember-500/30 hover:shadow-lg hover:shadow-gold-500/10'
                          : 'bg-ink-800/60 border border-white/5 text-ink-500 cursor-not-allowed'
                      }`}
                    >
                      <Coins size={12} />
                      {canAfford ? 'Purchase' : 'Not enough'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Preview Modal */}
      <Modal open={previewItem !== null} onClose={() => setPreviewItem(null)} title="Item Preview" size="md">
        {previewItem && (
          <PreviewContent
            item={previewItem}
            owned={ownedIds.has(previewItem.id)}
            equipped={equippedId === previewItem.id}
            locked={state.xp < previewItem.xpRequired}
            canAfford={state.coins >= previewItem.price}
            onPurchase={() => { handlePurchase(previewItem); }}
            onEquip={() => handleEquip(previewItem)}
            onUnequip={handleUnequip}
            renderArtwork={renderArtwork}
          />
        )}
      </Modal>
    </div>
  );
}

function PreviewContent({ item, owned, equipped, locked, canAfford, onPurchase, onEquip, onUnequip, renderArtwork }: {
  item: MarketItem;
  owned: boolean;
  equipped: boolean;
  locked: boolean;
  canAfford: boolean;
  onPurchase: () => void;
  onEquip: () => void;
  onUnequip: () => void;
  renderArtwork: (item: MarketItem, size: number) => React.ReactNode;
}) {
  const meta = RARITY_META[item.rarity];
  const requiredRank = RANKS.find((r) => r.id === item.rankRequired);
  const isHighRarity = item.rarity === 'legendary' || item.rarity === 'mythic' || item.rarity === 'secret';

  return (
    <div className="text-center">
      <div
        className="relative w-40 h-40 mx-auto rounded-2xl flex items-center justify-center mb-4 overflow-hidden"
        style={{
          background: `radial-gradient(circle, ${meta.color}25, transparent 70%)`,
          boxShadow: `0 0 50px ${meta.glow}`,
        }}
      >
        {isHighRarity && (
          <div
            className="absolute inset-0 opacity-30 pointer-events-none"
            style={{ background: `radial-gradient(circle at 50% 30%, ${meta.color}40, transparent 60%)`, animation: 'pulseGlow 3s ease-in-out infinite' }}
          />
        )}
        <div className={locked ? 'opacity-60' : ''}>
          {renderArtwork(item, 160)}
        </div>
        {locked && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <Lock size={32} className="text-danger-400" />
          </div>
        )}
      </div>

      <h3 className="font-display text-xl font-bold">{item.name}</h3>
      <p className="text-sm font-semibold uppercase tracking-wider mt-1" style={{ color: meta.color, textShadow: isHighRarity ? `0 0 8px ${meta.glow}` : 'none' }}>
        {meta.label}
      </p>
      <p className="text-sm text-ink-300 mt-3 max-w-sm mx-auto">{item.description}</p>

      {/* Stats */}
      <div className="flex items-center justify-center gap-4 mt-4 flex-wrap">
        <div className="card-premium px-3 py-2 flex items-center gap-1.5">
          <Coins size={14} className="text-gold-400" />
          <span className="text-sm font-bold text-gold-400 tabular-nums">{item.price.toLocaleString()}</span>
        </div>
        <div className="card-premium px-3 py-2 flex items-center gap-1.5">
          <Sparkles size={14} className="text-ember-400" />
          <span className="text-sm text-ink-200">{item.xpRequired.toLocaleString()} XP</span>
        </div>
        {requiredRank && (
          <div className="card-premium px-3 py-2 flex items-center gap-1.5">
            <span className="text-sm">{requiredRank.emoji}</span>
            <span className="text-sm text-ink-200">{requiredRank.name}</span>
          </div>
        )}
      </div>

      {/* Action */}
      <div className="mt-5">
        {owned ? (
          equipped ? (
            <button onClick={onUnequip} className="btn-ghost btn-sheen w-full">
              <Check size={16} /> Equipped — Click to Unequip
            </button>
          ) : (
            <button onClick={onEquip} className="btn-primary btn-sheen w-full">
              Equip Item
            </button>
          )
        ) : locked ? (
          <div className="card-premium p-3 text-danger-400 text-sm flex items-center justify-center gap-2">
            <Lock size={16} />
            <span>Reach {item.xpRequired.toLocaleString()} XP ({requiredRank?.name}) to unlock</span>
          </div>
        ) : (
          <button
            onClick={onPurchase}
            disabled={!canAfford}
            className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition btn-sheen ${
              canAfford
                ? 'bg-gradient-to-r from-gold-500/20 to-ember-500/20 border border-gold-500/30 text-gold-400 hover:from-gold-500/30 hover:to-ember-500/30 hover:shadow-lg hover:shadow-gold-500/10'
                : 'bg-ink-800/60 border border-white/5 text-ink-500 cursor-not-allowed'
            }`}
          >
            <Coins size={16} />
            {canAfford ? `Purchase for ${item.price.toLocaleString()} coins` : `Need ${item.price.toLocaleString()} coins`}
          </button>
        )}
      </div>
    </div>
  );
}

function TitleArt({ item, size }: { item: MarketItem; size: number }) {
  const meta = RARITY_META[item.rarity];
  const fontSize = size * 0.16;
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} className="overflow-visible">
      <defs>
        <linearGradient id={`t-${item.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={meta.color} stopOpacity="0.8" />
          <stop offset="100%" stopColor={meta.color} stopOpacity="0.3" />
        </linearGradient>
        <radialGradient id={`t-${item.id}-glow`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={meta.color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={meta.color} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="60" cy="60" r="50" fill={`url(#t-${item.id}-glow)`} />
      <path d="M 20 45 L 100 45 L 100 65 L 60 80 L 20 65 Z" fill={`url(#t-${item.id})`} stroke={meta.color} strokeWidth="1" opacity="0.9" />
      <path d="M 20 45 L 100 45 L 100 65 L 60 80 L 20 65 Z" fill="none" stroke="#fff" strokeWidth="0.5" opacity="0.3" />
      <line x1="25" y1="50" x2="95" y2="50" stroke={meta.color} strokeWidth="0.5" opacity="0.5" />
      <line x1="25" y1="60" x2="95" y2="60" stroke={meta.color} strokeWidth="0.5" opacity="0.5" />
      <polygon points="15,55 17,53 19,55 17,57" fill={meta.color} opacity="0.8" />
      <polygon points="101,55 103,53 105,55 103,57" fill={meta.color} opacity="0.8" />
      <text x="60" y="59" textAnchor="middle" fontSize={fontSize} fill="#fff" fontWeight="bold" fontFamily="Cinzel, serif" opacity="0.95">
        {item.name.length > 14 ? item.name.slice(0, 12) + '...' : item.name}
      </text>
    </svg>
  );
}
