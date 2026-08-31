import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, ArrowRight, ChevronDown } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import Logo from "@/components/shared/Logo";
import { OrangeButton } from "@/components/system/grid";

const LOGIN_URL = "https://learn.onrol.in";

// Left nav — Programs moved to a right-aligned dropdown (outskill-style).
const TOP_LINKS = [
  { label: "Home", to: "/", match: (p: string) => p === "/" },
  { label: "About", to: "/about/", match: (p: string) => p.startsWith("/about") },
  { label: "Contact", to: "/contact/", match: (p: string) => p.startsWith("/contact") },
];

const PROGRAMS = [
  { label: "AI Generalist", to: "/programs/ai-generalist/", tag: "Career Accelerator · 3-month · beginner" },
  { label: "AI Architect", to: "/programs/ai-architect/", tag: "Flagship · 6-month · advanced" },
];

/**
 * ONROL navbar — top edge of the disciplined grid. Solid white, 1px hairline,
 * one sharp orange LOGIN, and a right-aligned PROGRAMS dropdown (hairline
 * flyout, 2 program cells). Orange/white/black.
 */
const Navbar = () => {
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [programsOpen, setProgramsOpen] = useState(false);
  const lastScrollRef = useRef(0);
  const closeTimer = useRef<number | null>(null);
  const onProgramsPage = location.pathname.startsWith("/programs");
  // Navbar is solid white on every page (consistent across the site).
  const transparent = false;

  useEffect(() => {
    if (typeof document === "undefined" || !isMobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [isMobileOpen]);

  useEffect(() => { setIsMobileOpen(false); setProgramsOpen(false); }, [location.pathname]);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setIsVisible(!(y > lastScrollRef.current && y > 120));
      lastScrollRef.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const openPrograms = () => { if (closeTimer.current) window.clearTimeout(closeTimer.current); setProgramsOpen(true); };
  const closePrograms = () => { closeTimer.current = window.setTimeout(() => setProgramsOpen(false), 120); };

  return (
    <>
      <motion.header
        initial={{ y: -90 }}
        animate={{ y: isVisible ? 0 : -90 }}
        transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${transparent ? "bg-transparent" : "border-b border-black/10 bg-white"}`}
      >
        <div className="mx-auto flex h-16 w-full max-w-[1680px] items-center justify-between px-4 sm:h-[72px] sm:px-6 lg:px-10">
          {/* Brand */}
          <Link to="/" className="flex items-center" aria-label="ONROL — AI Execution School">
            <Logo variant={transparent ? "light" : "dark"} className="h-9 w-auto object-contain sm:h-11" />
          </Link>

          {/* Left links */}
          <nav className="hidden items-center gap-1 lg:flex">
            {TOP_LINKS.map((link) => (
              <NavLink key={link.to} to={link.to} label={link.label} active={link.match(location.pathname)} light={transparent} />
            ))}
          </nav>

          {/* Right cluster — Login (plain) + Programs (highlighted, rightmost) */}
          <div className="hidden items-center gap-5 lg:flex">
            <a
              href={LOGIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={`text-[13.5px] font-semibold transition ${transparent ? "text-white/90 hover:text-white" : "text-black/70 hover:text-[#0A0A0A]"}`}
            >
              Login
            </a>

            <div className="relative" onMouseEnter={openPrograms} onMouseLeave={closePrograms}>
              <button
                type="button"
                onClick={() => setProgramsOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={programsOpen}
                className="inline-flex h-11 items-center gap-1.5 bg-[#f46718] px-6 text-[12.5px] font-medium uppercase tracking-wide text-[#0A0A0A] transition hover:bg-[#ff7f33]"
              >
                Programs
                <ChevronDown className={`h-4 w-4 transition-transform ${programsOpen ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {programsOpen ? (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.14 }}
                    role="menu"
                    className="absolute right-0 top-full w-[min(920px,calc(100vw-2rem))] border border-black/10 bg-white shadow-[0_24px_60px_-30px_rgba(10,10,10,0.35)]"
                  >
                    <p className="border-b border-black/10 px-9 py-5 text-[11px] font-bold uppercase tracking-[0.2em] text-[#f46718]">Programs</p>
                    <div className="grid grid-cols-2">
                      {PROGRAMS.map((p, i) => (
                        <Link
                          key={p.to}
                          to={p.to}
                          role="menuitem"
                          className={`group flex flex-col p-9 transition hover:bg-black/[0.02] ${i === 0 ? "border-r border-black/10" : ""}`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-[20px] font-extrabold tracking-[-0.01em] text-[#0A0A0A]">{p.label}</span>
                            <ArrowRight className="h-5 w-5 text-[#f46718] transition-transform group-hover:translate-x-1" />
                          </div>
                          <p className="mt-2.5 text-[13.5px] leading-relaxed text-black/60">{p.tag}</p>
                          <span className="mt-5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#f46718]">Register →</span>
                        </Link>
                      ))}
                    </div>
                    <Link
                      to="/programs/"
                      role="menuitem"
                      className="flex items-center justify-between border-t border-black/10 px-9 py-5 text-[12.5px] font-bold uppercase tracking-[0.14em] text-[#0A0A0A] transition hover:bg-black/[0.02]"
                    >
                      All programs &amp; free masterclass <ArrowRight className="h-4 w-4 text-[#f46718]" />
                    </Link>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </div>

          {/* Mobile toggle */}
          <button
            className={`grid h-11 w-11 place-items-center border lg:hidden ${transparent ? "border-white/40 text-white" : "border-black/15 text-[#0A0A0A]"}`}
            onClick={() => setIsMobileOpen((v) => !v)}
            aria-label={isMobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMobileOpen}
          >
            {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </motion.header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {isMobileOpen ? (
          <motion.div
            key="mobile-drawer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[120] bg-black/40 lg:hidden"
            onClick={() => setIsMobileOpen(false)}
            style={{ height: "100dvh" }}
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 36 }}
              className="ml-auto flex h-full w-full max-w-md flex-col border-l border-black/10 bg-white"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-black/10 px-5 py-4">
                <Link to="/" onClick={() => setIsMobileOpen(false)}>
                  <Logo variant="dark" className="h-9 w-auto" />
                </Link>
                <button type="button" aria-label="Close menu" onClick={() => setIsMobileOpen(false)} className="grid h-10 w-10 place-items-center border border-black/15 text-[#0A0A0A]">
                  <X size={18} />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto py-2">
                {TOP_LINKS.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setIsMobileOpen(false)}
                    className={`block border-b border-black/10 px-5 py-4 text-[15px] font-bold ${link.match(location.pathname) ? "text-[#f46718]" : "text-[#0A0A0A] hover:bg-black/[0.03]"}`}
                  >
                    {link.label}
                  </Link>
                ))}
                {/* Programs group */}
                <div className="border-b border-black/10 px-5 pb-3 pt-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-black/55">Programs</p>
                  {PROGRAMS.map((p) => (
                    <Link key={p.to} to={p.to} onClick={() => setIsMobileOpen(false)} className="mt-3 flex items-center justify-between text-[15px] font-bold text-[#0A0A0A]">
                      {p.label} <ArrowRight className="h-4 w-4 text-[#f46718]" />
                    </Link>
                  ))}
                  <Link to="/programs/" onClick={() => setIsMobileOpen(false)} className="mt-3 block text-[12.5px] font-semibold text-black/60">
                    All programs &amp; free masterclass →
                  </Link>
                </div>
              </nav>

              <div className="border-t border-black/10 p-5">
                <OrangeButton href={LOGIN_URL} className="w-full">
                  Login <ArrowRight className="h-4 w-4" />
                </OrangeButton>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
};

function NavLink({ to, label, active, light = false }: { to: string; label: string; active: boolean; light?: boolean }) {
  const color = light
    ? active ? "text-white" : "text-white/80 hover:text-white"
    : active ? "text-[#0A0A0A]" : "text-black/70 hover:text-[#0A0A0A]";
  return (
    <Link to={to} className={`group relative px-3.5 py-2 text-[13.5px] font-semibold transition ${color}`}>
      {label}
      <span aria-hidden className={`absolute inset-x-3 -bottom-px h-[2px] origin-left bg-[#f46718] transition-transform duration-200 ${active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"}`} />
    </Link>
  );
}

export default Navbar;
