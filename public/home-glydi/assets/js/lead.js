/* =========================================================================
   ONROL — shared lead-capture handler.  Works with any <form data-lead>.
   Every submission is pushed to the ONROL CRM (go.onrol.in), which upserts
   the lead BY MOBILE NUMBER — so a phone-only program form, or a form from
   any other source, all land on the same CRM record keyed by the mobile.
   The Google Sheet mirror + analytics fire alongside; the user sees an inline
   "thank you" (no WhatsApp redirect).
   Config comes from window.ONROL (assets/js/config.js — load that FIRST).
   ========================================================================= */
(function () {
  "use strict";
  var CFG = window.ONROL || {};
  var CRM_URL = CFG.crmUrl || "https://go.onrol.in/api/public/leads";

  /* keep UTM params across the visit so any later form submit carries them */
  function captureUTM() {
    try {
      var q = new URLSearchParams(location.search), keys = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"], got = false;
      keys.forEach(function (k) { if (q.get(k)) { sessionStorage.setItem(k, q.get(k)); got = true; } });
      return got;
    } catch (e) { return false; }
  }
  function utm() {
    var o = {};
    try { ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"].forEach(function (k) { var v = sessionStorage.getItem(k); if (v) o[k] = v; }); } catch (e) {}
    return o;
  }
  captureUTM();

  var reEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var rePhone = /^[+]?[\d\s()-]{7,16}$/;

  function fieldVal(form, names) {
    for (var i = 0; i < names.length; i++) { var el = form.querySelector('[name="' + names[i] + '"]'); if (el) return el.value.trim(); }
    return "";
  }

  function setStatus(form, msg, ok) {
    var s = form.querySelector(".lead-status");
    if (!s) { s = document.createElement("p"); s.className = "lead-status"; s.setAttribute("role", "status"); form.appendChild(s); }
    s.textContent = msg;
    s.style.color = ok ? "#2e7d32" : "#c62828";
    s.style.fontSize = "13px";
    s.style.marginTop = "10px";
    s.hidden = !msg;
  }

  function campaignOf(program) {
    return String(program || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  /* ---------------------------------------------------------------------
     Push a lead to the CRM (keyed by mobile) + the Google Sheet mirror.
     Fire-and-forget: never blocks or throws into the submit flow. Works
     even when only the mobile number is present (program forms).
     --------------------------------------------------------------------- */
  function submitLead(program, name, phone, email, role, notes) {
    var campaign = campaignOf(program);

    /* 1) ONROL CRM — upserts by mobile number (same structure as every
          other ONROL source). Phone alone is enough to match/create. */
    try {
      fetch(CRM_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(Object.assign({
          name: name, phone: phone, email: email, role: role,
          source: program, campaign: campaign, notes: notes || "",
          // Affiliate attribution — ?ref= from the affiliate link, resolved by
          // the CRM so the referred user appears under that affiliate.
          ref: new URLSearchParams(location.search).get("ref") || ""
        }, utm())),
        keepalive: true
      }).catch(function () {});
    } catch (e) { /* never block */ }

    /* 2) Google Sheet mirror — form_type routes the row to the program tab */
    var sheet = CFG.sheetWebhookUrl;
    if (sheet) {
      try {
        fetch(sheet, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify(Object.assign({
            form_type: campaign.replace(/-/g, ""),
            name: name, full_name: name, phone: phone, email: email, role: role,
            source: program, campaign: campaign, notes: notes || "",
            page_path: location.pathname, page_title: document.title,
            referrer: document.referrer, ua: navigator.userAgent
          }, utm())),
          keepalive: true
        }).catch(function () {});
      } catch (e) { /* never block */ }
    }
  }

  function handle(form) {
    form.addEventListener("submit", async function (e) {
      e.preventDefault();

      /* honeypot — real users never fill this */
      var hp = form.querySelector('[name="botcheck"]');
      if (hp && hp.value) return;

      var program = form.getAttribute("data-program") || "ONROL program";
      var name = fieldVal(form, ["name", "fullName"]);
      var phone = fieldVal(form, ["phone", "mobile", "whatsapp"]);
      var email = fieldVal(form, ["email"]);
      var role = fieldVal(form, ["role"]);
      var notes = fieldVal(form, ["message", "notes"]);

      var hasName = !!form.querySelector('[name="name"],[name="fullName"]');
      var hasEmail = !!form.querySelector('[name="email"]');
      if (hasName && !name) return setStatus(form, "Please enter your name.", false);
      if (!rePhone.test(phone)) return setStatus(form, "Please enter a valid mobile number.", false);
      if (hasEmail && email && !reEmail.test(email)) return setStatus(form, "Please enter a valid email address.", false);

      var btn = form.querySelector('button[type="submit"]');
      var label = btn ? btn.textContent : "";
      if (btn) { btn.disabled = true; btn.dataset.label = label; btn.textContent = "Sending…"; }

      /* CRM + Sheet (mobile-number keyed) */
      submitLead(program, name, phone, email, role, notes);

      if (window.fbq) window.fbq("track", "Lead", { content_name: program });
      if (window.gtag) window.gtag("event", "generate_lead", { program: program });

      form.reset();
      if (btn) { btn.disabled = false; btn.textContent = btn.dataset.label || label; }
      setStatus(form, "Thank you for registering, we will contact you soon.", true);
    });
  }

  /* newsletter — simple inline confirmation; email still mirrored to CRM */
  function handleNewsletter(form) {
    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      var hp = form.querySelector('[name="botcheck"]'); if (hp && hp.value) return;
      var email = fieldVal(form, ["email"]);
      var msg = form.querySelector("#newsMsg, .f-news-msg");
      if (!reEmail.test(email)) { if (msg) { msg.hidden = false; msg.textContent = "Enter a valid email."; } return; }
      submitLead("Newsletter", "", "", email, "", "");
      if (msg) { msg.hidden = false; msg.textContent = "Thanks — you're subscribed."; }
      form.reset();
    });
  }

  document.querySelectorAll("form[data-lead]").forEach(handle);
  var nl = document.getElementById("newsletterForm"); if (nl) handleNewsletter(nl);
})();
