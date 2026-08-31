// /thanks/win — confirmation after the /win premium reservation form.
// Same cream + gold "premium invitation" aesthetic. noindex (invite-only).
// Copy is intentionally neutral — no convocation/ceremony/stage language;
// the gold seal + serif headline carry the prestige.

import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, GraduationCap, Mail, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import Logo from "@/components/shared/Logo";
import SEO from "@/components/seo/SEO";
import { CONTACT_EMAIL, CONTACT_PHONE, CONTACT_PHONE_DIGITS } from "@/lib/brand";

const INTER_STACK = `"Fira Sans", Figtree, system-ui, -apple-system, "Segoe UI", sans-serif`;
const SERIF_STACK = `'Playfair Display', Georgia, 'Times New Roman', serif`;

export default function ThanksWin() {
  return (
    <main
      style={{ fontFamily: INTER_STACK }}
      className="relative min-h-screen overflow-hidden bg-[#FAF7F2] text-[#f3f5f8]"
    >
      <SEO
        title="Seat reserved — ONROL"
        description="Your seat is reserved. Welcome pack details on email."
        path="/thanks/win"
        noindex
      />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_45%_at_50%_0%,rgba(245,158,11,0.18),transparent_60%),radial-gradient(40%_35%_at_15%_85%,rgba(255,107,71,0.12),transparent_60%),radial-gradient(40%_35%_at_85%_85%,rgba(245,158,11,0.10),transparent_60%)]"
      />
      <div aria-hidden className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

      <a
        href="/"
        aria-label="ONROL home"
        className="absolute left-4 top-4 z-20 inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/95 px-3 py-2 shadow-[0_8px_22px_-10px_rgba(0,0,0,0.25)] backdrop-blur sm:left-6 sm:top-6"
      >
        <Logo variant="dark" className="h-7 w-auto sm:h-8" />
      </a>

      <section className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-4 py-20 text-center">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.55, type: "spring", bounce: 0.35 }}
          className="grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-[0_24px_48px_-16px_rgba(245,158,11,0.7)] ring-[6px] ring-amber-100"
        >
          <GraduationCap className="h-12 w-12" strokeWidth={2.4} />
        </motion.div>

        <p className="mt-7 inline-flex items-center gap-2 rounded-full border border-emerald-500/35 bg-emerald-500/10 px-3.5 py-1.5 text-[10.5px] font-bold uppercase tracking-[0.22em] text-emerald-700">
          <CheckCircle2 className="h-3 w-3" />
          Seat reserved
        </p>

        <h1
          className="mt-4 text-[#f3f5f8]"
          style={{
            fontFamily: SERIF_STACK,
            fontSize: "clamp(32px, 5.4vw, 56px)",
            fontWeight: 700,
            letterSpacing: "-0.025em",
            lineHeight: 1.05,
          }}
        >
          You're on the list.
        </h1>
        <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-slate-700 md:text-[17px]">
          Your seat with ONROL is officially reserved. Your personalised
          welcome pack and next-step details will arrive at your email
          shortly.
        </p>

        {/* What happens next */}
        <div className="mt-10 w-full max-w-xl rounded-2xl border border-amber-500/30 bg-[#FFFCF5] p-6 text-left shadow-[0_24px_48px_-20px_rgba(245,158,11,0.4)]">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.22em] text-amber-700">
            What happens next
          </p>
          <ul className="mt-4 space-y-3 text-[14px] text-slate-700">
            <li className="flex items-start gap-3">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              An email with your welcome pack details arrives within 24 hours.
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              Our team will call you to confirm and walk you through the next steps.
            </li>
            <li className="flex items-start gap-3">
              <GraduationCap className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              Pick up your personalised welcome pack and meet the team in person.
            </li>
          </ul>
        </div>

        {/* Contact options */}
        <div className="mt-9 flex flex-wrap items-center justify-center gap-2.5">
          <a
            href={`tel:${CONTACT_PHONE_DIGITS}`}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-black/10 bg-white px-4 text-[12.5px] font-bold uppercase tracking-wider text-[#f3f5f8] shadow-[0_8px_22px_-10px_rgba(0,0,0,0.25)] transition hover:border-amber-500/50"
          >
            <Phone className="h-3.5 w-3.5 text-orange-500" />
            {CONTACT_PHONE}
          </a>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-black/10 bg-white px-4 text-[12.5px] font-bold uppercase tracking-wider text-[#f3f5f8] shadow-[0_8px_22px_-10px_rgba(0,0,0,0.25)] transition hover:border-amber-500/50"
          >
            <Mail className="h-3.5 w-3.5 text-orange-500" />
            {CONTACT_EMAIL}
          </a>
          <Link
            to="/"
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-black/10 bg-white px-4 text-[12.5px] font-bold uppercase tracking-wider text-[#f3f5f8] shadow-[0_8px_22px_-10px_rgba(0,0,0,0.25)] transition hover:border-amber-500/50"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            ONROL home
          </Link>
        </div>
      </section>
    </main>
  );
}
