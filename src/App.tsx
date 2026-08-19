import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useLocation } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
const Sonner = lazy(() => import("@/components/ui/sonner").then((m) => ({ default: m.Toaster })));
const Toaster = lazy(() => import("@/components/ui/toaster").then((m) => ({ default: m.Toaster })));
import { AuthProvider } from "@/contexts/AuthContext";
import { LmsAuthProvider } from "@/contexts/LmsAuthContext";
import Navbar from "@/components/Navbar";
import PageViewBeacon from "@/components/PageViewBeacon";
import ScrollToHash from "@/components/ScrollToHash";
import SeoManager from "@/components/SeoManager";
import { Loader2 } from "lucide-react";

// Home "/" now renders the glydi/onrol-home single-page design (HomeGlydi).
const Index = lazy(() => import("./pages/HomeGlydi"));
const IndexClassic = lazy(() => import("./pages/Index"));
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
const Win = lazy(() => import("./pages/Win"));
const ThanksWin = lazy(() => import("./pages/ThanksWin"));
const AiNewsIndex = lazy(() => import("./pages/AiNewsIndex"));
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
const SurveyLanding = lazy(() => import("./pages/SurveyLanding"));
const SurveyForm = lazy(() => import("./pages/SurveyForm"));
const SurveyThankYou = lazy(() => import("./pages/SurveyThankYou"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsAndConditions = lazy(() => import("./pages/TermsAndConditions"));
const RefundPolicy = lazy(() => import("./pages/RefundPolicy"));
const Feedback = lazy(() => import("./pages/Feedback"));
const FloatingSocialBar = lazy(() => import("@/components/FloatingSocialBar"));
const ScrollProgress = lazy(() => import("@/components/shared/ScrollProgress"));
const MobileBottomNav = lazy(() => import("@/components/shared/MobileBottomNav"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const AppShell = () => {
  const location = useLocation();

  // Subdomain rewrite for the LMS — SYNCHRONOUS so the marketing homepage
  // never renders a frame before we switch routes.
  //   learn.onrol.in/*  → /learn/*  (student + mentor panels in this SPA)
  //   go.onrol.in/*     → CRM Next.js (admin lives there; we never run here)
  //   onrol.in/*        → unchanged (main marketing site)
  if (typeof window !== "undefined" && window.location.hostname === "learn.onrol.in") {
    const path = location.pathname;
    const tail = `${location.search}${location.hash}`;
    if (path.startsWith("/learn/admin")) {
      window.location.replace(`https://go.onrol.in/lms${path.replace(/^\/learn\/admin/, "")}${tail}`);
      return null;
    }
    if (!path.startsWith("/learn")) {
      const next = path === "/" ? "/learn" : `/learn${path}`;
      window.location.replace(`${next}${tail}`);
      return null;
    }
  }

  const isCareerCatalystRoute =
    location.pathname.startsWith("/career-catalyst") ||
    location.pathname === "/webinar" ||
    location.pathname.startsWith("/thanks/career-catalyst");
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
    isCareerCatalystRoute ||
    isWinRoute ||
    isLandingFunnelRoute ||
    location.pathname.startsWith("/survey") ||
    location.pathname.startsWith("/learn") ||
    location.pathname === "/login" ||
    location.pathname === "/signup" ||
    location.pathname === "/feedback" ||
    location.pathname.startsWith("/webinar");
  const hideGlobalFloating =
    hideGlobalNavbar || location.pathname === "/login" || location.pathname === "/signup";

  return (
    <>
      <PageViewBeacon />
      {!hideGlobalNavbar ? (
        <Suspense fallback={null}>
          <ScrollProgress />
        </Suspense>
      ) : null}
      {!hideGlobalNavbar ? <Navbar /> : null}
      {!hideGlobalFloating ? (
        <Suspense fallback={null}>
          <FloatingSocialBar />
          <MobileBottomNav />
        </Suspense>
      ) : null}
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/preview/a" element={<PreviewA />} />
          <Route path="/preview/b" element={<PreviewB />} />
          <Route path="/preview/c" element={<PreviewC />} />
          {/* SEO pillar pages — content lives in src/lib/pillarContent.ts */}
          <Route path="/ai-execution-school" element={<PillarPage />} />
          <Route path="/best-ai-course-in-india" element={<PillarPage />} />
          <Route path="/academic-ai-vs-applied-ai" element={<PillarPage />} />
          <Route path="/ai-course-for-beginners" element={<PillarPage />} />
          <Route path="/ai-course-for-students" element={<PillarPage />} />
          <Route path="/ai-course-for-working-professionals" element={<PillarPage />} />
          <Route path="/ai-course-for-freelancers" element={<PillarPage />} />
          <Route path="/ai-course-for-business-owners" element={<PillarPage />} />
          <Route path="/ai-course-for-content-creators" element={<PillarPage />} />
          <Route path="/ai-automation-course" element={<PillarPage />} />
          <Route path="/best-ai-institutes-in-india" element={<PillarPage />} />
          <Route path="/top-vibe-coding-training-india" element={<PillarPage />} />
          <Route path="/best-ai-bootcamps-in-india" element={<PillarPage />} />
          <Route path="/ai-institutes-near-me" element={<PillarPage />} />
          <Route path="/ai-course-fees-india" element={<PillarPage />} />
          <Route path="/how-to-choose-ai-institute-india" element={<PillarPage />} />
          <Route path="/ai-institute-hyderabad" element={<PillarPage />} />
          <Route path="/ai-institute-bangalore" element={<PillarPage />} />
          <Route path="/ai-institute-mumbai" element={<PillarPage />} />
          <Route path="/ai-institute-delhi" element={<PillarPage />} />
          <Route path="/ai-institute-chennai" element={<PillarPage />} />
          <Route path="/ai-institute-pune" element={<PillarPage />} />
          <Route path="/ai-institute-kolkata" element={<PillarPage />} />
          <Route path="/ai-institute-ahmedabad" element={<PillarPage />} />
          <Route path="/ai-institute-kondapur" element={<PillarPage />} />
          <Route path="/ai-institute-gachibowli" element={<PillarPage />} />
          <Route path="/ai-institute-madhapur" element={<PillarPage />} />
          <Route path="/ai-institute-kukatpally" element={<PillarPage />} />
          <Route path="/ai-institute-hitech-city" element={<PillarPage />} />
          <Route path="/ai-institute-whitefield" element={<PillarPage />} />
          <Route path="/ai-institute-koramangala" element={<PillarPage />} />
          <Route path="/ai-institute-visakhapatnam" element={<PillarPage />} />
          <Route path="/ai-institute-jaipur" element={<PillarPage />} />
          <Route path="/ai-institute-coimbatore" element={<PillarPage />} />
          <Route path="/ai-institute-indore" element={<PillarPage />} />
          <Route path="/ai-institute-lucknow" element={<PillarPage />} />
          <Route path="/generative-ai-course-india" element={<PillarPage />} />
          <Route path="/agentic-ai-course-india" element={<PillarPage />} />
          <Route path="/ai-engineer-course-india" element={<PillarPage />} />
          <Route path="/ai-institute-telangana" element={<PillarPage />} />
          <Route path="/ai-institute-karnataka" element={<PillarPage />} />
          <Route path="/ai-institute-maharashtra" element={<PillarPage />} />
          <Route path="/ai-institute-tamil-nadu" element={<PillarPage />} />
          <Route path="/ai-institute-andhra-pradesh" element={<PillarPage />} />
          <Route path="/ai-institute-gujarat" element={<PillarPage />} />
          <Route path="/ai-for-healthcare-india" element={<PillarPage />} />
          <Route path="/ai-for-legal-india" element={<PillarPage />} />
          <Route path="/ai-for-fintech-india" element={<PillarPage />} />
          <Route path="/ai-for-hospitality-india" element={<PillarPage />} />
          <Route path="/ai-for-edtech-india" element={<PillarPage />} />
          <Route path="/ai-for-retail-india" element={<PillarPage />} />
          <Route path="/ai-institute-comparison-guide-india" element={<PillarPage />} />
          <Route path="/best-ai-institute-in-hyderabad" element={<GlydiRoute page="best-ai-institute-hyderabad" />} />
          <Route path="/ai-course-in-hyderabad" element={<GlydiRoute page="ai-course-hyderabad" />} />
          <Route path="/personas" element={<PersonasIndex />} />
          <Route path="/personas/:slug" element={<PersonaPage />} />
          <Route path="/founders/dr-neeraja-reddy" element={<FounderPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/landingpage/career-catalyst" element={<CareerCatalystLanding />} />
          <Route path="/career-catalyst" element={<Navigate to="/landingpage/career-catalyst/" replace />} />
          <Route path="/webinar" element={<Navigate to="/landingpage/career-catalyst/" replace />} />
          <Route path="/thanks/career-catalyst" element={<ThanksCareerCatalyst />} />
          <Route path="/landingpage" element={<LandingPagesIndex />} />
          <Route path="/site-map" element={<SiteMap />} />
          <Route path="/win" element={<Win />} />
          <Route path="/thanks/win" element={<ThanksWin />} />
          <Route path="/ai-news" element={<AiNewsIndex />} />
          <Route path="/ai-news/" element={<AiNewsIndex />} />
          <Route path="/blog" element={<GlydiRoute page="blog" />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/proof" element={<Proof />} />
          <Route path="/glossary" element={<GlydiRoute page="glossary" />} />
          <Route path="/glossary/:slug" element={<GlossaryEntry />} />
          <Route path="/tools/ai-skills-quiz" element={<GlydiRoute page="quiz" />} />
          <Route path="/why-now" element={<GlydiRoute page="why-ai-matters" />} />
          <Route path="/about" element={<GlydiRoute page="about" />} />
          <Route path="/contact" element={<GlydiRoute page="contact" />} />
          {/* Classic URLs — the original React pages kept available. */}
          <Route path="/home-classic" element={<IndexClassic />} />
          <Route path="/programs-classic" element={<Programs />} />
          <Route path="/programs/ai-generalist-classic" element={<AIGeneralist />} />
          <Route path="/programs/ai-architect-classic" element={<AIArchitect />} />
          <Route path="/about-classic" element={<About />} />
          <Route path="/contact-classic" element={<Contact />} />
          <Route path="/questions-classic" element={<Questions />} />
          <Route path="/glossary-classic" element={<GlossaryIndex />} />
          <Route path="/blog-classic" element={<BlogIndex />} />
          <Route path="/tools/ai-skills-quiz-classic" element={<AISkillsQuiz />} />
          <Route path="/why-now-classic" element={<WhyNow />} />
          <Route path="/ai-course-in-hyderabad-classic" element={<PillarPage slugOverride="ai-course-in-hyderabad" />} />
          <Route path="/best-ai-institute-in-hyderabad-classic" element={<PillarPage slugOverride="best-ai-institute-in-hyderabad" />} />
          <Route path="/privacy-policy-classic" element={<PrivacyPolicy />} />
          <Route path="/terms-and-conditions-classic" element={<TermsAndConditions />} />
          <Route path="/questions" element={<GlydiRoute page="faq" />} />
          <Route path="/thanks/:intent" element={<Thanks />} />
          <Route path="/thanks" element={<Thanks />} />
          <Route path="/programs" element={<GlydiRoute page="programs" />} />
          <Route path="/programs/ai" element={<GlydiRoute page="ai-programs" />} />
          <Route path="/programs/cyber" element={<GlydiRoute page="cyber-programs" />} />
          <Route path="/programs/ai-generalist" element={<GlydiRoute page="ai-generalist" />} />
          <Route path="/programs/ai-architect" element={<GlydiRoute page="ai-architect" />} />
          <Route path="/masterclass" element={<GlydiRoute page="masterclass" />} />
          <Route path="/mentors" element={<GlydiRoute page="mentors" />} />
          <Route path="/programs/cybersecurity" element={<GlydiRoute page="cybersecurity" />} />
          <Route path="/cybersecurity" element={<Navigate to="/programs/cybersecurity" replace />} />
          <Route path="/programs/soc-analyst" element={<GlydiRoute page="soc-analyst" />} />
          <Route path="/soc-analyst" element={<Navigate to="/programs/soc-analyst" replace />} />
          <Route path="/thank-you" element={<GlydiRoute page="thank-you" />} />
          <Route path="/ai-generalist" element={<AIGeneralistLanding />} />
          <Route path="/webinar/build-mini-ai-startup" element={<WebinarLanding />} />
          <Route path="/programs/ai-orchestrator" element={<Navigate to="/programs/ai-architect/" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Navigate to="/login" replace />} />
          <Route path="/survey" element={<SurveyLanding />} />
          <Route path="/survey/:surveyType" element={<SurveyForm />} />
          <Route path="/survey/thank-you" element={<SurveyThankYou />} />
          <Route path="/privacy-policy" element={<GlydiRoute page="privacy" />} />
          <Route path="/terms-and-conditions" element={<GlydiRoute page="terms" />} />
          <Route path="/refund-policy" element={<RefundPolicy />} />
          <Route path="/feedback" element={<Feedback />} />
          {/* LMS — student + mentor panels (learn.onrol.in rewritten to /learn/*). */}
          <Route path="/learn" element={<LearnHome />} />
          <Route path="/learn/login" element={<LearnLogin />} />
          <Route path="/learn/auth/callback" element={<LearnAuthCallback />} />
          <Route path="/learn/auth/reset" element={<LearnAuthReset />} />
          <Route path="/learn/me/profile" element={<LearnProfile />} />
          <Route path="/learn/catalog" element={<LearnCatalogList />} />
          <Route path="/learn/catalog/:slug" element={<LearnCatalogCourse />} />
          <Route path="/learn/c/:slug" element={<LearnCourse />} />
          <Route path="/learn/c/:slug/l/:lessonId" element={<LearnLesson />} />
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
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
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
      <BrowserRouter>
        <ScrollToHash />
        <SeoManager />
        <AuthProvider>
          <LmsAuthProvider>
            <AppShell />
          </LmsAuthProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
