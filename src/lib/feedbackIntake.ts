// Browser-side client for the CRM's College-Feedback intake.
//
// The onrol.in /feedback wizard posts here instead of the old Google Sheets
// webhook. The CRM (go.onrol.in) de-duplicates the contact into an ISOLATED
// feedback pipeline (never shown in the main Leads list), stores a rich
// feedback_responses record with computed feedback + intent scores, and drives
// follow-up through its own automation. Mirrors the pattern in ./intake.ts.

const CRM_BASE = (import.meta.env.VITE_CRM_BASE as string | undefined) ?? "https://go.onrol.in";
const FEEDBACK_ENDPOINT = `${CRM_BASE}/api/public/feedback`;

export interface FeedbackAnswers {
  // contact
  name: string;
  phone: string;
  email: string;
  // audience + education (students) / attribution (general)
  audience?: string;     // "student" | "general"
  role?: string;         // "Student" | "Working professional" | "Founder / business owner" | "Just exploring AI"
  institute?: string;    // college / institute name (students)
  branch?: string;       // stream / department
  degree?: string;       // degree / course being studied
  year?: string;         // year of study
  howFound?: string;     // "Google" | "Instagram" | "YouTube" | ... (general audience)
  // wizard answers (raw marketing labels)
  session?: string;      // "Loved it" | "Good" | ...
  rating?: string;       // "1".."5"
  clarity?: string;
  confidence?: string;
  liked?: string;
  help?: string;         // "Earn money with AI skills" | "Get a good job / placement" | ...
  why?: string;
  sixMonths?: string;
  contactMethod?: string; // "WhatsApp" | "Phone call" | "Email"
  website?: string;       // honeypot (must stay empty)
}

function eventContext(): { eventCode?: string; collegeName?: string; trainer?: string } {
  if (typeof window === "undefined") return {};
  const p = new URLSearchParams(window.location.search);
  return {
    eventCode: p.get("event") || p.get("eventCode") || undefined,
    collegeName: p.get("college") || p.get("collegeName") || undefined,
    trainer: p.get("trainer") || undefined,
  };
}

const COMM_PREF: Record<string, string> = { "WhatsApp": "whatsapp", "Phone call": "phone", "Email": "email" };

// Map the AI-goal choice onto a CRM "wants" resource + a course interest.
function deriveIntent(a: FeedbackAnswers): { learningIntent: string; wants: string[]; interestArea: string } {
  const goal = `${a.help ?? ""} ${a.sixMonths ?? ""}`.toLowerCase();
  let learningIntent = "Just here to learn more";
  const wants: string[] = [];
  if (/placement|good job|\bjob\b|ready for placements/.test(goal)) {
    learningIntent = "Want career guidance";
    wants.push("Career guidance");
  }
  if (/earn|money|already earning/.test(goal)) {
    learningIntent = "Want a short-term program";
    wants.push("Course & program details");
  }
  if (a.contactMethod) wants.push("Talk to a counsellor"); // they explicitly asked to be contacted
  const interestArea =
    /website|app|full-?stack|develop/.test(goal) ? "Full-Stack Development" :
    /video|post|design/.test(goal) ? "Digital Marketing" :
    "AI / Machine Learning";
  return { learningIntent, wants: [...new Set(wants)], interestArea };
}

export async function submitFeedback(a: FeedbackAnswers): Promise<{ ok: true; intentTier: string }> {
  if (!a.name?.trim() || !a.phone?.trim()) throw new Error("Name and phone are required.");

  const { learningIntent, wants, interestArea } = deriveIntent(a);
  const comments = [
    a.role && `Role: ${a.role}`,
    a.howFound && `Found us via: ${a.howFound}`,
    a.degree && `Studying: ${a.degree}`,
    a.session && `Session: ${a.session}`,
    a.clarity && `AI felt clear: ${a.clarity}`,
    a.confidence && `Confidence: ${a.confidence}`,
    a.sixMonths && `In 6 months: ${a.sixMonths}`,
    a.liked && `Liked: ${a.liked}`,
  ].filter(Boolean).join(" · ");

  const ctx = eventContext();
  const rating = Number(a.rating);
  const res = await fetch(FEEDBACK_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      name: a.name.trim(),
      phone: a.phone.trim(),
      email: a.email?.trim().toLowerCase() || null,
      branch: a.branch?.trim() || null,
      yearOfStudy: a.year?.trim() || null,
      ...ctx,
      // explicit institute (student path) wins over any ?college= URL context
      collegeName: a.institute?.trim() || ctx.collegeName,
      ratingOverall: Number.isFinite(rating) ? rating : null,
      learningIntent,
      careerGoal: [a.why, a.sixMonths].filter(Boolean).join(" — ") || null,
      interestArea,
      courseInterested: interestArea,
      wants,
      commPref: (a.contactMethod && COMM_PREF[a.contactMethod]) || "whatsapp",
      comments: comments || null,
      consent: true, // they submitted contact details asking to be reached
      website: a.website || "", // honeypot passthrough
    }),
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error((detail as { message?: string })?.message || "Could not save right now — please retry.");
  }
  const data = (await res.json().catch(() => ({ ok: true, intentTier: "community" }))) as { ok: true; intentTier?: string };
  return { ok: true, intentTier: data.intentTier || "community" };
}
