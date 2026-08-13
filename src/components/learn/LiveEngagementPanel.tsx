import { useEffect, useMemo, useRef, useState } from "react";
import { MessageSquare, HelpCircle, Vote, Send, ChevronUp, CheckCircle2, Loader2, Plus, Pin, Trash2, Eye, X as XIcon, Hand, FileText, UserCircle, Sparkles, Gauge, Mic, Languages, Trophy, Code2, Star } from "lucide-react";
import {
  lmsListChat, lmsPostChat, lmsListPolls, lmsVotePoll, lmsListQa, lmsAskQa, lmsUpvoteQa,
  lmsGetLivePermissions, lmsDeleteChat, lmsPinChat,
  lmsLaunchPoll, lmsSetPollState, lmsAnswerQa, lmsPinQa,
  lmsListRaisedHands, lmsToggleRaiseHand, lmsCallOnHand,
  lmsGetLiveTranscript,
  lmsGetAlias, lmsSetAlias, lmsGetPace, lmsVotePace, lmsGetChatSummary,
  lmsTranslate, lmsGetLeaderboard,
  lmsListCodeShares, lmsPostCodeShare, lmsFeatureCodeShare,
  lmsListQaDrafts, lmsDraftQaAnswer, lmsApproveQaDraft,
  type LiveChatMessage, type LivePoll, type LiveQa, type RaisedHand,
  type LiveTranscriptPayload, type LiveTranscriptCue,
  type PaceVote, type PaceTally,
  type LeaderboardRow, type CodeShare, type QaDraft,
} from "@/lib/lmsClient";

/**
 * Engagement sidebar for a live lesson. Three tabs:
 *   - Chat: scrolling feed, send box, auto-poll new messages every 5s
 *   - Polls: render any open poll, click to vote; closed polls show results
 *   - Q&A: ask + upvote queue
 *
 * Polling intervals are intentionally polite — 5s for chat, 8s for polls,
 * 8s for Q&A. Pauses entirely when the tab is hidden.
 */

type Tab = "chat" | "polls" | "qa" | "hands" | "transcript" | "code" | "board";

interface Props {
  sessionId: string;
  displayName: string | null;
}

export default function LiveEngagementPanel({ sessionId, displayName }: Props) {
  const [tab, setTab] = useState<Tab>("chat");
  const [canModerate, setCanModerate] = useState(false);
  const [alias, setAliasLocal] = useState<string | null>(null);
  const [editingAlias, setEditingAlias] = useState(false);
  const [aliasDraft, setAliasDraft] = useState("");
  const [pace, setPace] = useState<PaceTally>({ slow: 0, perfect: 0, fast: 0, total: 0 });
  const [myPace, setMyPace] = useState<PaceVote | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [p, a] = await Promise.all([lmsGetLivePermissions(sessionId), lmsGetAlias(sessionId)]);
      if (cancelled) return;
      setCanModerate(p.canModerate);
      setAliasLocal(a);
      setAliasDraft(a ?? displayName ?? "");
    })();
    return () => { cancelled = true; };
  }, [sessionId, displayName]);

  // Pace tally poll — every 20s. Mentors see it as a gauge; learners as
  // tiny "247 think pace is right" so they know they're not alone.
  useEffect(() => {
    let cancelled = false;
    async function tick() {
      if (document.visibilityState !== "visible") return;
      const t = await lmsGetPace(sessionId);
      if (!cancelled) setPace(t);
    }
    void tick();
    const id = window.setInterval(tick, 20_000);
    return () => { cancelled = true; window.clearInterval(id); };
  }, [sessionId]);

  async function saveAlias() {
    const a = aliasDraft.trim();
    if (!a) return;
    const saved = await lmsSetAlias(sessionId, a);
    if (saved) setAliasLocal(saved);
    setEditingAlias(false);
  }

  async function vote(v: PaceVote) {
    setMyPace(v);
    await lmsVotePace(sessionId, v);
    // Re-poll immediately so the user sees the change reflected.
    const t = await lmsGetPace(sessionId);
    setPace(t);
  }

  const effectiveDisplay = alias || displayName || "Anonymous";

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      border: "1px solid var(--learn-border, #e5e7eb)",
      borderRadius: 10,
      background: "var(--learn-surface, #fff)",
      height: "100%", minHeight: 520, maxHeight: 640,
      overflow: "hidden",
    }}>
      <div role="tablist" style={{ display: "flex", borderBottom: "1px solid var(--learn-border, #e5e7eb)" }}>
        {([
          ["chat", <MessageSquare size={13} aria-hidden key="i" />, "Chat"],
          ["polls", <Vote size={13} aria-hidden key="i" />, "Polls"],
          ["qa", <HelpCircle size={13} aria-hidden key="i" />, "Q&A"],
          ["hands", <Hand size={13} aria-hidden key="i" />, "Hands"],
          ["transcript", <FileText size={13} aria-hidden key="i" />, "Transcript"],
          ["code", <Code2 size={13} aria-hidden key="i" />, "Code"],
          ["board", <Trophy size={13} aria-hidden key="i" />, "Board"],
        ] as const).map(([k, icon, label]) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            style={{
              flex: 1, padding: "10px 8px",
              border: 0,
              background: tab === k ? "rgba(234, 88, 12, 0.06)" : "transparent",
              color: tab === k ? "var(--learn-accent-2, #ea580c)" : "var(--learn-muted, #6b7280)",
              fontWeight: tab === k ? 700 : 500,
              fontSize: 12,
              cursor: "pointer",
              display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5,
              borderBottom: tab === k ? "2px solid var(--learn-accent-2, #ea580c)" : "2px solid transparent",
            }}
          >
            {icon} {label}
          </button>
        ))}
      </div>
      {/* Alias strip — shows what name appears in chat, click to change. */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "6px 12px",
        background: "rgba(0,0,0, 0.02)",
        borderBottom: "1px solid var(--learn-border, #e5e7eb)",
        fontSize: 11,
      }}>
        <UserCircle size={12} aria-hidden style={{ color: "var(--learn-muted, #6b7280)" }} />
        {editingAlias ? (
          <>
            <input
              value={aliasDraft}
              onChange={(e) => setAliasDraft(e.target.value)}
              maxLength={40}
              autoFocus
              style={{ flex: 1, padding: "2px 6px", fontSize: 11, border: "1px solid var(--learn-border, #e5e7eb)", borderRadius: 4 }}
            />
            <button type="button" onClick={saveAlias} style={{ border: 0, background: "var(--learn-accent-2, #ea580c)", color: "#fff", borderRadius: 4, padding: "2px 8px", fontSize: 11, cursor: "pointer" }}>Save</button>
            <button type="button" onClick={() => setEditingAlias(false)} style={{ border: 0, background: "transparent", color: "var(--learn-muted, #6b7280)", fontSize: 11, cursor: "pointer" }}>Cancel</button>
          </>
        ) : (
          <>
            <span style={{ flex: 1, color: "var(--learn-muted, #6b7280)" }}>
              Posting as <strong style={{ color: "var(--learn-ink, #f3f5f8)" }}>{effectiveDisplay}</strong>
            </span>
            <button type="button" onClick={() => { setEditingAlias(true); setAliasDraft(alias ?? displayName ?? ""); }} style={{ border: 0, background: "transparent", color: "var(--learn-accent-2, #ea580c)", cursor: "pointer", fontSize: 11 }}>
              Change name
            </button>
          </>
        )}
      </div>

      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
        {tab === "chat" ? <ChatTab sessionId={sessionId} displayName={effectiveDisplay} canModerate={canModerate} /> : null}
        {tab === "polls" ? <PollsTab sessionId={sessionId} canModerate={canModerate} /> : null}
        {tab === "qa" ? <QaTab sessionId={sessionId} displayName={effectiveDisplay} canModerate={canModerate} /> : null}
        {tab === "hands" ? <HandsTab sessionId={sessionId} displayName={effectiveDisplay} canModerate={canModerate} /> : null}
        {tab === "transcript" ? <TranscriptTab sessionId={sessionId} /> : null}
        {tab === "code" ? <CodeTab sessionId={sessionId} displayName={effectiveDisplay} canModerate={canModerate} /> : null}
        {tab === "board" ? <LeaderboardTab sessionId={sessionId} /> : null}
      </div>

      {/* Pace pulse — always-visible footer. Learners tap one of the three
          to signal pace; mentor sees the aggregate gauge. Last 90s window. */}
      <div style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "6px 10px",
        borderTop: "1px solid var(--learn-border, #e5e7eb)",
        background: "rgba(0,0,0, 0.02)",
      }}>
        <Gauge size={12} aria-hidden style={{ color: "var(--learn-muted, #6b7280)" }} />
        <span style={{ fontSize: 10.5, color: "var(--learn-muted, #6b7280)", textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 700 }}>Pace</span>
        {(["slow", "perfect", "fast"] as const).map((v) => {
          const count = pace[v] ?? 0;
          const pct = pace.total > 0 ? Math.round((count / pace.total) * 100) : 0;
          const active = myPace === v;
          const color = v === "slow" ? "#0369a1" : v === "perfect" ? "#15803d" : "#c2410c";
          return (
            <button
              key={v}
              type="button"
              onClick={() => vote(v)}
              title={`${v} · ${count} vote${count === 1 ? "" : "s"} (${pct}%)`}
              style={{
                flex: 1, padding: "4px 0",
                border: `1px solid ${active ? color : "var(--learn-border, #e5e7eb)"}`,
                background: active ? `${color}1f` : "var(--learn-surface, #fff)",
                color: active ? color : "var(--learn-ink, #f3f5f8)",
                borderRadius: 6, cursor: "pointer",
                fontSize: 11, fontWeight: 600,
                textTransform: "capitalize",
              }}
            >
              {v} {pace.total > 0 ? <span style={{ marginLeft: 3, color: "var(--learn-muted, #6b7280)", fontWeight: 400 }}>{pct}%</span> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Chat ────────────────────────────────────────────────────────────────

const CHAT_POLL_MS = 5_000;

function ChatTab({ sessionId, displayName, canModerate }: { sessionId: string; displayName: string | null; canModerate: boolean }) {
  const [messages, setMessages] = useState<LiveChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const sinceRef = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [summary, setSummary] = useState<{ bullets: string[]; loading: boolean; reason?: string }>({ bullets: [], loading: false });
  const [translateLang, setTranslateLang] = useState<string>("");      // "" = off
  const [translated, setTranslated] = useState<Record<string, string>>({});
  const [listening, setListening] = useState(false);
  const recogRef = useRef<unknown>(null);

  function toggleMic() {
    type SRType = new () => { lang: string; interimResults: boolean; continuous: boolean; onresult: (e: { results: ArrayLike<{ 0: { transcript: string } }> }) => void; onend: () => void; start: () => void; stop: () => void };
    const SR = ((window as unknown as { webkitSpeechRecognition?: SRType; SpeechRecognition?: SRType }).SpeechRecognition
      ?? (window as unknown as { webkitSpeechRecognition?: SRType }).webkitSpeechRecognition);
    if (!SR) {
      alert("Voice input isn't supported in this browser. Try Chrome on desktop or Android.");
      return;
    }
    if (listening && recogRef.current) {
      (recogRef.current as { stop: () => void }).stop();
      setListening(false);
      return;
    }
    const r = new SR();
    r.lang = "en-IN";
    r.interimResults = false;
    r.continuous = false;
    r.onresult = (e) => {
      const t = e.results[0]?.[0]?.transcript ?? "";
      if (t) setDraft((prev) => (prev ? prev + " " : "") + t);
    };
    r.onend = () => setListening(false);
    r.start();
    recogRef.current = r;
    setListening(true);
  }

  // Translate messages on demand when translateLang changes.
  useEffect(() => {
    if (!translateLang) { setTranslated({}); return; }
    let cancelled = false;
    (async () => {
      // Translate the most recent 50 messages we don't already have.
      const target = messages.slice(-50);
      for (const m of target) {
        if (cancelled) return;
        const key = `${m.id}:${translateLang}`;
        if (translated[key]) continue;
        const t = await lmsTranslate(sessionId, m.message, translateLang);
        if (cancelled) return;
        setTranslated((prev) => ({ ...prev, [key]: t }));
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [translateLang, messages.length]);

  async function fetchSummary() {
    setSummary({ bullets: [], loading: true });
    const s = await lmsGetChatSummary(sessionId);
    setSummary({ bullets: s.bullets, loading: false, reason: s.summaryReady ? undefined : (s.reason ?? "unavailable") });
    setShowSummary(true);
  }

  // Hydrate + poll. The `since` cursor is the createdAt of the latest
  // received message; the API filters server-side so each poll is small.
  useEffect(() => {
    let cancelled = false;
    async function tick(initial: boolean) {
      if (!initial && document.visibilityState !== "visible") return;
      const fresh = await lmsListChat(sessionId, sinceRef.current ?? undefined);
      if (cancelled || fresh.length === 0) return;
      sinceRef.current = fresh[fresh.length - 1].createdAt;
      setMessages((prev) => {
        const known = new Set(prev.map((m) => m.id));
        const merged = [...prev, ...fresh.filter((m) => !known.has(m.id))];
        return merged.slice(-200);
      });
    }
    void tick(true);
    const id = window.setInterval(() => void tick(false), CHAT_POLL_MS);
    return () => { cancelled = true; window.clearInterval(id); };
  }, [sessionId]);

  useEffect(() => {
    // Stick to bottom when new messages arrive (unless user scrolled up).
    const el = scrollRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    if (nearBottom) el.scrollTop = el.scrollHeight;
  }, [messages]);

  async function send() {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    const msg = await lmsPostChat(sessionId, text, displayName);
    if (msg) {
      setMessages((prev) => [...prev, msg]);
      sinceRef.current = msg.createdAt;
      setDraft("");
    }
    setSending(false);
  }

  return (
    <>
      <div style={{ padding: "6px 10px", borderBottom: "1px solid var(--learn-border, #e5e7eb)", display: "flex", gap: 6, alignItems: "center", justifyContent: "flex-end" }}>
        <Languages size={11} aria-hidden style={{ color: "var(--learn-muted, #6b7280)" }} />
        <select
          value={translateLang}
          onChange={(e) => setTranslateLang(e.target.value)}
          aria-label="Translate chat to"
          style={{ fontSize: 11, padding: "2px 4px", border: "1px solid var(--learn-border, #e5e7eb)", borderRadius: 4 }}
        >
          <option value="">Translate: off</option>
          <option value="en">English</option>
          <option value="hi">हिन्दी</option>
          <option value="te">తెలుగు</option>
          <option value="ta">தமிழ்</option>
          <option value="kn">ಕನ್ನಡ</option>
          <option value="ml">മലയാളം</option>
          <option value="bn">বাংলা</option>
          <option value="mr">मराठी</option>
          <option value="gu">ગુજરાતી</option>
        </select>
        <button
          type="button"
          onClick={fetchSummary}
          disabled={summary.loading}
          style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            padding: "3px 9px", border: "1px solid var(--learn-border, #e5e7eb)",
            borderRadius: 999, background: "rgba(168, 85, 247, 0.06)",
            color: "#7e22ce", fontSize: 11, fontWeight: 600, cursor: "pointer",
          }}
        >
          {summary.loading ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
          {summary.loading ? "Summarising…" : "Catch me up"}
        </button>
      </div>
      {showSummary && (summary.bullets.length > 0 || summary.reason) ? (
        <div style={{ padding: "10px 12px", background: "rgba(168, 85, 247, 0.04)", borderBottom: "1px solid var(--learn-border, #e5e7eb)", fontSize: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 6 }}>
            <Sparkles size={11} aria-hidden style={{ color: "#7e22ce" }} />
            <span style={{ fontWeight: 700, color: "#7e22ce", textTransform: "uppercase", letterSpacing: "0.04em", fontSize: 10 }}>Last 30 min — AI summary</span>
            <button type="button" onClick={() => setShowSummary(false)} style={{ marginLeft: "auto", border: 0, background: "transparent", color: "var(--learn-muted, #6b7280)", cursor: "pointer" }}><XIcon size={11} /></button>
          </div>
          {summary.bullets.length > 0 ? (
            <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.5 }}>
              {summary.bullets.map((b, i) => <li key={i} style={{ marginBottom: 3 }}>{b}</li>)}
            </ul>
          ) : (
            <p style={{ margin: 0, color: "var(--learn-muted, #6b7280)" }}>
              {summary.reason === "not-enough-chat" ? "Not much chat yet — check back after a few minutes." : "Summary unavailable right now. Try again shortly."}
            </p>
          )}
        </div>
      ) : null}
      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "10px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
        {messages.length === 0 ? (
          <p style={{ margin: 0, fontSize: 12, color: "var(--learn-muted, #6b7280)", textAlign: "center", padding: "20px 0" }}>
            No messages yet — be the first to say hi.
          </p>
        ) : (
          messages.map((m) => (
            <div key={m.id} style={{
              fontSize: 12.5, lineHeight: 1.4,
              paddingLeft: m.isPinned ? 8 : 0,
              borderLeft: m.isPinned ? "3px solid var(--learn-accent-2, #ea580c)" : undefined,
              display: "flex", gap: 6, alignItems: "flex-start",
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{
                  fontWeight: 700,
                  color: m.isModerator ? "var(--learn-accent-2, #ea580c)" : "var(--learn-ink, #f3f5f8)",
                  marginRight: 6,
                }}>
                  {m.displayName ?? "Anonymous"}{m.isModerator ? " ★" : ""}:
                </span>
                <span style={{ color: "var(--learn-ink, #f3f5f8)" }}>{m.message}</span>
                {translateLang && translated[`${m.id}:${translateLang}`] ? (
                  <div style={{
                    marginTop: 2, paddingLeft: 6,
                    borderLeft: "2px solid rgba(168, 85, 247, 0.3)",
                    color: "var(--learn-muted, #6b7280)", fontSize: 11.5,
                  }}>
                    {translated[`${m.id}:${translateLang}`]}
                  </div>
                ) : null}
              </div>
              {canModerate ? (
                <div style={{ display: "inline-flex", gap: 4, opacity: 0.6 }}>
                  <button
                    type="button"
                    onClick={async () => {
                      const ok = await lmsPinChat(sessionId, m.id, !m.isPinned);
                      if (ok) setMessages((prev) => prev.map((x) => x.id === m.id ? { ...x, isPinned: !x.isPinned } : x));
                    }}
                    title={m.isPinned ? "Unpin" : "Pin"}
                    style={{ border: 0, background: "transparent", cursor: "pointer", color: m.isPinned ? "var(--learn-accent-2, #ea580c)" : "var(--learn-muted, #6b7280)", padding: 2 }}
                  >
                    <Pin size={11} />
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      const ok = await lmsDeleteChat(sessionId, m.id);
                      if (ok) setMessages((prev) => prev.filter((x) => x.id !== m.id));
                    }}
                    title="Delete"
                    style={{ border: 0, background: "transparent", cursor: "pointer", color: "#dc2626", padding: 2 }}
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>
      <form
        onSubmit={(e) => { e.preventDefault(); void send(); }}
        style={{ display: "flex", gap: 6, padding: "8px 10px", borderTop: "1px solid var(--learn-border, #e5e7eb)" }}
      >
        <button
          type="button"
          onClick={toggleMic}
          aria-label={listening ? "Stop dictation" : "Dictate message"}
          title={listening ? "Listening… click to stop" : "Dictate (browser voice-to-text)"}
          style={{
            border: 0, borderRadius: 8, padding: "0 10px",
            background: listening ? "rgba(220, 38, 38, 0.12)" : "rgba(0,0,0, 0.05)",
            color: listening ? "#dc2626" : "var(--learn-muted, #6b7280)",
            cursor: "pointer",
          }}
        >
          <Mic size={14} />
        </button>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={listening ? "Listening…" : "Send a message…"}
          maxLength={500}
          style={{
            flex: 1, padding: "8px 10px",
            border: "1px solid var(--learn-border, #e5e7eb)",
            borderRadius: 8, fontSize: 12.5,
            background: "var(--learn-surface, #fff)", color: "var(--learn-ink, #f3f5f8)",
          }}
        />
        <button
          type="submit"
          disabled={sending || !draft.trim()}
          aria-label="Send"
          style={{
            border: 0, borderRadius: 8, padding: "0 12px",
            background: "var(--learn-accent-2, #ea580c)", color: "#fff",
            cursor: draft.trim() ? "pointer" : "default", opacity: draft.trim() ? 1 : 0.5,
          }}
        >
          <Send size={14} />
        </button>
      </form>
    </>
  );
}

// ── Polls ───────────────────────────────────────────────────────────────

const POLL_POLL_MS = 8_000;

function PollsTab({ sessionId, canModerate }: { sessionId: string; canModerate: boolean }) {
  const [polls, setPolls] = useState<LivePoll[]>([]);
  const [voting, setVoting] = useState<string | null>(null);
  const [showLauncher, setShowLauncher] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function tick(initial: boolean) {
      if (!initial && document.visibilityState !== "visible") return;
      const fresh = await lmsListPolls(sessionId);
      if (!cancelled) setPolls(fresh);
    }
    void tick(true);
    const id = window.setInterval(() => void tick(false), POLL_POLL_MS);
    return () => { cancelled = true; window.clearInterval(id); };
  }, [sessionId]);

  async function vote(pollId: string, choiceId: string) {
    setVoting(pollId);
    const ok = await lmsVotePoll(sessionId, pollId, choiceId);
    if (ok) {
      setPolls((prev) => prev.map((p) => p.id === pollId ? { ...p, myVote: choiceId } : p));
    }
    setVoting(null);
  }

  async function togglePoll(p: LivePoll, patch: { isOpen?: boolean; resultsVisible?: boolean }) {
    const ok = await lmsSetPollState(sessionId, p.id, patch);
    if (ok) setPolls((prev) => prev.map((x) => x.id === p.id ? { ...x, ...patch } : x));
  }

  return (
    <>
      {canModerate ? (
        <div style={{ padding: "8px 12px", borderBottom: "1px solid var(--learn-border, #e5e7eb)" }}>
          {showLauncher ? (
            <PollLauncher
              onCancel={() => setShowLauncher(false)}
              onCreated={(poll) => { setPolls((prev) => [...prev, poll]); setShowLauncher(false); }}
              sessionId={sessionId}
            />
          ) : (
            <button
              type="button"
              onClick={() => setShowLauncher(true)}
              style={{
                width: "100%", padding: "6px 10px",
                border: "1px dashed var(--learn-border, #e5e7eb)",
                borderRadius: 6, background: "transparent",
                cursor: "pointer", fontSize: 12, color: "var(--learn-muted, #6b7280)",
                display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5,
              }}
            >
              <Plus size={12} /> Launch a poll
            </button>
          )}
        </div>
      ) : null}
      {polls.length === 0 ? (
        <div style={{ padding: "20px 14px", textAlign: "center", fontSize: 12, color: "var(--learn-muted, #6b7280)" }}>
          No polls right now. {canModerate ? "Launch one above." : "The host can launch one any time."}
        </div>
      ) : (
        <PollsList
          polls={polls} voting={voting} canModerate={canModerate}
          onVote={vote} onTogglePoll={togglePoll}
        />
      )}
    </>
  );
}

function PollsList({
  polls, voting, canModerate, onVote, onTogglePoll,
}: {
  polls: LivePoll[]; voting: string | null; canModerate: boolean;
  onVote: (pollId: string, choiceId: string) => void;
  onTogglePoll: (p: LivePoll, patch: { isOpen?: boolean; resultsVisible?: boolean }) => void;
}) {
  if (polls.length === 0) return null;
  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "10px 12px", display: "flex", flexDirection: "column", gap: 14 }}>
      {polls.map((p) => {
        const showResults = !p.isOpen || p.resultsVisible || Boolean(p.myVote);
        const total = p.totalVotes ?? Object.values(p.results ?? {}).reduce((a, n) => a + n, 0);
        return (
          <div key={p.id} style={{ border: "1px solid var(--learn-border, #e5e7eb)", borderRadius: 8, padding: 10 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 8 }}>{p.question}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {p.choices.map((c) => {
                const myPick = p.myVote === c.id;
                const count = p.results?.[c.id] ?? 0;
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                if (showResults) {
                  return (
                    <div key={c.id} style={{
                      position: "relative",
                      padding: "6px 8px", borderRadius: 6,
                      background: "var(--learn-surface, #fff)",
                      border: `1px solid ${myPick ? "var(--learn-accent-2, #ea580c)" : "var(--learn-border, #e5e7eb)"}`,
                      overflow: "hidden",
                    }}>
                      <div style={{
                        position: "absolute", left: 0, top: 0, bottom: 0,
                        width: `${pct}%`,
                        background: myPick ? "rgba(234, 88, 12, 0.15)" : "rgba(0,0,0, 0.04)",
                      }} aria-hidden />
                      <div style={{ position: "relative", display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                        <span>{c.text}{myPick ? " ✓" : ""}</span>
                        <span style={{ fontWeight: 700 }}>{pct}% · {count}</span>
                      </div>
                    </div>
                  );
                }
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => onVote(p.id, c.id)}
                    disabled={voting === p.id || !p.isOpen}
                    style={{
                      textAlign: "left", padding: "6px 10px", borderRadius: 6,
                      background: "var(--learn-surface, #fff)",
                      border: "1px solid var(--learn-border, #e5e7eb)",
                      color: "var(--learn-ink, #f3f5f8)",
                      cursor: p.isOpen ? "pointer" : "default", fontSize: 12,
                    }}
                  >
                    {c.text}
                  </button>
                );
              })}
            </div>
            <div style={{ marginTop: 6, fontSize: 10.5, color: "var(--learn-muted, #6b7280)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>{p.isOpen ? "Open" : "Closed"} · {total} vote{total === 1 ? "" : "s"}</span>
              {canModerate ? (
                <span style={{ display: "inline-flex", gap: 6 }}>
                  <button
                    type="button"
                    onClick={() => onTogglePoll(p, { resultsVisible: !p.resultsVisible })}
                    style={{ border: 0, background: "transparent", cursor: "pointer", color: "var(--learn-muted, #6b7280)", display: "inline-flex", alignItems: "center", gap: 3, fontSize: 10.5 }}
                  >
                    <Eye size={11} /> {p.resultsVisible ? "Hide" : "Reveal"}
                  </button>
                  <button
                    type="button"
                    onClick={() => onTogglePoll(p, { isOpen: !p.isOpen })}
                    style={{ border: 0, background: "transparent", cursor: "pointer", color: p.isOpen ? "#dc2626" : "var(--ok, #15803d)", display: "inline-flex", alignItems: "center", gap: 3, fontSize: 10.5 }}
                  >
                    {p.isOpen ? <XIcon size={11} /> : <CheckCircle2 size={11} />} {p.isOpen ? "Close" : "Reopen"}
                  </button>
                </span>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PollLauncher({ sessionId, onCancel, onCreated }: { sessionId: string; onCancel: () => void; onCreated: (poll: LivePoll) => void }) {
  const [question, setQuestion] = useState("");
  const [choices, setChoices] = useState<string[]>(["", ""]);
  const [saving, setSaving] = useState(false);

  async function launch() {
    if (saving || !question.trim()) return;
    const valid = choices.map((c) => c.trim()).filter(Boolean);
    if (valid.length < 2) return;
    setSaving(true);
    const poll = await lmsLaunchPoll(sessionId, question.trim(), valid.map((text, i) => ({ id: String.fromCharCode(97 + i), text })));
    setSaving(false);
    if (poll) onCreated(poll);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <input
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Poll question"
        maxLength={280}
        style={{ padding: "6px 8px", border: "1px solid var(--learn-border, #e5e7eb)", borderRadius: 6, fontSize: 12 }}
      />
      {choices.map((c, i) => (
        <div key={i} style={{ display: "flex", gap: 4 }}>
          <input
            value={c}
            onChange={(e) => setChoices((prev) => prev.map((x, j) => j === i ? e.target.value : x))}
            placeholder={`Choice ${i + 1}`}
            style={{ flex: 1, padding: "5px 8px", border: "1px solid var(--learn-border, #e5e7eb)", borderRadius: 6, fontSize: 12 }}
          />
          {choices.length > 2 ? (
            <button
              type="button"
              onClick={() => setChoices((prev) => prev.filter((_, j) => j !== i))}
              style={{ border: 0, background: "transparent", color: "#dc2626", cursor: "pointer" }}
              aria-label="Remove choice"
            >
              <XIcon size={12} />
            </button>
          ) : null}
        </div>
      ))}
      <div style={{ display: "flex", gap: 6, justifyContent: "space-between" }}>
        <button
          type="button"
          onClick={() => setChoices((prev) => [...prev, ""])}
          style={{ border: "1px dashed var(--learn-border, #e5e7eb)", background: "transparent", borderRadius: 6, padding: "3px 8px", fontSize: 11, cursor: "pointer", color: "var(--learn-muted, #6b7280)" }}
        >
          + Choice
        </button>
        <div style={{ display: "inline-flex", gap: 6 }}>
          <button
            type="button"
            onClick={onCancel}
            style={{ border: 0, background: "transparent", color: "var(--learn-muted, #6b7280)", fontSize: 11.5, cursor: "pointer" }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={launch}
            disabled={saving || !question.trim() || choices.filter((c) => c.trim()).length < 2}
            style={{ background: "var(--learn-accent-2, #ea580c)", color: "#fff", border: 0, borderRadius: 6, padding: "4px 12px", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}
          >
            {saving ? "…" : "Launch"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Q&A ─────────────────────────────────────────────────────────────────

const QA_POLL_MS = 8_000;

function QaTab({ sessionId, displayName, canModerate }: { sessionId: string; displayName: string | null; canModerate: boolean }) {
  const [answering, setAnswering] = useState<{ id: string; text: string } | null>(null);
  const [qa, setQa] = useState<LiveQa[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function tick(initial: boolean) {
      if (!initial && document.visibilityState !== "visible") return;
      const fresh = await lmsListQa(sessionId);
      if (!cancelled) setQa(fresh);
    }
    void tick(true);
    const id = window.setInterval(() => void tick(false), QA_POLL_MS);
    return () => { cancelled = true; window.clearInterval(id); };
  }, [sessionId]);

  async function ask() {
    const q = draft.trim();
    if (!q || sending) return;
    setSending(true);
    const created = await lmsAskQa(sessionId, q, displayName);
    if (created) {
      setQa((prev) => [created, ...prev]);
      setDraft("");
    }
    setSending(false);
  }

  async function upvote(qaId: string) {
    // Optimistic
    setQa((prev) => prev.map((q) => q.id === qaId ? { ...q, myUpvoted: true, upvoteCount: q.upvoteCount + (q.myUpvoted ? 0 : 1) } : q));
    const count = await lmsUpvoteQa(sessionId, qaId);
    if (count !== null) {
      setQa((prev) => prev.map((q) => q.id === qaId ? { ...q, upvoteCount: count } : q));
    }
  }

  const sorted = useMemo(() => [...qa].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    if (a.upvoteCount !== b.upvoteCount) return b.upvoteCount - a.upvoteCount;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  }), [qa]);

  return (
    <>
      <div style={{ flex: 1, overflowY: "auto", padding: "10px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
        {sorted.length === 0 ? (
          <p style={{ margin: 0, fontSize: 12, color: "var(--learn-muted, #6b7280)", textAlign: "center", padding: "20px 0" }}>
            No questions yet — ask the first.
          </p>
        ) : (
          sorted.map((q) => (
            <div key={q.id} style={{
              padding: 10,
              border: "1px solid var(--learn-border, #e5e7eb)",
              borderRadius: 8,
              background: q.isPinned ? "rgba(234, 88, 12, 0.04)" : "var(--learn-surface, #fff)",
            }}>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => upvote(q.id)}
                  disabled={q.myUpvoted}
                  aria-label="Upvote"
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center",
                    border: `1px solid ${q.myUpvoted ? "var(--learn-accent-2, #ea580c)" : "var(--learn-border, #e5e7eb)"}`,
                    background: q.myUpvoted ? "rgba(234, 88, 12, 0.08)" : "var(--learn-surface, #fff)",
                    color: q.myUpvoted ? "var(--learn-accent-2, #ea580c)" : "var(--learn-muted, #6b7280)",
                    width: 36, padding: "4px 0", borderRadius: 6, cursor: q.myUpvoted ? "default" : "pointer",
                  }}
                >
                  <ChevronUp size={14} />
                  <span style={{ fontSize: 11, fontWeight: 700 }}>{q.upvoteCount}</span>
                </button>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, color: "var(--learn-ink, #f3f5f8)" }}>{q.question}</div>
                  <div style={{ fontSize: 10.5, color: "var(--learn-muted, #6b7280)", marginTop: 2 }}>
                    {q.displayName ?? "Anonymous"}
                    {q.isAnswered ? (
                      <span style={{ marginLeft: 6, color: "var(--ok, #15803d)" }}>
                        <CheckCircle2 size={10} style={{ verticalAlign: -1 }} /> answered
                      </span>
                    ) : null}
                  </div>
                  {q.isAnswered && q.answerText ? (
                    <div style={{
                      marginTop: 6, padding: 8,
                      background: "rgba(0,0,0, 0.04)",
                      borderRadius: 6, fontSize: 12, lineHeight: 1.45,
                    }}>
                      <strong>Host:</strong> {q.answerText}
                    </div>
                  ) : null}
                  {canModerate ? (
                    <div style={{ marginTop: 6, display: "inline-flex", gap: 6 }}>
                      <button
                        type="button"
                        onClick={() => setAnswering({ id: q.id, text: q.answerText ?? "" })}
                        style={{ border: 0, background: "transparent", color: "var(--learn-accent-2, #ea580c)", cursor: "pointer", fontSize: 11, fontWeight: 700 }}
                      >
                        {q.isAnswered ? "Edit answer" : "Answer"}
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          const ok = await lmsPinQa(sessionId, q.id, !q.isPinned);
                          if (ok) setQa((prev) => prev.map((x) => x.id === q.id ? { ...x, isPinned: !x.isPinned } : x));
                        }}
                        style={{ border: 0, background: "transparent", color: q.isPinned ? "var(--learn-accent-2, #ea580c)" : "var(--learn-muted, #6b7280)", cursor: "pointer", fontSize: 11 }}
                      >
                        {q.isPinned ? "Unpin" : "Pin"}
                      </button>
                    </div>
                  ) : null}
                  {canModerate && answering?.id === q.id ? (
                    <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 4 }}>
                      <textarea
                        value={answering.text}
                        onChange={(e) => setAnswering({ id: q.id, text: e.target.value })}
                        rows={2}
                        placeholder="Type the host answer…"
                        style={{ padding: "5px 8px", border: "1px solid var(--learn-border, #e5e7eb)", borderRadius: 6, fontSize: 12, resize: "vertical" }}
                      />
                      <div style={{ display: "inline-flex", gap: 6, justifyContent: "flex-end" }}>
                        <button type="button" onClick={() => setAnswering(null)} style={{ border: 0, background: "transparent", color: "var(--learn-muted, #6b7280)", fontSize: 11, cursor: "pointer" }}>Cancel</button>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!answering.text.trim()) return;
                            const ok = await lmsAnswerQa(sessionId, q.id, answering.text);
                            if (ok) {
                              setQa((prev) => prev.map((x) => x.id === q.id ? { ...x, isAnswered: true, answerText: answering.text } : x));
                              setAnswering(null);
                            }
                          }}
                          style={{ background: "var(--learn-accent-2, #ea580c)", color: "#fff", border: 0, borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                        >
                          Save answer
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      <form
        onSubmit={(e) => { e.preventDefault(); void ask(); }}
        style={{ display: "flex", gap: 6, padding: "8px 10px", borderTop: "1px solid var(--learn-border, #e5e7eb)" }}
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Ask a question…"
          maxLength={500}
          style={{
            flex: 1, padding: "8px 10px",
            border: "1px solid var(--learn-border, #e5e7eb)",
            borderRadius: 8, fontSize: 12.5,
            background: "var(--learn-surface, #fff)", color: "var(--learn-ink, #f3f5f8)",
          }}
        />
        <button
          type="submit"
          disabled={sending || !draft.trim()}
          style={{
            border: 0, borderRadius: 8, padding: "0 14px",
            background: "var(--learn-accent-2, #ea580c)", color: "#fff",
            fontSize: 12, fontWeight: 700,
            cursor: draft.trim() ? "pointer" : "default", opacity: draft.trim() ? 1 : 0.5,
          }}
        >
          {sending ? <Loader2 size={12} className="animate-spin" /> : "Ask"}
        </button>
      </form>
    </>
  );
}

// ── Hands queue ─────────────────────────────────────────────────────────

const HANDS_POLL_MS = 6_000;

function HandsTab({ sessionId, displayName, canModerate }: { sessionId: string; displayName: string | null; canModerate: boolean }) {
  const [hands, setHands] = useState<RaisedHand[]>([]);
  const [myRaised, setMyRaised] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function tick(initial: boolean) {
      if (!initial && document.visibilityState !== "visible") return;
      const data = await lmsListRaisedHands(sessionId);
      if (cancelled) return;
      if (canModerate && data.hands) {
        setHands(data.hands);
        setMyRaised(false);
      } else {
        setMyRaised(Boolean(data.raised));
      }
    }
    void tick(true);
    const id = window.setInterval(() => void tick(false), HANDS_POLL_MS);
    return () => { cancelled = true; window.clearInterval(id); };
  }, [sessionId, canModerate]);

  async function toggle() {
    setBusy(true);
    const ok = await lmsToggleRaiseHand(sessionId, !myRaised, displayName);
    if (ok) setMyRaised((v) => !v);
    setBusy(false);
  }

  async function callOn(uid: string) {
    const ok = await lmsCallOnHand(sessionId, uid);
    if (ok) setHands((prev) => prev.filter((h) => h.userExternalId !== uid));
  }

  if (!canModerate) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20, gap: 12 }}>
        <Hand size={28} aria-hidden style={{ color: myRaised ? "var(--learn-accent-2, #ea580c)" : "var(--learn-muted, #6b7280)" }} />
        <p style={{ margin: 0, fontSize: 12.5, color: "var(--learn-muted, #6b7280)", textAlign: "center", maxWidth: 240 }}>
          {myRaised ? "Your hand is up — the host can see it." : "Raise your hand to ask the host to call on you."}
        </p>
        <button
          type="button"
          onClick={toggle}
          disabled={busy}
          style={{
            padding: "8px 16px",
            background: myRaised ? "var(--learn-muted, #6b7280)" : "var(--learn-accent-2, #ea580c)",
            color: "#fff", border: 0, borderRadius: 8,
            fontSize: 12.5, fontWeight: 700, cursor: "pointer",
            display: "inline-flex", alignItems: "center", gap: 6,
          }}
        >
          <Hand size={13} /> {myRaised ? "Lower hand" : "Raise hand"}
        </button>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "10px 12px" }}>
      <p style={{ margin: "0 0 8px", fontSize: 11, color: "var(--learn-muted, #6b7280)", textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 700 }}>
        Raised hands ({hands.length})
      </p>
      {hands.length === 0 ? (
        <p style={{ margin: 0, fontSize: 12, color: "var(--learn-muted, #6b7280)", textAlign: "center", padding: "20px 0" }}>
          Nobody has their hand up. They&apos;ll appear here in order.
        </p>
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 6 }}>
          {hands.map((h, i) => {
            const ago = Math.max(0, Math.round((Date.now() - new Date(h.raisedAt).getTime()) / 1000));
            return (
              <li key={h.userExternalId} style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "8px 10px", borderRadius: 8,
                border: "1px solid var(--learn-border, #e5e7eb)",
                background: "var(--learn-surface, #fff)",
              }}>
                <span style={{ width: 22, textAlign: "center", fontWeight: 700, color: "var(--learn-muted, #6b7280)" }}>{i + 1}.</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {h.displayName ?? "Anonymous"}
                  </div>
                  <div style={{ fontSize: 10.5, color: "var(--learn-muted, #6b7280)" }}>
                    waiting {ago < 60 ? `${ago}s` : `${Math.round(ago / 60)}m`}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void callOn(h.userExternalId)}
                  style={{
                    border: 0, background: "var(--learn-accent-2, #ea580c)", color: "#fff",
                    borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer",
                  }}
                >
                  Called on
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ── Transcript reader ─────────────────────────────────────────────────────

const TRANSCRIPT_PROCESSING_POLL_MS = 12_000;

function fmtTimecode(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m < 60) return `${m}:${r.toString().padStart(2, "0")}`;
  const h = Math.floor(m / 60);
  return `${h}:${(m % 60).toString().padStart(2, "0")}:${r.toString().padStart(2, "0")}`;
}

function TranscriptTab({ sessionId }: { sessionId: string }) {
  const [payload, setPayload] = useState<LiveTranscriptPayload | null>(null);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function tick() {
      const fresh = await lmsGetLiveTranscript(sessionId);
      if (cancelled) return;
      setPayload(fresh);
      // Stop polling once status reaches a terminal state.
      return fresh.status === "ready" || fresh.status === "error" || fresh.status === "none";
    }
    let id: number | null = null;
    void (async () => {
      const done = await tick();
      if (done) return;
      id = window.setInterval(async () => {
        if (document.visibilityState !== "visible") return;
        const done = await tick();
        if (done && id !== null) { window.clearInterval(id); id = null; }
      }, TRANSCRIPT_PROCESSING_POLL_MS);
    })();
    return () => { cancelled = true; if (id !== null) window.clearInterval(id); };
  }, [sessionId]);

  const cues: LiveTranscriptCue[] = payload?.cues ?? [];
  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return cues;
    return cues.filter((c) => c.text.toLowerCase().includes(q));
  }, [cues, filter]);

  function jumpTo(sec: number) {
    // Bunny iframe doesn't expose a postMessage seek API on the embed
    // player URL we use. The pragmatic UX: deep-link the embed with a
    // `t=` query so a fresh load starts at the cue. Browsers may block
    // seeking on autoplay-without-interaction; user clicked a cue so
    // that's a gesture and works on iOS too.
    const iframe = document.querySelector("iframe[src*='iframe.mediadelivery.net']") as HTMLIFrameElement | null;
    if (!iframe) return;
    try {
      const url = new URL(iframe.src);
      url.searchParams.set("t", String(Math.floor(sec)));
      iframe.src = url.toString();
    } catch { /* swallow */ }
  }

  if (!payload || payload.status === "none") {
    return (
      <div style={{ padding: "20px 14px", textAlign: "center", fontSize: 12, color: "var(--learn-muted, #6b7280)" }}>
        Transcript will appear here once the recording is processed.
      </div>
    );
  }
  if (payload.status === "requested" || payload.status === "processing") {
    return (
      <div style={{ padding: "20px 14px", textAlign: "center", fontSize: 12, color: "var(--learn-muted, #6b7280)", display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
        <Loader2 size={20} className="animate-spin" />
        Transcribing the recording… usually ~1-3 minutes after the broadcast ends. This refreshes automatically.
      </div>
    );
  }
  if (payload.status === "error" || !cues.length) {
    return (
      <div style={{ padding: "20px 14px", textAlign: "center", fontSize: 12, color: "var(--learn-muted, #6b7280)" }}>
        Transcript isn&apos;t available for this session.
      </div>
    );
  }

  return (
    <>
      <div style={{ padding: "8px 10px", borderBottom: "1px solid var(--learn-border, #e5e7eb)" }}>
        <input
          type="search"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder={`Search ${cues.length} cues…`}
          style={{
            width: "100%", padding: "6px 10px",
            border: "1px solid var(--learn-border, #e5e7eb)",
            borderRadius: 6, fontSize: 12.5,
            background: "var(--learn-surface, #fff)", color: "var(--learn-ink, #f3f5f8)",
          }}
        />
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "10px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
        {filtered.length === 0 ? (
          <p style={{ margin: 0, fontSize: 12, color: "var(--learn-muted, #6b7280)", textAlign: "center", padding: "20px 0" }}>
            No matches for &ldquo;{filter}&rdquo;.
          </p>
        ) : (
          filtered.map((c, i) => (
            <button
              key={`${c.start}:${i}`}
              type="button"
              onClick={() => jumpTo(c.start)}
              style={{
                textAlign: "left", border: 0, background: "transparent",
                cursor: "pointer", padding: "4px 0",
                display: "grid", gridTemplateColumns: "44px 1fr", gap: 8,
                color: "var(--learn-ink, #f3f5f8)", fontSize: 12.5, lineHeight: 1.45,
              }}
            >
              <span style={{
                color: "var(--learn-accent-2, #ea580c)", fontWeight: 700,
                fontVariantNumeric: "tabular-nums", fontSize: 11,
              }}>{fmtTimecode(c.start)}</span>
              <span>{c.text}</span>
            </button>
          ))
        )}
      </div>
      {payload.url ? (
        <a
          href={payload.url}
          download
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "block", textAlign: "center",
            padding: "6px 0", borderTop: "1px solid var(--learn-border, #e5e7eb)",
            fontSize: 11, color: "var(--learn-muted, #6b7280)", textDecoration: "none",
          }}
        >
          Download .vtt
        </a>
      ) : null}
    </>
  );
}

// ── Code-share tab ──────────────────────────────────────────────────────

const CODE_LANGS = ["plaintext", "javascript", "typescript", "python", "java", "go", "rust", "sql", "html", "css", "json", "yaml", "bash", "markdown"];
const CODE_POLL_MS = 10_000;

function CodeTab({ sessionId, displayName, canModerate }: { sessionId: string; displayName: string | null; canModerate: boolean }) {
  const [shares, setShares] = useState<CodeShare[]>([]);
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState("");
  const [lang, setLang] = useState("plaintext");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function tick(initial: boolean) {
      if (!initial && document.visibilityState !== "visible") return;
      const list = await lmsListCodeShares(sessionId);
      if (!cancelled) setShares(list);
    }
    void tick(true);
    const id = window.setInterval(() => void tick(false), CODE_POLL_MS);
    return () => { cancelled = true; window.clearInterval(id); };
  }, [sessionId]);

  async function post() {
    if (!draft.trim() || busy) return;
    setBusy(true);
    const s = await lmsPostCodeShare(sessionId, draft, lang, displayName);
    if (s) {
      setShares((prev) => [s, ...prev]);
      setDraft(""); setComposing(false);
    }
    setBusy(false);
  }
  async function feature(id: string, featured: boolean) {
    await lmsFeatureCodeShare(sessionId, id, featured);
    setShares((prev) => prev.map((s) => s.id === id ? { ...s, isFeatured: featured } : s));
  }

  return (
    <>
      <div style={{ padding: "8px 10px", borderBottom: "1px solid var(--learn-border, #e5e7eb)" }}>
        {composing ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", gap: 6 }}>
              <select value={lang} onChange={(e) => setLang(e.target.value)} style={{ fontSize: 11, padding: "2px 4px", border: "1px solid var(--learn-border, #e5e7eb)", borderRadius: 4 }}>
                {CODE_LANGS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
              <button type="button" onClick={() => setComposing(false)} style={{ marginLeft: "auto", border: 0, background: "transparent", color: "var(--learn-muted, #6b7280)", fontSize: 11, cursor: "pointer" }}>Cancel</button>
            </div>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Paste your code here…"
              rows={6}
              spellCheck={false}
              style={{ fontFamily: "ui-monospace, Menlo, monospace", fontSize: 11.5, padding: 8, border: "1px solid var(--learn-border, #e5e7eb)", borderRadius: 6, resize: "vertical" }}
            />
            <button type="button" onClick={post} disabled={busy || !draft.trim()} style={{ background: "var(--learn-accent-2, #ea580c)", color: "#fff", border: 0, borderRadius: 6, padding: "5px 14px", fontSize: 11.5, fontWeight: 700, cursor: "pointer", alignSelf: "flex-end" }}>
              {busy ? "Posting…" : "Share"}
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => setComposing(true)} style={{ width: "100%", padding: "6px 10px", border: "1px dashed var(--learn-border, #e5e7eb)", borderRadius: 6, background: "transparent", cursor: "pointer", fontSize: 12, color: "var(--learn-muted, #6b7280)", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
            <Plus size={12} /> Share code snippet
          </button>
        )}
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 10px", display: "flex", flexDirection: "column", gap: 6 }}>
        {shares.length === 0 ? (
          <p style={{ margin: 0, fontSize: 12, color: "var(--learn-muted, #6b7280)", textAlign: "center", padding: "20px 0" }}>
            No code shared yet. Be the first.
          </p>
        ) : (
          shares.map((s) => (
            <div key={s.id} style={{
              padding: 8, borderRadius: 6,
              border: "1px solid var(--learn-border, #e5e7eb)",
              background: s.isFeatured ? "rgba(234, 88, 12, 0.05)" : "var(--learn-surface, #fff)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--learn-muted, #6b7280)", marginBottom: 4 }}>
                <strong style={{ color: "var(--learn-ink, #f3f5f8)" }}>{s.displayName ?? "Anonymous"}</strong>
                <span style={{ padding: "1px 6px", background: "rgba(0,0,0, 0.06)", borderRadius: 4, fontFamily: "ui-monospace, monospace", fontSize: 10 }}>{s.language}</span>
                {canModerate ? (
                  <button type="button" onClick={() => feature(s.id, !s.isFeatured)} style={{ marginLeft: "auto", border: 0, background: "transparent", color: s.isFeatured ? "var(--learn-accent-2, #ea580c)" : "var(--learn-muted, #6b7280)", cursor: "pointer", fontSize: 11, display: "inline-flex", alignItems: "center", gap: 3 }}>
                    <Star size={10} /> {s.isFeatured ? "Featured" : "Feature"}
                  </button>
                ) : s.isFeatured ? (
                  <span style={{ marginLeft: "auto", color: "var(--learn-accent-2, #ea580c)", fontSize: 10, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 3 }}>
                    <Star size={10} /> FEATURED
                  </span>
                ) : null}
              </div>
              <pre style={{
                margin: 0, padding: 8,
                background: "rgba(0,0,0, 0.04)",
                borderRadius: 4,
                fontFamily: "ui-monospace, Menlo, monospace",
                fontSize: 11, lineHeight: 1.45,
                overflowX: "auto",
                whiteSpace: "pre",
              }}><code>{s.code}</code></pre>
            </div>
          ))
        )}
      </div>
    </>
  );
}

// ── Leaderboard tab ─────────────────────────────────────────────────────

const BOARD_POLL_MS = 30_000;

function LeaderboardTab({ sessionId }: { sessionId: string }) {
  const [board, setBoard] = useState<LeaderboardRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function tick(initial: boolean) {
      if (!initial && document.visibilityState !== "visible") return;
      const rows = await lmsGetLeaderboard(sessionId, 20);
      if (!cancelled) setBoard(rows);
    }
    void tick(true);
    const id = window.setInterval(() => void tick(false), BOARD_POLL_MS);
    return () => { cancelled = true; window.clearInterval(id); };
  }, [sessionId]);

  if (board.length === 0) {
    return (
      <div style={{ padding: "20px 14px", textAlign: "center", fontSize: 12, color: "var(--learn-muted, #6b7280)" }}>
        No engagement yet. Once people start chatting / asking / reacting, points show here.
      </div>
    );
  }
  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "10px 12px" }}>
      <p style={{ margin: "0 0 8px", fontSize: 11, color: "var(--learn-muted, #6b7280)" }}>
        Points: <strong>chat 1</strong> · <strong>question 3</strong> · <strong>answered 5</strong> · <strong>upvote 2</strong> · <strong>poll 1</strong> · <strong>reaction 1</strong>
      </p>
      <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 4 }}>
        {board.map((row, i) => (
          <li key={row.userExternalId} style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "6px 10px", borderRadius: 6,
            background: i < 3 ? "rgba(234, 179, 8, 0.06)" : "var(--learn-surface, #fff)",
            border: `1px solid ${i < 3 ? "rgba(234, 179, 8, 0.3)" : "var(--learn-border, #e5e7eb)"}`,
          }}>
            <span style={{
              width: 22, height: 22, borderRadius: 999,
              background: i === 0 ? "#facc15" : i === 1 ? "#cbd5e1" : i === 2 ? "#fdba74" : "rgba(0,0,0, 0.06)",
              color: i < 3 ? "#f3f5f8" : "var(--learn-muted, #6b7280)",
              fontSize: 11, fontWeight: 800,
              display: "inline-flex", alignItems: "center", justifyContent: "center",
            }}>{i + 1}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {row.displayName ?? "Anonymous"}
              </div>
              <div style={{ fontSize: 10, color: "var(--learn-muted, #6b7280)" }}>
                {row.chatCount} chat · {row.questionsAsked} Q · {row.questionsAnswered} A · {row.upvotesReceived} ▲ · {row.reactionsSent} 🎉
              </div>
            </div>
            <span style={{ fontSize: 14, fontWeight: 800, color: "var(--learn-accent-2, #ea580c)" }}>
              {row.totalPoints}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
