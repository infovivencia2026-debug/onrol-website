/* =========================================================================
   ONROL — /programs/afprograms builder.
   Reads the standalone "af_program" export and produces the deployable page:
     • logo → /afprograms-logo.png (clean path, no spaces)
     • favicon (the export ships none) → same mark as the main site
     • canonical /programs/afprograms + meta description + noindex
     • fills the form's TODO with the standard ONROL lead capture
       (CRM upsert-by-mobile + Google Sheet mirror, ?ref= + UTM aware)
     • mobile (≤720px): single-viewport layout — page locked, program cards
       scroll internally inside .stage; smaller BUILD REAL SKILLS headline.
   Run:  node scripts/gen-afprograms.mjs ["<src-folder>"]
   ========================================================================= */
import { readFileSync, writeFileSync, copyFileSync } from "node:fs";

const SRC = process.argv[2] || "C:/Users/user/Downloads/af_program/af_program";
let h = readFileSync(`${SRC}/index.html`, "utf8");

/* logo */
h = h.split("Onrol%20Logo%20Final.png").join("/afprograms-logo.png")
     .split("Onrol Logo Final.png").join("/afprograms-logo.png");

/* head: favicon + canonical + description + robots + mobile layout */
h = h.replace(/<\/head>/i, [
  '<link rel="icon" href="/home-glydi/logo-mark.png" type="image/png">',
  '<link rel="apple-touch-icon" href="/home-glydi/logo-mark.png">',
  '<link rel="canonical" href="https://onrol.in/programs/afprograms">',
  '<meta name="description" content="Explore ONROL programs — AI Generalist, AI Architect, AI Accelerator, Cyber Security and SOC Analyst. Register with your mobile number and our team will reach out.">',
  '<meta name="robots" content="noindex, follow">',
  metaPixel(),
  css(),
  "</head>",
].join("\n"));

/* old program URLs → new /programs/* paths (cyber-redirect-fix) */
h = h.split("https://onrol.in/cybersecurity").join("https://onrol.in/programs/cybersecurity").split("https://onrol.in/soc-analyst").join("https://onrol.in/programs/soc-analyst");

/* form TODO → ONROL lead capture (CRM keyed by mobile + Sheet mirror) */
const CRM = `
      /* Lead capture: ONROL CRM upserts by mobile number + Google Sheet mirror. */
      try {
        var q = new URLSearchParams(location.search);
        var ref = q.get("ref") || "";
        var utm = {};
        ["utm_source","utm_medium","utm_campaign","utm_term","utm_content"].forEach(function(k){ var v=q.get(k); if(v) utm[k]=v; });
        var campaign = ref ? ("afprograms-" + ref) : "afprograms";
        fetch("https://go.onrol.in/api/public/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(Object.assign({ name: "", phone: digits, email: "", role: "",
            source: "AF Programs page", campaign: campaign, notes: ref ? ("ref:" + ref) : "" }, utm)),
          keepalive: true
        }).catch(function(){});
        fetch("https://script.google.com/macros/s/AKfycbzDOsjoj6jx7KbX3AcMR_SpW7FA76z7bmonecaRSykClchoizgiSWZH5Og-HQ2WDRcHsw/exec", {
          method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify(Object.assign({ form_type: "afprograms", name: "", full_name: "", phone: digits,
            source: "AF Programs page", campaign: campaign, page_path: location.pathname,
            page_title: document.title, referrer: document.referrer, ua: navigator.userAgent }, utm)),
          keepalive: true
        }).catch(function(){});
      } catch (err) { /* never block the UI */ }`;
if (/\/\* TODO: POST[^*]*\*\//.test(h)) h = h.replace(/\/\* TODO: POST[^*]*\*\//, CRM.trim());
else if (!h.includes("go.onrol.in/api/public/leads")) throw new Error("form TODO marker not found and CRM not present");

/* Affiliate attribution: this page is shared as /programs/afprograms?ref=CODE.
   The program links below are hardcoded WITHOUT ?ref, so a click dropped the
   affiliate's code and the eventual signup couldn't be tracked to them. Forward
   ref/coupon/utm from THIS url onto every program link so the click preserves
   attribution. Idempotent (skipped if already present). */
const LINK_FWD = `
    <script>
      (function(){
        try {
          var q = new URLSearchParams(location.search);
          var carry = ["ref","coupon","utm_source","utm_medium","utm_campaign","utm_term","utm_content"];
          var any = carry.some(function(k){ return q.get(k); });
          if (!any) return;
          document.querySelectorAll('a[href*="onrol.in/programs/"]').forEach(function(a){
            try {
              var u = new URL(a.href);
              if (u.pathname.replace(/\\/+$/,"") === "/programs/afprograms") return; /* don't self-loop */
              carry.forEach(function(k){ var v=q.get(k); if(v && !u.searchParams.has(k)) u.searchParams.set(k,v); });
              a.href = u.toString();
            } catch(e){}
          });
        } catch(e){}
      })();
    </script>`;
if (!h.includes('a[href*="onrol.in/programs/"]')) h = h.replace("</body>", LINK_FWD + "\n</body>");

writeFileSync("public/programs/afprograms.html", h);
copyFileSync(`${SRC}/Onrol Logo Final.png`, "public/afprograms-logo.png");
console.log("built public/programs/afprograms.html + public/afprograms-logo.png");

/* ─────────────────────────────────────────────────────────────────────── */
function metaPixel() {
  return `<!-- Meta Pixel Code -->
<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '1520493643156247');
fbq('track', 'PageView');
<\/script>
<noscript><img height="1" width="1" style="display:none"
src="https://www.facebook.com/tr?id=1520493643156247&ev=PageView&noscript=1"
/><\/noscript>
<!-- End Meta Pixel Code -->`;
}

function css() {
  return `
<style id="afprograms-mobile-oneviewport">
/* Mobile: single-viewport layout — page locked, cards scroll internally. */
@media (max-width: 720px) {
  html, body { height: 100vh; height: 100dvh; overflow: hidden; }
  /* .scroll-space WRAPS .shell — never display:none it. Just collapse the
     380vh scroll-driver height so the page no longer scrolls. */
  .scroll-space { height: auto; }
  .shell {
    position: relative; height: 100vh; height: 100dvh; min-height: 0;
    display: flex; flex-direction: column;
    gap: 12px; padding: 16px 16px 8px; overflow: hidden;
  }
  .logo { margin-bottom: 6px; }
  .logo img { height: 26px; }
  .kick { font-size: 10px; }
  h1 { font-size: clamp(22px, 7.5vw, 32px); }      /* smaller BUILD REAL SKILLS */
  .tagline { font-size: 12.5px; margin-top: 6px; }
  .register h3 { font-size: 17px; margin-bottom: 2px; }
  .register .rsub { font-size: 12px; margin-bottom: 10px; }
  .field { margin-bottom: 10px; }
  .rbtn { padding: 12px 18px; }
  .stage {
    order: 2; flex: 1 1 auto; min-height: 0; height: auto;
    overflow-y: auto; -webkit-overflow-scrolling: touch;
    perspective: none;
    -webkit-mask-image: linear-gradient(to bottom, transparent 0, #000 16px, #000 calc(100% - 16px), transparent 100%);
            mask-image: linear-gradient(to bottom, transparent 0, #000 16px, #000 calc(100% - 16px), transparent 100%);
  }
  .rotor { position: static; width: 100%; transform: none; }
  .track { transform: none !important; }
  .track > .card { margin-bottom: 12px; }
  .card { min-height: 0; padding: 20px; }
  .ghost { font-size: 80px; }
  .scrollcue { display: none; }
}
</style>`;
}
