import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Only the public URL and anon key are ever read on the client. Service-role keys
 * and AI provider keys live server-side in Supabase Edge Function secrets and are
 * never bundled here.
 */
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anonKey as string, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null;

export const AI_FUNCTION_URL = isSupabaseConfigured ? `${url}/functions/v1/ai-advisor` : null;
export const SUPABASE_ANON_KEY_FOR_FUNCTION = anonKey ?? null;
