import { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { AURAS, TITLES, SHIELDS, FRAMES, BACKGROUNDS, BADGES, RARITY_META, type Rarity } from '../data/collections';
import { MARKET_ITEMS } from '../data/marketplace';
import { Modal } from '../components/ui/Modal';
import { Search, Star, Check, Shield, Sparkles, Sword, Package, Crosshair } from 'lucide-react';
import { toast } from '../components/ui/Toast';
import { AuraPreview } from '../components/ui/RankBadge';
import { WeaponArt } from '../art/WeaponArt';

type ItemType = 'aura' | 'weapon' | 'title' | 'shield' | 'frame' | 'background' | 'badge';
type SortMode = 'recent' | 'rarity' | 'name' | 'favorite';

const CATEGORIES: { id: ItemType; label: string; icon: string }[] = [
  { id: 'weapon', label: 'Weapons', icon: '⚔️' },
  { id: 'aura', label: 'Auras', icon: '✦' },
  { id: 'title', label: 'Titles', icon: '◇' },
  { id: 'shield', label: 'Shields', icon: '⬟' },
  { id: 'frame', label: 'Frames', icon: '▣' },
  { id: 'background', label: 'Backgrounds', icon: '◈' },
  { id: 'badge', label: 'Badges', icon: '◆' },
];

const RARITY_ORDER: Record<Rarity, number> = { secret: 6, mythic: 5, legendary: 4, epic: 3, rare: 2, common: 1 };
const TYPE_LABELS: Record<ItemType, string> = { weapon: 'WEAPON', aura: 'AURA', title: 'TITLE', shield: 'SHIELD', frame: 'FRAME', background: 'BACKGROUND', badge: 'BADGE' };

export function Inventory() {
  const { state, equipItem, unequipItem, toggleFavorite } = useStore();
  const [category, setCategory] = useState<ItemType>('weapon');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortMode>('recent');
  const [previewId, setPreviewId] = useState<string | null>(null);

  const allItems = useMemo<any[]>(() => {
    switch (category) {
      case 'weapon': return MARKET_ITEMS.filter((i) => i.category === 'weapons');
      case 'aura': return AURAS;
      case 'title': return TITLES;
      case 'shield': return SHIELDS;
      case 'frame': return FRAMES;
      case 'background': return BACKGROUNDS;
      case 'badge': return BADGES;
    }
  }, [category]);

  const filtered = useMemo(() => {
    let list = state.inventory.filter((i) => i.type === category).map((inv) => {
      const item = allItems.find((x) => x.id === inv.id);
      return item ? { ...item, inv } : null;
    }).filter(Boolean) as any[];
    if (search.trim()) list = list.filter((i) => i.name.toLowerCase().includes(search.trim().toLowerCase()));
    list.sort((a, b) => {
      if (sort === 'recent') return b.inv.obtainedAt - a.inv.obtainedAt;
      if (sort === 'rarity') return RARITY_ORDER[b.rarity as Rarity] - RARITY_ORDER[a.rarity as Rarity];
      if (sort === 'name') return a.name.localeCompare(b.name);
      return Number(b.inv.favorite) - Number(a.inv.favorite);
    });
    return list;
  }, [state.inventory, allItems, search, sort, category]);

  const equippedId = category === 'badge' ? null : (state.equipped as any)[category] as string | null;
  const previewItem = previewId ? allItems.find((i) => i.id === previewId) : null;

  const handleEquip = (id: string) => {
    if (category === 'badge') return toast({ title: 'Badges are display-only', type: 'info' });
    equipItem(category as any, id);
    toast({ title: 'Equipped', message: 'Loadout updated', type: 'success' });
  };

  const renderArt = (item: any, large = false) => {
    if (category === 'weapon') return <WeaponArt id={item.id} name={item.name} rarity={item.rarity} size={large ? 190 : 118} />;
    if (category === 'aura') return <AuraPreview auraId={item.id} size={large ? 'lg' : 'sm'} />;
    return <span className={large ? 'text-7xl' : 'text-5xl'}>{category === 'title' ? '◇' : category === 'shield' ? '⬟' : category === 'frame' ? '▣' : category === 'background' ? '◈' : '◆'}</span>;
  };

  return (
    <div className="space-y-5">
      <header className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/25 p-5 sm:p-7">
        <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-ember-500/10 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[10px] font-bold tracking-[.28em] text-ember-400"><Package size={13} /> HUNTER ARMORY</div>
            <h1 className="section-title">Inventory</h1>
            <p className="mt-1 text-sm text-ink-300">Your collected gear, relics and visual loadout.</p>
          </div>
          <div className="flex gap-2 text-xs text-ink-300"><span className="rounded-full border border-white/10 bg-white/[.03] px-3 py-2">{state.inventory.length} ITEMS</span><span className="rounded-full border border-ember-500/20 bg-ember-500/10 px-3 py-2 text-ember-300">{filtered.length} SHOWN</span></div>
        </div>
      </header>

      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {CATEGORIES.map((c) => {
          const count = state.inventory.filter((i) => i.type === c.id).length;
          const active = category === c.id;
          return <button key={c.id} onClick={() => { setCategory(c.id); setSearch(''); }} className={`group flex shrink-0 items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-bold transition-all ${active ? 'border-ember-400/50 bg-ember-500/15 text-ember-300 shadow-[0_0_24px_rgba(245,158,11,.12)]' : 'border-white/7 bg-white/[.025] text-ink-300 hover:border-white/15 hover:bg-white/[.05]'}`}><span className="text-base">{c.icon}</span><span>{c.label}</span><span className="rounded-full bg-black/25 px-1.5 text-[10px] text-ink-400">{count}</span></button>;
        })}
      </div>

      <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
        <div className="relative min-w-0 sm:flex-1"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" /><input className="input h-11 pl-10" placeholder="Search your collection..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        <select className="input h-11 sm:w-48" value={sort} onChange={(e) => setSort(e.target.value as SortMode)}><option value="recent">Newest First</option><option value="rarity">Highest Rarity</option><option value="name">Name A–Z</option><option value="favorite">Favorites First</option></select>
      </div>

      {filtered.length === 0 ? <div className="rounded-3xl border border-dashed border-white/10 bg-black/20 p-12 text-center"><Crosshair className="mx-auto mb-3 text-ink-500" size={28} /><p className="font-semibold text-ink-300">No {TYPE_LABELS[category].toLowerCase()}s in your collection.</p><p className="mt-1 text-xs text-ink-500">Explore the Marketplace, Dungeons and rewards to find new gear.</p></div> : <div className="grid grid-cols-1 min-[430px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {filtered.map((item) => {
          const meta = RARITY_META[item.rarity as Rarity];
          const equipped = equippedId === item.id;
          return <article key={item.id} className={`group relative overflow-hidden rounded-3xl border bg-black/30 p-3 transition-all duration-300 hover:-translate-y-1 ${equipped ? 'border-ember-400/60 shadow-[0_0_35px_rgba(245,158,11,.15)]' : 'border-white/10 hover:border-white/20'}`} style={{ ['--rarity' as any]: meta.color }}>
            <div className="absolute inset-x-0 top-0 h-px opacity-80" style={{ background: `linear-gradient(90deg,transparent,${meta.color},transparent)` }} />
            <div className="absolute right-3 top-3 z-10 flex gap-1"><button onClick={() => toggleFavorite(item.id)} className="rounded-xl border border-white/10 bg-black/40 p-2 backdrop-blur" aria-label="Favorite"><Star size={14} className={item.inv.favorite ? 'fill-gold-400 text-gold-400' : 'text-ink-500'} /></button></div>
            <button onClick={() => setPreviewId(item.id)} className="relative flex h-44 w-full items-center justify-center overflow-hidden rounded-2xl border border-white/7 bg-gradient-to-b from-white/[.055] to-black/20">
              <div className="absolute inset-0 opacity-30" style={{ background: `radial-gradient(circle at 50% 45%, ${meta.color}35, transparent 62%)` }} />
              <div className="relative transition-transform duration-500 group-hover:scale-110">{renderArt(item)}</div>
              {equipped && <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full border border-ember-400/30 bg-black/70 px-2 py-1 text-[9px] font-black tracking-widest text-ember-300"><Check size={10} /> EQUIPPED</span>}
            </button>
            <div className="px-1 pt-3"><div className="mb-1 flex items-center justify-between gap-2"><span className="text-[9px] font-black tracking-[.22em]" style={{ color: meta.color }}>{meta.label}</span>{item.boost ? <span className="rounded-full bg-emerald-400/10 px-2 py-0.5 text-[9px] font-bold text-emerald-300">+{item.boost}% XP</span> : null}</div><h3 className="line-clamp-2 min-h-10 text-sm font-black leading-5 text-ink-100">{item.name}</h3></div>
            <button onClick={() => equipped ? unequipItem(category as any) : handleEquip(item.id)} disabled={category === 'badge'} className={`mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border py-2.5 text-xs font-black tracking-wider transition ${equipped ? 'border-ember-400/30 bg-ember-500/10 text-ember-300 hover:bg-ember-500/15' : 'border-white/10 bg-white/[.045] text-ink-200 hover:border-ember-400/30 hover:bg-ember-500/10 hover:text-ember-300'} disabled:cursor-not-allowed disabled:opacity-40`}>{equipped ? 'UNEQUIP' : category === 'badge' ? 'DISPLAY ONLY' : 'EQUIP GEAR'}</button>
          </article>;
        })}
      </div>}

      <Modal open={previewId !== null} onClose={() => setPreviewId(null)} title={previewItem?.name ?? 'Gear Inspection'} size="sm">
        {previewItem && <div className="space-y-4"><div className="relative flex min-h-56 items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-black/30"><div className="absolute inset-0" style={{ background: `radial-gradient(circle, ${RARITY_META[previewItem.rarity as Rarity].color}28, transparent 68%)` }} /> <div className="relative">{renderArt(previewItem, true)}</div></div><div><div className="flex items-center justify-between"><span className="text-[10px] font-black tracking-[.25em]" style={{ color: RARITY_META[previewItem.rarity as Rarity].color }}>{RARITY_META[previewItem.rarity as Rarity].label}</span>{previewItem.boost ? <span className="text-xs font-bold text-emerald-300">+{previewItem.boost}% XP</span> : null}</div><h3 className="mt-1 font-display text-2xl font-black">{previewItem.name}</h3><p className="mt-2 text-sm leading-6 text-ink-300">{previewItem.description ?? 'A collectible item from the STRYVEN armory.'}</p></div><button onClick={() => { if (category !== 'badge') { equippedId === previewItem.id ? unequipItem(category as any) : handleEquip(previewItem.id); setPreviewId(null); } }} className="btn-primary w-full">{equippedId === previewItem.id ? 'Unequip' : 'Equip Gear'}</button></div>}
      </Modal>
    </div>
  );
}
