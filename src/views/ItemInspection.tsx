import { useEffect, useState } from 'react';
import { Check, ChevronLeft, Coins, Lock, Sparkles } from 'lucide-react';
import { useStore } from '../store/useStore';
import { WEAPONS, AURAS, SHIELDS, FRAMES, BACKGROUNDS, RARITY_META } from '../data/collections';
import { MARKET_ITEMS } from '../data/marketplace';
import { WeaponArt } from '../art/WeaponArt';
import { AuraArt } from '../art/AuraArt';
import { ShieldArt } from '../art/ShieldArt';
import { FrameArt } from '../art/FrameArt';
import { BackgroundArt } from '../art/BackgroundArt';
import { getRankByXp, RANKS } from '../data/ranks';
import { playSound } from '../lib/sound';

export interface ItemInspectionProps {
  itemId: string;
  category: 'weapon' | 'aura' | 'title' | 'shield' | 'frame' | 'background';
  onBack: () => void;
}

export function ItemInspection({ itemId, category, onBack }: ItemInspectionProps) {
  const { state } = useStore();
  const [relatedItems, setRelatedItems] = useState<any[]>([]);

  let item: any = null;
  let artComponent = null;
  let itemName = '';
  let itemRarity = '';

  if (category === 'weapon') {
    item = WEAPONS.find((w) => w.id === itemId);
    if (item) {
      itemName = item.name;
      itemRarity = item.rarity;
      artComponent = (
        <WeaponArt id={item.id} name={item.name} rarity={item.rarity} size={300} />
      );
    }
  } else if (category === 'aura') {
    item = AURAS.find((a) => a.id === itemId);
    if (item) {
      itemName = item.name;
      itemRarity = item.rarity;
      artComponent = (
        <AuraArt
          id={item.id}
          name={item.name}
          rarity={item.rarity}
          color={item.color}
          size={300}
        />
      );
    }
  } else if (category === 'shield') {
    item = SHIELDS.find((s) => s.id === itemId);
    if (item) {
      itemName = item.name;
      itemRarity = item.rarity;
      artComponent = (
        <ShieldArt id={item.id} name={item.name} rarity={item.rarity} size={300} />
      );
    }
  } else if (category === 'frame') {
    item = FRAMES.find((f) => f.id === itemId);
    if (item) {
      itemName = item.name;
      itemRarity = item.rarity;
      artComponent = (
        <FrameArt id={item.id} name={item.name} rarity={item.rarity} color={item.color} size={300} />
      );
    }
  } else if (category === 'background') {
    item = BACKGROUNDS.find((b) => b.id === itemId);
    if (item) {
      itemName = item.name;
      itemRarity = item.rarity;
      artComponent = (
        <BackgroundArt id={item.id} name={item.name} size={300} />
      );
    }
  }

  useEffect(() => {
    if (!item) return;

    let relatedPool: any[] = [];

    if (category === 'weapon') {
      relatedPool = WEAPONS.filter(
        (w) => w.id !== itemId && w.rarity === item.rarity
      );
    } else if (category === 'aura') {
      relatedPool = AURAS.filter(
        (a) => a.id !== itemId && a.rarity === item.rarity
      );
    } else if (category === 'shield') {
      relatedPool = SHIELDS.filter(
        (s) => s.id !== itemId && s.rarity === item.rarity
      );
    } else if (category === 'frame') {
      relatedPool = FRAMES.filter(
        (f) => f.id !== itemId && f.rarity === item.rarity
      );
    } else if (category === 'background') {
      relatedPool = BACKGROUNDS.filter(
        (b) => b.id !== itemId && b.rarity === item.rarity
      );
    }

    setRelatedItems(relatedPool.slice(0, 3));
  }, [item, itemId, category]);

  const marketItem = MARKET_ITEMS.find((m) => m.id === itemId && m.category === (category as any));
  const rarity = RARITY_META[itemRarity as keyof typeof RARITY_META];
  const currentRank = getRankByXp(state.xp || 0);

  const isEquipped = state.equipped[category] === itemId;
  const isOwned = state.inventory?.some((inv) => inv.id === itemId && inv.type === category);
  const canAfford = (state.coins || 0) >= (marketItem?.price || 0);
  const rankMet = RANKS.findIndex((r) => r.id === currentRank.id) >= RANKS.findIndex((r) => r.id === (marketItem?.rankRequired || 'E'));

  const generateLore = (name: string, rarity: string): string => {
    const rarityDescriptions: Record<string, string[]> = {
      common: [
        `${name} is a humble beginning. Every legend starts with such modest tools.`,
        `A simple ${name.toLowerCase()} that has seen service in countless hands.`,
      ],
      rare: [
        `${name} bears the mark of skilled craftsmanship. It whispers of distant adventures.`,
        `Rare and sought-after, ${name} grants those who wield it an edge in battle.`,
      ],
      epic: [
        `${name} thrums with dormant power. Few are worthy to claim such a treasure.`,
        `An artifact of legendary proportions, ${name} channels the very essence of magic.`,
      ],
      legendary: [
        `${name} is spoken of in whispered legends. Its power bends reality itself.`,
        `The very existence of ${name} defies comprehension. It is power incarnate.`,
      ],
      mythic: [
        `${name} transcends mortal understanding. It exists at the edge of creation.`,
        `Beyond myth and legend, ${name} is a force that shapes the world.`,
      ],
      secret: [
        `${name} is known to but the chosen few. Its true power remains locked away.`,
        `A secret kept by ages, ${name} waits for one worthy to unlock its potential.`,
      ],
    };

    const descriptions = rarityDescriptions[rarity] || [];
    return descriptions[Math.floor(Math.random() * descriptions.length)] || `${name} is a powerful artifact.`;
  };

  if (!item) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-black p-4">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-ink-400 hover:text-ink-200 mb-4 transition"
          >
            <ChevronLeft size={20} />
            Back
          </button>
          <div className="card p-8 text-center">
            <p className="text-ink-400">Item not found.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-black p-4">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => {
            playSound('click');
            onBack();
          }}
          className="flex items-center gap-2 text-ink-400 hover:text-ink-200 mb-6 transition"
        >
          <ChevronLeft size={20} />
          Back
        </button>

        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Art Display */}
          <div className="flex items-center justify-center">
            <div className="relative">
              {/* Glow effect for high rarity */}
              {rarity && (itemRarity === 'legendary' || itemRarity === 'mythic' || itemRarity === 'secret') && (
                <div
                  className="absolute -inset-8 rounded-full opacity-30 blur-2xl"
                  style={{ backgroundColor: rarity.color }}
                />
              )}
              <div className="relative card p-8 bg-slate-900/50 border border-slate-700">
                {artComponent}
              </div>
            </div>
          </div>

          {/* Info Panel */}
          <div className="space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-start justify-between gap-3 mb-2">
                <h1 className="font-display text-3xl font-bold text-ink-100">{itemName}</h1>
                {rarity && (
                  <span
                    className="px-3 py-1 rounded-lg text-sm font-semibold whitespace-nowrap"
                    style={{ backgroundColor: rarity.glow, color: rarity.color }}
                  >
                    {rarity.label}
                  </span>
                )}
              </div>
              {marketItem && (
                <p className="text-sm text-ink-400 capitalize">{category}</p>
              )}
            </div>

            {/* Description */}
            {marketItem && (
              <div className="card p-4 bg-slate-800/30 border border-slate-700">
                <p className="text-ink-300 text-sm leading-relaxed">{marketItem.description}</p>
              </div>
            )}

            {/* Lore */}
            <div>
              <h3 className="font-semibold text-ink-100 mb-2 flex items-center gap-2">
                <Sparkles size={16} />
                Lore
              </h3>
              <p className="text-ink-300 text-sm italic leading-relaxed">
                {generateLore(itemName, itemRarity)}
              </p>
            </div>

            {/* Stats */}
            {marketItem && (
              <div className="card p-4 bg-slate-800/30 border border-slate-700 space-y-3">
                <h3 className="font-semibold text-ink-100">Stats & Requirements</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-ink-400">Price</p>
                    <p className="text-ink-100 font-semibold flex items-center gap-1">
                      <Coins size={14} />
                      {marketItem.price.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-ink-400">XP Requirement</p>
                    <p className="text-ink-100 font-semibold">
                      {marketItem.xpRequired.toLocaleString()} XP
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-ink-400">Required Rank</p>
                    <p className="text-ink-100 font-semibold">{marketItem.rankRequired}</p>
                  </div>
                  {item.boost && (
                    <div className="col-span-2">
                      <p className="text-ink-400">XP Boost</p>
                      <p className="text-ink-100 font-semibold">+{item.boost}%</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2">
              {isOwned && (
                <>
                  {isEquipped ? (
                    <button className="btn-primary w-full flex items-center justify-center gap-2">
                      <Check size={16} />
                      Equipped
                    </button>
                  ) : (
                    <button className="btn-primary w-full">
                      Equip
                    </button>
                  )}
                </>
              )}

              {!isOwned && marketItem && (
                <button
                  disabled={!canAfford || !rankMet}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold transition ${
                    canAfford && rankMet
                      ? 'btn-primary'
                      : 'opacity-50 cursor-not-allowed btn-ghost'
                  }`}
                >
                  <Coins size={16} />
                  Purchase from Marketplace
                </button>
              )}

              {!isOwned && !canAfford && marketItem && (
                <p className="text-xs text-ink-400 text-center flex items-center justify-center gap-1">
                  <Lock size={12} />
                  Need {marketItem.price - (state.coins || 0)} more Coins
                </p>
              )}

              {!isOwned && !rankMet && marketItem && (
                <p className="text-xs text-ink-400 text-center flex items-center justify-center gap-1">
                  <Lock size={12} />
                  Requires {marketItem.rankRequired} rank
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Related Items */}
        {relatedItems.length > 0 && (
          <div>
            <h2 className="section-title mb-4">Related Items</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {relatedItems.map((relItem) => {
                const relRarity = RARITY_META[relItem.rarity as keyof typeof RARITY_META];
                let relArt = null;

                if (category === 'weapon') {
                  relArt = (
                    <WeaponArt
                      id={relItem.id}
                      name={relItem.name}
                      rarity={relItem.rarity}
                      size={120}
                    />
                  );
                } else if (category === 'aura') {
                  relArt = (
                    <AuraArt
                      id={relItem.id}
                      name={relItem.name}
                      rarity={relItem.rarity}
                      color={(relItem as any).color}
                      size={120}
                    />
                  );
                } else if (category === 'shield') {
                  relArt = (
                    <ShieldArt
                      id={relItem.id}
                      name={relItem.name}
                      rarity={relItem.rarity}
                      size={120}
                    />
                  );
                } else if (category === 'frame') {
                  relArt = (
                    <FrameArt
                      id={relItem.id}
                      name={relItem.name}
                      rarity={relItem.rarity}
                      color={relItem.color}
                      size={120}
                    />
                  );
                } else if (category === 'background') {
                  relArt = (
                    <BackgroundArt
                      id={relItem.id}
                      name={relItem.name}
                      size={120}
                    />
                  );
                }

                return (
                  <div key={relItem.id} className="card p-4 flex flex-col items-center text-center">
                    <div className="mb-3">{relArt}</div>
                    <h4 className="font-semibold text-ink-100 text-sm mb-1">{relItem.name}</h4>
                    {relRarity && (
                      <p className="text-xs" style={{ color: relRarity.color }}>
                        {relRarity.label}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
