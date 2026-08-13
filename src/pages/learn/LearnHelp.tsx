import { useState } from "react";
import { Navigate } from "react-router-dom";
import { ChevronDown, HelpCircle, Mail, MessageCircle, Users, ExternalLink } from "lucide-react";
import { useLmsAuth } from "@/contexts/LmsAuthContext";
import { LearnShell } from "@/components/learn/LearnShell";
import "@/styles/learn-shell.css";

/**
 * `/learn/help` — student-facing help & support.
 * Static FAQ (curated from the recurring support themes) + contact cards
 * for Email + WhatsApp + Community. Public verification of certificates
 * is documented in the FAQ so external recipients know what to ask for.
 */
const FAQ: Array<{ q: string; a: string }> = [
  {
    q: "I forgot my password. How do I sign in?",
    a: "On the login page, click 'Email me a link' and enter your enrolled email. Supabase sends a one-time magic link. If the email is wrong or you can't access it, contact support@onrol.in from any address — we'll verify your identity and reset it.",
  },
  {
    q: "When does my course access expire?",
    a: "Most ONROL programs are evergreen — you keep lifetime access. A few cohort-locked programs expire 90 days after the cohort ends; you'll see the expiry date on your course page if so. Email support if you need an extension.",
  },
  {
    q: "How do live classes work?",
    a: "Live classes appear in 'Today's Classes' on your Home page and under 'Calendar' for the full schedule. The 'Join Now' button activates ~5 minutes before start. Recordings are posted on the lesson page within 24 hours.",
  },
  {
    q: "When are certificates issued?",
    a: "A certificate is auto-generated when you (a) complete every lesson in a course and (b) pass every required quiz/assignment. You'll see it under the Certificates tab and get an email. Each certificate has a public verification code at /verify/<code> that anyone can use to confirm authenticity.",
  },
  {
    q: "I missed a live class. Can I still get credit?",
    a: "Yes — recordings count toward your progress identically to live attendance. The 'attended' badge for live sessions is for engagement tracking only; it doesn't affect course completion.",
  },
  {
    q: "Can I retake a failed quiz?",
    a: "Most quizzes allow up to 3 attempts (some allow unlimited — check the quiz page). Your best score counts toward course completion. If you're stuck after 3 attempts, message your mentor or email support — we can reset the attempt counter.",
  },
  {
    q: "How do I request a refund?",
    a: "Refund requests are honored within 7 days of enrollment, no questions asked, provided you haven't downloaded any course PDFs or attended a live class. Email support@onrol.in with your order ID.",
  },
  {
    q: "Can I download lesson videos for offline viewing?",
    a: "Not directly — videos stream from our CDN and aren't downloadable to prevent piracy. The ONROL mobile app (coming soon) supports offline viewing with DRM. For now, attached PDFs, code samples, and slide decks ARE downloadable from the lesson page.",
  },
];

const CONTACT_EMAIL = "support@onrol.in";
const CONTACT_WA = "+919966577659";

export default function LearnHelp() {
  const { user, loading } = useLmsAuth();
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  if (!loading && !user) return <Navigate to="/learn/login" replace />;

  return (
    <LearnShell>
      <header className="lh-exams-head">
        <div>
          <h1>Help &amp; Support</h1>
          <p>Frequently asked questions, and how to reach us when the FAQ doesn't cover it.</p>
        </div>
      </header>

      <section className="lh-help-contacts">
        <a className="lh-help-contact" href={`mailto:${CONTACT_EMAIL}`}>
          <span className="lh-help-contact-icon"><Mail /></span>
          <div>
            <strong>Email support</strong>
            <span>{CONTACT_EMAIL}</span>
          </div>
        </a>
        <a className="lh-help-contact" href={`https://wa.me/${CONTACT_WA.replace(/[^\d]/g, "")}`} target="_blank" rel="noreferrer">
          <span className="lh-help-contact-icon lh-help-contact-icon--wa"><MessageCircle /></span>
          <div>
            <strong>WhatsApp</strong>
            <span>{CONTACT_WA}</span>
          </div>
        </a>
        <a className="lh-help-contact" href="/community" target="_blank" rel="noreferrer">
          <span className="lh-help-contact-icon lh-help-contact-icon--community"><Users /></span>
          <div>
            <strong>Community</strong>
            <span>Ask peers &amp; mentors <ExternalLink size={11} /></span>
          </div>
        </a>
      </section>

      <section className="lh-help-faq" aria-label="Frequently asked questions">
        <h2 className="lh-help-faq-title"><HelpCircle size={18} /> Frequently asked questions</h2>
        {FAQ.map((item, idx) => {
          const isOpen = openIdx === idx;
          return (
            <details
              key={idx}
              className={`lh-help-faq-item${isOpen ? " is-open" : ""}`}
              open={isOpen}
              onToggle={(e) => {
                if ((e.currentTarget as HTMLDetailsElement).open) setOpenIdx(idx);
                else if (openIdx === idx) setOpenIdx(null);
              }}
            >
              <summary>
                <span>{item.q}</span>
                <ChevronDown className="lh-help-faq-chev" size={18} />
              </summary>
              <div className="lh-help-faq-body">{item.a}</div>
            </details>
          );
        })}
      </section>

      <p className="lh-help-footer">
        Still stuck? Email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> with your enrolled email + a screenshot. Avg response time is &lt;6 hours on weekdays.
      </p>
    </LearnShell>
  );
}
