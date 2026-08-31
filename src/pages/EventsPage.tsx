// /events/ — Free Masterclass schedule + cohort start dates with Event schema.
// Each upcoming event becomes an `Event` JSON-LD entry → eligible for Google
// event rich results + Bing event listings.

import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Calendar, Clock, MapPin, Sparkles } from "lucide-react";
import Container from "@/components/shared/Container";
import Footer from "@/components/shared/Footer";
import SEO from "@/components/seo/SEO";
import { breadcrumbJsonLd, SITE_URL, ORG_NAME, ORG_LOGO } from "@/lib/structuredData";

const INTER_STACK = `"Fira Sans", Figtree, system-ui, -apple-system, "Segoe UI", sans-serif`;

interface OnrolEvent {
  name: string;
  description: string;
  /** ISO 8601 with IST timezone */
  startDate: string;
  /** ISO 8601 with IST timezone */
  endDate: string;
  type: "masterclass" | "cohort" | "workshop";
  durationLabel: string;
  priceLabel: string;
  isFree: boolean;
}

// Generate the next 8 weeks of weekly Free Masterclass events + 6-week cohort
// starts. Auto-rolling — no manual updates needed; the schedule is computed
// each render so dates stay future.
function generateEvents(): OnrolEvent[] {
  const events: OnrolEvent[] = [];
  const now = new Date();

  // Find the next Saturday at 11:00 IST
  const daysUntilSaturday = (6 - now.getDay() + 7) % 7 || 7;
  for (let i = 0; i < 8; i++) {
    const date = new Date(now);
    date.setDate(now.getDate() + daysUntilSaturday + i * 7);
    date.setHours(11, 0, 0, 0);
    const end = new Date(date);
    end.setMinutes(end.getMinutes() + 90);
    events.push({
      name: "ONROL Free Masterclass — AI Agents + Vibe Coding",
      description: "90-minute live session. See ONROL's persona-first AI execution format. Live Q&A with mentors. Test before you commit to the 3-month cohort.",
      startDate: toIst(date),
      endDate: toIst(end),
      type: "masterclass",
      durationLabel: "90 min",
      priceLabel: "Free",
      isFree: true,
    });
  }

  // Find next 1st of month for cohort starts (next 6 starts)
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1, 9, 0, 0);
  for (let i = 0; i < 6; i++) {
    const start = new Date(nextMonth);
    start.setMonth(nextMonth.getMonth() + i);
    const end = new Date(start);
    end.setDate(start.getDate() + 5);
    end.setHours(18, 0, 0, 0);
    events.push({
      name: "ONROL AI Generalist Cohort — 3-Month Intensive",
      description: "3-month live persona-first cohort. Ship 3 deployed AI projects. 12 persona tracks (engineers, students, teachers, founders, sales/marketing, real-estate, working pros, freelancers, content creators, SMB owners, women returning to work, job-seekers).",
      startDate: toIst(start),
      endDate: toIst(end),
      type: "cohort",
      durationLabel: "3 months",
      priceLabel: "INR-priced — see programs page",
      isFree: false,
    });
  }

  return events.sort((a, b) => a.startDate.localeCompare(b.startDate));
}

function toIst(d: Date): string {
  // Convert to ISO 8601 with explicit +05:30 offset
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00+05:30`;
}

function eventJsonLd(e: OnrolEvent) {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: e.name,
    description: e.description,
    startDate: e.startDate,
    endDate: e.endDate,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
    location: {
      "@type": "VirtualLocation",
      url: `${SITE_URL}/programs/`,
    },
    image: ORG_LOGO,
    organizer: {
      "@type": "Organization",
      name: ORG_NAME,
      url: SITE_URL,
    },
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/programs/`,
      price: e.isFree ? "0" : "0", // public price hidden; redirect to registration form
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
      validFrom: new Date().toISOString().slice(0, 10) + "T00:00:00+05:30",
      category: e.isFree ? "Free" : "Paid",
    },
    inLanguage: "en-IN",
  };
}

export default function EventsPage() {
  const events = generateEvents();
  const path = "/events/";

  return (
    <main
      className="min-h-screen bg-[#f3f5f8] text-white"
      style={{ fontFamily: INTER_STACK }}
    >
      <SEO
        title="ONROL Events Calendar — Free AI Masterclass + Cohort Start Dates 2026"
        description="ONROL Free Masterclass weekly + AI Generalist 3-month cohort start dates. Live online events for 12 personas across India. RSVP, no recording, mentors live."
        path={path}
        image="https://onrol.in/og/default.png"
        jsonLd={[
          breadcrumbJsonLd([
            { name: "Home", href: "/" },
            { name: "Events", href: path },
          ]),
          ...events.map(eventJsonLd),
        ]}
      />

      {/* HERO */}
      <section className="relative overflow-hidden pb-12 pt-28 md:pb-16 md:pt-32">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[radial-gradient(70%_50%_at_18%_15%,rgba(255,107,71,0.16),transparent_60%),linear-gradient(180deg,#f3f5f8,#f3f5f8_55%,#2d2d2d)]"
        />
        <Container>
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-orange-300">
            — Events
          </p>
          <h1
            className="mt-3 max-w-4xl text-white"
            style={{
              fontSize: "clamp(34px, 5.6vw, 64px)",
              lineHeight: 1.0,
              letterSpacing: "-0.03em",
              fontWeight: 800,
            }}
          >
            Live AI Masterclass + cohort start dates.
          </h1>
          <p className="lead mt-5 max-w-2xl text-[16px] leading-relaxed text-slate-200 md:text-[17px]">
            Every weekend a new Free Masterclass. Every month a new cohort starts. All live,
            all online (Hyderabad on-campus optional), all persona-first.
          </p>
        </Container>
      </section>

      {/* EVENTS LIST */}
      <section className="bg-[#f3f5f8] pb-20">
        <Container>
          <div className="grid gap-3">
            {events.map((e, i) => (
              <motion.article
                key={`${e.name}-${e.startDate}`}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.32, delay: Math.min(i * 0.03, 0.4) }}
                className={`group rounded-2xl border p-5 transition hover:-translate-y-0.5 sm:p-6 ${
                  e.type === "masterclass"
                    ? "border-orange-300/30 bg-gradient-to-br from-orange-500/10 to-amber-400/5 hover:border-orange-300/55"
                    : "border-orange-300/30 bg-gradient-to-br from-orange-400/10 to-orange-400/5 hover:border-orange-300/55"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] ${
                          e.type === "masterclass"
                            ? "bg-orange-500/20 text-orange-200"
                            : "bg-orange-400/20 text-orange-200"
                        }`}
                      >
                        {e.type === "masterclass" ? "Free Masterclass" : "Cohort"}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11.5px] text-slate-400">
                        <Clock className="h-3 w-3" />
                        {e.durationLabel}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11.5px] text-slate-400">
                        <MapPin className="h-3 w-3" />
                        Online (live)
                      </span>
                      <span
                        className={`inline-flex items-center text-[11.5px] font-bold ${
                          e.isFree ? "text-emerald-300" : "text-slate-300"
                        }`}
                      >
                        {e.priceLabel}
                      </span>
                    </div>
                    <h2
                      className="mt-3 text-white"
                      style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "-0.005em", lineHeight: 1.3 }}
                    >
                      {e.name}
                    </h2>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-[12.5px] text-slate-300">
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-orange-300" />
                        {new Date(e.startDate).toLocaleDateString("en-IN", {
                          weekday: "short",
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      <span className="text-slate-500">·</span>
                      <span>
                        {new Date(e.startDate).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })}{" IST"}
                      </span>
                    </div>
                    <p className="mt-3 text-[13.5px] leading-relaxed text-slate-300">
                      {e.description}
                    </p>
                  </div>
                  <Link
                    to="/programs/"
                    className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-orange-400 px-4 text-[12px] font-bold uppercase tracking-wider text-white shadow-[0_10px_22px_-8px_rgba(255,107,71,0.55)] transition hover:brightness-110"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Reserve seat
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </motion.article>
            ))}
          </div>

          <p className="mt-6 text-center text-[12px] text-slate-500">
            Times in IST · All sessions are live · No recordings shared publicly
          </p>
        </Container>
      </section>

      <Footer />
    </main>
  );
}
