const STEPS = [
  { image: "01-apply-page", chapter: "Getting Started", title: "Open the Signup Page", description: "Visit affiliate.onrol.in/affiliates/apply and choose “Start for free.” Registration costs nothing and usually takes about 2 minutes.", tipTitle: "Before you begin", tip: "Keep access to your email open—the next screen asks for a one-time code.", focus: [51.9, 2.5, 36, 51] },
  { image: "02-apply-filled", chapter: "Getting Started", title: "Enter Your Details", description: "Add your full name, active email, mobile number, and a password with at least 8 characters. Review the details once, then choose “Continue.”", tipTitle: "Use real details", tip: "Your email verifies the account, while your mobile number is used for important partner updates.", focus: [51.9, 2.5, 36, 51] },
  { image: "03-otp-screen", chapter: "Getting Started", title: "Find the Email Code", description: "ONROL sends a 6-digit verification code to the email you entered. Leave this screen open while you check your inbox and spam folder.", tipTitle: "Code not visible?", tip: "Wait a minute, confirm the displayed email is correct, then use the resend option.", focus: [51.9, 2.5, 36, 34] },
  { image: "04-otp-filled", chapter: "Getting Started", title: "Verify Your Email", description: "Type the 6 digits exactly as shown in the email, then choose “Verify email.” A valid code moves you to the final registration step.", tipTitle: "Codes expire", tip: "If verification fails after several minutes, request a fresh code instead of reusing the old one.", focus: [51.9, 2.5, 36, 34] },
  { image: "05-audience-step", chapter: "Getting Started", title: "Tell ONROL Where You Promote", description: "Select your primary channel, add an optional coupon preference, and accept the program terms. Choose “Create my affiliate account” only after reviewing the form.", tipTitle: "Choose your main channel", tip: "You can still share elsewhere later; this answer simply helps ONROL understand your starting audience.", focus: [51.9, 2.5, 36, 63.5] },
  { image: "06-login-page", chapter: "Getting Started", title: "Sign In to the Portal", description: "Return through affiliate.onrol.in/login whenever you need the dashboard. Enter the same email and password you used during registration.", tipTitle: "Save the direct login", tip: "Bookmark the affiliate subdomain so you do not confuse it with the learner or admin portals.", focus: [61.6, 30.5, 28, 39.5] },
  { image: "07-dashboard", chapter: "Your Dashboard", title: "Read the Home Overview", description: "Home brings your balance, pending earnings, recent activity, and active programs into one view. Use it as a quick health check before you start sharing.", tipTitle: "Start with the summary", tip: "A zero is normal for a new account. Activity appears after people begin opening your tracked links.", focus: [19.9, 9.3, 77.7, 53.2] },
  { image: "08-dashboard-stats", chapter: "Your Dashboard", title: "Understand the 4 Key Numbers", description: "Available is ready to withdraw; Pending is waiting for release. Clicks and Sales summarize the last 30 days across your active programs.", tipTitle: "This is a detail view", tip: "The close-up is intentionally isolated so the labels and helper text stay readable.", width: 1126, height: 200, detail: true },
  { image: "09-sidebar", chapter: "Your Dashboard", title: "Use the Sidebar as Your Map", description: "Home is the overview. Promote builds links; Assets provides creatives; Coupons manages your code; Performance measures activity; Earnings explains your money.", tipTitle: "One task, one destination", tip: "Use “Start Promoting” when you want the shortest route from the dashboard to a shareable link.", width: 242, height: 844, detail: true },
  { image: "10-dashboard-full", chapter: "Your Dashboard", title: "Find Programs & Quick Actions", description: "The lower half of Home lists the programs available to you and shortcuts to frequent tasks. An Active status means the program is ready to promote.", tipTitle: "Look below the headline metrics", tip: "Program access and campaign availability can differ by account, so use the cards shown in your own portal.", focus: [19.9, 64.2, 77.7, 35.8] },
  { image: "11-promote-builder", chapter: "Creating Links", title: "Open the Link Builder", description: "Choose Promote in the sidebar. The builder combines a destination, optional coupon, and channel tag into your personal tracked URL.", tipTitle: "Every link is personal", tip: "Copy links from this screen instead of manually editing a program URL, or attribution may be lost.", focus: [19.9, 9.3, 77.7, 44.1] },
  { image: "12-builder-destination", chapter: "Creating Links", title: "Choose a Destination", description: "Select the program page that best matches your content. The generated URL updates automatically when you change the destination.", tipTitle: "Match message to page", tip: "A reel about AI careers should land on its relevant program, not a generic page.", focus: [21.4, 18.1, 74.7, 7] },
  { image: "13-builder-coupon", chapter: "Creating Links", title: "Include Your Coupon", description: "Turn on “Include my discount code” when you want the offer embedded in the link. The customer sees the configured benefit and attribution remains connected to you.", tipTitle: "Optional, but useful", tip: "Coupons are especially helpful when viewers remember a code from a reel but do not click immediately.", focus: [21.4, 26.2, 74.7, 10.8] },
  { image: "14-builder-channel", chapter: "Creating Links", title: "Tag the Sharing Channel", description: "Choose Instagram, YouTube, WhatsApp, or the channel you plan to use. This tag separates performance later without changing the destination.", tipTitle: "Tag before copying", tip: "Create a fresh tagged link for each channel so your comparison stays clean.", focus: [21.4, 38.2, 33.5, 6.6] },
  { image: "15-builder-share", chapter: "Creating Links", title: "Copy or Share the Finished Link", description: "Use Copy link for captions and bios, or choose a direct sharing shortcut. Open the copied URL once in a private tab to confirm the destination.", tipTitle: "This is a detail view", tip: "The close-up keeps the final URL and sharing controls large enough to inspect.", width: 1126, height: 260, detail: true },
  { image: "16-program-cards", chapter: "Creating Links", title: "Compare Available Programs", description: "Program cards summarize the current commission, attribution window, and payout threshold. Choose a card to see the campaigns available inside it.", tipTitle: "Terms live on the card", tip: "Check these values before quoting a rate because ONROL may update individual program terms.", focus: [19.9, 63.5, 77.7, 36.5] },
  { image: "17-program-detail", chapter: "Creating Links", title: "Use Campaign-Ready Links", description: "A program detail page groups its live campaigns and your personal landing or payment links. Copy the link that matches the offer you are discussing.", tipTitle: "Do not mix campaigns", tip: "Campaign-specific links keep both the message and the reporting accurate.", focus: [19.9, 26.7, 77.7, 24.8] },
  { image: "18-assets", chapter: "Creating Links", title: "Download Affiliate Creatives", description: "Open Assets for campaign posters, banners, and prepared captions. Download the right format, add your tracked link, and adapt the caption to your own voice.", tipTitle: "Make the post yours", tip: "Use the official artwork for accuracy, then add a real insight or story instead of posting a generic sales pitch.", focus: [19.9, 25, 18.7, 65.5] },
  { image: "19-coupons", chapter: "Creating Links", title: "Create a Memorable Coupon", description: "Open Coupons, enter a short code your audience can remember, and create it. Customers can type it at checkout when a clickable link is inconvenient.", tipTitle: "Keep it easy to say", tip: "Use your name or handle plus a simple number, and avoid confusing characters.", focus: [19.9, 19.4, 77.7, 21.9] },
  { image: "20-performance", chapter: "Tracking & Earnings", title: "Read Performance at a Glance", description: "Use Clicks, Conversions, Conversion Rate, and Earnings per Click to understand what is working. Change the filters before comparing campaigns.", tipTitle: "Do not judge one metric alone", tip: "High clicks with low conversions usually means the message and destination need a better match.", focus: [19.9, 19.6, 77.7, 12.1] },
  { image: "21-performance-funnel", chapter: "Tracking & Earnings", title: "Follow the Funnel & Export Reports", description: "The funnel shows how clicks become registrations and paid learners. Use the export controls to download earnings, referred leads, or click activity for deeper review.", tipTitle: "This is a detail view", tip: "The cropped frame deliberately focuses on conversion stages and report controls.", width: 1126, height: 420, detail: true },
  { image: "22-click-log", chapter: "Tracking & Earnings", title: "Inspect Individual Clicks", description: "The click log records when a visit happened, which program and channel produced it, and available device or location context. Filter it to investigate a campaign.", tipTitle: "Respect the signal", tip: "Use trends across several clicks; one device or country row is not enough to judge an audience.", focus: [19.9, 64.7, 77.7, 27.3] },
  { image: "23-earnings", chapter: "Tracking & Earnings", title: "Understand Your Earnings Wallet", description: "The Wallet separates pending commission, available balance, and lifetime payouts. Use the withdrawal and statement shortcuts after funds become available.", tipTitle: "Pending is not withdrawable yet", tip: "The release schedule shown above the wallet explains when pending commission becomes available.", focus: [19.9, 19.7, 77.7, 24.9] },
  { image: "24-payouts", chapter: "Tracking & Earnings", title: "Request a Withdrawal", description: "Once the available balance meets the active minimum, choose a payout method and enter the requested amount. Review the available amount before submitting.", tipTitle: "Save a payout account first", tip: "A valid UPI ID or bank account and PAN are required before ONROL can process a withdrawal.", focus: [21.4, 56.2, 74.7, 15.5] },
  { image: "25-statements", chapter: "Tracking & Earnings", title: "Open Monthly Statements", description: "Statements group commissions, releases, payouts, and deductions by month. Choose any month to open its printable record.", tipTitle: "Keep a regular archive", tip: "Save each statement as a PDF instead of waiting until filing season.", focus: [19.9, 17.3, 77.7, 16] },
  { image: "26-profile", chapter: "Tracking & Earnings", title: "Complete Your Public Profile", description: "Add a real photo, useful headline, short bio, and social links. This is the profile visitors see after opening your affiliate link.", tipTitle: "Trust improves conversion", tip: "Keep the referral URL from this panel handy, then save the profile before leaving.", focus: [19.9, 17.3, 77.7, 71.1] }
];

const CHAPTERS = [...new Set(STEPS.map((step) => step.chapter))];
const image = document.querySelector("#step-image");
const stage = document.querySelector("#shot-stage");
const backdrop = document.querySelector("#shot-backdrop");
const focusRing = document.querySelector("#focus-ring");
const player = document.querySelector("#guide-player");
const shotPanel = document.querySelector(".shot-panel");
const strip = document.querySelector("#step-strip");
const tabs = document.querySelector("#chapter-tabs");
const progress = document.querySelector("#progress-bar");
let current = 0;
let touchStart = null;
let updateTimer;

function makeButton(text, label, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = text;
  button.setAttribute("aria-label", label);
  button.addEventListener("click", onClick);
  return button;
}

CHAPTERS.forEach((chapter) => {
  const count = STEPS.filter((step) => step.chapter === chapter).length;
  const button = makeButton(`${chapter} · ${count}`, `Jump to ${chapter}`, () => showStep(STEPS.findIndex((step) => step.chapter === chapter)));
  button.dataset.chapter = chapter;
  tabs.appendChild(button);
});

STEPS.forEach((step, index) => {
  const number = String(index + 1).padStart(2, "0");
  const button = makeButton(number, `Step ${index + 1}: ${step.title}`, () => showStep(index));
  button.title = step.title;
  strip.appendChild(button);
});

function setFocus(step) {
  if (!step.focus || step.detail) {
    focusRing.hidden = true;
    shotPanel.style.removeProperty("--arrow-top");
    return;
  }
  const [left, top, width, height] = step.focus;
  focusRing.classList.toggle("label-below", top < 5);
  focusRing.classList.toggle("label-inside", top + height > 96);
  focusRing.style.left = `${left}%`;
  focusRing.style.top = `${top}%`;
  focusRing.style.width = `${width}%`;
  focusRing.style.height = `${height}%`;
  focusRing.hidden = false;

  const bottom = top + height;
  const overlapsEdgeArrow = left < 7 || left + width > 93;
  if (overlapsEdgeArrow && top < 50 && bottom > 50) {
    const spaceAbove = top;
    const spaceBelow = 100 - bottom;
    const arrowTop = spaceBelow >= spaceAbove
      ? bottom + spaceBelow / 2
      : spaceAbove / 2;
    shotPanel.style.setProperty("--arrow-top", `${Math.min(88, Math.max(8, arrowTop))}%`);
  } else {
    shotPanel.style.removeProperty("--arrow-top");
  }
}

function preloadAround(index) {
  [index + 1, index + 2].forEach((candidate) => {
    const next = STEPS[candidate];
    if (!next) return;
    const preload = new Image();
    preload.src = `shots/${next.image}.png`;
  });
}

function applyStep(index) {
  const step = STEPS[index];
  const src = `shots/${step.image}.png`;
  const isFinalStep = index === STEPS.length - 1;
  document.querySelector("#prev-step").hidden = isFinalStep;
  document.querySelector("#next-step").hidden = isFinalStep;
  image.src = src;
  image.width = step.width || 1366;
  image.height = step.height || 900;
  image.alt = `Step ${index + 1}: ${step.title}`;
  backdrop.style.backgroundImage = `url("${src}")`;
  stage.classList.toggle("detail-shot", Boolean(step.detail));
  document.querySelector("#step-chapter").textContent = step.chapter;
  document.querySelector("#step-number").textContent = String(index + 1).padStart(2, "0");
  document.querySelector("#step-title").textContent = step.title;
  document.querySelector("#step-description").textContent = step.description;
  document.querySelector("#step-tip").previousElementSibling.textContent = step.tipTitle;
  document.querySelector("#step-tip").textContent = step.tip;
  document.querySelector("#continue-step").firstChild.textContent = isFinalStep ? "Finish Guide " : "Next Step ";
  setFocus(step);

  [...strip.children].forEach((button, buttonIndex) => {
    if (buttonIndex === index) button.setAttribute("aria-current", "step");
    else button.removeAttribute("aria-current");
  });
  const activeStep = strip.children[index];
  if (activeStep) {
    const centeredLeft = activeStep.offsetLeft - (strip.clientWidth - activeStep.clientWidth) / 2;
    strip.scrollTo({ left: Math.max(0, centeredLeft), behavior: "smooth" });
  }

  [...tabs.children].forEach((button) => {
    button.setAttribute("aria-current", button.dataset.chapter === step.chapter ? "true" : "false");
  });
  progress.style.width = `${((index + 1) / STEPS.length) * 100}%`;
  const url = new URL(window.location.href);
  url.searchParams.set("step", String(index + 1));
  history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  preloadAround(index);
}

function showStep(index) {
  const next = (index + STEPS.length) % STEPS.length;
  const backwards = next < current && !(current === STEPS.length - 1 && next === 0);
  stage.classList.toggle("reverse", backwards);
  stage.classList.add("is-changing");
  window.clearTimeout(updateTimer);
  updateTimer = window.setTimeout(() => {
    current = next;
    applyStep(current);
    requestAnimationFrame(() => stage.classList.remove("is-changing"));
  }, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 150);
}

document.querySelector("#prev-step").addEventListener("click", () => showStep(current - 1));
document.querySelector("#back-step").addEventListener("click", () => showStep(current - 1));
document.querySelector("#next-step").addEventListener("click", () => showStep(current + 1));
document.querySelector("#continue-step").addEventListener("click", () => {
  if (current === STEPS.length - 1) document.querySelector("#video").scrollIntoView();
  else showStep(current + 1);
});

player.addEventListener("keydown", (event) => {
  if (event.key === "ArrowRight") { event.preventDefault(); showStep(current + 1); }
  if (event.key === "ArrowLeft") { event.preventDefault(); showStep(current - 1); }
});
stage.addEventListener("touchstart", (event) => { touchStart = event.touches[0]?.clientX ?? null; }, { passive: true });
stage.addEventListener("touchend", (event) => {
  if (touchStart === null) return;
  const distance = (event.changedTouches[0]?.clientX ?? touchStart) - touchStart;
  if (Math.abs(distance) > 48) showStep(current + (distance < 0 ? 1 : -1));
  touchStart = null;
}, { passive: true });

const requestedStep = Number.parseInt(new URLSearchParams(window.location.search).get("step") || "1", 10);
current = Number.isFinite(requestedStep) ? Math.min(Math.max(requestedStep - 1, 0), STEPS.length - 1) : 0;
applyStep(current);

function restoreLandingPosition() {
  if (!window.location.hash) window.scrollTo({ top: 0, left: 0, behavior: "instant" });
}

window.addEventListener("load", restoreLandingPosition, { once: true });
window.addEventListener("pageshow", restoreLandingPosition);
