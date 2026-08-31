/**
 * Behaviour for the glydi/onrol-home single-page design, ported from the repo's
 * inline <script> into a mountable module. initHomeGlydi() wires up every effect
 * and returns a cleanup that removes all listeners / observers / timers so the
 * page is safe inside the React SPA. Source: local onrol-home export.
 * Only change vs. source: asset paths point at /home-glydi/, global listeners
 * and observers/timers are tracked for teardown.
 */
export function initHomeGlydi(): () => void {
  const disposers: Array<() => void> = [];
  const on = (
    target: Window | Document | HTMLElement | Element,
    type: string,
    fn: EventListenerOrEventListenerObject,
    opts?: boolean | AddEventListenerOptions,
  ) => {
    target.addEventListener(type, fn, opts);
    disposers.push(() => target.removeEventListener(type, fn, opts));
  };
  const observe = (io: IntersectionObserver) => { disposers.push(() => io.disconnect()); return io; };

  const CH = "!<>-_\\/[]{}=+*^?#@%$&";
  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- letters: stretch each glyph's ink box to fill its cell ---- */
  const FONT = '500 100px "Space Grotesk", sans-serif';
  const OX = 90, OY = 220, CW = 360, CHH = 360;
  function inkViewBox(letter: string): string | null {
    const c = document.createElement("canvas");
    c.width = CW; c.height = CHH;
    const ctx = c.getContext("2d");
    if (!ctx) return null;
    ctx.font = FONT; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#fff";
    ctx.fillText(letter, OX, OY);
    const d = ctx.getImageData(0, 0, CW, CHH).data;
    let minX = CW, minY = CHH, maxX = -1, maxY = -1;
    for (let y = 0; y < CHH; y++) {
      const row = y * CW * 4;
      for (let x = 0; x < CW; x++) {
        if (d[row + x * 4 + 3] > 16) {
          if (x < minX) minX = x; if (x > maxX) maxX = x;
          if (y < minY) minY = y; if (y > maxY) maxY = y;
        }
      }
    }
    if (maxX < 0) return null;
    return (minX - OX) + " " + (minY - OY) + " " + (maxX - minX + 1) + " " + (maxY - minY + 1);
  }
  function fitGlyphs() {
    document.querySelectorAll(".glyph").forEach((svg) => {
      const t = svg.querySelector("text");
      if (!t) return;
      const vb = inkViewBox(t.textContent || "");
      if (vb) { svg.setAttribute("viewBox", vb); svg.setAttribute("preserveAspectRatio", "none"); }
    });
  }
  function placeNodes() {
    const logo = document.querySelector<HTMLElement>(".logo");
    if (!logo) return;
    logo.querySelectorAll(".node").forEach((n) => n.remove());
    const lr = logo.getBoundingClientRect();
    const seen: Record<string, number> = {};
    function addNode(px: number, py: number) {
      if (!logo) return;
      const x = Math.round(px - lr.left - logo.clientLeft);
      const y = Math.round(py - lr.top - logo.clientTop);
      const key = x + "," + y;
      if (seen[key]) return;
      seen[key] = 1;
      const n = document.createElement("div");
      n.className = "node"; n.style.left = x + "px"; n.style.top = y + "px";
      logo.appendChild(n);
    }
    const main: Element[] = [];
    logo.querySelectorAll(".cell").forEach((c) => { if (!c.closest(".tower")) main.push(c); });
    main.forEach((c, i) => {
      const r = c.getBoundingClientRect();
      if (i < 9) { addNode(r.left, r.top); addNode(r.right, r.top); }
      else if (i >= main.length - 9) { addNode(r.left, r.bottom); addNode(r.right, r.bottom); }
    });
    logo.querySelectorAll(".tower").forEach((tw) => {
      const r = tw.getBoundingClientRect();
      addNode(r.left, r.top); addNode(r.right, r.top);
      addNode(r.left, r.bottom); addNode(r.right, r.bottom);
    });
  }
  function refresh() { fitGlyphs(); placeNodes(); }
  function run() {
    placeNodes(); fitGlyphs();
    if (document.fonts) {
      const jobs: Promise<unknown>[] = [];
      if (document.fonts.load) jobs.push(document.fonts.load(FONT));
      if (document.fonts.ready) jobs.push(document.fonts.ready);
      if (jobs.length) Promise.all(jobs).then(refresh, refresh);
    }
  }
  run();
  on(window, "load", run);
  on(window, "resize", () => placeNodes());

  /* ---- preloader ---- */
  (function () {
    const pre = document.getElementById("preloader");
    if (!pre) return;
    document.documentElement.style.overflow = "hidden";
    function reveal() {
      document.documentElement.style.overflow = "";
      pre!.classList.add("hidden");
      setTimeout(() => {
        const root = document.documentElement;
        root.style.setProperty("--la", "0");
        document.body.classList.remove("loading");
        let t0: number | null = null;
        function step(ts: number) {
          if (t0 === null) t0 = ts;
          const k = Math.min((ts - t0) / 700, 1);
          root.style.setProperty("--la", String(k));
          if (k < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      }, 750);
    }
    const jobs: Promise<unknown>[] = [
      new Promise<void>((res) => { const img = new Image(); img.onload = img.onerror = () => res(); img.src = "/home-glydi/bag.jpeg"; }),
      new Promise<void>((res) => setTimeout(res, 1100)),
    ];
    if (document.fonts && document.fonts.ready) jobs.push(document.fonts.ready);
    const safety = new Promise<void>((res) => setTimeout(res, 6000));
    Promise.race([Promise.all(jobs), safety]).then(reveal);
  })();

  /* ---- pipeline: single-open accordion ---- */
  (function () {
    const items = Array.prototype.slice.call(document.querySelectorAll(".pipeline li")) as HTMLElement[];
    if (!items.length) return;
    function setOpen(li: HTMLElement, open: boolean) {
      const detail = li.querySelector(".step-detail");
      const btn = li.querySelector(".step-btn");
      li.classList.toggle("is-open", open);
      if (detail) detail.classList.toggle("open", open);
      if (btn) { btn.classList.toggle("open", open); btn.setAttribute("aria-expanded", open ? "true" : "false"); }
    }
    items.forEach((li) => {
      const head = li.querySelector(".step-head");
      const detail = li.querySelector(".step-detail");
      if (!head || !detail) return;
      on(head as HTMLElement, "click", () => {
        const willOpen = !detail.classList.contains("open");
        items.forEach((other) => { if (other !== li) setOpen(other, false); });
        setOpen(li, willOpen);
      });
    });
  })();

  /* ---- scroll: ONROL drifts up + hero image zooms ---- */
  (function () {
    const logo = document.querySelector<HTMLElement>(".logo");
    const bg = document.querySelector<HTMLElement>(".hero-bg");
    if (!logo) return;
    let ticking = false;
    function apply() {
      ticking = false;
      let p = window.scrollY / window.innerHeight;
      p = p < 0 ? 0 : (p > 1 ? 1 : p);
      const base = window.innerWidth <= 900 ? 0 : 16;
      logo!.style.transform = "translateY(" + (base - p * 55) + "vh)";
      if (bg) bg.style.transform = "scale(" + (1 + p * 0.45) + ")";
    }
    on(window, "scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(apply); } }, { passive: true });
    on(window, "resize", apply);
    apply();
  })();

  /* ---- mobile menu toggle ---- */
  (function () {
    const nav = document.querySelector(".nav");
    const toggle = document.getElementById("navToggle");
    if (!nav || !toggle) return;
    on(toggle, "click", () => {
      const open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.querySelectorAll<HTMLElement>(".nav-links a").forEach((a) => {
      on(a, "click", () => { nav.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); });
    });
  })();

  /* ---- scramble/decode helper ---- */
  function makeDecoder() {
    return function decode(el: HTMLElement & { _dec?: boolean }, delay: number) {
      if (el._dec) return;
      el._dec = true;
      const finalText = el.getAttribute("data-text") || el.textContent || "";
      el.setAttribute("data-text", finalText);
      const queue: Array<{ to: string; start: number; end: number; ch?: string }> = [];
      let frame = 0;
      for (let i = 0; i < finalText.length; i++) {
        const c = finalText[i];
        if (c === " ") { queue.push({ to: " ", start: 0, end: 0 }); continue; }
        const start = delay + Math.floor(Math.random() * 16);
        const end = start + 14 + Math.floor(Math.random() * 24);
        queue.push({ to: c, start, end, ch: "" });
      }
      (function step() {
        let out = "", done = 0;
        for (let i = 0; i < queue.length; i++) {
          const q = queue[i];
          if (frame >= q.end) { done++; out += q.to; }
          else if (frame >= q.start) {
            if (!q.ch || Math.random() < 0.3) q.ch = CH[Math.floor(Math.random() * CH.length)];
            out += '<span class="dec">' + q.ch + "</span>";
          }
        }
        el.innerHTML = out;
        frame++;
        if (done < queue.length) requestAnimationFrame(step);
        else { el.textContent = finalText; el._dec = false; }
      })();
    };
  }

  /* ---- footer scramble — retired ----
     Every heading and link in the footer was rewritten character by
     character with symbols on scroll-in, and again on hover: the column
     heads read "PROGRA_S" and "COM_ANY" for as long as the effect ran,
     and a link garbled itself the moment you pointed at it. A footer is
     wayfinding — it has to be readable at rest. */

  /* ---- section headings scramble ---- */
  (function () {
    const targets = document.querySelectorAll<HTMLElement>(".build-title, .who-title, .pipe-title, .who-head .pipe-eyebrow, .panel-right .pipe-eyebrow, .build-text .pipe-eyebrow");
    if (!targets.length || reduce || !("IntersectionObserver" in window)) return;
    const decode = makeDecoder();
    const io = observe(new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { decode(e.target as HTMLElement, 0); io.unobserve(e.target); } });
    }, { threshold: 0.35 }));
    targets.forEach((el) => io.observe(el));
  })();

  /* ---- video controls + autoplay in view ---- */
  (function () {
    const bv = document.querySelector(".build-video");
    const vid = document.getElementById("aboutVid") as HTMLVideoElement | null;
    if (!bv || !vid) return;
    // The cover play button in the markup is #vidCover (fallback #vidPlay).
    const playBtn = document.getElementById("vidCover") || document.getElementById("vidPlay");
    const muteBtn = document.getElementById("vidMute");
    // The <video> ships with data-src only (preload="none") — set the real src on
    // first play so nothing downloads until the visitor actually clicks.
    const ensureSrc = () => { if (!vid.getAttribute("src") && vid.dataset.src) vid.src = vid.dataset.src; };
    const play = () => { ensureSrc(); const p = vid.play(); if (p && p.catch) p.catch(() => {}); };
    const toggle = () => { if (vid.paused) play(); else vid.pause(); };
    // Explicit "Play the film" cover → start WITH sound (it's a talking-head film).
    const coverPlay = () => { ensureSrc(); vid.muted = false; bv.classList.remove("is-muted"); play(); };
    if (playBtn) on(playBtn, "click", coverPlay);
    on(vid, "click", toggle);
    on(vid, "play", () => bv.classList.add("is-playing", "started"));
    on(vid, "pause", () => bv.classList.remove("is-playing"));
    if (muteBtn) on(muteBtn, "click", () => { vid.muted = !vid.muted; bv.classList.toggle("is-muted", vid.muted); });
    // Poster + play-button design: play only on click; just pause when scrolled away.
    if ("IntersectionObserver" in window) {
      const io = observe(new IntersectionObserver((entries) => {
        entries.forEach((e) => { if (!e.isIntersecting && !vid.paused) vid.pause(); });
      }, { threshold: 0.35 }));
      io.observe(bv);
    }
    disposers.push(() => { try { vid.pause(); } catch { /* ignore */ } });
  })();

  /* ---- Apply Now lead modal → WhatsApp (+ CRM capture) ---- */
  (function () {
    const modal = document.getElementById("leadModal");
    if (!modal) return;
    const form = document.getElementById("leadForm") as HTMLFormElement | null;
    const closeBtn = document.getElementById("leadClose");
    let lastFocus: HTMLElement | null = null;
    function open(e?: Event) {
      if (e) e.preventDefault();
      lastFocus = document.activeElement as HTMLElement;
      modal!.hidden = false;
      document.documentElement.style.overflow = "hidden";
      (document.getElementById("leadName") as HTMLInputElement)?.focus();
    }
    function close() {
      modal!.hidden = true;
      document.documentElement.style.overflow = "";
      if (lastFocus) lastFocus.focus();
    }
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
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ name, phone, email, source: "Home Apply modal", campaign: "apply" }),
          keepalive: true,
        }).catch(() => {});
      } catch { /* never block */ }
      const text = "Hi ONROL, I’d like to apply for the next cohort.%0A%0A" +
        "Name: " + encodeURIComponent(name) +
        "%0AEmail: " + encodeURIComponent(email) +
        "%0APhone: " + encodeURIComponent(phone);
      window.open("https://wa.me/918121306701?text=" + text, "_blank", "noopener,noreferrer");
      close();
      form.reset();
    });
  })();

  /* ---- newsletter subscribe ---- */
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

  /* ---- scroll-reveal ---- */
  (function () {
    const els = document.querySelectorAll<HTMLElement>(".reveal");
    if (!els.length) return;
    if (reduce || !("IntersectionObserver" in window)) { els.forEach((el) => el.classList.add("in")); return; }
    const io = observe(new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }));
    els.forEach((el) => io.observe(el));
  })();

  /* ---- logo colour adapts to section behind it ---- */
  (function () {
    const logo = document.querySelector<HTMLElement>(".site-logo");
    if (!logo || !("IntersectionObserver" in window)) return;
    const darks: Element[] = [];
    [".hero", ".cta-section", ".footer"].forEach((sel) => { const el = document.querySelector(sel); if (el) darks.push(el); });
    if (!darks.length) return;
    const active = new Set<Element>();
    const io = observe(new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) active.add(e.target); else active.delete(e.target); });
      logo.classList.toggle("on-dark", active.size > 0);
    }, { rootMargin: "-44px 0px -92% 0px", threshold: 0 }));
    darks.forEach((el) => io.observe(el));
  })();

  /* ---- scroll-progress bar ---- */
  (function () {
    const bar = document.getElementById("scrollProgress");
    if (!bar) return;
    let ticking = false;
    function update() {
      ticking = false;
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      const pct = max > 0 ? (h.scrollTop || window.pageYOffset) / max * 100 : 0;
      bar!.style.width = pct + "%";
    }
    on(window, "scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    on(window, "resize", update);
    update();
  })();

  /* ---- nav: hide on scroll down, show on scroll up ---- */
  (function () {
    const nav = document.querySelector(".nav");
    if (!nav) return;
    let last = window.pageYOffset || 0, ticking = false;
    function onScroll() {
      ticking = false;
      const y = window.pageYOffset || document.documentElement.scrollTop || 0;
      if (nav!.classList.contains("open")) { nav!.classList.remove("nav-hidden"); last = y; return; }
      if (y > last && y > 140) nav!.classList.add("nav-hidden");
      else nav!.classList.remove("nav-hidden");
      last = y < 0 ? 0 : y;
    }
    on(window, "scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  })();

  /* ---- WHO showcase carousel + autoplay ---- */
  (function () {
    const data = document.getElementById("wsData");
    if (!data) return;
    const items = Array.prototype.slice.call(data.querySelectorAll(".ws-item")).map((el: Element) => ({
      num: el.getAttribute("data-num") || "",
      img: el.getAttribute("data-img") || "",
      svg: el.querySelector(".ws-svg")?.innerHTML || "",
      name: el.querySelector("h4")?.textContent || "",
      tag: el.querySelector(".ws-tag")?.textContent || "",
      desc: el.querySelector("p")?.textContent || "",
    }));
    const n = items.length;
    let index = 0;
    const card = document.getElementById("wsCard");
    const media = document.getElementById("wsMedia");
    const count = document.getElementById("wsCount");
    const chip = document.getElementById("wsChip");
    const tagEl = document.getElementById("wsTag");
    const title = document.getElementById("wsTitle");
    const desc = document.getElementById("wsDesc");
    const tabsWrap = document.getElementById("wsTabs");
    const prevBtn = document.getElementById("wsPrev");
    const nextBtn = document.getElementById("wsNext");
    if (!card || !media || !tabsWrap) return;
    const mod = (i: number) => (i % n + n) % n;
    items.forEach((it) => { const im = new Image(); im.src = it.img; });
    const tabs = items.map((it, i) => {
      const b = document.createElement("button");
      b.className = "ws-tab"; b.type = "button"; b.textContent = it.num; b.title = it.name;
      b.setAttribute("aria-label", it.name);
      b.addEventListener("click", () => go(i));
      tabsWrap.appendChild(b);
      return b;
    });
    function fill() {
      const it = items[index];
      if (media) media.style.backgroundImage = "url('" + it.img + "')";
      if (count) count.textContent = it.num + " / " + n;
      if (chip) chip.innerHTML = it.svg;
      if (tagEl) tagEl.textContent = it.tag;
      if (title) title.textContent = it.name;
      if (desc) desc.textContent = it.desc;
      tabs.forEach((b, i) => b.classList.toggle("is-on", i === index));
    }
    function render() {
      card!.classList.add("is-swapping");
      window.setTimeout(() => { fill(); card!.classList.remove("is-swapping"); }, 200);
    }
    function go(i: number) { index = mod(i); render(); start(); }
    const AUTO = 2000;
    let timer: number | null = null;
    function start() { stop(); if (reduce || document.hidden) return; timer = window.setInterval(() => { index = mod(index + 1); render(); }, AUTO); }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    if (prevBtn) on(prevBtn, "click", () => go(index - 1));
    if (nextBtn) on(nextBtn, "click", () => go(index + 1));
    on(document, "visibilitychange", () => { if (document.hidden) stop(); else start(); });
    let startX: number | null = null;
    on(card, "touchstart", (e) => { startX = (e as TouchEvent).touches[0].clientX; stop(); }, { passive: true });
    on(card, "touchend", (e) => {
      if (startX === null) return;
      const dx = (e as TouchEvent).changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 45) go(index + (dx < 0 ? 1 : -1)); else start();
      startX = null;
    }, { passive: true });
    fill();
    start();
    disposers.push(stop);
  })();

  return () => {
    disposers.forEach((d) => d());
    document.body.classList.remove("loading");
    document.documentElement.style.overflow = "";
    document.documentElement.style.removeProperty("--la");
  };
}
