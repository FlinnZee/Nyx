import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** True when the app has real Supabase credentials wired in. */
export const isSupabaseConfigured = Boolean(url && anonKey);

/**
 * The shared Supabase client. When credentials are missing the app falls back
 * to local demo mode, so this stays null and callers should guard on
 * `isSupabaseConfigured`.
 */
export const supabase =
  isSupabaseConfigured
    ? createClient(url!, anonKey!, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false,
        },
      })
    : null;
