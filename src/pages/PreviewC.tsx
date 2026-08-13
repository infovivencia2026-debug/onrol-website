// Design preview — Option C: "Brutal Manifesto"
// Y2K/Brutalist — flat blocks, oversized condensed type, no gradients/shadows.
// Black/orange/cream palette. Declarative single statements per section.
//
// Internal-only design preview. noindex set to keep duplicate-content variants
// out of Bing/Google indexes.
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { PreviewBanner, PreviewFooter } from "./PreviewA";
import SEO from "@/components/seo/SEO";

export default function PreviewC() {
  // Bring in the Anton condensed-display font via Google Fonts at the top of
  // the page (no global change — scoped to this preview only).
  return (
    <div className="min-h-screen pt-20 antialiased" style={{ fontFamily: "'Inter Tight', Inter, system-ui, sans-serif" }}>
      <SEO
        title="ONROL Preview C — Brutal Manifesto (internal design preview)"
        description="Internal design preview variant C — not indexed."
        path="/preview/c/"
        noindex
      />
      <link href="https://fonts.googleapis.com/css2?family=Anton&family=Archivo+Black&display=swap" rel="stylesheet" />
      <PreviewBanner letter="C" name="Brutal Manifesto" />

      {/* HERO — orange block, condensed all-caps, no decoration */}
      <section className="bg-[#FF5500] py-24 text-black">
        <div className="mx-auto max-w-6xl px-6">
          <div className="inline-block border-2 border-black bg-black px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-[#FF5500]">
            ★ Cohort 7 enrolling
          </div>
          <h1 className="mt-6 font-black uppercase" style={{ fontFamily: "'Anton', sans-serif", fontSize: "clamp(72px, 14vw, 220px)", lineHeight: 0.82, letterSpacing: "-0.01em" }}>
            STOP<br />
            CONSUMING<br />
            AI.
          </h1>
          <h2 className="mt-2 font-black uppercase text-black/55" style={{ fontFamily: "'Anton', sans-serif", fontSize: "clamp(48px, 10vw, 156px)", lineHeight: 0.84, letterSpacing: "-0.01em" }}>
            START BUILDING.
          </h2>
          <div className="mt-10 max-w-2xl border-t-4 border-black pt-6 text-xl font-semibold uppercase leading-[1.15] tracking-tight">
            From scrolling AI tutorials to shipping your first AI product. <span className="bg-black px-1.5 text-[#FF5500]">3 months.</span>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <button className="inline-flex items-center gap-2 border-4 border-black bg-black px-7 py-4 text-sm font-medium uppercase tracking-wider text-[#FF5500] transition hover:bg-[#FF5500] hover:text-black">
              Begin Free Masterclass <ArrowUpRight className="h-4 w-4" />
            </button>
            <button className="border-4 border-black bg-transparent px-7 py-4 text-sm font-medium uppercase tracking-wider text-black transition hover:bg-black hover:text-[#FF5500]">
              Brochure ↓
            </button>
          </div>
        </div>
      </section>

      {/* STAT BLOCKS — solid colour panels, condensed type */}
      <section className="grid grid-cols-1 sm:grid-cols-3">
        {[
          { v: "100+", l: "BUILDERS TRAINED", bg: "#f3f5f8", fg: "#F5EFE0" },
          { v: "3", l: "LIVE PROJECTS", bg: "#F5EFE0", fg: "#f3f5f8" },
          { v: "5d", l: "ZERO TO LAUNCH", bg: "#FF5500", fg: "#f3f5f8" },
        ].map((s) => (
          <div key={s.l} className="px-8 py-16" style={{ background: s.bg, color: s.fg }}>
            <div className="font-black uppercase" style={{ fontFamily: "'Anton', sans-serif", fontSize: "clamp(96px, 14vw, 200px)", lineHeight: 0.78, letterSpacing: "-0.01em" }}>
              {s.v}
            </div>
            <div className="mt-3 border-t-2 pt-3 text-sm font-medium uppercase tracking-widest" style={{ borderColor: s.fg }}>
              {s.l}
            </div>
          </div>
        ))}
      </section>

      {/* MANIFESTO LINES — black block with declarative statements */}
      <section className="bg-[#f3f5f8] py-24 text-[#F5EFE0]">
        <div className="mx-auto max-w-5xl space-y-8 px-6">
          <div className="inline-block border-2 border-[#F5EFE0] bg-[#F5EFE0] px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-[#f3f5f8]">
            ★ The thesis
          </div>
          {[
            { n: "01", t: "TUTORIALS DON'T BUILD CAREERS.", s: "Building does." },
            { n: "02", t: "THE MARKET DOESN'T PAY FOR PROMPTS.", s: "It pays for shipped products." },
            { n: "03", t: "5 DAYS, 3 LIVE PROJECTS, ONE PORTFOLIO.", s: "Then we put you in front of hiring teams." },
          ].map((m) => (
            <div key={m.n} className="grid grid-cols-[80px_1fr] items-start gap-6 border-b-2 border-[#F5EFE0]/15 pb-8">
              <div className="font-black uppercase text-[#FF5500]" style={{ fontFamily: "'Anton', sans-serif", fontSize: "72px", lineHeight: 0.82 }}>
                {m.n}
              </div>
              <div>
                <p className="font-black uppercase" style={{ fontFamily: "'Anton', sans-serif", fontSize: "clamp(36px, 5vw, 64px)", lineHeight: 0.95, letterSpacing: "-0.005em" }}>
                  {m.t}
                </p>
                <p className="mt-2 text-xl font-semibold uppercase tracking-tight text-[#F5EFE0]/60">{m.s}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA — full-bleed orange */}
      <section className="bg-[#FF5500] py-24 text-black">
        <div className="mx-auto max-w-5xl px-6">
          <p className="text-[11px] font-black uppercase tracking-[0.3em]">★ Reserve your seat</p>
          <h2 className="mt-4 font-black uppercase" style={{ fontFamily: "'Anton', sans-serif", fontSize: "clamp(64px, 12vw, 200px)", lineHeight: 0.82, letterSpacing: "-0.01em" }}>
            FREE<br />
            <span className="bg-black px-3 text-[#FF5500]">MASTERCLASS</span><br />
            THIS FRIDAY.
          </h2>
          <button className="mt-10 inline-flex items-center gap-3 border-4 border-black bg-black px-10 py-5 text-base font-medium uppercase tracking-wider text-[#FF5500] transition hover:bg-[#F5EFE0] hover:text-black">
            Reserve seat <ArrowUpRight className="h-5 w-5" />
          </button>
        </div>
      </section>

      <PreviewFooter />
    </div>
  );
}
