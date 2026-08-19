import { LayoutDashboard, CheckSquare, BookOpen, Dumbbell, User, Store, Backpack, Trophy, Users, Settings, Menu, X, LogOut, Sparkles, Swords } from 'lucide-react';
import { useState } from 'react';
import { useStore } from '../store/useStore';
import { getRankByXp } from '../data/ranks';
import { RankBadge } from './ui/RankBadge';
import { XpBar } from './ui/XpBar';
import { getAuraById, getTitleById, RARITY_META } from '../data/collections';
import { playSound } from '../lib/sound';
import { useAuth } from '../lib/auth';

export type ViewId = 'dashboard' | 'tasks' | 'story' | 'workout' | 'dungeons' | 'profile' | 'marketplace' | 'inventory' | 'achievements' | 'leaderboard' | 'shadow' | 'skilltree' | 'settings' | 'iteminspection';
interface NavItem { id: ViewId; label: string; icon: typeof LayoutDashboard; }
const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'story', label: 'Story Mode', icon: BookOpen },
  { id: 'workout', label: 'Workout', icon: Dumbbell },
  { id: 'dungeons', label: 'Dungeons', icon: Swords },
  { id: 'profile', label: 'Hunter Profile', icon: User },
  { id: 'marketplace', label: 'Marketplace', icon: Store },
  { id: 'inventory', label: 'Inventory', icon: Backpack },
  { id: 'achievements', label: 'Achievements', icon: Trophy },
  { id: 'leaderboard', label: 'Leaderboard', icon: Users },
  { id: 'shadow', label: 'Shadow AI', icon: Sparkles },
  { id: 'settings', label: 'Settings', icon: Settings },
];

interface NavigationProps { current: ViewId; onNavigate: (v: ViewId) => void; }
export function Navigation({ current, onNavigate }: NavigationProps) {
  const { state } = useStore();
  const { signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const rank = getRankByXp(state.xp);
  const aura = state.equipped.aura ? getAuraById(state.equipped.aura) : null;
  const title = state.equipped.title ? getTitleById(state.equipped.title) : null;
  const titleMeta = title ? RARITY_META[title.rarity] : null;
  const handleNav = (v: ViewId) => { playSound('click'); onNavigate(v); setMobileOpen(false); };
  const handleSignOut = async () => { playSound('click'); await signOut(); };
  const brand = <div className="select-none font-black text-white tracking-[0.34em] leading-none text-[1.2rem] sm:text-[1.3rem]">FORGED</div>;
  const navButton = (item: NavItem, mobile = false) => {
    const Icon = item.icon;
    const active = current === item.id;
    return <button key={item.id} onClick={() => handleNav(item.id)} className={`group w-full flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200 ${mobile ? 'mb-1.5 px-3 py-3' : 'px-3 py-2.5'} ${active ? 'bg-gradient-to-r from-ember-500/15 via-ember-500/8 to-transparent text-ember-300 border border-ember-500/25 shadow-[inset_3px_0_0_rgba(255,122,24,0.9),0_6px_20px_rgba(0,0,0,0.16)]' : 'text-ink-300 border border-transparent hover:bg-white/[0.045] hover:text-white hover:border-white/[0.06]'}`}><Icon size={18} strokeWidth={active ? 2.3 : 1.8} className={`shrink-0 transition-transform duration-200 ${active ? 'text-ember-400' : 'text-ink-500 group-hover:text-ink-200 group-hover:scale-105'}`} /><span>{item.label}</span></button>;
  };
  return <>
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-white/[0.08] bg-black/90 p-4 lg:block">
      <div className="mb-8 px-2 pt-1">
        {brand}
      </div>
      <div className="mb-5 rounded-2xl border border-white/[0.08] bg-black/60 p-3.5">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-ember-500/20 bg-ember-500/10 text-xl">{state.avatar}</div>
          <div className="min-w-0"><div className="truncate text-sm font-bold text-white">{state.username}</div><div className="mt-1 flex items-center gap-2 text-xs text-ink-400"><RankBadge rank={rank} compact /> <span>{state.streak}🔥</span></div></div>
        </div>
        <XpBar xp={state.xp} className="mt-3.5" />
        {title && <div className="mt-3 truncate text-xs font-semibold" style={{ color: titleMeta?.color }}>{title.name}</div>}
        {aura && <div className="mt-1 truncate text-[10px] text-ink-500">{aura.name}</div>}
      </div>
      <nav className="space-y-1 overflow-y-auto pr-1" style={{ maxHeight: 'calc(100vh - 285px)' }}>{NAV_ITEMS.map((item) => navButton(item))}</nav>
      <button onClick={handleSignOut} className="absolute bottom-4 left-4 right-4 flex items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-sm text-ink-500 transition hover:border-white/[0.06] hover:bg-white/[0.04] hover:text-white"><LogOut size={18} /> Sign out</button>
    </aside>
    <div className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-center border-b border-white/[0.08] bg-black/95 px-4 shadow-[0_8px_20px_rgba(0,0,0,0.16)] lg:hidden"><div className="flex items-center">{brand}</div><button aria-label="Open menu" onClick={() => setMobileOpen((v) => !v)} className="absolute right-4 rounded-xl border border-white/[0.06] bg-white/[0.025] p-2 text-ink-300 transition hover:bg-white/[0.07] hover:text-white">{mobileOpen ? <X size={22} /> : <Menu size={22} />}</button></div>
    {mobileOpen && <div className="fixed inset-0 z-40 bg-black/90 pt-16 lg:hidden"><nav className="max-h-[calc(100vh-4rem)] overflow-y-auto border-b border-white/[0.08] bg-black/95 p-4 shadow-2xl">{NAV_ITEMS.map((item) => navButton(item, true))}<button onClick={handleSignOut} className="mt-2 flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-3 text-sm text-ink-500 transition hover:border-white/[0.06] hover:bg-white/[0.04] hover:text-white"><LogOut size={18} /> Sign out</button></nav></div>}
  </>;
}
