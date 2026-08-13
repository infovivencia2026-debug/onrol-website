/* =========================================================================
   ONROL — card animations + design polish (drop-in, self-injecting CSS).
   Enhances the program pages' cards: build cards (shine sweep · glow · floating
   icon), audience cards (numbered · accent bar · lift), outcome items (accent ·
   tint), curriculum module rows (lift · glow) — plus a staggered scroll-reveal.

   Loaded BEFORE motion.js so it can take ownership of the card grids' reveal
   (removes their data-reveal) — this prevents GSAP from leaving an inline
   transform that would otherwise kill the CSS hover lift, and keeps the entrance
   working even if the GSAP CDN is blocked. Reduced-motion safe.
   ========================================================================= */
(function () {
  "use strict";
  var CX = "cubic-bezier(.2,.7,.2,1)";

  /* ---------- inject CSS ---------- */
  var css = document.createElement("style");
  css.textContent = [
    ":root{--cx:" + CX + "}",

    /* Open Sans — site font (self-hosted, 8 weights). These pages don't load
       styles.css, so the @font-face set is declared here too. */
    "@font-face{font-family:'Open Sans';src:url('assets/fonts/opensans-300.woff2') format('woff2');font-weight:100;font-display:swap}",
    "@font-face{font-family:'Open Sans';src:url('assets/fonts/opensans-300.woff2') format('woff2');font-weight:200;font-display:swap}",
    "@font-face{font-family:'Open Sans';src:url('assets/fonts/opensans-300.woff2') format('woff2');font-weight:300;font-display:swap}",
    "@font-face{font-family:'Open Sans';src:url('assets/fonts/opensans-400.woff2') format('woff2');font-weight:400;font-display:swap}",
    "@font-face{font-family:'Open Sans';src:url('assets/fonts/opensans-500.woff2') format('woff2');font-weight:500;font-display:swap}",
    "@font-face{font-family:'Open Sans';src:url('assets/fonts/opensans-600.woff2') format('woff2');font-weight:600;font-display:swap}",
    "@font-face{font-family:'Open Sans';src:url('assets/fonts/opensans-700.woff2') format('woff2');font-weight:700;font-display:swap}",
    "@font-face{font-family:'Open Sans';src:url('assets/fonts/opensans-800.woff2') format('woff2');font-weight:800;font-display:swap}",

    /* Bargain — display font for headings only (demo cut: A-Z a-z; digits/punctuation fall back to Open Sans) */
    "@font-face{font-family:'Bargain';src:url('assets/fonts/bargain-100.woff2') format('woff2');font-weight:100;font-display:swap}",
    "@font-face{font-family:'Bargain';src:url('assets/fonts/bargain-200.woff2') format('woff2');font-weight:200;font-display:swap}",
    "@font-face{font-family:'Bargain';src:url('assets/fonts/bargain-300.woff2') format('woff2');font-weight:300;font-display:swap}",
    "@font-face{font-family:'Bargain';src:url('assets/fonts/bargain-400.woff2') format('woff2');font-weight:400;font-display:swap}",
    "@font-face{font-family:'Bargain';src:url('assets/fonts/bargain-500.woff2') format('woff2');font-weight:500;font-display:swap}",
    "@font-face{font-family:'Bargain';src:url('assets/fonts/bargain-600.woff2') format('woff2');font-weight:600;font-display:swap}",
    "@font-face{font-family:'Bargain';src:url('assets/fonts/bargain-700.woff2') format('woff2');font-weight:700;font-display:swap}",
    "@font-face{font-family:'Bargain';src:url('assets/fonts/bargain-800.woff2') format('woff2');font-weight:800;font-display:swap}",
    ":root{--display:'Bargain','Open Sans',sans-serif}",
    "h1,h2,h3,.section-title,.hero-title,.curr-title,.who-title,.build-title,[class$=\"-title\"]{font-family:var(--display)!important;letter-spacing:.005em}",

    /* ===== HERO STAT CARDS — upgrade from flat joined boxes to premium cards ===== */
    ".hero-stats{gap:14px!important;background:transparent!important;border:0!important;max-width:880px!important}",
    ".hero-stats .stat{position:relative;background:#fff!important;border:1px solid rgba(0,0,0,.1)!important;border-radius:0!important;padding:24px 18px!important;min-height:0!important;overflow:hidden;box-shadow:0 20px 42px -30px rgba(0,0,0,.42);opacity:0;transform:translateY(16px);animation:statIn .6s cubic-bezier(.2,.7,.2,1) forwards;transition:transform .32s cubic-bezier(.2,.7,.2,1),box-shadow .32s ease,border-color .32s ease}",
    ".hero-stats .stat::before{content:'';position:absolute;top:0;left:0;width:100%;height:3px;background:linear-gradient(90deg,#ff9152,#f4671a);transform:scaleX(0);transform-origin:left;transition:transform .42s cubic-bezier(.2,.7,.2,1)}",
    ".hero-stats .stat:hover{transform:translateY(-6px);border-color:rgba(244,103,24,.45)!important;box-shadow:0 30px 56px -26px rgba(244,103,24,.42)}",
    ".hero-stats .stat:hover::before{transform:scaleX(1)}",
    ".hero-stats .stat:nth-child(1){animation-delay:.05s}",
    ".hero-stats .stat:nth-child(2){animation-delay:.13s}",
    ".hero-stats .stat:nth-child(3){animation-delay:.21s}",
    ".hero-stats .stat:nth-child(4){animation-delay:.29s}",
    ".hero-stats .stat strong{font-family:var(--sans)!important;font-size:clamp(32px,3.4vw,42px)!important;font-weight:800!important;letter-spacing:-.02em!important;line-height:1!important;background:linear-gradient(135deg,#ff8a3d,#ef5f10);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:var(--orange)!important}",
    ".hero-stats .stat span{margin-top:13px!important;font-weight:600!important;color:#6a6f76!important;letter-spacing:1.1px!important}",
    "@keyframes statIn{to{opacity:1;transform:none}}",

    /* ===== HERO CTA BUTTONS — gradient + shine + lift (scoped to hero, not form/pricing) ===== */
    ".hero-actions .button{border-radius:0!important;min-height:54px!important;font-size:13.5px!important;letter-spacing:1.2px!important;position:relative;overflow:hidden;transition:transform .22s ease,box-shadow .3s ease,background .25s ease,border-color .25s ease,color .25s ease}",

    "/* ===== NAV LOGIN \u2014 premium portal switcher v2 ===== */",
    ".nav-login{position:relative;display:flex;align-items:center}",
    ".nav-login-btn{display:inline-flex;align-items:center;gap:6px;background:transparent;border:0;cursor:pointer;font-family:var(--sans);font-size:14.5px;font-weight:500;letter-spacing:.2px;color:rgba(255,255,255,.72);padding:9px 15px;border-radius:999px;white-space:nowrap;transition:color .2s ease,background .2s ease}",
    ".nav-login-btn:hover,.nav-login.open .nav-login-btn{color:#fff;background:rgba(255,255,255,.1)}",
    ".nl-chev{width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round;transition:transform .25s ease}",
    ".nav-login:hover .nl-chev,.nav-login.open .nl-chev{transform:rotate(180deg)}",
    ".login-menu{position:absolute;top:calc(100% + 16px);right:0;width:330px;padding:8px;background:#fff;border:1px solid rgba(0,0,0,.09);box-shadow:0 40px 80px -30px rgba(0,0,0,.6),0 8px 22px -12px rgba(0,0,0,.4);z-index:90;opacity:0;visibility:hidden;transform:translateY(-12px) scale(.98);transform-origin:top right;transition:opacity .26s cubic-bezier(.2,.7,.2,1),transform .26s cubic-bezier(.2,.7,.2,1),visibility .26s}",
    ".login-menu::before{content:'';position:absolute;top:-16px;left:0;right:0;height:16px}",
    ".login-menu::after{content:'';position:absolute;top:-7px;right:26px;width:13px;height:13px;background:#fff;border-left:1px solid rgba(0,0,0,.09);border-top:1px solid rgba(0,0,0,.09);transform:rotate(45deg)}",
    ".nav-login:hover .login-menu,.nav-login:focus-within .login-menu,.nav-login.open .login-menu{opacity:1;visibility:visible;transform:none}",
    ".lm-head{padding:12px 14px}",
    ".lm-eyebrow{display:block;font-family:var(--mono);font-size:10px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:var(--orange)}",
    ".lm-title{display:block;font-family:var(--sans);font-size:15px;font-weight:700;color:#16181b;margin-top:4px}",
    ".login-card{position:relative;display:flex;align-items:center;gap:14px;padding:13px 14px;text-decoration:none;background:#fff;border:1px solid transparent;overflow:hidden;transition:border-color .24s ease}",
    ".login-card + .login-card{margin-top:2px}",
    ".login-card::before{content:'';position:absolute;inset:0;background:linear-gradient(90deg,rgba(244,103,24,.12),rgba(244,103,24,0) 72%);opacity:0;transition:opacity .28s ease}",
    ".login-card:hover{border-color:rgba(244,103,24,.35)}",
    ".login-card:hover::before{opacity:1}",
    ".lc-ic{position:relative;z-index:1;width:44px;height:44px;flex:0 0 auto;display:grid;place-items:center;background:linear-gradient(145deg,rgba(244,103,24,.16),rgba(244,103,24,.07));color:var(--orange);transition:transform .28s cubic-bezier(.2,.7,.2,1),background .24s ease,color .24s ease}",
    ".login-card:hover .lc-ic{background:linear-gradient(145deg,#ff9152,#f4671a);color:#fff;transform:scale(1.06) rotate(-3deg)}",
    ".lc-ic svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}",
    ".lc-tx{position:relative;z-index:1;display:flex;flex-direction:column;line-height:1.25;min-width:0}",
    ".lc-tx b{font-family:var(--display);font-size:16px;font-weight:800;letter-spacing:.005em;color:#16181b}",
    ".lc-tx small{font-family:var(--mono);font-size:11.5px;color:#8a8f96;margin-top:2px}",
    ".lc-arrow{position:relative;z-index:1;margin-left:auto;width:30px;height:30px;flex:0 0 auto;display:grid;place-items:center;border:1px solid rgba(0,0,0,.14);color:#9a9089;transition:background .24s ease,border-color .24s ease,color .24s ease}",
    ".lc-arrow svg{width:15px;height:15px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;transition:transform .24s ease}",
    ".login-card:hover .lc-arrow{background:var(--orange);border-color:var(--orange);color:#fff}",
    ".login-card:hover .lc-arrow svg{transform:translateX(2px)}",
    ".lm-foot{padding:11px 14px 8px;margin-top:6px;border-top:1px solid rgba(0,0,0,.07);font-family:var(--mono);font-size:11.5px;color:#9a9089;text-align:center}",
    ".lm-foot a{color:var(--orange);text-decoration:none;font-weight:600}",
    ".lm-foot a:hover{text-decoration:underline}",
    ".login-menu .login-card{opacity:0;transform:translateX(8px)}",
    ".nav-login:hover .login-card,.nav-login:focus-within .login-card,.nav-login.open .login-card{opacity:1;transform:none;transition:opacity .3s ease,transform .3s cubic-bezier(.2,.7,.2,1)}",
    ".nav-login:hover .login-card:nth-of-type(2),.nav-login.open .login-card:nth-of-type(2){transition-delay:.05s}",
    ".nav-login:hover .login-card:nth-of-type(3),.nav-login.open .login-card:nth-of-type(3){transition-delay:.10s}",
    ".nav .login-menu .login-card{display:flex!important;align-items:center!important;gap:14px!important;padding:13px 14px!important;border-radius:0!important;background:#fff!important}",
    ".nav .login-menu .lc-tx b{color:#16181b!important;font-family:var(--display)!important;font-weight:800!important}",
    ".nav .login-menu .lc-tx small{color:#8a8f96!important}",
    "@media(max-width:900px){.login-menu{position:static;width:100%;right:auto;box-shadow:none;border:0;padding:4px 0 2px;opacity:1;visibility:visible;transform:none;display:none}.login-menu::after{display:none}.nav-login.open .login-menu{display:block}.nav-login{flex-direction:column;align-items:stretch}.nav-login-btn{justify-content:center}.login-menu .login-card{opacity:1;transform:none}}",
    /* ===== CERTIFICATION HIGHLIGHTS (cyber + soc) ===== */
    ".cert-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:8px}",
    ".cert-card{position:relative;display:flex;flex-direction:column;gap:12px;background:#fff;border:1px solid rgba(0,0,0,.12);padding:24px 22px;overflow:hidden;transition:transform .34s cubic-bezier(.2,.7,.2,1),box-shadow .34s ease,border-color .34s ease}",
    ".cert-card::before{content:'';position:absolute;top:0;left:0;width:100%;height:3px;background:linear-gradient(90deg,#ff9152,#f4671a);transform:scaleX(0);transform-origin:left;transition:transform .42s cubic-bezier(.2,.7,.2,1)}",
    ".cert-card:hover{transform:translateY(-6px);border-color:rgba(244,103,24,.5);box-shadow:0 30px 56px -28px rgba(244,103,24,.4)}",
    ".cert-card:hover::before{transform:scaleX(1)}",
    ".cert-badge{width:44px;height:44px;display:grid;place-items:center;background:rgba(244,103,24,.1);color:var(--orange);flex:0 0 auto}",
    ".cert-badge svg{width:23px;height:23px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}",
    ".cert-code{font-family:var(--display);font-size:19px;font-weight:800;letter-spacing:.01em;color:#16181b;line-height:1.1}",
    ".cert-body{font-family:var(--mono);font-size:12.5px;line-height:1.55;color:#5a5e64}",
    ".cert-by{margin-top:auto;font-family:var(--mono);font-size:11px;letter-spacing:.6px;text-transform:uppercase;color:var(--orange);font-weight:600}",
    "@media(max-width:900px){.cert-grid{grid-template-columns:repeat(2,1fr)}}",
    "@media(max-width:520px){.cert-grid{grid-template-columns:1fr}}",

    /* ===== SHARP PREMIUM SYSTEM — sharpen every box on the program pages too ===== */
    ".build-card,.audience-card,.curr-mod,.curr-nav,.curr-checks li,.outcome,.outcome-card,.diff-card,.faq-q,.faq-item,.rr-row,.roles-list,.portfolio-media,.form-card,.button,.field input,.pricing,.pricing-card,.lp-card,.lp-step,.stat,.hero-media,.hero-figure,.compare-col,.mod-card,.path-card{border-radius:0!important}",
    ".curr-mod-banner,.curr-mod-banner--photo{border-radius:0!important}",
    ".hero-actions .button.orange{background:linear-gradient(135deg,#ff9152,#f4671a)!important;border:0!important;padding:0 36px!important;box-shadow:0 14px 30px -12px rgba(244,103,24,.7)!important}",
    ".hero-actions .button.orange::after{content:'';position:absolute;top:0;left:-75%;width:45%;height:100%;background:linear-gradient(120deg,transparent,rgba(255,255,255,.5),transparent);transform:skewX(-20deg);pointer-events:none}",
    ".hero-actions .button.orange:hover{transform:translateY(-3px);box-shadow:0 22px 42px -12px rgba(244,103,24,.85)!important;opacity:1!important}",
    ".hero-actions .button.orange:hover::after{animation:heroBtnShine .85s ease}",
    "@keyframes heroBtnShine{from{left:-75%}to{left:155%}}",
    ".hero-actions .button.light{border:1.5px solid rgba(0,0,0,.26)!important;background:#fff!important;color:#16181b!important;padding:0 30px!important}",
    ".hero-actions .button.light:hover{border-color:var(--orange)!important;color:var(--orange)!important;background:#fff7f2!important;transform:translateY(-3px);opacity:1}",

    "@media (prefers-reduced-motion:reduce){.hero-stats .stat{opacity:1!important;transform:none!important;animation:none!important}.hero-stats .stat::before,.hero-actions .button.orange::after{display:none!important}}",

    /* NAV — full-width top bar (Outskill layout; overrides these pages' inline pill nav) */
    ".nav{position:fixed;top:16px;left:50%;right:auto;transform:translateX(-50%);z-index:50;display:flex;align-items:center;gap:4px;height:auto;padding:7px 8px 7px 14px;background:rgba(12,11,13,.72);border:1px solid rgba(255,255,255,.08);border-radius:999px;box-shadow:none;backdrop-filter:blur(18px) saturate(140%);-webkit-backdrop-filter:blur(18px) saturate(140%);transition:transform .4s cubic-bezier(.2,.7,.2,1),background .35s ease,box-shadow .35s ease,border-color .35s ease}",
    "body.nav-up .nav{transform:translateX(-50%) translateY(-180%)}",
    ".nav a{display:flex;align-items:center;color:rgba(255,255,255,.72);text-decoration:none;font-family:var(--sans);font-size:14.5px;font-weight:500;text-transform:none;letter-spacing:.2px;padding:9px 17px;border-radius:999px;white-space:nowrap;transition:color .2s ease,background .2s ease}",
    ".nav a:hover{color:#fff;background:rgba(255,255,255,.1);opacity:1}",
    ".nav a.is-active{color:#fff}",
    ".nav .sep{display:none}",
    ".nav-links{display:flex;align-items:center;gap:2px;width:auto;height:auto}",
    ".nav-toggle{display:none}",
    ".nav-apply{margin-left:6px;background:linear-gradient(135deg,#ff9152,#f4671a);color:#fff!important;font-family:var(--sans);font-weight:600;font-size:14px;text-transform:none;letter-spacing:.2px;padding:10px 22px!important;border:0;border-radius:999px;box-shadow:0 8px 20px -8px rgba(244,103,24,.6);transition:transform .2s ease,box-shadow .2s ease,filter .2s ease}",
    ".nav-apply:hover{transform:translateY(-1px);filter:brightness(1.06);box-shadow:0 12px 26px -8px rgba(244,103,24,.78);opacity:1!important}",
    ".site-logo{position:fixed;top:15px;left:clamp(12px,1.6vw,22px);z-index:60;display:block;line-height:0;transition:transform .2s ease}",
    ".site-logo img{height:42px!important;width:auto}",
    "@media(max-width:900px){.nav{top:10px;left:12px;right:12px;transform:none;width:auto;height:54px;border-radius:16px;padding:0 10px 0 60px;justify-content:flex-end;gap:0}body.nav-up .nav{transform:translateY(-170%)}.nav-toggle{display:flex;flex-direction:column;justify-content:center;gap:4px;width:34px;height:30px;padding:0;background:transparent;border:0;cursor:pointer}.nav-toggle span{display:block;width:21px;height:2px;margin:0 auto;background:#fff;transition:transform .25s ease,opacity .2s ease}.nav.open .nav-toggle span:nth-child(1){transform:translateY(6px) rotate(45deg)}.nav.open .nav-toggle span:nth-child(2){opacity:0}.nav.open .nav-toggle span:nth-child(3){transform:translateY(-6px) rotate(-45deg)}.nav-links{display:none;position:absolute;top:calc(100% + 10px);right:0;left:auto;width:auto;height:auto;flex-direction:column;align-items:stretch;gap:2px;min-width:220px;padding:8px;border-radius:16px;background:rgba(255,255,255,.97);border:1px solid rgba(0,0,0,.08);box-shadow:0 22px 50px -18px rgba(20,16,12,.4);backdrop-filter:blur(24px) saturate(180%)}.nav.open .nav-links{display:flex}.nav-links a{padding:13px 16px;justify-content:center;border-radius:10px}.nav-apply{margin:6px 0 0!important}.site-logo{top:12px;left:16px}.site-logo img{height:34px!important}}",

    /* BUILD CARDS — shine sweep, ember glow, floating icon */
    ".build-card{position:relative;transition:transform .34s var(--cx),box-shadow .34s var(--cx),border-color .34s var(--cx)}",
    ".build-card::before{content:'';position:absolute;top:0;left:-130%;width:55%;height:100%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.16),transparent);transform:skewX(-18deg);transition:left .75s var(--cx);pointer-events:none;z-index:3}",
    ".build-card:hover::before{left:150%}",
    ".build-card:hover{box-shadow:0 30px 62px -26px rgba(244,103,24,.45),0 12px 26px -18px rgba(0,0,0,.5)}",
    ".bc-ic{animation:onrolFloat 4.6s ease-in-out infinite}",
    ".build-card:hover .bc-ic{animation-play-state:paused}",
    "@keyframes onrolFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}",

    /* AUDIENCE CARDS — numbered, growing accent bar, lift, tint */
    ".audience-grid{counter-reset:onrolList}",
    ".audience-card{position:relative;overflow:hidden;transition:transform .32s var(--cx),background .32s var(--cx),box-shadow .32s var(--cx)}",
    ".audience-card::before{content:counter(onrolList,decimal-leading-zero);counter-increment:onrolList;position:absolute;top:14px;right:16px;font-family:var(--mono,monospace);font-size:12px;letter-spacing:1px;color:rgba(244,103,24,.55)}",
    ".audience-card::after{content:'';position:absolute;left:0;bottom:0;height:3px;width:0;background:linear-gradient(90deg,#F46718,#FF8A4A);transition:width .45s var(--cx)}",
    ".audience-card:hover{transform:translateY(-6px);background:rgba(244,103,24,.045);box-shadow:0 24px 48px -28px rgba(244,103,24,.42)}",
    ".audience-card:hover::after{width:100%}",
    ".audience-card h3{transition:color .25s ease}",
    ".audience-card:hover h3{color:#F46718}",

    /* OUTCOME ITEMS — inset accent + tint (no slide: seamed grid) */
    ".outcome-item{position:relative;transition:background .28s var(--cx),box-shadow .28s var(--cx)}",
    ".outcome-item:hover{background:var(--soft,#faf6f0);box-shadow:inset 3px 0 0 #F46718}",
    ".outcome-item strong{transition:color .25s ease}",
    ".outcome-item:hover strong{color:#F46718}",

    /* CURRICULUM MODULE ROWS — lift + glow */
    ".module{transition:transform .3s var(--cx),box-shadow .3s var(--cx),border-color .3s var(--cx)}",
    ".module:hover{transform:translateY(-4px);box-shadow:0 24px 48px -26px rgba(244,103,24,.4);border-color:rgba(244,103,24,.35)}",

    /* full-page graph-paper grid BEHIND content (these pages don't load styles.css).
       Grid lives on the body background so cards/images/text sit ON TOP and cover it —
       it only shows in the empty areas. Plus left/right border guide lines at 6vw. */
    "body{background-color:#fff;background-image:linear-gradient(#fff,#fff),linear-gradient(#fff,#fff),linear-gradient(90deg,rgba(0,0,0,.05) 1px,transparent 1px),linear-gradient(rgba(0,0,0,.05) 1px,transparent 1px);background-size:6vw 100%,6vw 100%,44px 44px,44px 44px;background-position:left top,right top,6vw top,6vw top;background-repeat:no-repeat,no-repeat,repeat,repeat;background-attachment:fixed}",
    ".hero{background:transparent}",   /* let the grid show through the hero's empty areas */
    "body::before,body::after{content:'';position:fixed;top:0;height:100vh;border-left:1px solid rgba(0,0,0,.16);z-index:2;pointer-events:none}",
    "body::before{left:6vw}body::after{right:6vw}",
    "@media (max-width:900px){body{background-image:none}body::before,body::after{display:none}}",

    /* PORTFOLIO SHOWCASE IMAGE — greyscale by default, colour on hover */
    ".portfolio-media{position:relative;margin:20px 0 6px;border:1px solid rgba(255,255,255,.08);border-radius:6px;overflow:hidden;background:rgba(255,255,255,.015)}",
    ".portfolio-media img{display:block;width:100%;height:auto;filter:grayscale(1) brightness(.9) contrast(1.05);transition:filter .6s var(--cx),transform .6s var(--cx);will-change:filter}",
    ".portfolio-media:hover img{filter:none}",
    ".portfolio-media::after{content:'Hover to view in colour';position:absolute;left:12px;bottom:11px;z-index:4;font-family:var(--mono,monospace);font-size:10px;letter-spacing:1px;text-transform:uppercase;color:rgba(255,255,255,.62);background:rgba(0,0,0,.4);padding:4px 9px;border:1px solid rgba(255,255,255,.14);border-radius:3px;transition:opacity .4s ease;pointer-events:none}",
    ".portfolio-media:hover::after{opacity:0}",
    /* process-flow strip overlay — kept ALWAYS in colour, steps light up in sequence */
    ".portfolio-flow{position:absolute;left:0;width:100%;top:83.6%;height:12.7%;pointer-events:none;z-index:2}",
    ".portfolio-flow .pf-img{position:absolute;inset:0;width:100%;height:100%;display:block;filter:none!important}",
    ".pf-step{position:absolute;top:50%;left:var(--x);width:13%;height:94%;transform:translate(-50%,-50%);background:radial-gradient(50% 50% at 50% 50%,rgba(255,150,80,.55),rgba(244,103,24,.16) 46%,transparent 72%);mix-blend-mode:screen;opacity:0;animation:pfStep 2.6s ease-in-out infinite;animation-delay:var(--d,0s)}",
    "@keyframes pfStep{0%,58%,100%{opacity:0}16%{opacity:1}}",

    /* ENTRANCE (staggered scroll reveal) */
    ".onrol-pre{opacity:0;transform:translateY(30px)}",
    ".onrol-pre-f{opacity:0}",
    ".onrol-in{opacity:1;transform:none;transition:opacity .6s var(--cx),transform .6s var(--cx);transition-delay:var(--ci,0ms)}",

    "@media (prefers-reduced-motion:reduce){.build-card::before{display:none}.bc-ic{animation:none}.onrol-pre,.onrol-pre-f{opacity:1;transform:none}.pf-step{animation:none;opacity:0}}",

    /* ===== WHITE THEME (landing pages) — backgrounds white, dark text, orange accent,
       grey side guide-lines already injected above, subtly-rounded cards ===== */
    "body{background:#fff!important;background-image:none!important}",
    ".hero,section,.page,.pricing,.footer,.form-card{background:#fff!important}",
    ".pricing,.pricing h1,.pricing h2,.pricing h3,.pricing p,.pricing span,.pricing li,.footer,.footer h3,.footer h4,.footer p,.footer span,.footer li{color:#16181b!important}",
    ".footer a,.footer p,.pricing p{color:#5a5e64!important}",
    "[class*='eyebrow'],.gradient-text{color:var(--orange)!important}",
    ".form-card{border:1px solid rgba(0,0,0,.14)!important;box-shadow:0 20px 50px rgba(0,0,0,.08)!important}",
    ".form-card h2,.form-card h3,.form-card p,.form-card label,.form-card span{color:#16181b!important}",
    ".form-card input,.form-card textarea,.form-card select{background:#fff!important;border:1px solid rgba(0,0,0,.18)!important;color:#16181b!important}",
    ".form-card .button,.form-card button,.form-card [type=submit]{background:var(--orange)!important;color:#fff!important}",
    ".nav{background:rgba(255,255,255,.66)!important;border:1px solid rgba(255,255,255,.6)!important;box-shadow:0 18px 44px -20px rgba(20,16,12,.42),inset 0 1px 0 rgba(255,255,255,.75)!important;backdrop-filter:blur(24px) saturate(180%)!important;-webkit-backdrop-filter:blur(24px) saturate(180%)!important;transition:background .35s ease,box-shadow .35s ease,border-color .35s ease!important}",
    ".nav.on-dark{background:rgba(20,17,22,.42)!important;border-color:rgba(255,255,255,.14)!important;box-shadow:0 18px 44px -22px rgba(0,0,0,.6),inset 0 1px 0 rgba(255,255,255,.1)!important}",
    ".nav a{color:#2b2f34!important}",
    ".nav.on-dark a{color:rgba(255,255,255,.88)!important}",
    ".nav a:hover{color:var(--orange)!important;background:rgba(244,103,24,.1)!important}",
    ".nav.on-dark a:hover{color:#fff!important;background:rgba(255,255,255,.14)!important}",
    ".nav a.is-active{color:var(--orange)!important;background:rgba(244,103,24,.1)!important}",
    ".nav.on-dark a.is-active{color:#fff!important;background:rgba(255,255,255,.16)!important}",
    ".nav-links a:not(.nav-apply)::after{display:none!important}",
    ".nav-apply{background:linear-gradient(135deg,#ff9152,#f4671a)!important;color:#fff!important;border-radius:999px!important;box-shadow:0 8px 20px -8px rgba(244,103,24,.6)!important;transition:transform .2s ease,box-shadow .2s ease,filter .2s ease!important}",
    ".nav-apply:hover{transform:translateY(-1px)!important;filter:brightness(1.06);box-shadow:0 12px 26px -8px rgba(244,103,24,.78)!important}",
    ".nav-apply::after{display:none!important}",
    ".site-logo.on-dark img{filter:none!important}",
    ".site-logo::after{color:#16181b!important}",
    "body::before,body::after{border-left:2px solid rgba(0,0,0,.32)!important}",
    "@media(max-width:900px){.nav-links{background:#fff!important;border-color:rgba(0,0,0,.12)!important}.nav-toggle span{background:#16181b!important}}",
    ".build-card,.audience-card,.module,.form-card,.portfolio-media,.cohort-card,.vf,.pcard,.outcome-item,.stat,.build-grid,.module-index{border-radius:4px!important}",
    /* curriculum: contained width + moderate banner height (matches the reference) */
    "#journey .container{width:min(1240px,calc(100% - 10vw))!important;max-width:none!important}",
    ".curr-mod-banner{min-height:clamp(200px,24vh,250px)!important}",
    /* a --photo banner already has its label baked in -> show the full image, no scrim */
    ".curr-mod-banner--photo{aspect-ratio:3050/669;min-height:0!important;background-size:cover;background-position:center;overflow:hidden}",
    /* two stacked image layers: colour (::after, bottom) + grayscale (::before, top). */
    /* on hover the grayscale fades out AND both layers slowly zoom in parallel -> smooth colour + motion together. */
    ".curr-mod-banner--photo::after{display:block!important;content:'';position:absolute;inset:0;z-index:1;background-image:inherit;background-size:cover;background-position:center;transform:scale(1);transition:transform 2.6s cubic-bezier(.22,1,.36,1);pointer-events:none;will-change:transform}",
    ".curr-mod-banner--photo::before{content:'';position:absolute;inset:0;z-index:2;background-image:inherit;background-size:cover;background-position:center;filter:grayscale(1) brightness(1.02);opacity:1;transform:scale(1);transition:opacity 1.1s cubic-bezier(.22,1,.36,1),transform 2.6s cubic-bezier(.22,1,.36,1);pointer-events:none;will-change:opacity,transform}",
    ".curr-mod-banner--photo:hover::before{opacity:0;transform:scale(1.03)}",
    ".curr-mod-banner--photo:hover::after{transform:scale(1.03)}",
    /* larger + more visible secondary text on the program pages (matches styles.css) */
    ".section-desc,.hero-copy{font-size:clamp(16px,1.3vw,19px)!important;line-height:1.65!important;color:#33383c!important}",
    ".eyebrow,.tag,.kicker,.sd-eyebrow{font-size:13.5px!important;letter-spacing:1.4px!important}",
    ".curr-checks{gap:15px!important}",
    ".curr-checks li{position:relative!important;padding-left:42px!important;min-height:26px!important;display:flex!important;align-items:center!important;font-family:var(--sans)!important;font-size:16px!important;font-weight:500!important;line-height:1.5!important;letter-spacing:.1px!important;color:#2b2f34!important}",
    ".curr-checks li::before{content:''!important;position:absolute!important;left:0!important;top:50%!important;margin-top:-13px!important;width:26px!important;height:26px!important;border:0!important;border-radius:50%!important;background:linear-gradient(145deg,#ff9a5e,#ef5f10)!important;box-shadow:0 7px 16px -5px rgba(244,103,24,.6),0 0 0 4px rgba(244,103,24,.10),inset 0 1px 0 rgba(255,255,255,.4)!important;transform:none!important;transition:transform .25s cubic-bezier(.2,.7,.2,1),box-shadow .25s ease!important}",
    ".curr-checks li:hover::before{transform:scale(1.1)!important;box-shadow:0 9px 20px -5px rgba(244,103,24,.72),0 0 0 5px rgba(244,103,24,.16),inset 0 1px 0 rgba(255,255,255,.45)!important}",
    ".curr-checks li::after{content:''!important;position:absolute!important;left:0!important;top:50%!important;margin-top:-13px!important;width:26px!important;height:26px!important;border:0!important;background:url(\"data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2024%2024'%20fill='none'%20stroke='%23ffffff'%20stroke-width='3.4'%20stroke-linecap='round'%20stroke-linejoin='round'%3E%3Cpath%20d='M5%2013l4%204L19%207'/%3E%3C/svg%3E\") center/13px 13px no-repeat!important;transform:none!important}",
    ".stat span,.cohort-row span{font-size:13.5px!important}",
    ".stat strong{font-size:30px!important}",
    /* curriculum module list on the left was too faint -> darker + a touch bigger */
    ".curr-nav-item{font-size:15px!important;color:#5a5e64!important}",
    ".curr-nav-item.is-active{color:#16181b!important}",
    /* responsive polish (matches styles.css) */
    "img,video,canvas{max-width:100%}",
    "html{overflow-x:clip;scroll-padding-top:92px}",
    "@media(max-width:600px){body::before,body::after{display:none!important}html{scroll-padding-top:78px}}",
    "@media(max-width:380px){.nav{left:8px!important;right:8px!important}.nav-apply{padding:11px 15px!important}.site-logo img{height:30px!important}}",
    /* footer redesign — dark, bordered, reference-style (matches styles.css) */
    ".footer{background:#0b0a0c!important;color:#fff!important;border-top:1px solid rgba(var(--orange-rgb),.30)!important;padding:clamp(48px,7vh,86px) 6vw clamp(30px,4vh,44px)!important;font-family:var(--sans)!important;font-weight:400!important;text-transform:none!important}",
    ".footer *{text-transform:none!important}",
    ".footer .footer-grid,.footer .footer-bottom{display:none!important}",
    ".footer .footer-top{display:grid;grid-template-columns:1.15fr 2.2fr;gap:clamp(30px,5vw,80px);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:clamp(28px,3.4vw,44px)}",
    ".footer .f-brand{display:flex;flex-direction:column;gap:16px}",
    ".footer .f-logo{display:inline-flex;align-items:center;gap:13px;text-decoration:none}",
    ".footer .f-logo img{width:46px;height:46px;flex:0 0 auto;object-fit:contain;display:block;transition:transform .3s cubic-bezier(.2,.7,.2,1)}",
    ".footer .f-logo:hover img{transform:scale(1.05)}",
    ".footer .f-logo-tx{display:flex;flex-direction:column;line-height:1}",
    ".footer .f-logo-tx b{font-family:var(--sans);font-size:28px;font-weight:800;letter-spacing:.4px;color:#fff!important;line-height:1}",
    ".footer .f-logo-tx small{font-family:var(--sans);font-size:9.5px;font-weight:600;letter-spacing:2.1px;text-transform:uppercase;color:rgba(255,255,255,.62)!important;margin-top:6px}",
    ".footer .f-copy{font-size:14px!important;line-height:1.6;color:rgba(255,255,255,.5)!important;margin:0;max-width:34ch}",
    ".footer .f-socials{display:flex;gap:10px;margin-top:auto}",
    ".footer .f-socials a{width:42px;height:42px;display:grid;place-items:center;border:1px solid rgba(255,255,255,.16);border-radius:11px;color:#fff!important;transition:background .2s ease,border-color .2s ease,transform .2s ease}",
    ".footer .f-socials a:hover{background:var(--orange);border-color:var(--orange);color:#fff!important;transform:translateY(-2px)}",
    ".footer .f-socials svg{width:19px;height:19px;fill:none;stroke:#fff!important;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}",
    ".footer .f-socials a:hover svg{stroke:#fff!important}",
    ".footer .f-cols{display:grid;grid-template-columns:repeat(3,1fr);gap:clamp(22px,3vw,46px)}",
    ".footer .f-col h4{font-size:13px!important;letter-spacing:1.6px!important;text-transform:uppercase!important;color:#fff!important;font-weight:600;margin:0 0 18px!important}",
    ".footer .f-col ul{list-style:none;margin:0;padding:0}",
    ".footer .f-col li{margin-bottom:13px!important}",
    ".footer .f-col a{font-size:15px!important;color:rgba(255,255,255,.6)!important;text-decoration:none;transition:color .2s ease}",
    ".footer .f-col a:hover{color:var(--orange-lt)!important}",
    ".footer .footer-news{display:flex;align-items:center;justify-content:space-between;gap:clamp(20px,4vw,56px);flex-wrap:wrap;border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:clamp(24px,3vw,36px);margin-top:16px}",
    ".footer .f-news-text h4{font-size:20px!important;color:#fff!important;margin:0 0 6px!important;font-weight:700;letter-spacing:0!important;text-transform:none!important}",
    ".footer .f-news-text p{font-size:14.5px!important;color:rgba(255,255,255,.55)!important;margin:0}",
    ".footer .f-form{display:flex;flex:1;min-width:280px;max-width:520px;border-radius:11px;overflow:hidden;border:1px solid rgba(255,255,255,.18)}",
    ".footer .f-form input{flex:1;min-width:0;padding:16px 18px;font-family:var(--sans);font-size:15px;color:#fff!important;background:rgba(255,255,255,.04);border:0}",
    ".footer .f-form input::placeholder{color:rgba(255,255,255,.4)}",
    ".footer .f-form button{padding:0 30px;font-family:var(--sans);font-size:15px;font-weight:600;color:#fff!important;background:var(--orange)!important;border:0;cursor:pointer;transition:background .2s ease;white-space:nowrap}",
    ".footer .f-form button:hover{background:var(--orange-lt)!important}",
    ".footer .f-news-msg{margin:14px 0 0!important;font-size:14px!important;color:var(--orange-lt)!important}",
    "@media(max-width:860px){.footer .footer-top{grid-template-columns:1fr;gap:32px}.footer .footer-news{flex-direction:column;align-items:stretch}.footer .f-form{max-width:none}}",
    "@media(max-width:520px){.footer .f-cols{grid-template-columns:1fr 1fr;gap:22px 18px}}",
    /* ---- MOBILE HERO: bring the registration form up into the hero, next to compact program info ---- */
    "@media(max-width:760px){.hero{padding-top:78px!important;padding-bottom:26px!important}.hero-grid{gap:18px!important}.hero-copy{font-size:15px!important;margin-top:14px!important}.hero-stats{grid-template-columns:repeat(2,1fr)!important;margin-top:18px!important}.stat{min-height:0!important;padding:14px 14px!important}.stat strong{font-size:22px!important}.stat span{font-size:10.5px!important;margin-top:5px!important}.hero-actions{display:none!important}.form-card{position:static!important;margin-top:10px!important;padding:26px 20px!important}.form-card h2{font-size:22px!important;line-height:1.12!important}.form-card p{font-size:14px!important}.form-card input,.form-card select{font-size:16px!important}}",
    "@media(max-width:400px){.hero-stats{grid-template-columns:repeat(2,1fr)!important}.stat strong{font-size:20px!important}.stat span{font-size:10px!important}.form-card{padding:22px 16px!important}}",
    /* ---- MOBILE POLISH (program pages) ---- */
    "@media(max-width:600px){input,select,textarea{font-size:16px!important}.button{min-height:48px!important}.container{width:min(1180px,calc(100% - 32px))!important}.section-title{font-size:clamp(24px,7vw,34px)!important}.curr-mod-banner--photo{border-radius:10px!important}.lead-card{width:calc(100% - 28px)!important;max-height:88vh;overflow:auto;padding:26px 20px!important}.lead-form input{font-size:16px!important}}",
    "@media(max-width:520px){.comparison,.compare,.compare-cols{grid-template-columns:1fr!important}}",
    /* ---- roles list (per-program career roles + CTC) ---- */
    ".roles-list{margin-top:28px;border:1px solid rgba(0,0,0,.1);border-radius:16px;overflow:hidden;background:#fff;max-width:780px}",
    ".role-row{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:18px 22px;border-top:1px solid rgba(0,0,0,.07);transition:background .2s ease}",
    ".role-row:first-child{border-top:0}",
    ".role-row:hover{background:rgba(244,103,24,.05)}",
    ".rr-name{font-family:var(--sans);font-weight:700;font-size:16px;color:#16181b}",
    ".rr-ctc{font-family:var(--sans);font-weight:800;font-size:15px;color:var(--orange);white-space:nowrap}",
    ".roles-note{font-family:var(--sans);font-size:12.5px;color:#9a9089;margin-top:16px}",
    "@media(max-width:600px){.roles-list{max-width:none}.role-row{padding:16px 18px}.rr-name{font-size:15px}}",
    /* program-page bespoke body/detail text was tiny -> enlarge + darken */
    ".module p,.audience-card p,.outcome-item p,.build-card p{font-size:15px!important;line-height:1.6!important;color:#33383c!important}",
    ".module li,.audience-card li,.outcome-item li{font-size:14.5px!important;line-height:1.6!important}",
    ".module-meta,.tools,.portfolio-stats,.f-desc,.f-contact,.f-news p{font-size:13.5px!important;color:#41454b!important}",
    ".f-col li,.f-col a{font-size:14px!important;color:#41454b!important}",
    ".cm-label,.module-index,.f-tag,.form-note,.footer-bottom{font-size:12.5px!important;letter-spacing:1.1px!important}"
  ].join("");
  document.head.appendChild(css);

  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  /* ---------- staggered entrance (own the card grids) ---------- */
  var GROUPS = [
    { sel: ".build-card",   pre: "onrol-pre" },
    { sel: ".audience-card", pre: "onrol-pre" },
    { sel: ".module",       pre: "onrol-pre" },
    { sel: ".outcome-item", pre: "onrol-pre-f" }   /* fade only — sits in a seamed grid */
  ];

  var io = ("IntersectionObserver" in window)
    ? new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.remove("onrol-pre", "onrol-pre-f");
            e.target.classList.add("onrol-in");
            io.unobserve(e.target);
          }
        });
      }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" })
    : null;

  GROUPS.forEach(function (g) {
    var nodes = document.querySelectorAll(g.sel);
    var counts = [];   /* [parent, count] pairs (no Map dependency) */
    nodes.forEach(function (el) {
      var parent = el.parentElement;
      if (parent && parent.hasAttribute("data-reveal")) parent.removeAttribute("data-reveal"); /* stop motion.js double-animating */
      /* per-parent stagger index */
      var rec = null, i;
      for (i = 0; i < counts.length; i++) { if (counts[i][0] === parent) { rec = counts[i]; break; } }
      if (!rec) { rec = [parent, 0]; counts.push(rec); }
      el.style.setProperty("--ci", (rec[1] * 80) + "ms");
      rec[1]++;
      if (io) { el.classList.add(g.pre); io.observe(el); }
    });
  });
})();

/* ---- nav "Apply": these program pages carry their own registration form, so send the
   user there (smooth, clear of the fixed navbar) and focus the field, instead of
   bouncing them to another program's page. ---- */
(function () {
  var link = document.querySelector('.nav-apply[href="#leadForm"]');
  var form = document.getElementById("leadForm");
  if (!link || !form) return;
  link.addEventListener("click", function (e) {
    e.preventDefault();
    var nav = document.querySelector(".nav");
    var offset = (nav ? nav.getBoundingClientRect().height : 0) + 28;
    var y = form.getBoundingClientRect().top + window.pageYOffset - offset;
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: y < 0 ? 0 : y, behavior: reduce ? "auto" : "smooth" });
    var field = form.querySelector('input[name="phone"], input, textarea');
    if (field) setTimeout(function () { field.focus({ preventScroll: true }); }, reduce ? 0 : 620);
  });
})();
