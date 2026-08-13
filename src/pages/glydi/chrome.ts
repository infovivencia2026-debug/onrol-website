/**
 * Shared runtime chrome for every ported glydi/onrol-home page.
 * - mountGlydiChrome(): loads fonts + styles.css and restores a single native
 *   document scroller (the app shell otherwise scrolls #root, which breaks the
 *   design's window-scroll + kills the mouse wheel via a double scroller).
 * - initNav(): the mobile hamburger toggle present on every page.
 * - initLeadForm(): the AI Generalist brochure → WhatsApp handler.
 * Each returns a cleanup function. Source: github.com/glydi/onrol-home.
 */
// Cache-buster: styles.css keeps the same filename but its contents change with
// each design update. Bump this whenever styles.css is updated.
const ASSET_V = "manrope2";
const STYLES_HREF = `/home-glydi/styles.css?v=${ASSET_V}`;

// Manrope is self-hosted via @font-face in styles.css; this stack matches it and
// (critically) does NOT include Fira Sans — the app's global marketing heading
// font that would otherwise leak into these pages.
const GLYDI_FONT =
  "'Manrope', system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

// Google Sheet mirror (legacy program forms). Kept for initLeadForm/contact.
const SHEET_WEBHOOK_URL = import.meta.env.VITE_APPS_SCRIPT_CAREER_CATALYST_URL as string | undefined;

export function mountGlydiChrome(): () => void {
  document.body.classList.add("loading");

  const styles = document.createElement("link");
  styles.rel = "stylesheet";
  styles.href = STYLES_HREF;
  styles.setAttribute("data-home-glydi", "");
  document.head.appendChild(styles);

  // Single native scroller: <html> scrolls, <body> clips-x but isn't itself a
  // scroller (a double html+body scroller silently disables the mouse wheel).
  const scrollFix = document.createElement("style");
  scrollFix.setAttribute("data-home-glydi", "");
  scrollFix.textContent =
    "html{height:auto!important;overflow-x:hidden!important;overflow-y:auto!important;scroll-snap-type:none!important;}" +
    "body{height:auto!important;min-height:0!important;overflow-x:clip!important;overflow-y:visible!important;}" +
    "#root{height:auto!important;min-height:0!important;overflow:visible!important;}" +
    // Stop the app's global heading font (Fira Sans) leaking into these pages.
    `#home-glydi{font-family:${GLYDI_FONT};}` +
    `#home-glydi :is(h1,h2,h3,h4,h5,h6){font-family:${GLYDI_FONT}!important;}` +
    // Neutralise any stray empty app <section> that renders before #home-glydi
    // (widgets.js used to tag it #main-content and it picked up padding → gap).
    "#root>section:not(#home-glydi){padding:0!important;min-height:0!important;margin:0!important;height:auto!important;}" +
    // The card grids use auto-fit minmax(214px); the SPA's scrollbar shaves ~15px
    // off the width, dropping 5→4 columns. A slightly smaller min keeps 5 in a row.
    "#home-glydi .build-grid{grid-template-columns:repeat(auto-fit,minmax(198px,1fr))!important;}";
  document.head.appendChild(scrollFix);

  return () => {
    styles.remove();
    scrollFix.remove();
    document.body.classList.remove("loading");
  };
}

type GlydiScript = { src?: string; code?: string };

/**
 * Load a page's scripts in their original order (external → wait onload → next;
 * inline → execute immediately). This reproduces the static site's behaviour:
 * config.js before the modules, GSAP before motion.js, etc. Returns a cleanup
 * that removes the injected <script> nodes and kills any GSAP ScrollTriggers.
 */
export function loadGlydiScripts(scripts: GlydiScript[]): () => void {
  const nodes: HTMLScriptElement[] = [];
  let cancelled = false;

  const run = async () => {
    for (const s of scripts) {
      if (cancelled) return;
      await new Promise<void>((resolve) => {
        const el = document.createElement("script");
        el.setAttribute("data-home-glydi", "");
        if (s.src) {
          // Cache-bust our own module JS (bump ASSET_V) so edits take effect.
          el.src = s.src.startsWith("/home-glydi/") ? `${s.src}${s.src.includes("?") ? "&" : "?"}v=${ASSET_V}` : s.src;
          el.async = false;
          el.onload = () => resolve();
          el.onerror = () => resolve(); // don't stall the chain on a failed CDN
          document.body.appendChild(el);
        } else {
          el.textContent = s.code || "";
          document.body.appendChild(el);
          resolve(); // inline executes synchronously on append
        }
        nodes.push(el);
      });
    }
  };
  run();

  return () => {
    cancelled = true;
    // Kill GSAP ScrollTriggers so they don't leak / error after unmount.
    const w = window as unknown as { ScrollTrigger?: { getAll?: () => Array<{ kill: () => void }> } };
    try { w.ScrollTrigger?.getAll?.().forEach((t) => t.kill()); } catch { /* ignore */ }
    nodes.forEach((n) => n.remove());
  };
}

/**
 * Universal CRM capture for EVERY form on a glydi page. A single capture-phase
 * submit listener reads the fields of any form inside #home-glydi and posts the
 * lead to the ONROL CRM (+ Google Sheet mirror) — in ADDITION to whatever the
 * page's own handler does (WhatsApp / Web3Forms / thank-you). Fire-and-forget,
 * never calls preventDefault, so it can't disrupt the existing flow.
 */
export function initGlydiCrmCapture(sourceLabel?: string): () => void {
  const onSubmit = (e: Event) => {
    const form = e.target as HTMLFormElement | null;
    if (!form || form.tagName !== "FORM" || !form.closest("#home-glydi")) return;
    const get = (names: string[]) => {
      for (const n of names) {
        const el = form.querySelector<HTMLInputElement>(`[name="${n}"], #${n}`);
        const v = el?.value?.trim();
        if (v) return v;
      }
      return "";
    };
    const name = get(["fullName", "name", "leadName", "yourName", "q-name"]);
    const email = get(["email", "leadEmail", "newsletterEmail", "q-email"]);
    const phone = get(["phone", "leadPhone", "mobile", "whatsapp", "q-phone"]);
    const role = get(["role", "current_role", "occupation"]);
    const message = get(["message", "notes"]);
    if (!email && !phone) return; // nothing capturable (e.g. hidden/empty)

    const program =
      form.getAttribute("data-lead") ||
      sourceLabel ||
      (form.id === "newsletterForm" ? "Newsletter" : document.title.replace(/\s*[·|].*$/, "").trim() || "Website");
    const campaign = program.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    try {
      fetch("https://go.onrol.in/api/public/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ name, phone, email, role, source: program, campaign, notes: message }),
        keepalive: true,
      }).catch(() => {});
    } catch { /* never block */ }

    if (SHEET_WEBHOOK_URL) {
      try {
        fetch(SHEET_WEBHOOK_URL, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({
            form_type: program.toLowerCase().replace(/[^a-z0-9]+/g, ""),
            name, full_name: name, phone, email, role,
            source: program, campaign,
            page_path: window.location.pathname,
            notes: message,
          }),
          keepalive: true,
        }).catch(() => {});
      } catch { /* never block */ }
    }
  };
  document.addEventListener("submit", onSubmit, true);
  return () => document.removeEventListener("submit", onSubmit, true);
}

/**
 * Common interactions shared by the ported sub-pages: mobile nav toggle,
 * Apply lead-modal (→ WhatsApp + CRM), newsletter, track tabs (programs page),
 * `.anim` scroll-reveal, footer scramble, section-adaptive logo colour, and
 * hide-nav-on-scroll. Safe to run on every sub-page (each block guards on its
 * own elements). Returns a cleanup that removes all listeners/observers.
 */
export function initGlydiCommon(): () => void {
  const disposers: Array<() => void> = [];
  const on = (
    t: Window | Document | HTMLElement | Element,
    type: string,
    fn: EventListenerOrEventListenerObject,
    opts?: boolean | AddEventListenerOptions,
  ) => { t.addEventListener(type, fn, opts); disposers.push(() => t.removeEventListener(type, fn, opts)); };
  const observe = (io: IntersectionObserver) => { disposers.push(() => io.disconnect()); return io; };
  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* nav toggle */
  (function () {
    const nav = document.querySelector(".nav");
    const toggle = document.getElementById("navToggle");
    if (!nav || !toggle) return;
    on(toggle, "click", () => { const open = nav.classList.toggle("open"); toggle.setAttribute("aria-expanded", open ? "true" : "false"); });
    nav.querySelectorAll<HTMLElement>(".nav-links a").forEach((a) =>
      on(a, "click", () => { nav.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); }));
  })();

  /* Apply Now lead modal → WhatsApp + CRM */
  (function () {
    const modal = document.getElementById("leadModal");
    if (!modal) return;
    const form = document.getElementById("leadForm") as HTMLFormElement | null;
    const closeBtn = document.getElementById("leadClose");
    let lastFocus: HTMLElement | null = null;
    const open = (e?: Event) => {
      if (e) e.preventDefault();
      lastFocus = document.activeElement as HTMLElement;
      modal.hidden = false;
      document.documentElement.style.overflow = "hidden";
      (document.getElementById("leadName") as HTMLInputElement)?.focus();
    };
    const close = () => { modal.hidden = true; document.documentElement.style.overflow = ""; lastFocus?.focus(); };
    document.querySelectorAll<HTMLElement>(".js-apply").forEach((a) => on(a, "click", open));
    if (closeBtn) on(closeBtn, "click", close);
    on(modal, "click", (e) => { if (e.target === modal) close(); });
    on(document, "keydown", (e) => { if ((e as KeyboardEvent).key === "Escape" && !modal.hidden) close(); });
    if (form) on(form, "submit", (e) => {
      e.preventDefault();
      const name = (document.getElementById("leadName") as HTMLInputElement)?.value.trim();
      const email = (document.getElementById("leadEmail") as HTMLInputElement)?.value.trim();
      const phone = (document.getElementById("leadPhone") as HTMLInputElement)?.value.trim();
      if (!name || !email || !phone) return;
      try {
        fetch("https://go.onrol.in/api/public/leads", {
          method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ name, phone, email, source: "Apply modal", campaign: "apply" }), keepalive: true,
        }).catch(() => {});
      } catch { /* never block */ }
      const text = "Hi ONROL, I’d like to apply for the next cohort.%0A%0AName: " + encodeURIComponent(name) +
        "%0AEmail: " + encodeURIComponent(email) + "%0APhone: " + encodeURIComponent(phone);
      window.open("https://wa.me/918121306701?text=" + text, "_blank", "noopener,noreferrer");
      close(); form.reset();
    });
  })();

  /* newsletter */
  (function () {
    const form = document.getElementById("newsletterForm") as HTMLFormElement | null;
    const msg = document.getElementById("newsMsg");
    if (!form) return;
    on(form, "submit", (e) => {
      e.preventDefault();
      const email = (document.getElementById("newsletterEmail") as HTMLInputElement)?.value.trim();
      if (!email) return;
      if (msg) msg.hidden = false;
      form.reset();
    });
  })();

  /* track tabs (programs page): switch AI / Cyber panels */
  (function () {
    const tabs = document.querySelectorAll<HTMLElement>(".ptab");
    const panels = document.querySelectorAll<HTMLElement>(".ppanel");
    if (!tabs.length) return;
    tabs.forEach((tab) => on(tab, "click", () => {
      const t = tab.getAttribute("data-track");
      tabs.forEach((x) => { const isOn = x === tab; x.classList.toggle("is-on", isOn); x.setAttribute("aria-selected", isOn ? "true" : "false"); });
      panels.forEach((p) => p.classList.toggle("is-on", p.getAttribute("data-track") === t));
    }));
  })();

  /* scroll-reveal (content is gated hidden until revealed). Different sub-pages
     use .anim, .rv or .reveal for the same pattern; a revealed element also
     stagger-reveals its .t bento tiles (which gate on a `.show` class). */
  (function () {
    document.body.classList.add("anim-ready");
    const els = document.querySelectorAll<HTMLElement>(".anim, .rv, .reveal");
    if (!els.length) return;
    const timers: number[] = [];
    const revealEl = (el: Element) => {
      el.classList.add("in");
      el.querySelectorAll<HTMLElement>(".t").forEach((t, i) => {
        const id = window.setTimeout(() => t.classList.add("show"), reduce ? 0 : i * 80);
        timers.push(id);
      });
    };
    if (reduce || !("IntersectionObserver" in window)) { els.forEach(revealEl); return; }
    const io = observe(new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { revealEl(e.target); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }));
    els.forEach((el) => io.observe(el));
    disposers.push(() => { document.body.classList.remove("anim-ready"); timers.forEach((t) => clearTimeout(t)); });
  })();

  /* footer scramble */
  (function () {
    const footer = document.querySelector(".footer");
    if (!footer || reduce) return;
    const CH = "!<>-_\\/[]{}=+*^?#@%$&";
    const targets = footer.querySelectorAll<HTMLElement>("h3, h4, .f-tag");
    const decode = (el: HTMLElement & { _dec?: boolean }, delay: number) => {
      if (el._dec) return; el._dec = true;
      const finalText = el.getAttribute("data-text") || el.textContent || "";
      el.setAttribute("data-text", finalText);
      const queue: Array<{ to: string; start: number; end: number; ch?: string }> = [];
      let frame = 0;
      for (let i = 0; i < finalText.length; i++) {
        const c = finalText[i];
        if (c === " ") { queue.push({ to: " ", start: 0, end: 0 }); continue; }
        const start = delay + Math.floor(Math.random() * 16);
        queue.push({ to: c, start, end: start + 14 + Math.floor(Math.random() * 24), ch: "" });
      }
      (function step() {
        let out = "", done = 0;
        for (const q of queue) {
          if (frame >= q.end) { done++; out += q.to; }
          else if (frame >= q.start) { if (!q.ch || Math.random() < 0.3) q.ch = CH[Math.floor(Math.random() * CH.length)]; out += '<span class="dec">' + q.ch + "</span>"; }
        }
        el.innerHTML = out; frame++;
        if (done < queue.length) requestAnimationFrame(step); else { el.textContent = finalText; el._dec = false; }
      })();
    };
    footer.querySelectorAll<HTMLElement>("a, h3, h4, .f-tag").forEach((el) => on(el, "mouseenter", () => decode(el, 0)));
    const io = observe(new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { targets.forEach((el, i) => decode(el, i * 5)); io.disconnect(); } });
    }, { threshold: 0.2 }));
    io.observe(footer);
  })();

  /* logo colour adapts to section behind it */
  (function () {
    const logo = document.querySelector<HTMLElement>(".site-logo");
    if (!logo || !("IntersectionObserver" in window)) return;
    const darks: Element[] = [];
    [".hero", ".cta-section", ".footer"].forEach((sel) => document.querySelectorAll(sel).forEach((el) => darks.push(el)));
    if (!darks.length) return;
    const active = new Set<Element>();
    const io = observe(new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) active.add(e.target); else active.delete(e.target); });
      logo.classList.toggle("on-dark", active.size > 0);
    }, { rootMargin: "-44px 0px -92% 0px", threshold: 0 }));
    darks.forEach((el) => io.observe(el));
  })();

  /* nav: hide on scroll down, show on scroll up */
  (function () {
    const nav = document.querySelector(".nav");
    if (!nav) return;
    let last = window.pageYOffset || 0, ticking = false;
    const onScroll = () => {
      ticking = false;
      const y = window.pageYOffset || document.documentElement.scrollTop || 0;
      if (nav.classList.contains("open")) { nav.classList.remove("nav-hidden"); last = y; return; }
      if (y > last && y > 140) nav.classList.add("nav-hidden"); else nav.classList.remove("nav-hidden");
      last = y < 0 ? 0 : y;
    };
    on(window, "scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  })();

  return () => disposers.forEach((d) => d());
}

export function initNav(): () => void {
  const nav = document.querySelector(".nav");
  const toggle = document.getElementById("navToggle");
  if (!nav || !toggle) return () => {};
  const onToggle = () => {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  };
  toggle.addEventListener("click", onToggle);
  const linkHandlers: Array<[HTMLElement, () => void]> = [];
  nav.querySelectorAll<HTMLElement>(".nav-links a").forEach((a) => {
    const h = () => {
      nav.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    };
    a.addEventListener("click", h);
    linkHandlers.push([a, h]);
  });
  return () => {
    toggle.removeEventListener("click", onToggle);
    linkHandlers.forEach(([a, h]) => a.removeEventListener("click", h));
  };
}

export function initLeadForm(course = "AI Generalist"): () => void {
  const form = document.getElementById("leadForm") as HTMLFormElement | null;
  const toast = document.getElementById("toast");
  if (!form) return () => {};
  const onSubmit = (event: Event) => {
    event.preventDefault();
    const name = (document.getElementById("fullName") as HTMLInputElement)?.value.trim();
    const phone = (document.getElementById("phone") as HTMLInputElement)?.value.trim();
    const email = (document.getElementById("email") as HTMLInputElement)?.value.trim();
    const role = (document.getElementById("role") as HTMLSelectElement)?.value;
    if (!name || !phone || !email || !role) return;
    // Capture the lead into the ONROL CRM (same intake the old landing form
    // used). Fire-and-forget so the WhatsApp hand-off below is never blocked.
    try {
      fetch("https://go.onrol.in/api/public/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          name, phone, email, role,
          tag: "bulk",
          source: `${course} landing`,
          campaign: course.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
          notes: role ? `role: ${role}` : "",
        }),
        keepalive: true,
      }).catch(() => {});
    } catch { /* capture never blocks the form */ }
    // Mirror the submission to the Google Sheet (Apps Script web app), same as
    // the old landing form. form_type routes it to the program's tab.
    if (SHEET_WEBHOOK_URL) {
      try {
        const p = new URLSearchParams(window.location.search);
        const formType = course.toLowerCase().replace(/[^a-z0-9]+/g, "");
        const campaign = course.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        fetch(SHEET_WEBHOOK_URL, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({
            form_type: formType,
            name, full_name: name, phone, email, role,
            source: `${course} landing`,
            campaign,
            page_path: window.location.pathname,
            referrer: document.referrer || "",
            user_agent: navigator.userAgent || "",
            utm_source: p.get("utm_source") || "",
            utm_medium: p.get("utm_medium") || "",
            utm_campaign: p.get("utm_campaign") || campaign,
          }),
          keepalive: true,
        }).catch(() => {});
      } catch { /* sheet mirror never blocks the form */ }
    }
    // Show an on-page confirmation instead of redirecting to WhatsApp.
    if (toast) {
      toast.textContent = "Thank you for registering, we will contact you soon..";
      toast.classList.add("show");
      setTimeout(() => { if (toast) toast.classList.remove("show"); }, 6000);
    }
    form.reset();
  };
  form.addEventListener("submit", onSubmit);
  return () => form.removeEventListener("submit", onSubmit);
}

export function initContactForm(): () => void {
  const form = document.getElementById("contactForm") as HTMLFormElement | null;
  const toast = document.getElementById("toast");
  if (!form) return () => {};
  const onSubmit = (e: Event) => {
    e.preventDefault();
    const name = (document.getElementById("name") as HTMLInputElement)?.value.trim();
    const email = (document.getElementById("email") as HTMLInputElement)?.value.trim();
    const phone = (document.getElementById("phone") as HTMLInputElement)?.value.trim();
    const message = (document.getElementById("message") as HTMLTextAreaElement)?.value.trim();
    if (!name || !email || !message) return;
    // Fire-and-forget CRM capture, then hand off to WhatsApp.
    try {
      fetch("https://go.onrol.in/api/public/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ name, phone, email, source: "Contact page", campaign: "contact", notes: message }),
        keepalive: true,
      }).catch(() => {});
    } catch { /* never block the form */ }
    const text =
      "Hi ONROL,%0A%0A" + encodeURIComponent(message) +
      "%0A%0AName: " + encodeURIComponent(name) +
      "%0AEmail: " + encodeURIComponent(email) +
      (phone ? "%0APhone: " + encodeURIComponent(phone) : "");
    const url = "https://wa.me/918121306701?text=" + text;
    if (toast) toast.classList.add("show");
    setTimeout(() => {
      window.open(url, "_blank", "noopener,noreferrer");
      if (toast) toast.classList.remove("show");
    }, 600);
  };
  form.addEventListener("submit", onSubmit);
  return () => form.removeEventListener("submit", onSubmit);
}
