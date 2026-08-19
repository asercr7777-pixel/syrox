import {
  LayoutDashboard,
  CheckSquare,
  BookOpen,
  Dumbbell,
  User,
  Store,
  Backpack,
  Trophy,
  Users,
  Settings,
  Menu,
  X,
  LogOut,
  Sparkles,
  Swords,
  TreePine,
} from 'lucide-react';
import { useState } from 'react';
import { useStore } from '../store/useStore';
import { getRankByXp } from '../data/ranks';
import { RankBadge } from './ui/RankBadge';
import { XpBar } from './ui/XpBar';
import { getAuraById, getTitleById, RARITY_META } from '../data/collections';
import { playSound } from '../lib/sound';
import { useAuth } from '../lib/auth';

export type ViewId =
  | 'dashboard' | 'tasks' | 'story' | 'workout' | 'dungeons' | 'profile'
  | 'marketplace' | 'inventory' | 'achievements' | 'leaderboard' | 'shadow'
  | 'skilltree' | 'settings' | 'iteminspection';

interface NavItem { id: ViewId; label: string; icon: typeof LayoutDashboard; }

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'story', label: 'Story Mode', icon: BookOpen },
  { id: 'skilltree', label: 'Skill Tree', icon: TreePine },
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

  const handleNav = (v: ViewId) => {
    playSound('click');
    onNavigate(v);
    setMobileOpen(false);
  };

  const handleSignOut = async () => {
    playSound('click');
    await signOut();
  };

  const navButton = (item: NavItem, mobile = false) => {
    const Icon = item.icon;
    const active = current === item.id;
    return (
      <button
        key={item.id}
        onClick={() => handleNav(item.id)}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 ${mobile ? 'mb-1' : ''} ${active ? 'bg-ember-500/10 text-ember-400 border border-ember-500/25' : 'text-ink-300 hover:bg-white/5 hover:text-ink-100'}`}
      >
        <Icon size={18} className={active ? 'text-ember-400' : ''} />
        <span>{item.label}</span>
      </button>
    );
  };

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-white/10 bg-black/70 p-4 backdrop-blur-xl lg:block">
        <div className="mb-6 flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ember-500/15 text-xl">⚔️</div>
          <div><div className="font-black tracking-[0.2em] text-white">SYROX</div><div className="text-[10px] uppercase tracking-widest text-ink-500">Discipline System</div></div>
        </div>
        <div className="mb-5 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-xl">{state.avatar}</div><div className="min-w-0"><div className="truncate text-sm font-bold text-white">{state.username}</div><div className="flex items-center gap-2 text-xs text-ink-400"><RankBadge rank={rank} compact /> <span>{state.streak}🔥</span></div></div></div>
          <XpBar xp={state.xp} className="mt-3" />
          {title && <div className="mt-2 text-xs" style={{ color: titleMeta?.color }}>{title.name}</div>}
          {aura && <div className="mt-1 text-[10px] text-ink-500">{aura.name}</div>}
        </div>
        <nav className="space-y-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 260px)' }}>{NAV_ITEMS.map((item) => navButton(item))}</nav>
        <button onClick={handleSignOut} className="absolute bottom-4 left-4 right-4 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink-400 hover:bg-white/5 hover:text-white"><LogOut size={18} /> Sign out</button>
      </aside>

      <div className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between border-b border-white/10 bg-black/75 px-4 backdrop-blur-xl lg:hidden">
        <div className="font-black tracking-[0.2em] text-white">SYROX</div>
        <button onClick={() => setMobileOpen((v) => !v)} className="rounded-xl p-2 text-ink-300 hover:bg-white/10">{mobileOpen ? <X size={22} /> : <Menu size={22} />}</button>
      </div>
      {mobileOpen && <div className="fixed inset-0 z-40 bg-black/70 pt-16 lg:hidden"><nav className="border-b border-white/10 bg-black/95 p-4">{NAV_ITEMS.map((item) => navButton(item, true))}<button onClick={handleSignOut} className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink-400"><LogOut size={18} /> Sign out</button></nav></div>}
    </>
  );
}
