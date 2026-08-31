// JSON-LD structured-data helpers used across SEO components.
// Every helper returns a plain object that can be `JSON.stringify`d into a
// <script type="application/ld+json"> tag.

export const SITE_URL = "https://onrol.in";
export const ORG_NAME = "ONROL";
export const ORG_TAGLINE = "India's AI Execution School";
export const ORG_DESCRIPTION =
  "ONROL is India's AI Execution School. We help students, working professionals, freelancers, content creators, business owners, and teachers move from passively consuming AI tutorials to actually shipping AI products, automations, and agents in real life.";
export const ORG_LOGO = `${SITE_URL}/onrol-logo-dark.png`;

// ── Organization (used once site-wide) ─────────────────────────────────────
export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: ORG_NAME,
    alternateName: [
      "ONROL AI Execution School",
      "India's AI Execution School",
      "Onrol",
    ],
    url: SITE_URL,
    logo: ORG_LOGO,
    description: ORG_DESCRIPTION,
    slogan: "Top universities teach you what AI is. ONROL teaches you what to do with AI.",
    foundingDate: "2025",
    areaServed: { "@type": "Country", name: "India" },
    sameAs: [
      "https://www.linkedin.com/company/onrol",
      "https://www.instagram.com/onrol.in",
      "https://www.youtube.com/@onrolofficial",
    ],
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        availableLanguage: ["English", "Hindi"],
        url: `${SITE_URL}/programs/`,
      },
    ],
  };
}

// ── EducationalOrganization (used on /, programs, course pages) ────────────
export function educationalOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "@id": `${SITE_URL}/#educational-organization`,
    name: ORG_NAME,
    url: SITE_URL,
    logo: ORG_LOGO,
    description: ORG_DESCRIPTION,
    educationalCredentialAwarded: "Certificate of Completion",
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "ONROL Programs",
      itemListElement: [
        {
          "@type": "Course",
          name: "AI Generalist Program",
          description:
            "Live cohort programme. Build deployed AI projects with live URLs, master 15+ industry tools, unlock 6 income paths. No coding required, India-priced.",
          url: `${SITE_URL}/programs/ai-generalist`,
          provider: { "@type": "Organization", name: ORG_NAME, url: SITE_URL },
        },
      ],
    },
  };
}

// ── WebSite (with SearchAction → enables sitelinks search box) ─────────────
export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: ORG_NAME,
    description: ORG_DESCRIPTION,
    publisher: { "@id": `${SITE_URL}/#educational-organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
    inLanguage: "en-IN",
  };
}

// ── Course schema ──────────────────────────────────────────────────────────
export interface CourseSpec {
  name: string;
  description: string;
  url: string;
  duration?: string;        // ISO 8601 duration like "P5D"
  educationalLevel?: string;
  /** Course mode: e.g. "Online", "Blended". */
  courseMode?: string;
  /** Cohort start date in ISO 8601, e.g. "2026-08-04". */
  startDate?: string;
  /** Course price, e.g. "INR 25000". */
  price?: string;
  /** Occupation category for educationalCredentialAwarded relevance. */
  occupationalCategory?: string;
}
export function courseJsonLd(c: CourseSpec) {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    "@id": `${c.url}#course`,
    name: c.name,
    description: c.description,
    url: c.url,
    provider: {
      "@type": "EducationalOrganization",
      "@id": `${SITE_URL}/#educational-organization`,
      name: ORG_NAME,
      url: SITE_URL,
      logo: ORG_LOGO,
      sameAs: [SITE_URL],
    },
    inLanguage: "en-IN",
    isAccessibleForFree: false,
    educationalCredentialAwarded: "Certificate of Completion",
    ...(c.duration ? { timeRequired: c.duration } : {}),
    ...(c.educationalLevel ? { educationalLevel: c.educationalLevel } : {}),
    ...(c.occupationalCategory ? { occupationalCategory: c.occupationalCategory } : {}),
    // hasCourseInstance — required by Google for course rich results.
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: c.courseMode || "Online",
      ...(c.startDate ? { startDate: c.startDate } : {}),
      ...(c.duration ? { courseWorkload: c.duration } : {}),
      location: {
        "@type": "VirtualLocation",
        url: c.url,
      },
      instructor: {
        "@type": "Person",
        name: "Dr. Neeraja Reddy",
        jobTitle: "Founder, ONROL",
        url: SITE_URL,
      },
    },
    ...(c.price
      ? {
          offers: {
            "@type": "Offer",
            price: c.price.replace(/[^\d]/g, ""),
            priceCurrency: "INR",
            url: c.url,
            availability: "https://schema.org/InStock",
            category: "Paid",
          },
        }
      : {}),
  };
}

// ── FAQPage schema (with optional Speakable for voice/AI assistants) ──────
export interface FaqItem { q: string; a: string }
export function faqJsonLd(items: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: ["h1", "h2", ".faq-question", ".faq-answer"],
    },
    mainEntity: items.map((it) => ({
      "@type": "Question",
      name: it.q,
      acceptedAnswer: { "@type": "Answer", text: it.a },
    })),
  };
}

// ── Speakable schema (standalone) ─────────────────────────────────────────
// Use on glossary entries + about page so Google Assistant / Alexa /
// AI engines can read the most important sections aloud.
export function speakableJsonLd(opts: {
  url: string;
  cssSelectors?: string[];
  dateModified?: string;
  datePublished?: string;
} = { url: "" }) {
  // Default dateModified to today so every prerender carries a fresh signal —
  // AI engines reward recent dateModified for "this answer is current" weighting.
  const dateModified = opts.dateModified ?? new Date().toISOString().slice(0, 10);
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    url: opts.url,
    dateModified,
    ...(opts.datePublished ? { datePublished: opts.datePublished } : {}),
    inLanguage: "en-IN",
    isPartOf: {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: ORG_NAME,
      url: SITE_URL,
    },
    publisher: {
      "@type": "EducationalOrganization",
      "@id": `${SITE_URL}/#educational-organization`,
      name: ORG_NAME,
      url: SITE_URL,
      logo: ORG_LOGO,
    },
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: opts.cssSelectors ?? ["h1", "h2", "p.lead", ".speakable"],
    },
  };
}

// ── BreadcrumbList schema ─────────────────────────────────────────────────
export interface Crumb { name: string; href: string }
export function breadcrumbJsonLd(crumbs: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: `${SITE_URL}${c.href}`,
    })),
  };
}

// ── LocalBusiness schema (Hyderabad campus) ──────────────────────────────
// Helps Google's local pack recognise ONROL as a real institute with a
// physical address. Use on the homepage and the Hyderabad city page.
export function localBusinessJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": ["EducationalOrganization", "LocalBusiness"],
    "@id": `${SITE_URL}/#local-business`,
    name: ORG_NAME,
    legalName: "ONROL — AI Execution School",
    url: SITE_URL,
    logo: ORG_LOGO,
    image: ORG_LOGO,
    description: ORG_DESCRIPTION,
    priceRange: "₹₹",
    areaServed: [
      { "@type": "Country", name: "India" },
      { "@type": "AdministrativeArea", name: "Telangana" },
      { "@type": "City", name: "Hyderabad" },
      { "@type": "City", name: "Bangalore" },
      { "@type": "City", name: "Mumbai" },
      { "@type": "City", name: "Delhi" },
      { "@type": "City", name: "Chennai" },
      { "@type": "City", name: "Pune" },
    ],
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        opens: "09:00",
        closes: "21:00",
      },
    ],
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        availableLanguage: ["English", "Hindi", "Telugu"],
        url: `${SITE_URL}/programs/`,
      },
    ],
    sameAs: [
      "https://www.linkedin.com/company/onrol",
      "https://www.instagram.com/onrol.in",
      "https://www.youtube.com/@onrolofficial",
    ],
  };
}

// ── HowTo schema (step-by-step guides) ────────────────────────────────────
// ItemList — ranked listicle pages ("Top N X in Y").
// Drives Google's list rich result + the AI-search list cards that summarise
// ranked comparison pages. Each itemListElement carries position + name; we
// also embed url/description/image so Google builds a richer card.
export interface ItemListEntry {
  position: number;
  name: string;
  description?: string;
  url?: string;
  image?: string;
}
export function itemListJsonLd(opts: {
  name: string;
  description?: string;
  url: string;
  items: ItemListEntry[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${opts.url}#itemlist`,
    name: opts.name,
    ...(opts.description ? { description: opts.description } : {}),
    url: opts.url,
    numberOfItems: opts.items.length,
    itemListOrder: "https://schema.org/ItemListOrderAscending",
    itemListElement: opts.items.map((it) => ({
      "@type": "ListItem",
      position: it.position,
      name: it.name,
      ...(it.url ? { url: it.url } : {}),
      ...(it.description || it.image
        ? {
            item: {
              "@type": "Thing",
              name: it.name,
              ...(it.description ? { description: it.description } : {}),
              ...(it.url ? { url: it.url } : {}),
              ...(it.image ? { image: it.image } : {}),
            },
          }
        : {}),
    })),
  };
}

export interface HowToStep { name: string; text: string }
export interface HowToSpec {
  name: string;
  description: string;
  url: string;
  steps: HowToStep[];
  totalTime?: string; // ISO 8601 duration like "PT1H"
}
export function howToJsonLd(h: HowToSpec) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: h.name,
    description: h.description,
    url: h.url,
    inLanguage: "en-IN",
    ...(h.totalTime ? { totalTime: h.totalTime } : {}),
    step: h.steps.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: s.name,
      text: s.text,
    })),
  };
}

// ── VideoObject schema ────────────────────────────────────────────────────
export interface VideoSpec {
  name: string;
  description: string;
  thumbnailUrl: string;
  uploadDate: string;
  contentUrl: string;
  embedUrl?: string;
  duration?: string; // ISO 8601 like "PT2M30S"
}
// Normalise an uploadDate so Google Search Console doesn't complain. Schema.org
// VideoObject expects ISO 8601 with a timezone offset. If the caller passes
// just "2026-04-15", we promote it to "2026-04-15T00:00:00+05:30" (IST) so
// the GSC "Datetime property uploadDate is missing a timezone" warning
// disappears. If the caller already passed a full ISO string we leave it.
function normalizeIsoDate(input: string): string {
  // Already has a timezone marker (Z, +HH:MM, or -HH:MM)
  if (/(Z|[+-]\d{2}:?\d{2})$/.test(input)) return input;
  // Date-only (YYYY-MM-DD) → midnight IST
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return `${input}T00:00:00+05:30`;
  // Date+time without offset → assume IST
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(input)) return `${input}+05:30`;
  // Anything else: pass through (may still warn, but caller controls it)
  return input;
}

export function videoObjectJsonLd(v: VideoSpec) {
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: v.name,
    description: v.description,
    thumbnailUrl: v.thumbnailUrl,
    uploadDate: normalizeIsoDate(v.uploadDate),
    contentUrl: v.contentUrl,
    ...(v.embedUrl ? { embedUrl: v.embedUrl } : {}),
    ...(v.duration ? { duration: v.duration } : {}),
    publisher: {
      "@type": "Organization",
      name: ORG_NAME,
      logo: { "@type": "ImageObject", url: ORG_LOGO },
    },
    inLanguage: "en-IN",
  };
}

// ── QAPage / Question / Answer schema ─────────────────────────────────────
export interface QAItem { question: string; answer: string; url?: string }
export function qaPageJsonLd(items: QAItem[], pageUrl: string, pageName: string) {
  return {
    "@context": "https://schema.org",
    "@type": "QAPage",
    "@id": `${pageUrl}#qapage`,
    url: pageUrl,
    name: pageName,
    inLanguage: "en-IN",
    mainEntity: items.map((it) => ({
      "@type": "Question",
      name: it.question,
      ...(it.url ? { url: it.url } : {}),
      acceptedAnswer: {
        "@type": "Answer",
        text: it.answer,
        author: {
          "@type": "Organization",
          name: ORG_NAME,
          url: SITE_URL,
        },
      },
    })),
  };
}

// ── Speakable schema (voice/AI assistant friendly summaries) ─────────────
export function speakableSpecification(cssSelectors: string[]) {
  return {
    "@type": "SpeakableSpecification",
    cssSelector: cssSelectors,
  };
}

// ── DefinedTerm + DefinedTermSet (glossary) ───────────────────────────────
export interface DefinedTermSpec {
  slug: string;
  term: string;
  description: string;
  category?: string;
  alsoKnownAs?: string[];
}
export function definedTermJsonLd(t: DefinedTermSpec) {
  return {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    "@id": `${SITE_URL}/glossary/${t.slug}/#term`,
    name: t.term,
    description: t.description,
    url: `${SITE_URL}/glossary/${t.slug}/`,
    inDefinedTermSet: `${SITE_URL}/glossary/#set`,
    ...(t.category ? { termCode: t.category } : {}),
    ...(t.alsoKnownAs && t.alsoKnownAs.length ? { alternateName: t.alsoKnownAs } : {}),
  };
}
export function definedTermSetJsonLd(terms: { slug: string; term: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "DefinedTermSet",
    "@id": `${SITE_URL}/glossary/#set`,
    name: "ONROL AI Glossary",
    description:
      "Plain-English definitions of the AI terms practitioners actually use — models, tools, techniques, and concepts.",
    url: `${SITE_URL}/glossary/`,
    hasDefinedTerm: terms.map((t) => ({
      "@type": "DefinedTerm",
      "@id": `${SITE_URL}/glossary/${t.slug}/#term`,
      name: t.term,
      url: `${SITE_URL}/glossary/${t.slug}/`,
    })),
  };
}

// ── Article schema (blog posts) ───────────────────────────────────────────
export interface ArticleSpec {
  headline: string;
  description: string;
  url: string;
  image?: string;
  datePublished: string;
  dateModified?: string;
  authorName?: string;
  authorUrl?: string;
  /** Optional richer signals for BlogPosting rich snippets. */
  articleSection?: string;
  keywords?: string[];
  wordCount?: number;
}
export function articleJsonLd(a: ArticleSpec) {
  // Use BlogPosting (a subtype of Article) so Google's rich-result
  // pipeline treats these as blog content — eligible for the dedicated
  // "From the web" carousel and richer date/author display.
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${a.url}#blogposting`,
    mainEntityOfPage: { "@type": "WebPage", "@id": a.url },
    headline: a.headline,
    description: a.description,
    image: a.image || ORG_LOGO,
    url: a.url,
    datePublished: a.datePublished,
    dateModified: a.dateModified || a.datePublished,
    author: a.authorName
      ? { "@type": "Person", name: a.authorName, ...(a.authorUrl ? { url: a.authorUrl } : {}) }
      : { "@type": "Organization", name: ORG_NAME, url: SITE_URL },
    publisher: {
      "@type": "Organization",
      name: ORG_NAME,
      logo: { "@type": "ImageObject", url: ORG_LOGO },
    },
    ...(a.articleSection ? { articleSection: a.articleSection } : {}),
    ...(a.keywords && a.keywords.length ? { keywords: a.keywords.join(", ") } : {}),
    ...(typeof a.wordCount === "number" ? { wordCount: a.wordCount } : {}),
    inLanguage: "en-IN",
  };
}
