import { useEffect, useRef, useState } from "react";
import { Bell, CheckCheck, Loader2, X } from "lucide-react";
import { Link } from "react-router-dom";
import { getLmsToken } from "@/lib/lmsAuth";

const CRM_BASE = (import.meta.env.VITE_CRM_BASE as string | undefined) ?? "https://go.onrol.in";

interface Notification {
  id: string;
  kind: string;
  title: string;
  body: string;
  link_href: string | null;
  is_read: boolean;
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
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

function kindIcon(kind: string): string {
  if (kind.includes("certificate")) return "🏆";
  if (kind.includes("assignment_graded")) return "✓";
  if (kind.includes("resubmit")) return "✎";
  if (kind.includes("enrollment")) return "🎉";
  if (kind.includes("live_session")) return "🎥";
  if (kind.includes("expiry")) return "⏰";
  if (kind.includes("announcement")) return "📢";
  if (kind.includes("mentor")) return "💬";
  return "•";
}

export function LearnNotificationsBell() {
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [list, setList] = useState<Notification[] | null>(null);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  async function refresh() {
    const token = getLmsToken();
    if (!token) return;
    try {
      const r = await fetch(`${CRM_BASE}/api/lms/notifications?limit=20`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "omit",
      });
      if (!r.ok) return;
      const body = await r.json() as { notifications: Notification[]; unreadCount: number };
      setList(body.notifications);
      setUnread(body.unreadCount);
    } catch { /* swallow */ }
  }

  useEffect(() => {
    void refresh();
    const id = window.setInterval(refresh, 30_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [open]);

  async function markAllRead() {
    setBusy(true);
    const token = getLmsToken();
    if (token) {
      await fetch(`${CRM_BASE}/api/lms/notifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        credentials: "omit",
        body: JSON.stringify({ all: true }),
      }).catch(() => null);
    }
    await refresh();
    setBusy(false);
  }

  async function markOneRead(id: string) {
    const token = getLmsToken();
    if (!token) return;
    await fetch(`${CRM_BASE}/api/lms/notifications`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      credentials: "omit",
      body: JSON.stringify({ ids: [id] }),
    }).catch(() => null);
    await refresh();
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white transition"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 ? (
          <span className="absolute -top-1 -right-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ff6a00] px-1 text-[10px] font-bold text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          className="absolute right-0 mt-2 w-[360px] max-h-[480px] flex flex-col rounded-2xl shadow-2xl z-50 overflow-hidden"
          role="dialog"
          style={{
            background: "#ffffff",
            border: "1px solid #e8eaf0",
            boxShadow: "0 24px 48px -12px rgba(15,23,42,0.20), 0 8px 16px -8px rgba(15,23,42,0.12)",
          }}
        >
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid #eef0f5" }}>
            <div>
              <p className="text-sm font-bold" style={{ color: "#0f172a", margin: 0 }}>Notifications</p>
              <p className="text-[11px]" style={{ color: "#64748b", margin: "2px 0 0" }}>{unread > 0 ? `${unread} unread` : "All caught up"}</p>
            </div>
            <div className="flex items-center gap-2">
              {unread > 0 ? (
                <button
                  type="button"
                  onClick={markAllRead}
                  disabled={busy}
                  className="text-[11px] inline-flex items-center gap-1 disabled:opacity-50"
                  style={{ color: "#c2410c", fontWeight: 600 }}
                >
                  {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCheck className="h-3 w-3" />}
                  Mark all read
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                style={{ color: "#64748b", background: "#f5f6fa", border: "none", borderRadius: 999, width: 26, height: 26, display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto" style={{ background: "#ffffff" }}>
            {list === null ? (
              <p className="text-center text-xs py-8" style={{ color: "#64748b" }}>Loading…</p>
            ) : list.length === 0 ? (
              <div className="text-center py-10 px-4">
                <div style={{ width: 56, height: 56, margin: "0 auto 12px", borderRadius: "50%", background: "#fff7ed", color: "#c2410c", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                  <Bell className="h-6 w-6" />
                </div>
                <p className="text-sm font-semibold" style={{ color: "#0f172a", margin: 0 }}>No notifications yet</p>
                <p className="text-[11.5px] mt-1" style={{ color: "#64748b" }}>We&apos;ll ping you when an assignment is graded, a certificate is issued, or a live session is starting.</p>
              </div>
            ) : (
              <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {list.map((n, idx) => {
                  const inner = (
                    <div
                      className="flex gap-3 px-4 py-3"
                      style={{
                        background: n.is_read ? "#ffffff" : "#fff7ed",
                        borderTop: idx === 0 ? "none" : "1px solid #eef0f5",
                      }}
                    >
                      <span className="text-lg leading-none mt-0.5">{kindIcon(n.kind)}</span>
                      <div className="flex-1 min-w-0">
                        <p className={"text-[13px] " + (n.is_read ? "" : "font-semibold")} style={{ color: "#0f172a", margin: 0 }}>{n.title}</p>
                        {n.body ? <p className="text-[12px] mt-0.5 line-clamp-2" style={{ color: "#475569", margin: "2px 0 0" }}>{n.body}</p> : null}
                        <p className="text-[10.5px] mt-1" style={{ color: "#94a3b8", margin: "4px 0 0" }}>{relTime(n.created_at)}</p>
                      </div>
                      {!n.is_read ? <span className="h-2 w-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: "#f2742a" }} /> : null}
                    </div>
                  );
                  return (
                    <li key={n.id}>
                      {n.link_href ? (
                        <Link to={n.link_href} onClick={() => { setOpen(false); void markOneRead(n.id); }} className="block" style={{ textDecoration: "none" }}>
                          {inner}
                        </Link>
                      ) : (
                        <button type="button" className="block w-full text-left" style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer" }} onClick={() => void markOneRead(n.id)}>
                          {inner}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
