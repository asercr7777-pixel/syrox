import { useEffect, useState } from 'react';
import { Bell, CalendarClock, Settings, UserRound } from 'lucide-react';
import { useStore } from '../store/useStore';
import { NAV_ITEMS, type ViewId } from '../lib/navigation';
import { getRankByXp } from '../data/ranks';

interface SystemStatusBarProps {
  current: ViewId;
  onNavigate: (view: ViewId) => void;
}

export function SystemStatusBar({ current, onNavigate }: SystemStatusBarProps) {
  const { state } = useStore();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const date = new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: '2-digit',
  }).format(now);

  const time = new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(now);

  const activeLabel = NAV_ITEMS.find((i) => i.id === current)?.label ?? 'Dashboard';
  const rank = getRankByXp(state.xp);
  const notificationsEnabled = Object.values(state.notifications).some(Boolean);

  return (
    <header
      aria-label="Workspace header"
      className="hidden lg:flex h-14 items-center justify-between gap-4 border-b border-white/10 bg-ink-950/75 px-6 backdrop-blur-xl sticky top-0 z-30"
    >
      <div className="flex items-center gap-2 text-xs font-mono text-ink-400">
        <span className="font-semibold text-ink-200">STRYVEN</span>
        <span aria-hidden="true" className="text-ink-600">/</span>
        <span className="text-ember-400 font-semibold">{activeLabel}</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-ink-900/70 px-3 py-1.5 text-xs font-mono tabular-nums text-ink-300">
          <CalendarClock size={14} className="text-frost-400" />
          <span>{date}</span>
          <span className="text-ink-600">|</span>
          <span className="font-semibold text-ink-100">{time}</span>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('profile')}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-ink-900/70 px-3 min-h-[38px] text-xs hover:border-ember-500/40 transition"
          aria-label="Open Hunter Profile"
        >
          <UserRound size={14} className="text-ember-400" />
          <span className="font-semibold text-ink-100 max-w-[120px] truncate">{state.username || 'Hunter'}</span>
          <span className="font-mono text-[11px] tabular-nums" style={{ color: rank.color }}>
            {rank.name}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('settings')}
          aria-label="Open notification and system settings"
          title={notificationsEnabled ? 'Reminders enabled — open Settings' : 'Reminders muted — open Settings'}
          className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-ink-900/70 text-ink-300 hover:border-ember-500/40 hover:text-ink-100 transition"
        >
          <Bell size={16} />
          {notificationsEnabled && (
            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-frost-400" />
          )}
        </button>

        <button
          type="button"
          onClick={() => onNavigate('settings')}
          aria-label="Open Settings"
          title="Open Settings"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-ink-900/70 text-ink-300 hover:border-ember-500/40 hover:text-ink-100 transition"
        >
          <Settings size={16} />
        </button>
      </div>
    </header>
  );
}
