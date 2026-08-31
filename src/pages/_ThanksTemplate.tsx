/**
 * ────────────────────────────────────────────────────────────────────
 *  THANKS PAGE — copy-paste template
 * ────────────────────────────────────────────────────────────────────
 *
 * Pair this with a landing page that has `redirectTo="/thanks/<slug>"`
 * on its <LandingCaptureForm>. After successful submission, the
 * learner lands here.
 *
 * Recipe:
 *   1. Duplicate this file: `_ThanksTemplate.tsx` → `ThanksMyOffer.tsx`
 *   2. Tweak the headline + subhead + community/calendar links
 *   3. Add the route in src/App.tsx:
 *        <Route path="/thanks/my-offer" element={<ThanksMyOffer />} />
 *   4. Make sure the matching landing page's redirectTo matches the route.
 * ────────────────────────────────────────────────────────────────────
 */

import { Link } from "react-router-dom";

export default function ThanksTemplate() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
        background: "linear-gradient(180deg, #fff7ed 0%, #ffffff 100%)",
      }}
    >
      <div
        style={{
          maxWidth: 520,
          width: "100%",
          background: "#fff",
          padding: "40px 32px 32px",
          borderRadius: 18,
          border: "1px solid #e5e7eb",
          boxShadow: "0 24px 48px -28px rgba(0,0,0, 0.22)",
          textAlign: "center",
        }}
      >
        <div
          aria-hidden
          style={{
            width: 64,
            height: 64,
            margin: "0 auto 20px",
            borderRadius: 999,
            background: "linear-gradient(135deg, #22c55e, #16a34a)",
            color: "#fff",
            fontSize: 32,
            fontWeight: 800,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 14px 26px -12px rgba(22, 163, 74, 0.55)",
          }}
        >
          ✓
        </div>

        <h1
          style={{
            margin: "0 0 8px",
            fontSize: 26,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            color: "#f3f5f8",
          }}
        >
          You're in
        </h1>
        <p
          style={{
            margin: "0 0 24px",
            fontSize: 14.5,
            lineHeight: 1.6,
            color: "#404040",
          }}
        >
          Confirmation just went out on WhatsApp + email. Check now — and
          join the community below so you don't miss reminders or live drops.
        </p>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            marginTop: 8,
          }}
        >
          {/* Primary CTA — change to the WhatsApp community / Calendly link */}
          <a
            href="https://chat.whatsapp.com/REPLACE_ME"
            target="_blank"
            rel="noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "13px 22px",
              background: "linear-gradient(135deg, #fb923c, #ea580c)",
              color: "#fff",
              fontWeight: 700,
              fontSize: 14.5,
              borderRadius: 12,
              textDecoration: "none",
              boxShadow: "0 14px 26px -12px rgba(234, 88, 12, 0.55)",
            }}
          >
            Join the WhatsApp community
          </a>

          {/* Secondary CTA — calendar add / next step */}
          <Link
            to="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "11px 22px",
              background: "transparent",
              color: "#404040",
              fontWeight: 600,
              fontSize: 13.5,
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              textDecoration: "none",
            }}
          >
            Back to onrol.in
          </Link>
        </div>

        <p
          style={{
            margin: "20px 0 0",
            fontSize: 11.5,
            color: "#64748b",
          }}
        >
          Reply STOP on WhatsApp at any time to unsubscribe.
        </p>
      </div>
    </main>
  );
}
