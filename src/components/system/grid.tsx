import type { ReactNode } from "react";
import { Link } from "react-router-dom";

/**
 * ONROL disciplined design system — shared primitives.
 * Aesthetic: orange (#f46718) + white + black ink (#0A0A0A). Apple/Linear/Swiss
 * hairline grid: 1px black/10 borders, sharp corners, corner "+" crosshairs,
 * plain ALL-CAPS labels. Orange is reserved for ONE primary action + tiny "+"
 * markers/crosshairs. NEVER dark. (Source of truth — every section reuses this.)
 */

export const HAIRLINE = "rgba(10,10,10,0.10)";
export const INK = "#0A0A0A";
export const ORANGE = "#f46718";

/** Shared page width — wide hairline grid (lines near the edges, outskill-style).
 *  Every redesigned section uses this so the vertical rules align top-to-bottom. */
export function Shell({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-[1680px] px-4 sm:px-6 lg:px-10 ${className}`}>{children}</div>;
}

/**
 * The whole-page grid container — ONE pair of continuous vertical hairlines
 * (left + right) running the full page height, like outskill. Sections live
 * inside as connected rows (each ends in a `border-b`), so the outer line is a
 * single unbroken frame, not separate per-section boxes. Wrap the section stack
 * once in Index. Corner crosshairs sit at the very top corners. */
export function Page({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`relative mx-auto w-full max-w-[1680px] border-x border-black/10 ${className}`}>
      {children}
    </div>
  );
}

/** Horizontal padding for content inside a Row (keeps text off the outer lines). */
export const ROW_PAD = "px-5 sm:px-8 lg:px-12";

/** The four corner "+" crosshairs that make the frame read as engineered. */
export function CornerCrosshairs() {
  return (
    <>
      {["-left-[7px] -top-[7px]", "-right-[7px] -top-[7px]", "-bottom-[7px] -left-[7px]", "-bottom-[7px] -right-[7px]"].map((pos) => (
        <span key={pos} aria-hidden className={`pointer-events-none absolute ${pos} select-none text-[14px] leading-none text-black/30`}>+</span>
      ))}
    </>
  );
}

/**
 * Layout passthrough used inside a Row/section. No own border or crosshairs —
 * the continuous outer line comes from <Page> and the row divider from the
 * section's `border-b`. (Kept so existing call-sites keep working; it now just
 * carries grid/layout classes.) */
export function Frame({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`relative ${className}`}>{children}</div>;
}

/** Plain ALL-CAPS structural label — logo-orange (the one place orange shows in
 *  every section header; big headings stay black ink for hierarchy). */
export function Label({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`text-[11px] font-bold uppercase tracking-[0.22em] text-[#f46718] ${className}`}>{children}</p>;
}

/** Orange list/accent marker (decorative). */
export function Tick({ className = "" }: { className?: string }) {
  return <span aria-hidden className={`font-black leading-none text-[#f46718] ${className}`}>+</span>;
}

/**
 * The single sharp orange CTA — black text for AA contrast (~7:1 on #f46718),
 * which also matches the orange/white/black-font palette. Renders as a router
 * Link (`to`), an anchor (`href`, opens new tab), or a button (`onClick`).
 */
type ButtonBase = { children: ReactNode; className?: string };
type ButtonProps =
  | (ButtonBase & { to: string; href?: never; onClick?: never })
  | (ButtonBase & { href: string; to?: never; onClick?: never })
  | (ButtonBase & { onClick: () => void; to?: never; href?: never });

export function OrangeButton(props: ButtonProps) {
  const cls = `inline-flex min-h-[44px] items-center justify-center gap-2 bg-[#f46718] px-5 text-[13px] font-medium uppercase tracking-wide text-[#0A0A0A] transition hover:bg-[#ff7f33] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f46718] ${props.className ?? ""}`;
  if ("to" in props && props.to) return <Link to={props.to} className={cls}>{props.children}</Link>;
  if ("href" in props && props.href) return <a href={props.href} target="_blank" rel="noopener noreferrer" className={cls}>{props.children}</a>;
  return <button type="button" onClick={(props as { onClick: () => void }).onClick} className={cls}>{props.children}</button>;
}
