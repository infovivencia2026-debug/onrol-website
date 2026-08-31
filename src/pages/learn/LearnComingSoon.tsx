import { Navigate } from "react-router-dom";
import { ClipboardList, Award, HelpCircle, Sparkles } from "lucide-react";
import { useLmsAuth } from "@/contexts/LmsAuthContext";
import { LearnShell } from "@/components/learn/LearnShell";
import "@/styles/learn-shell.css";

/**
 * Shared "coming soon" stub for nav items that exist in the sidebar
 * (Exams, Certificates, Help) but whose full pages haven't shipped yet.
 * Renders inside the same LearnShell so the sidebar/topbar stay live —
 * just swaps the centre pane for a friendly placeholder card.
 */

type Kind = "exams" | "certificates" | "help";

const COPY: Record<Kind, { title: string; body: string; icon: React.ReactNode }> = {
  exams: {
    title: "Exams — coming soon",
    body: "Quizzes inside each lesson grade automatically. A dedicated Exams hub with proctored end-of-cohort assessments is on the way.",
    icon: <ClipboardList />,
  },
  certificates: {
    title: "Certificates — coming soon",
    body: "Your completion certificates will live here once your cohort wraps. We'll email you when the first one is ready to download.",
    icon: <Award />,
  },
  help: {
    title: "Help & Support",
    body: "Need a hand? Email support@onrol.in or DM us on WhatsApp at +91-9XXXX-XXXXX. A self-serve help center lands here soon.",
    icon: <HelpCircle />,
  },
};

export default function LearnComingSoon({ kind }: { kind: Kind }) {
  const { user, loading } = useLmsAuth();
  if (!loading && !user) return <Navigate to="/learn/login" replace />;
  const c = COPY[kind];
  return (
    <LearnShell>
      <section className="lh-stub">
        <div className="lh-stub-icon">{c.icon}</div>
        <h2>{c.title}</h2>
        <p>{c.body}</p>
        <div className="lh-stub-meta">
          <Sparkles size={12} aria-hidden /> Heads-up: we ship features fast — this section is on the next sprint.
        </div>
      </section>
    </LearnShell>
  );
}
