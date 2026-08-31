// Design preview — Option A: "Editorial Bootcamp"
// Light/dark alternating sections + serif headlines + colour-coded sections.
//
// Internal-only design preview. SEO is set noindex so Bing/Google don't index
// duplicate-content variants of the homepage (was triggering duplicate-title
// + duplicate-description warnings in Bing Webmaster).
import { Link } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import SEO from "@/components/seo/SEO";

export default function PreviewA() {
  return (
    <div className="min-h-screen pt-20" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      <SEO
        title="ONROL Preview A — Editorial Bootcamp (internal design preview)"
        description="Internal design preview variant A — not indexed."
        path="/preview/a/"
        noindex
      />
      <PreviewBanner letter="A" name="Editorial Bootcamp" />

      {/* SECTION 1 — DARK HERO with serif accent */}
      <section className="relative overflow-hidden bg-[#f3f5f8] py-20 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(70%_55%_at_18%_12%,rgba(59,130,246,0.28),transparent_55%),radial-gradient(60%_45%_at_84%_20%,rgba(236,72,153,0.28),transparent_58%)]" />
        <div className="relative mx-auto max-w-6xl px-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-orange-300">— Cohort 7 enrolling now</p>
          <h1 className="mt-4" style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(48px, 8vw, 96px)", lineHeight: 0.96, letterSpacing: "-0.02em", fontWeight: 800 }}>
            <span className="italic font-light text-orange-200/95">Stop</span> consuming AI.<br />
            <span className="italic font-light text-pink-200/95">Start</span> building with it.
          </h1>
          <p className="mt-6 max-w-2xl text-lg font-light text-slate-200 md:text-xl">
            From scrolling AI tutorials to shipping your first AI product — in under a week.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button className="inline-flex items-center gap-2 rounded-none border-2 border-white bg-white px-6 py-3.5 text-sm font-bold uppercase tracking-wider text-[#f3f5f8] transition hover:bg-cyan-200">
              Begin Free Masterclass <ArrowRight className="h-4 w-4" />
            </button>
            <button className="rounded-none border-2 border-white/40 bg-transparent px-6 py-3.5 text-sm font-bold uppercase tracking-wider text-white transition hover:border-white hover:bg-white/10">
              Browse Cohort 7 Projects
            </button>
          </div>
          {/* GIANT EDITORIAL STATS */}
          <div className="mt-14 grid gap-6 border-t border-white/15 pt-10 sm:grid-cols-3">
            {[
              { v: "100+", l: "builders trained", c: "#22D3EE" },
              { v: "3", l: "live projects per learner", c: "#F59E0B" },
              { v: "5d", l: "zero to first launch", c: "#A78BFA" },
            ].map((s) => (
              <div key={s.l}>
                <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "84px", lineHeight: 0.9, color: s.c, fontWeight: 800, letterSpacing: "-0.04em" }}>{s.v}</div>
                <p className="mt-2 text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 2 — LIGHT, serif manifesto */}
      <section className="bg-[#FAF7F0] py-20 text-[#f3f5f8]">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-orange-600">02 / The thesis</p>
            <h2 className="mt-3" style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(36px, 5vw, 64px)", lineHeight: 1, letterSpacing: "-0.02em", fontWeight: 700 }}>
              Tutorials make consumers.<br /><em className="text-orange-600">We make builders.</em>
            </h2>
          </div>
          <div className="space-y-6 text-lg leading-relaxed text-[#f3f5f8]/80">
            <p>The AI economy doesn't reward people who know prompts. It rewards people who can build, ship, and deploy real solutions to real problems.</p>
            <p className="font-semibold text-[#f3f5f8]">In 3 months you'll launch 3 live projects:</p>
            <ul className="space-y-3">
              {["A backend automation system handling real workflows", "A vibe-coded live website you can show employers", "A fine-tuned personal AI assistant trained on your data"].map((t) => (
                <li key={t} className="flex items-start gap-3">
                  <Check className="mt-1 h-5 w-5 shrink-0 text-orange-600" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* SECTION 3 — DARK with violet accent (Mentors teaser) */}
      <section className="bg-[#f3f5f8] py-20 text-white">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-violet-300">03 / Mentors</p>
          <h2 className="mt-3" style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(36px, 5vw, 64px)", lineHeight: 1, letterSpacing: "-0.02em", fontWeight: 700 }}>
            Practitioners, <em className="text-violet-300">not professors.</em>
          </h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {["Aarav — AI Engineer @ stealth", "Ravi — Founder, automation studio", "Priya — ML lead, ex-Microsoft"].map((m, i) => (
              <article key={m} className="group rounded-xl border border-violet-300/20 bg-gradient-to-b from-[#f3f5f8] to-[#f3f5f8] p-6 transition hover:border-violet-300/55">
                <div className="mb-4 h-32 w-full rounded-lg bg-gradient-to-br from-violet-500/30 to-violet-700/20" />
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-300">Mentor 0{i + 1}</p>
                <p className="mt-1 text-lg font-semibold">{m}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4 — Cream + serif, end-of-page CTA */}
      <section className="bg-[#FAF7F0] py-20 text-[#f3f5f8]">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-emerald-700">— Free seat</p>
          <h2 className="mt-3" style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(36px, 5vw, 64px)", lineHeight: 1, letterSpacing: "-0.02em", fontWeight: 700 }}>
            Reserve your <em className="text-emerald-700">Free Masterclass</em> seat.
          </h2>
          <p className="mt-4 text-base text-[#f3f5f8]/70">90-minute session. AI agents + Vibe coding. No pitch.</p>
          <button className="mt-8 inline-flex items-center gap-2 rounded-none bg-[#f3f5f8] px-8 py-4 text-sm font-bold uppercase tracking-wider text-white transition hover:bg-emerald-700">
            Reserve seat <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      <PreviewFooter />
    </div>
  );
}

export function PreviewBanner({ letter, name }: { letter: string; name: string }) {
  return (
    <div className="fixed left-1/2 top-3 z-[60] -translate-x-1/2 rounded-full border border-white/30 bg-black/70 px-4 py-2 text-xs font-bold text-white shadow-2xl backdrop-blur">
      <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-black text-black">{letter}</span>
      Preview · {name}
      <Link to="/" className="ml-3 text-orange-300 hover:text-orange-200">← back to live</Link>
      <span className="mx-2 text-white/30">|</span>
      <Link to="/preview/a" className="text-white/80 hover:text-white">A</Link>
      <span className="mx-1 text-white/30">·</span>
      <Link to="/preview/b" className="text-white/80 hover:text-white">B</Link>
      <span className="mx-1 text-white/30">·</span>
      <Link to="/preview/c" className="text-white/80 hover:text-white">C</Link>
    </div>
  );
}

export function PreviewFooter() {
  return (
    <div className="border-t border-white/10 bg-black px-6 py-8 text-center text-xs text-white/60">
      This is a design preview only. Compare with <Link to="/" className="underline">live site</Link>, then tell me which to ship.
    </div>
  );
}
