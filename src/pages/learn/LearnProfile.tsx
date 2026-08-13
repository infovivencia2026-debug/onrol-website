import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, User, Mail, Phone, Lock, LogOut, Save, BookOpen, Award, Clock, Flame, Download, ChevronRight, LayoutGrid, Settings as SettingsIcon } from "lucide-react";
import { toast } from "sonner";
import { useLmsAuth } from "@/contexts/LmsAuthContext";
import { LearnShell } from "@/components/learn/LearnShell";
import { getLmsToken } from "@/lib/lmsAuth";
import {
  lmsListMyEnrollments, lmsListMyCertificates, lmsListMyProgress, lmsRenderCertificatePdf,
  type LmsEnrollment, type LmsCertificate,
} from "@/lib/lmsClient";
import "@/styles/learn-shell.css";

const CRM_BASE = (import.meta.env.VITE_CRM_BASE as string | undefined) ?? "https://go.onrol.in";

interface ProfileUser {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  last_sign_in_at: string | null;
}

export default function LearnProfile() {
  const { user, loading, signOut, refresh } = useLmsAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileUser | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwBusy, setPwBusy] = useState(false);
  const [enrollments, setEnrollments] = useState<LmsEnrollment[]>([]);
  const [certs, setCerts] = useState<LmsCertificate[]>([]);
  const [progressCount, setProgressCount] = useState<number>(0);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) navigate("/learn/login", { replace: true });
  }, [loading, user, navigate]);

  // Load learning stats (enrollments + certificates + lesson progress).
  // All three calls are parallel + fault-tolerant — any one failing just
  // leaves that section empty instead of blocking the whole page.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setStatsLoading(true);
    (async () => {
      const [enr, cert, prog] = await Promise.all([
        lmsListMyEnrollments().catch(() => []),
        lmsListMyCertificates().catch(() => []),
        lmsListMyProgress(user.id).catch(() => []),
      ]);
      if (cancelled) return;
      setEnrollments(enr);
      setCerts(cert);
      const done = prog.filter((row) => Boolean((row as { completed_at?: string | null }).completed_at)).length;
      setProgressCount(done);
      setStatsLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user]);

  useEffect(() => {
    void (async () => {
      const token = getLmsToken();
      if (!token) return;
      const r = await fetch(`${CRM_BASE}/api/lms/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "omit",
      });
      if (!r.ok) return;
      const body = await r.json() as { user: ProfileUser };
      setProfile(body.user);
      setFullName(body.user.full_name ?? "");
      setPhone(body.user.phone ?? "");
    })();
  }, []);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const r = await fetch(`${CRM_BASE}/api/lms/auth/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getLmsToken()}` },
        credentials: "omit",
        body: JSON.stringify({ fullName, phone }),
      });
      if (!r.ok) throw new Error((await r.json()).message || "Save failed");
      toast.success("Profile saved.");
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setBusy(false);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (pwBusy) return;
    if (newPw.length < 8) { toast.error("New password must be at least 8 characters."); return; }
    if (newPw !== confirmPw) { toast.error("Passwords don't match."); return; }
    setPwBusy(true);
    try {
      const r = await fetch(`${CRM_BASE}/api/lms/auth/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getLmsToken()}` },
        credentials: "omit",
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });
      if (!r.ok) throw new Error((await r.json()).message || "Password change failed");
      toast.success("Password updated.");
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Password change failed.");
    } finally {
      setPwBusy(false);
    }
  }

  const initials = (user?.full_name ?? user?.email ?? "?").split(/[@. ]/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";

  const activeEnrollments = useMemo(() => enrollments.filter((e) => e.status === "active"), [enrollments]);
  const lastSignInRel = useMemo(() => {
    const iso = profile?.last_sign_in_at;
    if (!iso) return null;
    const diffMin = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
    if (diffMin < 1) return "just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffMin < 1440) return `${Math.round(diffMin / 60)}h ago`;
    return `${Math.round(diffMin / 1440)}d ago`;
  }, [profile?.last_sign_in_at]);

  async function downloadCert(c: LmsCertificate) {
    try {
      const url = c.pdf_url ?? await lmsRenderCertificatePdf(c.verification_code);
      if (!url) { toast.error("Couldn't generate certificate PDF."); return; }
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      toast.error("Couldn't open certificate.");
    }
  }

  return (
    <LearnShell>
      {/* Hero band — matches the LearnHome treatment so Account feels
          like part of the same product, not an afterthought form. */}
      <section className="lh-hero" style={{ minHeight: 160 }}>
        <div className="lh-hero-bg" aria-hidden />
        <div className="lh-hero-inner">
          <div className="lh-hero-text">
            <span className="lh-hero-eyebrow">Account</span>
            <h1 className="lh-hero-title" style={{ fontSize: 24 }}>{profile?.full_name || user?.full_name || "Your account"}</h1>
            <p className="lh-hero-sub">
              {profile?.email || user?.email}
            </p>
          </div>
          <div className="lh-hero-side">
            <div className="lh-hero-avatar" aria-hidden style={{ width: 72, height: 72, fontSize: 26 }}>
              <span>{initials}</span>
            </div>
          </div>
        </div>
      </section>

      <SettingsCategorisedLayout>
      <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 960, margin: "0 auto", width: "100%" }}>
        {/* Learning summary — 4 KPI tiles. Self-hides when there's no
            enrollment yet (a freshly-signed-up account would see noise). */}
        {!statsLoading && enrollments.length > 0 ? (
          <section data-tab="overview" className="learn-card" style={{ padding: 14 }}>
            <h3 className="learn-card-title"><Flame size={15} /> Learning summary</h3>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: 10,
              marginTop: 6,
            }}>
              <ProfileKpi icon={<BookOpen size={18} />} label="Enrolled courses" value={activeEnrollments.length} tint="rgba(14, 165, 233, 0.1)" iconColor="#0369a1" />
              <ProfileKpi icon={<Award size={18} />} label="Certificates" value={certs.length} tint="rgba(34, 197, 94, 0.12)" iconColor="#15803d" />
              <ProfileKpi icon={<Clock size={18} />} label="Lessons done" value={progressCount} tint="rgba(234, 88, 12, 0.1)" iconColor="#c2410c" />
              <ProfileKpi icon={<User size={18} />} label="Last sign-in" value={lastSignInRel ?? "—"} tint="rgba(168, 85, 247, 0.1)" iconColor="#7e22ce" />
            </div>
          </section>
        ) : null}

        {/* Enrolled courses strip — quick jump back into anything in progress. */}
        {activeEnrollments.length > 0 ? (
          <section data-tab="overview" className="learn-card" style={{ padding: 14 }}>
            <h3 className="learn-card-title" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><BookOpen size={15} /> My courses</span>
              <Link to="/learn/me/courses" style={{ fontSize: 11.5, color: "var(--learn-accent-2, #ea580c)", textDecoration: "none", fontWeight: 600 }}>
                View all <ChevronRight size={11} style={{ verticalAlign: -1 }} />
              </Link>
            </h3>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: 8,
              marginTop: 8,
            }}>
              {activeEnrollments.slice(0, 6).map((e) => (
                <Link
                  key={e.id}
                  to={e.course_slug ? `/learn/c/${e.course_slug}` : "/learn/me/courses"}
                  style={{
                    display: "flex", flexDirection: "column", gap: 4,
                    padding: 10,
                    border: "1px solid var(--learn-border, #e5e7eb)",
                    borderRadius: 8,
                    background: "var(--learn-surface, #fff)",
                    textDecoration: "none",
                    color: "var(--learn-ink, #f3f5f8)",
                    transition: "border-color 120ms, transform 120ms",
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {e.course_title ?? "Untitled course"}
                  </span>
                  <span style={{ fontSize: 11, color: "var(--learn-muted, #6b7280)" }}>
                    Enrolled {new Date(e.enrolled_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {/* Certificates — download / verify. */}
        {certs.length > 0 ? (
          <section data-tab="overview" className="learn-card" style={{ padding: 14 }}>
            <h3 className="learn-card-title"><Award size={15} /> Certificates earned</h3>
            <ul style={{ listStyle: "none", margin: "6px 0 0", padding: 0, display: "flex", flexDirection: "column", gap: 6 }}>
              {certs.map((c) => (
                <li
                  key={c.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto auto",
                    gap: 10,
                    alignItems: "center",
                    padding: "8px 10px",
                    background: "var(--learn-surface, #fff)",
                    border: "1px solid var(--learn-border, #e5e7eb)",
                    borderRadius: 8,
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {c.course_title_snapshot ?? "Untitled course"}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--learn-muted, #6b7280)" }}>
                      Issued {new Date(c.issued_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} · code <code style={{ background: "rgba(0,0,0,0.05)", padding: "1px 5px", borderRadius: 3 }}>{c.verification_code}</code>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => downloadCert(c)}
                    className="learn-btn learn-btn--ghost"
                    style={{ fontSize: 11.5, padding: "5px 10px" }}
                  >
                    <Download size={12} /> PDF
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* Profile card */}
        <section data-tab="profile" className="learn-card">
          <h3 className="learn-card-title"><User size={15} /> Profile</h3>
          <p className="learn-card-help">Email is locked — contact your admin if you need to change it.</p>

          <form onSubmit={saveProfile} className="learn-form">
            <label className="learn-form-label">
              <span>Email</span>
              <div className="learn-form-field">
                <Mail size={14} className="learn-form-icon" />
                <input
                  type="email"
                  readOnly
                  value={profile?.email ?? user?.email ?? ""}
                  className="learn-form-input learn-form-input--readonly"
                />
              </div>
            </label>

            <label className="learn-form-label">
              <span>Full name</span>
              <div className="learn-form-field">
                <User size={14} className="learn-form-icon" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Anita Sharma"
                  className="learn-form-input"
                />
              </div>
            </label>

            <label className="learn-form-label">
              <span>Phone (optional)</span>
              <div className="learn-form-field">
                <Phone size={14} className="learn-form-icon" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="learn-form-input"
                />
              </div>
            </label>

            <div className="learn-form-actions">
              <button type="submit" disabled={busy} className="learn-btn learn-btn--primary">
                {busy ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {busy ? "Saving…" : "Save profile"}
              </button>
            </div>
          </form>
        </section>

        {/* Password card */}
        <section data-tab="security" className="learn-card">
          <h3 className="learn-card-title"><Lock size={15} /> Change password</h3>
          <p className="learn-card-help">At least 8 characters. After saving you stay signed in on this device.</p>

          <form onSubmit={changePassword} className="learn-form">
            <label className="learn-form-label">
              <span>Current password</span>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                className="learn-form-input"
              />
            </label>
            <label className="learn-form-label">
              <span>New password</span>
              <input
                type="password"
                required
                autoComplete="new-password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                placeholder="At least 8 characters"
                className="learn-form-input"
              />
            </label>
            <label className="learn-form-label">
              <span>Confirm new password</span>
              <input
                type="password"
                required
                autoComplete="new-password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                className="learn-form-input"
              />
            </label>
            <div className="learn-form-actions">
              <button type="submit" disabled={pwBusy || !currentPw || !newPw} className="learn-btn learn-btn--primary">
                {pwBusy ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
                {pwBusy ? "Updating…" : "Update password"}
              </button>
            </div>
          </form>
        </section>

        {/* Sign out */}
        <section data-tab="security" className="learn-card">
          <h3 className="learn-card-title"><LogOut size={15} /> Sign out</h3>
          <p className="learn-card-help">You&apos;ll be signed out on this device only.</p>
          <div className="learn-form-actions">
            <button
              type="button"
              onClick={() => { signOut(); navigate("/learn/login", { replace: true }); }}
              className="learn-btn learn-btn--ghost"
            >
              <LogOut size={14} /> Sign out
            </button>
          </div>
        </section>
      </div>
      </SettingsCategorisedLayout>
    </LearnShell>
  );
}

/* ──────────────────────────────────────────────────────────────
   SettingsCategorisedLayout
   ──────────────────────────────────────────────────────────────
   Reads `data-tab` on every direct child of its inner content and
   filters to the active category. Robust vs. the prior auto-detection
   that fell over on h3 children mixed with SVG icons.
   ────────────────────────────────────────────────────────────── */

type TabId = "overview" | "profile" | "security";

const CATEGORIES: Array<{ id: TabId; label: string; icon: React.ReactNode }> = [
  { id: "overview", label: "Overview",       icon: <LayoutGrid size={16} /> },
  { id: "profile",  label: "Profile",        icon: <User size={16} /> },
  { id: "security", label: "Security",       icon: <Lock size={16} /> },
];

function SettingsCategorisedLayout({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState<TabId>("overview");

  // Walk all descendants once; collect every node with a data-tab prop.
  // Each gets pushed to its bucket; render only active bucket.
  const buckets = useMemo(() => {
    const out: Record<TabId, React.ReactNode[]> = { overview: [], profile: [], security: [] };
    const walk = (n: React.ReactNode): void => {
      if (n === null || n === undefined || typeof n === "boolean") return;
      if (Array.isArray(n)) { n.forEach(walk); return; }
      if (typeof n === "string" || typeof n === "number") return;
      const el = n as { props?: { ["data-tab"]?: TabId; children?: React.ReactNode } };
      const tab = el.props?.["data-tab"];
      if (tab && (tab === "overview" || tab === "profile" || tab === "security")) {
        out[tab].push(n);
        return;       // don't descend; the section IS the leaf for tab purposes
      }
      walk(el.props?.children);
    };
    walk(children);
    return out;
  }, [children]);

  return (
    <div className="learn-settings-shell">
      <nav className="learn-settings-rail" aria-label="Settings categories">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`learn-settings-tab${active === c.id ? " is-active" : ""}`}
            onClick={() => setActive(c.id)}
          >
            <span className="learn-settings-tab-icon">{c.icon}</span>
            <span>{c.label}</span>
            <span className="learn-settings-tab-count">{buckets[c.id].length}</span>
          </button>
        ))}
      </nav>
      <div className="learn-settings-pane">
        {buckets[active].length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#64748b", background: "#fff", border: "1px solid #e8eaf0", borderRadius: 14 }}>
            <SettingsIcon size={32} style={{ color: "#94a3b8", marginBottom: 8 }} />
            <p style={{ margin: 0 }}>No settings in this category.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {buckets[active]}
          </div>
        )}
      </div>
    </div>
  );
}

function ProfileKpi({
  icon, label, value, tint, iconColor,
}: { icon: React.ReactNode; label: string; value: string | number; tint: string; iconColor: string }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: 10,
      border: "1px solid var(--learn-border, #e5e7eb)",
      borderRadius: 8,
      background: "var(--learn-surface, #fff)",
    }}>
      <span style={{
        width: 34, height: 34, borderRadius: 8,
        background: tint, color: iconColor,
        display: "inline-flex", alignItems: "center", justifyContent: "center",
      }}>{icon}</span>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: "var(--learn-ink, #f3f5f8)", lineHeight: 1.1 }}>{value}</div>
        <div style={{ fontSize: 10.5, color: "var(--learn-muted, #6b7280)", textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 700 }}>{label}</div>
      </div>
    </div>
  );
}
