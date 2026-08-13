import { useEffect, useState } from "react";
import { Smartphone, X } from "lucide-react";

// Floating "Get the app" pill — appears bottom-right on mobile after the
// user has scrolled past the hero AND been on the page for >10s. Dismissed
// for 7 days via localStorage so we don't badger people. Native (Capacitor)
// hides it because they already have the app.
//
// Drop it once near the root layout (`<GetTheAppPill />`) — no props.

const STORAGE_KEY = "onrol.dismissed_app_pill_until";
const DELAY_MS = 10_000;
const DISMISS_DAYS = 7;

export default function GetTheAppPill() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Native shell already IS the app — never show.
    if ((window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.()) return;
    // Honor dismissal.
    const until = Number(localStorage.getItem(STORAGE_KEY) || "0");
    if (Date.now() < until) return;
    // Only on smaller screens.
    if (!window.matchMedia("(max-width: 768px)").matches) return;

    const t = window.setTimeout(() => setVisible(true), DELAY_MS);
    return () => window.clearTimeout(t);
  }, []);

  if (!visible) return null;

  // bottom-44 (176px) clears MobileBottomNav (~70px) + WhatsAppBubble at bottom-24.
  return (
    <div className="fixed bottom-44 right-4 z-[60] flex items-center gap-2 rounded-full bg-white/95 px-4 py-2.5 text-sm text-[#0B1640] shadow-xl ring-1 ring-[#0B1640]/10 backdrop-blur md:hidden">
      <Smartphone className="h-4 w-4 text-orange-300" aria-hidden />
      <a
        href="/app"
        className="font-medium underline decoration-cyan-300/60 underline-offset-2"
      >
        Get the ONROL app
      </a>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => {
          localStorage.setItem(
            STORAGE_KEY,
            String(Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000),
          );
          setVisible(false);
        }}
        className="ml-1 rounded-full p-1 text-slate-400 hover:bg-white/5 hover:text-white"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
