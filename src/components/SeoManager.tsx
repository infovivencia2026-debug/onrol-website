import { useEffect } from "react";
import { useLocation } from "react-router-dom";

type SeoConfig = {
  title: string;
  description: string;
  type?: "website" | "article";
};

const BASE_URL = "https://onrol.in";
const DEFAULT_IMAGE = `${BASE_URL.replace(/\/$/, "")}/onrol-logo-dark.png`;

const ROUTE_META: Array<{ test: (path: string) => boolean; seo: SeoConfig }> = [
  {
    test: (path) => path === "/",
    seo: {
      title: "ONROL - India's AI Execution School",
      description:
        "Stop learning AI. Start earning from it. ONROL helps learners ship real AI projects, automate workflows, and unlock 6 income paths — live cohort, zero coding, India-priced.",
    },
  },
  {
    test: (path) => path === "/programs",
    seo: {
      title: "ONROL Programs - AI Generalist & AI Architect",
      description:
        "Explore ONROL programs built for execution: AI Generalist and AI Architect. Structured outcomes, hands-on modules, and career-ready proof.",
    },
  },
  {
    test: (path) => path === "/programs/ai-generalist",
    seo: {
      title: "AI Generalist Program | ONROL",
      description:
        "3-month career accelerator: build your AI portfolio with 5 AI systems, 7+ deployed projects, and freelance-ready proof. Live cohort, mentor-led, no coding required.",
    },
  },
  {
    test: (path) => path === "/programs/ai-architect",
    seo: {
      title: "AI Architect Program | ONROL",
      description:
        "Advanced 9-week execution track for orchestration, systems thinking, deployment capability, and stronger portfolio outcomes.",
    },
  },
  {
    test: (path) => path.startsWith("/community/dashboard"),
    seo: {
      title: "ONROL Community",
      description:
        "Execution-first AI community feed with tools, news, prompts, workshops, courses, and practical learning resources.",
    },
  },
  {
    test: (path) => path.startsWith("/community/posts/"),
    seo: {
      title: "Community Post | ONROL",
      description: "Read curated ONROL community updates, actionable insights, and practical AI implementation guidance.",
      type: "article",
    },
  },
  {
    test: (path) => path === "/login",
    seo: {
      title: "Community Login | ONROL",
      description: "Login to access ONROL Community and execution-focused AI updates.",
    },
  },
  {
    test: (path) => path === "/signup",
    seo: {
      title: "Create Account | ONROL",
      description: "Create your ONROL account to join community learning, workshops, and practical AI tracks.",
    },
  },
  {
    test: (path) => path.startsWith("/survey"),
    seo: {
      title: "ONROL Survey",
      description: "Complete the ONROL diagnostic survey and receive a personalized AI growth pathway.",
    },
  },
  {
    test: (path) => path === "/task",
    seo: {
      title: "Office Task Manager | ONROL",
      description:
        "Internal office task manager for employee and admin workflows with daily planning, progress tracking, and management visibility.",
    },
  },
  {
    test: (path) => path === "/task/login",
    seo: {
      title: "Task Manager Login | ONROL",
      description: "Sign in to access ONROL Office Task Manager.",
    },
  },
  {
    test: (path) => path === "/privacy-policy",
    seo: {
      title: "Privacy Policy | ONROL",
      description: "Read ONROL privacy policy and data handling practices.",
    },
  },
  {
    test: (path) => path === "/terms-and-conditions",
    seo: {
      title: "Terms and Conditions | ONROL",
      description: "Review ONROL terms and conditions for enrollment, access, and usage.",
    },
  },
  {
    test: (path) => path === "/refund-policy",
    seo: {
      title: "Refund Policy | ONROL",
      description: "Understand ONROL refund and transfer policy details.",
    },
  },
];

const getMeta = (pathname: string): SeoConfig => {
  return (
    ROUTE_META.find((route) => route.test(pathname))?.seo ?? {
      title: "ONROL",
      description:
        "ONROL helps learners transform AI curiosity into deployable products, practical execution capability, and career momentum.",
    }
  );
};

const getRouteSchema = (pathname: string, canonical: string) => {
  if (pathname === "/") {
    return {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "ONROL",
      url: BASE_URL,
      potentialAction: {
        "@type": "SearchAction",
        target: `${BASE_URL}/community/dashboard?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    };
  }

  if (pathname === "/programs/ai-generalist") {
    return {
      "@context": "https://schema.org",
      "@type": "Course",
      name: "AI Generalist Program",
      provider: {
        "@type": "Organization",
        name: "ONROL",
        url: BASE_URL,
      },
      url: canonical,
      educationalLevel: "Beginner",
      inLanguage: "en-IN",
    };
  }

  if (pathname === "/programs") {
    return {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "ONROL Programs",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "AI Generalist Program", url: `${BASE_URL}/programs/ai-generalist` },
      ],
    };
  }

  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: document.title,
    url: canonical,
    inLanguage: "en-IN",
  };
};

const upsertMeta = (selector: string, create: () => HTMLMetaElement, content: string) => {
  let el = document.head.querySelector(selector) as HTMLMetaElement | null;
  if (!el) {
    el = create();
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
};

const upsertLink = (selector: string, create: () => HTMLLinkElement, href: string) => {
  let el = document.head.querySelector(selector) as HTMLLinkElement | null;
  if (!el) {
    el = create();
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
};

const upsertJsonLd = (id: string, payload: Record<string, unknown>) => {
  let el = document.head.querySelector(`#${id}`) as HTMLScriptElement | null;
  if (!el) {
    el = document.createElement("script");
    el.type = "application/ld+json";
    el.id = id;
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(payload);
};

export default function SeoManager() {
  const location = useLocation();

  useEffect(() => {
    const seo = getMeta(location.pathname);
    const canonical = `${BASE_URL}${location.pathname}${location.search}`;
    const title = seo.title;
    const description = seo.description;
    const type = seo.type ?? "website";

    document.title = title;

    upsertMeta('meta[name="description"]', () => {
      const meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      return meta;
    }, description);

    upsertMeta('meta[name="robots"]', () => {
      const meta = document.createElement("meta");
      meta.setAttribute("name", "robots");
      return meta;
    }, "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1");

    upsertMeta('meta[property="og:title"]', () => {
      const meta = document.createElement("meta");
      meta.setAttribute("property", "og:title");
      return meta;
    }, title);

    upsertMeta('meta[property="og:description"]', () => {
      const meta = document.createElement("meta");
      meta.setAttribute("property", "og:description");
      return meta;
    }, description);

    upsertMeta('meta[property="og:type"]', () => {
      const meta = document.createElement("meta");
      meta.setAttribute("property", "og:type");
      return meta;
    }, type);

    upsertMeta('meta[property="og:url"]', () => {
      const meta = document.createElement("meta");
      meta.setAttribute("property", "og:url");
      return meta;
    }, canonical);

    upsertMeta('meta[property="og:image"]', () => {
      const meta = document.createElement("meta");
      meta.setAttribute("property", "og:image");
      return meta;
    }, DEFAULT_IMAGE);

    upsertMeta('meta[name="twitter:card"]', () => {
      const meta = document.createElement("meta");
      meta.setAttribute("name", "twitter:card");
      return meta;
    }, "summary_large_image");

    upsertMeta('meta[name="twitter:title"]', () => {
      const meta = document.createElement("meta");
      meta.setAttribute("name", "twitter:title");
      return meta;
    }, title);

    upsertMeta('meta[name="twitter:description"]', () => {
      const meta = document.createElement("meta");
      meta.setAttribute("name", "twitter:description");
      return meta;
    }, description);

    upsertMeta('meta[name="twitter:image"]', () => {
      const meta = document.createElement("meta");
      meta.setAttribute("name", "twitter:image");
      return meta;
    }, DEFAULT_IMAGE);

    upsertLink('link[rel="canonical"]', () => {
      const link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      return link;
    }, canonical);

    // AEO-friendly Organization + WebPage schemas
    upsertJsonLd("seo-org-jsonld", {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "ONROL",
      url: BASE_URL,
      logo: DEFAULT_IMAGE,
      description:
        "ONROL is a talent-to-income AI education and execution platform focused on practical outcomes.",
      sameAs: [
        "https://www.youtube.com/@onrolofficial",
        "https://www.instagram.com/onrol.in/",
        "https://in.linkedin.com/company/onrol",
      ],
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: "info@onrol.in",
        telephone: "+91-9609312345",
        areaServed: "IN",
      },
      address: {
        "@type": "PostalAddress",
        addressLocality: "Hyderabad",
        addressCountry: "IN",
      },
    });

    upsertJsonLd("seo-webpage-jsonld", {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: title,
      description,
      url: canonical,
      isPartOf: {
        "@type": "WebSite",
        name: "ONROL",
        url: BASE_URL,
      },
      about: "AI education, automation, and execution-first learning",
      inLanguage: "en-IN",
    });

    upsertJsonLd("seo-route-jsonld", getRouteSchema(location.pathname, canonical));
  }, [location.pathname, location.search]);

  return null;
}
