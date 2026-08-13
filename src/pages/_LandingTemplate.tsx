/**
 * ────────────────────────────────────────────────────────────────────
 *  EXTERNAL LANDING PAGE — copy-paste template
 * ────────────────────────────────────────────────────────────────────
 *
 * Recipe for a new landing page (typical: 20-30 min total):
 *
 *   1. DUPLICATE this file:
 *        cp src/pages/_LandingTemplate.tsx src/pages/LandingMyOffer.tsx
 *
 *   2. EDIT the hero copy, image, FAQ etc. in this file.
 *
 *   3. SET the four props on <LandingCaptureForm> at the bottom:
 *        - source       (UNIQUE per LP — e.g. "lp-my-offer-sep-2026")
 *        - campaign     (optional — group multiple LPs in one campaign)
 *        - webinarSlug  (optional — auto-registers + sends WA + email)
 *        - redirectTo   (optional — thank-you URL)
 *
 *   4. REGISTER the route in src/App.tsx:
 *        const LandingMyOffer = lazy(() => import("./pages/LandingMyOffer"));
 *        ...
 *        <Route path="/landingpage/my-offer" element={<LandingMyOffer />} />
 *
 *   5. `npm run build && deploy`. Done.
 *
 *   The CRM at go.onrol.in receives every lead with the `source` you
 *   set, auto-attributes UTM params, and (if webinarSlug is provided)
 *   sends the WhatsApp + email confirmation automatically.
 *
 *   Filename convention: prefix with `_` for the template so it's
 *   easy to spot in the file tree and so we know it isn't routed.
 * ────────────────────────────────────────────────────────────────────
 */

import { LandingCaptureForm } from "@/components/LandingCaptureForm";

export default function LandingTemplate() {
  return (
    <main style={{ minHeight: "100vh", background: "linear-gradient(180deg, #fff7ed 0%, #ffffff 60%)" }}>
      {/* ── HERO ──────────────────────────────────────────────────── */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "1.2fr 1fr",
          gap: 48,
          alignItems: "center",
          maxWidth: 1200,
          margin: "0 auto",
          padding: "72px 24px 56px",
        }}
        className="lp-hero-grid"
      >
        <div>
          <span
            style={{
              display: "inline-block",
              padding: "5px 12px",
              borderRadius: 999,
              background: "rgba(234, 88, 12, 0.1)",
              color: "#c2410c",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: 14,
            }}
          >
            Free Masterclass · 10 Sep 2026
          </span>
          <h1
            style={{
              fontSize: "clamp(30px, 4.5vw, 48px)",
              fontWeight: 800,
              letterSpacing: "-0.025em",
              lineHeight: 1.12,
              margin: "0 0 16px",
              color: "#f3f5f8",
            }}
          >
            Replace the headline with the ONE outcome learners get
          </h1>
          <p
            style={{
              fontSize: "clamp(15px, 1.8vw, 18px)",
              color: "#404040",
              lineHeight: 1.6,
              maxWidth: 540,
              margin: "0 0 28px",
            }}
          >
            Two-line subheading that justifies the headline. Focus on the
            transformation, not the curriculum. Drop social proof, a key
            number, and what they'll walk away with.
          </p>

          <ul
            style={{
              listStyle: "none",
              margin: "0 0 24px",
              padding: 0,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {[
              "Bullet point 1 — what they'll learn or get",
              "Bullet point 2 — proof / credential / outcome",
              "Bullet point 3 — what makes this not generic",
            ].map((line) => (
              <li
                key={line}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  fontSize: 14.5,
                  color: "#404040",
                }}
              >
                <span style={{ color: "#16a34a", fontWeight: 800, marginTop: 1 }}>✓</span>
                {line}
              </li>
            ))}
          </ul>
        </div>

        {/* ── FORM ─────────────────────────────────────────────────── */}
        <LandingCaptureForm
          /* CHANGE THIS — unique per landing page */
          source="lp-template-replace-me"
          /* Optional — group LPs under one campaign */
          campaign="campaign-replace-me"
          /* Optional — auto-registers + sends WA + email confirmation */
          // webinarSlug="ai-masterclass-sep-2026"
          /* Optional — sends user to a custom thanks page */
          // redirectTo="/thanks/my-offer"
          heading="Reserve your seat"
          subheading="Free · 90 minutes · Limited to 200 seats"
          ctaLabel="Reserve my seat"
        />
      </section>

      {/* ── PROOF STRIP (optional) ────────────────────────────────── */}
      <section
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "24px 24px 56px",
          textAlign: "center",
        }}
      >
        <p
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "#64748b",
            marginBottom: 18,
          }}
        >
          Trusted by 4,000+ learners across 12 personas
        </p>
        {/* Drop your logos / testimonials / stat grid here */}
      </section>

      {/* ── HOW IT WORKS / FAQ etc. ───────────────────────────────── */}
      {/* Add additional sections as needed. Pull from the existing
          shared components in src/components/: HeroSection, FAQSection,
          OnrolDifference, CommunitySection, etc. */}

      {/* Mobile responsiveness for the hero grid */}
      <style>{`
        @media (max-width: 860px) {
          main .lp-hero-grid { grid-template-columns: 1fr !important; padding: 48px 20px 36px !important; gap: 32px !important; }
        }
      `}</style>
    </main>
  );
}
