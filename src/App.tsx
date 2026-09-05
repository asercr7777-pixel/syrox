import { lazy, Suspense, useEffect, useState } from 'react';
import { Navigation, type ViewId } from './components/Navigation';
import { Background } from './components/Background';
import { ToastContainer } from './components/ui/Toast';
import { Confetti } from './components/ui/Confetti';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { AuthProvider, useAuth } from './lib/auth';
import { useStore } from './store/useStore';
import { syncSoundFlag } from './lib/sound';
import { ensureStoryReset } from './lib/story/storyReset';
import { usePWA } from './hooks/usePWA';
import { InstallButton } from './components/pwa/InstallButton';
import { StoryProgressBridge } from './components/StoryProgressBridge';
import { Loader2 } from 'lucide-react';
import './theme.css';
import './theme-overrides.css';
import './theme-identities.css';
import './theme-motion.css';
import './stryven-ui-system.css';
import './stryven-redesign.css';
import './stryven-shell.css';
import './stryven-pages.css';
import './stryven-settings.css';
import './stryven-dungeons.css';
import './story-map-responsive.css';
import './stryven-character.css';

const Dashboard = lazy(() => import('./views/Dashboard').then((m) => ({ default: m.Dashboard })));
const Tasks = lazy(() => import('./views/Tasks').then((m) => ({ default: m.Tasks })));
const StoryMode = lazy(() => import('./views/StoryModeSimpleV2'));
const WorkoutWithAIPlan = lazy(() => import('./components/WorkoutWithAIPlan').then((m) => ({ default: m.WorkoutWithAIPlan })));
const Dungeons = lazy(() => import('./views/Dungeons').then((m) => ({ default: m.Dungeons })));
const Profile = lazy(() => import('./views/Profile').then((m) => ({ default: m.Profile })));
const Leaderboard = lazy(() => import('./views/Leaderboard').then((m) => ({ default: m.Leaderboard })));
const Settings = lazy(() => import('./views/Settings').then((m) => ({ default: m.Settings })));
const Auth = lazy(() => import('./views/Auth').then((m) => ({ default: m.Auth })));
const ResetPassword = lazy(() => import('./views/ResetPassword').then((m) => ({ default: m.ResetPassword })));

const VALID_VIEWS = new Set<ViewId>(['dashboard', 'tasks', 'story', 'workout', 'dungeons', 'profile', 'leaderboard', 'settings']);
function getViewFromUrl(): ViewId {
  if (typeof window === 'undefined') return 'dashboard';
  const requested = new URLSearchParams(window.location.search).get('view');
  if (requested === 'worldmap') return 'story';
  return requested && VALID_VIEWS.has(requested as ViewId) ? (requested as ViewId) : 'dashboard';
}
function PageLoader() { return <div className="stryven-page-loader"><Loader2 className="animate-spin" size={30} /></div>; }

function AppContent() {
  const { user, loading } = useAuth();
  const { state, loadFromCloud, setUserId } = useStore();
  const [view, setView] = useState<ViewId>(getViewFromUrl);
  const { isInstalled, isInstallable, promptInstall } = usePWA();
  const isReset = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('reset') === '1';

  useEffect(() => { syncSoundFlag(state.soundEnabled); }, [state.soundEnabled]);
  useEffect(() => {
    if (!user) { setUserId(null); return; }
    void Promise.allSettled([ensureStoryReset(user.id), loadFromCloud(user.id)]);
  }, [user, setUserId, loadFromCloud]);

  useEffect(() => {
    let raf = 0;
    let timeout = 0;
    let scrolling = false;
    const onScroll = () => {
      if (!scrolling) {
        scrolling = true;
        raf = window.requestAnimationFrame(() => {
          document.documentElement.classList.add('is-scrolling');
          scrolling = false;
        });
      }
      window.clearTimeout(timeout);
      timeout = window.setTimeout(() => document.documentElement.classList.remove('is-scrolling'), 120);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.cancelAnimationFrame(raf);
      window.clearTimeout(timeout);
      document.documentElement.classList.remove('is-scrolling');
    };
  }, []);

  useEffect(() => {
    const onPopState = () => setView(getViewFromUrl());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.theme);
    document.body.setAttribute('data-theme', state.theme);
    return () => {
      document.documentElement.removeAttribute('data-theme');
      document.body.removeAttribute('data-theme');
    };
  }, [state.theme]);

  const handleNavigate = (v: ViewId) => {
    const target = v === 'worldmap' ? 'story' : v;
    setView(target);
    const url = new URL(window.location.href);
    url.searchParams.set('view', target);
    if (target === 'story') url.searchParams.delete('chapter');
    window.history.replaceState({}, '', url);
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  if (loading) return <div className="stryven-auth-loader"><Loader2 className="animate-spin" size={38} /></div>;
  if (isReset) return <><Background /><Suspense fallback={<PageLoader />}><ResetPassword /></Suspense></>;
  if (!user) return <><Background /><Suspense fallback={<PageLoader />}><Auth /></Suspense></>;

  return <div className="stryven-app-shell" data-theme={state.theme}>
    <Background /><Navigation current={view} onNavigate={handleNavigate} /><ToastContainer /><Confetti /><StoryProgressBridge />
    <main className={`stryven-main stryven-view-${view}`}><div className="stryven-page-frame"><Suspense fallback={<PageLoader />}>
      {view === 'dashboard' && <section className="stryven-page"><Dashboard onNavigate={handleNavigate} />{!isInstalled && <div className="stryven-install"><InstallButton isInstallable={isInstallable} isInstalled={isInstalled} onInstall={promptInstall}>Install STRYVEN</InstallButton></div>}</section>}
      {view === 'tasks' && <section className="stryven-page"><Tasks /></section>}
      {view === 'story' && <section className="stryven-page stryven-story-page"><StoryMode /></section>}
      {view === 'workout' && <section className="stryven-page"><WorkoutWithAIPlan /></section>}
      {view === 'dungeons' && <section className="stryven-page"><Dungeons /></section>}
      {view === 'profile' && <section className="stryven-page"><Profile /></section>}
      {view === 'leaderboard' && <section className="stryven-page"><Leaderboard /></section>}
      {view === 'settings' && <section className="stryven-page stryven-settings"><Settings /></section>}
    </Suspense></div></main>
  </div>;
}
function App() { return <ErrorBoundary><AuthProvider><AppContent /></AuthProvider></ErrorBoundary>; }
export default App;
