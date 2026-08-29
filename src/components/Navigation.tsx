import { LayoutDashboard, CheckSquare, BookOpen, Dumbbell, User, Store, Backpack, Trophy, Users, Settings, Menu, X, LogOut, MessageCircle, Swords, Brain } from 'lucide-react';
import { useState } from 'react';
import { useStore } from '../store/useStore';
import { playSound } from '../lib/sound';
import { useAuth } from '../lib/auth';

export type ViewId = 'dashboard' | 'tasks' | 'story' | 'workout' | 'shadowai' | 'dungeons' | 'profile' | 'marketplace' | 'inventory' | 'achievements' | 'leaderboard' | 'community' | 'skilltree' | 'worldmap' | 'settings' | 'iteminspection';
interface NavItem { id: ViewId; label: string; icon: typeof LayoutDashboard; }
const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }, { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'story', label: 'Story Mode', icon: BookOpen }, { id: 'workout', label: 'Workout', icon: Dumbbell },
  { id: 'shadowai', label: 'Shadow AI', icon: Brain }, { id: 'dungeons', label: 'Dungeons', icon: Swords }, { id: 'profile', label: 'Hunter Profile', icon: User },
  { id: 'marketplace', label: 'Marketplace', icon: Store }, { id: 'inventory', label: 'Inventory', icon: Backpack },
  { id: 'achievements', label: 'Achievements', icon: Trophy }, { id: 'leaderboard', label: 'Leaderboard', icon: Users },
  { id: 'community', label: 'Community', icon: MessageCircle }, { id: 'settings', label: 'Settings', icon: Settings },
];
interface NavigationProps { current: ViewId; onNavigate: (v: ViewId) => void; }
export function Navigation({ current, onNavigate }: NavigationProps) {
  const { state } = useStore(); const { signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const handleNav = (v: ViewId) => { playSound('click'); onNavigate(v); setMobileOpen(false); };
  const handleSignOut = async () => { playSound('click'); await signOut(); };
  const brand = <div className="select-none font-black text-white tracking-[0.30em] leading-none text-[1.15rem] sm:text-[1.25rem]">STRYVEN</div>;
  const navButton = (item: NavItem, mobile = false) => { const Icon = item.icon; const active = current === item.id; return <button key={item.id} onClick={() => handleNav(item.id)} className={`group w-full flex shrink-0 items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200 ${mobile ? 'mb-1 px-3 py-2.5' : 'px-3 py-2.5'} ${active ? 'bg-ember-500/15 text-ember-300 border border-ember-500/25 shadow-[inset_3px_0_0_rgb(var(--accent-500)/.9),0_6px_20px_rgb(0_0_0/.16)]' : 'text-ink-300 border border-transparent hover:bg-white/[0.045] hover:text-white hover:border-white/[0.06]'}`}><Icon size={18} strokeWidth={active ? 2.3 : 1.8} className={`shrink-0 transition-transform duration-200 ${active ? 'text-ember-400' : 'text-ink-500 group-hover:text-ink-200 group-hover:scale-105'}`} /><span className="truncate">{item.label}</span></button>; };
  return <>
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-white/[0.08] bg-black/90 p-3.5 lg:flex lg:flex-col"><div className="shrink-0 px-2 pt-1 pb-4">{brand}</div><nav className="min-h-0 flex-1 space-y-0.5 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">{NAV_ITEMS.map((item) => navButton(item))}</nav><div className="shrink-0 border-t border-white/[0.08] pt-2.5 mt-2.5"><button onClick={handleSignOut} className="flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-sm text-ink-500 transition hover:border-white/[0.06] hover:bg-white/[0.04] hover:text-white"><LogOut size={18} /> Sign out</button></div></aside>
    <div className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-center border-b border-white/[0.08] bg-black/95 px-4 shadow-[0_8px_20px_rgb(0_0_0/.16)] lg:hidden"><div className="flex items-center">{brand}</div><button aria-label="Open menu" onClick={() => setMobileOpen((v) => !v)} className="absolute right-4 rounded-xl border border-white/[0.06] bg-white/[0.025] p-2 text-ink-300 transition hover:bg-white/[0.07] hover:text-white">{mobileOpen ? <X size={22} /> : <Menu size={22} />}</button></div>
    {mobileOpen && <div className="fixed inset-0 z-40 bg-black/90 pt-16 lg:hidden"><nav className="flex h-[calc(100vh-4rem)] flex-col overflow-hidden border-b border-white/[0.08] bg-black/95 p-3 shadow-2xl"><div className="min-h-0 flex-1 overflow-y-auto">{NAV_ITEMS.map((item) => navButton(item, true))}</div><div className="mt-2 shrink-0 border-t border-white/[0.08] pt-2"><button onClick={handleSignOut} className="flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-3 text-sm text-ink-500 transition hover:border-white/[0.06] hover:bg-white/[0.04] hover:text-white"><LogOut size={18} /> Sign out</button></div></nav></div>}
  </>;
}
