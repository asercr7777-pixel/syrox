import { useEffect, useState } from 'react';
import {
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
  Shield,
} from 'lucide-react';
import { playSound } from '../lib/sound';
import { useAuth } from '../lib/auth';
import { useStore } from '../store/useStore';
import { getRankByXp } from '../data/ranks';
import { NAV_ITEMS, type ViewId } from '../lib/navigation';

export type { ViewId };

const MOBILE_PRIMARY = new Set<ViewId>(['dashboard', 'quests', 'workout', 'evolution']);

interface NavigationProps {
  current: ViewId;
  onNavigate: (v: ViewId) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function Navigation({ current, onNavigate, collapsed, onToggleCollapse }: NavigationProps) {
  const { signOut } = useAuth();
  const { state } = useStore();
  const [moreOpen, setMoreOpen] = useState(false);

  const rank = getRankByXp(state.xp);
  const currentItem = NAV_ITEMS.find((i) => i.id === current) ?? NAV_ITEMS[0];

  useEffect(() => {
    if (!moreOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMoreOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [moreOpen]);

  const handleNav = (v: ViewId) => {
    playSound('click');
    onNavigate(v);
    setMoreOpen(false);
  };

  const handleSignOut = async () => {
    playSound('click');
    setMoreOpen(false);
    await signOut();
  };

  return (
    <>
      {/* Desktop Collapsible Left Sidebar (>= 1024px) */}
      <aside
        aria-label="STRYVEN primary sidebar"
        className={`hidden lg:flex fixed inset-y-0 left-0 z-40 flex-col border-r border-white/10 bg-ink-950/92 backdrop-blur-xl transition-all duration-200 ${
          collapsed ? 'w-[76px]' : 'w-[248px]'
        }`}
      >
        <div className="flex h-16 items-center justify-between gap-2 border-b border-white/10 px-3.5">
          <button
            type="button"
            onClick={() => handleNav('dashboard')}
            className="flex items-center gap-2.5 min-w-0 text-left focus-visible:outline-none"
            aria-label="STRYVEN Dashboard"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-ember-500/40 bg-ember-500/15 text-ember-400">
              <Shield size={18} />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <span className="block font-display text-lg font-bold tracking-[0.14em] text-ink-100 leading-none">
                  STRYVEN
                </span>
                <span className="mt-1 block font-mono text-[10px] uppercase tracking-[0.16em] text-ink-400 leading-none">
                  Hunter OS
                </span>
              </div>
            )}
          </button>

          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ink-400 hover:bg-white/5 hover:text-ink-100 transition"
          >
            {collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2.5 py-4 space-y-1" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = current === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNav(item.id)}
                aria-current={active ? 'page' : undefined}
                title={collapsed ? item.label : undefined}
                className={`group relative flex w-full items-center gap-3 rounded-xl px-3 min-h-[44px] text-sm font-medium transition-colors ${
                  collapsed ? 'justify-center px-0' : ''
                } ${
                  active
                    ? 'bg-ember-500/15 text-ink-100 font-semibold border border-ember-500/30'
                    : 'text-ink-400 hover:bg-white/[0.04] hover:text-ink-100 border border-transparent'
                }`}
              >
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute left-0 top-2.5 bottom-2.5 w-[3px] rounded-r-full bg-ember-400"
                  />
                )}
                <Icon size={18} className={`shrink-0 ${active ? 'text-ember-400' : 'text-ink-400 group-hover:text-ink-200'}`} />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-3 space-y-2.5">
          {!collapsed && (
            <div className="glass-soft px-3 py-2.5 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-ink-100 truncate">{state.username || 'Hunter'}</p>
                <p className="text-[11px] font-mono tabular-nums text-ink-400">
                  LVL {state.level} · <span style={{ color: rank.color }}>{rank.name}</span>
                </p>
              </div>
              <span className="text-base shrink-0" aria-hidden="true" style={{ color: rank.color }}>
                {rank.emoji}
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={() => void handleSignOut()}
            title="Sign out"
            className={`flex w-full items-center gap-2.5 rounded-xl px-3 min-h-[44px] text-xs font-semibold text-ink-400 hover:bg-danger-500/10 hover:text-danger-400 border border-transparent hover:border-danger-500/25 transition ${
              collapsed ? 'justify-center px-0' : ''
            }`}
          >
            <LogOut size={16} className="shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Compact Sticky Top App Bar (< 1024px) */}
      <header className="lg:hidden sticky top-0 z-40 flex h-12 items-center justify-between gap-3 border-b border-white/10 bg-ink-950/92 px-3 backdrop-blur-xl">
        <button
          type="button"
          onClick={() => handleNav('dashboard')}
          className="flex items-center gap-2 min-h-[44px] min-w-0 text-left"
          aria-label="STRYVEN Dashboard"
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-ember-500/40 bg-ember-500/15 text-ember-400">
            <Shield size={14} />
          </div>
          <span className="font-display text-sm font-bold tracking-[0.12em] text-ink-100">STRYVEN</span>
          <span className="text-ink-600">/</span>
          <span className="truncate text-xs font-medium text-ink-300">{currentItem.label}</span>
        </button>

        <button
          type="button"
          onClick={() => setMoreOpen((v) => !v)}
          aria-label={moreOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={moreOpen}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-ink-200 hover:bg-white/5"
        >
          {moreOpen ? <X size={19} /> : <Menu size={19} />}
        </button>
      </header>

      {/* Mobile Slide-Up More Drawer (< 1024px) */}
      {moreOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="All navigation sections"
          className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end"
        >
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={() => setMoreOpen(false)}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />
          <div className="relative sv-surface rounded-b-none rounded-t-2xl border-b-0 p-4 pb-6 space-y-2 animate-slide-up">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/20" />
            <div className="flex items-center justify-between px-1 pb-2">
              <span className="eyebrow-label">ALL MODULES</span>
              <span className="text-xs font-mono text-ink-400">
                LVL {state.level} · {rank.name}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-1.5">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = current === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNav(item.id)}
                    aria-current={active ? 'page' : undefined}
                    className={`flex items-center gap-3 rounded-xl px-3.5 min-h-[44px] text-sm font-medium transition ${
                      active
                        ? 'bg-ember-500/20 text-ink-100 font-semibold border border-ember-500/35'
                        : 'bg-white/[0.02] text-ink-300 hover:bg-white/[0.06]'
                    }`}
                  >
                    <Icon size={18} className={active ? 'text-ember-400' : 'text-ink-400'} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => void handleSignOut()}
                className="mt-1 flex items-center gap-3 rounded-xl px-3.5 min-h-[44px] text-sm font-semibold text-danger-400 bg-danger-500/10 border border-danger-500/25"
              >
                <LogOut size={18} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Fixed Bottom Tab Bar (< 1024px) */}
      <nav
        aria-label="Mobile primary navigation"
        className="lg:hidden fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 h-16 border-t border-white/10 bg-ink-950/95 backdrop-blur-xl px-1"
      >
        {NAV_ITEMS.filter((item) => MOBILE_PRIMARY.has(item.id)).map((item) => {
          const Icon = item.icon;
          const active = current === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNav(item.id)}
              aria-current={active ? 'page' : undefined}
              className={`flex flex-col items-center justify-center gap-0.5 min-h-[44px] rounded-xl transition ${
                active ? 'text-ember-400' : 'text-ink-400 hover:text-ink-200'
              }`}
            >
              <Icon size={19} strokeWidth={active ? 2.2 : 1.8} />
              <span className="text-[10px] font-semibold tracking-tight truncate max-w-full px-1">
                {item.shortLabel}
              </span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          aria-label="More pages"
          aria-expanded={moreOpen}
          className={`flex flex-col items-center justify-center gap-0.5 min-h-[44px] rounded-xl transition ${
            !MOBILE_PRIMARY.has(current) ? 'text-ember-400' : 'text-ink-400 hover:text-ink-200'
          }`}
        >
          <Menu size={19} />
          <span className="text-[10px] font-semibold tracking-tight">More</span>
        </button>
      </nav>
    </>
  );
}
