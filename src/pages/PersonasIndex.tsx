// /personas/ — index page listing all 12 ONROL personas.

import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import Container from "@/components/shared/Container";
import Footer from "@/components/shared/Footer";
import SEO from "@/components/seo/SEO";
import {
  breadcrumbJsonLd,
  speakableJsonLd,
} from "@/lib/structuredData";
import { founderJsonLd } from "@/lib/founder";
import { PERSONAS } from "@/lib/personas";

const INTER_STACK = `"Fira Sans", Figtree, system-ui, -apple-system, "Segoe UI", sans-serif`;

const ACCENT = [
  "from-orange-400 to-amber-300",
  "from-orange-400 to-orange-300",
  "from-violet-400 to-fuchsia-300",
  "from-emerald-400 to-teal-300",
  "from-rose-400 to-pink-300",
  "from-orange-400 to-orange-300",
];

export default function PersonasIndex() {
  const path = "/personas/";
  const url = `https://onrol.in${path}`;

  return (
    <main
      className="min-h-screen bg-white text-[#0A0A0A]"
      style={{ fontFamily: INTER_STACK }}
    >
      <SEO
        title={`AI for Every Indian Persona — 12 Tracks | ONROL`}
        description={`ONROL builds AI for ${PERSONAS.length} kinds of Indians. Engineers, students, teachers, founders, sales/marketing, real-estate, working professionals, freelancers, content creators, SMB owners, women returning to work, job-seekers. Persona-first AI institute. Pick yours.`}
        path={path}
        image="https://onrol.in/og/default.png"
        jsonLd={[
          breadcrumbJsonLd([
            { name: "Home", href: "/" },
            { name: "Personas", href: path },
          ]),
          founderJsonLd(),
          speakableJsonLd({ url, cssSelectors: ["h1", "p.lead"] }),
        ]}
      />

      {/* HERO */}
      <section className="relative overflow-hidden pb-12 pt-28 md:pb-16 md:pt-32">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[radial-gradient(70%_50%_at_18%_15%,rgba(255,107,71,0.16),transparent_60%),radial-gradient(55%_40%_at_85%_25%,rgba(56,189,248,0.10),transparent_65%),linear-gradient(180deg,#f3f5f8,#f3f5f8_55%,#2d2d2d)]"
        />
        <Container>
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-orange-600">
            — {PERSONAS.length} ways to use AI in India
          </p>
          <h1
            className="mt-3 max-w-4xl text-[#0A0A0A]"
            style={{
              fontSize: "clamp(38px, 6.2vw, 76px)",
              lineHeight: 0.98,
              letterSpacing: "-0.035em",
              fontWeight: 800,
            }}
          >
            ONROL is built for{" "}
            <span className="text-orange-400">{PERSONAS.length} kinds of Indians.</span>
          </h1>
          <p className="lead mt-5 max-w-3xl text-[16px] leading-relaxed text-[#0A0A0A]/85 md:text-[18px]">
            Most AI institutes target one persona — usually &ldquo;aspiring data scientist with engineering
            degree&rdquo;. ONROL is the only Indian AI institute built persona-first across {PERSONAS.length}
            distinct personas. Same 3-month cohort, but every persona gets project tracks, mentors,
            and case studies that match their actual industry and life.
          </p>
          <p className="mt-3 max-w-3xl text-[14.5px] leading-relaxed text-[#0A0A0A]/55">
            Pick yours below. Each page shows the exact AI use-cases for your industry, what
            you'll ship in the cohort, and how you can earn from it.
          </p>
        </Container>
      </section>

      {/* GRID */}
      <section className="bg-white pb-20">
        <Container>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {PERSONAS.map((p, i) => {
              const accent = ACCENT[i % ACCENT.length];
              return (
                <motion.div
                  key={p.slug}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{ duration: 0.32, delay: Math.min(i * 0.04, 0.4) }}
                >
                  <Link
                    to={`/personas/${p.slug}/`}
                    className="group flex h-full flex-col overflow-hidden  border border-[#0B1640]/10 bg-white p-6 transition hover:-translate-y-1 hover:border-orange-300/40"
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`grid h-12 w-12 place-items-center  bg-gradient-to-br ${accent} text-2xl text-[#f3f5f8]`}
                      >
                        {p.emoji}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#0A0A0A]/55">
                        {String(i + 1).padStart(2, "0")} / {String(PERSONAS.length).padStart(2, "0")}
                      </span>
                    </div>
                    <h2
                      className="mt-5 text-[#0A0A0A]"
                      style={{
                        fontSize: "17px",
                        fontWeight: 800,
                        letterSpacing: "-0.01em",
                        lineHeight: 1.25,
                      }}
                    >
                      {p.title}
                    </h2>
                    <p className="mt-3 line-clamp-3 text-[13.5px] leading-relaxed text-[#0A0A0A]/75">
                      {p.projectsAtOnrol}
                    </p>
                    <p className="mt-3 line-clamp-2 text-[12.5px] leading-relaxed text-[#0A0A0A]/55">
                      <span className="font-semibold text-emerald-600">Earn:</span> {p.earnPath}
                    </p>
                    <span className="mt-auto pt-5 inline-flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wider text-orange-600 transition group-hover:gap-2.5">
                      Open persona track
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </Container>
      </section>

      {/* FINAL CTA */}
      <section className="bg-white pb-20">
        <Container>
          <div className="relative overflow-hidden  bg-[#f46718] p-8 md:p-12">
            <div className="grid gap-6 md:grid-cols-[1.2fr_auto] md:items-center">
              <div>
                <h2
                  className="text-[#0A0A0A]"
                  style={{
                    fontSize: "clamp(26px, 4vw, 40px)",
                    fontWeight: 900,
                    letterSpacing: "-0.025em",
                    lineHeight: 1.05,
                  }}
                >
                  Pick your persona, then come build.
                </h2>
                <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-black/75">
                  Free 90-minute Masterclass. AI agents + Vibe coding + your persona-specific
                  project preview. Live with the same mentors who run the cohort.
                </p>
              </div>
              <Link
                to="/programs/"
                className="inline-flex items-center gap-2  bg-white px-7 py-3.5 text-[14px] font-bold uppercase tracking-wider text-orange-700 transition hover:bg-orange-50"
              >
                <Sparkles className="h-4 w-4" />
                Reserve seat
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </Container>
      </section>

      <Footer />
    </main>
  );
}
