import { LayoutDashboard, CheckSquare, BookOpen, Dumbbell, User, Store, Backpack, Trophy, Users, Settings, Menu, X, LogOut, Sparkles, Swords, Palette, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import { useStore } from '../store/useStore';
import { getRankByXp } from '../data/ranks';
import { RankBadge } from './ui/RankBadge';
import { UserAvatar } from './ui/UserAvatar';
import { XpBar } from './ui/XpBar';
import { getAuraById, getTitleById, RARITY_META } from '../data/collections';
import { playSound } from '../lib/sound';
import { useAuth } from '../lib/auth';
import type { SiteTheme } from '../store/types';

export type ViewId = 'dashboard' | 'tasks' | 'story' | 'workout' | 'dungeons' | 'profile' | 'marketplace' | 'inventory' | 'achievements' | 'leaderboard' | 'community' | 'shadow' | 'skilltree' | 'worldmap' | 'settings' | 'iteminspection';
interface NavItem { id: ViewId; label: string; icon: typeof LayoutDashboard; }
const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }, { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'story', label: 'Story Mode', icon: BookOpen }, { id: 'workout', label: 'Workout', icon: Dumbbell },
  { id: 'dungeons', label: 'Dungeons', icon: Swords }, { id: 'profile', label: 'Hunter Profile', icon: User },
  { id: 'marketplace', label: 'Marketplace', icon: Store }, { id: 'inventory', label: 'Inventory', icon: Backpack },
  { id: 'achievements', label: 'Achievements', icon: Trophy }, { id: 'leaderboard', label: 'Leaderboard', icon: Users },
  { id: 'community', label: 'Community', icon: MessageCircle }, { id: 'shadow', label: 'Shadow AI', icon: Sparkles }, { id: 'settings', label: 'Settings', icon: Settings },
];
const THEMES: { id: SiteTheme; name: string; colors: string }[] = [
  { id: 'shadow', name: 'Shadow', colors: 'linear-gradient(135deg,#8b5cf6,#111827)' }, { id: 'ember', name: 'Ember', colors: 'linear-gradient(135deg,#ff7a18,#431407)' },
  { id: 'frost', name: 'Frost', colors: 'linear-gradient(135deg,#38bdf8,#082f49)' }, { id: 'ocean', name: 'Ocean', colors: 'linear-gradient(135deg,#2563eb,#082f49)' },
  { id: 'emerald', name: 'Emerald', colors: 'linear-gradient(135deg,#10b981,#052e16)' }, { id: 'crimson', name: 'Crimson', colors: 'linear-gradient(135deg,#e11d48,#4c0519)' },
  { id: 'royal', name: 'Royal', colors: 'linear-gradient(135deg,#6366f1,#581c87)' }, { id: 'gold', name: 'Gold', colors: 'linear-gradient(135deg,#f59e0b,#451a03)' },
];
interface NavigationProps { current: ViewId; onNavigate: (v: ViewId) => void; }

export function Navigation({ current, onNavigate }: NavigationProps) {
  const { state, updateProfile } = useStore(); const { signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false); const [themeOpen, setThemeOpen] = useState(false);
  const rank = getRankByXp(state.xp); const aura = state.equipped.aura ? getAuraById(state.equipped.aura) : null;
  const title = state.equipped.title ? getTitleById(state.equipped.title) : null; const titleMeta = title ? RARITY_META[title.rarity] : null;
  const handleNav = (v: ViewId) => { playSound('click'); onNavigate(v); setMobileOpen(false); };
  const handleSignOut = async () => { playSound('click'); await signOut(); };
  const brand = <div className="select-none font-black text-white tracking-[0.34em] leading-none text-[1.2rem] sm:text-[1.3rem]">FORGED</div>;
  const navButton = (item: NavItem, mobile = false) => { const Icon = item.icon; const active = current === item.id; return <button key={item.id} onClick={() => handleNav(item.id)} className={`group w-full flex shrink-0 items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200 ${mobile ? 'mb-1.5 px-3 py-3' : 'px-3 py-2.5'} ${active ? 'bg-gradient-to-r from-ember-500/15 via-ember-500/8 to-transparent text-ember-300 border border-ember-500/25 shadow-[inset_3px_0_0_rgba(255,122,18,0.9),0_6px_20px_rgba(0,0,0,0.16)]' : 'text-ink-300 border border-transparent hover:bg-white/[0.045] hover:text-white hover:border-white/[0.06]'}`}><Icon size={18} strokeWidth={active ? 2.3 : 1.8} className={`shrink-0 transition-transform duration-200 ${active ? 'text-ember-400' : 'text-ink-500 group-hover:text-ink-200 group-hover:scale-105'}`} /><span className="truncate">{item.label}</span></button>; };
  return <>
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-white/[0.08] bg-black/90 p-4 lg:flex lg:flex-col">
      <div className="shrink-0 px-2 pt-1 pb-5">{brand}</div>
      <div className="shrink-0 rounded-2xl border border-white/[0.08] bg-black/60 p-3.5">
        <div className="flex items-center gap-3"><UserAvatar avatar={state.avatar} rank={rank} size="sm" /><div className="min-w-0 flex-1"><div className="truncate text-sm font-bold text-white">{state.username}</div><div className="mt-1 flex items-center gap-2 text-xs text-ink-400"><RankBadge rank={rank} compact /> <span>{state.streak}🔥</span></div></div><button onClick={() => setThemeOpen((v) => !v)} className="shrink-0 rounded-lg p-1.5 text-ink-500 hover:bg-white/5 hover:text-ink-100" title="Change theme"><Palette size={15} /></button></div>
        <XpBar xp={state.xp} className="mt-3.5" />{title && <div className="mt-3 truncate text-xs font-semibold" style={{ color: titleMeta?.color }}>{title.name}</div>}{aura && <div className="mt-1 truncate text-[10px] text-ink-500">{aura.name}</div>}
        {themeOpen && <div className="mt-3 grid grid-cols-4 gap-1.5 rounded-xl border border-white/10 bg-black/80 p-2">{THEMES.map((t) => <button key={t.id} onClick={() => { updateProfile({ theme: t.id }); playSound('click'); setThemeOpen(false); }} title={t.name} className={`h-7 rounded-lg border ${state.theme === t.id ? 'border-white' : 'border-white/10'}`} style={{ background: t.colors }} />)}</div>}
      </div>
      <nav className="mt-4 min-h-0 flex-1 space-y-1 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">{NAV_ITEMS.map((item) => navButton(item))}</nav>
      <div className="shrink-0 border-t border-white/[0.08] pt-3 mt-3"><button onClick={handleSignOut} className="flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-sm text-ink-500 transition hover:border-white/[0.06] hover:bg-white/[0.04] hover:text-white"><LogOut size={18} /> Sign out</button></div>
    </aside>
    <div className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-center border-b border-white/[0.08] bg-black/95 px-4 shadow-[0_8px_20px_rgba(0,0,0,0.16)] lg:hidden"><div className="flex items-center">{brand}</div><button aria-label="Open menu" onClick={() => setMobileOpen((v) => !v)} className="absolute right-4 rounded-xl border border-white/[0.06] bg-white/[0.025] p-2 text-ink-300 transition hover:bg-white/[0.07] hover:text-white">{mobileOpen ? <X size={22} /> : <Menu size={22} />}</button></div>
    {mobileOpen && <div className="fixed inset-0 z-40 bg-black/90 pt-16 lg:hidden"><nav className="flex max-h-[calc(100vh-4rem)] flex-col overflow-y-auto border-b border-white/[0.08] bg-black/95 p-4 shadow-2xl"><div className="mb-3 shrink-0 rounded-xl border border-white/10 bg-black/60 p-3"><div className="flex items-center justify-between"><span className="text-xs text-ink-400">Theme</span><div className="flex gap-1">{THEMES.map((t) => <button key={t.id} onClick={() => updateProfile({ theme: t.id })} title={t.name} className={`h-6 w-6 rounded-md border ${state.theme === t.id ? 'border-white' : 'border-white/10'}`} style={{ background: t.colors }} />)}</div></div></div><div className="min-h-0 flex-1 overflow-y-auto">{NAV_ITEMS.map((item) => navButton(item, true))}</div><div className="mt-2 shrink-0 border-t border-white/[0.08] pt-2"><button onClick={handleSignOut} className="flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-3 text-sm text-ink-500 transition hover:border-white/[0.06] hover:bg-white/[0.04] hover:text-white"><LogOut size={18} /> Sign out</button></div></nav></div>}
  </>;
}
