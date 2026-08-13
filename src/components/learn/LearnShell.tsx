import { ReactNode, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  Home,
  BookOpen,
  CalendarClock,
  Settings,
  LogOut,
  Menu,
  X,
  Award,
  GraduationCap,
  HelpCircle,
  ClipboardList,
  User as UserIcon,
  Search,
} from "lucide-react";
import { useLmsAuth } from "@/contexts/LmsAuthContext";
import { LearnNotificationsBell } from "@/components/learn-notifications-bell";

type NavItem = { to: string; label: string; mobileLabel?: string; icon: typeof Home; end?: boolean };

const NAV: NavItem[] = [
  { to: "/learn", label: "Home", icon: Home, end: true },
  { to: "/learn/me/courses", label: "My Courses", mobileLabel: "Courses", icon: BookOpen },
  { to: "/learn/me/calendar", label: "Calendar", mobileLabel: "Calendar", icon: CalendarClock },
  { to: "/learn/me/exams", label: "Exams", mobileLabel: "Exams", icon: ClipboardList },
  { to: "/learn/me/certificates", label: "Certificates", mobileLabel: "Certs", icon: Award },
  { to: "/learn/me/profile", label: "Settings", mobileLabel: "Settings", icon: Settings },
  { to: "/learn/help", label: "Help", mobileLabel: "Help", icon: HelpCircle },
];

const MOBILE_NAV = NAV.slice(0, 4);

export function LearnShell({
  children,
  rightRail,
  sidebarExtras,
}: {
  children: ReactNode;
  rightRail?: ReactNode;
  /** Optional extra content inserted into the sidebar below the main nav.
      Used by course pages to render the syllabus inline. */
  sidebarExtras?: ReactNode;
}) {
  const { user, signOut } = useLmsAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Compute up-to-2 initials from full_name OR the local-part of email
  // ("anita.sharma@x.com" → "AS"). Falls back to a person icon when
  // there's truly no name AND no email (rare — pre-auth render only).
  const initials = (() => {
    const seed = (user?.full_name || (user?.email ?? "").split("@")[0] || "").trim();
    if (!seed) return "";
    const parts = seed.split(/[\s._-]+/).filter(Boolean);
    return parts.slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  })();

  // First-name only, sentence case — used in the sidebar profile banner.
  // Matches the target dashboard mock ("vignan" / "Narasimha").
  const profileName = (() => {
    const seed = (user?.full_name || (user?.email ?? "").split("@")[0] || "").trim();
    if (!seed) return "Learner";
    const first = seed.split(/[\s._-]+/).filter(Boolean)[0] ?? seed;
    return first.charAt(0).toUpperCase() + first.slice(1);
  })();

  function handleSignOut() {
    signOut();
    navigate("/learn/login", { replace: true });
  }

  return (
    <div className="learn-shell">
      {/* Topbar */}
      <header className="learn-topbar">
        <button
          type="button"
          className="learn-topbar-burger"
          aria-label="Open menu"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </button>

        <Link to="/learn" className="learn-topbar-brand">
          <img
            src="/onrol-logo-home.png"
            alt="ONROL"
            className="learn-topbar-brand-logo"
            width={36}
            height={36}
            decoding="async"
          />
          <span className="learn-topbar-brand-stack">
            <span className="learn-topbar-brand-text">ONROL</span>
            <span className="learn-topbar-brand-tagline">AI EXECUTION SCHOOL</span>
          </span>
        </Link>

        <div className="learn-topbar-spacer" />

        <div className="learn-topbar-actions">
          <a href="https://onrol.in/contact" target="_blank" rel="noreferrer" className="learn-topbar-contact">Contact Us</a>
          <button type="button" className="learn-topbar-iconbtn" aria-label="Search">
            <Search size={16} />
          </button>
          <LearnNotificationsBell />
          <Link to="/learn/me/profile" className="learn-avatar" aria-label="Account" title={user?.full_name || user?.email || "Account"}>
            {initials ? <span>{initials}</span> : <UserIcon size={16} />}
          </Link>
        </div>
      </header>

      {/* Mobile sidebar drawer */}
      {mobileOpen ? (
        <div className="learn-sidebar-overlay" onClick={() => setMobileOpen(false)}>
          <aside
            className="learn-sidebar learn-sidebar--mobile"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="learn-sidebar-mobilehead">
              <span className="learn-topbar-brand">
                <img src="/onrol-logo-home.png" alt="ONROL" width={28} height={28} className="learn-topbar-brand-logo" decoding="async" />
                <span className="learn-topbar-brand-text">ONROL Learn</span>
              </span>
              <button type="button" aria-label="Close" onClick={() => setMobileOpen(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarBody
              profileName={profileName}
              initials={initials}
              onItemClick={() => setMobileOpen(false)}
              onSignOut={handleSignOut}
              extras={sidebarExtras}
            />
          </aside>
        </div>
      ) : null}

      {/* Layout grid */}
      <div className="learn-layout">
        <aside className="learn-sidebar learn-sidebar--desktop">
          <SidebarBody
            profileName={profileName}
            initials={initials}
            onSignOut={handleSignOut}
            extras={sidebarExtras}
          />
        </aside>

        <main className="learn-main">{children}</main>

        {rightRail ? <aside className="learn-rail">{rightRail}</aside> : null}
      </div>

      {/* Mobile bottom-nav — Circle-style. Visible only on narrow viewports;
          shows the same primary navigation items as the desktop sidebar. */}
      <nav className="learn-bottomnav" aria-label="Primary (mobile)">
        {MOBILE_NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end ?? false}
            className={({ isActive }) =>
              `learn-bottomnav-item${isActive ? " is-active" : ""}`
            }
          >
            <item.icon />
            <span className="learn-bottomnav-label">{item.mobileLabel ?? item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

function SidebarBody({
  profileName,
  initials,
  onItemClick,
  onSignOut,
  extras,
}: {
  profileName: string;
  initials: string;
  onItemClick?: () => void;
  onSignOut: () => void;
  extras?: ReactNode;
}) {
  return (
    <div className="learn-sidebar-inner">
      <div className="learn-sidebar-profile">
        <div className="learn-sidebar-profile-banner" aria-hidden />
        <div className="learn-sidebar-profile-avatar">
          {initials ? <span>{initials}</span> : <UserIcon size={20} />}
        </div>
      </div>
      <div className="learn-sidebar-profile-name">{profileName}</div>
      <div className="learn-sidebar-profile-role">Learner</div>

      <nav className="learn-nav" aria-label="Primary">
        <ul className="learn-nav-list">
          {NAV.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end ?? false}
                onClick={onItemClick}
                className={({ isActive }) =>
                  `learn-nav-link${isActive ? " is-active" : ""}`
                }
              >
                <item.icon className="h-[18px] w-[18px]" />
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>

        {extras ? <div className="learn-nav-extras">{extras}</div> : null}

        <div className="learn-nav-footer">
          <button type="button" className="learn-nav-signout" onClick={onSignOut}>
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </nav>
    </div>
  );
}
