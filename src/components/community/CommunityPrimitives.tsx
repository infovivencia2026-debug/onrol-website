// Shared, reusable primitives for the Discord-style community surface.
// Centralises the visual vocabulary so every page (dashboard, members,
// leaderboard, jobs, etc.) gets the same avatar / skeleton / empty-state
// treatment without 12 ad-hoc copies.

import { type ReactNode } from "react";
import { type LucideIcon } from "lucide-react";

// ── Avatar ──────────────────────────────────────────────────────────────

type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";
type StatusDot = "online" | "idle" | "dnd" | "offline" | null;

const AVATAR_PX: Record<AvatarSize, { box: string; text: string; dot: string; ring: string }> = {
  xs: { box: "h-6 w-6",   text: "text-[9px]",  dot: "h-1.5 w-1.5",  ring: "border" },
  sm: { box: "h-8 w-8",   text: "text-[11px]", dot: "h-2 w-2",      ring: "border-2" },
  md: { box: "h-10 w-10", text: "text-[13px]", dot: "h-2.5 w-2.5",  ring: "border-2" },
  lg: { box: "h-12 w-12", text: "text-[15px]", dot: "h-3 w-3",      ring: "border-2" },
  xl: { box: "h-16 w-16", text: "text-[20px]", dot: "h-3.5 w-3.5",  ring: "border-2" },
};

const STATUS_BG: Record<Exclude<StatusDot, null>, string> = {
  online:  "bg-emerald-400",
  idle:    "bg-amber-400",
  dnd:     "bg-rose-500",
  offline: "bg-zinc-500",
};

// Deterministic gradient picked from the user's name so each member gets a
// stable color (not random per render) — Discord-style identity at scale.
const GRADIENTS = [
  "from-orange-400 to-violet-500",
  "from-violet-400 to-fuchsia-500",
  "from-fuchsia-400 to-pink-500",
  "from-pink-400 to-rose-500",
  "from-rose-400 to-orange-500",
  "from-amber-400 to-orange-500",
  "from-emerald-400 to-teal-500",
  "from-teal-400 to-orange-500",
  "from-orange-400 to-orange-500",
  "from-orange-400 to-orange-500",
];

function gradientFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return GRADIENTS[hash % GRADIENTS.length];
}

function initials(name: string | null | undefined, email: string | null | undefined): string {
  const source = (name || email || "?").trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

interface CommunityAvatarProps {
  name?: string | null;
  email?: string | null;
  src?: string | null;
  size?: AvatarSize;
  status?: StatusDot;
  /** Border color of the status ring — should match the surface the avatar sits on. */
  ringSurface?: "rail" | "card" | "header";
}

export function CommunityAvatar({
  name,
  email,
  src,
  size = "md",
  status = null,
  ringSurface = "card",
}: CommunityAvatarProps) {
  const dims = AVATAR_PX[size];
  const seed = (name || email || "?").toLowerCase();
  const gradient = gradientFor(seed);
  const ringColor =
    ringSurface === "rail" ? "border-[#f3f5f8]" :
    ringSurface === "header" ? "border-[#f3f5f8]" :
    "border-[#232532]";

  return (
    <div className={`relative shrink-0 ${dims.box}`}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name || email || ""}
          className={`${dims.box} rounded-full object-cover`}
          loading="lazy"
        />
      ) : (
        <span
          className={`grid ${dims.box} place-items-center rounded-full bg-gradient-to-br ${gradient} font-bold text-[#0B1640] ${dims.text}`}
          aria-label={name || email || "Member"}
        >
          {initials(name, email)}
        </span>
      )}
      {status ? (
        <span
          aria-hidden
          className={`absolute -bottom-0 -right-0 rounded-full ${dims.dot} ${dims.ring} ${ringColor} ${STATUS_BG[status]}`}
        />
      ) : null}
    </div>
  );
}

// ── Skeleton ────────────────────────────────────────────────────────────

interface SkeletonProps {
  className?: string;
}

/** Single skeleton primitive — pulses on mount. Compose larger placeholders
 * with a few of these stacked. */
export function Skeleton({ className = "" }: SkeletonProps) {
  return <div className={`animate-pulse rounded bg-white ${className}`} />;
}

/** Common card-shaped skeleton used in lists (members, posts, projects). */
export function SkeletonCard() {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-[#232532] p-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3.5 w-1/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="mt-4 h-3 w-full" />
      <Skeleton className="mt-2 h-3 w-5/6" />
    </div>
  );
}

/** Row-shaped skeleton for tables / leaderboards. */
export function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 rounded-md border border-white/[0.04] bg-[#232532] px-4 py-3">
      <Skeleton className="h-8 w-8 rounded-full" />
      <Skeleton className="h-3 w-1/4" />
      <Skeleton className="ml-auto h-3 w-16" />
    </div>
  );
}

/** Skeleton list helper: render N skeleton cards in the same grid the
 * real content will live in. */
export function SkeletonGrid({ count = 6, variant = "card" as "card" | "row" }) {
  return (
    <div className={variant === "card" ? "grid gap-3 md:grid-cols-2 lg:grid-cols-3" : "space-y-2"}>
      {Array.from({ length: count }).map((_, i) =>
        variant === "card" ? <SkeletonCard key={i} /> : <SkeletonRow key={i} />,
      )}
    </div>
  );
}

// ── Empty state ─────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  body?: string;
  cta?: { label: string; onClick?: () => void; href?: string };
  /** Decorative emoji shown above the title (Discord-style). Optional. */
  emoji?: string;
}

export function EmptyState({ icon: Icon, title, body, cta, emoji }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-white/[0.06] bg-[#232532]/40 px-6 py-14 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-orange-500/10 text-orange-600">
        <Icon className="h-7 w-7" strokeWidth={1.8} />
      </div>
      {emoji ? (
        <p className="mt-4 text-2xl" aria-hidden>{emoji}</p>
      ) : null}
      <h3 className="mt-4 text-[15.5px] font-semibold text-zinc-100">{title}</h3>
      {body ? (
        <p className="mt-1.5 max-w-md text-[13.5px] leading-relaxed text-zinc-400">{body}</p>
      ) : null}
      {cta ? (
        cta.href ? (
          <a
            href={cta.href}
            className="mt-5 inline-flex h-9 items-center gap-1.5 rounded-md bg-orange-500 px-4 text-[12.5px] font-semibold text-white transition hover:bg-orange-400"
          >
            {cta.label}
          </a>
        ) : (
          <button
            type="button"
            onClick={cta.onClick}
            className="mt-5 inline-flex h-9 items-center gap-1.5 rounded-md bg-orange-500 px-4 text-[12.5px] font-semibold text-white transition hover:bg-orange-400"
          >
            {cta.label}
          </button>
        )
      ) : null}
    </div>
  );
}

// ── Page header (sub-section, sits inside CommunityLayout's main panel) ─

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-white/[0.05] pb-4">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-zinc-500">
            {eyebrow}
          </p>
        ) : null}
        <h1
          className="mt-1 truncate text-zinc-100"
          style={{ fontSize: "20px", fontWeight: 700, letterSpacing: "-0.01em" }}
        >
          {title}
        </h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-zinc-400">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}

// ── Surface (universal card wrapper) ────────────────────────────────────

interface SurfaceProps {
  children: ReactNode;
  className?: string;
  /** Add a hover lift effect (use for clickable cards). */
  hover?: boolean;
}

export function Surface({ children, className = "", hover = false }: SurfaceProps) {
  return (
    <div
      className={`rounded-lg border border-white/[0.06] bg-[#232532] ${
        hover ? "transition hover:-translate-y-0.5 hover:border-orange-500/30 hover:shadow-[0_8px_24px_-8px_rgba(255,107,71,0.25)]" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

// ── Badge ───────────────────────────────────────────────────────────────

type BadgeTone = "orange" | "emerald" | "amber" | "rose" | "zinc";

const BADGE_TONES: Record<BadgeTone, string> = {
  orange:  "bg-orange-500/15 text-orange-600 border-orange-500/25",
  emerald: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25",
  amber:   "bg-amber-500/15 text-amber-300 border-amber-500/25",
  rose:    "bg-rose-500/15 text-rose-300 border-rose-500/25",
  zinc:    "bg-white text-zinc-300 border-[#0B1640]/10",
};

interface BadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}

export function Badge({ tone = "zinc", children, className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wider ${BADGE_TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
