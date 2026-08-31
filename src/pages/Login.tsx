import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, BookOpen, TrendingUp, Users, Zap } from "lucide-react";
import { toast } from "sonner";
import { communitySupabase as supabase } from "@/lib/communitySupabase";
import Logo from "@/components/shared/Logo";

const INTER_STACK = `"Fira Sans", Figtree, system-ui, -apple-system, "Segoe UI", sans-serif`;

const perks = [
  { icon: BookOpen, label: "Daily AI updates, free, by category" },
  { icon: Zap,      label: "Curated tools, prompts, and hacks that ship" },
  { icon: Users,    label: "10K+ Indian builders shipping with AI" },
  { icon: TrendingUp, label: "Workshops, jobs, and AI-builder wins" },
];

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (mounted && data.session) {
        navigate("/community/dashboard", { replace: true });
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        navigate("/community/dashboard", { replace: true });
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);

    if (error) {
      toast.error(error.message || "Unable to sign in.");
      return;
    }

    toast.success("Signed in successfully.");
    navigate("/community/dashboard", { replace: true });
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/community/dashboard`,
      },
    });

    if (error) {
      setGoogleLoading(false);
      toast.error(error.message || "Google sign-in failed.");
    }
  };

  return (
    <div
      className="min-h-screen bg-[#f3f5f8] text-[#0B1640]"
      style={{ fontFamily: INTER_STACK }}
    >
      <div className="mx-auto grid min-h-screen max-w-7xl lg:grid-cols-[1.1fr_0.9fr]">
        {/* Left rail — pitch */}
        <section className="relative hidden overflow-hidden border-r border-[#0B1640]/10 px-10 py-12 lg:flex lg:flex-col lg:justify-between">
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-[radial-gradient(70%_50%_at_18%_15%,rgba(255,107,71,0.16),transparent_60%),radial-gradient(55%_40%_at_85%_25%,rgba(56,189,248,0.10),transparent_65%)]"
          />
          <div>
            <Link to="/" aria-label="ONROL home">
              <Logo variant="light" className="h-12 w-auto" />
            </Link>
          </div>

          <div className="space-y-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-orange-600">
              — ONROL Community
            </p>
            <h1
              className="text-[#0B1640]"
              style={{
                fontSize: "clamp(28px, 4vw, 44px)",
                fontWeight: 800,
                letterSpacing: "-0.025em",
                lineHeight: 1.05,
              }}
            >
              Daily AI updates, <span className="text-orange-400">category-wise</span>.
            </h1>
            <p className="max-w-lg text-[15px] leading-relaxed text-[#0B1640]/75">
              Sign in to follow your favourite categories, save posts, and get the daily AI
              drops India's builders are using.
            </p>
            <div className="space-y-2.5 pt-2">
              {perks.map((perk) => (
                <div
                  key={perk.label}
                  className="flex items-center gap-3 rounded-xl border border-[#0B1640]/10 bg-white px-3.5 py-2.5"
                >
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-orange-500/15 text-orange-600">
                    <perk.icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-[13.5px] text-[#0B1640]/85">{perk.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-[#0B1640]/10 bg-white p-4 text-[13px] text-[#0B1640]/75">
            No paywall. No spam. Admin-curated feed — only what's worth your time.
          </div>
        </section>

        {/* Right rail — auth form */}
        <section className="flex items-center justify-center px-5 py-12 sm:px-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="w-full max-w-md rounded-3xl border border-[#0B1640]/10 bg-[#232532] p-6 shadow-2xl sm:p-8"
          >
            <div className="mb-6 lg:hidden">
              <Link to="/" aria-label="ONROL home">
                <Logo variant="light" className="h-10 w-auto" />
              </Link>
            </div>

            <h2
              className="text-[#0B1640]"
              style={{ fontSize: "24px", fontWeight: 800, letterSpacing: "-0.02em" }}
            >
              Welcome back
            </h2>
            <p className="mt-1.5 text-[14px] text-[#0B1640]/75">
              Sign in to ONROL Community.
            </p>

            <button
              onClick={handleGoogle}
              disabled={googleLoading}
              className="mt-6 flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-[#0B1640]/12 bg-white text-[14px] font-bold text-[#f3f5f8] transition hover:brightness-105 disabled:opacity-60"
            >
              <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden>
                <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
                <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
                <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
                <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
              </svg>
              {googleLoading ? "Redirecting..." : "Continue with Google"}
            </button>

            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-white/12" />
              <span className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-[#0B1640]/55">or email</span>
              <div className="h-px flex-1 bg-white/12" />
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-[11.5px] font-bold uppercase tracking-wider text-[#0B1640]/55">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  placeholder="you@example.com"
                  className="h-12 w-full rounded-xl border border-[#0B1640]/10 bg-white px-3.5 text-[14px] text-[#0B1640] placeholder:text-[#0B1640]/55 focus:border-orange-400/60 focus:outline-none focus:ring-2 focus:ring-orange-300/20"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[11.5px] font-bold uppercase tracking-wider text-[#0B1640]/55">Password</span>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    placeholder="••••••••"
                    className="h-12 w-full rounded-xl border border-[#0B1640]/10 bg-white px-3.5 pr-11 text-[14px] text-[#0B1640] placeholder:text-[#0B1640]/55 focus:border-orange-400/60 focus:outline-none focus:ring-2 focus:ring-orange-300/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#0B1640]/55 hover:text-orange-600"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="h-12 w-full rounded-xl bg-gradient-to-r from-orange-500 to-orange-400 text-[14px] font-bold uppercase tracking-wider text-white shadow-[0_14px_28px_-12px_rgba(255,107,71,0.55)] transition hover:brightness-110 disabled:opacity-60"
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>

            <p className="mt-6 text-center text-[12.5px] text-[#0B1640]/55">
              First time? Just continue with Google — no password needed.
            </p>
          </motion.div>
        </section>
      </div>
    </div>
  );
}


