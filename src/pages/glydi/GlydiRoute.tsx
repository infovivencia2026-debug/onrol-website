import { useEffect } from "react";
import SEO from "@/components/seo/SEO";
import { mountGlydiChrome, loadGlydiScripts, initGlydiCrmCapture, initApplyModal, initSpaLinks } from "./chrome";
import { GLYDI_PAGES, glydiScripts } from "./registry";
import { initProgramsMotion } from "./programsMotion";
import { initProgramPage } from "./programPage";

/** Single-screen "stage" pages (see programs-stage.css). */
const STAGE_PAGES = new Set(["programs", "ai-programs", "cyber-programs"]);

/** The five program pages on the console template (see program-console.css). */
const DETAIL_PAGES = new Set(["aica", "ai-generalist", "ai-architect", "cybersecurity", "soc-analyst"]);

/** Pages that share the programs template (see programs-theme.css). */
const PROGRAM_PAGES = new Set([
  "aica", "ai-generalist", "ai-architect", "cybersecurity", "soc-analyst", "masterclass",
]);

/**
 * Renders a ported glydi/onrol-home sub-page by key. Each page ships its own
 * nav + footer (hidden global chrome), its own inline <style> (in the markup),
 * and its own scripts (inline + GSAP/modular JS) which we load in original order.
 */
const GlydiRoute = ({ page }: { page: keyof typeof GLYDI_PAGES }) => {
  const def = GLYDI_PAGES[page];

  useEffect(() => {
    const cleanupChrome = mountGlydiChrome();
    // Shared template for the programs family. Injected AFTER styles.css
    // (which mountGlydiChrome appends at runtime) so equal-specificity
    // overrides land, and only for the pages that use it.
    let theme: HTMLLinkElement | null = null;
    const stylesheet = STAGE_PAGES.has(page as string)
      ? "/home-glydi/programs-cards.css?v=gp1"
      : DETAIL_PAGES.has(page as string)
        ? "/home-glydi/program-console.css?v=pc1"
        : PROGRAM_PAGES.has(page as string)
          ? "/home-glydi/programs-theme.css?v=pg1"
          : null;
    if (stylesheet) {
      theme = document.createElement("link");
      theme.rel = "stylesheet";
      theme.href = stylesheet;
      theme.setAttribute("data-programs-theme", "");
      document.head.appendChild(theme);
      // the page theme just went in after it: put the type pairing back last
      const typeLink = document.querySelector<HTMLLinkElement>("link[href*='type-system.css']");
      if (typeLink) document.head.appendChild(typeLink);
    }
    // the Apply dialog, wired for every sub-page (see initApplyModal): the
    // ported markup could not be relied on to carry either the hook or the
    // dialog itself
    // links route in-app instead of reloading the document
    const cleanupLinks = initSpaLinks();
    const cleanupApply = initApplyModal();
    const cleanupCrm = initGlydiCrmCapture(def?.course || def?.title);
    const cleanupScripts = loadGlydiScripts(glydiScripts(page as string));
    // the shared template supplies its own reveal hooks: not every page in
    // the family ships a .reveal observer of its own
    const cleanupMotion = PROGRAM_PAGES.has(page as string) ? initProgramsMotion() : () => {};
    // scroll-spy over the curriculum index + the reading progress rail
    const cleanupDetail = DETAIL_PAGES.has(page as string) ? initProgramPage() : () => {};
    window.scrollTo(0, 0);
    return () => { cleanupDetail(); cleanupMotion(); cleanupScripts(); cleanupCrm(); cleanupLinks(); cleanupApply(); cleanupChrome(); theme?.remove(); };
  }, [page]);

  if (!def) return null;

  return (
    <>
      <SEO title={def.title} description={def.description} path={def.path} />
      <div id="home-glydi" dangerouslySetInnerHTML={{ __html: def.markup }} />
    </>
  );
};

export default GlydiRoute;
