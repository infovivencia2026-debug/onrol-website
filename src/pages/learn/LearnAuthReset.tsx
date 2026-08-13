import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Loader2, BookOpen, Lock, ArrowRight, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { lmsConfirmPasswordReset } from "@/lib/lmsAuth";

/**
 * Password-reset confirmation page at /learn/auth/reset?token=...
 * Collects a new password and exchanges the one-time token for a fresh
 * session via /api/lms/auth/reset { action: "confirm" }.
 */
export default function LearnAuthReset() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (!token) { toast.error("Reset link is missing its token."); return; }
    if (password.length < 8) { toast.error("Password must be at least 8 characters."); return; }
    if (password !== confirm) { toast.error("Passwords don't match."); return; }
    setBusy(true);
    try {
      await lmsConfirmPasswordReset({ token, password });
      setDone(true);
      setTimeout(() => navigate("/learn", { replace: true }), 800);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not reset password.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f5f8] text-slate-100 font-sans flex items-center justify-center px-5 py-12">
      <div className="w-full max-w-md">
        <Link to="/learn/login" className="inline-flex items-center gap-2.5 mb-6">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#ff6a00] to-[#ff8a3d] flex items-center justify-center shadow-md shadow-orange-500/30">
            <BookOpen className="h-4 w-4 text-white" />
          </div>
          <div className="font-semibold text-white">ONROL Learn</div>
        </Link>

        <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-[#3f3f3f] to-[#f3f5f8] p-6 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)]">
          {done ? (
            <div className="text-center py-2">
              <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto mb-3" />
              <h1 className="text-lg font-semibold text-white mb-1">Password updated.</h1>
              <p className="text-sm text-slate-400">Taking you to your dashboard…</p>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-white mb-1">Choose a new password</h1>
              <p className="text-sm text-slate-400 mb-6">
                Pick something at least 8 characters. You'll be signed in automatically once you save.
              </p>
              <form onSubmit={submit} className="space-y-4">
                <label className="block">
                  <span className="block mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-300">New password</span>
                  <div className="relative">
                    <Lock className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="password"
                      required
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-white/10 bg-[#f3f5f8] text-white placeholder-slate-500 focus:border-[#ff6a00] focus:outline-none focus:ring-2 focus:ring-[#ff6a00]/30 transition"
                    />
                  </div>
                </label>
                <label className="block">
                  <span className="block mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-300">Confirm password</span>
                  <div className="relative">
                    <Lock className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="password"
                      required
                      autoComplete="new-password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="Repeat the password"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-white/10 bg-[#f3f5f8] text-white placeholder-slate-500 focus:border-[#ff6a00] focus:outline-none focus:ring-2 focus:ring-[#ff6a00]/30 transition"
                    />
                  </div>
                </label>
                <button
                  type="submit"
                  disabled={busy}
                  className="w-full inline-flex justify-center items-center gap-2 py-3 rounded-lg bg-gradient-to-r from-[#ff6a00] to-[#ff8a3d] text-white font-semibold hover:shadow-lg hover:shadow-orange-500/40 transition disabled:opacity-50"
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                  {busy ? "Saving…" : "Save new password"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
