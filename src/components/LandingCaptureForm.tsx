import { useEffect, useRef, useState, FormEvent } from "react";
import "./LandingCaptureForm.css";

/**
 * Drop-in lead-capture form for external landing pages.
 *
 * Posts directly to the CRM's public lead endpoint
 * (https://go.onrol.in/api/public/leads). The CRM handles:
 *   - lead row creation in Postgres
 *   - UTM + referrer attribution (we forward them)
 *   - webinar registration (when `webinarSlug` is passed)
 *     → fires the WhatsApp + email confirmation automatically
 *   - rate limiting (10 req / min / IP)
 *   - honeypot anti-spam
 *
 * Usage:
 *   <LandingCaptureForm
 *     source="lp-ai-accelerator-sep-2026"
 *     campaign="ai-accelerator-sep-2026"
 *     webinarSlug="ai-accelerator-sep-masterclass"   // optional
 *     redirectTo="/thanks/ai-accelerator"            // optional
 *     ctaLabel="Reserve my seat"
 *   />
 *
 * That's it. No backend wiring per page; the CRM already accepts
 * cross-origin POSTs from any domain.
 */

const CRM_PUBLIC_LEADS_URL = "https://go.onrol.in/api/public/leads";

export interface LandingCaptureFormProps {
  /** Unique identifier for this landing page. Becomes `lead.source` in the
   *  CRM, so make it specific (e.g. `lp-ai-accelerator-sep-2026`). */
  source: string;
  /** Optional campaign label — useful when one campaign has many LPs. */
  campaign?: string;
  /** Webinar to auto-register every lead for. Set this and the CRM will
   *  send the WhatsApp + email confirmation automatically. */
  webinarSlug?: string;
  /** Ambassador / counsellor to attribute leads to (CRM user external id). */
  attributeTo?: string;
  /** Where to send the browser after a successful submit. If omitted,
   *  shows the inline success card. */
  redirectTo?: string;
  /** Big primary-button text. */
  ctaLabel?: string;
  /** Optional heading shown above the form. */
  heading?: string;
  /** Optional small subtitle below the heading. */
  subheading?: string;
  /** Pre-fill / hide specific fields. By default all three show + are required. */
  fields?: {
    name?: { label?: string; placeholder?: string; required?: boolean };
    email?: { label?: string; placeholder?: string; required?: boolean };
    phone?: { label?: string; placeholder?: string; required?: boolean };
  };
  /** Extra custom hidden fields to send with the lead (e.g. { role: "founder" }). */
  extras?: Record<string, string>;
  /** Compact one-line layout (good for hero CTAs) vs. stacked card. */
  variant?: "card" | "inline";
  /** Style overrides if you want to slot it next to a hero illustration. */
  className?: string;
}

interface UtmContext {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
}

function readUtm(): UtmContext {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  const out: UtmContext = {};
  for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"] as const) {
    const v = params.get(k);
    if (v) out[k] = v;
  }
  return out;
}

export function LandingCaptureForm({
  source,
  campaign,
  webinarSlug,
  attributeTo,
  redirectTo,
  ctaLabel = "Reserve my seat",
  heading,
  subheading,
  fields,
  extras,
  variant = "card",
  className,
}: LandingCaptureFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [honey, setHoney] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const submittedAt = useRef(0);

  const f = {
    name:  { label: "Full name",       placeholder: "Anita Sharma",        required: true,  ...fields?.name  },
    email: { label: "Email",           placeholder: "you@example.com",     required: true,  ...fields?.email },
    phone: { label: "WhatsApp number", placeholder: "+91 98765 43210",     required: true,  ...fields?.phone },
  };

  // Set the page title for analytics + the CRM dashboard ("Lead from <page>").
  useEffect(() => {
    if (typeof document !== "undefined") {
      // No-op — just a hook point if we ever want to do page-view tracking.
    }
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;

    // Trivial client-side rate guard — block double submits inside 2s.
    const now = Date.now();
    if (now - submittedAt.current < 2000) return;
    submittedAt.current = now;

    setError(null);

    // Honeypot — bots fill the hidden field, humans don't.
    if (honey) {
      // Fake a success to avoid signalling our trap.
      setOk(true);
      return;
    }

    const nm = name.trim();
    const em = email.trim().toLowerCase();
    const ph = phone.replace(/[^\d+]/g, "");

    if (f.name.required  && !nm) { setError("Please enter your name.");      return; }
    if (f.email.required && !em) { setError("Please enter your email.");     return; }
    if (f.phone.required && !ph) { setError("Please enter your WhatsApp number."); return; }
    if (em && !/^\S+@\S+\.\S+$/.test(em)) { setError("Email doesn't look right."); return; }
    if (ph && ph.replace(/^\+/, "").length < 8) { setError("Phone number looks too short."); return; }

    setBusy(true);
    try {
      const utm = readUtm();
      const body = {
        name: nm,
        email: em,
        phone: ph,
        source,
        ...(campaign     ? { campaign }                : {}),
        ...(webinarSlug  ? { webinar_slug: webinarSlug } : {}),
        ...(attributeTo  ? { referrer_user_id: attributeTo } : {}),
        ...(extras       ? extras                      : {}),
        ...utm,
        pagePath: typeof window !== "undefined" ? window.location.pathname : null,
        referrer: typeof document !== "undefined" ? document.referrer || null : null,
        honey, // intentionally pass — CRM ignores filled honey + records nothing
      };
      const r = await fetch(CRM_PUBLIC_LEADS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const data = await r.json().catch(() => ({} as { message?: string }));
        throw new Error(data.message ?? `Submit failed (${r.status})`);
      }
      setOk(true);
      if (redirectTo) {
        // Tiny delay so the success state flashes before navigation —
        // reassures the user the form actually went through.
        window.setTimeout(() => { window.location.href = redirectTo; }, 350);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't submit. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (ok && !redirectTo) {
    return (
      <div className={`olcf olcf--success ${className ?? ""}`}>
        <div className="olcf-success-icon" aria-hidden>✓</div>
        <h3 className="olcf-success-title">You're in</h3>
        <p className="olcf-success-sub">
          Confirmation sent to your WhatsApp and email. Check now — and reply STOP at any time to unsubscribe.
        </p>
      </div>
    );
  }

  return (
    <form
      className={`olcf olcf--${variant} ${className ?? ""}`}
      onSubmit={onSubmit}
      noValidate
      aria-label="Lead capture form"
    >
      {heading ? <h2 className="olcf-heading">{heading}</h2> : null}
      {subheading ? <p className="olcf-sub">{subheading}</p> : null}

      <label className="olcf-field">
        <span className="olcf-label">{f.name.label}</span>
        <input
          type="text"
          name="name"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={f.name.placeholder}
          required={f.name.required}
          className="olcf-input"
        />
      </label>

      <label className="olcf-field">
        <span className="olcf-label">{f.email.label}</span>
        <input
          type="email"
          name="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={f.email.placeholder}
          required={f.email.required}
          className="olcf-input"
        />
      </label>

      <label className="olcf-field">
        <span className="olcf-label">{f.phone.label}</span>
        <input
          type="tel"
          name="phone"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder={f.phone.placeholder}
          required={f.phone.required}
          className="olcf-input"
        />
      </label>

      {/* Honeypot — visually hidden, screen-reader hidden, but in the DOM
          so naive bots fill it. The CRM also enforces a server-side honey
          check. */}
      <input
        type="text"
        name="honey"
        tabIndex={-1}
        autoComplete="off"
        value={honey}
        onChange={(e) => setHoney(e.target.value)}
        className="olcf-honey"
        aria-hidden
      />

      {error ? <p className="olcf-error" role="alert">{error}</p> : null}

      <button type="submit" className="olcf-cta" disabled={busy}>
        {busy ? "Submitting…" : ctaLabel}
      </button>

      <p className="olcf-foot">
        We'll send a WhatsApp + email confirmation. No spam. Reply STOP to unsubscribe.
      </p>
    </form>
  );
}
