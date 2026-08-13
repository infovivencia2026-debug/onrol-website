import { lazy, Suspense, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, HashRouter, Route, Routes, Navigate, useLocation, useNavigate } from "react-router-dom";
// TooltipProvider stays eager — it's just a context provider and
// children need it in scope from first render. Toast components,
// however, were eagerly importing Radix Toast (~21KB unused on first
// paint per Lighthouse) and Sonner — both lazy-mount now via
// <Suspense fallback={null}> so they never gate FCP/LCP.
import { TooltipProvider } from "@/components/ui/tooltip";
const Sonner = lazy(() => import("@/components/ui/sonner").then((m) => ({ default: m.Toaster })));
const Toaster = lazy(() => import("@/components/ui/toaster").then((m) => ({ default: m.Toaster })));
import { AuthProvider } from "@/contexts/AuthContext";
import { CommunityAuthProvider } from "@/contexts/CommunityAuthContext";
import { LmsAuthProvider } from "@/contexts/LmsAuthContext";
import Navbar from "@/components/Navbar";
import PageViewBeacon from "@/components/PageViewBeacon";
import ScrollToHash from "@/components/ScrollToHash";
import SeoManager from "@/components/SeoManager";
import TaskAppErrorBoundary from "@/components/TaskAppErrorBoundary";
import { isStandaloneMode } from "@/lib/pwa";
import { isNative, registerDeepLinkHandler } from "@/lib/capacitorNative";
import { Loader2 } from "lucide-react";
import DesktopRuntimeBridge from "@/components/desktop/DesktopRuntimeBridge";
import DesktopCommandPalette from "@/components/desktop/DesktopCommandPalette";

// Home "/" now renders the glydi/onrol-home single-page design (HomeGlydi).
// The previous marketing home lives in ./pages/Index (kept for reference).
const Index = lazy(() => import("./pages/HomeGlydi"));
// The previous React marketing home, kept available at /home-classic.
const IndexClassic = lazy(() => import("./pages/Index"));
// All other ported glydi/onrol-home pages render through one generic route.
const GlydiRoute = lazy(() => import("./pages/glydi/GlydiRoute"));
const LearnHome = lazy(() => import("./pages/learn/LearnHome"));
const LearnExams = lazy(() => import("./pages/learn/LearnExams"));
const LearnCertificates = lazy(() => import("./pages/learn/LearnCertificates"));
const LearnHelp = lazy(() => import("./pages/learn/LearnHelp"));
const LearnCourse = lazy(() => import("./pages/learn/LearnCourse"));
const LearnLesson = lazy(() => import("./pages/learn/LearnLesson"));
const LearnMentorHome = lazy(() => import("./pages/learn/mentor/LearnMentorHome"));
const LearnMentorCohort = lazy(() => import("./pages/learn/mentor/LearnMentorCohort"));
const LearnMentorAvailability = lazy(() => import("./pages/learn/mentor/LearnMentorAvailability"));
const LearnCohortCalendar = lazy(() => import("./pages/learn/LearnCohortCalendar"));
const LearnCalendar = lazy(() => import("./pages/learn/LearnCalendar"));
const LearnCatalogList = lazy(() => import("./pages/learn/LearnCatalog").then((m) => ({ default: m.LearnCatalogList })));
const LearnCatalogCourse = lazy(() => import("./pages/learn/LearnCatalog").then((m) => ({ default: m.LearnCatalogCourse })));
const LearnLogin = lazy(() => import("./pages/learn/LearnLogin"));
const LearnAuthCallback = lazy(() => import("./pages/learn/LearnAuthCallback"));
const LearnAuthReset = lazy(() => import("./pages/learn/LearnAuthReset"));
const LearnProfile = lazy(() => import("./pages/learn/LearnProfile"));
const LearnMyBookings = lazy(() => import("./pages/learn/LearnMyBookings"));
const LearnMyCourses = lazy(() => import("./pages/learn/LearnMyCourses"));
const LearnLiveSessions = lazy(() => import("./pages/learn/LearnLiveSessions"));
const Programs = lazy(() => import("./pages/Programs"));
const AIGeneralist = lazy(() => import("./pages/AIGeneralist"));
const AIArchitect = lazy(() => import("./pages/AIArchitect"));
const AIGeneralistLanding = lazy(() => import("./pages/AIGeneralistLanding"));
const WebinarLanding = lazy(() => import("./pages/WebinarLanding"));
const Login = lazy(() => import("./pages/Login"));
const NotFound = lazy(() => import("./pages/NotFound"));
const PreviewA = lazy(() => import("./pages/PreviewA"));
const PreviewB = lazy(() => import("./pages/PreviewB"));
const PreviewC = lazy(() => import("./pages/PreviewC"));
const PillarPage = lazy(() => import("./pages/PillarPage"));
const BlogIndex = lazy(() => import("./pages/BlogIndex"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const Proof = lazy(() => import("./pages/Proof"));
const GlossaryIndex = lazy(() => import("./pages/GlossaryIndex"));
const GlossaryEntry = lazy(() => import("./pages/GlossaryEntry"));
const AISkillsQuiz = lazy(() => import("./pages/AISkillsQuiz"));
const WhyNow = lazy(() => import("./pages/WhyNow"));
const Thanks = lazy(() => import("./pages/Thanks"));
const Community = lazy(() => import("./pages/Community"));
const OnboardingCommunity = lazy(() => import("./pages/OnboardingCommunity"));
const AdminCommunityPosts = lazy(() => import("./pages/AdminCommunityPosts"));
const AdminCommunityPostEditor = lazy(() => import("./pages/AdminCommunityPostEditor"));
const AdminWebinarRegistrations = lazy(() => import("./pages/AdminWebinarRegistrations"));
const Win = lazy(() => import("./pages/Win"));
const ThanksWin = lazy(() => import("./pages/ThanksWin"));
const AiNewsIndex = lazy(() => import("./pages/AiNewsIndex"));
const CommunityFeed = lazy(() => import("./pages/CommunityFeed"));
const CommunityPostPublic = lazy(() => import("./pages/CommunityPostPublic"));
const PersonasIndex = lazy(() => import("./pages/PersonasIndex"));
const PersonaPage = lazy(() => import("./pages/PersonaPage"));
const FounderPage = lazy(() => import("./pages/FounderPage"));
const EventsPage = lazy(() => import("./pages/EventsPage"));
const CareerCatalystLanding = lazy(() => import("./pages/CareerCatalystLanding"));
const LandingPagesIndex = lazy(() => import("./pages/LandingPagesIndex"));
const SiteMap = lazy(() => import("./pages/SiteMap"));
const ThanksCareerCatalyst = lazy(() => import("./pages/ThanksCareerCatalyst"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Questions = lazy(() => import("./pages/Questions"));
const CommunityDashboard = lazy(() => import("./pages/CommunityDashboard"));
const CommunityPostDetail = lazy(() => import("./pages/CommunityPostDetail"));
const CommunityMembers = lazy(() => import("./pages/CommunityMembers"));
const CommunityDiscussions = lazy(() => import("./pages/CommunityDiscussions"));
const CommunityProjects = lazy(() => import("./pages/CommunityProjects"));
const CommunityJobs = lazy(() => import("./pages/CommunityJobs"));
const CommunityEvents = lazy(() => import("./pages/CommunityEvents"));
const CommunityLeaderboard = lazy(() => import("./pages/CommunityLeaderboard"));
const CommunitySettings = lazy(() => import("./pages/CommunitySettings"));
const SurveyLanding = lazy(() => import("./pages/SurveyLanding"));
const SurveyForm = lazy(() => import("./pages/SurveyForm"));
const SurveyThankYou = lazy(() => import("./pages/SurveyThankYou"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsAndConditions = lazy(() => import("./pages/TermsAndConditions"));
const RefundPolicy = lazy(() => import("./pages/RefundPolicy"));
const TaskManager = lazy(() => import("./pages/TaskManager"));
const TaskLogin = lazy(() => import("./pages/TaskLogin"));
const MeetingJoinPublic = lazy(() => import("./pages/MeetingJoinPublic"));
const Feedback = lazy(() => import("./pages/Feedback"));
const XuloAssistant = lazy(() => import("@/components/XuloAssistant"));
// GlobalLeadPopup ("Apply / Contact" floating box) removed per user request.
// File still on disk but no longer mounted anywhere.
const FloatingSocialBar = lazy(() => import("@/components/FloatingSocialBar"));
const GetTheAppPill = lazy(() => import("@/components/GetTheAppPill"));
const ScrollProgress = lazy(() => import("@/components/shared/ScrollProgress"));
const MobileBottomNav = lazy(() => import("@/components/shared/MobileBottomNav"));

// External redirect (the community moved to the LMS on learn.onrol.in).
function ExtRedirect({ to }: { to: string }) {
  if (typeof window !== "undefined") window.location.replace(to);
  return null;
}

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const AppShell = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const desktopRuntime = typeof window !== "undefined" && Boolean(window.desktopAPI);

  // Register Capacitor deep-link handler (onrol:// scheme) — no-op on web
  useEffect(() => {
    void registerDeepLinkHandler((path) => navigate(path, { replace: true }));
  }, [navigate]);

  // Subdomain rewrite for the LMS — SYNCHRONOUS so the marketing homepage
  // never renders a frame before we switch routes.
  //   learn.onrol.in/*  → /learn/*  (student + mentor panels in this SPA)
  //   go.onrol.in/*     → CRM Next.js (admin lives there; we never run here)
  //   onrol.in/*        → unchanged    (main marketing site)
  // Anyone landing on learn.onrol.in/learn/admin* is bounced to the CRM
  // (admin no longer lives in this SPA).
  //
  // Previously this lived inside a `useEffect`, which fired AFTER the first
  // render — so users would briefly see the public Index marketing page
  // before being redirected. We now compute it synchronously and short-
  // circuit the render with `<Navigate replace />` so no extra paint
  // happens. The /learn/admin → go.onrol.in bounce still uses
  // window.location.replace because it's a cross-origin redirect.
  if (typeof window !== "undefined" && window.location.hostname === "learn.onrol.in") {
    const path = location.pathname;
    const tail = `${location.search}${location.hash}`;
    if (path.startsWith("/learn/admin")) {
      window.location.replace(`https://go.onrol.in/lms${path.replace(/^\/learn\/admin/, "")}${tail}`);
      return null;
    }
    if (!path.startsWith("/learn")) {
      // Full reload (not client-side Navigate) so the browser actually requests
      // /learn from the server → proxied to the CRM LMS. A client Navigate would
      // stay inside this marketing SPA and render its own stale LearnHome.
      const next = path === "/" ? "/learn" : `/learn${path}`;
      window.location.replace(`${next}${tail}`);
      return null;
    }
  }
  // /community (public landing) keeps the global navbar.
  // Only alumni-only subroutes (dashboard, discussions, etc.) hide it.
  const isAlumniRoute =
    /^\/community\/(dashboard|discussions|members|projects|jobs|events|leaderboard|settings|posts|admin)/.test(
      location.pathname,
    );
  const isCareerCatalystRoute =
    location.pathname.startsWith("/career-catalyst") ||
    location.pathname === "/webinar" ||
    location.pathname.startsWith("/thanks/career-catalyst");
  // Every URL under /landingpage/* is a funnel landing — strip the global
  // navbar + footer so the conversion path is clean. Index page at
  // /landingpage/ itself keeps the navbar (it's a hub, not a funnel).
  const isLandingFunnelRoute =
    location.pathname.startsWith("/landingpage/") && location.pathname !== "/landingpage/";
  const isWinRoute =
    location.pathname === "/win" ||
    location.pathname.startsWith("/thanks/win");
  // Routes rendered by the ported glydi/onrol-home design — they ship their own
  // nav + footer, so the global app chrome is suppressed on them.
  const glydiPaths = new Set([
    "/", "/programs", "/programs/ai", "/programs/cyber",
    "/programs/ai-generalist", "/programs/ai-architect",
    "/about", "/mentors", "/questions", "/glossary", "/blog",
    "/tools/ai-skills-quiz", "/masterclass", "/why-now",
    "/ai-course-in-hyderabad", "/best-ai-institute-in-hyderabad",
    "/cybersecurity", "/soc-analyst", "/programs/cybersecurity", "/programs/soc-analyst", "/contact", "/thank-you",
    "/privacy-policy", "/terms-and-conditions",
  ]);
  const normalizedPath = location.pathname.replace(/\/+$/, "") || "/";
  const hideGlobalNavbar =
    glydiPaths.has(normalizedPath) ||
    isAlumniRoute ||
    isCareerCatalystRoute ||
    isWinRoute ||
    isLandingFunnelRoute ||
    location.pathname.startsWith("/survey") ||
    location.pathname.startsWith("/task") ||
    location.pathname.startsWith("/messenger") ||
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/learn") ||
    location.pathname === "/portal" ||
    location.pathname === "/login" ||
    location.pathname === "/signup" ||
    location.pathname === "/feedback" ||
    location.pathname.startsWith("/webinar");
  const hideGlobalFloating =
    hideGlobalNavbar || location.pathname === "/login" || location.pathname === "/signup";

  return (
    <>
      {/* Live page-view beacon — fires a 1x1 pixel to go.onrol.in on every
          route change so the CRM analytics dashboard sees traffic in real
          time. Internally opts out for /admin, /task, /messenger and the
          desktop runtime; safe to mount unconditionally. */}
      <PageViewBeacon />
      {/* Scroll-progress bar — subtle orange line at the very top of every
          public page, hidden under prefers-reduced-motion. Skipped on
          alumni/admin/task surfaces where it'd be visual noise. */}
      {!hideGlobalNavbar ? (
        <Suspense fallback={null}>
          <ScrollProgress />
        </Suspense>
      ) : null}
      {!hideGlobalNavbar ? <Navbar /> : null}
      {!hideGlobalFloating ? (
        <Suspense fallback={null}>
          {/* XuloAssistant hidden until backend is configured. Restore when ready. */}
          {/* <XuloAssistant /> */}
          <FloatingSocialBar />
          <GetTheAppPill />
          {/* Mobile-only bottom nav. Rendered everywhere the desktop
              FloatingSocialBar is — same gating logic — but CSS-hidden
              on md+ so desktop never pays anything for it. */}
          <MobileBottomNav />
        </Suspense>
      ) : null}
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={desktopRuntime || isNative() ? <Navigate to="/task/app" replace /> : isStandaloneMode() ? <Navigate to="/task/app" replace /> : <Index />} />
          {!desktopRuntime ? <Route path="/preview/a" element={<PreviewA />} /> : null}
          {!desktopRuntime ? <Route path="/preview/b" element={<PreviewB />} /> : null}
          {!desktopRuntime ? <Route path="/preview/c" element={<PreviewC />} /> : null}
          {/* SEO pillar pages (Phase 2) — content lives in src/lib/pillarContent.ts */}
          {!desktopRuntime ? <Route path="/ai-execution-school" element={<PillarPage />} /> : null}
          {!desktopRuntime ? <Route path="/best-ai-course-in-india" element={<PillarPage />} /> : null}
          {!desktopRuntime ? <Route path="/academic-ai-vs-applied-ai" element={<PillarPage />} /> : null}
          {!desktopRuntime ? <Route path="/ai-course-for-beginners" element={<PillarPage />} /> : null}
          {!desktopRuntime ? <Route path="/ai-course-for-students" element={<PillarPage />} /> : null}
          {!desktopRuntime ? <Route path="/ai-course-for-working-professionals" element={<PillarPage />} /> : null}
          {!desktopRuntime ? <Route path="/ai-course-for-freelancers" element={<PillarPage />} /> : null}
          {!desktopRuntime ? <Route path="/ai-course-for-business-owners" element={<PillarPage />} /> : null}
          {!desktopRuntime ? <Route path="/ai-course-for-content-creators" element={<PillarPage />} /> : null}
          {!desktopRuntime ? <Route path="/ai-automation-course" element={<PillarPage />} /> : null}
          {!desktopRuntime ? <Route path="/best-ai-institutes-in-india" element={<PillarPage />} /> : null}
          {!desktopRuntime ? <Route path="/top-vibe-coding-training-india" element={<PillarPage />} /> : null}
          {!desktopRuntime ? <Route path="/best-ai-bootcamps-in-india" element={<PillarPage />} /> : null}
          {!desktopRuntime ? <Route path="/ai-institutes-near-me" element={<PillarPage />} /> : null}
          {!desktopRuntime ? <Route path="/ai-course-fees-india" element={<PillarPage />} /> : null}
          {!desktopRuntime ? <Route path="/how-to-choose-ai-institute-india" element={<PillarPage />} /> : null}
          {!desktopRuntime ? <Route path="/ai-institute-hyderabad" element={<PillarPage />} /> : null}
          {!desktopRuntime ? <Route path="/ai-institute-bangalore" element={<PillarPage />} /> : null}
          {!desktopRuntime ? <Route path="/ai-institute-mumbai" element={<PillarPage />} /> : null}
          {!desktopRuntime ? <Route path="/ai-institute-delhi" element={<PillarPage />} /> : null}
          {!desktopRuntime ? <Route path="/ai-institute-chennai" element={<PillarPage />} /> : null}
          {!desktopRuntime ? <Route path="/ai-institute-pune" element={<PillarPage />} /> : null}
          {!desktopRuntime ? <Route path="/ai-institute-kolkata" element={<PillarPage />} /> : null}
          {!desktopRuntime ? <Route path="/ai-institute-ahmedabad" element={<PillarPage />} /> : null}
          {/* Hyderabad neighbourhood pillars */}
          {!desktopRuntime ? <Route path="/ai-institute-kondapur" element={<PillarPage />} /> : null}
          {!desktopRuntime ? <Route path="/ai-institute-gachibowli" element={<PillarPage />} /> : null}
          {!desktopRuntime ? <Route path="/ai-institute-madhapur" element={<PillarPage />} /> : null}
          {!desktopRuntime ? <Route path="/ai-institute-kukatpally" element={<PillarPage />} /> : null}
          {!desktopRuntime ? <Route path="/ai-institute-hitech-city" element={<PillarPage />} /> : null}
          {/* Bangalore neighbourhood pillars */}
          {!desktopRuntime ? <Route path="/ai-institute-whitefield" element={<PillarPage />} /> : null}
          {!desktopRuntime ? <Route path="/ai-institute-koramangala" element={<PillarPage />} /> : null}
          {/* Tier-2 city pillars */}
          {!desktopRuntime ? <Route path="/ai-institute-visakhapatnam" element={<PillarPage />} /> : null}
          {!desktopRuntime ? <Route path="/ai-institute-jaipur" element={<PillarPage />} /> : null}
          {!desktopRuntime ? <Route path="/ai-institute-coimbatore" element={<PillarPage />} /> : null}
          {!desktopRuntime ? <Route path="/ai-institute-indore" element={<PillarPage />} /> : null}
          {!desktopRuntime ? <Route path="/ai-institute-lucknow" element={<PillarPage />} /> : null}
          {/* Keyword-variant pillars */}
          {!desktopRuntime ? <Route path="/generative-ai-course-india" element={<PillarPage />} /> : null}
          {!desktopRuntime ? <Route path="/agentic-ai-course-india" element={<PillarPage />} /> : null}
          {!desktopRuntime ? <Route path="/ai-engineer-course-india" element={<PillarPage />} /> : null}
          {/* State pillar pages */}
          {!desktopRuntime ? <Route path="/ai-institute-telangana" element={<PillarPage />} /> : null}
          {!desktopRuntime ? <Route path="/ai-institute-karnataka" element={<PillarPage />} /> : null}
          {!desktopRuntime ? <Route path="/ai-institute-maharashtra" element={<PillarPage />} /> : null}
          {!desktopRuntime ? <Route path="/ai-institute-tamil-nadu" element={<PillarPage />} /> : null}
          {!desktopRuntime ? <Route path="/ai-institute-andhra-pradesh" element={<PillarPage />} /> : null}
          {!desktopRuntime ? <Route path="/ai-institute-gujarat" element={<PillarPage />} /> : null}
          {/* Industry pillar pages */}
          {!desktopRuntime ? <Route path="/ai-for-healthcare-india" element={<PillarPage />} /> : null}
          {!desktopRuntime ? <Route path="/ai-for-legal-india" element={<PillarPage />} /> : null}
          {!desktopRuntime ? <Route path="/ai-for-fintech-india" element={<PillarPage />} /> : null}
          {!desktopRuntime ? <Route path="/ai-for-hospitality-india" element={<PillarPage />} /> : null}
          {!desktopRuntime ? <Route path="/ai-for-edtech-india" element={<PillarPage />} /> : null}
          {!desktopRuntime ? <Route path="/ai-for-retail-india" element={<PillarPage />} /> : null}
          {/* Comparison guide */}
          {!desktopRuntime ? <Route path="/ai-institute-comparison-guide-india" element={<PillarPage />} /> : null}
          {/* City pages — Hyderabad */}
          {!desktopRuntime ? <Route path="/best-ai-institute-in-hyderabad" element={<GlydiRoute page="best-ai-institute-hyderabad" />} /> : null}
          {!desktopRuntime ? <Route path="/ai-course-in-hyderabad" element={<GlydiRoute page="ai-course-hyderabad" />} /> : null}
          {/* Persona pages — index + 12 individual landings */}
          {!desktopRuntime ? <Route path="/personas" element={<PersonasIndex />} /> : null}
          {!desktopRuntime ? <Route path="/personas/:slug" element={<PersonaPage />} /> : null}
          {!desktopRuntime ? <Route path="/founders/dr-neeraja-reddy" element={<FounderPage />} /> : null}
          {!desktopRuntime ? <Route path="/events" element={<EventsPage />} /> : null}
          {/* Career Catalyst webinar landing page — now under /landingpage/career-catalyst/.
              Old /career-catalyst/ kept as a 301 redirect (server-side via .htaccess) to
              preserve any inbound links. The Navigate fallback below handles client-side
              navigation if it ever reaches React Router. */}
          {!desktopRuntime ? <Route path="/landingpage/career-catalyst" element={<CareerCatalystLanding />} /> : null}
          {!desktopRuntime ? <Route path="/career-catalyst" element={<Navigate to="/landingpage/career-catalyst/" replace />} /> : null}
          {!desktopRuntime ? <Route path="/webinar" element={<Navigate to="/landingpage/career-catalyst/" replace />} /> : null}
          {!desktopRuntime ? <Route path="/thanks/career-catalyst" element={<ThanksCareerCatalyst />} /> : null}
          {/* Landing pages index — hub for all /landingpage/* routes */}
          {!desktopRuntime ? <Route path="/landingpage" element={<LandingPagesIndex />} /> : null}
          {/* HTML sitemap — comprehensive internal-linking hub. Lists every pillar/blog/persona/tool. */}
          {!desktopRuntime ? <Route path="/site-map" element={<SiteMap />} /> : null}
          {/* /win — INVITE-ONLY convocation registration. Not in nav, not in
              sitemap, not prerendered, robots-disallowed. Distribute the
              link only to attendees who should see it. */}
          {!desktopRuntime ? <Route path="/win" element={<Win />} /> : null}
          {!desktopRuntime ? <Route path="/thanks/win" element={<ThanksWin />} /> : null}
          {/* AI News index — surfaces dated news anchors Jan-May 2026 */}
          {!desktopRuntime ? <Route path="/ai-news" element={<AiNewsIndex />} /> : null}
          {!desktopRuntime ? <Route path="/ai-news/" element={<AiNewsIndex />} /> : null}
          {/* Blog (Phase 2) */}
          {!desktopRuntime ? <Route path="/blog" element={<GlydiRoute page="blog" />} /> : null}
          {!desktopRuntime ? <Route path="/blog/:slug" element={<BlogPost />} /> : null}
          {!desktopRuntime ? <Route path="/proof" element={<Proof />} /> : null}
          {/* Glossary (Phase 7) — DefinedTerm schema for AI search citations */}
          {!desktopRuntime ? <Route path="/glossary" element={<GlydiRoute page="glossary" />} /> : null}
          {!desktopRuntime ? <Route path="/glossary/:slug" element={<GlossaryEntry />} /> : null}
          {/* Free interactive tools (Phase 6) */}
          {!desktopRuntime ? <Route path="/tools/ai-skills-quiz" element={<GlydiRoute page="quiz" />} /> : null}
          {/* Wave 5: standalone FOMO page + post-conversion thank-you flow */}
          {!desktopRuntime ? <Route path="/why-now" element={<GlydiRoute page="why-ai-matters" />} /> : null}
          {/* Legacy /apex/ → /community/ redirect for SEO continuity. */}
          {!desktopRuntime ? <Route path="/apex" element={<Navigate to="/community/" replace />} /> : null}
          {!desktopRuntime ? <Route path="/about" element={<GlydiRoute page="about" />} /> : null}
          {!desktopRuntime ? <Route path="/contact" element={<GlydiRoute page="contact" />} /> : null}

          {/* ── "Classic" URLs — the original React pages that the glydi design
              replaced, kept available (each keeps the global navbar/footer). ── */}
          {!desktopRuntime ? <Route path="/home-classic" element={<IndexClassic />} /> : null}
          {!desktopRuntime ? <Route path="/programs-classic" element={<Programs />} /> : null}
          {!desktopRuntime ? <Route path="/programs/ai-generalist-classic" element={<AIGeneralist />} /> : null}
          {!desktopRuntime ? <Route path="/programs/ai-architect-classic" element={<AIArchitect />} /> : null}
          {!desktopRuntime ? <Route path="/about-classic" element={<About />} /> : null}
          {!desktopRuntime ? <Route path="/contact-classic" element={<Contact />} /> : null}
          {!desktopRuntime ? <Route path="/questions-classic" element={<Questions />} /> : null}
          {!desktopRuntime ? <Route path="/glossary-classic" element={<GlossaryIndex />} /> : null}
          {!desktopRuntime ? <Route path="/blog-classic" element={<BlogIndex />} /> : null}
          {!desktopRuntime ? <Route path="/tools/ai-skills-quiz-classic" element={<AISkillsQuiz />} /> : null}
          {!desktopRuntime ? <Route path="/why-now-classic" element={<WhyNow />} /> : null}
          {!desktopRuntime ? <Route path="/ai-course-in-hyderabad-classic" element={<PillarPage slugOverride="ai-course-in-hyderabad" />} /> : null}
          {!desktopRuntime ? <Route path="/best-ai-institute-in-hyderabad-classic" element={<PillarPage slugOverride="best-ai-institute-in-hyderabad" />} /> : null}
          {!desktopRuntime ? <Route path="/privacy-policy-classic" element={<PrivacyPolicy />} /> : null}
          {!desktopRuntime ? <Route path="/terms-and-conditions-classic" element={<TermsAndConditions />} /> : null}
          {!desktopRuntime ? <Route path="/questions" element={<GlydiRoute page="faq" />} /> : null}
          {!desktopRuntime ? <Route path="/thanks/:intent" element={<Thanks />} /> : null}
          {!desktopRuntime ? <Route path="/thanks" element={<Thanks />} /> : null}
          {/* /programs (all-programs index) and /programs/ai-architect
              redirect to AI Generalist until those tracks ship. */}
          {!desktopRuntime ? <Route path="/programs" element={<GlydiRoute page="programs" />} /> : null}
          {!desktopRuntime ? <Route path="/programs/ai" element={<GlydiRoute page="ai-programs" />} /> : null}
          {!desktopRuntime ? <Route path="/programs/cyber" element={<GlydiRoute page="cyber-programs" />} /> : null}
          {!desktopRuntime ? <Route path="/programs/ai-generalist" element={<GlydiRoute page="ai-generalist" />} /> : null}
          {!desktopRuntime ? <Route path="/programs/ai-architect" element={<GlydiRoute page="ai-architect" />} /> : null}
          {!desktopRuntime ? <Route path="/masterclass" element={<GlydiRoute page="masterclass" />} /> : null}
          {!desktopRuntime ? <Route path="/mentors" element={<GlydiRoute page="mentors" />} /> : null}
          {!desktopRuntime ? <Route path="/programs/cybersecurity" element={<GlydiRoute page="cybersecurity" />} /> : null}
          {!desktopRuntime ? <Route path="/cybersecurity" element={<Navigate to="/programs/cybersecurity" replace />} /> : null}
          {!desktopRuntime ? <Route path="/programs/soc-analyst" element={<GlydiRoute page="soc-analyst" />} /> : null}
          {!desktopRuntime ? <Route path="/soc-analyst" element={<Navigate to="/programs/soc-analyst" replace />} /> : null}
          {!desktopRuntime ? <Route path="/thank-you" element={<GlydiRoute page="thank-you" />} /> : null}
          {/* QR / paid-funnel landing page — distinct from /programs/ai-generalist/.
              Hidden navbar + footer (see hideGlobalNavbar list). Indexable + prerendered. */}
          {!desktopRuntime ? <Route path="/ai-generalist" element={<AIGeneralistLanding />} /> : null}
          {!desktopRuntime ? <Route path="/webinar/build-mini-ai-startup" element={<WebinarLanding />} /> : null}
          {!desktopRuntime ? <Route path="/programs/ai-orchestrator" element={<Navigate to="/programs/ai-architect/" replace />} /> : null}
          {!desktopRuntime ? <Route path="/login" element={<Login />} /> : null}
          {!desktopRuntime ? <Route path="/signup" element={<Navigate to="/login" replace />} /> : null}
          {!desktopRuntime ? <Route path="/portal" element={<Navigate to="/community/dashboard" replace />} /> : null}
          {/* Community decommissioned on the marketing site — the real community
              now lives in the LMS (learn.onrol.in/learn/community). Redirect the
              entry there. Deep /community/* admin/post routes remain for now. */}
          {!desktopRuntime ? <Route path="/community" element={<ExtRedirect to="https://learn.onrol.in/learn/community" />} /> : null}
          {/* Wave C — public broadcast feed (admin-published posts). */}
          {!desktopRuntime ? <Route path="/community/feed" element={<CommunityFeed />} /> : null}
          {!desktopRuntime ? <Route path="/community/feed/:category" element={<CommunityFeed />} /> : null}
          {!desktopRuntime ? <Route path="/community/post/:slug" element={<CommunityPostPublic />} /> : null}
          {/* First-time profile-setup gate for new community members. */}
          {!desktopRuntime ? <Route path="/onboarding/community" element={<OnboardingCommunity />} /> : null}
          {!desktopRuntime ? <Route path="/community/dashboard" element={<CommunityDashboard />} /> : null}
          {!desktopRuntime ? <Route path="/community/posts/:id" element={<CommunityPostDetail />} /> : null}
          {!desktopRuntime ? <Route path="/community/discussions" element={<CommunityDiscussions />} /> : null}
          {!desktopRuntime ? <Route path="/community/members" element={<CommunityMembers />} /> : null}
          {!desktopRuntime ? <Route path="/community/projects" element={<CommunityProjects />} /> : null}
          {!desktopRuntime ? <Route path="/community/jobs" element={<CommunityJobs />} /> : null}
          {!desktopRuntime ? <Route path="/community/events" element={<CommunityEvents />} /> : null}
          {!desktopRuntime ? <Route path="/community/leaderboard" element={<CommunityLeaderboard />} /> : null}
          {!desktopRuntime ? <Route path="/community/settings" element={<CommunitySettings />} /> : null}
          {/* Wave B — admin-only publishing system. Gated by AdminGate (checks `admins` table). */}
          {!desktopRuntime ? <Route path="/community/admin" element={<AdminCommunityPosts />} /> : null}
          {!desktopRuntime ? <Route path="/community/admin/new" element={<AdminCommunityPostEditor />} /> : null}
          {!desktopRuntime ? <Route path="/community/admin/:id" element={<AdminCommunityPostEditor />} /> : null}
          {!desktopRuntime ? <Route path="/community/admin/webinar" element={<AdminWebinarRegistrations />} /> : null}
          {!desktopRuntime ? <Route path="/survey" element={<SurveyLanding />} /> : null}
          {!desktopRuntime ? <Route path="/survey/:surveyType" element={<SurveyForm />} /> : null}
          {!desktopRuntime ? <Route path="/survey/thank-you" element={<SurveyThankYou />} /> : null}
          {!desktopRuntime ? <Route path="/privacy-policy" element={<GlydiRoute page="privacy" />} /> : null}
          {!desktopRuntime ? <Route path="/terms-and-conditions" element={<GlydiRoute page="terms" />} /> : null}
          {!desktopRuntime ? <Route path="/refund-policy" element={<RefundPolicy />} /> : null}
          <Route path="/task" element={<TaskLogin />} />
          <Route path="/task/login" element={<Navigate to="/task" replace />} />
          <Route path="/task/tasks" element={<TaskAppErrorBoundary><TaskManager /></TaskAppErrorBoundary>} />
          <Route path="/task/overview" element={<TaskAppErrorBoundary><TaskManager /></TaskAppErrorBoundary>} />
          <Route path="/task/register" element={<Navigate to="/task" replace />} />
          <Route path="/task/reset-password" element={<TaskLogin />} />
          <Route path="/task/auth/callback" element={<TaskLogin />} />
          <Route path="/task/*" element={<TaskLogin />} />
          <Route path="/auth/callback" element={<TaskLogin />} />
          <Route path="/task/journey" element={<TaskAppErrorBoundary><TaskManager /></TaskAppErrorBoundary>} />
          <Route path="/task/app" element={<TaskAppErrorBoundary><TaskManager /></TaskAppErrorBoundary>} />
          <Route path="/messenger/inbox" element={<TaskAppErrorBoundary><TaskManager /></TaskAppErrorBoundary>} />
          <Route path="/messenger/teams" element={<TaskAppErrorBoundary><TaskManager /></TaskAppErrorBoundary>} />
          <Route path="/messenger/announcements" element={<TaskAppErrorBoundary><TaskManager /></TaskAppErrorBoundary>} />
          <Route path="/messenger/directory" element={<TaskAppErrorBoundary><TaskManager /></TaskAppErrorBoundary>} />
          <Route path="/messenger/chat/:conversationId" element={<TaskAppErrorBoundary><TaskManager /></TaskAppErrorBoundary>} />
          <Route path="/task/institutions" element={<TaskAppErrorBoundary><TaskManager /></TaskAppErrorBoundary>} />
          <Route path="/task/admin/institutions" element={<TaskAppErrorBoundary><TaskManager /></TaskAppErrorBoundary>} />
          <Route path="/admin/dashboard" element={<TaskAppErrorBoundary><TaskManager /></TaskAppErrorBoundary>} />
          <Route path="/admin/settings/automation" element={<TaskAppErrorBoundary><TaskManager /></TaskAppErrorBoundary>} />
          <Route path="/admin/users" element={<TaskAppErrorBoundary><TaskManager /></TaskAppErrorBoundary>} />
          <Route path="/admin/employees/:id" element={<TaskAppErrorBoundary><TaskManager /></TaskAppErrorBoundary>} />
          <Route path="/meeting/join/:code" element={<Suspense fallback={<PageLoader />}><MeetingJoinPublic /></Suspense>} />
          {!desktopRuntime ? <Route path="/feedback" element={<Feedback />} /> : null}
          {/* LMS — student panel. learn.onrol.in is rewritten to /learn/* by the subdomain effect below. */}
          <Route path="/learn" element={<LearnHome />} />
          <Route path="/learn/login" element={<LearnLogin />} />
          <Route path="/learn/auth/callback" element={<LearnAuthCallback />} />
          <Route path="/learn/auth/reset" element={<LearnAuthReset />} />
          <Route path="/learn/me/profile" element={<LearnProfile />} />
          <Route path="/learn/catalog" element={<LearnCatalogList />} />
          <Route path="/learn/catalog/:slug" element={<LearnCatalogCourse />} />
          <Route path="/learn/c/:slug" element={<LearnCourse />} />
          <Route path="/learn/c/:slug/l/:lessonId" element={<LearnLesson />} />
          {/* LMS mentor panel (lives on learn.onrol.in alongside student panel) */}
          <Route path="/learn/mentor" element={<LearnMentorHome />} />
          <Route path="/learn/mentor/availability" element={<LearnMentorAvailability />} />
          <Route path="/learn/mentor/c/:cohortId" element={<LearnMentorCohort />} />
          <Route path="/learn/me/courses" element={<LearnMyCourses />} />
          <Route path="/learn/me/sessions" element={<LearnLiveSessions />} />
          <Route path="/learn/me/exams" element={<LearnExams />} />
          <Route path="/learn/me/certificates" element={<LearnCertificates />} />
          <Route path="/learn/help" element={<LearnHelp />} />
          <Route path="/learn/me/bookings" element={<LearnMyBookings />} />
          <Route path="/learn/me/calendar" element={<LearnCalendar />} />
          <Route path="/learn/cohorts/:cohortId" element={<LearnCohortCalendar />} />
          {/* Admin pages now live in the CRM at go.onrol.in/lms/*; nothing here. */}
          <Route path="*" element={desktopRuntime ? <Navigate to="/task" replace /> : <NotFound />} />
        </Routes>
      </Suspense>
      <DesktopRuntimeBridge />
      <DesktopCommandPalette />
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Suspense fallback={null}>
        <Toaster />
        <Sonner />
      </Suspense>
      {(typeof window !== "undefined" && window.desktopAPI) || isNative() ? (
        <HashRouter>
          <ScrollToHash />
          <SeoManager />
          <AuthProvider>
            <CommunityAuthProvider>
              <LmsAuthProvider>
                <AppShell />
              </LmsAuthProvider>
            </CommunityAuthProvider>
          </AuthProvider>
        </HashRouter>
      ) : (
      <BrowserRouter>
        <ScrollToHash />
        <SeoManager />
        <AuthProvider>
          <CommunityAuthProvider>
            <LmsAuthProvider>
              <AppShell />
            </LmsAuthProvider>
          </CommunityAuthProvider>
        </AuthProvider>
      </BrowserRouter>
      )}
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
