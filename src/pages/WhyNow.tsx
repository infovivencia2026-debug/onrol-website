import { motion } from "framer-motion";
import { ArrowRight, AlertTriangle, TrendingUp, Briefcase, Brain, Rocket } from "lucide-react";
import { Link } from "react-router-dom";
import Container from "@/components/shared/Container";
import SEO from "@/components/seo/SEO";
import BreadcrumbTrail from "@/components/seo/BreadcrumbTrail";
import { breadcrumbJsonLd } from "@/lib/structuredData";

const INTER_STACK = `"Fira Sans", Figtree, system-ui, -apple-system, "Segoe UI", sans-serif`;

const SHIFTS = [
  {
    Icon: Brain,
    title: "Knowledge stopped being the moat",
    body: "Anyone can ask Claude or ChatGPT to explain anything. Knowing things is no longer scarce. Building things with AI is.",
    accent: "from-orange-400 to-orange-300",
  },
  {
    Icon: Briefcase,
    title: "The job market is splitting in two",
    body: "Roles are bifurcating into 'people who can ship with AI' and 'people getting replaced by people who ship with AI.' The middle is collapsing.",
    accent: "from-orange-400 to-amber-300",
  },
  {
    Icon: TrendingUp,
    title: "Salaries follow execution, not theory",
    body: "Indian companies pay 2-3Ã— more for an AI practitioner who can deploy than for a graduate who can describe. The premium for shipping is real.",
    accent: "from-violet-400 to-fuchsia-300",
  },
  {
    Icon: AlertTriangle,
    title: "Tutorials don't compound — projects do",
    body: "The 50th tutorial gives you nothing the 5th didn't. The 1st deployed project changes how every recruiter, client, and stranger sees you.",
    accent: "from-rose-400 to-pink-300",
  },
];

export default function WhyNow() {
  const path = "/why-now/";

  return (
    <main className="bg-white pt-24 text-[#0A0A0A] md:pt-28" style={{ fontFamily: INTER_STACK }}>
      <SEO
        title="Why AI matters now — the 18-month window | ONROL"
        description="Knowledge is no longer the moat. Execution is. Why the next 18 months are the highest-leverage moment to learn applied AI in India — and why ONROL exists to bridge the gap."
        path={path}
        jsonLd={breadcrumbJsonLd([
          { name: "Home", href: "/" },
          { name: "Why this matters now", href: path },
        ])}
      />

      {/* Hero */}
      <section className="relative bg-white py-14 md:py-20">
        <div aria-hidden className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500" />
        <Container>
          <BreadcrumbTrail crumbs={[{ name: "Why this matters now", href: path }]} variant="dark" />
          <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.3em] text-orange-600">
            — The 18-month window
          </p>
          <h1
            className="mt-4 max-w-4xl text-[#0A0A0A]"
            style={{
              fontSize: "clamp(40px, 7vw, 84px)",
              lineHeight: 0.96,
              letterSpacing: "-0.035em",
              fontWeight: 800,
            }}
          >
            AI won't replace you,{" "}
            <span className="text-orange-400">but someone using AI will</span>.
          </h1>
          <p className="mt-7 max-w-3xl text-lg text-[#0A0A0A]/85 md:text-2xl md:leading-snug">
            That sentence isn't a quote on a poster. It's the new market reality.
            And the gap between people who ship with AI and people who don't is widening every quarter.
          </p>
        </Container>
      </section>

      {/* What changed */}
      <section className="bg-white py-16 md:py-24">
        <Container>
          <div className="max-w-3xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-orange-600">
              — What actually changed
            </p>
            <h2
              className="mt-3 text-[#0A0A0A]"
              style={{
                fontSize: "clamp(32px, 5vw, 56px)",
                fontWeight: 800,
                letterSpacing: "-0.025em",
                lineHeight: 1.05,
              }}
            >
              Four shifts happened simultaneously.
            </h2>
            <p className="mt-5 text-[15.5px] leading-relaxed text-[#0A0A0A]/75 md:text-base">
              In the last 24 months, the rules of the knowledge economy got rewritten.
              Most people are still operating like nothing happened.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {SHIFTS.map((s, i) => {
              const { Icon } = s;
              return (
                <motion.article
                  key={s.title}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.45, delay: i * 0.08 }}
                  className=" border border-[#0B1640]/10 bg-white p-7"
                >
                  <div className={`grid h-12 w-12 place-items-center  bg-gradient-to-br ${s.accent} text-[#f3f5f8]`}>
                    <Icon className="h-6 w-6" strokeWidth={2.4} />
                  </div>
                  <h3
                    className="mt-5 text-[#0A0A0A]"
                    style={{
                      fontSize: "20px",
                      fontWeight: 800,
                      letterSpacing: "-0.015em",
                      lineHeight: 1.2,
                    }}
                  >
                    {s.title}
                  </h3>
                  <p className="mt-3 text-[14.5px] leading-relaxed text-[#0A0A0A]/75">{s.body}</p>
                </motion.article>
              );
            })}
          </div>
        </Container>
      </section>

      {/* Why 18 months */}
      <section className="bg-white py-16 md:py-24">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[1fr_1.05fr] lg:items-center">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5 }}
              className="relative overflow-hidden  border border-orange-300/25 bg-gradient-to-br from-[#404040] via-[#404040] to-[#f3f5f8] p-8 md:p-10"
            >
              <p className="relative text-[10px] font-bold uppercase tracking-[0.22em] text-orange-600">
                — Window of leverage
              </p>
              <p
                className="relative mt-3 text-[#0A0A0A]"
                style={{
                  fontFamily: `'Playfair Display', Georgia, serif`,
                  fontSize: "clamp(28px, 4vw, 44px)",
                  fontWeight: 600,
                  letterSpacing: "-0.015em",
                  lineHeight: 1.1,
                }}
              >
                "By 2027, applied AI will be table stakes. Right now, it's still a competitive edge."
              </p>
              <p className="relative mt-5 text-[14px] uppercase tracking-[0.18em] text-[#0A0A0A]/55">
                — Indian software hiring market, late 2026
              </p>
            </motion.div>

            <div className="max-w-xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-amber-300">
                — Why move now
              </p>
              <h2
                className="mt-3 text-[#0A0A0A]"
                style={{
                  fontSize: "clamp(28px, 4.4vw, 48px)",
                  fontWeight: 800,
                  letterSpacing: "-0.025em",
                  lineHeight: 1.05,
                }}
              >
                Early movers compound. Late movers commodify.
              </h2>
              <ul className="mt-6 space-y-4 text-[15px] leading-relaxed text-[#0A0A0A]/75 md:text-base">
                <li className="border-l-2 border-orange-500/70 pl-5">
                  <strong className="text-[#0A0A0A]">2025–2026:</strong> Builders who can ship AI products are <em>scarce</em>. Indian companies are paying premium rates and hiring without a CS degree.
                </li>
                <li className="border-l-2 border-orange-400/60 pl-5">
                  <strong className="text-[#0A0A0A]">2027+:</strong> AI literacy becomes the new Excel. Premium evaporates. The window narrows.
                </li>
                <li className="border-l-2 border-amber-300/70 pl-5">
                  <strong className="text-[#0A0A0A]">Today:</strong> One deployed project beats five courses. The cost of inaction is invisible — until it isn't.
                </li>
              </ul>
            </div>
          </div>
        </Container>
      </section>

      {/* What ONROL does about it */}
      <section className="bg-white py-16 md:py-24">
        <Container>
          <div className="max-w-3xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-orange-600">
              — What ONROL does
            </p>
            <h2
              className="mt-3 text-[#0A0A0A]"
              style={{
                fontSize: "clamp(32px, 5vw, 56px)",
                fontWeight: 800,
                letterSpacing: "-0.025em",
                lineHeight: 1.05,
              }}
            >
              We compress the leap from "curious" to "shipping" into 3 months.
            </h2>
            <p className="mt-5 text-[15.5px] leading-relaxed text-[#0A0A0A]/75 md:text-base">
              ONROL exists because the gap between knowing AI tools and shipping AI products is where most ambitious people get stuck.
              We close that gap with a 3-month intensive that leaves you with three deployable projects and a community that keeps the momentum going.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              { t: "Day 1", b: "Tools mastery + structured prompting" },
              { t: "Day 3", b: "First live automation deployed" },
              { t: "By the end", b: "Three projects on your portfolio" },
            ].map((stage, i) => (
              <div
                key={stage.t}
                className=" border border-[#0B1640]/10 bg-white p-6"
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-orange-600">
                  Stage {String(i + 1).padStart(2, "0")}
                </p>
                <p className="mt-2 text-[16px] font-bold text-[#0A0A0A]">{stage.t}</p>
                <p className="mt-1 text-[14px] text-[#0A0A0A]/75">{stage.b}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Final CTA */}
      <section className="relative bg-white pb-20 md:pb-28">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden  bg-gradient-to-r from-[#FF6B47] via-[#FF7A3D] to-[#FF8A4C] p-8 md:p-12"
          >
            <div className="grid gap-8 md:grid-cols-[1.2fr_auto] md:items-center">
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
                  The window is open. Walk through it.
                </h2>
                <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-black/75 md:text-base">
                  Reserve a seat at the Free Masterclass. Build something live on the call. Decide if ONROL is for you.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => { window.location.href = "/programs/"; }}
                  className="inline-flex items-center gap-2  bg-white px-7 py-3.5 text-[14px] font-bold uppercase tracking-wider text-orange-700 transition hover:bg-orange-50"
                >
                  <Rocket className="h-4 w-4" />
                  Reserve seat <ArrowRight className="h-4 w-4" />
                </button>
                <Link
                  to="/programs/ai-generalist/"
                  className="inline-flex items-center gap-2  border border-white/30 bg-white/10 px-6 py-3.5 text-[14px] font-bold uppercase tracking-wider text-[#0A0A0A] backdrop-blur transition hover:bg-white/20"
                >
                  See AI Generalist
                </Link>
              </div>
            </div>
          </motion.div>
        </Container>
      </section>
    </main>
  );
}
