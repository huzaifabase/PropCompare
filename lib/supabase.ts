/**
 * SERVER-ONLY Supabase clients. This module imports `next/headers` — it must
 * never be imported by a "use client" component. Client components must import
 * the browser client from "@/lib/supabase-client" instead.
 */
import { createServerClient as _createServerClient } from "@supabase/ssr";
import { createClient as _createServiceClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export { createBrowserClient, isSupabaseConfigured } from "./supabase-client";

function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable ${name}. See .env.example.`);
  return v;
}

/** Server Component / Route Handler / Server Action client (anon key + user session, RLS applies). */
export function createServerSupabaseClient() {
  const cookieStore = cookies();
  return _createServerClient(env("NEXT_PUBLIC_SUPABASE_URL"), env("NEXT_PUBLIC_SUPABASE_ANON_KEY"), {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: Record<string, unknown>) {
        cookieStore.set({ name, value, ...(options as object) });
      },
      remove(name: string, options: Record<string, unknown>) {
        cookieStore.set({ name, value: "", ...(options as object) });
      },
    },
  });
}

/**
 * Service-role client. SERVER ONLY — bypasses RLS. Never import into client components.
 * Used for: affiliate click logging fallback, admin bootstrap script.
 */
export function createServiceClient() {
  return _createServiceClient(env("NEXT_PUBLIC_SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
