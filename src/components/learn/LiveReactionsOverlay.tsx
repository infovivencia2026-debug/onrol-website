import { useEffect, useRef, useState } from "react";
import { lmsListReactions, lmsPostReaction } from "@/lib/lmsClient";

/**
 * Floating-emoji reactions overlay. Sits absolutely-positioned over the
 * live player frame; learners tap an emoji at the bottom-right reaction
 * dock and the chosen emoji floats up. Other viewers see incoming
 * reactions via a 4s poll loop (capped to 60s window so reload doesn't
 * flood). Server-side validates against an allowlist of 8 emoji.
 */

const POLL_MS = 4_000;
const EMOJI: string[] = ["👏", "❤️", "🔥", "😂", "😮", "👍", "🎉", "💯"];

interface FloatingItem { id: string; emoji: string; left: number; }

export default function LiveReactionsOverlay({ sessionId, canEmit = true }: { sessionId: string; canEmit?: boolean }) {
  const [floaters, setFloaters] = useState<FloatingItem[]>([]);
  const seenRef = useRef<Set<number>>(new Set());

  // Spawn a floater either from local click or remote poll.
  function spawn(emoji: string) {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const left = 65 + Math.random() * 28; // 65–93% from left
    setFloaters((prev) => [...prev, { id, emoji, left }]);
    window.setTimeout(() => setFloaters((prev) => prev.filter((f) => f.id !== id)), 3200);
  }

  useEffect(() => {
    let cancelled = false;
    async function tick(initial: boolean) {
      if (!initial && document.visibilityState !== "visible") return;
      const incoming = await lmsListReactions(sessionId, 10);
      if (cancelled) return;
      // Render only reactions newer than the last seen id so we don't
      // re-spawn on every poll.
      const newOnes = incoming.filter((r) => !seenRef.current.has(r.id));
      for (const r of newOnes) {
        seenRef.current.add(r.id);
        spawn(r.emoji);
      }
      // Trim the seen set to the last 200 ids to bound memory.
      if (seenRef.current.size > 400) {
        const arr = Array.from(seenRef.current).slice(-200);
        seenRef.current = new Set(arr);
      }
    }
    void tick(true);
    const id = window.setInterval(() => void tick(false), POLL_MS);
    return () => { cancelled = true; window.clearInterval(id); };
  }, [sessionId]);

  async function emit(emoji: string) {
    // Optimistically spawn locally so the sender sees instant feedback.
    spawn(emoji);
    await lmsPostReaction(sessionId, emoji);
  }

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
      {floaters.map((f) => (
        <span
          key={f.id}
          style={{
            position: "absolute",
            left: `${f.left}%`, bottom: 8,
            fontSize: 28, animation: "live-react-float 3.1s ease-out forwards",
            filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.35))",
            userSelect: "none",
          }}
          aria-hidden
        >
          {f.emoji}
        </span>
      ))}
      {canEmit ? (
        <div style={{
          position: "absolute", right: 10, bottom: 10,
          display: "flex", gap: 4, padding: 6, borderRadius: 999,
          background: "rgba(0, 0, 0, 0.45)", backdropFilter: "blur(6px)",
          pointerEvents: "auto",
        }}>
          {EMOJI.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => void emit(e)}
              aria-label={`React ${e}`}
              style={{
                border: 0, background: "transparent", cursor: "pointer",
                width: 28, height: 28, padding: 0, fontSize: 17,
                borderRadius: 999, transition: "transform 120ms, background 120ms",
              }}
              onMouseEnter={(ev) => { (ev.currentTarget as HTMLButtonElement).style.transform = "scale(1.18)"; }}
              onMouseLeave={(ev) => { (ev.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
            >
              {e}
            </button>
          ))}
        </div>
      ) : null}
      <style>{`@keyframes live-react-float {
        0%   { transform: translateY(0) scale(0.8); opacity: 0; }
        12%  { opacity: 1; transform: translateY(-12px) scale(1); }
        80%  { opacity: 1; }
        100% { transform: translateY(-180px) scale(1.05); opacity: 0; }
      }`}</style>
    </div>
  );
}
