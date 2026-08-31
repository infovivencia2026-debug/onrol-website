import { FormEvent, useEffect, useState } from "react";
import { ArrowRight, Check, ShieldCheck, X } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { submitBrochureRequest } from "@/lib/intake";
import { syncMasterclassSubmissionToSheet } from "@/lib/masterclassSheetSync";

const INTER_STACK = `"Fira Sans", Figtree, system-ui, -apple-system, "Segoe UI", sans-serif`;
// LCP-critical copy uses a pure system stack so the headline paints instantly
// (Manrope swaps in once loaded, invisible to LCP).
const DISPLAY_STACK = `"Fira Sans", system-ui, -apple-system, "Segoe UI", "Helvetica Neue", Arial, sans-serif`;
const SYSTEM_STACK = `"Fira Sans", Figtree, system-ui, -apple-system, "Segoe UI", "Helvetica Neue", Arial, sans-serif`;

// Structured meta row (outskill-style discipline) — NO pricing.
const HERO_META = [
  ["12 weeks", "Live cohort"],
  ["3 projects", "Deployed by you"],
  ["1 year", "Builder community"],
];

const HomeHero = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", phone: "", email: "", role: "", city: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const openFromNavbar = () => setIsFormOpen(true);
    window.addEventListener("open-hero-registration", openFromNavbar);
    return () => window.removeEventListener("open-hero-registration", openFromNavbar);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("openRegistration") === "1") {
      setIsFormOpen(true);
      params.delete("openRegistration");
      const nextSearch = params.toString();
      navigate(`${location.pathname}${nextSearch ? `?${nextSearch}` : ""}${location.hash}`, { replace: true });
    }
  }, [location.pathname, location.search, location.hash, navigate]);

  useEffect(() => {
    if (!isFormOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = original; };
  }, [isFormOpen]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim() || !formData.email.trim()) {
      setError("Please fill name, phone, and email to reserve your seat.");
      return;
    }
    setSubmitting(true);
    setError("");
    const trimmedName = formData.name.trim();
    const trimmedPhone = formData.phone.trim();
    const trimmedEmail = formData.email.trim().toLowerCase();
    const trimmedRole = formData.role.trim();
    const trimmedCity = formData.city.trim();

    const results = await Promise.allSettled([
      submitBrochureRequest({ fullName: trimmedName, phone: trimmedPhone, email: trimmedEmail, role: trimmedRole || undefined, city: trimmedCity || undefined, source: "hero-masterclass-popup" }),
      Promise.resolve(syncMasterclassSubmissionToSheet({ full_name: trimmedName, phone: trimmedPhone, email: trimmedEmail, current_role: trimmedRole, city: trimmedCity, source: "hero-masterclass-popup" })),
    ]);

    if (results.some((r) => r.status === "fulfilled")) {
      setIsFormOpen(false);
      window.location.href = "/landingpage/aigeneralist/roadmap.html";
      return;
    }
    const firstReason = results.find((r) => r.status === "rejected") as { status: "rejected"; reason: unknown } | undefined;
    setError((firstReason?.reason as Error)?.message || "Registration is temporarily unavailable. Please try again in a minute.");
    setSubmitting(false);
  };

  return (
    <>
      <section id="home" className="relative isolate flex min-h-[calc(100svh-4rem)] items-end overflow-hidden border-b border-white/10 bg-[#080808] text-white sm:min-h-[calc(100svh-72px)]">
        {/* Terra One-inspired geometric backdrop: quiet left field, warm nested frames. */}
        <picture className="absolute inset-0 -z-20">
          <source srcSet="/onrol-hero-builder-dawn.avif" type="image/avif" />
          <source srcSet="/onrol-hero-builder-dawn.webp" type="image/webp" />
          <img
            src="/onrol-hero-builder-dawn.png"
            alt="A young Indian AI builder looking across the city at dawn after completing a project"
            width={1680}
            height={945}
            fetchPriority="high"
            className="h-full w-full object-cover object-[64%_center] sm:object-center"
          />
        </picture>
        <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(5,7,10,.98)_0%,rgba(5,7,10,.91)_31%,rgba(5,7,10,.48)_58%,rgba(5,7,10,.08)_100%)]" />
        <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(0deg,rgba(5,5,5,.82)_0%,transparent_46%,rgba(0,0,0,.15)_100%)]" />
        {/* Copy overlay */}
        <div className="relative w-full px-5 pb-7 pt-28 sm:px-8 sm:pb-10 md:px-12 lg:px-14 lg:pb-12 xl:px-20 2xl:px-24">
          <div className="max-w-[780px]">
            <div className="mb-6 inline-flex items-center gap-2 border border-white/20 bg-black/20 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.24em] text-white/80 backdrop-blur-md sm:text-[11px]">
              <span className="h-2 w-2 rounded-full bg-[#f46718] shadow-[0_0_18px_rgba(244,103,24,.9)]" />
              India&apos;s AI Execution School
            </div>
              <h1
                className="max-w-[760px] text-balance"
                style={{ fontFamily: DISPLAY_STACK, fontSize: "clamp(3rem, 6.6vw, 7.2rem)", lineHeight: 0.91, letterSpacing: "-0.055em", fontWeight: 760 }}
              >
                Don&apos;t just learn AI. <span className="text-[#ff7a2f]">Build your next chapter.</span>
              </h1>
              <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-white/72 sm:text-[17px]" style={{ fontFamily: SYSTEM_STACK }}>
                Go from curious to capable with live mentorship, real build sprints, and three deployed AI projects that prove what you can do.
              </p>

              {/* Structured meta row — hairline cells, no price. Solid bg so the
                  hero image never bleeds through the cells on mobile. */}
              <div className="mt-10 grid max-w-2xl grid-cols-3 border-y border-white/16 bg-black/10 backdrop-blur-sm">
                {HERO_META.map(([k, v], i) => (
                  <div key={k} className={`py-4 pr-3 sm:py-5 sm:pr-6 ${i > 0 ? "border-l border-white/16 pl-3 sm:pl-6" : ""}`}>
                    <p className="text-[15px] font-extrabold tracking-[-0.02em] text-white sm:text-[20px]">{k}</p>
                    <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.13em] text-white/50 sm:text-[10px] sm:tracking-[0.18em]">{v}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(true)}
                  className="group inline-flex min-h-12 items-center justify-center gap-3 bg-[#f46718] px-6 text-[12px] font-extrabold uppercase tracking-[0.16em] text-[#0A0A0A] transition hover:bg-[#ff8442] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f46718]"
                >
                  Join the free masterclass <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>
                <Link
                  to="/programs/"
                  className="inline-flex min-h-12 items-center justify-center border border-white/25 bg-white/[0.06] px-6 text-[12px] font-bold uppercase tracking-[0.16em] text-white backdrop-blur-sm transition hover:border-white/50 hover:bg-white/[0.12]"
                >
                  Explore programs
                </Link>
              </div>

              {/* Social proof — plain, hairline-separated */}
            </div>
          </div>
      </section>

      {/* Free Masterclass registration modal (unchanged logic) */}
      {isFormOpen ? (
        <div
          className="fixed inset-0 z-[80] overflow-y-auto overscroll-contain bg-black/65"
          style={{ height: "100dvh" }}
          onClick={(e) => { if (e.target === e.currentTarget) setIsFormOpen(false); }}
        >
          <div className="flex min-h-full items-start justify-center p-3 sm:items-center sm:p-6" onClick={(e) => { if (e.target === e.currentTarget) setIsFormOpen(false); }}>
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Reserve your Free Masterclass seat"
              className="relative my-2 grid w-full max-w-4xl grid-cols-1 overflow-hidden border border-black/10 bg-white md:grid-cols-2"
              style={{ fontFamily: INTER_STACK }}
            >
              <button type="button" onClick={() => setIsFormOpen(false)} aria-label="Close" className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center border border-black/15 bg-white text-[#0A0A0A] transition hover:bg-black/[0.04]">
                <X className="h-4 w-4" />
              </button>

              {/* Left — pitch (light) */}
              <div className="order-2 border-t border-black/10 bg-[#FFFDFB] p-7 sm:p-9 md:order-1 md:border-r md:border-t-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-black/60">Free Masterclass</p>
                <h3 className="mt-3 text-[#0A0A0A]" style={{ fontSize: "clamp(26px, 3.4vw, 36px)", fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.06 }}>
                  Reserve your masterclass seat
                </h3>
                <p className="mt-4 text-[14.5px] leading-relaxed text-black/70">
                  Join an interactive masterclass on AI agents and vibe coding. Build something live on the call, take the brochure home with you.
                </p>
                <ul className="mt-7 space-y-4 text-[13.5px]">
                  {[
                    { t: "Live, interactive session", b: "Learn directly from active practitioners." },
                    { t: "Practical & actionable", b: "Real-world projects + tools you'll use the same week." },
                    { t: "Free resources", b: "Cohort brochure and bonus material on email." },
                  ].map((bullet) => (
                    <li key={bullet.t} className="flex items-start gap-3">
                      <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center bg-[#f46718] text-[#0A0A0A]">
                        <Check className="h-3.5 w-3.5" strokeWidth={3} />
                      </span>
                      <div>
                        <p className="font-semibold text-[#0A0A0A]">{bullet.t}</p>
                        <p className="mt-0.5 text-black/65">{bullet.b}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Right — form */}
              <div className="order-1 bg-white p-7 sm:p-9 md:order-2">
                <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-black/60">Let&apos;s save your seat</p>
                <p className="mb-6 mt-2 text-[13.5px] text-black/65">
                  Fill in your details and we&apos;ll send you the masterclass details and brochure.
                </p>
                <form onSubmit={handleSubmit} className="space-y-3.5">
                  <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                    <Field label="Full Name *" value={formData.name} onChange={(v) => setFormData((p) => ({ ...p, name: v }))} />
                    <Field label="Phone Number *" value={formData.phone} onChange={(v) => setFormData((p) => ({ ...p, phone: v }))} />
                    <Field label="Email Address *" type="email" value={formData.email} onChange={(v) => setFormData((p) => ({ ...p, email: v }))} />
                    <Field label="Current Role" value={formData.role} onChange={(v) => setFormData((p) => ({ ...p, role: v }))} />
                    <Field label="City" value={formData.city} onChange={(v) => setFormData((p) => ({ ...p, city: v }))} fullWidth />
                  </div>
                  <div className="flex items-start gap-2 border border-black/10 bg-[#FFFDFB] px-3.5 py-2.5 text-[12.5px] text-black/70">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#f46718]" />
                    <span><strong className="text-[#0A0A0A]">Your information is safe with us.</strong> We respect your privacy and will never share your details.</span>
                  </div>
                  {error ? <p className="text-[13px] font-medium text-rose-600">{error}</p> : null}
                  <button type="submit" disabled={submitting} className="inline-flex h-12 w-full items-center justify-center gap-2 bg-[#f46718] px-5 text-[14px] font-medium uppercase tracking-wider text-[#0A0A0A] transition hover:bg-[#ff7f33] disabled:cursor-not-allowed disabled:opacity-70">
                    {submitting ? "Reserving…" : "View Details"}
                  </button>
                  <p className="text-center text-[11.5px] text-black/55">No spam. Unsubscribe anytime.</p>
                </form>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

function Field({ label, value, onChange, type = "text", fullWidth = false }: { label: string; value: string; onChange: (v: string) => void; type?: string; fullWidth?: boolean }) {
  return (
    <label className={`block ${fullWidth ? "sm:col-span-2" : ""}`}>
      <span className="sr-only">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={label}
        className="h-12 w-full border border-black/15 bg-white px-4 text-[16px] font-medium text-[#0A0A0A] placeholder:font-normal placeholder:text-black/50 transition focus:border-[#f46718] focus:outline-none focus:ring-2 focus:ring-[#f46718]/30 sm:text-[14px]"
      />
    </label>
  );
}

export default HomeHero;
