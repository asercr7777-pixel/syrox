import { LayoutDashboard, CheckSquare, BookOpen, Dumbbell, User, Users, Settings, Menu, X, LogOut, Swords, MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import { playSound } from '../lib/sound';
import { useAuth } from '../lib/auth';

export type ViewId = 'dashboard' | 'tasks' | 'story' | 'workout' | 'dungeons' | 'profile' | 'leaderboard' | 'worldmap' | 'settings';
interface NavItem { id: ViewId; label: string; icon: typeof LayoutDashboard; }

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Command', icon: LayoutDashboard },
  { id: 'tasks', label: 'Missions', icon: CheckSquare },
  { id: 'story', label: 'Journey', icon: BookOpen },
  { id: 'workout', label: 'Training', icon: Dumbbell },
  { id: 'dungeons', label: 'Dungeons', icon: Swords },
  { id: 'profile', label: 'Hunter', icon: User },
  { id: 'leaderboard', label: 'Rankings', icon: Users },
  { id: 'settings', label: 'Settings', icon: Settings },
];

interface NavigationProps { current: ViewId; onNavigate: (v: ViewId) => void; }

export function Navigation({ current, onNavigate }: NavigationProps) {
  const { signOut } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);
  const primary = NAV_ITEMS.slice(0, 5);
  const secondary = NAV_ITEMS.slice(5);

  const handleNav = (v: ViewId) => { playSound('click'); onNavigate(v); setMoreOpen(false); };
  const handleSignOut = async () => { playSound('click'); await signOut(); };
  const brand = <div className="stryven-brand select-none" aria-label="STRYVEN"><span>STRYVEN</span><i aria-hidden="true" /></div>;

  return <>
    <header className="stryven-topbar">
      <div className="stryven-topbar-brand">{brand}</div>
      <nav className="stryven-topnav" aria-label="Primary navigation">
        {NAV_ITEMS.map((item) => { const Icon = item.icon; const active = current === item.id; return <button key={item.id} onClick={() => handleNav(item.id)} aria-current={active ? 'page' : undefined} className={`stryven-topnav-item ${active ? 'is-active' : ''}`}><Icon size={17} strokeWidth={active ? 2.4 : 1.8} /><span>{item.label}</span></button>; })}
      </nav>
      <button className="stryven-signout" onClick={handleSignOut} aria-label="Sign out"><LogOut size={17} /></button>
    </header>

    <div className="stryven-mobile-header">
      {brand}
      <button className="stryven-mobile-more" onClick={() => setMoreOpen((v) => !v)} aria-label={moreOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={moreOpen}>{moreOpen ? <X size={21} /> : <Menu size={21} />}</button>
    </div>

    {moreOpen && <div className="stryven-mobile-sheet" role="dialog" aria-modal="true" aria-label="Navigation menu">
      <button className="stryven-sheet-backdrop" aria-label="Close navigation" onClick={() => setMoreOpen(false)} />
      <div className="stryven-mobile-sheet-inner">
        <div className="stryven-mobile-sheet-handle" aria-hidden="true" />
        <div className="stryven-mobile-sheet-title">System Menu</div>
        {secondary.map((item) => { const Icon = item.icon; return <button key={item.id} className={`stryven-sheet-item ${current === item.id ? 'is-active' : ''}`} aria-current={current === item.id ? 'page' : undefined} onClick={() => handleNav(item.id)}><Icon size={19} /><span>{item.label}</span></button>; })}
        <button className="stryven-sheet-item is-danger" onClick={handleSignOut}><LogOut size={19} /><span>Sign out</span></button>
      </div>
    </div>}

    <nav className="stryven-bottomnav" aria-label="Mobile navigation">
      {primary.map((item) => { const Icon = item.icon; const active = current === item.id; return <button key={item.id} onClick={() => handleNav(item.id)} aria-current={active ? 'page' : undefined} className={`stryven-bottomnav-item ${active ? 'is-active' : ''}`}><Icon size={20} strokeWidth={active ? 2.5 : 1.7} /><span>{item.label}</span></button>; })}
      <button onClick={() => setMoreOpen((v) => !v)} className={`stryven-bottomnav-item ${moreOpen || secondary.some((x) => x.id === current) ? 'is-active' : ''}`} aria-label="More navigation" aria-expanded={moreOpen}><MoreHorizontal size={20} /><span>More</span></button>
    </nav>
  </>;
}
