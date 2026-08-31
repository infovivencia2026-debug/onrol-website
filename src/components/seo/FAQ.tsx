import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { FaqItem } from "@/lib/structuredData";

interface FAQProps {
  title?: string;
  eyebrow?: string;
  items: FaqItem[];
  /** When true, expands the first FAQ on mount so AI crawlers see the answer. */
  expandFirst?: boolean;
  /** Render variant: "light" for cream sections, "dark" for the existing #f3f5f8 sections. */
  variant?: "light" | "dark";
}

/**
 * Accessible FAQ accordion. Renders the UI ONLY — does NOT emit JSON-LD.
 *
 * The FAQPage schema is now emitted exclusively via the parent layout's SEO
 * component (PillarPageLayout + BlogPostLayout pass faqJsonLd into the
 * jsonLd array). This avoids the GSC "Duplicate field FAQPage" error that
 * appeared when both this component AND the parent layout emitted the same
 * schema.
 */
export default function FAQ({ title = "Frequently asked questions", eyebrow, items, expandFirst = true, variant = "dark" }: FAQProps) {
  const [openIdx, setOpenIdx] = useState<number | null>(expandFirst ? 0 : null);

  // Wave 9 — `variant` is still accepted for back-compat but FAQ now always
  // renders on the dark surface to match the sitewide system.
  void variant;
  return (
    <section
      className="bg-[#f3f5f8] py-16 text-[#0B1640] md:py-24"
      style={{ fontFamily: `"Fira Sans", Figtree, system-ui, -apple-system, "Segoe UI", sans-serif` }}
    >
      <div className="mx-auto max-w-4xl px-6">
        {eyebrow ? (
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-orange-600">{eyebrow}</p>
        ) : null}
        <h2
          className="mt-3 text-[#0B1640]"
          style={{
            fontSize: "clamp(28px, 4vw, 48px)",
            lineHeight: 1.05,
            letterSpacing: "-0.025em",
            fontWeight: 800,
          }}
        >
          {title}
        </h2>
        <ul className="mt-8 space-y-3">
          {items.map((it, idx) => {
            const open = openIdx === idx;
            return (
              <li
                key={it.q}
                className={`rounded-xl border bg-white transition ${
                  open ? "border-orange-300/50" : "border-[#0B1640]/10"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenIdx(open ? null : idx)}
                  aria-expanded={open}
                  className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="text-[15px] font-semibold text-[#0B1640] sm:text-base">{it.q}</span>
                  <ChevronDown
                    className={`mt-1 h-4 w-4 shrink-0 text-orange-600 transition ${open ? "rotate-180" : ""}`}
                  />
                </button>
                {open ? (
                  <div className="px-5 pb-5 text-[14.5px] leading-relaxed text-[#0B1640]/80">
                    {it.a}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
