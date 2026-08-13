import { useEffect } from "react";
import SEO from "@/components/seo/SEO";
import { mountGlydiChrome, loadGlydiScripts, initGlydiCrmCapture } from "./chrome";
import { GLYDI_PAGES, glydiScripts } from "./registry";

/**
 * Renders a ported glydi/onrol-home sub-page by key. Each page ships its own
 * nav + footer (hidden global chrome), its own inline <style> (in the markup),
 * and its own scripts (inline + GSAP/modular JS) which we load in original order.
 */
const GlydiRoute = ({ page }: { page: keyof typeof GLYDI_PAGES }) => {
  const def = GLYDI_PAGES[page];

  useEffect(() => {
    const cleanupChrome = mountGlydiChrome();
    const cleanupCrm = initGlydiCrmCapture(def?.course || def?.title);
    const cleanupScripts = loadGlydiScripts(glydiScripts(page as string));
    window.scrollTo(0, 0);
    return () => { cleanupScripts(); cleanupCrm(); cleanupChrome(); };
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
