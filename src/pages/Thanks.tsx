import { useMemo } from "react";
import { Link, useLocation, Navigate } from "react-router-dom";
import { ArrowRight, CalendarCheck, BookOpen, Users, Sparkles, MessageCircle, CheckCircle2 } from "lucide-react";
import Container from "@/components/shared/Container";
import SEO from "@/components/seo/SEO";
import { homeData } from "@/lib/homeData";

const INTER_STACK = `"Fira Sans", Figtree, system-ui, -apple-system, "Segoe UI", sans-serif`;

interface IntentConfig {
  eyebrow: string;
  title: string;
  body: string;
  next: { label: string; description: string; href: string; Icon: typeof Sparkles }[];
}

const INTENTS: Record<string, IntentConfig> = {
  masterclass: {
    eyebrow: "Seat reserved",
    title: "Your Free Masterclass seat is confirmed.",
    body: "We've sent the brochure and joining link to your email. Add it to your calendar so you don't miss the live build session.",
    next: [
      { label: "See full AI Generalist program", description: "3 months, 3 projects, full curriculum.", href: "/programs/ai-generalist/", Icon: BookOpen },
      { label: "Read why now matters", description: "The 18-month window argument.", href: "/why-now/", Icon: Sparkles },
      { label: "Try the AI Skills Quiz", description: "Get your personal track recommendation.", href: "/tools/ai-skills-quiz/", Icon: CheckCircle2 },
    ],
  },
  call: {
    eyebrow: "Call requested",
    title: "We'll be in touch within 24 hours.",
    body: "A team member will reach out to schedule your 15-minute discovery call. In the meantime, here's what most people read next.",
    next: [
      { label: "What ONROL learners build", description: "Real projects from past cohorts.", href: "/proof/", Icon: CheckCircle2 },
      { label: "AI Generalist program details", description: "Curriculum + pricing + cohort dates.", href: "/programs/ai-generalist/", Icon: BookOpen },
      { label: "Reserve a Masterclass seat", description: "See the program live before deciding.", href: "/programs/", Icon: CalendarCheck },
    ],
  },
  brochure: {
    eyebrow: "Brochure on its way",
    title: "Check your email — the brochure just landed.",
    body: "If you don't see it in 2 minutes, check spam. While you're here:",
    next: [
      { label: "Reserve a Free Masterclass seat", description: "See ONROL live before you decide.", href: "/programs/", Icon: CalendarCheck },
      { label: "Read the curriculum breakdown", description: "3 months, day-by-day.", href: "/programs/ai-generalist/", Icon: BookOpen },
      { label: "Join the ONROL Community", description: "Discord + WhatsApp + alumni network.", href: "/#community-join", Icon: Users },
    ],
  },
  newsletter: {
    eyebrow: "Subscribed",
    title: "You're in. Practical AI playbooks incoming.",
    body: "We send 1-2 emails a week. Real tactics, no fluff. Unsubscribe anytime.",
    next: [
      { label: "Explore the AI glossary", description: "53 plain-English term definitions.", href: "/glossary/", Icon: BookOpen },
      { label: "Read the latest blog posts", description: "Practical guides for India.", href: "/blog/", Icon: BookOpen },
      { label: "Reserve a Masterclass seat", description: "See ONROL live.", href: "/programs/", Icon: CalendarCheck },
    ],
  },
  contact: {
    eyebrow: "Message received",
    title: "Thanks — we'll respond shortly.",
    body: "We typically reply within one business day. If urgent, message us on WhatsApp.",
    next: [
      { label: "WhatsApp us directly", description: "Get a faster response.", href: homeData.footer.social.whatsapp, Icon: MessageCircle },
      { label: "Reserve a Masterclass seat", description: "See ONROL live before deciding.", href: "/programs/", Icon: CalendarCheck },
      { label: "What ONROL learners build", description: "Real projects from past cohorts.", href: "/proof/", Icon: CheckCircle2 },
    ],
  },
};

export default function Thanks() {
  const location = useLocation();
  const intentSlug = useMemo(
    () => location.pathname.replace(/^\/thanks\//, "").replace(/\/+$/, "") || "masterclass",
    [location.pathname],
  );
  const intent = INTENTS[intentSlug];
  if (!intent) return <Navigate to="/thanks/masterclass" replace />;

  const path = `/thanks/${intentSlug}/`;

  return (
    <main className="bg-[#f3f5f8] pt-24 text-[#0B1640] md:pt-28" style={{ fontFamily: INTER_STACK }}>
      <SEO
        title={`${intent.eyebrow} — ONROL`}
        description={intent.body}
        path={path}
        noindex
      />

      <section className="relative bg-[#f3f5f8] py-14 md:py-20">
        <div aria-hidden className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-orange-400 to-emerald-500" />
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/35 bg-emerald-500/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {intent.eyebrow}
            </span>
            <h1
              className="mt-5 text-[#0B1640]"
              style={{
                fontSize: "clamp(34px, 6vw, 64px)",
                lineHeight: 1.04,
                letterSpacing: "-0.025em",
                fontWeight: 800,
              }}
            >
              {intent.title}
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-[15.5px] leading-relaxed text-[#0B1640]/75 md:text-lg md:leading-snug">
              {intent.body}
            </p>
          </div>
        </Container>
      </section>

      <section className="bg-[#f3f5f8] py-12 md:py-16">
        <Container>
          <p className="mb-6 text-center text-[11px] font-bold uppercase tracking-[0.3em] text-orange-600">
            — Read next
          </p>
          <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-3">
            {intent.next.map((n) => {
              const isExternal = n.href.startsWith("http");
              const inner = (
                <>
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-orange-500/15 text-orange-600">
                    <n.Icon className="h-5 w-5" />
                  </div>
                  <h3
                    className="mt-4 text-[#0B1640]"
                    style={{
                      fontSize: "16px",
                      fontWeight: 700,
                      letterSpacing: "-0.005em",
                      lineHeight: 1.25,
                    }}
                  >
                    {n.label}
                  </h3>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed text-[#0B1640]/75">{n.description}</p>
                  <span className="mt-5 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.18em] text-orange-600">
                    Open <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </>
              );
              return isExternal ? (
                <a
                  key={n.href}
                  href={n.href}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex flex-col rounded-2xl border border-[#0B1640]/10 bg-white p-6 shadow-[0_14px_36px_-26px_rgba(11,22,64,0.22)] transition hover:-translate-y-0.5 hover:border-orange-300/40"
                >
                  {inner}
                </a>
              ) : (
                <Link
                  key={n.href}
                  to={n.href}
                  className="group flex flex-col rounded-2xl border border-[#0B1640]/10 bg-white p-6 shadow-[0_14px_36px_-26px_rgba(11,22,64,0.22)] transition hover:-translate-y-0.5 hover:border-orange-300/40"
                >
                  {inner}
                </Link>
              );
            })}
          </div>

          <div className="mt-10 text-center">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-[13px] font-bold uppercase tracking-[0.16em] text-[#0B1640]/75 transition hover:text-orange-600"
            >
              ← Back to homepage
            </Link>
          </div>
        </Container>
      </section>
    </main>
  );
}
