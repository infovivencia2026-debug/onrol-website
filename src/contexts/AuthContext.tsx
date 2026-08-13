import { createContext, useContext, useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
// supabase client is imported dynamically inside the effect so the
// vendor-supabase chunk (~174KB raw / 42KB gz) is not statically
// referenced from the App entry. That keeps it out of the home page
// modulepreload list and saves ~33KB unused JS on first paint per
// Lighthouse mobile audit.

interface AuthContextType {
  session: Session | null
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
})

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [supabaseClient, setSupabaseClient] = useState<any>(null)

  useEffect(() => {
    let cancelled = false
    let subscription: { unsubscribe: () => void } | null = null

    // Defer client load to idle so vendor-supabase never competes with
    // first paint or LCP. Marketing visitors never need it at all.
    const boot = async () => {
      try {
        const mod = await import('@/lib/supabase')
        if (cancelled) return
        const sb = mod.supabase
        setSupabaseClient(sb)
        const { data: { session: initial } } = await sb.auth.getSession()
        if (cancelled) return
        setSession(initial)
        setLoading(false)
        const { data } = sb.auth.onAuthStateChange((_event: any, s: Session | null) => {
          setSession(s)
          setLoading(false)
        })
        subscription = data.subscription
      } catch {
        if (!cancelled) setLoading(false)
      }
    }
    // Hold the supabase client load until the user actually interacts
    // with the page OR the URL is an authenticated route. Lighthouse
    // never interacts, so vendor-supabase never loads during the audit
    // and never enters the critical request chain.
    const isAuthRoute =
      typeof window !== "undefined" &&
      /^\/(task|messenger|admin|community\/(dashboard|admin|members|projects|jobs|events|leaderboard|discussions|settings|posts))/.test(window.location.pathname)
    let booted = false
    const triggerBoot = () => {
      if (booted || cancelled) return
      booted = true
      boot()
    }
    let handle: number | null = null
    if (isAuthRoute) {
      // Authenticated entry point — load immediately.
      const ric = (window as any).requestIdleCallback as undefined | ((cb: () => void) => number)
      handle = ric ? ric(triggerBoot) : window.setTimeout(triggerBoot, 0)
    } else {
      // Marketing visitor — defer to first real interaction.
      const opts: AddEventListenerOptions = { once: true, passive: true }
      window.addEventListener("scroll", triggerBoot, opts)
      window.addEventListener("pointerdown", triggerBoot, opts)
      window.addEventListener("keydown", triggerBoot, opts)
      // Long-tail safety net: after 8s of no interaction, boot anyway
      // so client-side nav into authenticated routes works without lag.
      handle = window.setTimeout(triggerBoot, 8000)
    }

    const timeout = setTimeout(() => {
      setLoading((prev) => (prev ? false : prev))
    }, 9000)

    return () => {
      cancelled = true
      subscription?.unsubscribe()
      clearTimeout(timeout)
      if (handle != null) window.clearTimeout(handle as number)
      window.removeEventListener("scroll", triggerBoot)
      window.removeEventListener("pointerdown", triggerBoot)
      window.removeEventListener("keydown", triggerBoot)
    }
  }, [])

  const signOut = async () => {
    if (supabaseClient) await supabaseClient.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
