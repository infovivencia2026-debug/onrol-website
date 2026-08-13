import { ArrowRight, Mail, MessageCircle, Phone, Sparkles } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import Container from "@/components/shared/Container";
import Footer from "@/components/shared/Footer";
import SEO from "@/components/seo/SEO";
import BreadcrumbTrail from "@/components/seo/BreadcrumbTrail";
import { breadcrumbJsonLd, organizationJsonLd } from "@/lib/structuredData";
import {
  CONTACT_EMAIL,
  CONTACT_PHONE,
  CONTACT_PHONE_DIGITS,
  SOCIAL,
  SITE_URL,
} from "@/lib/brand";

const INTER_STACK = `"Fira Sans", Figtree, system-ui, -apple-system, "Segoe UI", sans-serif`;

const CONTACT_OPTIONS = [
  {
    Icon: Sparkles,
    title: "Free Masterclass",
    body: "90-minute live session — see ONROL in action, ask anything, walk away with the brochure. The fastest path to deciding if we're a fit.",
    cta: "Reserve seat",
    onClick: () => { window.location.href = "/programs/"; },
    accent: "from-orange-500 to-orange-400",
  },
  {
    Icon: FaWhatsapp,
    title: "WhatsApp",
    body: "Quick admissions, fee, or cohort questions. Typical reply within a few hours during India business time.",
    cta: "Open WhatsApp",
    href: SOCIAL.whatsapp,
    accent: "from-emerald-500 to-emerald-400",
  },
  {
    Icon: Mail,
    title: "Email",
    body: "Detailed inquiries, partnerships, press, or admin questions. We reply within one business day.",
    cta: "Send email",
    href: `mailto:${CONTACT_EMAIL}`,
    accent: "from-orange-400 to-orange-300",
  },
  {
    Icon: Phone,
    title: "Phone",
    body: "Prefer a call? Reach the admissions team directly during India business hours (9 AM – 8 PM IST).",
    cta: "Call now",
    href: `tel:${CONTACT_PHONE_DIGITS}`,
    accent: "from-violet-400 to-fuchsia-300",
  },
];

const contactPageJsonLd = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  url: `${SITE_URL}/contact/`,
  name: "Contact ONROL",
  description:
    "Reach ONROL — India's AI Execution School. Free Masterclass, WhatsApp, email, phone. Hyderabad-based, India-wide cohorts.",
  inLanguage: "en-IN",
  mainEntity: {
    "@type": "Organization",
    name: "ONROL",
    url: SITE_URL,
    email: CONTACT_EMAIL,
    telephone: CONTACT_PHONE,
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: CONTACT_PHONE,
        contactType: "customer support",
        email: CONTACT_EMAIL,
        availableLanguage: ["English", "Hindi"],
        areaServed: "IN",
      },
    ],
  },
};

export default function Contact() {
  const path = "/contact/";

  return (
    <main
      className="bg-[#f8f4f1] pt-24 text-[#0A0A0A] md:pt-28"
      style={{ fontFamily: INTER_STACK }}
    >
      <SEO
        title="Contact ONROL — Talk to India's AI Execution School"
        description="Get in touch with ONROL. Free Masterclass, WhatsApp, email, phone. Hyderabad-based, online cohorts across India."
        path={path}
        jsonLd={[
          breadcrumbJsonLd([
            { name: "Home", href: "/" },
            { name: "Contact", href: path },
          ]),
          contactPageJsonLd,
          organizationJsonLd(),
        ]}
      />

      {/* Hero */}
      <section className="relative bg-[#f8f4f1] py-10 md:py-16">
        <div aria-hidden className="absolute left-0 right-0 top-0 h-1 bg-[#f46718]" />
        <Container>
          <BreadcrumbTrail crumbs={[{ name: "Contact", href: path }]} variant="dark" />
          <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.3em] text-[#f46718]">
            Contact
          </p>
          <h1
            className="mt-4 max-w-4xl text-[#0A0A0A]"
            style={{
              fontSize: "clamp(38px, 6vw, 76px)",
              lineHeight: 0.98,
              letterSpacing: "-0.035em",
              fontWeight: 800,
            }}
          >
            Talk to <span className="text-[#f46718]">ONROL</span>.
          </h1>
          <p className="mt-7 max-w-3xl text-lg text-slate-600 md:text-xl md:leading-snug">
            Pick the channel that fits how fast you need an answer. The Free Masterclass is the
            highest-signal option — you see exactly how cohorts run before deciding.
          </p>
        </Container>
      </section>

      {/* Contact options */}
      <section className="bg-[#f8f4f1] py-10 md:py-14">
        <Container>
          <div className="grid gap-4 md:grid-cols-2">
            {CONTACT_OPTIONS.map((opt, i) => {
              const inner = (
                <>
                  <div className={`grid h-12 w-12 place-items-center  bg-gradient-to-br ${opt.accent} text-[#f3f5f8]`}>
                    <opt.Icon className="h-6 w-6" />
                  </div>
                  <h3
                    className="mt-5 text-[#0A0A0A]"
                    style={{ fontSize: "20px", fontWeight: 800, letterSpacing: "-0.015em" }}
                  >
                    {opt.title}
                  </h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-slate-600">{opt.body}</p>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.18em] text-[#f46718] group-hover:gap-2.5">
                    {opt.cta} <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </>
              );
              const baseClass =
                "group flex flex-col  border border-orange-100 bg-white p-7 text-left shadow-[0_18px_44px_-32px_rgba(11,22,64,0.24)] transition hover:-translate-y-1 hover:border-orange-300/50 hover:shadow-[0_28px_54px_-30px_rgba(255,90,0,0.28)]";
              if (opt.onClick) {
                return (
                  <button
                    key={opt.title}
                    type="button"
                    onClick={opt.onClick}
                    className={baseClass}
                  >
                    {inner}
                  </button>
                );
              }
              return (
                <a
                  key={opt.title}
                  href={opt.href}
                  target={opt.href?.startsWith("http") ? "_blank" : undefined}
                  rel="noreferrer"
                  className={baseClass}
                >
                  {inner}
                </a>
              );
              void i;
            })}
          </div>
        </Container>
      </section>

      {/* Address card */}
      <section className="bg-[#f8f4f1] py-12 md:py-16">
        <Container>
          <div className="grid gap-6  border border-orange-100 bg-white p-7 shadow-[0_18px_44px_-32px_rgba(11,22,64,0.24)] md:grid-cols-2 md:p-10">
            <div className="flex items-start gap-3">
              <Phone className="mt-1 h-5 w-5 shrink-0 text-[#f46718]" />
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#f46718]">
                  Phone
                </p>
                <a
                  href={`tel:${CONTACT_PHONE_DIGITS}`}
                  className="mt-1 block text-[14.5px] text-slate-700 hover:text-[#f46718]"
                >
                  {CONTACT_PHONE}
                </a>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MessageCircle className="mt-1 h-5 w-5 shrink-0 text-[#f46718]" />
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#f46718]">
                  Email
                </p>
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="mt-1 block text-[14.5px] text-slate-700 hover:text-[#f46718]"
                >
                  {CONTACT_EMAIL}
                </a>
              </div>
            </div>
          </div>

          {/* Legal entity disclosure — required for Razorpay & GST invoicing */}
          <div className="mt-10  border border-orange-100 bg-white p-6 shadow-[0_18px_44px_-32px_rgba(11,22,64,0.24)] md:p-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#f46718]">
              Legal Entity
            </p>
            <h3 className="mt-2 text-[#0A0A0A]" style={{ fontSize: "22px", fontWeight: 800, letterSpacing: "-0.015em" }}>
              Vivencia Educational Services
            </h3>
            <p className="mt-3 text-[14px] leading-relaxed text-slate-600">
              ONROL is owned and operated by <strong className="text-[#0A0A0A]">Vivencia Educational Services</strong> -
              an Indian education and technology services provider. All course enrolments, fees, invoices, refunds,
              and contracts are issued under Vivencia Educational Services.
            </p>
            <div className="mt-5 grid gap-3 text-[13.5px] text-slate-700 md:grid-cols-2">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-black/55">Business Name</p>
                <p className="mt-1 text-[#0A0A0A]">Vivencia Educational Services</p>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-black/55">Brand / Programme</p>
                <p className="mt-1 text-[#0A0A0A]">ONROL - AI Execution School</p>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-black/55">Sister Website</p>
                <a
                  href="https://vivenciaedu.com"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-block text-[#0A0A0A] underline decoration-orange-300/60 underline-offset-4 hover:decoration-orange-500"
                >
                  vivenciaedu.com
                </a>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-black/55">Email (Accounts)</p>
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="mt-1 block text-[#0A0A0A] hover:text-[#f46718]"
                >
                  {CONTACT_EMAIL}
                </a>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-black/55">Phone</p>
                <a
                  href={`tel:${CONTACT_PHONE_DIGITS}`}
                  className="mt-1 block text-[#0A0A0A] hover:text-[#f46718]"
                >
                  {CONTACT_PHONE}
                </a>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <Footer />
    </main>
  );
}
