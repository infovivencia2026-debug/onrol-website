import { useState } from "react";
import { founder } from "@/lib/founder";

interface FounderCardProps {
  variant?: "light" | "dark";
  /** Compact = inline byline; expanded = full proof-list block. */
  size?: "compact" | "expanded";
}

/**
 * Reusable founder credibility block. Drops the photo with auto-fallback to
 * an initials avatar if the file isn't on disk yet.
 *
 * Used at the bottom of every pillar/blog page for E-E-A-T (Google's
 * "experience-expertise-authoritativeness-trust" signal).
 */
export default function FounderCard({ variant = "dark", size = "expanded" }: FounderCardProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const isLight = variant === "light";

  const ring = isLight ? "ring-orange-100" : "ring-white/18";
  const bg = isLight ? "bg-white" : "bg-[#0B1640]";
  const border = isLight ? "border-orange-100" : "border-white/12";
  const ink = isLight ? "text-[#0B1640]" : "text-white";
  const sub = isLight ? "text-slate-600" : "text-white/75";
  const eyebrow = isLight ? "text-orange-600" : "text-orange-300";

  if (size === "compact") {
    // Anchor the compact byline to the founder bio page. Google reads
    // a visible, in-content link to a real author page as the strongest
    // E-E-A-T authorship signal — much stronger than JSON-LD alone.
    return (
      <a
        href="/founders/dr-neeraja-reddy/"
        rel="author"
        className={`group flex items-center gap-3 rounded-xl border ${border} ${bg} px-3 py-2 transition hover:border-orange-300/50`}
      >
        <Avatar imgFailed={imgFailed} setImgFailed={setImgFailed} ring={ring} size={36} />
        <div className="min-w-0">
          <p className={`text-[10px] font-bold uppercase tracking-[0.18em] ${sub}`}>By</p>
          <p className={`text-xs font-bold ${ink} group-hover:underline`}>{founder.name}</p>
          <p className={`-mt-0.5 truncate text-[11px] ${sub}`}>{founder.role}</p>
        </div>
      </a>
    );
  }

  return (
    <section className={`relative overflow-hidden rounded-[30px] border ${border} ${bg} p-6 sm:p-8`}>
      <div aria-hidden className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-orange-500/20 blur-3xl" />
      <div aria-hidden className="absolute -bottom-24 left-1/4 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:gap-6">
        <Avatar imgFailed={imgFailed} setImgFailed={setImgFailed} ring={ring} size={88} />
        <div className="min-w-0 flex-1">
          <p className={`text-[10px] font-bold uppercase tracking-[0.22em] ${eyebrow}`}>Written by</p>
          <h3
            className={`mt-1 ${ink}`}
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "clamp(22px, 3vw, 30px)",
              lineHeight: 1.05,
              letterSpacing: "-0.015em",
              fontWeight: 700,
            }}
          >
            {founder.name}{" "}
            <span className={`text-[15px] font-medium italic ${sub}`}>· {founder.role}</span>
          </h3>
          {founder.credentials && founder.credentials.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {founder.credentials.map((c) => (
                <span
                  key={c}
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                    isLight
                      ? "border border-orange-100 bg-orange-50 text-[#0B1640]"
                      : "border border-white/15 bg-white/10 text-white/80"
                  }`}
                >
                  {c}
                </span>
              ))}
            </div>
          ) : null}
          <p className={`mt-3 text-[14.5px] leading-relaxed ${sub}`}>{founder.bio}</p>
          <ul className={`mt-4 grid gap-1.5 text-[13px] ${sub} sm:grid-cols-2`}>
            {founder.proof.map((p) => (
              <li key={p} className="flex items-start gap-2">
                <span aria-hidden className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${isLight ? "bg-orange-500" : "bg-cyan-300"}`} />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function Avatar({
  imgFailed, setImgFailed, ring, size,
}: { imgFailed: boolean; setImgFailed: (v: boolean) => void; ring: string; size: number }) {
  if (founder.photoPath && !imgFailed) {
    // Generate AVIF/WebP variants from the original path. Optimizer script
    // writes them next to the original (e.g. /founder-neeraja-reddy.avif).
    const baseNoExt = founder.photoPath.replace(/\.(png|jpe?g)$/i, "");
    return (
      <picture>
        <source srcSet={`${baseNoExt}.avif`} type="image/avif" />
        <source srcSet={`${baseNoExt}.webp`} type="image/webp" />
        <img
          src={founder.photoPath}
          alt={`${founder.name} — ${founder.role}`}
          onError={() => setImgFailed(true)}
          loading="lazy"
          width={size}
          height={size}
          className={`shrink-0 rounded-full object-cover ring-4 ${ring}`}
          style={{ width: size, height: size }}
        />
      </picture>
    );
  }
  // Initials fallback — auto-shown until photo is uploaded.
  return (
    <div
      aria-hidden
      className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 via-rose-400 to-pink-400 font-black text-[#0B1640] ring-4 ${ring}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
    >
      {founder.initials}
    </div>
  );
}
