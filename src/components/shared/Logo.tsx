// Centralized brand logo component.
//
// Two image variants exist in /public/, each in 3 formats:
//   - onrol-logo-light.{avif,webp,png}  — white wordmark, used on DARK backgrounds (most of the site)
//   - onrol-logo-dark.{avif,webp,png}   — black wordmark, used on LIGHT backgrounds
//
// Both are the FULL official logo: orange checkered icon + ONROL wordmark +
// AI EXECUTION SCHOOL tagline baked in. So no separate tagline chip in the
// navbar / header — the logo carries the brand message.
//
// <picture> serves AVIF (smallest) → WebP (mid) → PNG (universal fallback).
// onError fallback to legacy bundled asset prevents broken-image render
// in the unlikely case all three new files are missing.

import legacyLogo from "@/assets/onrol-logo-home.png";

export type LogoVariant = "light" | "dark";

interface LogoProps {
  variant?: LogoVariant;
  className?: string;
  /** ARIA label shown to screen readers / SEO. Defaults to brand. */
  alt?: string;
  /** Optional click handler (used in mobile drawer to close on tap). */
  onClick?: () => void;
}

export default function Logo({
  variant = "light",
  className = "h-10 w-auto object-contain",
  alt = "ONROL — AI Execution School",
  onClick,
}: LogoProps) {
  const base = variant === "light" ? "/onrol-logo-light" : "/onrol-logo-dark";
  return (
    <picture>
      <source srcSet={`${base}.avif`} type="image/avif" />
      <source srcSet={`${base}.webp`} type="image/webp" />
      <img
        src={`${base}.png`}
        alt={alt}
        className={className}
        onClick={onClick}
        loading="eager"
        decoding="async"
        // Native aspect ratio of the resized brand mark (600 × 160).
        // Explicit width/height kills the CLS shift the browser does
        // while waiting for image bytes — Lighthouse flagged this.
        width={600}
        height={160}
        onError={(e) => {
          const img = e.currentTarget as HTMLImageElement;
          if (!img.dataset.fallback) {
            img.dataset.fallback = "1";
            img.src = legacyLogo;
          }
        }}
      />
    </picture>
  );
}
