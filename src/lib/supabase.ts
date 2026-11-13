import { createClient } from '@supabase/supabase-js';
import { cleanSupabaseUrl } from './progression';

const rawUrl = cleanSupabaseUrl(import.meta.env.VITE_SUPABASE_URL as string | undefined);
const rawKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim();

const isConfigured = Boolean(
  rawUrl &&
  rawKey &&
  rawUrl !== '' &&
  rawKey !== '' &&
  !rawUrl.includes('YOUR_PROJECT') &&
  !rawUrl.includes('placeholder') &&
  rawUrl.startsWith('https://')
);

export function isSupabaseConfigured(): boolean {
  return isConfigured;
}

if (!isConfigured) {
  console.info(
    '[supabase] Running in local offline Hunter mode. Multi-device cloud sync will activate when VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are configured.'
  );
}

export const supabase = createClient(
  isConfigured ? rawUrl! : 'https://placeholder.supabase.co',
  isConfigured ? rawKey! : 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);
