import { FormEvent, useState } from "react";
import { ArrowRight, ShieldCheck, CheckCircle2, Clock, Video, Sparkles, GraduationCap, Rocket } from "lucide-react";
import SEO from "@/components/seo/SEO";
import Logo from "@/components/shared/Logo";
import { Page } from "@/components/system/grid";
import { syncWebinarSubmissionToSheet } from "@/lib/webinarSheetSync";

const WEBINAR = {
  title: "Build a Mini AI Startup in 60 Minutes",
  hook: "One idea. One AI website. One chatbot. One automation. Built live.",
  when: "This Sunday · 14 Jun 2026 · 3:00 PM",
};

const TRUST = [
  { label: "Free Live Webinar", Icon: Video },
  { label: "No Coding Required", Icon: Sparkles },
  { label: "Beginner Friendly", Icon: GraduationCap },
  { label: "Build Session", Icon: Rocket },
];

const BUILD_POINTS = [
  "One idea turned into a clear business offer",
  "AI-powered landing page built live",
  "Chatbot added for visitor interaction",
  "Lead-capture form + automation workflow",
  "Launch content ideas for promotion",
  "Bonus: how one person can use AI to work like a team",
];

const MENTOR = {
  name: "Priteesh Joshi",
  role: "Certified Applied AI Implementation Lead & Corporate Trainer",
  tagline: "Applied AI · 12+ Years · GenAI, Agentic AI & Automation",
  bio: "Applied-AI specialist in Generative AI, agentic workflows, no-code app development, and AI observability — focused on actionable skills that help people ship real AI automation and deployment.",
  brings: ["Generative & Agentic AI", "AI Automation & Workflows", "No-Code App Development", "Hands-on, live execution"],
  badges: ["AI Tools", "Automation", "Startup Building", "Live Execution"],
  stats: [["12+", "Years Experience"], ["10+", "Yrs Corporate Training"]],
};

function ORANGE_CTA(label: string) {
  return `inline-flex min-h-[48px] w-full items-center justify-center gap-2 bg-[#f46718] px-6 text-[14px] font-medium uppercase tracking-wider text-[#0A0A0A] transition hover:bg-[#ff7f33] disabled:cursor-not-allowed disabled:opacity-70`;
}

function RegistrationForm() {
  // Mobile-only registration (max conversion): name/email/occupation removed.
  const [form, setForm] = useState({ phone: "", honey: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (form.honey) return;
    if (!form.phone.trim()) {
      setError("Please enter your mobile number to reserve your seat.");
      return;
    }
    setError("");
    setStatus("sending");
    // Ambassador referral: ?ref=<code> in the URL → attributes this signup to
    // that ambassador (referrer + AMB.<email> tag) in the CRM.
    const ref = new URLSearchParams(window.location.search).get("ref")?.trim() || "";
    const data = {
      // Name is a single space (not empty) so the existing WhatsApp template's
      // {{1}} parameter stays valid; email/occupation no longer collected.
      name: " ",
      phone: form.phone.trim(),
      email: "",
      role: "",
      webinar_slug: "build-mini-ai-startup",
      ...(ref ? { ref } : {}),

      tag: "ai-startup-webinar",
      source: "AI Startup Webinar landing",
      campaign: "ai-startup-webinar",
      notes: `Webinar: ${WEBINAR.title}`,
    };
    try {
      const res = await fetch("https://go.onrol.in/api/public/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(data),
      });
      // Fire-and-forget Google Sheet sync (own tab).
      syncWebinarSubmissionToSheet({ name: data.name, phone: data.phone, email: data.email, occupation: "" });
      if (!res.ok) {
        if (res.status === 429) throw new Error("Too many submissions — please wait a minute and try again.");
        throw new Error("Submission failed (" + res.status + ")");
      }
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed — please try again.");
      setStatus("error");
    }
  };

  if (status === "done") {
    return (
      <div className="border border-black/10 bg-white p-8 text-center shadow-[0_30px_80px_-40px_rgba(0,0,0,0.4)]">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
        <h3 className="mt-3 text-[22px] font-black text-[#0A0A0A]">Your seat is reserved.</h3>
        <p className="mt-2 text-[14px] leading-relaxed text-black/65">
          We&apos;ll send the join link on WhatsApp + email before {WEBINAR.when}. See you live!
        </p>
      </div>
    );
  }

  const inputCls = "h-12 w-full border border-black/15 bg-white px-3.5 text-[16px] font-medium text-[#0A0A0A] placeholder:font-normal placeholder:text-black/40 transition focus:border-[#f46718] focus:outline-none focus:ring-2 focus:ring-[#f46718]/30 sm:text-[14px]";

  return (
    <div className="border border-black/10 bg-white p-7 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.45)] sm:p-9">
      <h3 className="text-[24px] font-black leading-tight tracking-tight text-[#0A0A0A] sm:text-[28px]">
        Register to start your AI journey
      </h3>

      <form onSubmit={handleSubmit} autoComplete="on" noValidate className="mt-5 space-y-3.5">
        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-black/60">Mobile Number</span>
          <input name="phone" type="tel" required inputMode="tel" placeholder="+91 9XXXX XXXXX" autoComplete="tel" value={form.phone} onChange={set("phone")} className={inputCls} />
          <span className="mt-1.5 block text-[12px] text-black/50">That&apos;s it — we&apos;ll send the join link on WhatsApp.</span>
        </label>

        <input type="text" name="company" tabIndex={-1} autoComplete="off" aria-hidden value={form.honey} onChange={set("honey")} style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }} />

        {status === "error" && error ? (
          <p role="alert" className="border border-red-200 bg-red-50 px-3 py-2 text-[12.5px] text-red-700">{error}</p>
        ) : null}

        <button type="submit" disabled={status === "sending"} className={ORANGE_CTA("Reserve")}>
          {status === "sending" ? "Reserving…" : <>Reserve My Free Seat <ArrowRight className="h-4 w-4" /></>}
        </button>
        <p className="flex items-center justify-center gap-1.5 text-center text-[11.5px] text-black/50">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> No spam. We only send your webinar join link.
        </p>
      </form>
    </div>
  );
}

export default function WebinarLanding() {
  const scrollToForm = () => document.getElementById("register")?.scrollIntoView({ behavior: "smooth", block: "center" });

  return (
    <main className="min-h-screen bg-white text-[#0A0A0A]" style={{ fontFamily: '"Fira Sans", Figtree, system-ui, -apple-system, "Segoe UI", sans-serif' }}>
      <SEO
        title="Build a Mini AI Startup in 60 Minutes — Free Live Webinar | ONROL"
        description="Free live ONROL webinar this Sunday, 14 June 2026 at 3 PM. Watch one idea become an AI website, chatbot, and automation system — built live. No coding required."
        path="/webinar/build-mini-ai-startup/"
        noindex
      />

      <div className="px-3 sm:px-5 lg:px-8">
        <Page>

      {/* ── VIEWPORT 1 — Hero + Registration ───────────────────────── */}
      <section id="register" className="relative flex min-h-[100svh] items-center overflow-hidden border-b border-black/10">
        <div aria-hidden className="absolute inset-0">
          <picture>
            <source srcSet="/webinar-hero.avif" type="image/avif" />
            <source srcSet="/webinar-hero.webp" type="image/webp" />
            <img src="/webinar-hero.jpg" alt="" className="h-full w-full object-cover object-center" />
          </picture>
        </div>
        {/* Mobile-only readability scrim — the full-bleed cube image is too busy
            behind stacked content on small screens. Desktop keeps it visible. */}
        <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-white/85 via-white/72 to-white/80 md:hidden" />

        <div className="relative mx-auto grid w-full max-w-7xl gap-8 px-5 py-14 sm:py-20 lg:grid-cols-[1fr_minmax(0,400px)] lg:gap-14 lg:py-24 lg:items-center lg:px-8">
          {/* Left — logo + title + hook + meta */}
          <div>
            <Logo variant="dark" className="h-10 w-auto object-contain sm:h-12" />
            <h1 className="mt-7 font-black leading-[0.98] tracking-[-0.03em] text-[#0A0A0A]" style={{ fontFamily: '"Fira Sans", system-ui, sans-serif', fontSize: "clamp(36px, 5.2vw, 64px)" }}>
              <span className="block">Build a Mini</span>
              <span className="block text-[#f46718]">AI Startup</span>
              <span className="block">in 60 Minutes</span>
            </h1>
            <p className="mt-5 max-w-lg text-[16px] font-semibold leading-7 text-[#0A0A0A] md:text-[18px]">
              {WEBINAR.hook}
            </p>

            {/* When band */}
            <div className="mt-7 inline-flex items-center gap-2.5 border border-black/15 bg-white px-4 py-2.5">
              <Clock className="h-4 w-4 text-[#f46718]" />
              <span className="text-[13px] font-medium uppercase tracking-wide text-[#0A0A0A]">{WEBINAR.when}</span>
            </div>

            {/* Trust badges — 2×2 grid, icon per box */}
            <div className="mt-6 grid max-w-md grid-cols-2 gap-3">
              {TRUST.map(({ label, Icon }) => (
                <div key={label} className="flex items-center gap-3 border border-black/15 bg-white px-4 py-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center bg-[#f46718] text-[#0A0A0A]">
                    <Icon className="h-5 w-5" strokeWidth={2.2} />
                  </span>
                  <span className="text-[12px] font-bold uppercase leading-tight tracking-wide text-[#0A0A0A]">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right — registration form */}
          <RegistrationForm />
        </div>
      </section>

      {/* ── VIEWPORT 2 — What you'll build + Mentor ─────────────────── */}
      <section className="relative flex min-h-[100svh] items-center border-b border-black/10 bg-[#F6F5F2]">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-5 py-16 lg:grid-cols-2 lg:items-stretch lg:gap-14 lg:px-8">
          {/* Left — what you'll see built live */}
          <div className="flex flex-col">
            <h2 className="mb-4 text-[20px] font-extrabold tracking-[-0.01em] text-[#0A0A0A] sm:text-[22px]">What you&apos;ll see built live</h2>
            <div className="flex flex-1 flex-col border border-black/10 bg-white">
              <ul className="flex-1">
                {BUILD_POINTS.map((p, i) => (
                  <li key={p} className={`flex items-start gap-3 px-5 py-4 text-[14.5px] font-semibold text-[#0A0A0A] ${i < BUILD_POINTS.length - 1 ? "border-b border-black/10" : ""}`}>
                    <span aria-hidden className="mt-[2px] font-black leading-none text-[#f46718]">+</span> {p}
                  </li>
                ))}
              </ul>
              {/* Audience — highlighted, inside the box */}
              <div className="border-t border-black/10 bg-[#FFF4EA] px-5 py-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#f46718]">This is for you</p>
                <p className="mt-2 text-[15px] font-bold leading-relaxed text-[#0A0A0A]">
                  Students, job-seekers, professionals, freelancers, creators, marketers, trainers, entrepreneurs &amp; business owners.
                </p>
              </div>
            </div>
            <span className="mt-5 inline-flex items-center justify-center gap-2 bg-[#f46718] px-6 py-3.5 text-[13px] font-medium uppercase tracking-wide text-[#0A0A0A]">
              <Clock className="h-4 w-4" /> {WEBINAR.when}
            </span>
          </div>

          {/* Right — mentor */}
          <div className="flex flex-col">
            <h2 className="mb-4 text-[20px] font-extrabold tracking-[-0.01em] text-[#0A0A0A] sm:text-[22px]">Your mentor</h2>
            <div className="group flex flex-1 flex-col border border-black/10 bg-white">
              <div className="flex items-stretch gap-0 border-b border-black/10">
                <div className="relative w-[120px] shrink-0 overflow-hidden border-r border-black/10 sm:w-[150px]">
                  <img
                    src="/team/priteesh-joshi.jpg"
                    alt={MENTOR.name}
                    className="h-full w-full object-cover object-top grayscale transition duration-500 group-hover:grayscale-0"
                  />
                </div>
                <div className="flex flex-col justify-center p-5">
                  <h3 className="text-[20px] font-black leading-tight tracking-[-0.01em] text-[#0A0A0A]">{MENTOR.name}</h3>
                  <p className="mt-1.5 text-[12.5px] font-semibold leading-snug text-black/70">{MENTOR.role}</p>
                  <p className="mt-1 text-[11.5px] text-black/55">{MENTOR.tagline}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 border-b border-black/10 text-center">
                {MENTOR.stats.map(([v, l], i) => (
                  <div key={l} className={`px-4 py-4 ${i === 0 ? "border-r border-black/10" : ""}`}>
                    <div className="text-[22px] font-black tracking-[-0.02em] text-[#0A0A0A]">{v}</div>
                    <div className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-black/55">{l}</div>
                  </div>
                ))}
              </div>

              <div className="flex flex-1 flex-col p-5">
                <p className="text-[13.5px] leading-relaxed text-black/65">{MENTOR.bio}</p>
                <ul className="mt-4 space-y-2">
                  {MENTOR.brings.map((b) => (
                    <li key={b} className="flex items-center gap-2 text-[13px] font-semibold text-[#0A0A0A]">
                      <span aria-hidden className="font-black text-[#f46718]">+</span> {b}
                    </li>
                  ))}
                </ul>
                <div className="mt-auto flex flex-wrap gap-2 border-t border-black/10 pt-4">
                  {MENTOR.badges.map((b) => (
                    <span key={b} className="border border-black/15 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wide text-black/65">{b}</span>
                  ))}
                </div>
              </div>
            </div>

            <button type="button" onClick={scrollToForm} className="mt-5 inline-flex min-h-[48px] items-center justify-center gap-2 bg-[#f46718] px-6 py-3.5 text-[14px] font-medium uppercase tracking-wider text-[#0A0A0A] transition hover:bg-[#ff7f33]">
              Join the Free Webinar <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

        </Page>
      </div>

      {/* Sticky bottom CTA bar — disciplined (white/orange, no price). */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-white shadow-[0_-10px_30px_-14px_rgba(0,0,0,0.18)]">
        <div className="mx-auto flex max-w-[1680px] items-center justify-between gap-3 px-4 py-2.5 sm:px-6 sm:py-3 lg:px-10">
          <div className="min-w-0">
            <p className="truncate text-[14px] font-extrabold tracking-[-0.01em] text-[#0A0A0A] sm:text-[16px]">
              Build a Mini <span className="text-[#f46718]">AI Startup</span> in 60 Minutes
            </p>
            <p className="hidden text-[12px] font-semibold text-black/60 sm:block">Sun · 14/06/2026 · 3:00 PM · Free · No coding</p>
          </div>
          <div className="flex shrink-0 items-center gap-4">
            <div className="hidden text-right md:block">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#f46718]">Free Live Webinar</p>
              <p className="text-[11px] font-semibold text-black/55">Sun · 14/06/2026 · 3:00 PM</p>
            </div>
            <button type="button" onClick={scrollToForm} className="inline-flex min-h-[44px] items-center gap-2 bg-[#f46718] px-4 text-[12px] font-medium uppercase tracking-wide text-[#0A0A0A] transition hover:bg-[#ff7f33] sm:px-6 sm:text-[13px]">
              Reserve My Free Seat <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
