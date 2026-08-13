// CommunityLayout — Discord-inspired product shell.
//
// Visual language: deep-slate (#f3f5f8) surfaces, ONROL orange accents,
// channel-style left rail with `#` prefixed groups, dense type scale,
// real avatars with status dots. The structural shell is distinct from
// the marketing site (slate vs navy, dense rail vs hero pages), but the
// brand orange persists as the accent so the product still feels ONROL.

import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Bell,
  Bookmark,
  Briefcase,
  Calendar,
  ChevronDown,
  Compass,
  Hash,
  Hammer,
  Home,
  Lightbulb,
  LogOut,
  Megaphone,
  Menu,
  MessageSquare,
  Newspaper,
  Plus,
  Search,
  Settings,
  Sparkles,
  Trophy,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { useCommunityAuth } from "@/contexts/CommunityAuthContext";
import Logo from "@/components/shared/Logo";

interface CommunityLayoutProps {
  children: React.ReactNode;
}

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Hashtag-style channel? (default true for category items, false for shortcuts) */
  channel?: boolean;
};

type NavGroup = {
  label: string;
  items: NavItem[];
  defaultOpen?: boolean;
};

// Sidebar nav grouped Discord-style. Categories prefixed with `#` (channel
// metaphor) so the conversation/feed mental model is obvious at a glance.
const NAV_GROUPS: NavGroup[] = [
  {
    label: "Home",
    defaultOpen: true,
    items: [
      { label: "home",     href: "/community/dashboard",          icon: Home,    channel: false },
      { label: "discover", href: "/community/feed/",              icon: Compass, channel: false },
    ],
  },
  {
    label: "Channels",
    defaultOpen: true,
    items: [
      { label: "ai-news",     href: "/community/dashboard?category=news",      icon: Newspaper },
      { label: "ai-tools",    href: "/community/dashboard?category=tools",     icon: Wrench },
      { label: "prompts",     href: "/community/dashboard?category=prompts",   icon: MessageSquare },
      { label: "daily-hacks", href: "/community/dashboard?category=hacks",     icon: Lightbulb },
      { label: "wins",        href: "/community/dashboard?category=wins",      icon: Trophy },
      { label: "jobs",        href: "/community/dashboard?category=jobs",      icon: Briefcase },
      { label: "workshops",   href: "/community/dashboard?category=workshops", icon: Calendar },
    ],
  },
  {
    label: "Resources",
    defaultOpen: true,
    items: [
      { label: "Members",     href: "/community/members",      icon: Users,    channel: false },
      { label: "Leaderboard", href: "/community/leaderboard",  icon: Trophy,   channel: false },
      { label: "Projects",    href: "/community/projects",     icon: Hammer,   channel: false },
      { label: "Saved",       href: "/community/dashboard?view=saved", icon: Bookmark, channel: false },
    ],
  },
];

const isSameRoute = (currentPath: string, currentSearch: string, href: string) => {
  const [path, search] = href.split("?");
  if (path !== currentPath) return false;
  if (!search) return !currentSearch;
  return currentSearch.replace(/^\?/, "") === search;
};

const initials = (name: string | null | undefined, email: string | null | undefined) => {
  const source = (name || email || "U").trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
};

export const CommunityLayout = ({ children }: CommunityLayoutProps) => {
  const { loading, user, member, isAdmin, signOut } = useCommunityAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [loadingSlow, setLoadingSlow] = useState(false);
  const profileRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login", { replace: true });
    }
  }, [loading, user, navigate]);

  useEffect(() => {
    setMobileOpen(false);
    setProfileOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!loading) {
      setLoadingSlow(false);
      return undefined;
    }
    const timer = window.setTimeout(() => setLoadingSlow(true), 4500);
    return () => window.clearTimeout(timer);
  }, [loading]);

  // Click-outside for profile menu
  useEffect(() => {
    if (!profileOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [profileOpen]);

  const headerTitle = useMemo(() => {
    if (location.pathname === "/community/members") return "Members";
    if (location.pathname === "/community/leaderboard") return "Leaderboard";
    if (location.pathname === "/community/projects") return "Projects";
    if (location.pathname === "/community/jobs") return "Jobs";
    if (location.pathname === "/community/discussions") return "Discussions";
    if (location.pathname === "/community/events") return "Events";
    if (location.pathname === "/community/settings") return "Settings";
    if (location.pathname.startsWith("/community/admin/webinar")) return "Webinar Registrations";
    if (location.pathname.startsWith("/community/admin")) return "Admin";
    if (location.pathname.startsWith("/community/feed")) return "Discover";
    if (location.pathname.startsWith("/community/post")) return "Post";
    if (location.pathname !== "/community/dashboard") return "Community";
    const params = new URLSearchParams(location.search);
    const category = params.get("category");
    const view = params.get("view");
    if (category) return `#${category}`;
    if (view === "saved") return "Saved";
    if (view === "polls") return "Polls";
    if (view === "activity") return "My activity";
    return "Home";
  }, [location.pathname, location.search]);

  const onSignOut = async () => {
    await signOut();
    window.location.assign("/login");
  };

  const handleSearch = (q: string) => {
    const trimmed = q.trim();
    navigate(trimmed ? `/community/dashboard?q=${encodeURIComponent(trimmed)}` : "/community/dashboard");
  };

  if (loading) {
    return (
      <div className="community-theme min-h-screen bg-[#f3f5f8] flex items-center justify-center text-zinc-300">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-zinc-700 border-t-orange-400" />
          <p className="text-sm text-zinc-400">Loading community…</p>
          {loadingSlow ? (
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 rounded-md border border-zinc-700/80 bg-zinc-800/60 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-800"
            >
              Retry
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  if (!user) return null;

  const avatarText = initials(member?.full_name, member?.email);
  const displayName = member?.full_name || member?.email?.split("@")[0] || "Member";

  return (
    <div
      className="community-theme min-h-screen bg-[#f3f5f8] text-zinc-100"
      style={{ fontFamily: `"Fira Sans", Figtree, system-ui, -apple-system, "Segoe UI", sans-serif` }}
    >
      {/* ── Top bar ────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-white/[0.05] bg-[#f3f5f8]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-3 px-3 md:px-4">
          <button
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-zinc-400 transition hover:bg-white hover:text-zinc-100 lg:hidden"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <Link to="/community/dashboard" className="flex items-center gap-2.5" aria-label="ONROL Community home">
            <Logo variant="light" className="h-8 w-auto sm:h-9" />
            <span className="hidden text-[10.5px] font-bold uppercase tracking-[0.18em] text-zinc-500 md:inline">
              · Community
            </span>
          </Link>

          <div className="mx-auto hidden w-full max-w-md md:block">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
              <input
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSearch(searchValue); }}
                placeholder="Search posts, channels, members…"
                className="h-9 w-full rounded-md border border-white/[0.06] bg-white pl-9 pr-3 text-[13px] text-zinc-100 placeholder:text-zinc-500 focus:border-orange-500/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              />
            </label>
          </div>

          <div className="ml-auto flex items-center gap-1.5">
            <Link
              to="/"
              className="hidden h-9 items-center gap-1.5 rounded-md px-2.5 text-[12px] font-medium text-zinc-400 transition hover:bg-white hover:text-zinc-100 md:inline-flex"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>onrol.in</span>
            </Link>

            <button
              className="relative inline-flex h-9 w-9 items-center justify-center rounded-md text-zinc-400 transition hover:bg-white hover:text-zinc-100"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
            </button>

            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen((p) => !p)}
                aria-expanded={profileOpen}
                className="inline-flex items-center gap-2 rounded-md p-1 transition hover:bg-white"
              >
                <div className="relative">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-orange-400 to-violet-500 text-[11px] font-bold text-white">
                    {avatarText}
                  </span>
                  <span aria-hidden className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-[2px] border-[#f3f5f8] bg-emerald-400" />
                </div>
                <ChevronDown className="hidden h-3.5 w-3.5 text-zinc-500 lg:block" />
              </button>
              <AnimatePresence>
                {profileOpen ? (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-[calc(100%+8px)] w-64 overflow-hidden rounded-xl border border-white/[0.06] bg-[#1F2028] shadow-[0_24px_48px_-12px_rgba(0,0,0,0.6)]"
                  >
                    <div className="border-b border-white/[0.06] p-3">
                      <div className="flex items-center gap-2.5">
                        <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-orange-400 to-violet-500 text-[12px] font-bold text-white">
                          {avatarText}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-semibold text-zinc-100">{displayName}</p>
                          <p className="truncate text-[11px] text-zinc-500">{member?.email}</p>
                        </div>
                      </div>
                      {isAdmin ? (
                        <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-orange-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-orange-600">
                          <Sparkles className="h-2.5 w-2.5" />
                          Admin
                        </span>
                      ) : null}
                    </div>
                    <div className="p-1.5">
                      <Link to="/community/settings" className="flex items-center gap-2 rounded-md px-2.5 py-2 text-[13px] text-zinc-300 transition hover:bg-white hover:text-zinc-100">
                        <Settings className="h-3.5 w-3.5 text-zinc-500" />
                        Settings
                      </Link>
                      {isAdmin ? (
                        <Link to="/community/admin/webinar" className="flex items-center gap-2 rounded-md px-2.5 py-2 text-[13px] text-zinc-300 transition hover:bg-white hover:text-zinc-100">
                          <Megaphone className="h-3.5 w-3.5 text-zinc-500" />
                          Webinar registrations
                        </Link>
                      ) : null}
                      <button
                        onClick={onSignOut}
                        className="mt-1 flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-[13px] text-rose-300 transition hover:bg-rose-500/10"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        Sign out
                      </button>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </div>
        </div>
        {/* Mobile search */}
        <div className="border-t border-white/[0.05] px-3 py-2 md:hidden">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
            <input
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSearch(searchValue); }}
              placeholder="Search…"
              className="h-9 w-full rounded-md border border-white/[0.06] bg-white pl-9 pr-3 text-[13px] text-zinc-100 placeholder:text-zinc-500 focus:border-orange-500/60 focus:outline-none"
            />
          </label>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1600px]">
        {/* ── Channel rail (desktop) ─────────────────────────────────── */}
        <ChannelRail
          location={location}
          headerTitle={headerTitle}
          className="hidden lg:flex"
        />

        {/* ── Mobile rail overlay ────────────────────────────────────── */}
        <AnimatePresence>
          {mobileOpen ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 top-[56px] z-30 bg-black/50 lg:hidden"
              onClick={() => setMobileOpen(false)}
            >
              <motion.div
                initial={{ x: -260 }}
                animate={{ x: 0 }}
                exit={{ x: -260 }}
                transition={{ duration: 0.2 }}
                onClick={(e) => e.stopPropagation()}
                className="h-[calc(100vh-56px)] w-[260px] overflow-y-auto border-r border-white/[0.05] bg-[#f3f5f8]"
              >
                <ChannelRail location={location} headerTitle={headerTitle} className="flex" mobile />
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* ── Main panel ─────────────────────────────────────────────── */}
        <main className="min-h-[calc(100vh-56px)] flex-1 bg-[#f3f5f8]">
          {/* Section header — channel-style title bar */}
          <div className="sticky top-[56px] z-20 flex h-12 items-center gap-3 border-b border-white/[0.05] bg-[#f3f5f8]/95 px-4 backdrop-blur-xl md:px-6">
            <Hash className="h-4 w-4 shrink-0 text-zinc-500" />
            <h1 className="truncate text-[14.5px] font-semibold text-zinc-100">
              {headerTitle.replace(/^#/, "")}
            </h1>
          </div>
          <div className="px-4 py-5 pb-24 md:px-6 md:pb-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

// ── Channel rail (extracted so desktop + mobile share one impl) ─────
function ChannelRail({
  location,
  headerTitle,
  className = "",
  mobile = false,
}: {
  location: ReturnType<typeof useLocation>;
  headerTitle: string;
  className?: string;
  mobile?: boolean;
}) {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(
    () => Object.fromEntries(NAV_GROUPS.map((g) => [g.label, g.defaultOpen ?? true])),
  );
  void headerTitle; // reserved for future "you're in #X" indicator

  return (
    <aside
      className={`${className} h-[calc(100vh-56px)] w-[260px] shrink-0 flex-col border-r border-white/[0.05] bg-[#f3f5f8] ${mobile ? "" : "lg:sticky lg:top-[56px]"}`}
    >
      {/* New post button */}
      <div className="border-b border-white/[0.05] p-3">
        <button
          type="button"
          className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-md bg-orange-500 text-[12.5px] font-semibold text-white transition hover:bg-orange-400"
        >
          <Plus className="h-3.5 w-3.5" />
          New post
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-3">
        {NAV_GROUPS.map((group) => {
          const isOpen = openGroups[group.label] ?? true;
          return (
            <div key={group.label} className="mb-3">
              <button
                onClick={() => setOpenGroups((s) => ({ ...s, [group.label]: !isOpen }))}
                className="group flex w-full items-center gap-1 px-2 py-1 text-[10.5px] font-bold uppercase tracking-[0.08em] text-zinc-500 transition hover:text-zinc-300"
              >
                <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? "" : "-rotate-90"}`} />
                {group.label}
              </button>
              <AnimatePresence initial={false}>
                {isOpen ? (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-0.5 space-y-px">
                      {group.items.map((item) => {
                        const active = isSameRoute(location.pathname, location.search, item.href);
                        const isChannel = item.channel !== false;
                        return (
                          <Link
                            key={item.label}
                            to={item.href}
                            className={`group flex items-center gap-1.5 rounded-md px-2 py-[5px] text-[13px] font-medium transition ${
                              active
                                ? "bg-orange-500/15 text-zinc-100"
                                : "text-zinc-400 hover:bg-white hover:text-zinc-100"
                            }`}
                          >
                            {isChannel ? (
                              <Hash className={`h-3.5 w-3.5 shrink-0 ${active ? "text-orange-600" : "text-zinc-500 group-hover:text-zinc-400"}`} />
                            ) : (
                              <item.icon className={`h-3.5 w-3.5 shrink-0 ${active ? "text-orange-600" : "text-zinc-500 group-hover:text-zinc-400"}`} />
                            )}
                            <span className="truncate">{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Bottom — back to onrol.in */}
      <div className="border-t border-white/[0.05] p-2">
        <Link
          to="/"
          className="flex items-center gap-2 rounded-md px-2 py-2 text-[12px] text-zinc-500 transition hover:bg-white hover:text-zinc-200"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to onrol.in
        </Link>
      </div>
    </aside>
  );
}
