import { useEffect } from "react";
import SEO from "@/components/seo/SEO";
import {
  organizationJsonLd,
  educationalOrganizationJsonLd,
  websiteJsonLd,
  localBusinessJsonLd,
} from "@/lib/structuredData";
import { founderJsonLd } from "@/lib/founder";
import { mountGlydiChrome, loadGlydiScripts, initGlydiCrmCapture } from "./glydi/chrome";
// Raw HTML body of the glydi/onrol-home single-page design (scripts stripped).
import markup from "./home-glydi/markup.html?raw";
// The home's own scripts (main inline + utils.js + nav-active), in load order.
import homeScripts from "./home-glydi/scripts.json";

/**
 * Home page — a 1:1 takeover of the glydi/onrol-home static design. Its own nav,
 * hero, sections and footer are rendered; the global app navbar/footer are
 * hidden for "/" in App.tsx. Fonts/CSS/scroll-fix come from the shared
 * mountGlydiChrome() (so the home matches every other ported page).
 */
const HomeGlydi = () => {
  useEffect(() => {
    const cleanupChrome = mountGlydiChrome();
    const cleanupCrm = initGlydiCrmCapture("Home");
    const cleanupScripts = loadGlydiScripts(homeScripts as Array<{ src?: string; code?: string }>);
    return () => {
      cleanupScripts();
      cleanupCrm();
      cleanupChrome();
    };
  }, []);

  return (
    <>
      <SEO
        title="ONROL - India's AI Execution School"
        description="ONROL is India's AI Execution School. Stop watching tutorials and start building — master vibe coding and ship real-world AI projects for your portfolio."
        path="/"
        jsonLd={[
          organizationJsonLd(),
          educationalOrganizationJsonLd(),
          localBusinessJsonLd(),
          websiteJsonLd(),
          founderJsonLd(),
        ]}
      />
      <div id="home-glydi" dangerouslySetInnerHTML={{ __html: markup }} />
    </>
  );
};

export default HomeGlydi;
