// PersonaPage — renders a single /personas/<slug>/ landing page.
// Pulls all content from src/lib/personas.ts. Adding a persona = adding to the
// PERSONAS array + adding the route in App.tsx. No new component needed.

import { useParams, Navigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  Search,
} from "lucide-react";
import Container from "@/components/shared/Container";
import Footer from "@/components/shared/Footer";
import SEO from "@/components/seo/SEO";
import FounderCard from "@/components/shared/FounderCard";
import {
  breadcrumbJsonLd,
  faqJsonLd,
  speakableJsonLd,
} from "@/lib/structuredData";
import { founderJsonLd } from "@/lib/founder";
import { PERSONAS, PERSONAS_BY_SLUG } from "@/lib/personas";

const INTER_STACK = `"Fira Sans", Figtree, system-ui, -apple-system, "Segoe UI", sans-serif`;

const ACCENT_BY_INDEX = [
  "from-orange-400 to-amber-300",
  "from-orange-400 to-orange-300",
  "from-violet-400 to-fuchsia-300",
  "from-emerald-400 to-teal-300",
  "from-rose-400 to-pink-300",
  "from-orange-400 to-orange-300",
];

// 4 evergreen FAQs every persona page should have, in addition to the
// persona-specific Q&A.
const COMMON_FAQS = [
  {
    q: "Is ONROL good for non-coders?",
    a: "Yes — ONROL is purpose-built for non-coders. Every persona track teaches AI tooling, prompting, no-code automation, and vibe coding. Zero programming background required.",
  },
  {
    q: "How long is the ONROL cohort?",
    a: "3 months, intensive. By the end you ship 3 deployable AI projects mapped to your persona. Year-long ONROL Community access included.",
  },
  {
    q: "Is there a free trial?",
    a: "Yes — a 90-minute Free Masterclass that mirrors the cohort format. Test the teaching, the mentors, and the project quality before paying.",
  },
  {
    q: "What's the certification?",
    a: "ONROL issues its own completion certificate. The bigger differentiator is your portfolio of 3 deployed AI projects — that's what gets you hired or earning, not the certificate.",
  },
];

export default function PersonaPage() {
  const { slug } = useParams<{ slug: string }>();
  if (!slug) return <Navigate to="/personas/" replace />;
  const persona = PERSONAS_BY_SLUG[slug];
  if (!persona) return <Navigate to="/personas/" replace />;

  const idx = PERSONAS.findIndex((p) => p.slug === slug);
  const accent = ACCENT_BY_INDEX[idx % ACCENT_BY_INDEX.length];
  const path = `/personas/${slug}/`;
  const url = `https://onrol.in${path}`;

  // Compose SEO copy from the persona data.
  const title = `Best AI Course in India for ${persona.title.split(/[(,]/)[0].trim()} — Built Persona-First | ONROL`;
  const description = `${persona.projectsAtOnrol} ONROL is India's AI Execution School — INR-priced, 3-month intensive, no coding required, free Masterclass.`;

  // Persona-page FAQs = persona's own Q + 4 evergreen.
  const faqs = [
    { q: persona.faqQuestion, a: persona.faqAnswer },
    ...COMMON_FAQS,
  ];

  return (
    <main
      className="min-h-screen bg-white text-[#0A0A0A]"
      style={{ fontFamily: INTER_STACK }}
    >
      <SEO
        title={title}
        description={description}
        path={path}
        image="https://onrol.in/og/default.png"
        jsonLd={[
          breadcrumbJsonLd([
            { name: "Home", href: "/" },
            { name: "Personas", href: "/personas/" },
            { name: persona.title, href: path },
          ]),
          founderJsonLd(),
          speakableJsonLd({ url, cssSelectors: ["h1", "p.lead", ".speakable"] }),
          faqJsonLd(faqs),
        ]}
      />

      {/* HERO */}
      <section className="relative overflow-hidden pb-12 pt-28 md:pb-16 md:pt-32">
        <div
          aria-hidden
          className={`absolute inset-0 -z-10 bg-[radial-gradient(70%_50%_at_18%_15%,rgba(255,107,71,0.16),transparent_60%),radial-gradient(55%_40%_at_85%_25%,rgba(56,189,248,0.10),transparent_65%),linear-gradient(180deg,#ffffff,#ffffff)]`}
        />
        <Container>
          <Link
            to="/personas/"
            className="inline-flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wider text-[#0A0A0A]/55 transition hover:text-orange-600"
          >
            ← All personas
          </Link>

          <div className="mt-6 max-w-4xl">
            <div className="flex items-center gap-3">
              <span
                className={`grid h-14 w-14 place-items-center  bg-gradient-to-br ${accent} text-3xl text-[#f3f5f8]`}
              >
                {persona.emoji}
              </span>
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-orange-600">
                — Persona track
              </p>
            </div>
            <h1
              className="mt-5 text-[#0A0A0A]"
              style={{
                fontSize: "clamp(34px, 5.6vw, 64px)",
                lineHeight: 1.0,
                letterSpacing: "-0.03em",
                fontWeight: 800,
              }}
            >
              AI for{" "}
              <span className="text-orange-400">{persona.title.split(/[(,]/)[0].trim().toLowerCase()}</span>{" "}
              in India.
            </h1>
            <p className="lead mt-5 max-w-3xl text-[16px] leading-relaxed text-[#0A0A0A]/85 md:text-[18px]">
              {persona.projectsAtOnrol}
            </p>
            <p className="mt-4 max-w-3xl text-[14.5px] leading-relaxed text-[#0A0A0A]/55">
              {persona.earnPath}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/programs/"
                className="inline-flex items-center gap-2  bg-[#f46718] px-6 py-3 text-[13.5px] font-bold uppercase tracking-wider text-[#0A0A0A] transition hover:brightness-110"
              >
                <Sparkles className="h-4 w-4" />
                Reserve Free Masterclass
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/programs/ai-generalist/"
                className="inline-flex items-center gap-2  border border-[#0B1640]/12 bg-white/[0.03] px-5 py-3 text-[13px] font-bold uppercase tracking-wider text-[#0A0A0A]/85 transition hover:border-orange-300/40 hover:bg-white/8 hover:text-[#0A0A0A]"
              >
                See full program
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* AI USE-CASES */}
      <section className="bg-white py-14 md:py-20">
        <Container>
          <div className="max-w-3xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-orange-600">
              — How AI is used in your industry
            </p>
            <h2
              className="mt-3 text-[#0A0A0A]"
              style={{
                fontSize: "clamp(28px, 4.4vw, 44px)",
                fontWeight: 800,
                letterSpacing: "-0.025em",
                lineHeight: 1.05,
              }}
            >
              The exact AI workflows {persona.title.split(/[(,]/)[0].trim().toLowerCase()} build at ONROL.
            </h2>
          </div>
          <div className="mt-9 grid gap-3 md:grid-cols-2">
            {persona.aiUseCases.map((uc, i) => (
              <motion.div
                key={uc}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.32, delay: Math.min(i * 0.04, 0.3) }}
                className="flex items-start gap-3  border border-[#0B1640]/10 bg-white p-5"
              >
                <span
                  className={`grid h-9 w-9 shrink-0 place-items-center  bg-gradient-to-br ${accent} text-[#f3f5f8]`}
                >
                  <CheckCircle2 className="h-5 w-5" strokeWidth={2.4} />
                </span>
                <p className="text-[14.5px] leading-relaxed text-[#0A0A0A]/85">{uc}</p>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      {/* WHAT YOU SHIP */}
      <section className="bg-white pb-14 md:pb-20">
        <Container>
          <div className=" border border-[#0B1640]/10 bg-gradient-to-br from-[#3f3f3f] via-[#f3f5f8] to-[#f3f5f8] p-7 md:p-12">
            <div className="grid gap-8 md:grid-cols-[1fr_1.2fr]">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-orange-600">
                  — In 3 months, you ship
                </p>
                <h2
                  className="mt-3 text-[#0A0A0A]"
                  style={{
                    fontSize: "clamp(24px, 3.4vw, 36px)",
                    fontWeight: 800,
                    letterSpacing: "-0.025em",
                    lineHeight: 1.08,
                  }}
                >
                  Your persona-specific deliverables.
                </h2>
                <p className="mt-3 text-[14px] leading-relaxed text-[#0A0A0A]/75">
                  Same 3-month cohort, different project track per persona. You won't share output
                  with engineers if you're a teacher — and vice versa. Each persona gets mentors
                  from their own field.
                </p>
              </div>
              <div className=" border border-[#0B1640]/10 bg-white/60 p-6">
                <Sparkles className="h-6 w-6 text-orange-600" />
                <p className="mt-3 speakable text-[15.5px] leading-relaxed text-slate-100 md:text-[16px]">
                  {persona.projectsAtOnrol}
                </p>
                <div className="mt-5 flex items-center gap-2  border border-emerald-300/30 bg-emerald-500/10 px-4 py-3">
                  <TrendingUp className="h-4 w-4 shrink-0 text-emerald-600" />
                  <p className="text-[13px] text-emerald-100">
                    <span className="font-bold">Earnings path:</span> {persona.earnPath}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* SEARCH HOOKS — what people Google to find this page */}
      <section className="bg-white pb-14 md:pb-20">
        <Container>
          <div className=" border border-[#0B1640]/10 bg-white p-6 md:p-8">
            <div className="flex items-center gap-3">
              <Search className="h-5 w-5 text-orange-600" />
              <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-[#0A0A0A]/75">
                You're in the right place if you searched for
              </p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {persona.searchHooks.map((h) => (
                <span
                  key={h}
                  className="inline-flex items-center rounded-full border border-[#0B1640]/10 bg-white/[0.03] px-3 py-1.5 text-[11.5px] text-[#0A0A0A]/75"
                >
                  &ldquo;{h}&rdquo;
                </span>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* FAQ */}
      <section className="bg-white py-12 md:py-16">
        <Container>
          <div className="max-w-3xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-orange-600">
              — Common questions
            </p>
            <h2
              className="mt-3 text-[#0A0A0A]"
              style={{
                fontSize: "clamp(24px, 3.4vw, 36px)",
                fontWeight: 800,
                letterSpacing: "-0.025em",
                lineHeight: 1.05,
              }}
            >
              Questions {persona.title.split(/[(,]/)[0].trim().toLowerCase()} ask before joining.
            </h2>
          </div>
          <div className="mt-7 space-y-3">
            {faqs.map((f) => (
              <details
                key={f.q}
                className="group  border border-[#0B1640]/10 bg-white p-5 open:border-orange-300/35"
              >
                <summary className="cursor-pointer list-none text-[14.5px] font-bold text-[#0A0A0A] sm:text-[15.5px]">
                  <span className="faq-question">{f.q}</span>
                </summary>
                <p className="faq-answer mt-3 text-[14px] leading-relaxed text-[#0A0A0A]/75">
                  {f.a}
                </p>
              </details>
            ))}
          </div>
        </Container>
      </section>

      {/* FOUNDER */}
      <section className="bg-white py-12 md:py-16">
        <Container>
          <FounderCard variant="light" size="expanded" />
        </Container>
      </section>

      {/* OTHER PERSONAS */}
      <section className="bg-white pb-14 md:pb-20">
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2
              className="text-[#0A0A0A]"
              style={{ fontSize: "clamp(20px, 2.6vw, 26px)", fontWeight: 800, letterSpacing: "-0.02em" }}
            >
              Other personas ONROL serves
            </h2>
            <Link
              to="/personas/"
              className="inline-flex items-center gap-1.5 text-[12.5px] font-bold uppercase tracking-wider text-orange-600 transition hover:text-orange-600"
            >
              All {PERSONAS.length} personas
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {PERSONAS.filter((p) => p.slug !== slug).slice(0, 8).map((p) => (
              <Link
                key={p.slug}
                to={`/personas/${p.slug}/`}
                className="group flex items-center gap-2.5  border border-[#0B1640]/10 bg-white p-3.5 transition hover:border-orange-300/40 hover:bg-white"
              >
                <span className="text-xl">{p.emoji}</span>
                <span className="line-clamp-1 text-[12.5px] font-semibold text-[#0A0A0A]/85 group-hover:text-[#0A0A0A]">
                  {p.title.split(/[(,]/)[0].trim()}
                </span>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* FINAL CTA */}
      <section className="bg-white pb-20 md:pb-28">
        <Container>
          <div className={`relative overflow-hidden  bg-[#f46718] p-8 md:p-12`}>
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
                  Ready to build AI for {persona.title.split(/[(,]/)[0].trim().toLowerCase()}?
                </h2>
                <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-black/75">
                  Free 90-minute Masterclass. AI agents + Vibe coding. No pitch, no recording —
                  live with the same mentors who run the cohort.
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
