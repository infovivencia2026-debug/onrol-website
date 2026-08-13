// /founders/dr-neeraja-reddy/ — standalone founder bio page.
// Strong E-E-A-T signal: dedicated URL with full Person schema, credentials,
// proof points, and credibility content for AI engines to cite.

import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, GraduationCap, Sparkles, ShieldCheck, Briefcase } from "lucide-react";
import Container from "@/components/shared/Container";
import Footer from "@/components/shared/Footer";
import SEO from "@/components/seo/SEO";
import FounderCard from "@/components/shared/FounderCard";
import { founder, founderJsonLd } from "@/lib/founder";
import { breadcrumbJsonLd, speakableJsonLd } from "@/lib/structuredData";

const INTER_STACK = `"Fira Sans", Figtree, system-ui, -apple-system, "Segoe UI", sans-serif`;

export default function FounderPage() {
  const path = "/founders/dr-neeraja-reddy/";
  const url = `https://onrol.in${path}`;

  return (
    <main
      className="min-h-screen bg-white text-[#0A0A0A]"
      style={{ fontFamily: INTER_STACK }}
    >
      <SEO
        title={`${founder.name} — ${founder.role} | ONROL India's AI Execution School`}
        description={founder.oneLiner}
        path={path}
        image="https://onrol.in/og/default.png"
        jsonLd={[
          breadcrumbJsonLd([
            { name: "Home", href: "/" },
            { name: founder.name, href: path },
          ]),
          founderJsonLd(),
          speakableJsonLd({ url, cssSelectors: ["h1", "p.lead", ".founder-proof"] }),
        ]}
      />

      {/* HERO */}
      <section className="relative overflow-hidden pb-12 pt-28 md:pb-16 md:pt-32">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[radial-gradient(70%_50%_at_18%_15%,rgba(255,107,71,0.16),transparent_60%),radial-gradient(55%_40%_at_85%_25%,rgba(56,189,248,0.10),transparent_65%),linear-gradient(180deg,#ffffff,#ffffff)]"
        />
        <Container>
          <Link
            to="/about/"
            className="inline-flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wider text-black/55 transition hover:text-[#f46718]"
          >
            ← About ONROL
          </Link>

          <div className="mt-6 max-w-4xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#f46718]">
              — Founder
            </p>
            <h1
              className="mt-3 text-[#0A0A0A]"
              style={{
                fontSize: "clamp(34px, 5.6vw, 64px)",
                lineHeight: 1.0,
                letterSpacing: "-0.03em",
                fontWeight: 800,
              }}
            >
              {founder.name}
            </h1>
            <p
              className="lead mt-5 max-w-3xl text-[16px] leading-relaxed text-black/65 md:text-[18px]"
            >
              {founder.oneLiner}
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              {founder.credentials.map((c) => (
                <span
                  key={c}
                  className="inline-flex items-center gap-1.5 rounded-full border border-orange-300/30 bg-orange-500/10 px-3 py-1.5 text-[11.5px] font-bold uppercase tracking-wider text-[#f46718]"
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {c}
                </span>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* BIO */}
      <section className="bg-white py-12 md:py-16">
        <Container>
          <div className="mx-auto max-w-3xl">
            <h2
              className="text-[#0A0A0A]"
              style={{
                fontSize: "clamp(22px, 3vw, 30px)",
                fontWeight: 800,
                letterSpacing: "-0.02em",
                lineHeight: 1.15,
              }}
            >
              About {founder.shortName}
            </h2>
            <p className="mt-5 text-[15.5px] leading-[1.8] text-black/60 md:text-[16.5px]">
              {founder.bio}
            </p>
          </div>
        </Container>
      </section>

      {/* PROOF POINTS */}
      <section className="bg-white py-12 md:py-16">
        <Container>
          <div className="max-w-3xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#f46718]">
              — Why listen to {founder.shortName}
            </p>
            <h2
              className="mt-3 text-[#0A0A0A]"
              style={{
                fontSize: "clamp(22px, 3vw, 30px)",
                fontWeight: 800,
                letterSpacing: "-0.02em",
                lineHeight: 1.15,
              }}
            >
              Proof points, not promises.
            </h2>
          </div>
          <div className="mt-7 grid gap-3 md:grid-cols-2">
            {founder.proof.map((point, i) => (
              <motion.div
                key={point}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.32, delay: Math.min(i * 0.05, 0.3) }}
                className="founder-proof flex items-start gap-3  border border-black/10 bg-white p-5"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center  bg-gradient-to-br from-orange-500 to-amber-400 text-[#f3f5f8]">
                  <GraduationCap className="h-5 w-5" strokeWidth={2.4} />
                </span>
                <p className="text-[14.5px] leading-relaxed text-black/65">{point}</p>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      {/* PHOTO + CARD */}
      <section className="bg-white py-12 md:py-16">
        <Container>
          <FounderCard variant="light" size="expanded" />
        </Container>
      </section>

      {/* WHY ONROL EXISTS */}
      <section className="bg-white py-12 md:py-16">
        <Container>
          <div className="mx-auto max-w-3xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#f46718]">
              — Why ONROL exists
            </p>
            <h2
              className="mt-3 text-[#0A0A0A]"
              style={{
                fontSize: "clamp(22px, 3vw, 30px)",
                fontWeight: 800,
                letterSpacing: "-0.02em",
                lineHeight: 1.15,
              }}
            >
              The execution gap most Indian AI courses ignore.
            </h2>
            <p className="mt-5 text-[15.5px] leading-relaxed text-black/60">
              Most Indian AI training optimises for completion certificates and theory
              coverage. The market doesn't reward what you know about AI — it rewards what
              you build with it. {founder.shortName} founded ONROL to close that gap: a
              3-month execution-first cohort where every learner — across 12 different
              personas — ships three deployable AI projects.
            </p>
            <p className="mt-4 text-[15.5px] leading-relaxed text-black/60">
              The thesis is simple: shipped portfolios beat completion certificates,
              practitioner mentors beat professors, and a year-long active community beats
              a one-time bootcamp.
            </p>
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className="bg-white py-16 md:py-20">
        <Container>
          <div className="grid gap-4 sm:grid-cols-3">
            <Link
              to="/programs/"
              className="group flex flex-col gap-2  border border-black/10 bg-white p-6 transition hover:-translate-y-1 hover:border-orange-300/40"
            >
              <span className="grid h-10 w-10 place-items-center  bg-orange-500/15 text-[#f46718]">
                <Briefcase className="h-5 w-5" />
              </span>
              <p className="mt-2 text-[16px] font-bold text-[#0A0A0A]">See ONROL Programs</p>
              <p className="text-[13px] text-black/55">3-month Generalist + advanced Architect track.</p>
              <span className="mt-1 inline-flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wider text-[#f46718]">
                Open <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>
            <Link
              to="/personas/"
              className="group flex flex-col gap-2  border border-black/10 bg-white p-6 transition hover:-translate-y-1 hover:border-orange-300/40"
            >
              <span className="grid h-10 w-10 place-items-center  bg-orange-400/15 text-[#f46718]">
                <Sparkles className="h-5 w-5" />
              </span>
              <p className="mt-2 text-[16px] font-bold text-[#0A0A0A]">12 personas served</p>
              <p className="text-[13px] text-black/55">Engineers, students, teachers, founders, and more.</p>
              <span className="mt-1 inline-flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wider text-[#f46718]">
                Open <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>
            <Link
              to="/programs/"
              className="group flex flex-col gap-2  border border-orange-300/40 bg-gradient-to-br from-orange-500/15 to-amber-400/8 p-6 transition hover:-translate-y-1 hover:border-orange-300/60"
            >
              <span className="grid h-10 w-10 place-items-center  bg-orange-500/25 text-[#f46718]">
                <Sparkles className="h-5 w-5" />
              </span>
              <p className="mt-2 text-[16px] font-bold text-[#0A0A0A]">Free Masterclass</p>
              <p className="text-[13px] text-black/60">90 minutes live with the team — test before paying.</p>
              <span className="mt-1 inline-flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wider text-[#f46718]">
                Reserve seat <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          </div>
        </Container>
      </section>

      <Footer />
    </main>
  );
}
