// /win — invite-only premium reservation page.
//
// NOT linked from anywhere on the site. NOT in sitemap.xml. NOT prerendered.
// robots.txt disallows it. Has noindex meta on the page itself. Lands at
// https://onrol.in/win.
//
// Visual language: cream + orange-amber palette pushed toward "premium
// invitation" — gold seal motif, gold-frame border on the form card,
// formal serif typography (Playfair Display in the H1). The user should
// feel they're being given something exclusive. Copy is intentionally
// neutral — no convocation/ceremony/stage/graduation language; the
// aesthetic carries the prestige.

import { FormEvent, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Award,
  CheckCircle2,
  GraduationCap,
  Loader2,
  Phone,
  Sparkles,
  User,
  Users,
  Briefcase,
  Mail,
} from "lucide-react";
import Logo from "@/components/shared/Logo";
import SEO from "@/components/seo/SEO";
import { CONTACT_PHONE, CONTACT_PHONE_DIGITS, SITE_URL } from "@/lib/brand";
import { submitWinRegistration } from "@/lib/winRegistration";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const INTER_STACK = `"Fira Sans", Figtree, system-ui, -apple-system, "Segoe UI", sans-serif`;
const SERIF_STACK = `'Playfair Display', Georgia, 'Times New Roman', serif`;

const OCCUPATIONS = [
  "Student",
  "Working professional",
  "Job-seeker",
  "Freelancer",
  "Business owner / Founder",
  "Educator / Mentor",
  "Homemaker",
  "Other",
];

export default function Win() {
  const navigate = useNavigate();
  const path = "/win";
  const url = `${SITE_URL}${path}`;

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    fatherName: "",
    mobile: "+91 ",
    email: "",
    occupation: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // ── Validation helpers ─────────────────────────────────────────────
  // Mobile: extract digits, strip leading 91 country code if present,
  // require exactly 10 digits starting with 6-9 (valid Indian mobile range).
  const mobileDigitsOnly = form.mobile.replace(/\D/g, "").replace(/^91/, "");
  const isMobileValid = /^[6-9]\d{9}$/.test(mobileDigitsOnly);
  // Email: standard format check — at least one non-whitespace before @,
  // domain with a dot, no spaces.
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());

  const isComplete =
    form.firstName.trim() &&
    form.lastName.trim() &&
    form.fatherName.trim() &&
    isMobileValid &&
    isEmailValid &&
    form.occupation;

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;

    // Specific error messages so the user knows exactly what to fix.
    if (!form.firstName.trim() || !form.lastName.trim() || !form.fatherName.trim() || !form.occupation) {
      toast.error("Please fill every field — all are required.");
      return;
    }
    if (!isMobileValid) {
      toast.error("Please enter a valid 10-digit Indian mobile number.");
      return;
    }
    if (!isEmailValid) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setSubmitting(true);

    try {
      // Awaits the Postgres insert so a failure surfaces as a real error
      // instead of silently navigating away with no row written.
      await submitWinRegistration({
        first_name:  form.firstName.trim(),
        last_name:   form.lastName.trim(),
        father_name: form.fatherName.trim(),
        mobile:      `+91 ${mobileDigitsOnly}`,
        email:       form.email.trim().toLowerCase(),
        occupation:  form.occupation,
        source:      "win-convocation",
      });
      toast.success("Your seat is reserved.");
      navigate("/thanks/win", { replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Submission failed.";
      console.error("[win] submit failed:", err);
      toast.error(`Couldn't reserve your seat: ${msg}. Please try again or contact us.`);
      setSubmitting(false);
    }
  };

  return (
    <main
      style={{ fontFamily: INTER_STACK }}
      className="relative isolate min-h-screen overflow-hidden text-[#f3f5f8]"
    >
      <SEO
        title="ONROL — Reserve your seat"
        description="By-invitation reservation for ONROL Career Catalyst attendees."
        path={path}
        noindex
      />

      {/* ── Decorative background ──────────────────────────────────── */}
      {/* Cream fallback at the back so the page is never left dark if the
          photo fails to load (e.g. broken file, network blip). */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-30 bg-[#FAF7F2]" />
      {/* Background image — AVIF/WebP/PNG fallback chain. */}
      <picture aria-hidden className="pointer-events-none absolute inset-0 -z-20 block h-full w-full">
        <source srcSet="/win-background.avif" type="image/avif" />
        <source srcSet="/win-background.webp" type="image/webp" />
        <img
          src="/win-background.png"
          alt=""
          aria-hidden
          loading="eager"
          decoding="async"
          className="h-full w-full object-cover object-center"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
      </picture>
      {/* Cream/amber overlay tints the photo so the cream form card and
          dark text stay readable. Strong on mobile (where text + photo
          stack vertically), softer on desktop (where the form card sits
          on the right and the photo can show through more). */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(250,247,242,0.92)_0%,rgba(250,247,242,0.85)_100%)] md:bg-[linear-gradient(120deg,rgba(250,247,242,0.92)_0%,rgba(250,247,242,0.78)_45%,rgba(250,247,242,0.55)_100%)]"
      />
      {/* Soft amber radial accent so the cream feels warm even with the photo */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_45%_at_50%_0%,rgba(245,158,11,0.10),transparent_60%)]"
      />
      {/* Subtle ornamental top border */}
      <div aria-hidden className="absolute inset-x-0 top-0 z-10 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

      {/* ── Floating brand pill (replaces the navbar — page is hidden) ── */}
      <a
        href={url}
        aria-label="ONROL"
        className="absolute left-4 top-4 z-20 inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/95 px-3 py-2 shadow-[0_8px_22px_-10px_rgba(0,0,0,0.25)] backdrop-blur sm:left-6 sm:top-6"
      >
        <Logo variant="dark" className="h-7 w-auto sm:h-8" />
      </a>
      <a
        href={`tel:${CONTACT_PHONE_DIGITS}`}
        className="absolute right-4 top-4 z-20 inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/95 px-3.5 py-2 text-[12px] font-bold text-[#f3f5f8] shadow-[0_8px_22px_-10px_rgba(0,0,0,0.25)] backdrop-blur sm:right-6 sm:top-6"
      >
        <Phone className="h-3.5 w-3.5 text-orange-500" />
        <span className="hidden sm:inline">{CONTACT_PHONE}</span>
        <span className="sm:hidden">Call</span>
      </a>

      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-20 pt-24 sm:px-6 md:grid-cols-[1.05fr_0.95fr] md:gap-12 md:py-24 md:pt-28 lg:px-8">
        {/* ── Left: invitation copy ─────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-xl"
        >
          {/* Eyebrow — invitation-only */}
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-3.5 py-1.5 text-[10.5px] font-bold uppercase tracking-[0.22em] text-amber-700">
            <Sparkles className="h-3 w-3" />
            By invitation only
          </span>

          {/* Decorative gold seal */}
          <div className="mt-7 flex items-center gap-3">
            <div className="grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-[0_18px_36px_-12px_rgba(245,158,11,0.6)] ring-4 ring-amber-100">
              <GraduationCap className="h-7 w-7" strokeWidth={2.4} />
            </div>
            <div className="h-px flex-1 bg-gradient-to-r from-amber-400/50 via-amber-300/30 to-transparent" />
          </div>

          <h1
            className="mt-5 text-[#f3f5f8]"
            style={{
              fontFamily: SERIF_STACK,
              fontSize: "clamp(34px, 5.4vw, 60px)",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              lineHeight: 1.05,
            }}
          >
            Your name is on{" "}
            <span className="italic text-orange-500">the list.</span>
          </h1>

          <p
            className="mt-5 max-w-lg text-[15.5px] leading-relaxed text-slate-700 md:text-[16.5px]"
            style={{ lineHeight: 1.55 }}
          >
            You're among a{" "}
            <span className="font-bold text-[#f3f5f8]">select group</span>{" "}
            invited to confirm your seat with ONROL. Share your details
            below and we'll prepare your personalised welcome pack and
            walk you through the next steps.
          </p>

          {/* Premium highlights — feel, not the words */}
          <ul className="mt-7 space-y-3">
            {[
              { Icon: Award, title: "Personalised welcome pack", body: "Prepared with your name and your family's name, just for you." },
              { Icon: Users, title: "Reserved-only access", body: "A guaranteed place at our most exclusive in-person ONROL gathering." },
              { Icon: GraduationCap, title: "Lifetime ONROL inner-circle", body: "Permanent access to mentors, opportunities, and a private network of builders." },
            ].map(({ Icon, title, body }) => (
              <li key={title} className="flex items-start gap-3">
                <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-500/10 text-amber-700">
                  <Icon className="h-4 w-4" strokeWidth={2.4} />
                </span>
                <div>
                  <p className="text-[14px] font-bold text-[#f3f5f8]">{title}</p>
                  <p className="mt-0.5 text-[13.5px] leading-relaxed text-slate-600">{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </motion.div>

        {/* ── Right: gold-framed reservation form card ─────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="relative"
        >
          {/* Outer glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-3 -z-10 rounded-[2rem] bg-[radial-gradient(60%_50%_at_50%_0%,rgba(245,158,11,0.22),transparent_75%)] blur-2xl"
          />
          {/* Outer gold frame */}
          <div className="relative rounded-[20px] bg-gradient-to-br from-amber-300 via-amber-400 to-orange-400 p-[3px] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.28)]">
            <div className="rounded-[17px] bg-[#FFFCF5] p-6 sm:p-7">
              {/* Decorative corner ornaments */}
              <div aria-hidden className="pointer-events-none absolute inset-0 rounded-[20px]">
                <div className="absolute left-3 top-3 h-3 w-3 border-l-2 border-t-2 border-amber-500/60" />
                <div className="absolute right-3 top-3 h-3 w-3 border-r-2 border-t-2 border-amber-500/60" />
                <div className="absolute bottom-3 left-3 h-3 w-3 border-b-2 border-l-2 border-amber-500/60" />
                <div className="absolute bottom-3 right-3 h-3 w-3 border-b-2 border-r-2 border-amber-500/60" />
              </div>

              {/* Seal icon at top */}
              <div className="flex items-center justify-between">
                <p className="inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.22em] text-orange-600">
                  <Sparkles className="h-3.5 w-3.5" />
                  Reserved seat
                </p>
                <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                  Invite-only
                </span>
              </div>

              <h2
                className="mt-3 text-[#f3f5f8]"
                style={{
                  fontFamily: SERIF_STACK,
                  fontSize: "clamp(22px, 2.6vw, 27px)",
                  fontWeight: 700,
                  letterSpacing: "-0.015em",
                  lineHeight: 1.15,
                }}
              >
                Reserve your seat
              </h2>
              <p className="mt-2 text-[12.5px] leading-relaxed text-slate-600">
                All fields are required — your details will appear on your personalised welcome pack.
              </p>

              <form onSubmit={onSubmit} className="mt-5 grid gap-3.5">
                <div className="grid gap-3.5 sm:grid-cols-2">
                  <CertField
                    label="First name"
                    icon={User}
                    value={form.firstName}
                    onChange={(v) => setForm((p) => ({ ...p, firstName: v }))}
                    placeholder="Your first name"
                    required
                  />
                  <CertField
                    label="Last name"
                    icon={User}
                    value={form.lastName}
                    onChange={(v) => setForm((p) => ({ ...p, lastName: v }))}
                    placeholder="Your last name"
                    required
                  />
                </div>
                <CertField
                  label="Father's name"
                  icon={Users}
                  value={form.fatherName}
                  onChange={(v) => setForm((p) => ({ ...p, fatherName: v }))}
                  placeholder="As it should appear on your welcome pack"
                  required
                />
                <CertField
                  label="Mobile"
                  icon={Phone}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  maxLength={16}
                  value={form.mobile}
                  onChange={(v) => setForm((p) => ({ ...p, mobile: v }))}
                  placeholder="+91 9XXXX XXXXX"
                  hint="10-digit Indian mobile, starts with 6, 7, 8 or 9."
                  invalid={!isMobileValid}
                  required
                />
                <CertField
                  label="Email"
                  icon={Mail}
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(v) => setForm((p) => ({ ...p, email: v }))}
                  placeholder="you@example.com"
                  hint="We'll send your welcome pack here."
                  invalid={!isEmailValid}
                  required
                />
                <CertSelect
                  label="Occupation"
                  icon={Briefcase}
                  value={form.occupation}
                  onChange={(v) => setForm((p) => ({ ...p, occupation: v }))}
                  options={OCCUPATIONS}
                  required
                />

                <button
                  type="submit"
                  disabled={submitting || !isComplete}
                  className="mt-2 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-[14px] font-bold uppercase tracking-[0.08em] text-white shadow-[0_18px_40px_-14px_rgba(245,158,11,0.65)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Reserving…
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Reserve my seat
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>

                <p className="mt-1 flex items-center justify-center gap-1.5 text-[11.5px] text-slate-500">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  Confirmation + welcome pack details sent by email.
                </p>
              </form>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}

// ── Form sub-components ──────────────────────────────────────────────

interface FieldProps {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  inputMode?: "text" | "tel" | "email" | "numeric";
  maxLength?: number;
  pattern?: string;
  autoComplete?: string;
  hint?: string;
  /** When true and value non-empty, render hint text in rose tone (error). */
  invalid?: boolean;
}

function CertField({
  label, icon: Icon, value, onChange, placeholder, type = "text",
  required, inputMode, maxLength, pattern, autoComplete, hint, invalid,
}: FieldProps) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.18em] text-amber-700">
        <Icon className="h-3 w-3" />
        {label} {required ? <span className="text-orange-500">*</span> : null}
      </span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        inputMode={inputMode}
        maxLength={maxLength}
        pattern={pattern}
        autoComplete={autoComplete}
        aria-invalid={invalid && value.length > 0 ? true : undefined}
        className={`h-11 w-full rounded-lg border bg-white px-3.5 text-[14px] text-[#f3f5f8] placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
          invalid && value.length > 0
            ? "border-rose-400 focus:border-rose-500 focus:ring-rose-200/50"
            : "border-amber-500/30 focus:border-amber-500 focus:ring-amber-300/30"
        }`}
      />
      {hint ? (
        <p className={`mt-1 text-[11px] ${invalid && value.length > 0 ? "text-rose-600" : "text-slate-500"}`}>
          {hint}
        </p>
      ) : null}
    </label>
  );
}

interface SelectProps {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  required?: boolean;
}

function CertSelect({ label, icon: Icon, value, onChange, options, required }: SelectProps) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.18em] text-amber-700">
        <Icon className="h-3 w-3" />
        {label} {required ? <span className="text-orange-500">*</span> : null}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="h-11 w-full rounded-lg border border-amber-500/30 bg-white px-3.5 text-[14px] text-[#f3f5f8] focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-300/30"
      >
        <option value="" disabled>
          Choose your occupation…
        </option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}
