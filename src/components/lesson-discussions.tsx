import { useEffect, useState } from "react";
import { Loader2, MessageCircle, Send, HelpCircle, Trash2, Pin, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { getLmsToken } from "@/lib/lmsAuth";

const CRM_BASE = (import.meta.env.VITE_CRM_BASE as string | undefined) ?? "https://go.onrol.in";

interface Discussion {
  id: string;
  parent_id: string | null;
  author_kind: "learner" | "mentor" | "admin";
  author_display_name: string;
  kind: "discussion" | "question" | "answer" | "reply";
  body_md: string;
  is_resolved: boolean;
  is_pinned: boolean;
  created_at: string;
}

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d < 7 ? `${d}d ago` : new Date(iso).toLocaleDateString();
}

export function LessonDiscussions({ lessonId }: { lessonId: string }) {
  const [list, setList] = useState<Discussion[] | null>(null);
  const [draft, setDraft] = useState("");
  const [draftKind, setDraftKind] = useState<"discussion" | "question">("discussion");
  const [replyTo, setReplyTo] = useState<Discussion | null>(null);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const token = getLmsToken();
    if (!token) return;
    try {
      const r = await fetch(`${CRM_BASE}/api/lms/discussions?lessonId=${encodeURIComponent(lessonId)}`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "omit",
      });
      if (!r.ok) return;
      const body = await r.json() as { discussions: Discussion[] };
      setList(body.discussions);
    } catch { /* swallow */ }
  }
  useEffect(() => { void refresh(); }, [lessonId]);

  async function send() {
    if (!draft.trim()) return;
    setBusy(true);
    try {
      const r = await fetch(`${CRM_BASE}/api/lms/discussions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getLmsToken()}` },
        credentials: "omit",
        body: JSON.stringify({
          lessonId,
          bodyMd: draft,
          parentId: replyTo?.id ?? null,
          kind: replyTo ? undefined : draftKind,
        }),
      });
      if (!r.ok) throw new Error((await r.json()).message || "Post failed");
      setDraft("");
      setReplyTo(null);
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Post failed.");
    } finally {
      setBusy(false);
    }
  }

  async function deletePost(id: string) {
    if (!confirm("Delete this post?")) return;
    const r = await fetch(`${CRM_BASE}/api/lms/discussions?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${getLmsToken()}` },
      credentials: "omit",
    });
    if (r.ok) await refresh(); else toast.error("Couldn't delete.");
  }

  const topLevel = (list ?? []).filter((d) => !d.parent_id);
  const repliesByParent = new Map<string, Discussion[]>();
  for (const d of list ?? []) {
    if (d.parent_id) {
      const arr = repliesByParent.get(d.parent_id) ?? [];
      arr.push(d);
      repliesByParent.set(d.parent_id, arr);
    }
  }

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <header className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold inline-flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-orange-600" />
          Discussion & Q&A
          {list ? <span className="text-xs text-slate-500 font-normal">({list.length})</span> : null}
        </h3>
      </header>

      <div className="space-y-3 mb-4 max-h-[600px] overflow-y-auto">
        {list === null ? (
          <p className="text-xs text-slate-500"><Loader2 className="inline h-3 w-3 animate-spin" /> Loading…</p>
        ) : topLevel.length === 0 ? (
          <p className="text-sm text-slate-500 py-6 text-center">No discussion yet. Be the first to ask a question or share a thought.</p>
        ) : (
          topLevel.map((d) => {
            const replies = repliesByParent.get(d.id) ?? [];
            return (
              <article key={d.id} className="rounded-lg border border-slate-200 p-3">
                <PostBody d={d} onDelete={() => deletePost(d.id)} onReply={() => setReplyTo(d)} />
                {replies.length > 0 ? (
                  <div className="mt-3 ml-6 pl-3 border-l-2 border-slate-100 space-y-2">
                    {replies.map((r) => (
                      <PostBody key={r.id} d={r} onDelete={() => deletePost(r.id)} compact />
                    ))}
                  </div>
                ) : null}
              </article>
            );
          })
        )}
      </div>

      <div className="border-t border-slate-100 pt-3">
        {replyTo ? (
          <div className="mb-2 inline-flex items-center gap-2 text-xs bg-blue-50 text-orange-700 px-2 py-1 rounded">
            Replying to <strong>{replyTo.author_display_name}</strong>
            <button type="button" onClick={() => setReplyTo(null)} className="hover:underline">cancel</button>
          </div>
        ) : (
          <div className="mb-2 inline-flex gap-1">
            <button
              type="button"
              onClick={() => setDraftKind("discussion")}
              className={`px-2 py-1 text-xs rounded ${draftKind === "discussion" ? "bg-[#f3f5f8] text-white" : "bg-slate-100 text-slate-600"}`}
            >
              <MessageCircle className="inline h-3 w-3 mr-1" /> Discussion
            </button>
            <button
              type="button"
              onClick={() => setDraftKind("question")}
              className={`px-2 py-1 text-xs rounded ${draftKind === "question" ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-600"}`}
            >
              <HelpCircle className="inline h-3 w-3 mr-1" /> Question
            </button>
          </div>
        )}
        <textarea
          rows={3}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={replyTo ? "Write your reply…" : draftKind === "question" ? "Ask a question — mentors will answer." : "Share a thought, finding, or feedback."}
          className="w-full p-2 border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        />
        <div className="flex justify-end mt-2">
          <button
            type="button"
            onClick={send}
            disabled={busy || !draft.trim()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
            {busy ? "Posting…" : "Post"}
          </button>
        </div>
      </div>
    </section>
  );
}

function PostBody({ d, onDelete, onReply, compact }: {
  d: Discussion;
  onDelete?: () => void;
  onReply?: () => void;
  compact?: boolean;
}) {
  const kindColor = d.kind === "question" ? "text-amber-600" : d.kind === "answer" ? "text-emerald-600" : "text-slate-500";
  const roleBadge =
    d.author_kind === "mentor" ? "bg-purple-100 text-purple-700"
    : d.author_kind === "admin" ? "bg-blue-100 text-orange-700"
    : "bg-slate-100 text-slate-600";
  return (
    <div className={compact ? "" : ""}>
      <div className="flex items-center gap-2 mb-1">
        <span className={`inline-flex h-${compact ? "5" : "6"} w-${compact ? "5" : "6"} items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-purple-500 text-white text-xs font-semibold`}>
          {d.author_display_name.charAt(0).toUpperCase()}
        </span>
        <span className="text-sm font-semibold text-slate-900">{d.author_display_name}</span>
        <span className={`px-1.5 py-0.5 text-[10px] font-semibold uppercase rounded ${roleBadge}`}>{d.author_kind}</span>
        {d.is_pinned ? <Pin className="h-3 w-3 text-amber-500" /> : null}
        {d.is_resolved ? <CheckCircle2 className="h-3 w-3 text-emerald-600" /> : null}
        {d.kind === "question" || d.kind === "answer" ? (
          <span className={`text-[10px] font-semibold uppercase ${kindColor}`}>{d.kind}</span>
        ) : null}
        <span className="text-[11px] text-slate-400 ml-auto">{relTime(d.created_at)}</span>
      </div>
      <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{d.body_md}</p>
      {(onReply || onDelete) && !compact ? (
        <div className="flex gap-3 mt-2 text-xs">
          {onReply ? <button type="button" onClick={onReply} className="text-orange-600 hover:underline">Reply</button> : null}
          {onDelete ? <button type="button" onClick={onDelete} className="text-rose-600 hover:underline inline-flex items-center gap-1"><Trash2 className="h-3 w-3" /> Delete</button> : null}
        </div>
      ) : null}
    </div>
  );
}
