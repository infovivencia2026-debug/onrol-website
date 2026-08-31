import { useEffect } from "react";
import SEO from "@/components/seo/SEO";
import {
  organizationJsonLd,
  educationalOrganizationJsonLd,
  websiteJsonLd,
  localBusinessJsonLd,
} from "@/lib/structuredData";
import { founderJsonLd } from "@/lib/founder";
import { homeFaqJsonLd, homeVideoJsonLd } from "@/lib/homeSchema";
import { mountGlydiChrome, loadGlydiScripts, initGlydiCrmCapture, initSpaLinks } from "./glydi/chrome";
// Raw HTML body of the glydi/onrol-home single-page design (scripts stripped).
import markup from "./home-glydi/markup.html?raw";
// The home's own scripts (main inline + utils.js + nav-active), in load order.
import homeScripts from "./home-glydi/scripts.json";
import { initHomeMotion } from "./home-glydi/motion";

/**
 * Home page — a 1:1 takeover of the glydi/onrol-home static design. Its own nav,
 * hero, sections and footer are rendered; the global app navbar/footer are
 * hidden for "/" in App.tsx. Fonts/CSS/scroll-fix come from the shared
 * mountGlydiChrome() (so the home matches every other ported page).
 */
const HomeGlydi = () => {
  useEffect(() => {
    const cleanupChrome = mountGlydiChrome();
    // "Paper and ember" retheme. Injected AFTER styles.css (which mountGlydiChrome
    // appends at runtime) so equal-specificity overrides actually land.
    const theme = document.createElement("link");
    theme.rel = "stylesheet";
    theme.href = "/home-glydi/theme-light.css?v=paper1";
    theme.setAttribute("data-home-theme", "");
    document.head.appendChild(theme);
    const motionCss = document.createElement("link");
    motionCss.rel = "stylesheet";
    motionCss.href = "/home-glydi/theme-motion.css?v=paper1";
    motionCss.setAttribute("data-home-theme", "");
    document.head.appendChild(motionCss);
    // the page below the hero (see home-v2.css). Last,
    // so it settles on top of both the theme and the motion sheet.
    const depthCss = document.createElement("link");
    depthCss.rel = "stylesheet";
    depthCss.href = "/home-glydi/home-v2.css?v=v2";
    depthCss.setAttribute("data-home-theme", "");
    document.head.appendChild(depthCss);
    // links route in-app instead of reloading the document
    const cleanupLinks = initSpaLinks();
    const cleanupCrm = initGlydiCrmCapture("Home");
    const cleanupScripts = loadGlydiScripts(homeScripts as Array<{ src?: string; code?: string }>);
    // motion layer runs last: it tags nodes the ported scripts may re-render
    const cleanupMotion = initHomeMotion();
    return () => {
      cleanupMotion();
      cleanupScripts();
      cleanupLinks(); cleanupCrm();
      cleanupChrome();
      theme.remove();
      motionCss.remove();
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
          homeFaqJsonLd(),
          homeVideoJsonLd(),
        ]}
      />
      <div id="home-glydi" dangerouslySetInnerHTML={{ __html: markup }} />
    </>
  );
};

export default HomeGlydi;
