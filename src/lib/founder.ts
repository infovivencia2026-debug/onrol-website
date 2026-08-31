// Founder bio + meta — single source of truth used by every pillar page,
// blog post, and the press kit. Edit this file to update everywhere at once.
//
// PHOTO: drop the final 1200Ã—1200 jpg/png at `public/founder-neeraja-reddy.jpg`.
// Until then, <FounderCard> renders an initials avatar.

export interface FounderProfile {
  name: string;
  /** First word of the name — used in conversational copy ("— Dr. Neeraja") */
  shortName: string;
  role: string;
  /** Bio shown on every pillar/blog page. Keep ~80–120 words. */
  bio: string;
  /** One-sentence summary used in JSON-LD + sub-titles. */
  oneLiner: string;
  /** Credential chips shown next to the name on the homepage / about. */
  credentials: string[];
  /** Public profile URL — used in Person schema sameAs. Leave "" until known. */
  links: {
    linkedin?: string;
    twitter?: string;
    youtube?: string;
    instagram?: string;
    website?: string;
  };
  /** Path to a photo in /public. If missing the avatar shows initials. */
  photoPath?: string;
  /** Initials for the placeholder avatar. */
  initials: string;
  /** Why-listen-to-me bullets (3-5 short proof points). */
  proof: string[];
}

export const founder: FounderProfile = {
  name: "Dr. Neeraja Reddy",
  shortName: "Dr. Neeraja",
  role: "Founder, ONROL",
  oneLiner:
    "Founder of ONROL — India's AI Execution School. Doctorate in Business Administration with 16+ years of global experience across healthcare, clinical research, and education — now helping non-coders ship real AI products in days, not months.",
  credentials: [
    "16+ years global experience",
    "Doctorate in Business Administration",
    "Healthcare & EdTech innovator",
  ],
  bio:
    "I started ONROL after watching too many capable, ambitious people finish five AI courses and a hundred YouTube tutorials without shipping a single thing they could show. The market doesn't reward what you know about AI — it rewards what you build with it. Before ONROL, I spent 16+ years in global healthcare and clinical research across the US and UK, then founded Yajur Public School in Warangal and co-founded Vivencia Educational Services Pvt. Ltd — building future-skills programs for students from Grade 3 through undergraduate. ONROL is the next step: a 3-month intensive where every learner ships three live AI projects — a backend automation system, a vibe-coded website, and a fine-tuned personal AI assistant. Not another bootcamp. A Talent-to-Income Engine.",
  proof: [
    "Doctorate in Business Administration · 16+ years global experience across healthcare, clinical research, and education",
    "100+ builders trained across 7 cohorts at ONROL",
    "Founder, Yajur Public School (Warangal) · Co-Founder, Vivencia Educational Services Pvt. Ltd — programs reaching thousands of Indian learners",
    "Active practitioner — runs the 19-tool tools.onrol.in suite used daily by Indian creators and SMBs",
    "Every learner ships 3 live, deployable AI projects in 3 months — hands-on mentorship, not pre-recorded videos",
  ],
  links: {
    // Fill once verified handles are confirmed. Leaving empty avoids accidental
    // wrong-link liability in JSON-LD sameAs.
    // linkedin: "https://www.linkedin.com/in/...",
    // twitter:  "https://x.com/...",
    // youtube:  "https://youtube.com/@onrol",
    // instagram:"https://instagram.com/onrol.in",
  },
  photoPath: "/founder-neeraja-reddy.jpg", // drop final 1200Ã—1200 jpg here
  initials: "NR",
};

// Person schema for JSON-LD — drop into any page that names the founder.
export function founderJsonLd() {
  const sameAs = Object.values(founder.links).filter(Boolean);
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: founder.name,
    jobTitle: founder.role,
    description: founder.oneLiner,
    image: founder.photoPath ? `https://onrol.in${founder.photoPath}` : undefined,
    honorificPrefix: "Dr.",
    hasCredential: {
      "@type": "EducationalOccupationalCredential",
      credentialCategory: "degree",
      name: "Doctorate in Business Administration",
    },
    worksFor: {
      "@type": "EducationalOrganization",
      name: "ONROL",
      url: "https://onrol.in",
    },
    knowsAbout: [
      "Applied AI",
      "AI execution",
      "AI agents and orchestration",
      "Vibe coding",
      "AI automation (n8n, Zapier, Make)",
      "AI education",
      "Healthcare and clinical research",
    ],
    ...(sameAs.length ? { sameAs } : {}),
  };
}
