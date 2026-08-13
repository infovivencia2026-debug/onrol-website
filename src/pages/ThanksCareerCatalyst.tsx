// /thanks/career-catalyst/ — Post-submit thank-you page after the
// Career Catalyst webinar registration form. Adds calendar + WhatsApp
// reminders to reduce no-show rate.

import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, CheckCircle2, MessagesSquare, Phone } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import Container from "@/components/shared/Container";
import Logo from "@/components/shared/Logo";
import SEO from "@/components/seo/SEO";
import { CONTACT_PHONE, CONTACT_PHONE_DIGITS, SOCIAL } from "@/lib/brand";

const INTER_STACK = `"Fira Sans", Figtree, system-ui, -apple-system, "Segoe UI", sans-serif`;

const WEBINAR_DATE_HUMAN = "10 May 2026 (Sunday)";
const WEBINAR_TIME_HUMAN = "3:00 PM IST";

// Pre-built Google Calendar URL — adjust dates/title as needed.
const GCAL_URL =
  "https://calendar.google.com/calendar/render?action=TEMPLATE" +
  "&text=" +
  encodeURIComponent("ONROL Career Catalyst — Free Webinar") +
  "&dates=20260510T093000Z/20260510T100000Z" + // 3:00–3:30 PM IST = 09:30–10:00 UTC
  "&details=" +
  encodeURIComponent(
    "ONROL Career Catalyst Program — free 30-minute Sunday webinar. Joining link will be sent on WhatsApp + email closer to the date.",
  ) +
  "&location=Online";

export default function ThanksCareerCatalyst() {
  return (
    <main
      style={{ fontFamily: INTER_STACK }}
      className="min-h-screen bg-[#f3f5f8] text-[#0B1640]"
    >
      <SEO
        title="Seat Reserved — ONROL Career Catalyst Webinar"
        description="Your seat for the ONROL Career Catalyst Program webinar is reserved. Joining link arrives on WhatsApp + email."
        path="/thanks/career-catalyst/"
        noindex
      />

      <header className="border-b border-[#0B1640]/10 bg-[#f3f5f8]">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" aria-label="ONROL home">
            <Logo variant="light" className="h-9 w-auto sm:h-10" />
          </Link>
        </div>
      </header>

      <section className="relative overflow-hidden py-20 md:py-28">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[radial-gradient(70%_50%_at_18%_15%,rgba(255,107,71,0.16),transparent_60%),linear-gradient(180deg,#f3f5f8,#f3f5f8_55%,#2d2d2d)]"
        />
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, type: "spring" }}
              className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-emerald-500/15 text-emerald-300"
            >
              <CheckCircle2 className="h-10 w-10" strokeWidth={2.4} />
            </motion.div>

            <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.3em] text-orange-600">
              — You're in
            </p>
            <h1
              className="mt-3 text-[#0B1640]"
              style={{
                fontSize: "clamp(30px, 5vw, 52px)",
                fontWeight: 800,
                letterSpacing: "-0.025em",
                lineHeight: 1.05,
              }}
            >
              Seat reserved. See you Sunday.
            </h1>
            <p className="mt-5 text-[15.5px] leading-relaxed text-[#0B1640]/75 md:text-[17px]">
              Your spot for the <span className="font-bold text-[#0B1640]">Career Catalyst Program</span> webinar
              is locked in for <span className="font-bold text-[#0B1640]">{WEBINAR_DATE_HUMAN}</span> at{" "}
              <span className="font-bold text-[#0B1640]">{WEBINAR_TIME_HUMAN}</span>. The joining link will arrive
              on WhatsApp + email a few hours before the session.
            </p>

            <div className="mt-9 grid gap-3 sm:grid-cols-2">
              <a
                href={GCAL_URL}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center justify-center gap-2 rounded-xl border border-[#0B1640]/10 bg-white px-5 py-3.5 text-[13.5px] font-bold uppercase tracking-wider text-[#0B1640] transition hover:border-orange-300/40 hover:bg-white"
              >
                <Calendar className="h-4 w-4 text-orange-600" />
                Add to Google Calendar
              </a>
              <a
                href={SOCIAL.whatsapp}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-300/40 bg-emerald-500/10 px-5 py-3.5 text-[13.5px] font-bold uppercase tracking-wider text-emerald-200 transition hover:bg-emerald-500/15"
              >
                <FaWhatsapp className="h-4 w-4" />
                Save WhatsApp reminder
              </a>
            </div>

            <div className="mt-12 rounded-2xl border border-[#0B1640]/10 bg-white p-6 text-left">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-orange-600">
                What happens next
              </p>
              <ul className="mt-4 space-y-3 text-[14px] text-[#0B1640]/85">
                <li className="flex items-start gap-3">
                  <MessagesSquare className="mt-0.5 h-4 w-4 shrink-0 text-orange-600" />
                  WhatsApp from our team within 30 minutes with the joining link + curriculum brochure.
                </li>
                <li className="flex items-start gap-3">
                  <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-orange-600" />
                  Reminder 1 day before the webinar + 30 minutes before start.
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-orange-600" />
                  Live session is interactive — bring every question, every doubt.
                </li>
              </ul>
            </div>

            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <a
                href={`tel:${CONTACT_PHONE_DIGITS}`}
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#0B1640]/10 bg-white px-4 text-[12.5px] font-bold uppercase tracking-wider text-[#0B1640]/85 transition hover:border-orange-300/40 hover:bg-white"
              >
                <Phone className="h-4 w-4" />
                {CONTACT_PHONE}
              </a>
              <Link
                to="/"
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#0B1640]/10 bg-white px-4 text-[12.5px] font-bold uppercase tracking-wider text-[#0B1640]/85 transition hover:border-orange-300/40 hover:bg-white"
              >
                Back to ONROL home
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
