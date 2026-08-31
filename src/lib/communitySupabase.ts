// ONROL Community — self-hosted Supabase client.
//
// Points at the Docker stack on the VPS, reverse-proxied through OpenLiteSpeed
// at https://onrol.in/api. Used ONLY by the new community section
// (community pages, admin posts, member onboarding, broadcast feed).
//
// The cloud Supabase client (src/lib/supabase.ts) stays the default for
// every legacy/shared module — Task Manager, push notifications, contact
// forms, etc. Don't cross the streams: importing the wrong client points
// you at the wrong DB and breaks auth.

import { createClient, type SupabaseClientOptions } from "@supabase/supabase-js";

// No-op replacement for the navigator.locks-based cross-tab coordinator
// supabase-js uses by default. The default lock causes
// "AbortError: Lock broken by another request with the 'steal' option"
// when an unrelated tab refreshes its token while we're mid-RPC. The
// site is single-tab in practice; we don't need cross-tab coordination.
const noOpLock = async <R>(_name: string, _acquireTimeout: number, fn: () => Promise<R>): Promise<R> => fn();

const COMMUNITY_SUPABASE_URL = "https://onrol.in/api";
const COMMUNITY_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzc4MTgxMDg0LCJleHAiOjE5MzU4NjEwODR9.CdMMF52s_pJPVrUu1XRq3wnRyMCEt9UatB7mEMR3iew";

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

const options: SupabaseClientOptions<"public"> = {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: sessionStorage,
    // Distinct storage key so community session doesn't collide with the
    // cloud (Task Manager) session in the same browser.
    storageKey: "onrol.community.auth.session",
    flowType: "pkce",
    // Override the navigator.locks-based coordinator (see noOpLock above).
    lock: noOpLock,
  },
  global: {
    headers: {
      "x-onrol-client": "community",
    },
  },
};

export const communitySupabase = createClient(
  COMMUNITY_SUPABASE_URL,
  COMMUNITY_SUPABASE_ANON_KEY,
  options,
);
