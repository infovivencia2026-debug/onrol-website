import { useEffect, useState, type FormEvent } from "react";
import { MessageSquare, Send, Trash2, CheckCircle2, Pin } from "lucide-react";
import { toast } from "sonner";
import { useLmsAuth } from "@/contexts/LmsAuthContext";
import {
  lmsListDiscussionsForLesson,
  lmsCreateDiscussionPost,
  lmsDeleteDiscussionPost,
  lmsGetLiveSessionForLesson,
  type LmsDiscussion,
} from "@/lib/lmsClient";

/**
 * Per-lesson discussion thread. Mentor-moderated: anyone enrolled can
 * post a question, only the author or staff can delete. Reads are
 * always gated by the auth-aware /api/lms/discussions endpoint.
 *
 * Layout:
 *   - Composer at top (textarea + Post)
 *   - List of top-level posts (pinned + most-recent-first), each with
 *     its inline replies and a one-tap Reply form.
 */
function initialsOf(name: string): string {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

function relTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function LessonDiscussionThread({ lessonId }: { lessonId: string }) {
  const { user } = useLmsAuth();
  const [posts, setPosts] = useState<LmsDiscussion[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [busy, setBusy] = useState(false);
  // Admin can disable comments per-lesson via the live-session panel.
  // Falls back to `enabled=true` when the lesson has no live session row
  // (most courses), so non-live lessons keep their discussion thread.
  const [commentsEnabled, setCommentsEnabled] = useState(true);

  useEffect(() => {
    if (!lessonId) return;
    let cancelled = false;
    (async () => {
      try {
        const sess = await lmsGetLiveSessionForLesson(lessonId);
        if (cancelled) return;
        if (sess && sess.comments_enabled === false) {
          setCommentsEnabled(false);
          setLoading(false);
          return;
        }
      } catch { /* ignore — default to enabled */ }
      const list = await lmsListDiscussionsForLesson(lessonId);
      if (!cancelled) { setPosts(list); setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [lessonId]);

  if (!commentsEnabled) {
    return (
      <div className="rounded-md border border-slate-200 dark:border-[#404040] bg-slate-50 dark:bg-[#1c1c1c] p-6 text-center text-sm text-slate-500">
        Discussion is disabled for this lesson by your administrator.
      </div>
    );
  }

  const tops = posts.filter((p) => !p.parent_id).sort((a, b) => {
    if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!body.trim() || busy) return;
    setBusy(true);
    try {
      const created = await lmsCreateDiscussionPost({ lessonId, bodyMd: body.trim() });
      if (created) setPosts((prev) => [created, ...prev]);
      setBody("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not post.");
    } finally {
      setBusy(false);
    }
  }

  async function submitReply(e: FormEvent, parentId: string) {
    e.preventDefault();
    if (!replyBody.trim() || busy) return;
    setBusy(true);
    try {
      const created = await lmsCreateDiscussionPost({ lessonId, bodyMd: replyBody.trim(), parentId });
      if (created) setPosts((prev) => [...prev, created]);
      setReplyBody("");
      setReplyTo(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not reply.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this post? This cannot be undone.")) return;
    const ok = await lmsDeleteDiscussionPost(id);
    if (ok) {
      // Optimistically hide both the post and its replies
      setPosts((prev) => prev.filter((p) => p.id !== id && p.parent_id !== id));
      toast.success("Deleted.");
    } else {
      toast.error("Could not delete.");
    }
  }

  return (
    <section style={{ marginTop: 18 }}>
      <header style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <MessageSquare size={16} style={{ color: "var(--learn-accent-2)" }} />
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, letterSpacing: "-0.01em" }}>
          Discussion
        </h3>
        <span className="muted" style={{ fontSize: 11.5, color: "var(--learn-muted)" }}>
          {tops.length} {tops.length === 1 ? "question" : "questions"}
        </span>
      </header>

      {/* Composer */}
      <form onSubmit={submit} className="learn-card" style={{ padding: 12 }}>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={user ? "Ask the mentor a question, or share what worked for you…" : "Sign in to post"}
          disabled={!user || busy}
          rows={3}
          style={{
            width: "100%",
            padding: "8px 10px",
            border: "1px solid var(--learn-line)",
            borderRadius: 8,
            background: "var(--learn-bg)",
            color: "var(--learn-ink)",
            fontSize: 13,
            fontFamily: "inherit",
            resize: "vertical",
            minHeight: 60,
          }}
        />
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
          <button
            type="submit"
            disabled={!user || !body.trim() || busy}
            className="filter-dropdown"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              width: "auto",
              color: "var(--learn-accent-2)",
              fontWeight: 600,
              opacity: !user || !body.trim() || busy ? 0.5 : 1,
              cursor: !user || !body.trim() || busy ? "not-allowed" : "pointer",
            }}
          >
            <Send size={12} /> {busy ? "Posting…" : "Post"}
          </button>
        </div>
      </form>

      {/* Thread */}
      {loading ? (
        <p className="muted" style={{ fontSize: 12, color: "var(--learn-muted)", marginTop: 14 }}>Loading…</p>
      ) : tops.length === 0 ? (
        <p className="muted" style={{ fontSize: 12, color: "var(--learn-muted)", marginTop: 14, textAlign: "center" }}>
          No questions yet — be the first to ask.
        </p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: "12px 0 0", display: "flex", flexDirection: "column", gap: 10 }}>
          {tops.map((p) => {
            const replies = posts
              .filter((r) => r.parent_id === p.id)
              .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
            const isMine = user?.id === p.author_external_id;
            const isStaff = p.author_kind === "mentor" || p.author_kind === "admin";
            return (
              <li key={p.id} className="learn-post" style={{ marginBottom: 0 }}>
                <div className="learn-post-head">
                  <span
                    className="learn-post-avatar"
                    style={{
                      background: isStaff
                        ? "linear-gradient(135deg, #6366f1, #4338ca)"
                        : undefined,
                    }}
                  >
                    {initialsOf(p.author_display_name)}
                  </span>
                  <div className="learn-post-meta">
                    <span className="learn-post-author">
                      {p.author_display_name}
                      {isStaff ? (
                        <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, color: "#4338ca", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                          {p.author_kind === "mentor" ? "Mentor" : "Staff"}
                        </span>
                      ) : null}
                    </span>
                    <span className="learn-post-when">{relTime(p.created_at)}</span>
                  </div>
                  {p.is_pinned ? (
                    <span className="learn-post-pin"><Pin size={10} style={{ display: "inline", marginRight: 3 }} />Pinned</span>
                  ) : null}
                  {p.is_resolved ? (
                    <span className="learn-post-pin" style={{ background: "rgba(22,163,74,0.12)", color: "#15803d" }}>
                      <CheckCircle2 size={10} style={{ display: "inline", marginRight: 3 }} />Resolved
                    </span>
                  ) : null}
                </div>
                <p className="learn-post-body">{p.body_md}</p>

                <div style={{ display: "flex", gap: 10, marginTop: 8, alignItems: "center" }}>
                  {user ? (
                    <button
                      type="button"
                      onClick={() => { setReplyTo(replyTo === p.id ? null : p.id); setReplyBody(""); }}
                      style={{ background: "none", border: 0, color: "var(--learn-muted)", fontSize: 12, cursor: "pointer", padding: 0 }}
                    >
                      Reply
                    </button>
                  ) : null}
                  {isMine ? (
                    <button
                      type="button"
                      onClick={() => remove(p.id)}
                      style={{ background: "none", border: 0, color: "#b91c1c", fontSize: 12, cursor: "pointer", padding: 0, display: "inline-flex", alignItems: "center", gap: 3 }}
                    >
                      <Trash2 size={10} /> Delete
                    </button>
                  ) : null}
                </div>

                {/* Replies */}
                {replies.length > 0 ? (
                  <ul style={{ listStyle: "none", padding: 0, margin: "10px 0 0 20px", borderLeft: "2px solid var(--learn-line)", display: "flex", flexDirection: "column", gap: 8 }}>
                    {replies.map((r) => {
                      const isReplyMine = user?.id === r.author_external_id;
                      const isReplyStaff = r.author_kind === "mentor" || r.author_kind === "admin";
                      return (
                        <li key={r.id} style={{ padding: "8px 12px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                            <span
                              className="learn-post-avatar"
                              style={{
                                width: 24,
                                height: 24,
                                fontSize: 10,
                                background: isReplyStaff ? "linear-gradient(135deg, #6366f1, #4338ca)" : undefined,
                              }}
                            >
                              {initialsOf(r.author_display_name)}
                            </span>
                            <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--learn-ink)" }}>
                              {r.author_display_name}
                            </span>
                            {isReplyStaff ? (
                              <span style={{ fontSize: 10, fontWeight: 700, color: "#4338ca", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                                {r.author_kind === "mentor" ? "Mentor" : "Staff"}
                              </span>
                            ) : null}
                            <span style={{ fontSize: 11, color: "var(--learn-muted)", marginLeft: "auto" }}>{relTime(r.created_at)}</span>
                            {isReplyMine ? (
                              <button
                                type="button"
                                onClick={() => remove(r.id)}
                                style={{ background: "none", border: 0, color: "#b91c1c", cursor: "pointer", padding: 0 }}
                                aria-label="Delete"
                              >
                                <Trash2 size={10} />
                              </button>
                            ) : null}
                          </div>
                          <p style={{ fontSize: 13, lineHeight: 1.5, color: "var(--learn-ink-2)", margin: 0, whiteSpace: "pre-wrap" }}>
                            {r.body_md}
                          </p>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}

                {replyTo === p.id ? (
                  <form onSubmit={(e) => submitReply(e, p.id)} style={{ marginTop: 10, marginLeft: 20 }}>
                    <textarea
                      value={replyBody}
                      onChange={(e) => setReplyBody(e.target.value)}
                      placeholder="Write a reply…"
                      autoFocus
                      rows={2}
                      style={{
                        width: "100%",
                        padding: "6px 8px",
                        border: "1px solid var(--learn-line)",
                        borderRadius: 6,
                        background: "var(--learn-bg)",
                        color: "var(--learn-ink)",
                        fontSize: 12.5,
                        fontFamily: "inherit",
                        resize: "vertical",
                        minHeight: 50,
                      }}
                    />
                    <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                      <button
                        type="submit"
                        disabled={!replyBody.trim() || busy}
                        className="filter-dropdown"
                        style={{
                          width: "auto",
                          color: "var(--learn-accent-2)",
                          fontWeight: 600,
                          opacity: !replyBody.trim() || busy ? 0.5 : 1,
                        }}
                      >
                        {busy ? "Posting…" : "Reply"}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setReplyTo(null); setReplyBody(""); }}
                        className="filter-dropdown"
                        style={{ width: "auto", color: "var(--learn-muted)" }}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
