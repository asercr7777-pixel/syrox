import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!url || !anonKey) {
  console.error(
    '[supabase] Missing env vars. VITE_SUPABASE_URL:',
    url,
    'VITE_SUPABASE_ANON_KEY:',
    anonKey ? '(present)' : '(missing)'
  );
}

export const supabase = createClient(
  url ?? 'https://placeholder.supabase.co',
  anonKey ?? 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);

export function isSupabaseConfigured(): boolean {
  return Boolean(url && anonKey && !url.includes('placeholder'));
}
