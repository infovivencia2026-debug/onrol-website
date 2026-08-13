import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, RotateCcw } from "lucide-react";
import Container from "@/components/shared/Container";
import SEO from "@/components/seo/SEO";
import BreadcrumbTrail from "@/components/seo/BreadcrumbTrail";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/structuredData";
import {
  QUESTIONS,
  DIMENSION_INFO,
  DIMENSIONS,
  scoreQuiz,
  type Dimension,
} from "@/lib/quizData";

const FAQS = [
  {
    q: "How long does the AI Skills Quiz take?",
    a: "12 questions. 3-4 minutes. No login, no email gate — your score appears immediately on the same page.",
  },
  {
    q: "What does the score mean?",
    a: "It's a 0-100 readiness score across five dimensions: prompting, AI tools, automation, build-and-ship ability, and execution mindset. The score maps to one of four bands (Starter, Explorer, Operator, Shipper) and a recommended ONROL track.",
  },
  {
    q: "Do I need any AI experience to take the quiz?",
    a: "No. The quiz is designed for everyone — from people who've never used Claude or ChatGPT, to practitioners already shipping AI products. Honest answers produce a more useful recommendation.",
  },
  {
    q: "Will my answers be saved?",
    a: "No. Everything runs in your browser — nothing is sent to a server, nothing is stored. Refresh the page and start over any time.",
  },
];

export default function AISkillsQuiz() {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const allAnswered = QUESTIONS.every((q) => answers[q.id] !== undefined);
  const result = useMemo(() => (submitted ? scoreQuiz(answers) : null), [submitted, answers]);

  const path = "/tools/ai-skills-quiz/";

  function reset() {
    setAnswers({});
    setSubmitted(false);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <main className="bg-[#f3f5f8] pt-24 text-[#0B1640] md:pt-28">
      <SEO
        title="AI Skills Quiz — Score your AI execution readiness in 4 minutes | ONROL"
        description="Free 12-question AI skills quiz. Get a 0-100 readiness score across prompting, tools, automation, build-and-ship, and mindset. Instant recommendation: AI Generalist or AI Architect track."
        path={path}
        jsonLd={[
          breadcrumbJsonLd([
            { name: "Home", href: "/" },
            { name: "AI Skills Quiz", href: path },
          ]),
          faqJsonLd(FAQS),
        ]}
      />

      {/* Hero */}
      <section className="relative bg-[#f3f5f8] py-12 md:py-16">
        <div aria-hidden className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-orange-500 via-violet-400 to-pink-500" />
        <Container>
          <BreadcrumbTrail crumbs={[{ name: "AI Skills Quiz", href: path }]} variant="dark" />
          <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.3em] text-orange-600">— Free tool</p>
          <h1
            className="mt-3 max-w-4xl"
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "clamp(38px, 6.2vw, 80px)",
              lineHeight: 0.96,
              letterSpacing: "-0.02em",
              fontWeight: 800,
            }}
          >
            How AI-ready are you, <em className="font-light italic text-orange-600/95">honestly?</em>
          </h1>
          <p className="mt-5 max-w-3xl text-lg text-[#0B1640]/75 md:text-xl md:leading-snug">
            12 questions. 4 minutes. A 0-100 score across five dimensions plus a personal track recommendation.
            Nothing saved, nothing emailed — runs entirely in your browser.
          </p>
        </Container>
      </section>

      {/* Quiz / Result */}
      <section className="bg-[#FAF7F0] py-14 text-[#f3f5f8] md:py-20">
        <Container>
          {!submitted ? (
            <div className="mx-auto max-w-3xl">
              <div className="space-y-8">
                {QUESTIONS.map((q, i) => {
                  const selected = answers[q.id];
                  return (
                    <div
                      key={q.id}
                      className="rounded-2xl border border-[#f3f5f8]/12 bg-white p-6 shadow-[0_2px_10px_rgba(10,22,40,0.04)]"
                    >
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-orange-700">
                        Question {i + 1} / {QUESTIONS.length}
                      </p>
                      <h2
                        className="mt-2 text-[#f3f5f8]"
                        style={{
                          fontFamily: "'Playfair Display', Georgia, serif",
                          fontSize: "clamp(20px, 2.6vw, 26px)",
                          lineHeight: 1.18,
                          fontWeight: 700,
                          letterSpacing: "-0.01em",
                        }}
                      >
                        {q.question}
                      </h2>
                      <div className="mt-4 grid gap-2.5">
                        {q.options.map((o, oi) => {
                          const active = selected === oi;
                          return (
                            <button
                              key={oi}
                              type="button"
                              onClick={() =>
                                setAnswers((prev) => ({ ...prev, [q.id]: oi }))
                              }
                              className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-left text-[14.5px] leading-snug transition ${
                                active
                                  ? "border-orange-500 bg-orange-50 text-[#f3f5f8]"
                                  : "border-[#f3f5f8]/15 bg-[#FAF7F0] text-[#f3f5f8]/85 hover:border-[#f3f5f8]/35 hover:bg-white"
                              }`}
                            >
                              <span
                                aria-hidden
                                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                                  active ? "border-orange-600 bg-orange-500" : "border-[#f3f5f8]/30"
                                }`}
                              >
                                {active ? (
                                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                                ) : null}
                              </span>
                              <span>{o.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-10 flex flex-col items-center gap-4">
                <button
                  type="button"
                  disabled={!allAnswered}
                  onClick={() => {
                    setSubmitted(true);
                    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className={`inline-flex items-center gap-2 rounded-xl px-7 py-4 text-sm font-bold uppercase tracking-wider transition ${
                    allAnswered
                      ? "bg-[#f3f5f8] text-[#0B1640] hover:bg-emerald-700"
                      : "cursor-not-allowed bg-[#f3f5f8]/30 text-white/70"
                  }`}
                >
                  See my score <ArrowRight className="h-4 w-4" />
                </button>
                <p className="text-[12px] text-[#f3f5f8]/55">
                  {Object.keys(answers).length} / {QUESTIONS.length} answered · nothing saved or emailed
                </p>
              </div>
            </div>
          ) : (
            <ResultPanel result={result!} onReset={reset} />
          )}
        </Container>
      </section>

      {/* FAQ + CTA */}
      <section className="bg-[#f3f5f8] py-14 md:py-20">
        <Container>
          <div className="mx-auto max-w-3xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-orange-600">— FAQ</p>
            <h2
              className="mt-3 text-[#0B1640]"
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: "clamp(28px, 4vw, 44px)",
                lineHeight: 1.05,
                fontWeight: 700,
                letterSpacing: "-0.02em",
              }}
            >
              About the AI Skills Quiz
            </h2>
            <div className="mt-7 space-y-4">
              {FAQS.map((f) => (
                <details
                  key={f.q}
                  className="group rounded-xl border border-[#0B1640]/10 bg-white px-5 py-4 transition open:border-orange-300/40"
                >
                  <summary className="cursor-pointer list-none text-[15px] font-semibold text-[#0B1640]">
                    {f.q}
                  </summary>
                  <p className="mt-3 text-[14px] leading-relaxed text-[#0B1640]/75">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}

// ── Result panel ──────────────────────────────────────────────────────────
function ResultPanel({
  result,
  onReset,
}: {
  result: ReturnType<typeof scoreQuiz>;
  onReset: () => void;
}) {
  const trackHref = `/programs/${result.recommendedTrack.slug}/`;
  const trackName = result.recommendedTrack.slug === "ai-generalist" ? "AI Generalist" : "AI Architect";

  return (
    <div className="mx-auto max-w-3xl">
      {/* Score banner */}
      <div className="rounded-3xl border border-[#f3f5f8]/12 bg-white p-8 text-center shadow-[0_8px_28px_rgba(10,22,40,0.06)] md:p-12">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-orange-700">
          Your AI Readiness Score
        </p>
        <div
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "clamp(64px, 11vw, 144px)",
            lineHeight: 0.9,
            fontWeight: 800,
            letterSpacing: "-0.04em",
          }}
          className="mt-3 text-[#f3f5f8]"
        >
          {result.total}
          <span className="text-[#f3f5f8]/30 text-[0.42em] font-bold align-top ml-1">/100</span>
        </div>
        <p
          className="mt-3"
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "clamp(22px, 3vw, 32px)",
            fontWeight: 700,
            letterSpacing: "-0.01em",
          }}
        >
          {result.bandLabel}
        </p>
        <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed text-[#f3f5f8]/75 md:text-base">
          {result.bandSummary}
        </p>
      </div>

      {/* Dimensions */}
      <div className="mt-8 rounded-3xl border border-[#f3f5f8]/12 bg-white p-6 md:p-8">
        <h2
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "clamp(22px, 2.8vw, 30px)",
            fontWeight: 700,
            letterSpacing: "-0.01em",
          }}
        >
          Your strengths and gaps
        </h2>
        <p className="mt-2 text-[14px] text-[#f3f5f8]/70">
          Strongest: <strong>{DIMENSION_INFO[result.strongest].label}</strong> · Biggest gap:{" "}
          <strong>{DIMENSION_INFO[result.weakest].label}</strong>
        </p>
        <div className="mt-6 space-y-4">
          {DIMENSIONS.map((dim: Dimension) => {
            const d = result.byDimension[dim];
            const isStrong = dim === result.strongest;
            const isWeak = dim === result.weakest;
            return (
              <div key={dim}>
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-[14px] font-semibold text-[#f3f5f8]">
                    {DIMENSION_INFO[dim].label}
                    {isStrong ? <span className="ml-2 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">Strongest</span> : null}
                    {isWeak ? <span className="ml-2 text-[10px] font-bold uppercase tracking-[0.18em] text-orange-700">Focus here</span> : null}
                  </p>
                  <p className="text-[13px] font-bold tabular-nums text-[#f3f5f8]/70">{d.pct}%</p>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#f3f5f8]/8">
                  <div
                    className={`h-full rounded-full ${isWeak ? "bg-orange-500" : isStrong ? "bg-emerald-500" : "bg-cyan-500"}`}
                    style={{ width: `${d.pct}%` }}
                  />
                </div>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-[#f3f5f8]/60">
                  {DIMENSION_INFO[dim].blurb}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recommendation */}
      <div className="mt-8 rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-50 via-white to-orange-50 p-8 md:p-10">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-700">— Recommended for you</p>
        <h2
          className="mt-2 text-[#f3f5f8]"
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "clamp(26px, 3.6vw, 40px)",
            lineHeight: 1.05,
            fontWeight: 700,
            letterSpacing: "-0.02em",
          }}
        >
          {trackName} track
        </h2>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-[#f3f5f8]/80 md:text-base">
          {result.recommendedTrack.reason}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to={trackHref}
            className="inline-flex items-center gap-2 rounded-xl bg-[#f3f5f8] px-6 py-3.5 text-sm font-bold uppercase tracking-wider text-[#0B1640] transition hover:bg-emerald-700"
          >
            See {trackName} <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/programs/"
            className="inline-flex items-center gap-2 rounded-xl border border-[#f3f5f8]/25 bg-white px-6 py-3.5 text-sm font-bold uppercase tracking-wider text-[#f3f5f8] transition hover:border-[#f3f5f8]/50"
          >
            Free Masterclass
          </Link>
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-3.5 text-sm font-semibold text-[#f3f5f8]/70 transition hover:text-[#f3f5f8]"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Retake
          </button>
        </div>
      </div>
    </div>
  );
}
