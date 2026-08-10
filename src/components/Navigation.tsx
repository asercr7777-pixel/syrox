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
  Bell,
  AlarmClock,
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
  | 'dashboard'
  | 'tasks'
  | 'story'
  | 'workout'
  | 'dungeons'
  | 'profile'
  | 'marketplace'
  | 'inventory'
  | 'achievements'
  | 'leaderboard'
  | 'shadow'
  | 'settings'
  | 'notifications'
  | 'reminders'
  | 'iteminspection';

interface NavItem {
  id: ViewId;
  label: string;
  icon: typeof LayoutDashboard;
}

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
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'reminders', label: 'Reminders', icon: AlarmClock },
  { id: 'settings', label: 'Settings', icon: Settings },
];

interface NavigationProps {
  current: ViewId;
  onNavigate: (v: ViewId) => void;
}

const MENTALIST_URL = 'https://mentalist.bolt.host/';

export function Navigation({ current, onNavigate }: NavigationProps) {
  const { state } = useStore();
  const { signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const rank = getRankByXp(state.xp);
  const aura = state.equipped.aura ? getAuraById(state.equipped.aura) : null;
  const title = state.equipped.title ? getTitleById(state.equipped.title) : null;
  const titleMeta = title ? RARITY_META[title.rarity] : null;
  const isHighRarityTitle = title && (title.rarity === 'legendary' || title.rarity === 'mythic' || title.rarity === 'secret');

  const handleNav = (v: ViewId) => {
    playSound('click');
    onNavigate(v);
    setMobileOpen(false);
  };

  const handleSignOut = async () => {
    playSound('click');
    await signOut();
  };

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 flex-col glass border-r border-white/5 z-40">
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <RankBadge rank={rank} size="sm" auraColor={aura?.color} />
            <div className="min-w-0">
              <a
                href={MENTALIST_URL}
                aria-label="Open Mentalist"
                className="font-display font-bold text-sm truncate block cursor-pointer hover:text-ember-400 transition-colors"
              >
                {state.username}
              </a>
              {title && (
                <p
                  className="text-[10px] font-semibold uppercase tracking-wider truncate"
                  style={{
                    color: titleMeta?.color,
                    textShadow: isHighRarityTitle ? `0 0 8px ${titleMeta?.glow}` : 'none',
                    animation: isHighRarityTitle ? 'titleGlow 2s ease-in-out infinite alternate' : 'none',
                  }}
                >
                  {title.name}
                </p>
              )}
              <p className="text-xs text-ink-300">{rank.name} {rank.emoji}</p>
            </div>
          </div>
          <div className="mt-3">
            <XpBar xp={state.xp} compact />
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-thin">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = current === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'bg-gradient-to-r from-ember-500/20 to-transparent text-ember-400 border border-ember-500/30'
                    : 'text-ink-300 hover:bg-white/5 hover:text-ink-100'
                }`}
              >
                <Icon size={18} className={active ? 'text-ember-400' : ''} />
                <span className="flex-1 text-left">{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="p-3 border-t border-white/5">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-ink-300 hover:bg-danger-500/10 hover:text-danger-400 transition-all"
          >
            <LogOut size={18} />
            <span className="flex-1 text-left">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 glass border-b border-white/5">
        <div className="flex items-center justify-between px-2 sm:px-3 py-1.5">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <RankBadge rank={rank} size="sm" auraColor={aura?.color} />
            <div className="min-w-0">
              <a
                href={MENTALIST_URL}
                aria-label="Open Mentalist"
                className="font-display font-bold text-xs leading-tight truncate block cursor-pointer hover:text-ember-400 transition-colors"
              >
                {state.username}
              </a>
              {title && (
                <p
                  className="text-[9px] font-semibold uppercase tracking-wider leading-tight truncate"
                  style={{
                    color: titleMeta?.color,
                    textShadow: isHighRarityTitle ? `0 0 8px ${titleMeta?.glow}` : 'none',
                    animation: isHighRarityTitle ? 'titleGlow 2s ease-in-out infinite alternate' : 'none',
                  }}
                >
                  {title.name}
                </p>
              )}
              <p className="text-[10px] text-ink-300 leading-tight truncate">{rank.name} · Lvl {state.level}</p>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-1.5 rounded-lg hover:bg-white/10 flex-shrink-0"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
        <div className="px-2 sm:px-3 pb-1.5">
          <XpBar xp={state.xp} compact />
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 animate-fade-in">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64 sm:w-72 max-w-[85vw] glass border-r border-white/5 p-3 overflow-y-auto animate-slide-up">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = current === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all mb-1 ${
                    active
                      ? 'bg-gradient-to-r from-ember-500/20 to-transparent text-ember-400 border border-ember-500/30'
                      : 'text-ink-300 hover:bg-white/5'
                  }`}
                >
                  <Icon size={18} />
                  <span className="flex-1 text-left">{item.label}</span>
                </button>
              );
            })}
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-ink-300 hover:bg-danger-500/10 hover:text-danger-400 transition-all mt-2"
            >
              <LogOut size={18} />
              <span className="flex-1 text-left">Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
