import { lazy, Suspense, useEffect, useState } from 'react';
import { Navigation, type ViewId } from './components/Navigation';
import { Background } from './components/Background';
import { ToastContainer } from './components/ui/Toast';
import { Confetti } from './components/ui/Confetti';
import { AuthProvider, useAuth } from './lib/auth';
import { useStore } from './store/useStore';
import { syncSoundFlag } from './lib/sound';
import { usePWA } from './hooks/usePWA';
import { InstallButton } from './components/pwa/InstallButton';
import { Loader2 } from 'lucide-react';
import './performance.css';

const Dashboard = lazy(() => import('./views/Dashboard').then((m) => ({ default: m.Dashboard })));
const Tasks = lazy(() => import('./views/Tasks').then((m) => ({ default: m.Tasks })));
const StoryMode = lazy(() => import('./views/StoryMode').then((m) => ({ default: m.default })));
const SkillTree = lazy(() => import('./views/SkillTree').then((m) => ({ default: m.SkillTree })));
const Workout = lazy(() => import('./views/Workout').then((m) => ({ default: m.Workout })));
const Dungeons = lazy(() => import('./views/Dungeons').then((m) => ({ default: m.Dungeons })));
const Profile = lazy(() => import('./views/Profile').then((m) => ({ default: m.Profile })));
const Marketplace = lazy(() => import('./views/Marketplace').then((m) => ({ default: m.Marketplace })));
const Inventory = lazy(() => import('./views/Inventory').then((m) => ({ default: m.Inventory })));
const Achievements = lazy(() => import('./views/Achievements').then((m) => ({ default: m.Achievements })));
const Leaderboard = lazy(() => import('./views/Leaderboard').then((m) => ({ default: m.Leaderboard })));
const Settings = lazy(() => import('./views/Settings').then((m) => ({ default: m.Settings })));
const ItemInspection = lazy(() => import('./views/ItemInspection').then((m) => ({ default: m.ItemInspection })));
const Auth = lazy(() => import('./views/Auth').then((m) => ({ default: m.Auth })));
const Shadow = lazy(() => import('./views/Shadow').then((m) => ({ default: m.Shadow })));

const VALID_VIEWS = new Set<ViewId>([
  'dashboard', 'tasks', 'story', 'workout', 'dungeons', 'profile',
  'marketplace', 'inventory', 'achievements', 'leaderboard', 'shadow',
  'skilltree', 'settings', 'iteminspection',
]);

function getViewFromUrl(): ViewId {
  if (typeof window === 'undefined') return 'dashboard';
  const requested = new URLSearchParams(window.location.search).get('view');
  return requested && VALID_VIEWS.has(requested as ViewId) ? requested as ViewId : 'dashboard';
}

function PageLoader() {
  return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin text-ember-400" size={32} /></div>;
}

function SkillTreeShortcut({ points, onOpen }: { points: number; onOpen: () => void }) {
  return (
    <button onClick={onOpen} className="mb-4 flex w-full items-center justify-between rounded-2xl border border-ember-500/20 bg-black/40 px-4 py-3 text-left backdrop-blur-xl transition hover:border-ember-500/40 hover:bg-ember-500/5">
      <div><div className="text-xs font-bold uppercase tracking-[0.22em] text-ember-400">🌳 Skill Tree</div><div className="mt-1 text-sm text-ink-300">You have <span className="font-black text-white">{points}</span> Skill Points to spend.</div></div>
      <span className="rounded-lg bg-ember-500/15 px-3 py-2 text-xs font-black text-ember-300">OPEN</span>
    </button>
  );
}

function AppContent() {
  const { user, loading } = useAuth();
  const { state, loadFromCloud, setUserId, cloudLoaded } = useStore();
  const [view, setView] = useState<ViewId>(getViewFromUrl);
  const { isInstalled, isInstallable, promptInstall } = usePWA();

  useEffect(() => { syncSoundFlag(state.soundEnabled); }, [state.soundEnabled]);

  useEffect(() => {
    if (user) void loadFromCloud(user.id);
    else setUserId(null);
  }, [user, setUserId, loadFromCloud]);

  useEffect(() => {
    const onPopState = () => setView(getViewFromUrl());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const handleNavigate = (v: ViewId) => {
    if (v === 'iteminspection') return;
    setView(v);
    const url = new URL(window.location.href);
    url.searchParams.set('view', v);
    window.history.replaceState({}, '', url);
  };

  const earnedSkillPoints = state.history.reduce((total, day) => total + Object.values(day.coreCompleted ?? {}).filter(Boolean).length + Object.values(day.customCompleted ?? {}).filter(Boolean).length, 0);

  if (loading || (user && !cloudLoaded)) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-ember-400" size={40} /></div>;
  }

  if (!user) {
    return <><Background /><Suspense fallback={<PageLoader />}><Auth /></Suspense></>;
  }

  return (
    <div className="min-h-screen">
      <Background />
      <Navigation current={view} onNavigate={handleNavigate} />
      <ToastContainer />
      <Confetti />
      <InstallButton isInstallable={isInstallable} isInstalled={isInstalled} onInstall={promptInstall} />
      <main className="lg:ml-64 pt-16 lg:pt-6 px-3 sm:px-4 pb-24 lg:pb-8 max-w-6xl mx-auto overflow-x-hidden">
        <Suspense fallback={<PageLoader />}>
          {view === 'dashboard' && <SkillTreeShortcut points={earnedSkillPoints} onOpen={() => handleNavigate('skilltree')} />}
          {view === 'dashboard' && <Dashboard onNavigate={handleNavigate} />}
          {view === 'tasks' && <Tasks />}
          {view === 'story' && <StoryMode />}
          {view === 'skilltree' && <SkillTree />}
          {view === 'workout' && <Workout />}
          {view === 'dungeons' && <Dungeons />}
          {view === 'profile' && <Profile />}
          {view === 'marketplace' && <Marketplace />}
          {view === 'inventory' && <Inventory />}
          {view === 'achievements' && <Achievements />}
          {view === 'leaderboard' && <Leaderboard />}
          {view === 'shadow' && <Shadow />}
          {view === 'settings' && <Settings />}
          {view === 'iteminspection' && <ItemInspection itemId="" category="weapon" onBack={() => handleNavigate('inventory')} />}
        </Suspense>
      </main>
    </div>
  );
}

function App() {
  return <AuthProvider><AppContent /></AuthProvider>;
}

export default App;
