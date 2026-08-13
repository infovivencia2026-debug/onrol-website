// Source data for the /proof page — what ONROL builds + what every learner
// ships. Honest framing: until cohort gallery is live, we show "what you'll
// build" archetypes + the 19 already-deployed tools.onrol.in apps.

export interface ProjectArchetype {
  id: string;
  number: string;          // "01", "02", …
  title: string;
  buildDay: string;        // e.g. "Day 2" / "Freelance project"
  category: "Personal" | "Web" | "Automation" | "Agent" | "Content";
  oneLiner: string;
  what: string;
  outcomes: string[];      // 3-5 bullets
  stack: string[];         // tool names
  accent: "cyan" | "violet" | "amber" | "emerald" | "pink";
}

export const projectArchetypes: ProjectArchetype[] = [
  {
    id: "personal-ai-assistant",
    number: "01",
    title: "Personal AI assistant",
    buildDay: "Day 2",
    category: "Personal",
    oneLiner: "A private assistant that knows your notes, docs, and brand voice.",
    what:
      "An AI assistant trained on your own documents using RAG (Retrieval-Augmented Generation). It answers as you, references your notes, and sits one tap away on your phone. Replaces 90% of your 'where did I write that?' searches.",
    outcomes: [
      "Answers questions using your private documents (PDFs, Notion, Google Drive)",
      "Speaks in your voice — locked via brand-voice fingerprint",
      "Accessible via web + phone PWA + WhatsApp",
      "Costs ~₹100-300/month in API fees per user",
    ],
    stack: ["Claude API", "Supabase pgvector", "Bolt.new", "Vercel"],
    accent: "cyan",
  },
  {
    id: "vibe-coded-website",
    number: "02",
    title: "Vibe-coded live website",
    buildDay: "Day 3",
    category: "Web",
    oneLiner: "A real, deployed website built with AI as your pair-programmer.",
    what:
      "A multi-page website you describe in English and AI builds — landing page, features, pricing, contact form, full responsive design. Deployed to a live URL with SSL within hours. Zero hand-coding required.",
    outcomes: [
      "Live deployed URL on Vercel / Netlify / Cloudflare Pages",
      "Custom domain + free SSL",
      "Mobile-responsive, dark mode, animations",
      "Contact form wired to your inbox or CRM",
      "Editable by you forever — no agency lock-in",
    ],
    stack: ["Bolt.new", "Lovable", "v0", "Cursor", "Vercel"],
    accent: "violet",
  },
  {
    id: "backend-automation",
    number: "03",
    title: "Backend automation system",
    buildDay: "Day 4",
    category: "Automation",
    oneLiner: "A workflow that runs while you sleep — across email, CRM, content, ops.",
    what:
      "An end-to-end automation that handles a real, repetitive workflow in your life or business. Lead capture → AI qualification → personalised follow-up → CRM update → Slack alert — all without human input.",
    outcomes: [
      "Saves 5–15 hours/week per deployment",
      "Self-hosted on n8n (free) or Zapier (paid premium)",
      "Connects 5+ tools you already use (Gmail, Notion, Slack, etc)",
      "Fully reversible — you own and modify it forever",
      "Sellable as a freelance service for ₹15k–₹50k per build",
    ],
    stack: ["n8n", "Zapier", "Make.com", "Claude API", "Webhooks"],
    accent: "amber",
  },
  {
    id: "lead-qualifier-agent",
    number: "04",
    title: "WhatsApp / IG lead-qualifier agent",
    buildDay: "Freelance project",
    category: "Agent",
    oneLiner: "An AI agent that captures and qualifies leads 24/7.",
    what:
      "An AI agent that lives on a WhatsApp Business or Instagram DM channel. It greets prospects, asks 3-5 qualifying questions, scores fit, and either books a call or routes the lead to your team. Common ONROL grad freelance project — billed at ₹25k–₹1L per build.",
    outcomes: [
      "Captures 100% of inbound — no missed leads",
      "Qualifies via 3-5 conversational questions",
      "Books calls directly via Cal.com / Calendly integration",
      "Hands hot leads to humans with full context",
      "Cuts response time from hours to seconds",
    ],
    stack: ["WhatsApp Business API", "Claude API", "n8n", "Cal.com"],
    accent: "emerald",
  },
  {
    id: "ai-content-system",
    number: "05",
    title: "AI content system",
    buildDay: "Creator track",
    category: "Content",
    oneLiner: "Voice-locked AI that produces a week of IG / YouTube / LinkedIn content in an hour.",
    what:
      "A content production pipeline using ONROL's tools.onrol.in suite — Hookline for captions, Slidewave for carousels, Reelcraft for reels, Skedly for scheduling, Trendline for viral signal. All locked to your brand voice fingerprint so output sounds like you, not GPT.",
    outcomes: [
      "5-7 IG posts + 1 reel + 1 LinkedIn carousel per week, AI-assisted",
      "All output passes the 'sounds like me' test",
      "60-80% time saved vs manual content production",
      "Auto-scheduled across IG / YouTube / LinkedIn / Threads",
      "Past creator-track grads: 2-5x audience growth in 90 days",
    ],
    stack: ["Hookline", "Slidewave", "Reelcraft", "Skedly", "Trendline"],
    accent: "pink",
  },
];

// Real, deployed proof — the 19 apps at tools.onrol.in
export interface DeployedTool {
  slug: string;
  name: string;
  blurb: string;
  category: "Content" | "Video" | "Brand" | "Lead" | "Automation" | "Image" | "Doc" | "Audio" | "Intel";
}

export const deployedTools: DeployedTool[] = [
  { slug: "trendline",     name: "Trendline",     blurb: "Viral content radar — watch 50 channels, surface tomorrow's viral topics", category: "Intel" },
  { slug: "hookline",      name: "Hookline",      blurb: "IG caption + hashtag generator", category: "Content" },
  { slug: "slidewave",     name: "Slidewave",     blurb: "AI carousel generator with 20+ design presets", category: "Content" },
  { slug: "reelcraft",     name: "Reelcraft",     blurb: "Script → animated reel video", category: "Video" },
  { slug: "skedly",        name: "Skedly",        blurb: "IG + YouTube social scheduler", category: "Content" },
  { slug: "thumbline",     name: "Thumbline",     blurb: "Thumbnail generator with click-score prediction", category: "Video" },
  { slug: "postpilot",     name: "Postpilot",     blurb: "Social media writer for 9 platforms", category: "Content" },
  { slug: "voca",          name: "Voca",          blurb: "Text-to-voice generator", category: "Audio" },
  { slug: "brandmark",     name: "Brandmark",     blurb: "Brand identity generator (logo + colors + voice)", category: "Brand" },
  { slug: "headlift",      name: "Headlift",      blurb: "AI headshot generator", category: "Image" },
  { slug: "stamp",         name: "Stamp",         blurb: "Animated quote/stat/fact card studio", category: "Video" },
  { slug: "subly",         name: "Subly",         blurb: "Auto-caption video — Whisper + ffmpeg", category: "Video" },
  { slug: "boardly",       name: "Boardly",       blurb: "Canva-style multi-page design studio", category: "Image" },
  { slug: "pixly",         name: "Pixly",         blurb: "Image editor — bg-remove, palette, mockup", category: "Image" },
  { slug: "folio",         name: "Folio",         blurb: "PDF toolkit (merge, split, watermark, redact)", category: "Doc" },
  { slug: "resumix",       name: "Resumix",       blurb: "Resume builder with ATS scorer", category: "Doc" },
  { slug: "scribe",        name: "Scribe",        blurb: "Audio/video → transcript with summary", category: "Doc" },
  { slug: "dm-specialist", name: "DM Specialist", blurb: "IG comment-to-DM automation", category: "Lead" },
  { slug: "leadgrab",      name: "Leadgrab",      blurb: "Instagram lead discovery from hashtag/profile/post", category: "Lead" },
];
