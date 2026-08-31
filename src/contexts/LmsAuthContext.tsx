import { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  clearLmsSession,
  fetchLmsMe,
  getLmsToken,
  getLmsUser,
  LmsUser,
} from "@/lib/lmsAuth";

/**
 * Auth context for the /learn/* learner experience. Wraps the LMS pages
 * and validates the stored JWT against /api/lms/auth/me on mount. The
 * non-LMS app (task manager, community, messenger) keeps using
 * AuthContext (Supabase) — these are separate identity systems and
 * deliberately don't share state.
 */

interface LmsAuthContextType {
  user: LmsUser | null;
  loading: boolean;
  signOut: () => void;
  /** Force a re-fetch from /api/lms/auth/me (e.g. after profile update). */
  refresh: () => Promise<void>;
}

const LmsAuthContext = createContext<LmsAuthContextType>({
  user: null,
  loading: true,
  signOut: () => {},
  refresh: async () => {},
});

export function LmsAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<LmsUser | null>(() => getLmsUser());
  const [loading, setLoading] = useState(true);

  const validate = useCallback(async () => {
    const token = getLmsToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    const fresh = await fetchLmsMe(token);
    if (fresh) {
      setUser(fresh);
    } else {
      // Token rejected (expired / revoked) — drop it.
      clearLmsSession();
      setUser(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void validate();
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent<LmsUser | null>).detail;
      setUser(detail ?? null);
    };
    window.addEventListener("lms-auth-change", onChange);
    return () => window.removeEventListener("lms-auth-change", onChange);
  }, [validate]);

  const signOut = useCallback(() => {
    clearLmsSession();
    setUser(null);
  }, []);

  return (
    <LmsAuthContext.Provider value={{ user, loading, signOut, refresh: validate }}>
      {children}
    </LmsAuthContext.Provider>
  );
}

export function useLmsAuth() {
  return useContext(LmsAuthContext);
}
