import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { SITE_URL, ORG_NAME, ORG_LOGO } from "@/lib/structuredData";

interface SEOProps {
  title: string;
  description: string;
  path?: string;        // e.g. "/best-ai-course-in-india" — defaults to current location
  image?: string;
  noindex?: boolean;
  jsonLd?: object | object[];
}

/**
 * Drop-in SEO component — sets <title>, meta tags, OG/Twitter, canonical,
 * canonical (self-referential; no hreflang alternates), and any per-page JSON-LD blocks.
 *
 * Imperatively manipulates document.head so it works inside Vite SPA AND
 * gets captured by the post-build Puppeteer prerender pass.
 */
/**
 * Map a page path to a REAL OG card that ships in public/og/*.png.
 *
 * og-cards.mjs generates category-level cards (default, programs, blog,
 * glossary, community, apex, tools). Per-slug cards only exist for prerendered
 * routes, and the deploy build (`vite build`) skips prerender — so we resolve
 * every page to a card that is guaranteed to exist rather than a per-slug URL
 * that 404s (which previously left every share/AI-citation preview imageless).
 * An explicit `image` prop still wins.
 */
function deriveOgImage(pathname: string): string {
  const cleaned = pathname.replace(/^\/+|\/+$/g, "");
  const card =
    /^programs(\/|$)/.test(cleaned) || cleaned === "cybersecurity" || cleaned === "soc-analyst" ? "programs"
      : cleaned.startsWith("blog") ? "blog"
      : cleaned.startsWith("glossary") ? "glossary"
      : cleaned.startsWith("community") ? "community"
      : cleaned.startsWith("apex") ? "apex"
      : cleaned.startsWith("tools") ? "tools"
      : "default";
  return `${SITE_URL}/og/${card}.png`;
}

export default function SEO({ title, description, path, image, noindex, jsonLd }: SEOProps) {
  const location = useLocation();
  const effectivePath = path ?? location.pathname;
  const url = `${SITE_URL}${effectivePath}`;
  const ogImage = image || deriveOgImage(effectivePath) || ORG_LOGO;

  useEffect(() => {
    // ── <title> ─────────────────────────────────────────────────────
    document.title = title;

    const set = (name: string, content: string, attr: "name" | "property" = "name") => {
      let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    set("description", description);
    set("robots", noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1");
    set("og:title", title, "property");
    set("og:description", description, "property");
    set("og:url", url, "property");
    set("og:image", ogImage, "property");
    set("og:type", "website", "property");
    set("og:site_name", ORG_NAME, "property");
    set("twitter:card", "summary_large_image");
    set("twitter:title", title);
    set("twitter:description", description);
    set("twitter:image", ogImage);

    // ── canonical + hreflang ───────────────────────────────────────
    const upsertLink = (rel: string, hreflang: string | null, href: string) => {
      const sel = hreflang ? `link[rel="${rel}"][hreflang="${hreflang}"]` : `link[rel="${rel}"]`;
      let el = document.head.querySelector<HTMLLinkElement>(sel);
      if (!el) {
        el = document.createElement("link");
        el.setAttribute("rel", rel);
        if (hreflang) el.setAttribute("hreflang", hreflang);
        document.head.appendChild(el);
      }
      el.setAttribute("href", href);
    };
    upsertLink("canonical", null, url);
    // No hreflang alternates: every page has a single en-IN version, so a
    // self-referential-only hreflang cluster (all pointing at the same URL)
    // adds no signal and can trigger "no return tags" warnings. Canonical
    // alone is correct here. Wire real alternates only if a true en-US (or
    // other locale) version of each page ships.

    // ── JSON-LD blocks ─────────────────────────────────────────────
    // Tag every script we add so we can clear them on unmount.
    const tag = `seo-jsonld-${path ?? location.pathname}`;
    document.head
      .querySelectorAll<HTMLScriptElement>(`script[data-seo-tag="${tag}"]`)
      .forEach((el) => el.remove());
    if (jsonLd) {
      const blocks = Array.isArray(jsonLd) ? jsonLd : [jsonLd];
      for (const b of blocks) {
        const s = document.createElement("script");
        s.type = "application/ld+json";
        s.dataset.seoTag = tag;
        s.text = JSON.stringify(b);
        document.head.appendChild(s);
      }
    }
    return () => {
      document.head
        .querySelectorAll<HTMLScriptElement>(`script[data-seo-tag="${tag}"]`)
        .forEach((el) => el.remove());
    };
  }, [title, description, url, ogImage, noindex, jsonLd, path, location.pathname]);

  return null;
}
