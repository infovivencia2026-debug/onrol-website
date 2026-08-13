import Footer from "@/components/shared/Footer";
import SEO from "@/components/seo/SEO";
import {
  organizationJsonLd,
  educationalOrganizationJsonLd,
  websiteJsonLd,
  videoObjectJsonLd,
  localBusinessJsonLd,
} from "@/lib/structuredData";
import { founderJsonLd } from "@/lib/founder";
import HomeHero from "@/components/home/HomeHero";
import HomeBrandIntro from "@/components/home/HomeBrandIntro";
import HomeVideoSection from "@/components/home/HomeVideoSection";
import HomePersonas from "@/components/home/HomePersonas";
import HomeCommunity from "@/components/home/HomeCommunity";
import HomeTestimonials from "@/components/home/HomeTestimonials";
// Merged-away (Wave 8 — duplicates collapsed per audit):
//   HomeFlowRibbon     → folded into HomeBrandIntro (same "what ONROL does" story)
//   HomeProgramsPreview → folded into HomeCurriculum (single-card → program detail)
//   HomeCompaniesMarquee → folded into HomeToolMarquee (one marquee strip)
//   HomeApex            → folded into HomeCommunity (community + next-step)
//   HomeCollaboration   → folded into HomeCommunity (partnership angle)
//   HomeSocial          → folded into HomeTestimonials (one social-proof block)
// HomeInterviews removed — overlapped HomeMentors + HomeTestimonials + HomeVideoSection
// per the user's "remove duplicate sections" feedback.
// HomeFinalCTA removed — superseded by HomeCommunity's "Ready to Build" banner.
import WhatsAppBubble from "@/components/home/WhatsAppBubble";
import ScrollProgress from "@/components/home/ScrollProgress";
import { Page } from "@/components/system/grid";

const Index = () => {
  return (
    <main className="onrol-marketing bg-white">
      <SEO
        title="ONROL - India's AI Execution School"
        description="ONROL is among India's top AI institutes for applied, builder-track AI in 2026. 3-month live cohort, 12 personas (engineers, students, teachers, founders, freelancers, working pros, marketers, real-estate, content creators, SMB owners, women returning to work, job-seekers), ship 3 deployed AI projects, no coding required. Free 90-min Masterclass on AI agents + vibe coding."
        path="/"
        jsonLd={[
          organizationJsonLd(),
          educationalOrganizationJsonLd(),
          localBusinessJsonLd(),
          websiteJsonLd(),
          founderJsonLd(),
          videoObjectJsonLd({
            name: "Why we built ONROL — From founder Dr. Neeraja Reddy",
            description:
              "Dr. Neeraja Reddy on the gap between AI curiosity and shipped projects, and what changes when you join an execution-first cohort.",
            thumbnailUrl: "https://onrol.in/onrol-logo-dark.png",
            uploadDate: "2026-04-15",
            contentUrl: "https://onrol.in/hero-video.mp4",
          }),
        ]}
      />
      <ScrollProgress />
      {/* Tightened stack (Wave 8 — merged 17 → 11 sections per audit):
           1. Hero          → headline + form + photo
           2. VideoSection  → founder video proof
           3. BrandIntro    → What is ONROL + What we do (merged with FlowRibbon)
           4. Curriculum    → AI Generalist Program + 3-month breakdown
           5. Difference    → ONROL vs alternatives
           6. Mentors       → practitioner faces
           7. ToolMarquee   → AI tools + companies strip (merged)
           8. Personas      → audience-specific entry paths
           9. Testimonials  → social proof (merged with Social)
          10. ContactForm   → human inquiry
          11. Community     → Apex + Collaboration + community + final CTA (merged)
       */}
      <div className="px-3 pt-16 sm:px-5 sm:pt-[72px] lg:px-8">
        <Page>
          <HomeHero />
          {/* Founder video right under the hero. */}
          <HomeVideoSection />
          <HomeBrandIntro />
          <HomePersonas />
          <HomeTestimonials />
          <HomeCommunity />
        </Page>
      </div>
      <Footer />

      <WhatsAppBubble />
      {/* Mobile bottom bar removed — the global <MobileBottomNav /> mounted in
          App.tsx already provides a "Free Masterclass" tab on mobile, and
          shipping both at z-40 stacked them in the same band (mobile audit). */}
    </main>
  );
};

export default Index;
