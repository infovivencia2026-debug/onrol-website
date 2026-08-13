/* =========================================================================
   ONROL — single source of truth.  EDIT VALUES HERE ONLY.
   Loaded on every page as a plain <script> (exposes window.ONROL).
   ========================================================================= */
window.ONROL = {
  /* ---- Lead capture ---- */
  /* Every form posts to the ONROL CRM, which upserts the lead BY MOBILE
     NUMBER (same structure every other ONROL source uses). */
  crmUrl: "https://go.onrol.in/api/public/leads",
  /* Google Sheet mirror (Apps Script web app) — form_type routes to the tab. */
  sheetWebhookUrl: "https://script.google.com/macros/s/AKfycbzDOsjoj6jx7KbX3AcMR_SpW7FA76z7bmonecaRSykClchoizgiSWZH5Og-HQ2WDRcHsw/exec",
  web3formsKey: "YOUR_WEB3FORMS_ACCESS_KEY",   /* (legacy — no longer used for the CRM flow) */
  whatsappNumber: "918121306701",              /* WhatsApp CTAs (country code, no +) */
  thankYouUrl: "thank-you.html",

  /* ---- Analytics (leave blank to disable a provider) ---- */
  analytics: {
    ga4Id: "",              /* e.g. "G-XXXXXXXXXX" */
    plausibleDomain: "",    /* e.g. "onrol.in"      */
    metaPixelId: ""         /* e.g. "1234567890"  — fires on thank-you.html */
  },

  /* ---- Per-program cohort data (drives urgency bar / pricing) ---- */
  cohorts: {
    "AI Generalist Program":  { startDate: "2026-08-04", seatsLeft: 12, feeINR: 24999, emiINR: 4999, months: 3 },
    "AI Architect Program":   { startDate: "2026-08-18", seatsLeft: 10, feeINR: 39999, emiINR: 6999, months: 6 },
    "Cyber Security Program": { startDate: "2026-08-11", seatsLeft: 14, feeINR: 34999, emiINR: 5999, months: 6 },
    "SOC Analyst Program":    { startDate: "2026-08-25", seatsLeft:  9, feeINR: 29999, emiINR: 5499, months: 3 }
  }
};

/* ---- Lightweight analytics loader (no-op until IDs are set) ---- */
(function () {
  var a = window.ONROL.analytics || {};
  if (a.plausibleDomain) {
    var p = document.createElement("script");
    p.defer = true; p.setAttribute("data-domain", a.plausibleDomain);
    p.src = "https://plausible.io/js/script.js";
    document.head.appendChild(p);
  }
  if (a.ga4Id) {
    var g = document.createElement("script");
    g.async = true; g.src = "https://www.googletagmanager.com/gtag/js?id=" + a.ga4Id;
    document.head.appendChild(g);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", a.ga4Id);
  }
  if (a.metaPixelId) {
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
    n.push=n;n.loaded=!0;n.version="2.0";n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
    (window,document,"script","https://connect.facebook.net/en_US/fbevents.js");
    window.fbq("init", a.metaPixelId);
    window.fbq("track", "PageView");
  }
})();
