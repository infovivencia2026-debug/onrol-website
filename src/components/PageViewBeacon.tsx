import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

/**
 * Fires a visit-tracking beacon at go.onrol.in/api/public/track/visit on
 * every route change so the CRM's `landing_page_visit_counts` table stays
 * live.
 *
 * Implementation:
 *   1. Prefer navigator.sendBeacon — fire-and-forget, browser handles
 *      page unload, and (importantly) it does NOT log a noisy
 *      "Failed to load resource" line to DevTools when the endpoint
 *      is briefly unavailable.
 *   2. Fall back to a no-cors fetch with .catch() suppressing rejection.
 *   3. Circuit breaker: after 2 consecutive failures (or any 5xx blip on
 *      the CRM) we pause the beacon for 5 minutes. The CRM cluster has
 *      had brief restart windows where every nav was firing a 503 into
 *      the console; the breaker keeps that quiet for real users.
 *
 * Skipped paths cover admin/messenger/task/learn — those have their own
 * analytics. Desktop runtime + Capacitor are also opted out.
 */
const SKIP_PREFIXES = [
  "/admin",
  "/messenger",
  "/task",
  "/learn/admin",
  "/login",
  "/signup",
  "/auth/",
];

const BEACON_ORIGIN = "https://go.onrol.in";
const BREAKER_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes
const BREAKER_THRESHOLD = 2;

let beaconFailures = 0;
let beaconPausedUntil = 0;

const sendVisit = (path: string, search: string) => {
  const now = Date.now();
  if (now < beaconPausedUntil) return; // circuit open — silently skip

  const url = new URL(BEACON_ORIGIN + "/api/public/track/visit");
  url.searchParams.set("p", path);
  if (search) {
    const sp = new URLSearchParams(search);
    for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"]) {
      const v = sp.get(k);
      if (v) url.searchParams.set(k, v);
    }
  }
  url.searchParams.set("_t", now.toString(36));

  // Try sendBeacon first. It returns true when the request was queued,
  // false when the user-agent refused (e.g. payload too big, page in
  // bfcache). It does NOT report network success/failure — that's fine
  // for a fire-and-forget analytics pixel and is the quiet path.
  if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
    try {
      const queued = navigator.sendBeacon(url.toString());
      if (queued) {
        beaconFailures = 0;
        return;
      }
    } catch { /* fall through to fetch */ }
  }

  // Fallback: no-cors fetch keeps the request opaque and quietly suppresses
  // the error path. mode: "no-cors" means we can't read the status (always
  // opaque/0) — that's by design for an analytics pixel.
  if (typeof fetch === "function") {
    fetch(url.toString(), { method: "GET", mode: "no-cors", keepalive: true })
      .then(() => { beaconFailures = 0; })
      .catch(() => {
        beaconFailures += 1;
        if (beaconFailures >= BREAKER_THRESHOLD) {
          beaconPausedUntil = Date.now() + BREAKER_COOLDOWN_MS;
        }
      });
  }
};

export default function PageViewBeacon() {
  const location = useLocation();
  const lastPathRef = useRef<string>("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const desktopRuntime = Boolean((window as unknown as { desktopAPI?: unknown }).desktopAPI);
    if (desktopRuntime) return;

    const path = location.pathname;
    if (!path || path === lastPathRef.current) return;
    if (SKIP_PREFIXES.some((p) => path.startsWith(p))) return;
    lastPathRef.current = path;

    sendVisit(path, window.location.search);
  }, [location.pathname]);

  return null;
}
