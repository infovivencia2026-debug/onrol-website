/* =========================================================================
   ONROL — conversion widgets (drop-in). Reads window.ONROL (config.js).
   Injects:  a11y skip link · a sticky, dismissible COHORT URGENCY bar with a
   live countdown + seats-left that doubles as the mobile Apply/WhatsApp CTA.
   No per-page markup needed. Load with `defer` AFTER config.js.
   ========================================================================= */
(function () {
  "use strict";
  var CFG = window.ONROL || {};

  /* ---- which program is this page? (from the lead form's data-program) ---- */
  var pEl = document.querySelector("[data-program]");
  var program = pEl ? pEl.getAttribute("data-program") : null;
  var cohort = (CFG.cohorts && program && CFG.cohorts[program]) || null;
  var waNum = CFG.whatsappNumber || "918121306701";

  /* ---- inject CSS ---- */
  var css = document.createElement("style");
  css.textContent =
    ".onrol-skip{position:fixed;left:-999px;top:8px;z-index:300;background:var(--orange,#F46718);color:#fff;padding:10px 16px;font-family:var(--mono,monospace);font-size:13px;text-decoration:none}.onrol-skip:focus{left:8px}" +
    ".onrol-cbar{position:fixed;left:0;right:0;bottom:0;z-index:180;transform:translateY(115%);transition:transform .45s cubic-bezier(.2,.7,.2,1);background:linear-gradient(180deg,#1A1512,#12100E);color:#F6EFE4;border-top:1px solid rgba(244,103,24,.45);box-shadow:0 -12px 34px rgba(0,0,0,.45)}" +
    ".onrol-cbar.show{transform:none}.onrol-cbar .in{max-width:1180px;margin:0 auto;display:flex;align-items:center;gap:16px;padding:11px 18px;flex-wrap:wrap}" +
    ".ocb-l{display:flex;align-items:center;gap:14px;flex:1 1 auto;min-width:0;font-family:var(--mono,monospace);font-size:13px}" +
    ".ocb-dot{width:9px;height:9px;border-radius:50%;background:#57D9A3;box-shadow:0 0 0 0 rgba(87,217,163,.5);animation:ocbP 1.8s infinite;flex:0 0 auto}@keyframes ocbP{70%{box-shadow:0 0 0 8px rgba(87,217,163,0)}100%{box-shadow:0 0 0 0 rgba(87,217,163,0)}}" +
    ".ocb-c b{color:#FF8A4A}.ocb-s{color:#E9A23B;white-space:nowrap}.ocb-a{display:flex;gap:10px;align-items:center;flex:0 0 auto}" +
    ".ocb-b{display:inline-flex;align-items:center;gap:8px;padding:11px 20px;font-family:var(--mono,monospace);font-size:12px;letter-spacing:1px;text-transform:uppercase;text-decoration:none;cursor:pointer;border:0;transition:background .2s,border-color .2s,color .2s}" +
    ".ocb-apply{background:#F46718;color:#fff}.ocb-apply:hover{background:#FF8A4A}.ocb-wa{background:transparent;color:#F6EFE4;border:1px solid rgba(246,239,228,.3)}.ocb-wa:hover{border-color:#1faf57;color:#1faf57}.ocb-wa svg{width:16px;height:16px;fill:currentColor}" +
    ".ocb-x{background:none;border:0;color:#8A8078;font-size:20px;line-height:1;cursor:pointer;padding:0 4px;flex:0 0 auto}.ocb-x:hover{color:#F6EFE4}" +
    "@media(max-width:640px){.ocb-s{display:none}.ocb-l{font-size:12px;gap:10px}.ocb-b{padding:10px 14px}.ocb-wa span{display:none}}" +
    "@media(prefers-reduced-motion:reduce){.onrol-cbar{transition:none}.ocb-dot{animation:none}}";
  document.head.appendChild(css);

  /* ---- skip link (a11y) ---- */
  var main = document.querySelector("main, .page, section");
  if (main) {
    if (!main.id) main.id = "main-content";
    var skip = document.createElement("a");
    skip.className = "onrol-skip"; skip.href = "#" + main.id; skip.textContent = "Skip to content";
    document.body.insertBefore(skip, document.body.firstChild);
  }

  if (!cohort) return;   /* no cohort config for this page -> no bar */

  /* ---- dismissed today? ---- */
  var KEY = "onrol_cbar_" + (program || "x");
  try { if (localStorage.getItem(KEY) === new Date().toDateString()) return; } catch (e) {}

  /* ---- build the bar ---- */
  var bar = document.createElement("div");
  bar.className = "onrol-cbar";
  bar.setAttribute("role", "region");
  bar.setAttribute("aria-label", "Next cohort");
  var applyHref = document.getElementById("register") ? "#register" : "#leadForm";
  var waMsg = "Hi ONROL, I want to apply for the " + program + ". Please share details.";
  bar.innerHTML =
    '<div class="in">' +
      '<div class="ocb-l"><span class="ocb-dot" aria-hidden="true"></span>' +
        '<span>Next <b>' + program.replace(/ Program$/, "") + '</b> cohort</span>' +
        '<span class="ocb-c" id="ocbCount"></span>' +
        '<span class="ocb-s">' + cohort.seatsLeft + ' seats left</span>' +
      '</div>' +
      '<div class="ocb-a">' +
        '<a class="ocb-b ocb-apply" href="' + applyHref + '">Apply now</a>' +
        '<a class="ocb-b ocb-wa" href="https://wa.me/' + waNum + '?text=' + encodeURIComponent(waMsg) + '" target="_blank" rel="noopener" aria-label="Chat on WhatsApp">' +
          '<svg viewBox="0 0 24 24"><path d="M17.5 14.4c-.3-.2-1.7-.9-2-1-.3-.1-.5-.1-.7.2l-1 1.2c-.2.2-.4.2-.7.1a8 8 0 0 1-2.4-1.5 9 9 0 0 1-1.6-2c-.2-.3 0-.5.1-.6l.5-.6c.2-.2.2-.3.3-.5s0-.4 0-.5l-1-2.3c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.3 5.1 4.6.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.7-.7 2-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.6-.3zM12 2a10 10 0 0 0-8.6 15l-1.3 4.7L7 20.4A10 10 0 1 0 12 2z"/></svg><span>WhatsApp</span>' +
        '</a>' +
        '<button class="ocb-x" type="button" aria-label="Dismiss">&times;</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(bar);

  /* ---- countdown ---- */
  var countEl = bar.querySelector("#ocbCount");
  var target = new Date(cohort.startDate + "T09:00:00+05:30").getTime();
  function fmt() {
    var d = target - Date.now();
    if (d <= 0) { countEl.innerHTML = "&middot; <b>enrolling now</b>"; return; }
    var days = Math.floor(d / 864e5), hrs = Math.floor((d % 864e5) / 36e5), min = Math.floor((d % 36e5) / 6e4);
    countEl.innerHTML = "&middot; starts in <b>" + days + "d " + hrs + "h " + min + "m</b>";
  }
  fmt(); setInterval(fmt, 30000);

  /* ---- show after a little scroll; dismiss ---- */
  function reveal() { if ((window.pageYOffset || 0) > 300) { bar.classList.add("show"); removeEventListener("scroll", reveal); } }
  addEventListener("scroll", reveal, { passive: true });
  setTimeout(function () { bar.classList.add("show"); }, 3500);   /* also show if they don't scroll */
  bar.querySelector(".ocb-x").addEventListener("click", function () {
    bar.classList.remove("show");
    try { localStorage.setItem(KEY, new Date().toDateString()); } catch (e) {}
  });
})();
