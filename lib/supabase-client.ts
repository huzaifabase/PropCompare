/**
 * Browser-side Supabase client (anon key, RLS applies).
 *
 * CLIENT-SAFE: this module must never import `next/headers` or any other
 * server-only module. It is imported by "use client" components.
 * Server code should import from "@/lib/supabase" instead.
 */
import { createBrowserClient as _createBrowserClient } from "@supabase/ssr";

function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable ${name}. See .env.example.`);
  return v;
}

/** True when Supabase env vars are present (used for graceful setup messaging). */
export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

/** Browser-side client (anon key, RLS applies). */
export function createBrowserClient() {
  return _createBrowserClient(env("NEXT_PUBLIC_SUPABASE_URL"), env("NEXT_PUBLIC_SUPABASE_ANON_KEY"));
}
