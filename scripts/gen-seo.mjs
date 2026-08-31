/* =========================================================================
   ONROL — programmatic SEO page generator (NO browser, NO prerender).

   Reads data/seo-catalog.json and emits fully static HTML (one dir per page,
   <slug>/index.html) into public/, each carrying its own JSON-LD schema, an
   on-brand hero, the project/portfolio "proof" method block, an FAQ, and a
   CRM-wired lead form. Pure string templating — generates hundreds of pages
   in well under a second.

   A content hash per page is written to data/.seo-manifest.json so the deploy
   script (scripts/deploy-seo.mjs) can upload ONLY the pages that changed.

   Run:  node scripts/gen-seo.mjs
   ========================================================================= */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ORIGIN = "https://onrol.in";
const OUT = resolve(ROOT, "public");
const SHEET = "https://script.google.com/macros/s/AKfycbzDOsjoj6jx7KbX3AcMR_SpW7FA76z7bmonecaRSykClchoizgiSWZH5Og-HQ2WDRcHsw/exec";
const SAME_AS = [
  "https://www.linkedin.com/company/onrol",
  "https://www.instagram.com/onrol.in",
  "https://www.youtube.com/@onrolofficial",
];

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const attr = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
const jsonld = (o) => `<script type="application/ld+json">${JSON.stringify(o)}</script>`;
const canon = (slug) => `${ORIGIN}/${slug}/`;

/* ---- inline SVG icon set (stroke, currentColor via CSS) ---- */
const ICONS = {
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  screen: '<rect x="3" y="4" width="18" height="14" rx="2"/><path d="M8 20h8"/>',
  shield: '<path d="M12 3l7 3v6c0 4.4-3 7.4-7 9-4-1.6-7-4.6-7-9V6z"/>',
  bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  spark: '<path d="M12 3v6m0 6v6m-9-9h6m6 0h6"/><path d="M6 6l3 3m6 6 3 3m0-12-3 3M9 15l-3 3"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3"/>',
  chat: '<path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
};
const icon = (name, cls = "") => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ICONS.spark}</svg>`;
const OUTCOME_ICONS = ["target", "bolt", "screen", "chat"];

/* ------------------------------- schema -------------------------------- */
function breadcrumbSchema(page) {
  const items = [{ "@type": "ListItem", position: 1, name: "Home", item: `${ORIGIN}/` }];
  (page.breadcrumb || []).forEach((b, i) => items.push({ "@type": "ListItem", position: i + 2, name: b.name, item: b.url }));
  return jsonld({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: items });
}
function faqSchema(page) {
  if (!page.faqs || !page.faqs.length) return "";
  return jsonld({
    "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: page.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  });
}
function courseSchema(page) {
  return jsonld({
    "@context": "https://schema.org", "@type": "Course",
    name: page.eyebrow.split("·")[0].trim(), description: page.description,
    provider: { "@type": "EducationalOrganization", name: "ONROL", url: `${ORIGIN}/`, sameAs: SAME_AS },
    url: canon(page.slug), inLanguage: "en-IN",
    ...(page.city ? { availableLanguage: "en", areaServed: { "@type": "City", name: page.city } } : {}),
    hasCourseInstance: { "@type": "CourseInstance", courseMode: "Online" },
  });
}
function articleSchema(page) {
  return jsonld({
    "@context": "https://schema.org", "@type": "Article",
    headline: page.title.split("|")[0].trim(), description: page.description,
    mainEntityOfPage: { "@type": "WebPage", "@id": canon(page.slug) },
    inLanguage: "en-IN",
    author: { "@type": "Person", name: "Dr. Neeraja Reddy", url: `${ORIGIN}/founders/dr-neeraja-reddy` },
    publisher: { "@type": "Organization", name: "ONROL", logo: { "@type": "ImageObject", url: `${ORIGIN}/onrol-logo-dark.png` } },
    datePublished: "2026-05-01", dateModified: new Date().toISOString().slice(0, 10),
  });
}
function schemaFor(page) {
  const parts = [breadcrumbSchema(page), faqSchema(page)];
  if (page.type === "jobready") parts.push(articleSchema(page));
  else parts.push(courseSchema(page)); // course + geo
  return parts.filter(Boolean).join("\n");
}

/* ------------------------- shared markup (partials) -------------------- */
const NAV = `<a class="site-logo" href="/" aria-label="ONROL, AI Execution School, home"><img src="/home-glydi/logo-mark.png" alt="ONROL, AI Execution School"></a>
<nav class="nav">
  <button class="nav-toggle" id="navToggle" type="button" aria-label="Menu" aria-expanded="false" aria-controls="navLinks"><span></span><span></span><span></span></button>
  <div class="nav-links" id="navLinks">
    <a href="/">Home</a><span class="sep" aria-hidden="true"></span>
    <a href="/programs">Programs</a><span class="sep" aria-hidden="true"></span>
    <a href="/about">About</a><span class="sep" aria-hidden="true"></span>
    <a href="/contact">Contact</a>
    <div class="nav-login">
      <button class="nav-login-btn" type="button" aria-haspopup="true" aria-expanded="false">Login
        <svg class="nl-chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></button>
      <div class="login-menu" role="menu">
        <div class="lm-head"><span class="lm-eyebrow">ONROL Portals</span><span class="lm-title">Log in to your account</span></div>
        <a class="login-card" role="menuitem" href="https://lms.187-127-178-100.sslip.io/" target="_blank" rel="noopener noreferrer"><span class="lc-ic"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7l9-4 9 4-9 4-9-4z"/><path d="M7 9.6V15c0 1.1 2.2 2.6 5 2.6s5-1.5 5-2.6V9.6"/><path d="M21 7v5"/></svg></span><span class="lc-tx"><b>Student LMS</b><small>Courses, lessons &amp; progress</small></span><span class="lc-arrow"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span></a>
        <a class="login-card" role="menuitem" href="https://affiliate.onrol.in/login" target="_blank" rel="noopener noreferrer"><span class="lc-ic"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3.2"/><path d="M3.5 19v-1A4.5 4.5 0 0 1 8 13.5h2a4.5 4.5 0 0 1 4.5 4.5v1"/><path d="M16.5 8.5l2 2 3.2-3.4"/></svg></span><span class="lc-tx"><b>Affiliate</b><small>Partner dashboard &amp; payouts</small></span><span class="lc-arrow"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span></a>
        <div class="lm-foot">Need access? <a href="/contact">Talk to our team</a></div>
      </div>
    </div>
    <a class="nav-apply" href="#sx-register">Register</a>
  </div>
</nav>`;

const FOOTER = `<footer class="footer" id="contact"><div class="footer-top">
  <div class="f-brand"><a class="f-logo" href="/" aria-label="ONROL, AI Execution School"><img src="/home-glydi/logo-mark.png" alt="" aria-hidden="true"><span class="f-logo-tx"><b>ONROL</b><small>AI Execution School</small></span></a>
  <p class="f-copy">&copy; 2026 ONROL, AI Execution School, Hyderabad. All rights reserved. Founded by <a href="/founders/dr-neeraja-reddy" style="color:inherit;text-decoration:underline">Dr. Neeraja Reddy</a>.</p>
  <div class="f-socials">
    <a href="https://www.instagram.com/onrol.in" target="_blank" rel="noreferrer" aria-label="Instagram"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1.1"/></svg></a>
    <a href="https://www.linkedin.com/company/onrol" target="_blank" rel="noreferrer" aria-label="LinkedIn"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M7 10.5v6M7 7.5v.01M11.5 16.5v-3.2a2 2 0 0 1 4 0v3.2M11.5 16.5v-6"/></svg></a>
    <a href="https://www.youtube.com/@onrolofficial" target="_blank" rel="noreferrer" aria-label="YouTube"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="6" width="18" height="12" rx="4"/><path d="M11 9.6l4 2.4-4 2.4z"/></svg></a>
    <a href="mailto:info@onrol.in" aria-label="Email"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M4 7.5l8 5.5 8-5.5"/></svg></a>
  </div></div>
  <nav class="f-cols" aria-label="Footer links">
    <div class="f-col"><h4>Programs</h4><ul><li><a href="/programs/ai-generalist">AI Generalist</a></li><li><a href="/programs/ai-architect">AI Architect</a></li><li><a href="/programs/soc-analyst">SOC Analyst</a></li><li><a href="/programs/cybersecurity">Cyber Security</a></li></ul></div>
    <div class="f-col"><h4>Resources</h4><ul><li><a href="/blog">Blog</a></li><li><a href="/glossary">Glossary</a></li><li><a href="/questions">FAQs</a></li><li><a href="/why-now">Why AI matters now</a></li></ul></div>
    <div class="f-col"><h4>Company</h4><ul><li><a href="/about">About ONROL</a></li><li><a href="/contact">Contact</a></li><li><a href="/privacy-policy">Privacy Policy</a></li><li><a href="/terms-and-conditions">Terms</a></li></ul></div>
  </nav>
</div></footer>`;

const SCRIPTS = `<script>
(function(){var nav=document.querySelector('.nav'),t=document.getElementById('navToggle');if(!nav||!t)return;t.addEventListener('click',function(){var o=nav.classList.toggle('open');t.setAttribute('aria-expanded',o?'true':'false');});nav.querySelectorAll('.nav-links a').forEach(function(a){a.addEventListener('click',function(){nav.classList.remove('open');t.setAttribute('aria-expanded','false');});});})();
(function(){var f=document.getElementById('sxForm');if(!f)return;var e=document.getElementById('sxErr'),b=document.getElementById('sxSubmit'),CRM='https://go.onrol.in/api/public/leads',SHEET=${JSON.stringify(SHEET)};function er(m){e.textContent=m;e.style.display='block';}
f.addEventListener('submit',function(ev){ev.preventDefault();e.style.display='none';var name=document.getElementById('sxName').value.trim(),code=document.getElementById('sxCode').value.trim(),num=document.getElementById('sxPhone').value.trim(),email=document.getElementById('sxEmail').value.trim();if(code&&code.charAt(0)!=='+')code='+'+code;if(!code)code='+91';var full=code+' '+num;if(!name||!num||!email){er('Please fill in your name, phone and email.');return;}if(!/^\\d[\\d\\s-]{6,14}\\d$/.test(num)){er('Please enter a valid mobile number.');return;}if(!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)){er('Please enter a valid email address.');return;}b.disabled=true;b.textContent='Sending…';var P=window.__SXFORM;
fetch(CRM,{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify({name:name,phone:full,email:email,source:P.source,campaign:P.campaign,program:P.program,course:P.program,notes:P.program}),keepalive:true}).then(function(r){if(!r.ok){if(r.status===429)throw new Error('Too many requests — please wait a minute.');throw new Error('Could not submit ('+r.status+').');}fetch(SHEET,{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({form_type:'seo_page',name:name,full_name:name,phone:full,email:email,source:P.source,campaign:P.campaign,program:P.program,page_path:location.pathname,referrer:document.referrer}),keepalive:true}).catch(function(){});f.style.display='none';document.getElementById('sxDone').style.display='block';}).catch(function(err){b.disabled=false;b.textContent=P.cta;er(err&&err.message?err.message:'Something went wrong — please try again.');});});})();
(function(){if(window.__onrolLogin)return;window.__onrolLogin=true;document.addEventListener('click',function(e){var btn=e.target.closest&&e.target.closest('.nav-login-btn');if(btn){e.preventDefault();var w=btn.closest('.nav-login'),o=w.classList.contains('open');document.querySelectorAll('.nav-login.open').forEach(function(el){el.classList.remove('open');});if(!o){w.classList.add('open');btn.setAttribute('aria-expanded','true');}return;}if(!(e.target.closest&&e.target.closest('.login-menu')))document.querySelectorAll('.nav-login.open').forEach(function(el){el.classList.remove('open');});});})();
(function(){var nav=document.querySelector('.nav');if(!nav)return;var last=0,tk=false;window.addEventListener('scroll',function(){if(tk)return;tk=true;requestAnimationFrame(function(){tk=false;var y=window.pageYOffset||0;if(nav.classList.contains('open')){document.body.classList.remove('nav-up');last=y;return;}if(y>last&&y>140)document.body.classList.add('nav-up');else document.body.classList.remove('nav-up');last=y<0?0:y;});},{passive:true});})();
(function(){try{var p=(location.pathname.replace(/\\/+$/,'')||'/');document.querySelectorAll('.nav-links a[href]').forEach(function(a){var h=(a.getAttribute('href')||'').split('#')[0].replace(/\\/+$/,'')||'/';a.classList.toggle('is-active',h===p);});}catch(e){}})();
</script>`;

/* scoped component CSS (prefix .sx-) layered on /home-glydi/styles.css */
const CSS = `<style id="nav-login-fix">.nav .nav-login-btn,.nav.on-dark .nav-login-btn{color:#16181b!important}.nav .nav-login-btn .nl-chev{color:currentColor!important}</style>
<style>
:root{--sx-ink:#0D0B0A;--sx-body:#5a5e64;--sx-line:rgba(13,11,10,.12);--sx-cream:#FBF7F2}
.sx *{box-sizing:border-box}
.sx-hero{position:relative;overflow:hidden;padding:150px 20px 66px;background:var(--sx-cream)!important;border-bottom:1px solid var(--sx-line)}
.sx-hero::before{content:"";position:absolute;inset:0;pointer-events:none;opacity:.5;background-image:linear-gradient(rgba(13,11,10,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(13,11,10,.05) 1px,transparent 1px);background-size:44px 44px;mask-image:radial-gradient(120% 90% at 72% 0%,#000 30%,transparent 78%)}
.sx-hero::after{content:"";position:absolute;top:-30%;right:-10%;width:60vw;height:60vw;pointer-events:none;background:radial-gradient(circle,rgba(var(--orange-rgb),.16),transparent 62%)}
.sx-in{position:relative;z-index:2;max-width:960px;margin:0 auto}
.sx-eyebrow{display:inline-flex;align-items:center;gap:9px;font-family:var(--mono);font-size:12px;letter-spacing:1.4px;text-transform:uppercase;color:var(--orange);border:1px solid rgba(var(--orange-rgb),.4);border-radius:3px;padding:7px 12px;background:rgba(var(--orange-rgb),.06)}
.sx-eyebrow .dot{width:8px;height:8px;border-radius:50%;background:var(--orange)}
.sx-hero h1{font-family:var(--mono);font-size:clamp(32px,6vw,58px);font-weight:800;line-height:1.04;letter-spacing:-.02em;color:var(--sx-ink);margin:20px 0 16px}
.sx-hero h1 span{color:var(--orange)}
.sx-lead{font-family:var(--mono);font-size:clamp(16px,2.1vw,19px);line-height:1.65;color:var(--sx-body);max-width:660px}
.sx-meta{display:flex;flex-wrap:wrap;gap:8px;margin-top:24px}
.sx-chip{font-family:var(--mono);font-size:12px;color:var(--sx-ink);background:#fff;border:1px solid var(--sx-line);border-radius:3px;padding:8px 12px;display:inline-flex;align-items:center;gap:7px}
.sx-chip svg{width:15px;height:15px;stroke:var(--orange);fill:none;stroke-width:1.8}
.sx{font-family:var(--mono);color:var(--sx-body);background:#fff}
.sx-sec{max-width:960px;margin:0 auto;padding:56px 20px}
.sx-kick{font-family:var(--mono);font-size:12px;letter-spacing:2px;text-transform:uppercase;color:var(--orange);margin-bottom:12px}
.sx-h2{font-family:var(--mono);font-size:clamp(23px,3.3vw,31px);font-weight:800;letter-spacing:-.01em;color:var(--sx-ink);line-height:1.15;margin:0}
.sx-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px;margin-top:28px}
@media(max-width:640px){.sx-grid{grid-template-columns:1fr}}
.sx-card{background:#fff!important;border:1px solid var(--sx-line);border-radius:5px;padding:22px;transition:border-color .2s,transform .2s,box-shadow .2s}
.sx-card:hover{border-color:rgba(var(--orange-rgb),.5);transform:translateY(-2px);box-shadow:0 18px 40px -26px rgba(13,11,10,.4)}
.sx-card .ic{width:42px;height:42px;border-radius:5px;display:inline-flex;align-items:center;justify-content:center;background:rgba(var(--orange-rgb),.1);border:1px solid rgba(var(--orange-rgb),.28);margin-bottom:14px}
.sx-card .ic svg{width:22px;height:22px;stroke:var(--orange);fill:none;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
.sx-card h3{font-size:16px;font-weight:700;color:var(--sx-ink);margin:0 0 6px;line-height:1.3}
.sx-card p{font-size:14.5px;line-height:1.6;color:var(--sx-body);margin:0}
.sx-list{list-style:none;margin:24px 0 0;padding:0;display:grid;gap:12px;max-width:760px}
.sx-list li{display:flex;gap:11px;align-items:flex-start;font-size:15px;line-height:1.55;color:var(--sx-ink)}
.sx-list li svg{width:19px;height:19px;flex:none;stroke:var(--orange);fill:none;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round;margin-top:1px}
.sx-related{border-top:1px solid var(--sx-line)}
.sx-rel{display:grid;grid-template-columns:repeat(3,1fr);gap:28px;margin-top:26px}
@media(max-width:640px){.sx-rel{grid-template-columns:1fr;gap:22px}}
.sx-rel-col h3{font-family:var(--mono);font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--orange);margin:0 0 12px}
.sx-rel-col ul{list-style:none;margin:0;padding:0;display:grid;gap:9px}
.sx-rel-col a{color:var(--sx-ink);text-decoration:none;font-size:14.5px;border-bottom:1px solid transparent;transition:color .15s,border-color .15s}
.sx-rel-col a:hover{color:var(--orange);border-bottom-color:rgba(var(--orange-rgb),.4)}
.sx-pgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:26px}
@media(max-width:720px){.sx-pgrid{grid-template-columns:1fr}}
.sx-pcard{display:flex;flex-direction:column;background:#fff!important;border:1px solid var(--sx-line);border-radius:6px;padding:20px;text-decoration:none;transition:border-color .2s,transform .2s,box-shadow .2s}
.sx-pcard:hover{border-color:rgba(var(--orange-rgb),.5);transform:translateY(-2px);box-shadow:0 18px 40px -26px rgba(13,11,10,.4)}
.sx-pcard h3{font-size:17px;font-weight:800;color:var(--sx-ink);margin:0 0 8px;letter-spacing:-.01em}
.sx-pcard p{font-size:14px;line-height:1.55;color:var(--sx-body);margin:0 0 14px;flex:1}
.sx-pgo{font-family:var(--mono);font-size:12px;font-weight:700;letter-spacing:.4px;color:var(--orange)}
.sx-pall{margin-top:18px}
.sx-pall a{font-family:var(--mono);font-size:13px;color:var(--orange);text-decoration:none;border-bottom:1px solid rgba(var(--orange-rgb),.4)}
.sx-prose{margin-top:24px;max-width:760px}
.sx-prose p{font-size:15.5px;line-height:1.75;color:var(--sx-body);margin:0 0 16px}
.sx-prose p:last-child{margin-bottom:0}
.sx-method{background:var(--sx-ink)!important;position:relative;overflow:hidden}
.sx-method::before{content:"";position:absolute;inset:0;opacity:.5;pointer-events:none;background-image:linear-gradient(rgba(255,255,255,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.04) 1px,transparent 1px);background-size:40px 40px;mask-image:radial-gradient(120% 100% at 50% 0%,#000 40%,transparent 85%)}
.sx-method .in{position:relative;z-index:2;max-width:820px;margin:0 auto;padding:56px 20px;text-align:center}
.sx-method .k{font-family:var(--mono);font-size:12px;letter-spacing:2px;text-transform:uppercase;color:var(--orange-lt);margin-bottom:14px}
.sx-method h2{font-family:var(--mono);font-size:clamp(22px,3.2vw,30px);font-weight:800;color:#fff;line-height:1.2;margin:0 0 14px}
.sx-method p{color:#c3bdb6;font-size:15.5px;line-height:1.7;margin:0 auto;max-width:620px}
.sx-honest{background:rgba(var(--orange-rgb),.06);border:1px solid rgba(var(--orange-rgb),.3);border-left:3px solid var(--orange);border-radius:4px;padding:20px 22px;margin-top:26px;max-width:820px}
.sx-honest b{font-family:var(--mono);font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:var(--orange);display:block;margin-bottom:6px}
.sx-honest p{margin:0;color:var(--sx-ink);font-size:15px;line-height:1.65}
.sx-faq{max-width:820px;margin:24px auto 0}
.sx-faq details{border:1px solid var(--sx-line);border-radius:5px;padding:0;margin-bottom:10px;background:#fff}
.sx-faq summary{list-style:none;cursor:pointer;padding:16px 18px;font-weight:700;color:var(--sx-ink);font-size:15.5px;display:flex;justify-content:space-between;gap:12px;align-items:center}
.sx-faq summary::-webkit-details-marker{display:none}
.sx-faq summary::after{content:"+";color:var(--orange);font-size:20px;line-height:1}
.sx-faq details[open] summary::after{content:"–"}
.sx-faq .a{padding:0 18px 16px;color:var(--sx-body);font-size:14.5px;line-height:1.65}
/* register panel — reuse cyber-masterclass pattern */
.sx-reg{background:var(--sx-ink)!important;position:relative;overflow:hidden}
.sx-reg::before{content:"";position:absolute;inset:0;opacity:.5;pointer-events:none;background-image:linear-gradient(rgba(255,255,255,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.04) 1px,transparent 1px);background-size:40px 40px;mask-image:radial-gradient(120% 100% at 50% 0%,#000 40%,transparent 85%)}
.sx-reg .in{position:relative;z-index:2;max-width:960px;margin:0 auto;padding:60px 20px 66px;display:grid;grid-template-columns:1fr 1fr;gap:44px;align-items:start}
@media(max-width:820px){.sx-reg .in{grid-template-columns:1fr;gap:30px}}
.sx-reg .k{font-family:var(--mono);font-size:12px;letter-spacing:2px;text-transform:uppercase;color:var(--orange-lt);margin-bottom:10px}
.sx-reg h2{font-family:var(--mono);font-size:clamp(23px,3.3vw,32px);font-weight:800;color:#fff;line-height:1.14;margin:0}
.sx-reg .rp{color:#b9b3ac;font-size:15px;line-height:1.65;margin:14px 0 0;max-width:420px}
.sx-panel{background:#fff!important;border-radius:6px;padding:26px;box-shadow:0 30px 70px -34px rgba(0,0,0,.6)}
.sx-panel .top{display:flex;align-items:center;gap:8px;font-family:var(--mono);font-size:11px;letter-spacing:1.4px;text-transform:uppercase;color:var(--orange);margin-bottom:6px}
.sx-panel .top .dot{width:7px;height:7px;border-radius:50%;background:var(--orange)}
.sx-panel h3{font-size:20px;font-weight:800;color:var(--sx-ink);margin:0 0 16px}
.sx-field{margin-bottom:13px}
.sx-field label{display:block;font-family:var(--mono);font-size:12px;font-weight:700;color:var(--sx-ink);margin-bottom:6px}
.sx-field input{width:100%;min-height:46px;border:1px solid var(--sx-line);border-radius:4px;background:#fff;padding:0 13px;font-size:15px;font-family:var(--mono);color:var(--sx-ink)}
.sx-field input:focus{outline:none;border-color:var(--orange);box-shadow:0 0 0 3px rgba(var(--orange-rgb),.14)}
.sx-phone{display:grid;grid-template-columns:84px 1fr;gap:10px}
.sx-phone input:first-child{text-align:center}
.sx-btn{width:100%;min-height:52px;border:0;border-radius:4px;background:var(--orange);color:#fff;font-family:var(--mono);font-weight:700;font-size:15px;cursor:pointer;margin-top:4px;display:inline-flex;align-items:center;justify-content:center;gap:9px}
.sx-btn:hover{background:var(--orange-lt)}
.sx-btn:disabled{opacity:.62}
.sx-btn svg{width:17px;height:17px;stroke:#fff;fill:none;stroke-width:2.2}
.sx-fine{font-family:var(--mono);font-size:11.5px;color:#8a8f96;margin-top:12px;text-align:center}
.sx-err{background:#fff1ee;border:1px solid #f6c9bb;color:#9a3412;font-size:13.5px;padding:10px 12px;border-radius:4px;margin-bottom:14px;display:none}
.sx-done{display:none;text-align:center;padding:12px 4px}
.sx-done .tick{width:60px;height:60px;border-radius:50%;background:rgba(var(--orange-rgb),.12);display:inline-flex;align-items:center;justify-content:center;margin-bottom:14px}
.sx-done .tick svg{width:28px;height:28px;stroke:var(--orange);fill:none;stroke-width:2.6;stroke-linecap:round;stroke-linejoin:round}
.sx-done h3{font-size:20px;color:var(--sx-ink);margin:0 0 8px}
.sx-done p{color:var(--sx-body);font-size:14.5px;max-width:340px;margin:0 auto}
.sx-back{display:inline-block;margin-top:8px;font-family:var(--mono);font-size:12px;letter-spacing:1.3px;text-transform:uppercase;color:#8a8f96;text-decoration:none}
.sx-back:hover{color:var(--sx-ink)}
@media(prefers-reduced-motion:reduce){.sx-card{transition:none}}
</style>`;

/* Internal-linking: every page links to a STABLE curated set (not every sibling),
   so adding new pages doesn't churn every existing page's hash on deploy. New
   pages still get an inbound link from the Programs page (auto) + the sitemap. */
const LABEL = (p) => (p.breadcrumb && p.breadcrumb.length ? p.breadcrumb[p.breadcrumb.length - 1].name : p.city || p.slug);
const FEATURED = {
  geo: ["ai-course-in-bangalore", "ai-course-in-hyderabad-online", "ai-course-in-mumbai", "ai-course-in-delhi-ncr", "ai-course-in-chennai"],
  course: ["courses/data-analytics-with-ai", "courses/ai-digital-marketing", "courses/vibe-coding", "courses/ai-agents", "courses/power-bi"],
  jobready: ["ai-course-with-placement-support"],
};
function relatedLinks(page, all) {
  const bySlug = Object.fromEntries(all.map((p) => [p.slug, p]));
  const pick = (slugs) => slugs.filter((s) => s !== page.slug && bySlug[s]).map((s) => bySlug[s]);
  const group = (title, items) => items.length
    ? `<div class="sx-rel-col"><h3>${title}</h3><ul>${items.map((p) => `<li><a href="${canon(p.slug)}">${esc(LABEL(p))}</a></li>`).join("")}</ul></div>` : "";
  const cols = [
    group("AI courses by city", pick(FEATURED.geo)),
    group("Popular courses", pick(FEATURED.course)),
    group("Career &amp; programs", pick(FEATURED.jobready).concat({ slug: "programs", breadcrumb: [{ name: "All ONROL programs" }] }, { slug: "best-ai-course-in-india", breadcrumb: [{ name: "Best AI course in India" }] })),
  ].filter(Boolean).join("");
  return `<section class="sx-sec sx-related"><p class="sx-kick">Explore more</p><h2 class="sx-h2">Keep exploring ONROL.</h2><div class="sx-rel">${cols}</div></section>`;
}

/* Recommended-programs block: real links to the actual program pages so every
   page gives a clear next step. Defaults to the flagship trio; a page can
   override with its own `programs` array (e.g. an economy-matched pick). */
const FLAGSHIP = [
  { name: "AI Generalist", url: "/programs/ai-generalist", why: "The 3-month flagship — build 5+ real AI systems and a portfolio, no coding required." },
  { name: "AI Architect", url: "/programs/ai-architect", why: "The advanced track — AI architecture, agents, RAG and production-grade systems." },
  { name: "AI Career Accelerator", url: "/programs/aica", why: "A 21-day career-focused entry — practical AI skills, real projects and job readiness." },
];
function programsSection(page) {
  const progs = (page.programs && page.programs.length) ? page.programs : FLAGSHIP;
  const cards = progs.map((p) => `<a class="sx-pcard" href="${p.url}"><h3>${esc(p.name)}</h3><p>${esc(p.why)}</p><span class="sx-pgo">Explore program ${"→"}</span></a>`).join("");
  return `<section class="sx-sec sx-progs"><p class="sx-kick">Recommended programs</p><h2 class="sx-h2">Where to take this at ONROL.</h2><div class="sx-pgrid">${cards}</div><p class="sx-pall"><a href="/programs">See all ONROL programs &rarr;</a></p></section>`;
}

/* --------------------------- page renderer ----------------------------- */
function render(page, all) {
  const url = canon(page.slug);
  const OG = `${ORIGIN}/og/${page.type === "geo" ? "default" : "programs"}.png`;
  const meta = (page.meta || []).map((m) => `<span class="sx-chip">${icon(m.icon)}${esc(m.text)}</span>`).join("");
  const outcomes = (page.outcomes || []).map((o, i) => `<article class="sx-card"><span class="ic">${icon(OUTCOME_ICONS[i % 4])}</span><h3>${esc(o.title)}</h3><p>${esc(o.text)}</p></article>`).join("");
  const learn = (page.learn || []).map((l) => `<li>${icon("check")}<span>${esc(l)}</span></li>`).join("");
  const context = (page.context && page.context.length)
    ? `<section class="sx-sec"><p class="sx-kick">${esc(page.contextKicker || "Local context")}</p><h2 class="sx-h2">${esc(page.contextHeading)}</h2><div class="sx-prose">${page.context.map((p) => `<p>${esc(p)}</p>`).join("")}</div></section>`
    : "";
  const faqs = (page.faqs || []).map((f) => `<details><summary>${esc(f.q)}</summary><div class="a">${esc(f.a)}</div></details>`).join("");
  const honest = page.honest ? `<div class="sx-honest"><b>The honest answer</b><p>${esc(page.honest)}</p></div>` : "";

  const body = `<body class="sx">
${NAV}
<header class="sx-hero"><div class="sx-in">
  <span class="sx-eyebrow"><span class="dot" aria-hidden="true"></span>${esc(page.eyebrow)}</span>
  <h1>${esc(page.h1)} <span>${esc(page.h1accent)}</span></h1>
  <p class="sx-lead">${esc(page.lead)}</p>
  <div class="sx-meta">${meta}</div>
</div></header>
<main>
  <section class="sx-sec">
    <p class="sx-kick">${esc(page.learnHeading || "What you'll walk away with")}</p>
    <h2 class="sx-h2">Real skills, real projects — not another slide deck.</h2>
    <div class="sx-grid">${outcomes}</div>
    ${learn ? `<ul class="sx-list">${learn}</ul>` : ""}
    ${honest}
  </section>
  ${context}
  <section class="sx-method"><div class="in">
    <p class="k">The ONROL method</p>
    <h2>Build the evidence. Keep the proof.</h2>
    <p>ONROL is an execution school, not a lecture hall. Every session you ship something real — an automation, an agent, an app — and you keep it. You don't leave with a certificate alone; you leave with a portfolio of working AI products that proves what you can do.</p>
  </div></section>
  ${programsSection(page)}
  <section class="sx-sec">
    <p class="sx-kick">Questions</p>
    <h2 class="sx-h2">Straight answers.</h2>
    <div class="sx-faq">${faqs}</div>
  </section>
  ${relatedLinks(page, all)}
  <section class="sx-reg" id="sx-register"><div class="in">
    <div>
      <p class="k">${esc(page.cta)}</p>
      <h2>${esc(page.regHeading || "Ready when you are. Register in 20 seconds.")}</h2>
      <p class="rp">${esc(page.regSub || "Drop your details and our team confirms the next live cohort and answers anything about the program, timing and outcomes.")}</p>
      <p style="margin-top:22px"><a class="sx-back" href="/programs">&larr; See all ONROL programs</a></p>
    </div>
    <div class="sx-panel">
      <div class="sx-err" id="sxErr" role="alert"></div>
      <form id="sxForm" novalidate>
        <div class="top"><span class="dot" aria-hidden="true"></span>Secure registration</div>
        <h3>${esc(page.cta)}</h3>
        <div class="sx-field"><label for="sxName">Full name</label><input id="sxName" name="name" required autocomplete="name" placeholder="Your full name"></div>
        <div class="sx-field"><label for="sxPhone">Phone / WhatsApp</label><div class="sx-phone"><input id="sxCode" value="+91" inputmode="tel" maxlength="6" aria-label="Country code"><input id="sxPhone" type="tel" required inputmode="numeric" autocomplete="tel" placeholder="Mobile number"></div></div>
        <div class="sx-field"><label for="sxEmail">Email</label><input id="sxEmail" type="email" required autocomplete="email" placeholder="you@email.com"></div>
        <button class="sx-btn" id="sxSubmit" type="submit">${esc(page.cta)}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button>
        <p class="sx-fine">No spam. We only contact you about this program.</p>
      </form>
      <div class="sx-done" id="sxDone"><div class="tick" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 12.5 9.5 18 20 6.5"/></svg></div><h3>Request received.</h3><p>Thank you — our team will reach out shortly with the next cohort details.</p></div>
    </div>
  </div></section>
</main>
${FOOTER}
<script>window.__SXFORM=${JSON.stringify({ ...page.form, cta: page.cta })};</script>
${SCRIPTS}
</body>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(page.title)}</title>
<meta name="description" content="${attr(page.description)}">
<link rel="canonical" href="${url}">
<link rel="stylesheet" href="/home-glydi/styles.css?v=bargain2">
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
<link rel="icon" href="/home-glydi/logo-mark.png" type="image/png">
<link rel="apple-touch-icon" href="/home-glydi/logo-mark.png">
<link rel="preload" href="/home-glydi/assets/fonts/opensans-400.woff2" as="font" type="font/woff2" crossorigin>
<meta property="og:type" content="website"><meta property="og:site_name" content="ONROL"><meta property="og:locale" content="en_IN">
<meta property="og:title" content="${attr(page.title)}"><meta property="og:description" content="${attr(page.description)}">
<meta property="og:url" content="${url}"><meta property="og:image" content="${OG}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${attr(page.title)}"><meta name="twitter:image" content="${OG}">
${schemaFor(page)}
${CSS}
</head>
${body}
</html>`;
}

/* ------------------------------- main ---------------------------------- */
const catalog = JSON.parse(readFileSync(resolve(ROOT, "data/seo-catalog.json"), "utf8"));
// Merge programmatic city×course pages (gen-cross.mjs) if present. Hand-written
// catalog pages already win (gen-cross skips their slugs).
try {
  const gen = JSON.parse(readFileSync(resolve(ROOT, "data/cross-generated.json"), "utf8")).pages;
  if (Array.isArray(gen) && gen.length) catalog.pages = catalog.pages.concat(gen);
} catch { /* no generated file yet */ }
const manifest = {};
let n = 0;
for (const page of catalog.pages) {
  const html = render(page, catalog.pages);
  const dir = resolve(OUT, page.slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dir, "index.html"), html);
  manifest[page.slug] = createHash("sha1").update(html).digest("hex").slice(0, 12);
  n++;
}
writeFileSync(resolve(ROOT, "data/.seo-manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log(`gen-seo: ${n} pages → public/<slug>/index.html  (manifest: data/.seo-manifest.json)`);
