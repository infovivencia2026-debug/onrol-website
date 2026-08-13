import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
// communitySupabase is imported dynamically inside the bootstrap effect
// so vendor-supabase (~174KB raw / 42KB gz) does NOT get statically
// pulled into the App entry — Lighthouse was flagging 33KB unused on
// first paint of marketing routes that never need auth.
import type { Session, User } from '@supabase/supabase-js';
type SbClient = typeof import('@/lib/communitySupabase')['communitySupabase'];

export type MemberStatus = 'pending' | 'approved' | 'rejected' | 'suspended';
export type MemberType = 'learner' | 'mentor' | 'admin';

export interface CommunityMember {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  tagline: string | null;
  skills: string[];
  experience_level: string;
  current_role: string | null;
  company: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  twitter_url: string | null;
  portfolio_url: string | null;
  member_status: MemberStatus;
  member_type: MemberType;
  specialization_track: string | null;
  graduation_year: number | null;
  cohort_batch: string | null;
  points: number;
  level: number;
  streak_days: number;
  joined_at: string;
  approved_at: string | null;
  last_active_at: string;
  email_notifications?: boolean;
  push_notifications?: boolean;
  profile_visibility?: string;
}

export interface AdminUser {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  permissions: {
    manage_members: boolean;
    manage_content: boolean;
    manage_events: boolean;
    manage_jobs: boolean;
    view_analytics: boolean;
  };
}

interface CommunityAuthContextType {
  session: Session | null;
  user: User | null;
  member: CommunityMember | null;
  admin: AdminUser | null;
  loading: boolean;
  isApproved: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  updateMember: (data: Partial<CommunityMember>) => Promise<void>;
  refreshMember: () => Promise<void>;
  // Sync write into the cache from a known-good source (e.g. an upsert response).
  // Used by onboarding to avoid race with downstream "profile-incomplete" gates.
  setMemberCache: (m: CommunityMember) => void;
}

type SelectResult<T> = {
  data: T | null;
  error: { message: string; code?: string } | null;
};

const timeoutResult = <T,>(): SelectResult<T> => ({
  data: null,
  error: { message: "timeout" },
});

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return fallback;
};

const CommunityAuthContext = createContext<CommunityAuthContextType>({
  session: null,
  user: null,
  member: null,
  admin: null,
  loading: true,
  isApproved: false,
  isAdmin: false,
  signIn: async () => ({ error: null }),
  signOut: async () => {},
  updateMember: async () => {},
  refreshMember: async () => {},
  setMemberCache: () => {},
});

const withTimeout = async <T,>(promise: Promise<T>, ms: number, fallback: T): Promise<T> => {
  let timeoutId: number | undefined;
  const timeoutPromise = new Promise<T>((resolve) => {
    timeoutId = window.setTimeout(() => resolve(fallback), ms);
  });
  const result = await Promise.race([promise, timeoutPromise]);
  if (timeoutId) window.clearTimeout(timeoutId);
  return result;
};

export const CommunityAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [member, setMember] = useState<CommunityMember | null>(null);
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  // Lazy-loaded supabase client. Cached in a ref so all helpers (signIn,
  // fetchMember, etc) share a single instance once the dynamic import
  // resolves. The bootstrap effect below kicks the import.
  const sbRef = useRef<SbClient | null>(null);
  const sbReadyRef = useRef<Promise<SbClient> | null>(null);
  const getSb = useCallback(async (): Promise<SbClient> => {
    if (sbRef.current) return sbRef.current;
    if (!sbReadyRef.current) {
      sbReadyRef.current = import('@/lib/communitySupabase').then((m) => {
        sbRef.current = m.communitySupabase;
        return m.communitySupabase;
      });
    }
    return sbReadyRef.current;
  }, []);

  /**
   * Auto-create a community_members row on first login if one doesn't exist.
   * This closes the gap where Google OAuth users were getting authenticated
   * but never written to the members table — making them invisible to the
   * rest of the app (live count, leaderboard, dashboard).
   *
   * Default new-member shape: status='approved' (consumption is public anyway),
   * minimal fields seeded from auth metadata. Onboarding page collects the rest.
   */
  const ensureMemberRow = useCallback(
    async (user: User): Promise<CommunityMember | null> => {
      const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
      const fullName =
        (typeof meta.full_name === 'string' && meta.full_name) ||
        (typeof meta.name === 'string' && meta.name) ||
        null;
      const avatarUrl =
        (typeof meta.avatar_url === 'string' && meta.avatar_url) ||
        (typeof meta.picture === 'string' && meta.picture) ||
        null;

      const newRow = {
        id: user.id,
        email: user.email ?? '',
        full_name: fullName,
        avatar_url: avatarUrl,
        member_status: 'approved' as MemberStatus,
        member_type: 'learner' as MemberType,
      };

      // Use UPSERT (not INSERT) so this is a no-op if the row already exists.
      // INSERT would fail on duplicate key, return null, and downstream code
      // would clear `member` to null — which then triggers the dashboard's
      // profile-incomplete gate, sending the user back to onboarding.
      // ignoreDuplicates: true means existing rows aren't modified — we only
      // want to seed missing rows; the onboarding form is what fills fields.
      const sb = await getSb();
      const { data, error } = await sb
        .from('community_members')
        .upsert(newRow, { onConflict: 'id', ignoreDuplicates: true })
        .select('*')
        .single();

      if (error) {
        // If the row already exists (which is the most common case), upsert
        // returns no rows when ignoreDuplicates: true. Fall back to a plain
        // SELECT so we still hand back the existing member.
        const { data: existing } = await sb
          .from('community_members')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();
        if (existing) return existing as CommunityMember;
        console.warn('[community-auth] auto-create member failed:', error.message);
        return null;
      }
      return data as CommunityMember;
    },
    [getSb],
  );

  const fetchMember = useCallback(
    async (userId: string, user?: User) => {
      try {
        const sb = await getSb();
        const result = await withTimeout<SelectResult<CommunityMember>>(
          sb
            .from('community_members')
            .select('*')
            .eq('id', userId)
            .single() as unknown as Promise<SelectResult<CommunityMember>>,
          8000, // increased from 3.5s — slow self-hosted backends were timing out
          timeoutResult<CommunityMember>(),
        );
        const { data, error } = result;

        if (data) {
          setMember(data as CommunityMember);
          return;
        }

        const isTimeout = error?.message === 'timeout';
        // PostgREST returns 406 with code PGRST116 when .single() finds no rows.
        // The error MESSAGE varies between versions ("JSON object requested,
        // multiple (or no) rows returned" / "Results contain 0 rows" / etc),
        // so we match on the CODE primarily and fall back to known phrases.
        const noRow =
          error?.code === 'PGRST116' ||
          !!error?.message?.includes('Results contain 0 rows') ||
          !!error?.message?.includes('multiple (or no) rows returned') ||
          !!error?.message?.includes('PGRST116');

        // CASE 1: confirmed no row exists for this user (PGRST116). Seed one.
        if (noRow && user) {
          const created = await ensureMemberRow(user);
          if (created) setMember(created);
          // If ensureMemberRow also failed, leave existing member state alone
          // rather than clearing it — clearing causes the onboarding loop.
          return;
        }

        // CASE 2: timeout. Don't clobber any existing member state — keep
        // whatever we last had so downstream gates (dashboard) don't bounce.
        if (isTimeout) {
          // Quiet in production — the timeout path is a benign degraded
          // mode (we keep prior member state). Logging it on every page
          // load when the self-hosted backend is briefly slow was polluting
          // real users' DevTools consoles.
          if (import.meta.env.DEV) {
            console.warn('[community-auth] fetchMember timed out — keeping prior state');
          }
          return;
        }

        // CASE 3: real error (non-timeout, non-missing-row). Only clear if we
        // genuinely don't have a row.
        if (error && !noRow) {
          console.warn('[community-auth] fetchMember error:', error.message);
        }
      } catch (e) {
        console.warn('[community-auth] fetchMember threw:', e);
      }
    },
    [ensureMemberRow, getSb],
  );

  const fetchAdmin = useCallback(async (userId: string) => {
    try {
      const sb = await getSb();
      // 12s timeout (was 3.5s, which was too aggressive for cold PostgREST
      // calls and was silently locking real admins out of /community/admin/*).
      const result = await withTimeout<SelectResult<AdminUser>>(
        sb
          .from('admins')
          .select('*')
          .eq('id', userId)
          .maybeSingle() as unknown as Promise<SelectResult<AdminUser>>,
        12000,
        timeoutResult<AdminUser>()
      );
      const { data, error } = result;

      if (error) {
        // Transient failure (timeout, network blip, schema reload after
        // TOKEN_REFRESHED). DO NOT clear admin — keep the last known-good
        // state. Otherwise a refetch every 10s on an auth event would
        // briefly drop the user out of admin gates and flicker them to
        // the "Admin access only" screen. Quiet in production: the path
        // is benign and was filling real users' DevTools consoles when
        // the self-hosted backend was briefly slow.
        if (import.meta.env.DEV) {
          console.warn("[community-auth] fetchAdmin error (keeping prior state):", error.message ?? error);
        }
        return;
      }
      // maybeSingle returns null (not an error) when no row exists — that
      // IS the "not an admin" signal, so propagate it.
      setAdmin(data as AdminUser | null);
    } catch (err) {
      console.warn("[community-auth] fetchAdmin threw (keeping prior state):", err);
    }
  }, [getSb]);

  useEffect(() => {
    let mounted = true;
    const loadingGuard = window.setTimeout(() => {
      if (mounted) setLoading(false);
    }, 7000);

    // True if the URL has an OAuth code/error param OR an auth-fragment
    // (#access_token=...). When present, the Supabase JS client is about
    // to exchange it for a session — we must NOT mark loading=false until
    // that exchange completes (or times out), otherwise downstream gates
    // see `user=null` for a moment and bounce back to /login.
    const hasOAuthCallback = (() => {
      if (typeof window === "undefined") return false;
      const sp = new URLSearchParams(window.location.search);
      const hash = window.location.hash || "";
      return (
        sp.has("code") ||
        sp.has("error") ||
        hash.includes("access_token=") ||
        hash.includes("error=")
      );
    })();

    const hydrateSession = async () => {
      try {
        const sb = await getSb();
        const { data, error } = await sb.auth.getSession();
        if (!mounted) return;

        if (error) {
          if (!hasOAuthCallback) setLoading(false);
          return;
        }

        setSession(data.session ?? null);

        if (data.session?.user) {
          await Promise.allSettled([
            fetchMember(data.session.user.id, data.session.user),
            fetchAdmin(data.session.user.id),
          ]);
          if (mounted) setLoading(false);
        } else if (!hasOAuthCallback) {
          // No code in URL, no session — definitively unauthenticated.
          setMember(null);
          setAdmin(null);
          setLoading(false);
        }
        // else: code is in URL but no session yet — wait for the
        // onAuthStateChange handler below to fire (the JS client is
        // exchanging the code now). Loading stays true; loadingGuard
        // (7s) will release it if exchange never completes.
      } catch {
        if (!mounted) return;
        if (!hasOAuthCallback) setLoading(false);
      }
    };

    // Defer the supabase client load + session hydrate behind a
    // first-interaction gate on marketing routes (so vendor-supabase
    // doesn't enter Lighthouse's critical request chain). On auth
    // routes — community dashboard, admin, OAuth callbacks — hydrate
    // immediately so the dashboard doesn't show "loading" forever.
    const isAuthRoute =
      typeof window !== "undefined" &&
      (hasOAuthCallback ||
        /^\/(task|messenger|admin|community\/(dashboard|admin|members|projects|jobs|events|leaderboard|discussions|settings|posts))/
          .test(window.location.pathname));

    let started = false;
    const startHydrate = () => {
      if (started || !mounted) return;
      started = true;
      hydrateSession();
    };
    let interactionHandle: number | null = null;
    if (isAuthRoute) {
      startHydrate();
    } else {
      const opts: AddEventListenerOptions = { once: true, passive: true };
      window.addEventListener("scroll", startHydrate, opts);
      window.addEventListener("pointerdown", startHydrate, opts);
      window.addEventListener("keydown", startHydrate, opts);
      // After 8s of no interaction, hydrate anyway so client-side nav
      // into an authenticated route doesn't sit on an empty session.
      interactionHandle = window.setTimeout(startHydrate, 8000);
    }

    // Track which user we last refreshed for, so TOKEN_REFRESHED /
    // INITIAL_SESSION / USER_UPDATED events don't re-run fetchMember +
    // fetchAdmin every time the JWT cycles. If those re-runs hit a transient
    // PostgREST hiccup, the user briefly drops to "Admin access only".
    let lastFetchedUserId: string | null = null;

    let subscription: { unsubscribe: () => void } | null = null;
    const authSubBoot = async () => {
      const sb = await getSb();
      if (!mounted) return;
      const { data } = sb.auth.onAuthStateChange(async (event, nextSession) => {
        if (!mounted) return;

        setSession((prev) => {
          if (prev?.access_token === nextSession?.access_token) return prev;
          return nextSession;
        });

        if (nextSession?.user) {
          const sameUser = lastFetchedUserId === nextSession.user.id;
          // Only re-fetch when we haven't yet fetched for this user, OR on
          // explicit sign-in / user-record updates. Token rotation alone
          // does not require a new member/admin lookup.
          const shouldFetch =
            !sameUser ||
            event === "SIGNED_IN" ||
            event === "USER_UPDATED";
          if (shouldFetch) {
            lastFetchedUserId = nextSession.user.id;
            await Promise.allSettled([
              fetchMember(nextSession.user.id, nextSession.user),
              fetchAdmin(nextSession.user.id),
            ]);
          }
        } else {
          lastFetchedUserId = null;
          setMember(null);
          setAdmin(null);
        }

        setLoading(false);
      });
      subscription = data.subscription;
    };
    // Subscription bootstrap also waits for startHydrate to run — getSb
    // is idempotent so this is safe and avoids racing the chunk load.
    if (isAuthRoute) {
      authSubBoot();
    } else {
      const opts: AddEventListenerOptions = { once: true, passive: true };
      window.addEventListener("scroll", authSubBoot, opts);
      window.addEventListener("pointerdown", authSubBoot, opts);
      window.addEventListener("keydown", authSubBoot, opts);
    }

    return () => {
      mounted = false;
      window.clearTimeout(loadingGuard);
      if (interactionHandle != null) window.clearTimeout(interactionHandle);
      window.removeEventListener("scroll", startHydrate);
      window.removeEventListener("pointerdown", startHydrate);
      window.removeEventListener("keydown", startHydrate);
      window.removeEventListener("scroll", authSubBoot);
      window.removeEventListener("pointerdown", authSubBoot);
      window.removeEventListener("keydown", authSubBoot);
      subscription?.unsubscribe();
    };
  }, [fetchMember, fetchAdmin, getSb]);

  const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
    try {
      const sb = await getSb();
      const { data, error } = await sb.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        await fetchMember(data.user.id, data.user);
        await fetchAdmin(data.user.id);
      }

      return { error: null };
    } catch (error: unknown) {
      return { error: getErrorMessage(error, 'Failed to sign in') };
    }
  };

  const signOut = async () => {
    // `scope: 'local'` skips the server roundtrip and always clears the
    // browser's auth storage. Without this, a flaky GoTrue / Kong / network
    // hiccup leaves localStorage populated and the user appears signed in
    // again on next page load.
    try {
      const sb = await getSb();
      await sb.auth.signOut({ scope: "local" });
    } catch (err) {
      console.warn("[community-auth] signOut roundtrip failed; clearing local state anyway:", err);
    } finally {
      // Belt-and-suspenders: nuke the storage key the supabase client uses
      // (`storageKey` from communitySupabase.ts) in case the client failed
      // to clear it itself.
      try {
        window.localStorage.removeItem("onrol.community.auth.session");
      } catch { /* sandboxed env, ignore */ }
      setSession(null);
      setMember(null);
      setAdmin(null);
    }
  };

  const updateMember = async (data: Partial<CommunityMember>) => {
    if (!member) return;

    const { error } = await supabase
      .from('community_members')
      .update(data)
      .eq('id', member.id);

    if (error) throw error;

    await fetchMember(member.id);
  };

  const refreshMember = async () => {
    if (session?.user) {
      await fetchMember(session.user.id, session.user);
      await fetchAdmin(session.user.id);
    }
  };

  const setMemberCache = useCallback((m: CommunityMember) => {
    setMember(m);
  }, []);

  const isApproved = member?.member_status === 'approved';
  const isAdmin = !!admin;

  return (
    <CommunityAuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        member,
        admin,
        loading,
        isApproved,
        isAdmin,
        signIn,
        signOut,
        updateMember,
        refreshMember,
        setMemberCache,
      }}
    >
      {children}
    </CommunityAuthContext.Provider>
  );
};

export const useCommunityAuth = () => {
  const context = useContext(CommunityAuthContext);
  if (!context) {
    throw new Error('useCommunityAuth must be used within CommunityAuthProvider');
  }
  return context;
};
