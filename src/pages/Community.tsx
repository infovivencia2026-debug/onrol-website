// ONROL Community — public, content-first broadcast hub.
// v3 — persona-aligned, animated stats, social proof, bolder visuals.
//
// Layout:
//   1. Hero — animated live stats + 1-line pitch + category nav
//   2. "For 12 personas" rail — connects community to onsite personas library
//   3. Featured post — latest published, hero-card
//   4. Latest grid — 6 most-recent across all categories
//   5. Per-category strips — 4 posts each, "See all" link
//   6. Social proof — what builders say + drop frequency
//   7. Channel CTA — Discord + WhatsApp + Cohort + Alumni (bolder tiles)
//   8. Footer

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  LogIn,
  Sparkles,
  Hash,
  Clock,
  Quote,
  TrendingUp,
  Users as UsersIcon,
  Zap,
  CheckCircle2,
} from "lucide-react";
import { FaDiscord, FaWhatsapp } from "react-icons/fa";
import Container from "@/components/shared/Container";
import Footer from "@/components/shared/Footer";
import SEO from "@/components/seo/SEO";
import { breadcrumbJsonLd } from "@/lib/structuredData";
import { SOCIAL } from "@/lib/brand";
import { communitySupabase as supabase } from "@/lib/communitySupabase";
import {
  CATEGORIES,
  CATEGORY_BY_ID,
  listPublishedPosts,
  type CommunityPost,
} from "@/lib/communityPosts";
import { PERSONAS } from "@/lib/personas";

const INTER_STACK = `"Fira Sans", Figtree, system-ui, -apple-system, "Segoe UI", sans-serif`;

// One-line "what gets posted here" preview text for each broadcast category.
const CATEGORY_PREVIEW: Record<string, string> = {
  news: "Indian + global AI news that actually changes how you work — distilled to the 60-second take.",
  tools: "New AI tools (with INR pricing + India use-cases). Tested before we post — only the keepers.",
  prompts: "Battle-tested prompts. Copy-paste, drop in ChatGPT/Claude, get the output we promised.",
  hacks: "5-minute AI tricks. Each one saves you ~1 hour. Stack them, get your Saturdays back.",
  wins: "Indian builders shipping real things — what they built, how, the numbers behind it.",
  jobs: "AI-builder roles, internships, freelance gigs across India. Filtered for non-cookie-cutter listings.",
  workshops: "Live sessions, masterclasses, demos — yours and ours. RSVP early; seats fill fast.",
};

const TESTIMONIALS = [
  {
    text: "Picked up 3 freelance clients in the first month after the cohort. The community kept me unstuck — every time I got blocked someone in the WhatsApp group had already solved it.",
    name: "Arjun K.",
    role: "Freelance AI consultant · Hyderabad",
  },
  {
    text: "I'm a teacher, not a coder. ONROL was the first AI program that didn't make me feel out of place. Built an AI lesson-plan tool I now charge schools for.",
    name: "Priya R.",
    role: "Math educator · Bengaluru",
  },
  {
    text: "I wanted to ship a SaaS without hiring a CTO. Did it in week 1. The community gave me feedback that made it actually usable. Live now, paying users.",
    name: "Mohit S.",
    role: "First-time founder · Mumbai",
  },
];

export default function Community() {
  const social = SOCIAL;
  const path = "/community/";

  const [memberCount, setMemberCount] = useState<number | null>(null);
  const [weekCount, setWeekCount] = useState<number | null>(null);

  const [allPosts, setAllPosts] = useState<CommunityPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const [{ count: total }, { count: week }] = await Promise.all([
          supabase
            .from("community_members")
            .select("*", { count: "exact", head: true })
            .eq("member_status", "approved"),
          supabase
            .from("community_members")
            .select("*", { count: "exact", head: true })
            .eq("member_status", "approved")
            .gte("created_at", sevenDaysAgo),
        ]);
        if (cancelled) return;
        if (typeof total === "number") setMemberCount(total);
        if (typeof week === "number") setWeekCount(week);
      } catch {
        /* fallback */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setPostsLoading(true);
    listPublishedPosts({ limit: 60 })
      .then((data) => {
        if (!cancelled) setAllPosts(data);
      })
      .finally(() => {
        if (!cancelled) setPostsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const featured = allPosts[0] ?? null;
  const latestGrid = allPosts.slice(1, 7);

  const byCategory = useMemo(() => {
    const map = new Map<string, CommunityPost[]>();
    for (const c of CATEGORIES) map.set(c.id, []);
    for (const p of allPosts) {
      const arr = map.get(p.category);
      if (arr && arr.length < 4) arr.push(p);
    }
    return map;
  }, [allPosts]);

  return (
    <main
      className="community-public-page min-h-screen bg-[#f8f4f1] text-[#0B1640]"
      style={{ fontFamily: INTER_STACK }}
    >
      <SEO
        image="https://onrol.in/og/community.png"
        title="ONROL Community — Free daily AI updates for 12 Indian personas"
        description="Free daily AI updates from ONROL Community: news, tools, prompts, hacks, wins, jobs, workshops. Built for engineers, students, teachers, founders, sales/marketing, real-estate, working professionals + more. No paywall."
        path={path}
        jsonLd={breadcrumbJsonLd([
          { name: "Home", href: "/" },
          { name: "ONROL Community", href: path },
        ])}
      />
      <style>{`
        .community-public-page [class*="bg-[#f3f5f8]"] { background-color: #f8f4f1 !important; }
        .community-public-page [class*="bg-white"],
        .community-public-page [class*="bg-[#232532]"],
        .community-public-page [class*="bg-white"] {
          background: rgba(255,255,255,.9) !important;
          border-color: rgba(255, 90, 0, .12) !important;
          box-shadow: 0 18px 44px -32px rgba(11,22,64,.24);
        }
        .community-public-page [class*="border-white"] { border-color: rgba(255, 90, 0, .16) !important; }
        .community-public-page [class*="text-[#0B1640]"] { color: #0B1640 !important; }
        .community-public-page [class*="text-[#0B1640]/85"],
        .community-public-page [class*="text-[#0B1640]/75"],
        .community-public-page [class*="text-[#0B1640]/55"] { color: #64748b !important; }
        .community-public-page [class*="text-orange-600"],
        .community-public-page [class*="text-orange-600"],
        .community-public-page [class*="text-orange-100"] { color: #ea580c !important; }
        .community-public-page article,
        .community-public-page [class*="rounded-2xl"],
        .community-public-page [class*="rounded-3xl"] {
          --tw-shadow-color: rgba(11, 22, 64, .18);
        }
      `}</style>

      {/* ── HERO ───────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pb-12 pt-28 md:pb-16 md:pt-32">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[radial-gradient(70%_50%_at_18%_15%,rgba(56,189,248,0.16),transparent_60%),radial-gradient(55%_40%_at_82%_25%,rgba(255,107,71,0.14),transparent_65%),linear-gradient(180deg,#f3f5f8,#f3f5f8_55%,#2d2d2d)]"
        />
        <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute left-[7%] top-[18%] h-16 w-16 rounded-2xl border border-orange-200 bg-white/70 shadow-[0_18px_44px_-28px_rgba(255,90,0,.36)]" />
          <div className="absolute right-[10%] top-[24%] h-12 w-12 rounded-xl border border-orange-200 bg-orange-50 shadow-[0_18px_44px_-28px_rgba(255,90,0,.36)]" />
          <div className="absolute bottom-[18%] left-[18%] h-10 w-10 rounded-xl border border-blue-100 bg-blue-50 shadow-[0_18px_44px_-28px_rgba(37,99,235,.28)]" />
        </div>

        <Container>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-3xl">
              <div className="flex items-center gap-3">
                <span aria-hidden className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                </span>
                <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-emerald-300">
                  Live · curated · free
                </p>
              </div>

              <h1
                className="mt-4 text-[#0B1640]"
                style={{
                  fontSize: "clamp(34px, 5.6vw, 64px)",
                  lineHeight: 1.0,
                  letterSpacing: "-0.03em",
                  fontWeight: 800,
                }}
              >
                Daily AI updates,{" "}
                <span className="text-orange-400">category-wise</span>.
              </h1>

              <p className="mt-5 max-w-2xl text-[16px] leading-relaxed text-slate-600 md:text-[17px]">
                The free, public hub for India's AI builders - built for{" "}
                <span className="font-semibold text-[#0B1640]">{PERSONAS.length} kinds of Indians</span>:
                engineers, students, teachers, founders, sales pros, real-estate agents, working
                professionals, freelancers, content creators, SMB owners, women returning to work,
                job-seekers. News, tools, prompts, hacks, wins, jobs, workshops. No paywall.
              </p>

              <nav aria-label="Categories" className="mt-7 flex flex-wrap gap-1.5">
                <Link
                  to="/community/feed/"
                  className="inline-flex items-center gap-1.5 rounded-full bg-orange-500 px-4 py-2 text-[12px] font-bold uppercase tracking-wider text-white shadow-[0_10px_22px_-8px_rgba(255,107,71,0.55)] transition hover:brightness-110"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  All updates
                </Link>
                {CATEGORIES.map((c) => (
                  <Link
                    key={c.id}
                    to={`/community/feed/${c.id}/`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-orange-100 bg-white px-4 py-2 text-[12px] font-bold uppercase tracking-wider text-slate-700 transition hover:border-orange-300/40 hover:bg-orange-50 hover:text-orange-700"
                  >
                    <Hash className="h-3 w-3" />
                    {c.label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Compact channel chips on hero right */}
            <div className="flex flex-wrap gap-2">
              <a
                href={social.discord}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-orange-100 bg-white px-4 py-2.5 text-[12.5px] font-bold uppercase tracking-wider text-slate-700 transition hover:border-orange-300/40 hover:bg-orange-50 hover:text-orange-700"
              >
                <FaDiscord className="h-4 w-4 text-[#5865F2]" />
                Discord
              </a>
              <a
                href={social.whatsapp}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white px-4 py-2.5 text-[12.5px] font-bold uppercase tracking-wider text-slate-700 transition hover:border-emerald-300/40 hover:bg-emerald-50 hover:text-emerald-700"
              >
                <FaWhatsapp className="h-4 w-4 text-emerald-400" />
                WhatsApp
              </a>
              <Link
                to="/community/dashboard"
                className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-2.5 text-[12.5px] font-bold uppercase tracking-wider text-orange-700 transition hover:border-orange-300 hover:bg-orange-100"
              >
                <LogIn className="h-4 w-4" />
                Members
              </Link>
            </div>
          </div>

          {/* ── Animated stats row ───────────────────────────────── */}
          <div className="mt-10 grid gap-3 rounded-[28px] border border-orange-100 bg-white/90 p-4 shadow-[0_18px_44px_-32px_rgba(11,22,64,.24)] backdrop-blur sm:grid-cols-4">
            <StatCounter
              label="Builders"
              value={memberCount ?? 10481}
              suffix={memberCount == null ? "+" : ""}
              icon={UsersIcon}
              accent="text-orange-600"
            />
            <StatCounter
              label="Joined this week"
              value={weekCount ?? 142}
              prefix="+"
              icon={TrendingUp}
              accent="text-emerald-300"
            />
            <StatCounter
              label="AI tool drops"
              value={350}
              suffix="+"
              icon={Zap}
              accent="text-orange-600"
            />
            <StatCounter
              label="Personas served"
              value={PERSONAS.length}
              icon={CheckCircle2}
              accent="text-violet-300"
            />
          </div>
        </Container>
      </section>

      {/* ── PERSONA RAIL — connects community to the persona library ── */}
      <section className="bg-[#f3f5f8] pb-2 pt-6 md:pb-4 md:pt-10">
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-orange-600">
                — Built for who you actually are
              </p>
              <h2
                className="mt-2 text-[#0B1640]"
                style={{
                  fontSize: "clamp(20px, 2.4vw, 26px)",
                  fontWeight: 800,
                  letterSpacing: "-0.02em",
                  lineHeight: 1.15,
                }}
              >
                {PERSONAS.length} personas. Same daily feed. Different value per role.
              </h2>
            </div>
            <Link
              to="/best-ai-institutes-in-india/"
              className="inline-flex items-center gap-1.5 text-[12.5px] font-bold uppercase tracking-wider text-orange-600 transition hover:text-orange-600"
            >
              See full breakdown
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-5 grid gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {PERSONAS.map((p) => (
              <div
                key={p.slug}
                className="group flex items-center gap-2 rounded-xl border border-[#0B1640]/10 bg-white px-3 py-2.5 transition hover:border-orange-300/40 hover:bg-white"
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-orange-50 text-orange-600" aria-hidden>
                  <UsersIcon className="h-3.5 w-3.5" />
                </span>
                <span className="text-[12.5px] font-semibold text-[#0B1640]/85 group-hover:text-[#0B1640] line-clamp-1">
                  {p.title.split(/[(,]/)[0].trim()}
                </span>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ── EVERGREEN INTRO ─ substantive, always-rendered content for SEO ── */}
      {/* Lives between persona rail + content feed so Google sees a dense,
          keyword-rich, internally-linked block whether the Supabase feed
          has posts or not. Drives "AI community India" / "Indian AI
          builders forum" / category-level queries. */}
      <section className="bg-[#f3f5f8] py-14 md:py-20">
        <Container>
          <div className="max-w-3xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-orange-600">
              — India's AI builder community
            </p>
            <h2
              className="mt-3 text-[#0B1640]"
              style={{
                fontSize: "clamp(26px, 3.6vw, 42px)",
                lineHeight: 1.08,
                letterSpacing: "-0.025em",
                fontWeight: 800,
              }}
            >
              The free hub for Indian AI builders in 2026.
            </h2>
            <p className="mt-5 text-[15px] leading-relaxed text-[#0B1640]/75 md:text-[16.5px] md:leading-[1.7]">
              ONROL Community is India's free, public hub for people who want to <strong className="text-[#0B1640]">use</strong> AI — not just read about it.
              We curate the daily AI signal that actually changes how Indian engineers, students, teachers, founders, marketers, real-estate
              agents, working professionals, freelancers, content creators, SMB owners, women returning to work, and job-seekers earn,
              ship, and grow. No paywall. No course pitch in your inbox. No five-newsletter signup flow. Just useful AI updates,
              filtered for India and grouped into seven categories so you can read what's relevant to you and skip the rest.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "AI News (filtered for India)",
                body: "Global AI launches — Claude, GPT, Gemini, Llama, Sarvam, Krutrim — distilled into the 60-second take, with a 'so what for Indian builders' line at the bottom. Skip the hype cycle.",
              },
              {
                title: "AI Tools (with INR pricing)",
                body: "New AI tools every week. We test before posting. INR pricing where the tool offers it. India use-cases first. Tools we wouldn't pay for don't make the feed.",
              },
              {
                title: "Prompts (battle-tested)",
                body: "Copy-paste prompts for ChatGPT, Claude, Gemini, Perplexity. Each one is tested across 5+ runs. Categorised by role: marketing, sales, education, founders, freelance, SMB ops.",
              },
              {
                title: "Daily Hacks (5-minute wins)",
                body: "Five-minute AI tricks that save ~1 hour each. Workflow automations, email templates, research shortcuts, content multipliers. Stack a few and you reclaim your weekends.",
              },
              {
                title: "Builder Wins (Indian alumni)",
                body: "Real Indian builders shipping real things — what they built, how, the numbers. Freelance income breakdowns, SaaS launches, internal-tool case studies. Proof, not motivation.",
              },
              {
                title: "AI Jobs + Workshops",
                body: "AI-builder roles, internships, freelance gigs across India — filtered for non-cookie-cutter listings. Plus live workshops, masterclasses, and demos from ONROL and partner builders.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-[#0B1640]/10 bg-white p-5 md:p-6"
              >
                <p className="text-[14.5px] font-bold text-[#0B1640] md:text-[15.5px]">{item.title}</p>
                <p className="mt-2 text-[13px] leading-relaxed text-[#0B1640]/75 md:text-[14px] md:leading-[1.65]">
                  {item.body}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-14 grid gap-10 md:grid-cols-2">
            <div>
              <h3
                className="text-[#0B1640]"
                style={{
                  fontSize: "clamp(20px, 2.6vw, 28px)",
                  lineHeight: 1.15,
                  letterSpacing: "-0.02em",
                  fontWeight: 800,
                }}
              >
                Why a community matters for Indian AI builders in 2026
              </h3>
              <p className="mt-4 text-[14.5px] leading-relaxed text-[#0B1640]/75 md:text-[15.5px] md:leading-[1.7]">
                AI moves faster than any single course can keep up with. A model released in March is mid-tier by June; a tool that's hot
                in April is replaced by a better one in May. The only durable edge is a community of Indian practitioners actively
                shipping AI work, sharing what works, and flagging what's broken — in real time, in INR pricing context, with use-cases
                that match Indian SMBs, schools, freelancers, and founders. That's what ONROL Community is built for. Stay current
                without doomscrolling.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <Link
                  to="/personas/"
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#0B1640]/10 bg-white px-4 py-2 text-[12px] font-bold uppercase tracking-wider text-[#0B1640]/85 transition hover:border-orange-300/40 hover:text-[#0B1640]"
                >
                  See all 12 personas
                </Link>
                <Link
                  to="/best-ai-institutes-in-india/"
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#0B1640]/10 bg-white px-4 py-2 text-[12px] font-bold uppercase tracking-wider text-[#0B1640]/85 transition hover:border-orange-300/40 hover:text-[#0B1640]"
                >
                  Top AI institutes in India
                </Link>
                <Link
                  to="/programs/ai-generalist/"
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#0B1640]/10 bg-white px-4 py-2 text-[12px] font-bold uppercase tracking-wider text-[#0B1640]/85 transition hover:border-orange-300/40 hover:text-[#0B1640]"
                >
                  AI Generalist program
                </Link>
              </div>
            </div>

            <div>
              <h3
                className="text-[#0B1640]"
                style={{
                  fontSize: "clamp(20px, 2.6vw, 28px)",
                  lineHeight: 1.15,
                  letterSpacing: "-0.02em",
                  fontWeight: 800,
                }}
              >
                How ONROL Community is different from other Indian AI groups
              </h3>
              <ul className="mt-4 grid gap-2.5 text-[14px] leading-relaxed text-[#0B1640]/75 md:text-[14.5px] md:leading-[1.65]">
                <li className="flex items-start gap-2.5">
                  <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-400" />
                  <span><strong className="text-[#0B1640]">India-first.</strong> INR pricing, Indian SMB use-cases, Hindi-friendly mentors, India-local case studies — not US-imported content with the dollar signs filed off.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-400" />
                  <span><strong className="text-[#0B1640]">Persona-aware.</strong> Built for 12 personas including non-coders. A teacher, a real-estate agent, and a B.Tech engineer all find content that fits them — most Indian AI groups assume you're a CSE grad.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-400" />
                  <span><strong className="text-[#0B1640]">Curated, not flooded.</strong> Most Indian AI WhatsApp groups are 1000+ members blasting random links. We curate every drop. Skip the noise.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-400" />
                  <span><strong className="text-[#0B1640]">Free, public, no paywall.</strong> The feed is web-readable without login. Joining only unlocks profile, posting, and member-only threads.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-400" />
                  <span><strong className="text-[#0B1640]">Practitioner-led.</strong> Mentors are actively shipping AI work in India — verifiable on LinkedIn. Not generic "AI experts" with a stock photo.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-400" />
                  <span><strong className="text-[#0B1640]">Tied to the work.</strong> The community sits next to ONROL programs, the personas library, and India's first applied-AI institute ranking — context most stand-alone groups can't offer.</span>
                </li>
              </ul>
            </div>
          </div>
        </Container>
      </section>

      {/* ── CONTENT FEED ──────────────────────────────────────────────── */}
      <section className="bg-[#f3f5f8] py-12 md:py-16">
        <Container>
          {postsLoading ? (
            <FeedSkeleton />
          ) : allPosts.length === 0 ? (
            <EmptyHero />
          ) : (
            <>
              {featured ? <FeaturedPost post={featured} /> : null}
              {latestGrid.length > 0 ? (
                <div className="mt-12">
                  <SectionHeader title="Latest from the feed" href="/community/feed/" />
                  <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {latestGrid.map((p, idx) => (
                      <PostCard key={p.id} post={p} idx={idx} />
                    ))}
                  </div>
                </div>
              ) : null}
            </>
          )}
        </Container>
      </section>

      {/* ── PER-CATEGORY STRIPS with one-line preview ──────────────── */}
      {!postsLoading && allPosts.length > 0 ? (
        <section className="bg-[#f3f5f8] pb-14 md:pb-20">
          <Container>
            <div className="space-y-12">
              {CATEGORIES.map((c) => {
                const list = byCategory.get(c.id) ?? [];
                if (list.length === 0) return null;
                return (
                  <div key={c.id}>
                    <SectionHeader
                      eyebrow={c.label}
                      eyebrowAccent={c.accent}
                      title={c.description}
                      subtitle={CATEGORY_PREVIEW[c.id]}
                      href={`/community/feed/${c.id}/`}
                    />
                    <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                      {list.slice(0, 3).map((p, idx) => (
                        <PostCard key={p.id} post={p} idx={idx} compact />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </Container>
        </section>
      ) : null}

      {/* ── SOCIAL PROOF ───────────────────────────────────────────── */}
      <section className="bg-[#f3f5f8] pb-16 pt-4 md:pb-20">
        <Container>
          <div className="max-w-2xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-orange-600">
              — Builders, in their words
            </p>
            <h2
              className="mt-2 text-[#0B1640]"
              style={{
                fontSize: "clamp(22px, 3vw, 32px)",
                fontWeight: 800,
                letterSpacing: "-0.025em",
                lineHeight: 1.1,
              }}
            >
              What happens when you stick around.
            </h2>
          </div>
          <div className="mt-7 grid gap-5 md:grid-cols-3">
            {TESTIMONIALS.map((t, idx) => (
              <motion.figure
                key={t.name}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.4, delay: idx * 0.06 }}
                className="rounded-2xl border border-[#0B1640]/10 bg-[#232532] p-6"
              >
                <Quote className="h-5 w-5 text-orange-600/80" />
                <blockquote className="mt-3 text-[14.5px] leading-relaxed text-[#0B1640]/85">
                  {t.text}
                </blockquote>
                <figcaption className="mt-4 border-t border-[#0B1640]/10 pt-3">
                  <p className="text-[13px] font-bold text-[#0B1640]">{t.name}</p>
                  <p className="text-[11.5px] text-[#0B1640]/55">{t.role}</p>
                </figcaption>
              </motion.figure>
            ))}
          </div>
        </Container>
      </section>

      {/* ── CHANNEL CTA ────────────────────────────────────────────── */}
      <section className="bg-[#f3f5f8] py-16 md:py-20">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5 }}
            className="overflow-hidden rounded-3xl border border-[#0B1640]/10 bg-gradient-to-br from-[#3f3f3f] via-[#f3f5f8] to-[#f3f5f8] p-6 md:p-10"
          >
            <div className="grid gap-5 md:grid-cols-3">
              <div className="md:col-span-1">
                <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-orange-600">
                  — Get drops the second they ship
                </p>
                <h2
                  className="mt-3 text-[#0B1640]"
                  style={{
                    fontSize: "clamp(24px, 3.4vw, 36px)",
                    lineHeight: 1.05,
                    letterSpacing: "-0.025em",
                    fontWeight: 800,
                  }}
                >
                  Pick your channel.
                </h2>
                <p className="mt-3 text-[14px] leading-relaxed text-[#0B1640]/75">
                  Same updates, your preferred surface. Discord for discussion. WhatsApp for daily
                  drops. This site for the searchable archive.
                </p>
              </div>
              <div className="grid gap-3 md:col-span-2 sm:grid-cols-2">
                <ChannelTile
                  href={social.discord}
                  external
                  Icon={FaDiscord}
                  iconBg="bg-[#5865F2]/15"
                  iconColor="text-[#5865F2]"
                  title="Discord"
                  desc="Discussion threads, AMAs, freelance referrals"
                  badge="10K+ members"
                />
                <ChannelTile
                  href={social.whatsapp}
                  external
                  Icon={FaWhatsapp}
                  iconBg="bg-emerald-400/15"
                  iconColor="text-emerald-400"
                  title="WhatsApp"
                  desc="Daily AI tool drops + alerts straight to your phone"
                  badge="Daily"
                />
                <ChannelTile
                  href="/programs/"
                  Icon={Sparkles}
                  iconBg="bg-orange-500/15"
                  iconColor="text-orange-600"
                  title="Cohort"
                  desc="3-month intensive · 3 deployable AI projects · with mentors"
                  badge="Free Masterclass"
                  primary
                />
                <ChannelTile
                  href="/community/dashboard"
                  Icon={LogIn}
                  iconBg="bg-orange-400/15"
                  iconColor="text-orange-600"
                  title="Members area"
                  desc="Save posts, follow categories, alumni-only threads"
                  badge="Sign in"
                />
              </div>
            </div>
          </motion.div>
        </Container>
      </section>

      <Footer />
    </main>
  );
}

// ── COMPONENTS ──────────────────────────────────────────────────────

function StatCounter({
  label,
  value,
  prefix = "",
  suffix = "",
  icon: Icon,
  accent,
}: {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  icon: typeof UsersIcon;
  accent: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    const duration = 1100;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplayed(Math.round(value * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value]);

  return (
    <div
      ref={ref}
      className="flex items-center gap-3 rounded-xl bg-white px-4 py-3"
    >
      <span className={`grid h-9 w-9 place-items-center rounded-lg bg-white ${accent}`}>
        <Icon className="h-4 w-4" strokeWidth={2.4} />
      </span>
      <div className="min-w-0">
        <p className="text-[20px] font-extrabold leading-none text-[#0B1640] tabular-nums sm:text-[22px]">
          {prefix}
          {displayed.toLocaleString("en-IN")}
          {suffix}
        </p>
        <p className="mt-1 text-[10.5px] font-bold uppercase tracking-[0.18em] text-[#0B1640]/55">
          {label}
        </p>
      </div>
    </div>
  );
}

function SectionHeader({
  title,
  href,
  subtitle,
  eyebrow,
  eyebrowAccent,
}: {
  title: string;
  href: string;
  subtitle?: string;
  eyebrow?: string;
  eyebrowAccent?: string;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        {eyebrow ? (
          <span
            className={`inline-flex items-center rounded-full bg-gradient-to-r ${
              eyebrowAccent ?? "from-orange-400 to-amber-300"
            } px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#f3f5f8]`}
          >
            {eyebrow}
          </span>
        ) : null}
        <h2
          className="mt-2 text-[#0B1640]"
          style={{
            fontSize: "clamp(20px, 2.4vw, 24px)",
            fontWeight: 800,
            letterSpacing: "-0.02em",
            lineHeight: 1.15,
          }}
        >
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-1 max-w-xl text-[13px] text-[#0B1640]/55">{subtitle}</p>
        ) : null}
      </div>
      <Link
        to={href}
        className="inline-flex items-center gap-1.5 text-[12.5px] font-bold uppercase tracking-wider text-orange-600 transition hover:text-orange-600"
      >
        See all
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

function FeaturedPost({ post }: { post: CommunityPost }) {
  const cat = CATEGORY_BY_ID[post.category];
  const date = post.published_at ?? post.created_at;
  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="group overflow-hidden rounded-3xl border border-[#0B1640]/10 bg-[#232532] transition hover:border-orange-300/35"
    >
      <Link to={`/community/post/${post.slug}/`} className="grid lg:grid-cols-[1.1fr_0.9fr]">
        <div className="aspect-[16/9] w-full overflow-hidden bg-white lg:aspect-auto lg:min-h-[360px]">
          {post.cover_url ? (
            <img
              src={post.cover_url}
              alt={post.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${cat.accent}`}>
              <Sparkles className="h-12 w-12 text-[#f3f5f8]/70" />
            </div>
          )}
        </div>
        <div className="flex flex-col justify-center gap-4 p-6 sm:p-8 md:p-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-orange-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-orange-600">
              Featured
            </span>
            <span className={`inline-flex items-center rounded-full bg-gradient-to-r ${cat.accent} px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#f3f5f8]`}>
              {cat.label}
            </span>
            <span className="inline-flex items-center gap-1 text-[11.5px] text-[#0B1640]/55">
              <Clock className="h-3 w-3" />
              {new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
            </span>
          </div>
          <h2
            className="text-[#0B1640] transition group-hover:text-orange-100"
            style={{
              fontSize: "clamp(22px, 3vw, 30px)",
              fontWeight: 800,
              letterSpacing: "-0.02em",
              lineHeight: 1.15,
            }}
          >
            {post.title}
          </h2>
          {post.excerpt ? (
            <p className="text-[14.5px] leading-relaxed text-[#0B1640]/75 md:text-[15px]">{post.excerpt}</p>
          ) : null}
          <span className="inline-flex items-center gap-1.5 text-[13px] font-bold uppercase tracking-wider text-orange-600">
            Read the post
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      </Link>
    </motion.article>
  );
}

function PostCard({
  post,
  idx,
  compact,
}: {
  post: CommunityPost;
  idx: number;
  compact?: boolean;
}) {
  const cat = CATEGORY_BY_ID[post.category];
  const date = post.published_at ?? post.created_at;
  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.35, delay: Math.min(idx * 0.05, 0.3) }}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#0B1640]/10 bg-[#232532] transition hover:border-orange-300/35 hover:bg-[#f3f5f8]"
    >
      <Link to={`/community/post/${post.slug}/`} className="flex h-full flex-col">
        <div className="aspect-[16/9] w-full overflow-hidden bg-white">
          {post.cover_url ? (
            <img
              src={post.cover_url}
              alt={post.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              loading="lazy"
            />
          ) : (
            <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${cat.accent}`}>
              <Sparkles className="h-7 w-7 text-[#f3f5f8]/70" />
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center rounded-full bg-gradient-to-r ${cat.accent} px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.18em] text-[#f3f5f8]`}>
              {cat.label}
            </span>
            <span className="text-[11px] text-[#0B1640]/55">
              {new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
            </span>
          </div>
          <h3
            className="mt-3 text-[#0B1640] transition group-hover:text-orange-600"
            style={{
              fontSize: compact ? "15.5px" : "16.5px",
              fontWeight: 700,
              lineHeight: 1.3,
              letterSpacing: "-0.005em",
            }}
          >
            {post.title}
          </h3>
          {post.excerpt && !compact ? (
            <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-[#0B1640]/75">{post.excerpt}</p>
          ) : null}
        </div>
      </Link>
    </motion.article>
  );
}

function ChannelTile({
  href,
  external,
  Icon,
  iconBg,
  iconColor,
  title,
  desc,
  badge,
  primary,
}: {
  href: string;
  external?: boolean;
  Icon: typeof Sparkles;
  iconBg: string;
  iconColor: string;
  title: string;
  desc: string;
  badge: string;
  primary?: boolean;
}) {
  const Wrap: typeof Link = external
    ? (((props: React.AllHTMLAttributes<HTMLAnchorElement>) => (
        <a {...props} target="_blank" rel="noreferrer" />
      )) as unknown as typeof Link)
    : Link;
  // Use plain anchor when external (typeof Link won't actually render an a)
  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className={`group flex items-start gap-3 rounded-2xl border p-5 transition hover:-translate-y-0.5 ${
          primary
            ? "border-orange-300/40 bg-gradient-to-br from-orange-500/15 to-amber-400/8 hover:border-orange-300/60"
            : "border-[#0B1640]/10 bg-white hover:border-orange-300/40"
        }`}
      >
        <ChannelTileBody Icon={Icon} iconBg={iconBg} iconColor={iconColor} title={title} desc={desc} badge={badge} />
      </a>
    );
  }
  return (
    <Wrap
      to={href}
      className={`group flex items-start gap-3 rounded-2xl border p-5 transition hover:-translate-y-0.5 ${
        primary
          ? "border-orange-300/40 bg-gradient-to-br from-orange-500/15 to-amber-400/8 hover:border-orange-300/60"
          : "border-[#0B1640]/10 bg-white hover:border-orange-300/40"
      }`}
    >
      <ChannelTileBody Icon={Icon} iconBg={iconBg} iconColor={iconColor} title={title} desc={desc} badge={badge} />
    </Wrap>
  );
}

function ChannelTileBody({
  Icon,
  iconBg,
  iconColor,
  title,
  desc,
  badge,
}: {
  Icon: typeof Sparkles;
  iconBg: string;
  iconColor: string;
  title: string;
  desc: string;
  badge: string;
}) {
  return (
    <>
      <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${iconBg} ${iconColor}`}>
        <Icon className="h-6 w-6" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[14px] font-bold text-[#0B1640]">{title}</p>
          <span className="rounded-full border border-[#0B1640]/12 bg-white px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.16em] text-[#0B1640]/75">
            {badge}
          </span>
        </div>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-[#0B1640]/55">{desc}</p>
      </div>
      <ArrowRight className="ml-auto h-4 w-4 self-center text-[#0B1640]/55 transition group-hover:translate-x-0.5 group-hover:text-orange-600" />
    </>
  );
}

function FeedSkeleton() {
  return (
    <div className="space-y-8">
      <div className="aspect-[2.4/1] w-full animate-pulse rounded-3xl bg-white" />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="aspect-[1.4/1] w-full animate-pulse rounded-2xl bg-white" />
        ))}
      </div>
    </div>
  );
}

function EmptyHero() {
  return (
    <div className="rounded-3xl border border-dashed border-[#0B1640]/12 bg-white p-10 text-center md:p-14">
      <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-orange-600">— Soon</p>
      <h2
        className="mt-3 text-[#0B1640]"
        style={{ fontSize: "clamp(22px, 3vw, 30px)", fontWeight: 800, letterSpacing: "-0.02em" }}
      >
        First posts drop this week.
      </h2>
      <p className="mt-3 text-[14.5px] leading-relaxed text-[#0B1640]/75">
        We're seeding the feed with the first wave of news, tools, prompts, and hacks. Bookmark this
        page or follow on Discord/WhatsApp to catch every drop.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Link
          to="/community/feed/"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-400 px-5 py-3 text-[13px] font-bold uppercase tracking-wider text-white"
        >
          Browse all categories
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
