import { createClient, SupabaseClientOptions } from '@supabase/supabase-js'

// Cloud Supabase — used by Task Manager, push notifications, contact forms,
// and every legacy/shared system that's NOT the new ONROL Community.
//
// The new community section (community pages, admin posts, member onboarding)
// uses a SEPARATE client at src/lib/communitySupabase.ts pointing at the
// self-hosted Docker stack on the VPS. Don't switch one for the other.
const supabaseUrl = 'https://qcantdsmcrjfewcfpyej.supabase.co'
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjYW50ZHNtY3JqZmV3Y2ZweWVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NTM4NTksImV4cCI6MjA4OTIyOTg1OX0.tL3xa4QDftLCLa129mmM9U6drdS4EnV82oQn1aPt2fw'

// Platform-aware storage. On web and Capacitor WebView the default (window.localStorage)
// persists across restarts. On platforms where localStorage is unavailable (SSR / edge),
// we fall back to an in-memory store so createClient never throws at import time.
const inMemoryStore = (() => {
  const map = new Map<string, string>();
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => { map.set(key, value); },
    removeItem: (key: string) => { map.delete(key); },
  };
})();

const sessionStorage =
  typeof window !== "undefined" && window.localStorage ? window.localStorage : inMemoryStore;

const supabaseOptions: SupabaseClientOptions<"public"> = {
  auth: {
    persistSession: true,          // remember me across reloads / cold-start
    autoRefreshToken: true,        // silent token rotation before expiry
    detectSessionInUrl: true,      // handle magic-link / OAuth callback redirects
    storage: sessionStorage,
    storageKey: "onrol.auth.session",
    flowType: "pkce",              // safer for web/mobile; no implicit flow tokens in URL hash
  },
  global: {
    // Identify client on telemetry — helps debug which platform is calling.
    headers: {
      "x-onrol-client":
        typeof navigator !== "undefined" && /capacitor|android|iphone|ipad/i.test(navigator.userAgent)
          ? "mobile"
          : "web",
    },
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, supabaseOptions)

export type Student = {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  college_name: string | null
  course_branch: string | null
  graduation_year: number | null
  interested_in: string[] | null
  created_at: string
  updated_at: string
}

/*
──────────────────────────────────────────────
  SUPABASE SQL — run once in your SQL Editor
──────────────────────────────────────────────

create table public.students (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name   text,
  email       text,
  phone       text,
  college_name text,
  course_branch text,
  graduation_year integer,
  interested_in text[],
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

alter table public.students enable row level security;

create policy "Users can view own profile"   on public.students for select using (auth.uid() = id);
create policy "Users can insert own profile" on public.students for insert with check (auth.uid() = id);
create policy "Users can update own profile" on public.students for update using (auth.uid() = id);
*/
