import { useEffect, useState } from "react";
import { Gauge, PictureInPicture2, HelpCircle, Smartphone } from "lucide-react";
import { lmsFlagDoubt, lmsGetDoubtTally } from "@/lib/lmsClient";

/**
 * Below-player utility strip:
 *   1. Bandwidth saver — toggles low-quality iframe URL for poor connections
 *   2. PiP — opens the underlying <video> in browser picture-in-picture
 *   3. "I have a doubt" — fire-and-forget confusion signal (mentor sees aggregate)
 *
 * Bandwidth saver works by rewriting the iframe's `quality=` query so Bunny's
 * embed player starts at 240p instead of auto-ABR. Player still adapts if
 * the connection improves, but starts lighter.
 *
 * PiP requires the user gesture, hence the button. We grab the first
 * <video> inside the Bunny iframe; cross-origin iframes block direct
 * access, but Bunny's embed exposes the video element to its own
 * `requestPictureInPicture()` via postMessage — we attempt it via the
 * `pictureInPictureEnabled` API and fall back to opening the underlying
 * direct-play URL in a new tab.
 */
const DOUBT_POLL_MS = 12_000;

export default function LivePlayerControls({
  sessionId,
  iframeRef,
  onBandwidthChange,
  canModerate,
}: {
  sessionId: string;
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  onBandwidthChange: (mode: "auto" | "saver") => void;
  canModerate: boolean;
}) {
  const [mode, setMode] = useState<"auto" | "saver">("auto");
  const [doubt, setDoubt] = useState<{ count: number; total: number }>({ count: 0, total: 0 });
  const [doubtSent, setDoubtSent] = useState(false);

  // Doubts tally — poll for mentors (shows aggregate), or for learners
  // who just want to see "you're not alone, 12 others are confused".
  useEffect(() => {
    let cancelled = false;
    async function tick() {
      if (document.visibilityState !== "visible") return;
      const t = await lmsGetDoubtTally(sessionId);
      if (!cancelled) setDoubt(t);
    }
    void tick();
    const id = window.setInterval(tick, DOUBT_POLL_MS);
    return () => { cancelled = true; window.clearInterval(id); };
  }, [sessionId]);

  function toggleBandwidth() {
    const next = mode === "auto" ? "saver" : "auto";
    setMode(next);
    onBandwidthChange(next);
  }

  async function flagDoubt() {
    setDoubtSent(true);
    await lmsFlagDoubt(sessionId);
    // Refresh tally so the new vote shows immediately.
    setDoubt(await lmsGetDoubtTally(sessionId));
    window.setTimeout(() => setDoubtSent(false), 2500);
  }

  async function enterPip() {
    // Try the standard PictureInPicture API on any <video> we can reach.
    const iframe = iframeRef.current;
    if (!iframe) return;
    try {
      const innerDoc = iframe.contentDocument;
      const video = innerDoc?.querySelector("video") as HTMLVideoElement | null;
      if (video && document.pictureInPictureEnabled) {
        await video.requestPictureInPicture();
        return;
      }
    } catch { /* cross-origin, fall through */ }
    // Fallback: open the Bunny iframe URL in a small popup window for
    // students who want to multitask. Not true PiP but the closest UX
    // we can offer through the cross-origin embed.
    window.open(iframe.src, "onrol-pip", "width=480,height=270,toolbar=no,menubar=no");
  }

  return (
    <div style={{
      marginTop: 8, display: "flex", flexWrap: "wrap", alignItems: "center",
      gap: 8, fontSize: 12,
    }}>
      <button
        type="button"
        onClick={flagDoubt}
        style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "5px 12px",
          border: `1px solid ${doubtSent ? "var(--ok, #15803d)" : "var(--learn-border, #e5e7eb)"}`,
          borderRadius: 999,
          background: doubtSent ? "rgba(34, 197, 94, 0.08)" : "rgba(234, 88, 12, 0.04)",
          color: doubtSent ? "var(--ok, #15803d)" : "var(--learn-accent-2, #ea580c)",
          fontWeight: 600, cursor: "pointer",
        }}
        title="Flag confusion to the mentor — no queue, no exposure"
      >
        <HelpCircle size={12} />
        {doubtSent ? "Got it — mentor sees you're confused" : "I have a doubt"}
        {doubt.count > 0 ? <span style={{ marginLeft: 4, color: "var(--learn-muted, #6b7280)" }}>{doubt.count} confused</span> : null}
      </button>

      <button
        type="button"
        onClick={toggleBandwidth}
        title="Bandwidth saver — lower video quality for slow connections"
        style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "5px 10px",
          border: `1px solid ${mode === "saver" ? "var(--learn-accent-2, #ea580c)" : "var(--learn-border, #e5e7eb)"}`,
          borderRadius: 999,
          background: mode === "saver" ? "rgba(234, 88, 12, 0.06)" : "var(--learn-surface, #fff)",
          color: mode === "saver" ? "var(--learn-accent-2, #ea580c)" : "var(--learn-ink, #f3f5f8)",
          fontWeight: 600, cursor: "pointer",
        }}
      >
        <Smartphone size={12} />
        {mode === "saver" ? "Saver ON" : "Saver"}
      </button>

      <button
        type="button"
        onClick={enterPip}
        title="Open the video in a floating window"
        style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "5px 10px",
          border: "1px solid var(--learn-border, #e5e7eb)",
          borderRadius: 999, background: "var(--learn-surface, #fff)",
          color: "var(--learn-ink, #f3f5f8)",
          fontWeight: 600, cursor: "pointer",
        }}
      >
        <PictureInPicture2 size={12} />
        Picture-in-picture
      </button>

      {canModerate && doubt.count > 0 ? (
        <span style={{
          marginLeft: "auto",
          display: "inline-flex", alignItems: "center", gap: 5,
          padding: "4px 10px",
          background: "rgba(244, 63, 94, 0.08)",
          color: "#be123c", borderRadius: 999, fontWeight: 700,
        }}>
          <Gauge size={11} /> {doubt.count} student{doubt.count === 1 ? "" : "s"} confused right now
        </span>
      ) : null}
    </div>
  );
}
