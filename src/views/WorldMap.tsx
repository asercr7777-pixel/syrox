import { useEffect } from 'react';

export function WorldMap() {
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set('view', 'story');
    url.searchParams.delete('chapter');
    window.history.replaceState({}, '', url);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, []);
  return <div className="min-h-[60vh] flex items-center justify-center text-sm text-ink-400">Opening Arc I World Map…</div>;
}
export default WorldMap;
