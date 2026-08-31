// Mobile-only bottom nav — sits fixed at the viewport bottom on
// public marketing pages (md:hidden, never appears on desktop).
//
// Three thumb-reachable actions: Programs (or current page's primary
// link), Masterclass CTA (the conversion goal), WhatsApp (immediate
// human contact). All targets meet the 44 × 44 px touch-target
// minimum. Respects iOS safe-area-inset-bottom so it never sits under
// the home indicator.
//
// Speed rules: zero images, zero animations on mount, only renders on
// mobile via CSS (`md:hidden`) so desktop never pays the React tree.

import { Link, useLocation } from "react-router-dom";
import { Sparkles, Home, BookOpen, MessageCircle } from "lucide-react";
import { CONTACT_PHONE_DIGITS } from "@/lib/brand";

interface MobileBottomNavProps {
  /** Primary CTA destination — defaults to the home masterclass popup trigger. */
  ctaLabel?: string;
  /** Where the primary CTA navigates. If omitted, fires the global
   *  open-hero-registration event to surface the home modal. */
  ctaHref?: string;
}

export default function MobileBottomNav({
  ctaLabel = "Register Now",
  ctaHref = "/programs/", // all registration CTAs funnel to the programs page
}: MobileBottomNavProps) {
  const { pathname } = useLocation();

  const openMasterclass = () => {
    window.dispatchEvent(new Event("open-hero-registration"));
  };

  // Highlight the matching tab so the user always sees where they are.
  const onHome = pathname === "/" || pathname === "";
  const onPrograms = pathname.startsWith("/programs") || pathname.startsWith("/best-ai-course") || pathname.startsWith("/ai-institute");
  const onBlog = pathname.startsWith("/blog") || pathname.startsWith("/ai-news") || pathname.startsWith("/glossary");

  return (
    <nav
      aria-label="Primary mobile navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.06] bg-[#f3f5f8]/95 backdrop-blur-xl md:hidden"
      // iOS safe area so the nav clears the home indicator.
      style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 0.25rem)" }}
    >
      <div className="mx-auto flex max-w-md items-stretch">
        <Tab to="/" active={onHome} label="Home" Icon={Home} />
        <Tab to="/programs" active={onPrograms} label="Programs" Icon={BookOpen} />

        {/* Centre CTA — primary conversion action. Bigger than tabs. */}
        {ctaHref ? (
          <Link
            to={ctaHref}
            className="-mt-5 mx-2 inline-flex h-[52px] flex-1 items-center justify-center gap-1.5 self-center rounded-full bg-gradient-to-r from-orange-500 to-orange-400 px-4 text-[12px] font-bold uppercase tracking-wider text-[#0B1640]"
          >
            <Sparkles className="h-4 w-4" />
            {ctaLabel}
          </Link>
        ) : (
          <button
            type="button"
            onClick={openMasterclass}
            className="-mt-5 mx-2 inline-flex h-[52px] flex-1 items-center justify-center gap-1.5 self-center rounded-full bg-gradient-to-r from-orange-500 to-orange-400 px-4 text-[12px] font-bold uppercase tracking-wider text-[#0B1640]"
          >
            <Sparkles className="h-4 w-4" />
            {ctaLabel}
          </button>
        )}

        <Tab to="/blog" active={onBlog} label="Read" Icon={BookOpen} />
        <Tab
          href={`https://wa.me/${CONTACT_PHONE_DIGITS}?text=${encodeURIComponent("Hi, I'd like to know more about ONROL")}`}
          label="Chat"
          Icon={MessageCircle}
        />
      </div>
    </nav>
  );
}

interface TabProps {
  to?: string;
  href?: string;
  active?: boolean;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
}

function Tab({ to, href, active, label, Icon }: TabProps) {
  const className =
    `inline-flex h-12 flex-1 flex-col items-center justify-center gap-0.5 text-[10.5px] font-semibold transition ${
      active ? "text-orange-300" : "text-[#0B1640]/85"
    }`;
  if (href) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={className} aria-label={label}>
        <Icon className="h-4 w-4" />
        <span>{label}</span>
      </a>
    );
  }
  return (
    <Link to={to ?? "/"} className={className} aria-label={label}>
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </Link>
  );
}
