// Design preview — Option B: "Cinematic Dark"
// Stay dark, add depth + giant numbers + per-section accent glow + scroll-snap.
//
// Internal-only design preview. noindex set to keep duplicate-content variants
// out of Bing/Google indexes.
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Zap } from "lucide-react";
import { PreviewBanner, PreviewFooter } from "./PreviewA";
import SEO from "@/components/seo/SEO";

export default function PreviewB() {
  return (
    <div className="min-h-screen pt-20" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      <SEO
        title="ONROL Preview B — Cinematic Dark (internal design preview)"
        description="Internal design preview variant B — not indexed."
        path="/preview/b/"
        noindex
      />
      <PreviewBanner letter="B" name="Cinematic Dark" />

      {/* HERO — black with parallax-style nested glows */}
      <section className="relative flex min-h-[100svh] items-center overflow-hidden bg-black text-white">
        <div className="absolute inset-0">
          <div className="absolute -left-32 top-1/4 h-[600px] w-[600px] rounded-full bg-orange-500/20 blur-[120px]" />
          <div className="absolute -right-32 bottom-1/4 h-[500px] w-[500px] rounded-full bg-violet-500/20 blur-[120px]" />
          <div className="absolute left-1/3 top-1/2 h-[400px] w-[400px] -translate-y-1/2 rounded-full bg-amber-500/10 blur-[140px]" />
          {/* Subtle grid */}
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)", backgroundSize: "64px 64px" }} />
        </div>
        <div className="relative mx-auto w-full max-w-6xl px-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-300/40 bg-orange-500/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-orange-200 backdrop-blur">
            <Sparkles className="h-3 w-3" /> Cohort 7 · live
          </div>
          <h1 className="mt-6 font-black tracking-[-0.04em]" style={{ fontSize: "clamp(56px, 11vw, 168px)", lineHeight: 0.86 }}>
            <span className="bg-gradient-to-r from-white via-orange-100 to-white bg-clip-text text-transparent">Stop consuming.</span><br />
            <span className="bg-gradient-to-r from-orange-300 via-violet-300 to-pink-300 bg-clip-text text-transparent">Start building.</span>
          </h1>
          <p className="mt-8 max-w-xl text-xl text-white/70">
            From scrolling AI tutorials to shipping your first AI product — in under a week.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <button className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-orange-400 via-orange-400 to-violet-400 px-8 py-4 text-sm font-bold text-black shadow-[0_20px_60px_rgba(34,211,238,0.4)] transition hover:scale-[1.02]">
              <Zap className="h-4 w-4" />
              Begin Free Masterclass
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </button>
            <button className="rounded-full border border-white/30 bg-white/5 px-6 py-4 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/10">
              Watch 60-sec demo
            </button>
          </div>
        </div>
      </section>

      {/* GIANT NUMBER section — single stat, full screen */}
      <section className="relative flex min-h-[100svh] items-center overflow-hidden bg-[#f3f5f8] text-white">
        <div className="absolute -left-20 top-1/2 h-[500px] w-[500px] -translate-y-1/2 rounded-full bg-amber-500/20 blur-[160px]" />
        <div className="relative mx-auto w-full max-w-6xl px-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-amber-300">02 / The number that matters</p>
          <div className="mt-6 font-black tracking-[-0.06em] text-amber-200" style={{ fontSize: "clamp(180px, 28vw, 420px)", lineHeight: 0.78 }}>
            5
            <span className="text-amber-200/60">days</span>
          </div>
          <p className="mt-6 max-w-xl text-2xl font-light text-white/80">
            From your first prompt to a live, deployable AI product — typed, styled, hosted, and shareable.
          </p>
        </div>
      </section>

      {/* CINEMATIC PROJECT REVEAL */}
      <section className="relative flex min-h-[100svh] items-center overflow-hidden bg-gradient-to-br from-[#f3f5f8] via-[#f3f5f8] to-[#f3f5f8] text-white">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute right-0 top-0 h-[600px] w-[800px] rounded-full bg-violet-500/40 blur-[160px]" />
        </div>
        <div className="relative mx-auto w-full max-w-6xl px-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-violet-300">03 / Real outputs</p>
          <h2 className="mt-3 font-black tracking-[-0.03em]" style={{ fontSize: "clamp(48px, 8vw, 104px)", lineHeight: 0.92 }}>
            What learners shipped<br />
            <span className="bg-gradient-to-r from-violet-300 to-pink-300 bg-clip-text text-transparent">last cohort.</span>
          </h2>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {[
              { name: "AutoBrief AI", c: "from-orange-500/20 to-orange-700/20", b: "border-orange-300/30" },
              { name: "VoiceClone Studio", c: "from-violet-500/20 to-pink-700/20", b: "border-violet-300/30" },
              { name: "Hindi-RAG Tutor", c: "from-amber-500/20 to-orange-700/20", b: "border-amber-300/30" },
            ].map((p) => (
              <div key={p.name} className={`group relative overflow-hidden rounded-2xl border ${p.b} bg-gradient-to-br ${p.c} aspect-video p-6 backdrop-blur transition hover:scale-[1.02]`}>
                <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.04)_25%,transparent_25%)] bg-[length:8px_8px] opacity-50" />
                <div className="relative flex h-full flex-col justify-end">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/60">Live deploy ↗</p>
                  <p className="mt-1 text-2xl font-bold">{p.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SCROLL-SNAP CTA */}
      <section className="relative flex min-h-[100svh] items-center overflow-hidden bg-black text-white">
        <div className="absolute inset-0">
          <div className="absolute left-1/2 top-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-orange-500/30 via-violet-500/30 to-pink-500/30 blur-[180px]" />
        </div>
        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <h2 className="font-black tracking-[-0.03em]" style={{ fontSize: "clamp(48px, 9vw, 128px)", lineHeight: 0.9 }}>
            <span className="bg-gradient-to-r from-orange-300 via-violet-300 to-pink-300 bg-clip-text text-transparent">Free seat.</span><br />
            One click.
          </h2>
          <button className="mt-12 inline-flex items-center gap-3 rounded-full bg-white px-10 py-5 text-base font-bold uppercase tracking-wider text-black transition hover:scale-[1.02] hover:shadow-[0_0_60px_rgba(255,255,255,0.4)]">
            <Zap className="h-5 w-5" /> Reserve seat <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </section>

      <PreviewFooter />
    </div>
  );
}
