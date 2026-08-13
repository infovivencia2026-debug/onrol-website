import { useState, FormEvent } from "react";
import { Mail, Phone, ArrowRight } from "lucide-react";
import { FaInstagram, FaLinkedinIn, FaWhatsapp, FaYoutube } from "react-icons/fa6";
import { Link } from "react-router-dom";
import { Shell } from "@/components/system/grid";
import { homeData } from "@/lib/homeData";
import {
  CONTACT_EMAIL,
  CONTACT_PHONE,
  CONTACT_PHONE_DIGITS,
  SOCIAL,
} from "@/lib/brand";
import Logo from "@/components/shared/Logo";

const INTER_STACK = `"Fira Sans", Figtree, system-ui, -apple-system, "Segoe UI", sans-serif`;

const Footer = () => {
  const footer = homeData.footer;
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email.trim()) return;
    // Lightweight client-only acknowledge — newsletter wiring happens via the
    // Free Masterclass form. Avoids creating a phantom newsletter list.
    setSubscribed(true);
    setEmail("");
    setTimeout(() => setSubscribed(false), 3500);
  };

  return (
    <footer
      id="footer"
      className="relative border-t border-black/10 bg-white pb-10 pt-16 text-[#0A0A0A]"
      style={{ fontFamily: INTER_STACK }}
    >

      <Shell>
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,minmax(0,1fr))_1.3fr]">
          {/* Brand — original logo (unchanged per user). */}
          <div>
            <Logo variant="dark" className="h-11 w-auto object-contain" />
            <p className="mt-3 text-[10.5px] uppercase tracking-[0.18em] text-[#f46718]">
              India's AI Execution School
            </p>
            <p className="mt-4 max-w-xs text-[13.5px] leading-relaxed text-black/65">
              {footer.description}
            </p>

            <div className="mt-5 space-y-2 text-[13px] text-black/65">
              <a
                href={`tel:${CONTACT_PHONE_DIGITS}`}
                className="flex items-start gap-2 transition hover:text-[#0A0A0A]"
              >
                <Phone className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#f46718]" />
                {CONTACT_PHONE}
              </a>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="flex items-start gap-2 transition hover:text-[#0A0A0A]"
              >
                <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#f46718]" />
                {CONTACT_EMAIL}
              </a>
            </div>

            {/* Social row — all URLs from src/lib/brand.ts. */}
            <div className="mt-5 flex flex-wrap gap-2">
              {[
                { href: SOCIAL.linkedin, Icon: FaLinkedinIn, label: "LinkedIn" },
                { href: SOCIAL.instagram, Icon: FaInstagram, label: "Instagram" },
                { href: SOCIAL.youtube, Icon: FaYoutube, label: "YouTube" },
                { href: SOCIAL.whatsapp, Icon: FaWhatsapp, label: "WhatsApp" },
              ].map(({ href, Icon, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="grid h-9 w-9 place-items-center border border-black/10 bg-white text-black/65 transition hover:border-[#f46718]/40 hover:bg-white hover:text-[#f46718]"
                >
                  <Icon className="h-3.5 w-3.5" />
                </a>
              ))}
            </div>
          </div>

          {/* Programs */}
          <div>
            <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-[#0A0A0A]">
              Programs
            </p>
            <ul className="mt-5 space-y-3 text-[13.5px]">
              {[
                { label: "AI Generalist Program", to: "/programs/ai-generalist/" },
                { label: "Free Masterclass", to: "/programs/" },
              ].map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-black/65 transition hover:text-[#f46718]">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-[#0A0A0A]">
              Resources
            </p>
            <ul className="mt-5 space-y-3 text-[13.5px]">
              {[
                { label: "Blog", to: "/blog/" },
                { label: "Glossary", to: "/glossary/" },
                { label: "Questions answered", to: "/questions/" },
                { label: "AI Skills Quiz", to: "/tools/ai-skills-quiz/" },
                { label: "What learners build", to: "/proof/" },
                { label: "Why AI matters now", to: "/why-now/" },
                { label: "AI course in Hyderabad", to: "/ai-course-in-hyderabad/" },
                { label: "Best AI institute in Hyderabad", to: "/best-ai-institute-in-hyderabad/" },
              ].map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-black/65 transition hover:text-[#f46718]">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-[#0A0A0A]">
              Company
            </p>
            <ul className="mt-5 space-y-3 text-[13.5px]">
              {[
                { label: "About ONROL", to: "/about/" },
                { label: "Contact", to: "/contact/" },
                { label: "ONROL Community", to: "/community/" },
                { label: "Mentors", to: "/#mentors" },
                { label: "Privacy Policy", to: "/privacy-policy" },
                { label: "Terms", to: "/terms-and-conditions" },
              ].map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-black/65 transition hover:text-[#f46718]">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-[#0A0A0A]">
              Newsletter
            </p>
            <p className="mt-5 text-[13.5px] leading-relaxed text-black/65">
              Practical AI playbooks for India — straight to your inbox. No spam.
            </p>
            <form onSubmit={onSubmit} className="mt-4 flex items-center gap-0">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="h-11 min-w-0 flex-1 border border-black/10 bg-white px-4 text-[13px] text-[#0A0A0A] placeholder:text-black/65 focus:border-[#f46718] focus:outline-none"
              />
              <button
                type="submit"
                aria-label="Subscribe"
                className="grid h-11 w-12 shrink-0 place-items-center bg-[#f46718] text-[#0A0A0A] transition hover:brightness-110"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
            {subscribed ? (
              <p className="mt-2 text-[12px] text-emerald-600">
                Thanks — we'll be in touch.
              </p>
            ) : null}
          </div>
        </div>

        {/* Deep-link topic grid — exists primarily to give every page on the site
            a direct internal link to all main pillar pages. Critical for
            getting our 130+ pillar pages out of Google's "Discovered – currently
            not indexed" bucket. Visually understated; SEO weight is real. */}
        <div className="mt-14 grid gap-8 border-t border-black/10 pt-10 md:grid-cols-4">
          <div>
            <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.18em] text-[#f46718]">
              AI Courses by Persona
            </p>
            <ul className="space-y-2 text-[12.5px]">
              {[
                ["AI for Beginners", "/ai-course-for-beginners/"],
                ["AI for Students", "/ai-course-for-students/"],
                ["AI for Working Pros", "/ai-course-for-working-professionals/"],
                ["AI for Freelancers", "/ai-course-for-freelancers/"],
                ["AI for Business Owners", "/ai-course-for-business-owners/"],
                ["AI for Content Creators", "/ai-course-for-content-creators/"],
                ["AI Automation", "/ai-automation-course/"],
                ["All 12 Personas", "/personas/"],
              ].map(([label, to]) => (
                <li key={to}>
                  <Link to={to} className="text-black/65 transition hover:text-[#f46718]">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.18em] text-[#f46718]">
              AI Institutes by City
            </p>
            <ul className="space-y-2 text-[12.5px]">
              {[
                ["Hyderabad", "/ai-institute-hyderabad/"],
                ["Bangalore", "/ai-institute-bangalore/"],
                ["Mumbai", "/ai-institute-mumbai/"],
                ["Delhi NCR", "/ai-institute-delhi/"],
                ["Chennai", "/ai-institute-chennai/"],
                ["Pune", "/ai-institute-pune/"],
                ["Kolkata", "/ai-institute-kolkata/"],
                ["Ahmedabad", "/ai-institute-ahmedabad/"],
                ["Visakhapatnam", "/ai-institute-visakhapatnam/"],
                ["Jaipur", "/ai-institute-jaipur/"],
                ["Coimbatore", "/ai-institute-coimbatore/"],
                ["More cities + states", "/site-map/"],
              ].map(([label, to]) => (
                <li key={to}>
                  <Link to={to} className="text-black/65 transition hover:text-[#f46718]">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.18em] text-[#f46718]">
              AI by Industry
            </p>
            <ul className="space-y-2 text-[12.5px]">
              {[
                ["AI for Healthcare", "/ai-for-healthcare-india/"],
                ["AI for Legal", "/ai-for-legal-india/"],
                ["AI for Fintech", "/ai-for-fintech-india/"],
                ["AI for Hospitality", "/ai-for-hospitality-india/"],
                ["AI for EdTech", "/ai-for-edtech-india/"],
                ["AI for Retail", "/ai-for-retail-india/"],
                ["Generative AI Course", "/generative-ai-course-india/"],
                ["Agentic AI Course", "/agentic-ai-course-india/"],
                ["AI Engineer Course", "/ai-engineer-course-india/"],
              ].map(([label, to]) => (
                <li key={to}>
                  <Link to={to} className="text-black/65 transition hover:text-[#f46718]">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.18em] text-[#f46718]">
              Buyer's guides + comparison
            </p>
            <ul className="space-y-2 text-[12.5px]">
              {[
                ["Best AI Institute in India", "/best-ai-institutes-in-india/"],
                ["Best AI Course in India", "/best-ai-course-in-india/"],
                ["Best AI Bootcamps", "/best-ai-bootcamps-in-india/"],
                ["AI Course Fees in India", "/ai-course-fees-india/"],
                ["AI Institutes Near Me", "/ai-institutes-near-me/"],
                ["How to Choose an AI Institute", "/how-to-choose-ai-institute-india/"],
                ["Academic vs Applied AI", "/academic-ai-vs-applied-ai/"],
                ["AI Execution School", "/ai-execution-school/"],
                ["Top Vibe Coding Training", "/top-vibe-coding-training-india/"],
                ["Full site map", "/site-map/"],
              ].map(([label, to]) => (
                <li key={to}>
                  <Link to={to} className="text-black/65 transition hover:text-[#f46718]">{label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-black/10 pt-6 text-[12px] text-black/65 md:flex-row md:items-center">
          <p>© {new Date().getFullYear()} ONROL. All rights reserved.</p>
          <p className="text-[11px] uppercase tracking-[0.18em] text-black/65">
            India's AI Execution School
          </p>
        </div>
      </Shell>
    </footer>
  );
};

export default Footer;
