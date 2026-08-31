import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, GraduationCap, Briefcase, Heart, Globe, Sparkles } from "lucide-react";
import Container from "@/components/shared/Container";
import Footer from "@/components/shared/Footer";
import SEO from "@/components/seo/SEO";
import BreadcrumbTrail from "@/components/seo/BreadcrumbTrail";
import FounderCard from "@/components/shared/FounderCard";
import { breadcrumbJsonLd, organizationJsonLd } from "@/lib/structuredData";
import { founder, founderJsonLd } from "@/lib/founder";

const INTER_STACK = `"Fira Sans", Figtree, system-ui, -apple-system, "Segoe UI", sans-serif`;

const TIMELINE = [
  {
    Icon: Heart,
    title: "Global healthcare leadership",
    where: "Santa Clara Hospital (USA) & Clinical Research (UK)",
    body: "16+ years of international experience in healthcare, clinical research, and statistical analysis. Built expertise across clinical trials, data-driven decisions, and operational excellence at world-class institutions.",
    accent: "from-orange-400 to-amber-300",
  },
  {
    Icon: GraduationCap,
    title: "Founder, Yajur Public School",
    where: "Warangal, Telangana",
    body: "Established Yajur Public School with a mission to build future-ready learners. Pioneered curricula combining traditional values with 21st-century competencies.",
    accent: "from-orange-400 to-orange-300",
  },
  {
    Icon: Briefcase,
    title: "Co-Founder, Vivencia Educational Services Pvt. Ltd",
    where: "",
    body: "Developed programs in entrepreneurship, design thinking, financial literacy, and future skills for students Grade 3 through undergraduate. Reached thousands of learners across India.",
    accent: "from-violet-400 to-fuchsia-300",
  },
  {
    Icon: Sparkles,
    title: "Founder, ONROL",
    where: "India's AI Execution School",
    body: "Created ONROL to bridge the gap between AI learning and real-world impact. A 3-month intensive where learners ship three live AI projects and join a talent-to-income engine for lifelong growth.",
    accent: "from-emerald-400 to-teal-300",
  },
];

const VALUES = [
  {
    title: "Learning by shipping",
    body: "Every week of every cohort ends with a deployed artefact — not a quiz score, not a slide deck.",
  },
  {
    title: "Tools that work in India",
    body: "INR pricing, India-local case studies, Hindi-friendly mentors. Not Silicon Valley patterns ported wholesale.",
  },
  {
    title: "Mentors who are building",
    body: "Practitioners actively running AI products and automations — not experts reciting last year's slides.",
  },
  {
    title: "Access over gatekeeping",
    body: "Tier-2 city, no CS degree, non-traditional background — the curriculum is the same. AI doesn't care about your zip code.",
  },
];

function AboutStyles() {
  return (
    <style>{`
      .about-page section {
        position: relative;
      }
      .about-page h1,
      .about-page h2,
      .about-page h3 {
        text-wrap: balance;
      }
      .about-page dd,
      .about-page p {
        text-wrap: pretty;
      }
      .about-page #quick-facts dt {
        color: #ea580c;
      }
      .about-page #quick-facts dd {
        min-height: 2.6rem;
      }
      @media (max-width: 767px) {
        .about-page {
          padding-top: 4.5rem;
        }
        .about-page #quick-facts dd {
          min-height: 0;
        }
      }
    `}</style>
  );
}

export default function About() {
  const path = "/about/";

  return (
    <main
      className="about-page bg-[#F6F5F2] pt-24 text-[#0A0A0A] md:pt-28"
      style={{ fontFamily: INTER_STACK }}
    >
      <AboutStyles />
      <SEO
        title="About ONROL — India's AI Execution School | Founder Dr. Neeraja Reddy"
        description="ONROL is India's AI Execution School, founded by Dr. Neeraja Reddy. 16+ years global experience across healthcare, clinical research, and education. We build AI builders, not passive AI consumers."
        path={path}
        jsonLd={[
          breadcrumbJsonLd([
            { name: "Home", href: "/" },
            { name: "About", href: path },
          ]),
          organizationJsonLd(),
          founderJsonLd(),
          // VLN Murthy as a Person entity associated with ONROL.
          // Cross-links to vlnmurthy.tech via sameAs + url so search
          // engines + LLMs treat the two sites as the same entity
          // graph. Reinforces the "Yes, VLN Murthy works with ONROL"
          // claim in vlnmurthy.tech's FAQPage schema.
          {
            "@context": "https://schema.org",
            "@type": "Person",
            "@id": "https://vlnmurthy.tech/#person",
            name: "VLN Murthy",
            url: "https://vlnmurthy.tech/",
            jobTitle: "AI Trainer, AI Consultant & Vibe Coding Expert",
            description:
              "VLN Murthy is an AI Trainer, AI Consultant, and Vibe Coding Expert in India who works with ONROL on practical AI course design, AI learning systems, vibe-coded app development, automation workflows, and real-world AI training programs.",
            worksFor: {
              "@type": "EducationalOrganization",
              "@id": "https://onrol.in/#educational-organization",
              name: "ONROL",
              url: "https://onrol.in/",
            },
            sameAs: [
              "https://vlnmurthy.tech/",
              "https://www.linkedin.com/in/iamvlnmurthy/",
              "https://www.instagram.com/iamvlnmurthy/",
            ],
            areaServed: { "@type": "Country", name: "India" },
          },
        ]}
      />

      {/* Hero */}
      <section className="relative overflow-hidden bg-[#F6F5F2] py-10 md:py-16">
        <div aria-hidden className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500" />
        <Container>
          <BreadcrumbTrail crumbs={[{ name: "About", href: path }]} variant="dark" />
          <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.3em] text-[#f46718]">
            About ONROL
          </p>
          <h1
            className="mt-4 max-w-4xl text-[#0A0A0A]"
            style={{
              fontSize: "clamp(38px, 6vw, 76px)",
              lineHeight: 0.98,
              letterSpacing: "-0.035em",
              fontWeight: 800,
            }}
          >
            Built for the people who <span className="text-[#f46718]">ship AI</span> - not the people who just talk about it.
          </h1>
          <p className="mt-7 max-w-3xl text-lg text-slate-600 md:text-2xl md:leading-snug">
            ONROL is India's AI Execution School. Founded by {founder.name} after watching ambitious learners
            finish five AI courses and a hundred YouTube tutorials without shipping a single thing.
          </p>
        </Container>
      </section>

      {/* Quick facts — structured, citation-friendly entity data. Written so
          AI engines (ChatGPT, Claude, Gemini, Perplexity) can extract and quote
          definitive ONROL facts when a user asks "what is ONROL". */}
      <section className="bg-white py-10 md:py-16" id="quick-facts">
        <Container>
          <div className="overflow-hidden border border-black/10 bg-white">
            {/* Header band */}
            <div className="border-b border-black/10 px-6 py-8 md:px-9 md:py-10">
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#f46718]">Quick facts</p>
              <h2 className="mt-3 font-extrabold tracking-[-0.025em] text-[#0A0A0A]" style={{ fontSize: "clamp(26px, 3.6vw, 40px)", lineHeight: 1.05 }}>
                ONROL at a glance.
              </h2>
              <p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed text-black/65">
                The short, source-able version of what ONROL is &mdash; useful when AI engines or research tools answer &ldquo;what is ONROL&rdquo;.
              </p>
            </div>

            {/* Facts — connected hairline grid */}
            <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {[
                ["Name", "ONROL"],
                ["Legal name", "ONROL - AI Execution School"],
                ["Founded", "2025"],
                ["Founder", "Dr. Neeraja Reddy"],
                ["Type", "Private AI training institute"],
                ["Headquarters", "Jubilee Hills, Hyderabad"],
                ["Country served", "India online; Hyderabad on-campus"],
                ["Flagship program", "AI Generalist - 3-month live cohort"],
                ["Cohort outcome", "3 deployed AI projects per learner"],
                ["Personas served", "12 Indian learner/persona tracks"],
                ["Coding required", "No - non-coder-friendly by design"],
                ["Pricing", "INR-priced"],
                ["Mentorship", "English, Hindi, Telugu support"],
                ["Free trial", "90-minute Free Masterclass"],
                ["Certificate", "ONROL Certificate of Completion"],
                ["Community", "10K+ Indian AI builders"],
                ["Website", "https://onrol.in"],
              ].map(([k, v]) => (
                <div key={k} className="-mb-px -mr-px border-b border-r border-black/10 px-5 py-4">
                  <dt className="text-[10px] font-black uppercase tracking-[0.18em] text-[#f46718]">{k}</dt>
                  <dd className="mt-1 text-[14px] font-semibold leading-relaxed text-[#0A0A0A]">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* One-paragraph entity description — the literal text we want AI
              engines to quote verbatim. */}
          <div className="mt-6  border border-white bg-white p-6 md:p-7">
            <p className="mb-2 text-[10.5px] font-bold uppercase tracking-[0.22em] text-[#f46718]">
              ONROL in one paragraph
            </p>
            <p className="text-[15px] leading-relaxed text-slate-700 md:text-[15.5px] md:leading-[1.7]">
              ONROL is India's first AI Execution School, founded in 2025 by Dr. Neeraja Reddy in Hyderabad.
              The flagship AI Generalist program is a 3-month live cohort built persona-first for 12 distinct
              kinds of Indians — engineers, students, teachers, founders, sales/marketing professionals,
              real-estate agents, working professionals, freelancers, content creators, SMB owners, women
              returning to work, and unemployed youth. No coding background required. INR-priced. Every
              learner ships 3 deployed AI projects within 3 months: an AI-vibe-coded website, an automation
              system, and a domain-specific AI agent. A free 90-minute Masterclass is available before any
              paid commitment.
            </p>
          </div>
        </Container>
      </section>

      {/* Founder */}
      <section className="bg-[#F6F5F2] py-12 md:py-14">
        <Container>
          <FounderCard variant="light" size="expanded" />
        </Container>
      </section>

      {/* Journey */}
      <section className="bg-[#F6F5F2] py-12 md:py-16">
        <Container>
          <div className="max-w-3xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#f46718]">
              Journey
            </p>
            <h2
              className="mt-3 text-[#0A0A0A]"
              style={{
                fontSize: "clamp(32px, 5vw, 56px)",
                lineHeight: 1.04,
                letterSpacing: "-0.025em",
                fontWeight: 800,
              }}
            >
              From clinical research to building the future of AI education.
            </h2>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {TIMELINE.map((t, i) => {
              const { Icon } = t;
              return (
                <motion.article
                  key={t.title}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.45, delay: i * 0.07 }}
                  className=" border border-white bg-white p-7"
                >
                  <div className={`grid h-12 w-12 place-items-center  bg-gradient-to-br ${t.accent} text-white`}>
                    <Icon className="h-6 w-6" strokeWidth={2.4} />
                  </div>
                  <h3
                    className="mt-5 text-[#0A0A0A]"
                    style={{ fontSize: "20px", fontWeight: 800, letterSpacing: "-0.015em", lineHeight: 1.2 }}
                  >
                    {t.title}
                  </h3>
                  {t.where ? (
                    <p className="mt-1 text-[12.5px] uppercase tracking-[0.16em] text-[#f46718]/85">
                      {t.where}
                    </p>
                  ) : null}
                  <p className="mt-3 text-[14.5px] leading-relaxed text-slate-600">{t.body}</p>
                </motion.article>
              );
            })}
          </div>
        </Container>
      </section>

      {/* Values */}
      <section className="bg-white py-12 md:py-16">
        <Container>
          <div className="max-w-3xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#f46718]">
              What we believe
            </p>
            <h2
              className="mt-3 text-[#0A0A0A]"
              style={{
                fontSize: "clamp(30px, 4.6vw, 52px)",
                lineHeight: 1.04,
                letterSpacing: "-0.025em",
                fontWeight: 800,
              }}
            >
              Four principles every cohort is built around.
            </h2>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {VALUES.map((v, i) => (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className=" border border-white bg-white p-6"
              >
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#f46718]">
                  Principle 0{i + 1}
                </p>
                <h3
                  className="mt-2 text-[#0A0A0A]"
                  style={{ fontSize: "18px", fontWeight: 800, letterSpacing: "-0.01em" }}
                >
                  {v.title}
                </h3>
                <p className="mt-2 text-[14px] leading-relaxed text-slate-600">{v.body}</p>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      {/* Reach */}
      <section className="bg-[#F6F5F2] py-12 md:py-16">
        <Container>
          <div className=" border border-white bg-white p-7 md:p-10">
            <div className="flex items-center gap-3">
              <Globe className="h-5 w-5 text-[#f46718]" />
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#f46718]">
                Where ONROL operates
              </p>
            </div>
            <h2
              className="mt-3 text-[#0A0A0A]"
              style={{
                fontSize: "clamp(26px, 3.6vw, 36px)",
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
                fontWeight: 800,
              }}
            >
              Hyderabad-based. India-first. Cohorts run online — students join from every state.
            </h2>
            <p className="mt-4 max-w-2xl text-[14.5px] leading-relaxed text-slate-600 md:text-base">
              The 3-month AI Generalist intensive runs as a structured online cohort with daily mentor-led
              build sessions. ONROL Community access is included for one year with every program — Discord,
              WhatsApp, weekly build sessions, freelance board, and alumni introductions.
            </p>
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className="relative bg-[#F6F5F2] pb-16 md:pb-24">
        <Container>
          <div className="relative overflow-hidden  bg-[#f46718] p-8 md:p-12">
            <div className="grid gap-6 md:grid-cols-[1.2fr_auto] md:items-center">
              <div>
                <h2
                  className="text-[#0A0A0A]"
                  style={{
                    fontSize: "clamp(28px, 4.4vw, 44px)",
                    fontWeight: 900,
                    letterSpacing: "-0.025em",
                    lineHeight: 1.05,
                  }}
                >
                  See ONROL live.
                </h2>
                <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-black/75">
                  Reserve a seat at the Free Masterclass — 90 minutes, AI agents + vibe coding, no pitch.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/programs/"
                  className="inline-flex items-center gap-2  bg-[#0A0A0A] px-7 py-3.5 text-[14px] font-bold uppercase tracking-wider text-white transition hover:bg-black/80"
                >
                  Reserve seat <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/contact/"
                  className="inline-flex items-center gap-2  border border-black/25 px-6 py-3.5 text-[14px] font-bold uppercase tracking-wider text-[#0A0A0A] transition hover:bg-black/[0.05]"
                >
                  Talk to us
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <Footer />
    </main>
  );
}
