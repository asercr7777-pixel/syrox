import { useEffect, useState } from 'react';
import { Bell, CalendarClock, ChevronRight, UserRound } from 'lucide-react';
import { useStore } from '../store/useStore';
import type { ViewId } from './Navigation';

interface SystemStatusBarProps { onNavigate: (view: ViewId) => void; }

export function SystemStatusBar({ onNavigate }: SystemStatusBarProps) {
  const { state } = useStore();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const date = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Cairo', weekday: 'short', month: 'short', day: '2-digit',
  }).format(now).toUpperCase();
  const time = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Cairo', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZoneName: 'short',
  }).format(now).toUpperCase();
  const notificationsEnabled = Object.values(state.notifications).some(Boolean);

  return <header className="sv-system-topbar" aria-label="System status">
    <div className="sv-system-topbar__signal">
      <span className="sv-online-dot" />
      <div><strong>ONLINE CORE <i>//</i> SYS.01</strong><small>COMMAND LINK ESTABLISHED</small></div>
    </div>
    <div className="sv-system-topbar__right">
      <div className="sv-system-clock"><CalendarClock size={15}/><span>{date}</span><i>|</i><b>{time}</b></div>
      <div className="sv-system-user"><span className="sv-system-user__icon"><UserRound size={15}/></span><span><small>HUNTER</small><b>{state.username || 'PLAYER_01'}</b></span></div>
      <button className="sv-system-notifications" onClick={() => onNavigate('settings')} aria-label="Open notification preferences" title={notificationsEnabled ? 'Notification preferences are enabled' : 'Notification preferences are disabled'}>
        <Bell size={17}/><span className={notificationsEnabled ? 'is-enabled' : ''}/>
      </button>
      <button className="sv-system-settings-link" onClick={() => onNavigate('profile')} aria-label="Open hunter profile"><ChevronRight size={16}/></button>
    </div>
  </header>;
}
