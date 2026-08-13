import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Eye, EyeOff, ShieldCheck, ArrowRight, RotateCcw, UserPlus, Zap, Globe, Lock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";
import onrolLogo from "@/assets/onrol-logo.png";

type Mode = "login" | "activate" | "recovery";

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return fallback;
};

const hardSignOut = async () => {
  try { await supabase.auth.signOut({ scope: "global" }); } catch { /* continue */ }
  try { await supabase.auth.signOut({ scope: "local" }); } catch { /* continue */ }
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith("sb-")) keysToRemove.push(key);
    }
    keysToRemove.forEach((key) => window.localStorage.removeItem(key));
  } catch { /* ignore */ }
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < window.sessionStorage.length; i += 1) {
      const key = window.sessionStorage.key(i);
      if (key && key.startsWith("sb-")) keysToRemove.push(key);
    }
    keysToRemove.forEach((key) => window.sessionStorage.removeItem(key));
  } catch { /* ignore */ }
};

// Inject keyframe animations once
const STYLE_ID = "onrol-login-keyframes";
if (typeof document !== "undefined" && !document.getElementById(STYLE_ID)) {
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes slide-up {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .onrol-slide-up    { animation: slide-up 0.35s ease both; }
    .onrol-slide-up-d1 { animation: slide-up 0.35s 0.05s ease both; }
    .onrol-slide-up-d2 { animation: slide-up 0.35s 0.1s  ease both; }
    .onrol-slide-up-d3 { animation: slide-up 0.35s 0.15s ease both; }
    .onrol-slide-up-d4 { animation: slide-up 0.35s 0.2s  ease both; }
  `;
  document.head.appendChild(style);
}

export default function TaskLogin() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [booting, setBooting] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [existingSession, setExistingSession] = useState<Session | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [recoveryPassword, setRecoveryPassword] = useState("");
  const [recoveryConfirmPassword, setRecoveryConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [activateEmail, setActivateEmail] = useState("");
  const [activatePassword, setActivatePassword] = useState("");

  useEffect(() => {
    let mounted = true;
    const hasRecoveryTypeInHash = window.location.hash.includes("type=recovery");
    const queryParams = new URLSearchParams(window.location.search);
    const hasRecoveryTypeInQuery = queryParams.get("type") === "recovery";
    if (hasRecoveryTypeInHash || hasRecoveryTypeInQuery || window.location.pathname.includes("/reset-password")) {
      setMode("recovery");
    }
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setExistingSession(data.session ?? null);
      setBooting(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      setExistingSession(session ?? null);
      if (event === "PASSWORD_RECOVERY") setMode("recovery");
    });
    return () => { mounted = false; subscription.unsubscribe(); };
  }, [navigate]);

  const ensureEmployeeProfile = async (userId: string, email: string, name: string, dept: string): Promise<"employee" | "admin"> => {
    let role: "employee" | "admin" = "employee";
    let department = dept.trim() || "Operations";
    const normalizedEmail = email.trim().toLowerCase();
    try {
      const { data: existing } = await supabase.from("office_users").select("role,department").eq("id", userId).maybeSingle();
      if (existing?.role === "admin" || existing?.role === "employee") { role = existing.role; department = existing.department || department; }
    } catch { /* continue */ }
    if (role !== "admin") {
      try {
        const { data: adminById } = await supabase.from("admins").select("id").eq("id", userId).maybeSingle();
        if (adminById?.id) { role = "admin"; } else if (normalizedEmail) {
          const { data: adminByEmail } = await supabase.from("admins").select("id").ilike("email", normalizedEmail).maybeSingle();
          if (adminByEmail?.id) role = "admin";
        }
      } catch { /* ignore */ }
    }
    try {
      const { data: inviteMatch } = await supabase.from("office_user_invites").select("id,role,department,status").eq("email", normalizedEmail).eq("status", "pending").maybeSingle();
      if (inviteMatch) {
        role = (inviteMatch.role as "employee" | "admin") || "employee";
        department = inviteMatch.department || department;
        await supabase.from("office_user_invites").update({ status: "accepted" }).eq("id", inviteMatch.id);
      }
    } catch { /* ignore */ }
    const payload = { id: userId, full_name: name.trim() || email.split("@")[0], email: normalizedEmail, role, department, is_active: true };
    const { error: upsertError } = await supabase.from("office_users").upsert(payload, { onConflict: "id" });
    if (upsertError) throw upsertError;
    return role;
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (!loginEmail.trim() || !loginPassword.trim()) { setError("Enter email and password."); return; }
    setLoading(true);
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email: loginEmail.trim(), password: loginPassword.trim() });
    if (signInError) { setLoading(false); setError(signInError.message || "Unable to sign in."); return; }
    try {
      let role: "employee" | "admin" = "employee";
      if (data.user?.id && data.user.email) {
        role = await ensureEmployeeProfile(data.user.id, data.user.email,
          (typeof data.user.user_metadata?.full_name === "string" ? data.user.user_metadata.full_name : "") || data.user.email.split("@")[0], "Operations");
      }
      toast.success("Signed in successfully.");
      navigate(role === "admin" ? "/admin/dashboard" : "/task/journey", { replace: true });
    } catch (profileError: unknown) {
      setError(getErrorMessage(profileError, "Unable to sync task profile."));
    } finally { setLoading(false); }
  };

  const handleActivate = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (!fullName.trim() || !activateEmail.trim() || !activatePassword.trim()) { setError("Name, invited email, and password are required."); return; }
    if (activatePassword.length < 6) { setError("Password must be at least 6 characters."); return; }
    const normalizedEmail = activateEmail.trim().toLowerCase();
    const { data: inviteMatch, error: inviteError } = await supabase.from("office_user_invites").select("id,status").ilike("email", normalizedEmail).eq("status", "pending").maybeSingle();
    if (inviteError || !inviteMatch) { setError("No pending invite found for this email. Contact your admin."); return; }
    setLoading(true);
    const { data, error: signUpError } = await supabase.auth.signUp({ email: normalizedEmail, password: activatePassword.trim(), options: { data: { full_name: fullName.trim() } } });
    if (signUpError && !/already registered|already been registered/i.test(signUpError.message || "")) { setLoading(false); setError(signUpError.message || "Unable to activate account."); return; }
    const signInResult = await supabase.auth.signInWithPassword({ email: normalizedEmail, password: activatePassword.trim() });
    if (signInResult.error) { setLoading(false); setError(signInResult.error.message || "Account created, but login failed. Try again from Login."); return; }
    if (!signInResult.data.session) { setLoading(false); setError("Activation needs admin sign-in policy update. Contact your admin."); return; }
    try {
      let role: "employee" | "admin" = "employee";
      if (signInResult.data.user?.id) role = await ensureEmployeeProfile(signInResult.data.user.id, normalizedEmail, fullName, "Operations");
      toast.success("Account activated successfully.");
      navigate(role === "admin" ? "/admin/dashboard" : "/task/journey", { replace: true });
    } catch (profileError: unknown) { setLoading(false); setError(getErrorMessage(profileError, "Activated, but profile sync failed.")); return; }
    if (!data.user) { setLoading(false); setMode("login"); return; }
    setLoading(false);
  };

  const handleForgotPassword = async () => {
    setError("");
    const email = (forgotEmail || loginEmail).trim();
    if (!email) { setError("Enter your email to receive a reset link."); return; }
    setLoading(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/task/reset-password` });
    setLoading(false);
    if (resetError) { setError(resetError.message || "Unable to send password reset email."); return; }
    toast.success("Password reset email sent. Check your inbox.");
  };

  const handleUpdatePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (!recoveryPassword.trim() || !recoveryConfirmPassword.trim()) { setError("Enter and confirm your new password."); return; }
    if (recoveryPassword.trim().length < 6) { setError("Password must be at least 6 characters."); return; }
    if (recoveryPassword.trim() !== recoveryConfirmPassword.trim()) { setError("Passwords do not match."); return; }
    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password: recoveryPassword.trim() });
    if (updateError) { setLoading(false); setError(updateError.message || "Unable to update password."); return; }
    await hardSignOut();
    setExistingSession(null);
    setRecoveryPassword(""); setRecoveryConfirmPassword("");
    setMode("login");
    window.history.replaceState({}, document.title, "/task");
    toast.success("Password updated. Please login with your new password.");
    setLoading(false);
  };

  if (booting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f3f5f8]">
        <div className="flex flex-col items-center gap-5">
          <img src={onrolLogo} alt="ONROL" className="h-10 w-auto opacity-90" />
          <div className="h-0.5 w-20 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-indigo-500/60" />
          </div>
        </div>
      </div>
    );
  }

  const inputBase =
    "h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500/50 focus:bg-indigo-500/5 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 transition-all duration-200";

  const tabs: { key: Mode; label: string; icon: typeof ArrowRight }[] = [
    { key: "login",    label: "Sign In",  icon: ArrowRight },
    { key: "activate", label: "Activate", icon: UserPlus },
    { key: "recovery", label: "Reset",    icon: RotateCcw },
  ];

  return (
    <div className="min-h-screen bg-[#f3f5f8] flex items-center justify-center p-4 md:p-8">

      <div className="mx-auto grid w-full max-w-5xl gap-12 lg:grid-cols-[1fr_420px] lg:items-center">

        {/* ── Left: branding panel ──────────────────────────────────────────── */}
        <div className="hidden lg:flex lg:flex-col onrol-slide-up">

          {/* Logo */}
          <img src={onrolLogo} alt="ONROL" className="h-9 w-auto self-start mb-10" />

          <h1 className="text-4xl font-bold text-white leading-tight tracking-tight">
            Field Sales CRM<br />
            <span className="text-slate-400 font-normal text-3xl">for high-performance teams</span>
          </h1>
          <p className="mt-5 text-slate-500 leading-relaxed max-w-sm text-sm">
            Manage tasks, track visits, plan journeys, and coordinate your team — all from one workspace.
          </p>

          {/* Feature list */}
          <div className="mt-9 space-y-3">
            {[
              { icon: ShieldCheck, text: "Role-based access — Admin & Employee", color: "text-emerald-400" },
              { icon: Zap,         text: "Real-time sync with offline queue",     color: "text-indigo-400" },
              { icon: Lock,        text: "JWT auth with end-to-end encryption",   color: "text-violet-400" },
              { icon: Globe,       text: "Web, Android & Desktop — one codebase", color: "text-orange-400" },
            ].map(({ icon: Icon, text, color }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-white/5">
                  <Icon className={`h-3.5 w-3.5 ${color}`} />
                </div>
                <p className="text-sm text-slate-400">{text}</p>
              </div>
            ))}
          </div>

          {/* Stats row */}
          <div className="mt-10 flex gap-8 border-t border-white/8 pt-8">
            {[
              { value: "3000+", label: "Institutions" },
              { value: "99.9%", label: "Uptime" },
              { value: "< 1s",  label: "Sync speed" },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-2xl font-semibold text-white">{s.value}</p>
                <p className="mt-0.5 text-xs text-slate-600 uppercase tracking-wide">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: auth card ──────────────────────────────────────────────── */}
        <div className="w-full onrol-slide-up-d1">
          <div className="rounded-2xl border border-white/10 bg-[#f3f5f8] p-7 shadow-xl shadow-black/40 md:p-8">

              {/* Mobile logo */}
              <div className="flex items-center justify-between mb-7 lg:hidden">
                <img src={onrolLogo} alt="ONROL" className="h-7 w-auto" />
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] text-slate-500 font-medium">Systems OK</span>
                </div>
              </div>

              {/* Existing session banner */}
              {existingSession ? (
                <div className="mb-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/8 p-4 onrol-slide-up">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    <p className="text-xs font-semibold text-emerald-300 uppercase tracking-wide">Active Session</p>
                  </div>
                  <p className="text-sm text-slate-300 mb-3">
                    <span className="font-semibold text-white">{existingSession.user.email}</span>
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        const uid = existingSession.user?.id;
                        if (!uid) { navigate("/task", { replace: true }); return; }
                        const { data } = await supabase.from("office_users").select("role").eq("id", uid).maybeSingle();
                        navigate(data?.role === "admin" ? "/admin/dashboard" : "/task/journey", { replace: true });
                      }}
                      className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-400 active:scale-95 transition-all"
                    >
                      Continue <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={async () => { await hardSignOut(); setExistingSession(null); toast.success("Logged out."); }}
                      className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-400 hover:text-slate-200 hover:bg-white/10 active:scale-95 transition-all"
                    >
                      Switch account
                    </button>
                  </div>
                </div>
              ) : null}

              {/* Heading */}
              <div className="mb-5 onrol-slide-up-d2">
                <h2 className="text-[22px] font-bold text-white leading-tight">
                  {mode === "login" ? "Welcome back" : mode === "activate" ? "Activate account" : "Reset password"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {mode === "login"
                    ? "Sign in to your workspace"
                    : mode === "activate"
                    ? "Set up your invited account"
                    : "Enter a new secure password"}
                </p>
              </div>

              {/* Tab switcher */}
              <div className="mb-5 flex rounded-xl border border-white/8 bg-black/30 p-1 onrol-slide-up-d3">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => { setMode(tab.key); setError(""); }}
                      className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-200 ${
                        mode === tab.key
                          ? "text-white shadow-lg shadow-indigo-500/20"
                          : "text-slate-500 hover:text-slate-300"
                      }`}
                      style={mode === tab.key ? { background: "linear-gradient(135deg,#4f46e5,#7c3aed)" } : {}}
                    >
                      <Icon className="h-3 w-3" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* ── Login form ──────────────────────────────────────────────── */}
              {mode === "login" ? (
                <form onSubmit={handleLogin} className="space-y-3 onrol-slide-up-d4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-400">Email address</label>
                    <input
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="you@company.com"
                      type="email"
                      autoComplete="email"
                      className={inputBase}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-400">Password</label>
                    <div className="relative">
                      <input
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Enter your password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        className={`${inputBase} pr-11`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {error ? (
                    <div className="flex items-start gap-2.5 rounded-xl border border-rose-500/20 bg-rose-500/8 px-3.5 py-3">
                      <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-rose-400 flex-shrink-0" />
                      <p className="text-xs text-rose-300">{error}</p>
                    </div>
                  ) : null}

                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-1 flex h-11 w-full items-center justify-center gap-2 rounded-xl font-semibold text-white shadow-lg shadow-indigo-500/20 active:scale-[.98] transition-all duration-150 disabled:opacity-60 disabled:scale-100"
                    style={{ background: loading ? "rgba(99,102,241,0.5)" : "linear-gradient(135deg,#4f46e5,#7c3aed)" }}
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                    {loading ? "Signing in..." : "Sign In"}
                  </button>

                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={loading}
                    className="w-full pt-1 pb-0.5 text-xs text-slate-600 hover:text-slate-400 transition-colors"
                  >
                    Forgot password? Send reset email
                  </button>
                </form>

              ) : mode === "activate" ? (
                <form onSubmit={handleActivate} className="space-y-3 onrol-slide-up-d4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-400">Full name</label>
                    <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" className={inputBase} />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-400">Invited email</label>
                    <input value={activateEmail} onChange={(e) => setActivateEmail(e.target.value)} placeholder="Email your admin invited" type="email" className={inputBase} />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-400">Create password</label>
                    <div className="relative">
                      <input
                        value={activatePassword}
                        onChange={(e) => setActivatePassword(e.target.value)}
                        placeholder="Min 6 characters"
                        type={showPassword ? "text" : "password"}
                        className={`${inputBase} pr-11`}
                      />
                      <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 rounded-xl border border-indigo-500/20 bg-indigo-500/8 px-3.5 py-3">
                    <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                    <p className="text-xs text-indigo-300">Access is invite-only. Use the same email your admin invited.</p>
                  </div>
                  {error ? (
                    <div className="flex items-start gap-2.5 rounded-xl border border-rose-500/20 bg-rose-500/8 px-3.5 py-3">
                      <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-rose-400 flex-shrink-0" />
                      <p className="text-xs text-rose-300">{error}</p>
                    </div>
                  ) : null}
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-xl font-semibold text-white shadow-lg shadow-indigo-500/20 active:scale-[.98] transition-all duration-150 disabled:opacity-60 disabled:scale-100"
                    style={{ background: loading ? "rgba(99,102,241,0.5)" : "linear-gradient(135deg,#4f46e5,#7c3aed)" }}
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                    {loading ? "Activating..." : "Activate Access"}
                  </button>
                </form>

              ) : (
                <form onSubmit={handleUpdatePassword} className="space-y-3 onrol-slide-up-d4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-400">Email for reset link</label>
                    <input value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} placeholder="your@email.com" type="email" className={inputBase} />
                  </div>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={loading}
                    className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 text-sm font-medium text-slate-300 hover:bg-white/10 active:scale-[.98] transition-all disabled:opacity-60"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                    {loading ? "Sending..." : "Send reset email"}
                  </button>
                  <div className="relative flex items-center">
                    <div className="flex-1 border-t border-white/8" />
                    <span className="mx-3 text-[11px] text-slate-600">then set new password</span>
                    <div className="flex-1 border-t border-white/8" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-400">New password</label>
                    <div className="relative">
                      <input value={recoveryPassword} onChange={(e) => setRecoveryPassword(e.target.value)} placeholder="New password" type={showPassword ? "text" : "password"} className={`${inputBase} pr-11`} />
                      <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-400">Confirm new password</label>
                    <div className="relative">
                      <input value={recoveryConfirmPassword} onChange={(e) => setRecoveryConfirmPassword(e.target.value)} placeholder="Confirm password" type={showConfirmPassword ? "text" : "password"} className={`${inputBase} pr-11`} />
                      <button type="button" onClick={() => setShowConfirmPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  {error ? (
                    <div className="flex items-start gap-2.5 rounded-xl border border-rose-500/20 bg-rose-500/8 px-3.5 py-3">
                      <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-rose-400 flex-shrink-0" />
                      <p className="text-xs text-rose-300">{error}</p>
                    </div>
                  ) : null}
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-xl font-semibold text-white shadow-lg shadow-indigo-500/20 active:scale-[.98] transition-all duration-150 disabled:opacity-60 disabled:scale-100"
                    style={{ background: loading ? "rgba(99,102,241,0.5)" : "linear-gradient(135deg,#4f46e5,#7c3aed)" }}
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                    {loading ? "Updating..." : "Update Password"}
                  </button>
                </form>
              )}

              {/* Footer */}
              <div className="mt-5 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] text-slate-600 font-medium">All systems operational</span>
                </div>
                <p className="text-[10px] text-slate-700">
                  Supabase · RBAC · E2E
                </p>
              </div>

          </div>
        </div>
      </div>
    </div>
  );
}
