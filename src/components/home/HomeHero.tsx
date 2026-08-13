import { FormEvent, useEffect, useState } from "react";
import { ArrowRight, Check, ShieldCheck, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { submitBrochureRequest } from "@/lib/intake";
import { syncMasterclassSubmissionToSheet } from "@/lib/masterclassSheetSync";
import { Frame, OrangeButton, Shell } from "@/components/system/grid";

const INTER_STACK = `"Fira Sans", Figtree, system-ui, -apple-system, "Segoe UI", sans-serif`;
// LCP-critical copy uses a pure system stack so the headline paints instantly
// (Manrope swaps in once loaded, invisible to LCP).
const DISPLAY_STACK = `"Fira Sans", system-ui, -apple-system, "Segoe UI", "Helvetica Neue", Arial, sans-serif`;
const SYSTEM_STACK = `"Fira Sans", Figtree, system-ui, -apple-system, "Segoe UI", "Helvetica Neue", Arial, sans-serif`;

// Structured meta row (outskill-style discipline) — NO pricing.
const HERO_META = [
  ["Next cohort", "Rolling admissions"],
  ["Format", "Live · online"],
  ["Level", "No coding needed"],
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
      <section id="home" className="relative flex min-h-[calc(100svh-4rem)] items-center overflow-hidden border-b border-black/10 bg-white sm:min-h-[calc(100svh-72px)]">
        {/* Hero image fills the entire hero viewport */}
        <div aria-hidden className="absolute inset-0">
          <picture>
            <source srcSet="/hero-bg-home-v2.avif" type="image/avif" />
            <source srcSet="/hero-bg-home-v2.webp" type="image/webp" />
            <img src="/hero-bg-home-v2.jpg" alt="" loading="eager" decoding="async" fetchPriority="high" className="h-full w-full object-cover object-[75%_bottom]" />
          </picture>
        </div>
        {/* Mobile-only readability scrim — the full-bleed cube image is too busy
            behind stacked content on phones (the logo bleeds through the copy).
            Desktop keeps the image clear since the copy sits on its white side. */}
        <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-white/94 via-white/90 to-white/72 md:hidden" />
        {/* Copy overlay */}
        <div className="relative w-full max-w-2xl px-5 py-12 sm:px-8 md:px-12 lg:px-14 xl:pl-24 2xl:pl-44">
              <h1
                className="max-w-xl text-[#0A0A0A]"
                style={{ fontFamily: DISPLAY_STACK, fontSize: "clamp(2.3rem, 4.8vw, 4.1rem)", lineHeight: 1.0, letterSpacing: "-0.03em", fontWeight: 700 }}
              >
                India&apos;s AI <span className="text-[#f46718]">Execution</span> School.
              </h1>
              <p className="mt-5 max-w-md text-[15px] leading-relaxed text-black/70" style={{ fontFamily: SYSTEM_STACK }}>
                ONROL turns AI curiosity into shipped work &mdash; useful automations, deployable web apps, AI agents, and a portfolio that proves execution.
              </p>

              {/* Structured meta row — hairline cells, no price. Solid bg so the
                  hero image never bleeds through the cells on mobile. */}
              <div className="mt-7 flex max-w-md flex-wrap border border-black/10 bg-white/90 text-[12px]">
                {HERO_META.map(([k, v], i) => (
                  <div key={k} className={`flex-1 px-4 py-3 ${i < HERO_META.length - 1 ? "border-r border-black/10" : ""}`}>
                    <p className="font-bold uppercase tracking-[0.14em] text-black/55">{k}</p>
                    <p className="mt-1 font-semibold text-[#0A0A0A]">{v}</p>
                  </div>
                ))}
              </div>

              <div className="mt-7">
                <OrangeButton to="/programs/">
                  Register Now <ArrowRight className="h-4 w-4" />
                </OrangeButton>
              </div>

              {/* Social proof — plain, hairline-separated */}
              <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-black/65">
                <span><strong className="text-[#0A0A0A]">4.95/5</strong> rating</span>
                <span aria-hidden className="h-3 w-px bg-black/15" />
                <span><strong className="text-[#0A0A0A]">2,400+</strong> alumni</span>
                <span aria-hidden className="h-3 w-px bg-black/15" />
                <span><strong className="text-[#0A0A0A]">10,000+</strong> builders</span>
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
