import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Loader2, CheckCircle2, AlertCircle, BookOpen } from "lucide-react";
import { lmsExchangeMagicToken } from "@/lib/lmsAuth";

/**
 * Magic-link landing page at /learn/auth/callback?token=...
 * Exchanges the one-time token for an LMS session JWT, then redirects
 * to the learner dashboard (or `?next=` if present).
 */
export default function LearnAuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const token = params.get("token") ?? "";
  const next = params.get("next") || "/learn";

  const [state, setState] = useState<"working" | "ok" | "fail">("working");
  const [error, setError] = useState<string | null>(null);
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    if (!token) { setState("fail"); setError("No sign-in token in the link."); return; }
    void (async () => {
      try {
        await lmsExchangeMagicToken(token);
        setState("ok");
        // Tiny delay so the success state is visible.
        setTimeout(() => {
          navigate(next.startsWith("/learn") ? next : "/learn", { replace: true });
        }, 600);
      } catch (e) {
        setState("fail");
        setError(e instanceof Error ? e.message : "Sign-in failed.");
      }
    })();
  }, [token, navigate, next]);

  return (
    <div className="min-h-screen bg-[#f3f5f8] text-slate-100 font-sans flex items-center justify-center px-5">
      <div className="w-full max-w-md text-center">
        <div className="inline-flex items-center gap-2.5 mb-6">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-[#ff6a00] to-[#ff8a3d] flex items-center justify-center shadow-md shadow-orange-500/30">
            <BookOpen className="h-4 w-4 text-white" />
          </div>
          <div className="font-semibold text-white">ONROL Learn</div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-[#3f3f3f] to-[#f3f5f8] p-8">
          {state === "working" && (
            <>
              <Loader2 className="h-9 w-9 animate-spin text-[#ff8a3d] mx-auto mb-3" />
              <h1 className="text-lg font-semibold text-white mb-1">Signing you in…</h1>
              <p className="text-sm text-slate-400">One moment while we verify your link.</p>
            </>
          )}
          {state === "ok" && (
            <>
              <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto mb-3" />
              <h1 className="text-lg font-semibold text-white mb-1">Signed in.</h1>
              <p className="text-sm text-slate-400">Redirecting to your dashboard…</p>
            </>
          )}
          {state === "fail" && (
            <>
              <AlertCircle className="h-10 w-10 text-rose-400 mx-auto mb-3" />
              <h1 className="text-lg font-semibold text-white mb-1">Can't sign you in.</h1>
              <p className="text-sm text-slate-400 mb-4">
                {error ?? "This link is invalid, already used, or has expired."}
              </p>
              <Link
                to="/learn/login"
                className="inline-block px-4 py-2 rounded-lg bg-gradient-to-r from-[#ff6a00] to-[#ff8a3d] text-white text-sm font-semibold hover:shadow-lg hover:shadow-orange-500/40 transition"
              >
                Back to sign-in →
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
