import { FormEvent, useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Download,
  Rocket,
  Sparkles,
  Users,
  ChevronDown,
} from "lucide-react";
import Container from "@/components/shared/Container";
import Footer from "@/components/shared/Footer";
import { ProgramPageData } from "@/lib/programData";
import { submitBrochureRequest } from "@/lib/intake";
import brochurePdf from "@/assets/Onrol Brochure new.pdf";

const INTER_STACK = `"Fira Sans", Figtree, system-ui, -apple-system, "Segoe UI", sans-serif`;

type ProgramPageTemplateProps = { program: ProgramPageData };

const ProgramPageTemplate = ({ program: p }: ProgramPageTemplateProps) => {
  return (
    <main
      className="bg-white pt-24 text-[#0A0A0A] md:pt-28"
      style={{ fontFamily: INTER_STACK }}
    >
      <ProgramHero program={p} />
      <ProgramStatsStrip program={p} />
      <ProgramPositioning program={p} />
      <ProgramOutcomes program={p} />
      <ProgramJourney program={p} />
      <ProgramAudienceFit program={p} />
      <ProgramProofBlock program={p} />
      <ProgramLeadForm program={p} />
      <ProgramPricingBlock program={p} />
      <ProgramFaqs program={p} />
      <ProgramFinalCta program={p} />
      <Footer />
    </main>
  );
};

const triggerBrochureDownload = () => {
  if (typeof window === "undefined") return;
  const link = document.createElement("a");
  link.href = brochurePdf;
  link.download = "Onrol-Brochure.pdf";
  document.body.appendChild(link);
  link.click();
  link.remove();
};

const openMasterclassPopup = () => { window.location.href = "/programs/"; };

function ProgramHero({ program: p }: { program: ProgramPageData }) {
  return (
    <section className="relative overflow-hidden bg-white pb-16 pt-10 md:pb-24 md:pt-14">
      <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(70%_50%_at_18%_15%,rgba(255,107,71,0.18),transparent_60%),radial-gradient(55%_40%_at_85%_25%,rgba(56,189,248,0.10),transparent_65%),linear-gradient(180deg,#ffffff,#ffffff)]" />
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="max-w-3xl"
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-orange-300">
            {p.title} <span className="ml-3 text-black/55">·</span>{" "}
            <span className="ml-2 text-black/55">{p.cohortLabel}</span>
          </p>

          <h1
            className="mt-5 text-[#0A0A0A]"
            style={{
              fontSize: "clamp(36px, 6vw, 76px)",
              lineHeight: 0.98,
              letterSpacing: "-0.035em",
              fontWeight: 800,
            }}
          >
            {p.heroHeadline}
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-relaxed text-black/65 md:text-2xl md:leading-snug">
            {p.heroSubheadline}
          </p>

          <p className="mt-4 max-w-2xl text-[14.5px] leading-relaxed text-black/60 md:text-base">
            {p.heroSupportLine}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={openMasterclassPopup}
              className="inline-flex items-center gap-2  bg-[#f46718] px-7 py-4 text-[14.5px] font-bold text-[#0A0A0A] transition hover:brightness-110"
            >
              <Sparkles className="h-4 w-4" />
              Reserve Free Masterclass
            </button>
            <button
              type="button"
              onClick={triggerBrochureDownload}
              className="inline-flex items-center gap-2  border border-black/15 bg-white px-6 py-4 text-[14px] font-bold uppercase tracking-wider text-[#0A0A0A] backdrop-blur transition hover:border-black/25 hover:bg-black/[0.04]"
            >
              <Download className="h-4 w-4" />
              Download Brochure
            </button>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}

function ProgramStatsStrip({ program: p }: { program: ProgramPageData }) {
  return (
    <section className="bg-white pb-14">
      <Container>
        <div className="grid gap-4  border border-white/12 bg-[#3f3f3f] p-6 sm:grid-cols-2 md:grid-cols-4 md:gap-6 md:p-8">
          {p.stats.map((s, i) => {
            const accents = ["text-orange-300", "text-orange-300", "text-violet-300", "text-emerald-300"];
            return (
              <div key={s.label}>
                <p
                  className={accents[i % accents.length]}
                  style={{
                    fontSize: "clamp(28px, 4.4vw, 44px)",
                    lineHeight: 1,
                    letterSpacing: "-0.04em",
                    fontWeight: 800,
                  }}
                >
                  {s.value}
                </p>
                <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.18em] text-black/55">
                  {s.label}
                </p>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

function ProgramPositioning({ program: p }: { program: ProgramPageData }) {
  return (
    <section className="bg-white py-16 md:py-24">
      <Container>
        <div className="max-w-3xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-orange-300">— Positioning</p>
          <h2
            className="mt-3 text-[#0A0A0A]"
            style={{
              fontSize: "clamp(30px, 4.6vw, 52px)",
              lineHeight: 1.04,
              letterSpacing: "-0.025em",
              fontWeight: 800,
            }}
          >
            {p.positioning.headline}
          </h2>
          <p className="mt-5 text-[15.5px] leading-relaxed text-black/60 md:text-base">
            {p.positioning.body}
          </p>
        </div>

        <div className="mt-8 max-w-3xl border-l-4 border-orange-500 pl-6">
          <p
            className="italic text-black/75"
            style={{
              fontFamily: `'Playfair Display', Georgia, serif`,
              fontSize: "clamp(22px, 2.6vw, 30px)",
              lineHeight: 1.3,
              fontWeight: 500,
            }}
          >
            "{p.positioning.line}"
          </p>
        </div>
      </Container>
    </section>
  );
}

function ProgramOutcomes({ program: p }: { program: ProgramPageData }) {
  const accents = [
    "from-orange-400 to-orange-300",
    "from-violet-400 to-fuchsia-300",
    "from-orange-400 to-amber-300",
    "from-emerald-400 to-teal-300",
  ];
  return (
    <section className="bg-white py-16 md:py-24">
      <Container>
        <div className="max-w-3xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-orange-300">— Outcomes</p>
          <h2
            className="mt-3 text-[#0A0A0A]"
            style={{
              fontSize: "clamp(30px, 4.6vw, 52px)",
              lineHeight: 1.04,
              letterSpacing: "-0.025em",
              fontWeight: 800,
            }}
          >
            {p.outcomesHeading}
          </h2>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {p.outcomes.map((o, i) => (
            <motion.article
              key={o.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.45, delay: i * 0.08 }}
              className=" border border-white/10 bg-[#3f3f3f] p-7"
            >
              <div className={`grid h-12 w-12 place-items-center  bg-gradient-to-br ${accents[i % accents.length]} text-[#f3f5f8]`}>
                <CheckCircle2 className="h-6 w-6" strokeWidth={2.6} />
              </div>
              <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.22em] text-orange-300">
                Output {String(i + 1).padStart(2, "0")}
              </p>
              <h3
                className="mt-1 text-[#0A0A0A]"
                style={{ fontSize: "20px", fontWeight: 800, letterSpacing: "-0.015em" }}
              >
                {o.title}
              </h3>
            </motion.article>
          ))}
        </div>
      </Container>
    </section>
  );
}

function ProgramJourney({ program: p }: { program: ProgramPageData }) {
  return (
    <section className="bg-white py-16 md:py-24">
      <Container>
        <div className="max-w-3xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-orange-300">— Curriculum</p>
          <h2
            className="mt-3 text-[#0A0A0A]"
            style={{
              fontSize: "clamp(30px, 4.6vw, 52px)",
              lineHeight: 1.04,
              letterSpacing: "-0.025em",
              fontWeight: 800,
            }}
          >
            {p.journeyHeading}
          </h2>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.03] px-3 py-1 text-[12px] text-black/60">
            <Clock className="h-3.5 w-3.5 text-[#f46718]" />
            6 hrs/day · 4 hrs learning · 2 hrs building
          </div>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {p.modules.map((m, i) => (
            <motion.article
              key={m.id}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="flex flex-col  border border-white/10 bg-[#3f3f3f] p-5"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-300">
                  {m.id}
                </span>
                <span className="grid h-7 w-7 place-items-center rounded-full border border-white/12 bg-white/5 text-[10px] font-bold text-black/60">
                  0{i + 1}
                </span>
              </div>
              <h3
                className="mt-3 text-[#0A0A0A]"
                style={{ fontSize: "16.5px", fontWeight: 800, letterSpacing: "-0.01em", lineHeight: 1.2 }}
              >
                {m.title}
              </h3>
              <p className="mt-2 text-[13px] leading-relaxed text-black/60/90">{m.description}</p>
              <ul className="mt-4 flex flex-wrap gap-1.5">
                {m.topics.slice(0, 6).map((t) => (
                  <li
                    key={t}
                    className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[10.5px] font-semibold text-black/60"
                  >
                    {t}
                  </li>
                ))}
              </ul>
            </motion.article>
          ))}
        </div>
      </Container>
    </section>
  );
}

function ProgramAudienceFit({ program: p }: { program: ProgramPageData }) {
  return (
    <section className="bg-white py-16 md:py-24">
      <Container>
        <div className="max-w-3xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-orange-300">— Audience fit</p>
          <h2
            className="mt-3 text-[#0A0A0A]"
            style={{
              fontSize: "clamp(30px, 4.6vw, 52px)",
              lineHeight: 1.04,
              letterSpacing: "-0.025em",
              fontWeight: 800,
            }}
          >
            {p.audienceHeading}
          </h2>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {p.audienceFit.map((a, i) => (
            <motion.article
              key={a.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className=" border border-white/10 bg-[#3f3f3f] p-6"
            >
              <div className="grid h-10 w-10 place-items-center  bg-[#f46718]/15 text-orange-300">
                <Users className="h-5 w-5" />
              </div>
              <h3
                className="mt-4 text-[#0A0A0A]"
                style={{ fontSize: "18px", fontWeight: 800, letterSpacing: "-0.015em" }}
              >
                {a.title}
              </h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-black/60/90">{a.description}</p>
            </motion.article>
          ))}
        </div>
      </Container>
    </section>
  );
}

function ProgramProofBlock({ program: p }: { program: ProgramPageData }) {
  return (
    <section className="bg-white py-16 md:py-24">
      <Container>
        <div className="grid gap-8 lg:grid-cols-[1fr_1.05fr] lg:items-center">
          <div className="max-w-xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-orange-300">— Proof</p>
            <h2
              className="mt-3 text-[#0A0A0A]"
              style={{
                fontSize: "clamp(28px, 4.4vw, 44px)",
                lineHeight: 1.04,
                letterSpacing: "-0.025em",
                fontWeight: 800,
              }}
            >
              {p.proofSection.headline}
            </h2>
            <p className="mt-5 text-[15.5px] leading-relaxed text-black/60 md:text-base">
              {p.proofSection.body}
            </p>
            <ul className="mt-6 space-y-3">
              {p.proofSection.bullets.map((b) => (
                <li key={b} className="flex items-start gap-3 text-[14.5px] text-black/65">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  {b}
                </li>
              ))}
            </ul>
          </div>

          <Link
            to={p.pathway.href}
            className="group block  border border-orange-300/25 bg-gradient-to-br from-[#404040] via-[#404040] to-[#f3f5f8] p-8 transition hover:-translate-y-1 hover:border-orange-300/55"
          >
            <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-orange-200">
              {p.pathway.label}
            </span>
            <h3
              className="mt-4 text-[#0A0A0A]"
              style={{ fontSize: "22px", fontWeight: 800, letterSpacing: "-0.015em", lineHeight: 1.2 }}
            >
              {p.pathway.description}
            </h3>
            <span className="mt-5 inline-flex items-center gap-1 text-[12px] font-bold uppercase tracking-[0.18em] text-orange-300 transition group-hover:gap-2">
              Explore the next track <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </Link>
        </div>
      </Container>
    </section>
  );
}

function ProgramLeadForm({ program: p }: { program: ProgramPageData }) {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;
    const form = e.currentTarget;
    const data = new FormData(form);
    const fullName = ((data.get("full_name") as string) || "").trim();
    const phone    = ((data.get("phone")     as string) || "").trim();
    const email    = ((data.get("email")     as string) || "").trim().toLowerCase();
    const role     = ((data.get("role")      as string) || "").trim();
    const city     = ((data.get("city")      as string) || "").trim();
    if (!fullName || !email || !phone) {
      setError("Name, phone, and email are required.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await submitBrochureRequest({
        fullName, phone, email,
        role: role || undefined,
        city: city || undefined,
        source: `program-${p.slug}`,
      });
      navigate("/thanks/call/");
    } catch (err) {
      console.warn("program lead submit failed:", err);
      setError((err as Error)?.message || "Could not save right now — please retry.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="bg-white py-16 md:py-24">
      <Container>
        <div className="grid gap-8  border border-white/12 bg-[#3f3f3f] p-6 md:p-10 lg:grid-cols-[1fr_1.05fr]">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-orange-300">— Apply</p>
            <h2
              className="mt-3 text-[#0A0A0A]"
              style={{
                fontSize: "clamp(28px, 4.2vw, 44px)",
                lineHeight: 1.05,
                letterSpacing: "-0.025em",
                fontWeight: 800,
              }}
            >
              {p.leadFormHeadline}
            </h2>
            <p className="mt-4 text-[14.5px] leading-relaxed text-black/60">
              Submit your details — a team member will reach out with next-batch details, fee structure, and a 15-minute call slot.
            </p>
            <ul className="mt-6 space-y-2 text-[13.5px] text-black/60">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                Reply within 24 hours
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                INR pricing · payment plans available
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                ONROL Community access included
              </li>
            </ul>
          </div>

          <form onSubmit={onSubmit} className="grid gap-3.5 md:grid-cols-2">
            <ProgramField name="full_name" label="Full name *" required />
            <ProgramField name="phone" label="Phone *" type="tel" required />
            <ProgramField name="email" label="Email *" type="email" required />
            <ProgramField name="role" label="Current role" />
            <ProgramField name="city" label="City" />
            <div className="md:col-span-2">
              {error ? (
                <p className="mb-3 text-[13px] font-medium text-rose-300">{error}</p>
              ) : null}
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex h-12 w-full items-center justify-center gap-2  bg-[#f46718] px-6 text-[14px] font-bold uppercase tracking-wider text-[#0A0A0A] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? "Submitting…" : p.primaryCta} <ArrowRight className="h-4 w-4" />
              </button>
              <p className="mt-2 text-center text-[11px] text-slate-500">
                No spam. We respond within 24 hours.
              </p>
            </div>
          </form>
        </div>
      </Container>
    </section>
  );
}

function ProgramField({
  name,
  label,
  type = "text",
  required,
}: { name: string; label: string; type?: string; required?: boolean }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[12px] font-semibold uppercase tracking-wider text-black/55">
        {label}
      </span>
      <input
        type={type}
        name={name}
        required={required}
        className="h-12  border border-white/12 bg-white/[0.03] px-3.5 text-[14px] text-[#0A0A0A] placeholder:text-slate-500 focus:border-orange-400/60 focus:outline-none focus:ring-2 focus:ring-orange-300/20"
      />
    </label>
  );
}

function ProgramPricingBlock({ program: p }: { program: ProgramPageData }) {
  return (
    <section className="bg-white py-16 md:py-24">
      <Container>
        <div className="mx-auto max-w-2xl  border border-orange-300/25 bg-gradient-to-br from-[#404040] via-[#404040] to-[#f3f5f8] p-8 md:p-10">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-orange-300">— Pricing</p>
          <div className="mt-3 flex flex-wrap items-baseline justify-between gap-3">
            <h2
              className="text-[#0A0A0A]"
              style={{ fontSize: "clamp(26px, 3.6vw, 38px)", fontWeight: 800, letterSpacing: "-0.02em" }}
            >
              {p.pricing.label}
            </h2>
            <span className="text-[12px] uppercase tracking-[0.18em] text-black/55">
              {p.pricing.duration}
            </span>
          </div>
          <p className="mt-3 text-[15px] text-black/65">{p.pricing.fee}</p>
          <ul className="mt-6 grid gap-2 sm:grid-cols-2">
            {p.pricing.inclusions.map((item) => (
              <li
                key={item}
                className="flex items-start gap-2  border border-white/10 bg-white/[0.03] px-3 py-2 text-[13px] text-black/65"
              >
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-5 text-[13px] text-black/55">{p.pricing.supportLine}</p>
          <button
            type="button"
            onClick={openMasterclassPopup}
            className="mt-7 inline-flex items-center gap-2  bg-[#f46718] px-6 py-3.5 text-[14px] font-bold text-[#0A0A0A] transition hover:brightness-110"
          >
            {p.pricing.cta} <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </Container>
    </section>
  );
}

function ProgramFaqs({ program: p }: { program: ProgramPageData }) {
  return (
    <section className="bg-white py-16 md:py-24">
      <Container>
        <div className="mx-auto max-w-3xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-orange-300">— FAQ</p>
          <h2
            className="mt-3 text-[#0A0A0A]"
            style={{
              fontSize: "clamp(28px, 4.2vw, 44px)",
              lineHeight: 1.05,
              letterSpacing: "-0.025em",
              fontWeight: 800,
            }}
          >
            Common questions about {p.title}
          </h2>

          <div className="mt-8 space-y-3">
            {p.faqs.map((f) => (
              <details
                key={f.question}
                className="group  border border-white/10 bg-[#3f3f3f] px-5 py-4 transition open:border-orange-300/35"
              >
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-[15px] font-semibold text-[#0A0A0A]">
                  {f.question}
                  <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-orange-300 transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-3 text-[14px] leading-relaxed text-black/60">{f.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}

function ProgramFinalCta({ program: p }: { program: ProgramPageData }) {
  return (
    <section className="bg-white pb-20 md:pb-28">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.55 }}
          className="relative overflow-hidden  bg-gradient-to-r from-[#FF6B47] via-[#FF7A3D] to-[#FF8A4C] p-8 md:p-12"
        >
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
                {p.finalCta.headline}
              </h2>
              <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-black/75">
                {p.finalCta.description}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={openMasterclassPopup}
                className="inline-flex items-center gap-2  bg-white px-7 py-3.5 text-[14px] font-bold uppercase tracking-wider text-orange-700 transition hover:bg-orange-50"
              >
                <Rocket className="h-4 w-4" />
                {p.finalCta.primaryCta}
              </button>
              <button
                type="button"
                onClick={triggerBrochureDownload}
                className="inline-flex items-center gap-2  border border-white/30 bg-white/10 px-6 py-3.5 text-[14px] font-bold uppercase tracking-wider text-[#0A0A0A] backdrop-blur transition hover:bg-white/20"
              >
                <Download className="h-4 w-4" />
                {p.finalCta.secondaryCta}
              </button>
            </div>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}

export default ProgramPageTemplate;
