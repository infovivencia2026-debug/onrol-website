import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Loader2, Mail, Lock, ArrowRight, CheckCircle2, Brain, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useLmsAuth } from "@/contexts/LmsAuthContext";
import { lmsLogin, lmsRequestMagicLink, lmsRequestPasswordReset } from "@/lib/lmsAuth";
import "@/styles/learn-shell.css";

/**
 * Learner login page at /learn/login.
 *
 * Visual language matches the rest of learn.onrol.in (ONROL Learn — AI
 * Execution School): white surfaces, navy ink, orange brand accent,
 * cream-gradient brand panel on the left at desktop, stacked on mobile.
 * Same auth backends as before (Supabase password + magic link + reset).
 */
export default function LearnLogin() {
  const { user, loading } = useLmsAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const next = params.get("next") || "/learn";

  const [mode, setMode] = useState<"password" | "magic">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [magicSent, setMagicSent] = useState(false);

  // If already signed in, bounce to dashboard / requested route.
  useEffect(() => {
    if (!loading && user) {
      navigate(next.startsWith("/learn") ? next : "/learn", { replace: true });
    }
  }, [user, loading, navigate, next]);

  const signInWithPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (!email.trim() || !password) {
      toast.error("Enter your email and password.");
      return;
    }
    setBusy(true);
    try {
      await lmsLogin({ email: email.trim().toLowerCase(), password });
      toast.success("Welcome back. Loading your dashboard…");
      navigate(next.startsWith("/learn") ? next : "/learn", { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not sign in.");
    } finally {
      setBusy(false);
    }
  };

  const sendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (!email.trim()) {
      toast.error("Enter your email.");
      return;
    }
    setBusy(true);
    try {
      await lmsRequestMagicLink(email.trim().toLowerCase());
      setMagicSent(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send link.");
    } finally {
      setBusy(false);
    }
  };

  const handleForgotPassword = async () => {
    if (busy) return;
    if (!email.trim()) {
      toast.error("Enter your email first, then click 'Forgot password'.");
      return;
    }
    setBusy(true);
    try {
      await lmsRequestPasswordReset(email.trim().toLowerCase());
      toast.success("If that email is registered, a reset link is on its way.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send reset link.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="lhl-page">
      <aside className="lhl-brand" aria-hidden>
        <div className="lhl-brand-mark">
          <img src="/onrol-logo-home.png" alt="ONROL" width={44} height={44} />
          <div>
            <strong>ONROL</strong>
            <small>AI EXECUTION SCHOOL</small>
          </div>
        </div>
        <div className="lhl-brand-art">
          <Brain strokeWidth={1.3} />
        </div>
        <div className="lhl-brand-copy">
          <h2>Welcome back.</h2>
          <p>Pick up where you left off — live cohorts, recorded lessons, assignments, and your community in one place.</p>
        </div>
        <ul className="lhl-brand-bullets">
          <li>Live mentor-led cohorts</li>
          <li>Lessons, quizzes &amp; assignments</li>
          <li>Certificate on completion</li>
        </ul>
      </aside>

      <main className="lhl-main">
        <Link to="/learn/catalog" className="lhl-topcatalog">Browse catalog →</Link>

        <div className="lhl-card">
          <header className="lhl-card-head">
            <h1>Sign in</h1>
            <p>
              Use the email + password your admin set up for you. Forgotten password?
              Use the magic link below.
            </p>
          </header>

          <div className="lhl-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={mode === "password"}
              onClick={() => { setMode("password"); setMagicSent(false); }}
              className={mode === "password" ? "is-active" : ""}
            >
              Password
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "magic"}
              onClick={() => { setMode("magic"); setMagicSent(false); }}
              className={mode === "magic" ? "is-active" : ""}
            >
              Email me a link
            </button>
          </div>

          {magicSent ? (
            <div className="lhl-magic-sent">
              <div className="lhl-magic-icon"><CheckCircle2 /></div>
              <p>
                Magic link sent to <strong>{email}</strong>.<br />
                Check your inbox and click the link to sign in.
              </p>
              <button type="button" className="lhl-textbtn" onClick={() => setMagicSent(false)}>
                Use a different email
              </button>
            </div>
          ) : mode === "password" ? (
            <form onSubmit={signInWithPassword} className="lhl-form">
              <label>
                <span>Email</span>
                <div className="lhl-input">
                  <Mail size={16} />
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                </div>
              </label>
              <label>
                <span>Password</span>
                <div className="lhl-input" style={{ position: "relative" }}>
                  <Lock size={16} />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    style={{ paddingRight: 36 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    tabIndex={-1}
                    style={{
                      position: "absolute",
                      top: "50%",
                      right: 8,
                      transform: "translateY(-50%)",
                      background: "transparent",
                      border: "none",
                      padding: 4,
                      cursor: "pointer",
                      color: "#6b7280",
                      display: "inline-flex",
                      alignItems: "center",
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </label>
              <button type="submit" disabled={busy} className="lhl-submit">
                {busy ? <Loader2 className="animate-spin" size={16} /> : <ArrowRight size={16} />}
                {busy ? "Signing in…" : "Sign in"}
              </button>
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={busy}
                className="lhl-textbtn"
              >
                Forgot password? Email me a reset link.
              </button>
            </form>
          ) : (
            <form onSubmit={sendMagicLink} className="lhl-form">
              <label>
                <span>Email</span>
                <div className="lhl-input">
                  <Mail size={16} />
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                </div>
              </label>
              <button type="submit" disabled={busy} className="lhl-submit">
                {busy ? <Loader2 className="animate-spin" size={16} /> : <Mail size={16} />}
                {busy ? "Sending…" : "Send me a sign-in link"}
              </button>
              <p className="lhl-form-hint">
                We&rsquo;ll email you a one-time link. Click it to sign in — no password needed.
              </p>
            </form>
          )}
        </div>

        <p className="lhl-footer">
          Don&rsquo;t have an account yet?{" "}
          <Link to="/learn/catalog">Browse courses</Link> and request enrollment.
        </p>
      </main>
    </div>
  );
}
