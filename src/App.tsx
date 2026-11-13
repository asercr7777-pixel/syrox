import { lazy, Suspense, useEffect, useState } from 'react';
import { Navigation, type ViewId } from './components/Navigation';
import { Background } from './components/Background';
import { ToastContainer } from './components/ui/Toast';
import { Confetti } from './components/ui/Confetti';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { AuthProvider, useAuth } from './lib/auth';
import { useStore } from './store/useStore';
import { syncSoundFlag } from './lib/sound';
import { usePWA } from './hooks/usePWA';
import { InstallButton } from './components/pwa/InstallButton';
import { Loader2 } from 'lucide-react';
import { SystemStatusBar } from './components/SystemStatusBar';

const Dashboard = lazy(() => import('./views/Dashboard').then((m) => ({ default: m.Dashboard })));
const Missions = lazy(() => import('./views/Missions').then((m) => ({ default: m.Missions })));
const WorkoutWithAIPlan = lazy(() => import('./components/WorkoutWithAIPlan').then((m) => ({ default: m.WorkoutWithAIPlan })));
const Evolution = lazy(() => import('./views/Evolution').then((m) => ({ default: m.Evolution })));
const Challenges = lazy(() => import('./views/Challenges').then((m) => ({ default: m.Challenges })));
const Profile = lazy(() => import('./views/Profile').then((m) => ({ default: m.Profile })));
const Settings = lazy(() => import('./views/Settings').then((m) => ({ default: m.Settings })));
const Auth = lazy(() => import('./views/Auth').then((m) => ({ default: m.Auth })));
const ResetPassword = lazy(() => import('./views/ResetPassword').then((m) => ({ default: m.ResetPassword })));

const VALID_VIEWS = new Set<ViewId>([
  'dashboard',
  'quests',
  'workout',
  'evolution',
  'challenges',
  'profile',
  'settings',
]);

const VIEW_ALIASES: Record<string, ViewId> = {
  missions: 'quests',
  training: 'workout',
  analytics: 'evolution',
  progress: 'evolution',
};

function getViewFromUrl(): ViewId {
  if (typeof window === 'undefined') return 'dashboard';
  const requested = new URLSearchParams(window.location.search).get('view');
  if (!requested) return 'dashboard';
  if (requested in VIEW_ALIASES) return VIEW_ALIASES[requested];
  return VALID_VIEWS.has(requested as ViewId) ? (requested as ViewId) : 'dashboard';
}

function PageLoader() {
  return (
    <div className="flex min-h-[45vh] flex-col items-center justify-center gap-3 text-ink-400" role="status" aria-label="Loading page">
      <Loader2 className="animate-spin text-ember-400" size={28} />
      <span className="text-xs font-mono uppercase tracking-wider">Loading module…</span>
    </div>
  );
}

function AppContent() {
  const { user, loading } = useAuth();
  const { state, loadFromCloud, setUserId } = useStore();
  const [view, setView] = useState<ViewId>(getViewFromUrl);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { isInstalled, isInstallable, promptInstall } = usePWA();
  const isReset = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('reset') === '1';

  useEffect(() => {
    syncSoundFlag(state.soundEnabled);
  }, [state.soundEnabled]);

  const userId = user?.id ?? null;
  useEffect(() => {
    if (!userId) {
      setUserId(null);
      return;
    }
    void loadFromCloud(userId);
  }, [userId, setUserId, loadFromCloud]);

  useEffect(() => {
    const onPopState = () => setView(getViewFromUrl());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', state.theme);
    document.body.setAttribute('data-theme', state.theme);
    if (state.accessibility?.reducedMotion) root.setAttribute('data-reduced-motion', 'true');
    else root.removeAttribute('data-reduced-motion');
    if (state.accessibility?.highContrast) root.setAttribute('data-high-contrast', 'true');
    else root.removeAttribute('data-high-contrast');
    if (state.accessibility?.compactDensity) root.setAttribute('data-compact-density', 'true');
    else root.removeAttribute('data-compact-density');
    return () => {
      root.removeAttribute('data-theme');
      document.body.removeAttribute('data-theme');
      root.removeAttribute('data-reduced-motion');
      root.removeAttribute('data-high-contrast');
      root.removeAttribute('data-compact-density');
    };
  }, [state.theme, state.accessibility]);

  const handleNavigate = (target: ViewId) => {
    setView(target);
    const url = new URL(window.location.href);
    url.searchParams.set('view', target);
    window.history.pushState({}, '', url);
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  if (loading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-ink-950 text-ink-300" role="status" aria-label="Loading session">
        <Loader2 className="animate-spin text-ember-400" size={34} />
      </div>
    );
  }

  if (isReset) {
    return (
      <>
        <Background />
        <Suspense fallback={<PageLoader />}>
          <ResetPassword />
        </Suspense>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Background />
        <ToastContainer />
        <Suspense fallback={<PageLoader />}>
          <Auth />
        </Suspense>
      </>
    );
  }

  return (
    <div className="relative min-h-[100dvh] text-ink-100" data-theme={state.theme}>
      <Background />
      <Navigation
        current={view}
        onNavigate={handleNavigate}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
      />
      <ToastContainer />
      <Confetti />

      <div
        className={`relative z-10 min-h-[100dvh] flex flex-col transition-[padding] duration-200 ${
          sidebarCollapsed ? 'lg:pl-[76px]' : 'lg:pl-[248px]'
        }`}
      >
        <SystemStatusBar current={view} onNavigate={handleNavigate} />

        <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-24 lg:py-7">
          <Suspense fallback={<PageLoader />}>
            {view === 'dashboard' && (
              <section>
                <Dashboard onNavigate={handleNavigate} />
                {!isInstalled && (
                  <div className="mt-6 flex justify-center sm:justify-end">
                    <InstallButton isInstallable={isInstallable} isInstalled={isInstalled} onInstall={promptInstall}>
                      Install STRYVEN
                    </InstallButton>
                  </div>
                )}
              </section>
            )}
            {view === 'quests' && <Missions />}
            {view === 'workout' && <WorkoutWithAIPlan />}
            {view === 'evolution' && <Evolution />}
            {view === 'challenges' && <Challenges onNavigate={handleNavigate} />}
            {view === 'profile' && <Profile />}
            {view === 'settings' && <Settings />}
          </Suspense>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
