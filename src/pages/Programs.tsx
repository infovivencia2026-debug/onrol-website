import { ArrowRight, Sparkles, Layers, Clock, Layers3, Award } from "lucide-react";
import SEO from "@/components/seo/SEO";
import Footer from "@/components/shared/Footer";
import { Frame, Label, Tick, OrangeButton, Shell } from "@/components/system/grid";

// Programs index — two programs side by side, disciplined hairline grid.
const PROGRAMS = [
  {
    slug: "ai-generalist",
    name: "AI Generalist",
    tagline: "Career Accelerator",
    badge: "Popular",
    Icon: Sparkles,
    lines: [
      "Become job-ready with AI in months, not years.",
      "Build 5 AI systems and a portfolio that gets you hired or freelancing.",
      "Beginner-friendly, live cohort, no coding background needed.",
    ],
    stats: [
      { Icon: Clock, label: "3 Months" },
      { Icon: Layers3, label: "5 AI Systems" },
      { Icon: Award, label: "Certificate" },
    ],
  },
  {
    slug: "ai-architect",
    name: "AI Architect",
    tagline: "Flagship · Advanced",
    badge: "Flagship",
    Icon: Layers,
    lines: [
      "Go beyond tools — design, build, deploy and scale complete AI systems.",
      "6-month course + 6-month practice · 20 modules · 200+ hours.",
      "For professionals, founders, freelancers and AI Generalist graduates.",
    ],
    stats: [
      { Icon: Clock, label: "6 + 6 Months" },
      { Icon: Layers3, label: "20 Modules" },
      { Icon: Award, label: "Certification" },
    ],
  },
];

const Programs = () => {
  return (
    <div className="flex min-h-screen flex-col bg-white text-[#0A0A0A]">
      <SEO
        title="Programs — AI Generalist & AI Architect | ONROL"
        description="Choose your ONROL path: AI Generalist (career accelerator) or AI Architect (flagship advanced program to build & lead complete AI systems)."
        path="/programs/"
        image="https://onrol.in/og/programs.png"
      />

      <section className="flex-1 pb-16 pt-24 md:pt-28">
        <Shell>
          <Frame className="grid md:grid-cols-2">
            {/* Header spans both columns */}
            <div className="border-b border-black/10 px-6 py-9 md:col-span-2 md:px-10 md:py-12">
              <Label>Programs</Label>
              <h1 className="mt-3 font-extrabold leading-[1.04] tracking-[-0.02em]" style={{ fontSize: "clamp(30px, 4.4vw, 52px)" }}>
                Choose your build path.
              </h1>
              <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-black/70">
                Two ways to master AI execution at ONROL. Pick the one that fits where you are today.
              </p>
            </div>

            {PROGRAMS.map((p, i) => (
              <div key={p.slug} className={`flex flex-col px-6 py-8 md:px-10 md:py-10 ${i === 0 ? "border-b border-black/10 md:border-b-0 md:border-r" : ""}`}>
                <div className="flex items-center justify-between gap-3">
                  <span className="grid h-12 w-12 place-items-center border border-black/15 text-[#0A0A0A]">
                    <p.Icon className="h-6 w-6" strokeWidth={2} />
                  </span>
                  <span className="border border-black/15 px-2 py-[3px] text-[10px] font-bold uppercase tracking-[0.12em] text-black/65">{p.badge}</span>
                </div>
                <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.2em] text-black/60">{p.tagline}</p>
                <h2 className="mt-1 text-[28px] font-extrabold tracking-[-0.02em] text-[#0A0A0A] sm:text-[32px]">{p.name}</h2>

                <ul className="mt-5 flex-1 space-y-3">
                  {p.lines.map((l) => (
                    <li key={l} className="flex items-start gap-2.5 text-[14.5px] leading-relaxed text-black/70">
                      <Tick className="mt-[2px]" /><span>{l}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-7 grid grid-cols-3 border border-black/10 text-center">
                  {p.stats.map((s, j) => (
                    <div key={s.label} className={`flex flex-col items-center gap-1.5 px-2 py-3 ${j < 2 ? "border-r border-black/10" : ""}`}>
                      <s.Icon className="h-4 w-4 text-[#f46718]" />
                      <span className="text-[11.5px] font-bold leading-tight text-[#0A0A0A]">{s.label}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-7">
                  <OrangeButton to={`/programs/${p.slug}/`} className="w-full sm:w-auto">
                    Know more <ArrowRight className="h-4 w-4" />
                  </OrangeButton>
                </div>
              </div>
            ))}
          </Frame>
        </Shell>
      </section>
      <Footer />
    </div>
  );
};

export default Programs;
