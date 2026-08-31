import { useEffect, useState } from "react";
import "./SitePreloader.css";

const PANELS = 5;
const PANEL_STAGGER = 110; // ms between panel starts
const PANEL_DURATION = 780; // keep in sync with spre-rise in the CSS
const HOLD = 520; // logo breathing room once the curtain is full
const EXIT = 900; // keep in sync with .spre.is-leaving transition
const SESSION_KEY = "onrol:preloader-shown";

/**
 * First-load curtain: brand panels rise in a staircase over an orange field,
 * the ONROL lockup settles, then the whole curtain scrolls up to reveal the
 * page. Shown once per browser session.
 */
const SitePreloader = () => {
  const [active, setActive] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return sessionStorage.getItem(SESSION_KEY) !== "1";
    } catch {
      return true;
    }
  });
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!active) return;
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      /* private mode — the curtain simply plays again next load */
    }

    const fillDone = (PANELS - 1) * PANEL_STAGGER + PANEL_DURATION;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const leaveTimer = window.setTimeout(() => setLeaving(true), fillDone + HOLD);
    const doneTimer = window.setTimeout(() => setActive(false), fillDone + HOLD + EXIT);

    return () => {
      window.clearTimeout(leaveTimer);
      window.clearTimeout(doneTimer);
      document.body.style.overflow = prevOverflow;
    };
  }, [active]);

  if (!active) return null;

  const fillDone = (PANELS - 1) * PANEL_STAGGER + PANEL_DURATION;

  return (
    <div className={`spre${leaving ? " is-leaving" : ""}`} aria-hidden="true" role="presentation">
      <div className="spre__panels">
        {Array.from({ length: PANELS }, (_, i) => (
          <div
            key={i}
            className="spre__panel"
            style={{ animationDelay: `${i * PANEL_STAGGER}ms` }}
          />
        ))}
      </div>
      <div className="spre__brand">
        <img
          src="/onrol-logo-light.png"
          alt=""
          className="spre__logo"
          style={{ animationDelay: `${fillDone - 120}ms` }}
          decoding="async"
        />
        <span className="spre__bar" style={{ animationDelay: `${fillDone - 40}ms` }} />
      </div>
    </div>
  );
};

export default SitePreloader;
