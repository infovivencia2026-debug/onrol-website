// /community/admin/webinar — admin view of public form submissions.
//
// DEPRECATED as of Phase 2 of the Supabase → own-Postgres migration.
// New submissions land in the CRM `leads` table with source =
// "onrol.in/career-catalyst" / "onrol.in/win-convocation". Manage them
// at https://crm.onrol.in/leads (filter by source).
//
// This page still reads from the legacy Supabase tables and will simply
// show empty after the Phase 2 cleanup SQL runs. Kept around so historical
// rows remain visible until the cleanup is executed.

import { useEffect, useMemo, useState } from "react";
import { Loader2, Search, Download, Phone, Mail, Calendar, Trophy } from "lucide-react";
import AdminGate from "@/components/community/AdminGate";
import { CommunityLayout } from "@/components/community/CommunityLayout";
import { communitySupabase } from "@/lib/communitySupabase";

// ── Types ──────────────────────────────────────────────────────────────

interface WebinarRegistration {
  id: number;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  current_role: string | null;
  source: string | null;
  registered_at: string;
}

interface WinRegistration {
  id: number;
  first_name: string | null;
  last_name: string | null;
  father_name: string | null;
  mobile: string | null;
  email: string | null;
  occupation: string | null;
  source: string | null;
  registered_at: string;
}

interface VisitCount {
  page_path: string;
  total_visits: number;
  last_visit_at: string;
}

type TabId = "webinar" | "win";

// ── Component ──────────────────────────────────────────────────────────

export default function AdminWebinarRegistrations() {
  return (
    <AdminGate>
      <CommunityLayout>
        <Page />
      </CommunityLayout>
    </AdminGate>
  );
}

function Page() {
  const [tab, setTab] = useState<TabId>("webinar");
  const [webinarRegs, setWebinarRegs] = useState<WebinarRegistration[]>([]);
  const [winRegs, setWinRegs] = useState<WinRegistration[]>([]);
  const [visits, setVisits] = useState<VisitCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [w, n, v] = await Promise.all([
          communitySupabase
            .from("webinar_registrations")
            .select("id, full_name, phone, email, current_role, source, registered_at")
            .order("registered_at", { ascending: false })
            .limit(2000),
          communitySupabase
            .from("win_registrations")
            .select("id, first_name, last_name, father_name, mobile, email, occupation, source, registered_at")
            .order("registered_at", { ascending: false })
            .limit(2000),
          communitySupabase
            .from("landing_page_visit_counts")
            .select("page_path, total_visits, last_visit_at")
            .order("total_visits", { ascending: false }),
        ]);
        if (cancelled) return;
        if (w.error) throw w.error;
        if (n.error) throw n.error;
        if (v.error) throw v.error;
        setWebinarRegs((w.data ?? []) as WebinarRegistration[]);
        setWinRegs((n.data ?? []) as WinRegistration[]);
        setVisits((v.data ?? []) as VisitCount[]);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Reset search when switching tabs so you don't carry over a stale query
  // that hides everything in the other table.
  useEffect(() => {
    setQuery("");
  }, [tab]);

  const filteredWebinar = useMemo(() => {
    if (!query.trim()) return webinarRegs;
    const q = query.trim().toLowerCase();
    return webinarRegs.filter((r) =>
      [r.full_name, r.email, r.phone, r.current_role, r.source]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(q)),
    );
  }, [webinarRegs, query]);

  const filteredWin = useMemo(() => {
    if (!query.trim()) return winRegs;
    const q = query.trim().toLowerCase();
    return winRegs.filter((r) =>
      [r.first_name, r.last_name, r.father_name, r.email, r.mobile, r.occupation, r.source]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(q)),
    );
  }, [winRegs, query]);

  const exportCsv = () => {
    if (tab === "webinar") {
      const headers = ["Registered (UTC)", "Full Name", "Phone", "Email", "Role", "Source"];
      const rows = filteredWebinar.map((r) => [
        r.registered_at,
        r.full_name ?? "",
        r.phone ?? "",
        r.email ?? "",
        r.current_role ?? "",
        r.source ?? "",
      ]);
      downloadCsv("webinar-registrations", headers, rows);
    } else {
      const headers = ["Registered (UTC)", "First Name", "Last Name", "Father's Name", "Mobile", "Email", "Occupation", "Source"];
      const rows = filteredWin.map((r) => [
        r.registered_at,
        r.first_name ?? "",
        r.last_name ?? "",
        r.father_name ?? "",
        r.mobile ?? "",
        r.email ?? "",
        r.occupation ?? "",
        r.source ?? "",
      ]);
      downloadCsv("win-registrations", headers, rows);
    }
  };

  const activeCount = tab === "webinar" ? filteredWebinar.length : filteredWin.length;
  const totalCount = tab === "webinar" ? webinarRegs.length : winRegs.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[13px] text-zinc-400">
            {totalCount} total {tab === "webinar" ? "webinar" : "win"} registration{totalCount === 1 ? "" : "s"}
          </p>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          disabled={activeCount === 0}
          className="inline-flex items-center gap-1.5 rounded-md bg-orange-500 px-3 py-2 text-[12.5px] font-semibold text-white transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Download className="h-3.5 w-3.5" />
          Export CSV ({activeCount})
        </button>
      </div>

      {/* ── Visit counts ───────────────────────────────────────── */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-zinc-500">
            Landing page visits
          </h2>
          <p className="text-[11px] text-zinc-600">Hidden counter · fires once per page-load</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
          {visits.length === 0 ? (
            <div className="rounded-lg border border-white/[0.06] bg-[#232532] p-4 text-[13px] text-zinc-500">
              No visits recorded yet.
            </div>
          ) : (
            visits.map((v) => (
              <div key={v.page_path} className="rounded-lg border border-white/[0.06] bg-[#232532] p-4 transition hover:border-orange-500/30">
                <p className="truncate font-mono text-[11.5px] text-zinc-500" title={v.page_path}>
                  {v.page_path}
                </p>
                <p className="mt-1 text-[24px] font-extrabold text-zinc-100">
                  {v.total_visits.toLocaleString("en-IN")}
                </p>
                <p className="mt-0.5 text-[11px] text-zinc-600">
                  Last:{" "}
                  {new Date(v.last_visit_at).toLocaleString("en-IN", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </p>
              </div>
            ))
          )}
        </div>
      </section>

      {/* ── Tabs ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 border-b border-white/[0.06]">
        <TabButton
          active={tab === "webinar"}
          onClick={() => setTab("webinar")}
          icon={Calendar}
          label="Webinar"
          count={webinarRegs.length}
        />
        <TabButton
          active={tab === "win"}
          onClick={() => setTab("win")}
          icon={Trophy}
          label="Win (invite-only)"
          count={winRegs.length}
        />
      </div>

      {/* ── Search ────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 rounded-md border border-white/[0.06] bg-[#232532] px-3 py-2 focus-within:border-orange-500/60 focus-within:ring-2 focus-within:ring-orange-500/20">
        <Search className="h-3.5 w-3.5 text-zinc-500" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={tab === "webinar"
            ? "Search name / email / phone / role / source…"
            : "Search name / father's name / email / mobile / occupation…"
          }
          className="w-full bg-transparent text-[13.5px] text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
        />
      </div>

      {/* ── Table ─────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-lg border border-white/[0.06] bg-[#232532]">
        {loading ? (
          <div className="flex items-center justify-center gap-2 p-10 text-[13px] text-zinc-500">
            <Loader2 className="h-4 w-4 animate-spin text-orange-400" />
            Loading registrations…
          </div>
        ) : error ? (
          <div className="p-6 text-[13px] text-rose-300">
            Failed to load: {error}
          </div>
        ) : tab === "webinar" ? (
          <WebinarTable rows={filteredWebinar} totalRows={webinarRegs.length} />
        ) : (
          <WinTable rows={filteredWin} totalRows={winRegs.length} />
        )}
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────

function TabButton({
  active, onClick, icon: Icon, label, count,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative -mb-px flex items-center gap-1.5 rounded-t-md border-b-2 px-3.5 py-2.5 text-[13px] font-semibold transition ${
        active
          ? "border-orange-500 text-zinc-100"
          : "border-transparent text-zinc-500 hover:text-zinc-200"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      <span>{label}</span>
      <span
        className={`ml-1 rounded-full px-1.5 py-0.5 text-[10.5px] font-bold ${
          active ? "bg-orange-500/15 text-orange-300" : "bg-white/[0.06] text-zinc-500"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

function WebinarTable({ rows, totalRows }: { rows: WebinarRegistration[]; totalRows: number }) {
  if (rows.length === 0) {
    return (
      <div className="p-10 text-center text-[13px] text-zinc-500">
        {totalRows === 0 ? "No webinar registrations yet." : "No matches for that search."}
      </div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-[13px]">
        <thead className="border-b border-white/[0.06] bg-white/[0.02]">
          <tr className="text-[10.5px] font-bold uppercase tracking-wider text-zinc-500">
            <th className="px-4 py-3">When</th>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Phone</th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Role</th>
            <th className="px-4 py-3">Source</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-white/[0.04] last:border-b-0 transition hover:bg-white/[0.02]">
              <td className="whitespace-nowrap px-4 py-3 text-zinc-500">
                {fmtTs(r.registered_at)}
              </td>
              <td className="px-4 py-3 font-semibold text-zinc-100">{r.full_name ?? "—"}</td>
              <td className="whitespace-nowrap px-4 py-3 text-zinc-300">
                {r.phone ? (
                  <a href={`tel:${r.phone.replace(/\s+/g, "")}`} className="inline-flex items-center gap-1.5 hover:text-orange-300">
                    <Phone className="h-3 w-3 text-zinc-500" />
                    {r.phone}
                  </a>
                ) : "—"}
              </td>
              <td className="px-4 py-3 text-zinc-300">
                {r.email ? (
                  <a href={`mailto:${r.email}`} className="inline-flex items-center gap-1.5 hover:text-orange-300">
                    <Mail className="h-3 w-3 text-zinc-500" />
                    {r.email}
                  </a>
                ) : "—"}
              </td>
              <td className="px-4 py-3 text-zinc-400">{r.current_role ?? "—"}</td>
              <td className="px-4 py-3 text-zinc-500">{r.source ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function WinTable({ rows, totalRows }: { rows: WinRegistration[]; totalRows: number }) {
  if (rows.length === 0) {
    return (
      <div className="p-10 text-center text-[13px] text-zinc-500">
        {totalRows === 0 ? "No /win registrations yet." : "No matches for that search."}
      </div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-[13px]">
        <thead className="border-b border-white/[0.06] bg-white/[0.02]">
          <tr className="text-[10.5px] font-bold uppercase tracking-wider text-zinc-500">
            <th className="px-4 py-3">When</th>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Father's name</th>
            <th className="px-4 py-3">Mobile</th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Occupation</th>
            <th className="px-4 py-3">Source</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-white/[0.04] last:border-b-0 transition hover:bg-white/[0.02]">
              <td className="whitespace-nowrap px-4 py-3 text-zinc-500">
                {fmtTs(r.registered_at)}
              </td>
              <td className="px-4 py-3 font-semibold text-zinc-100">
                {[r.first_name, r.last_name].filter(Boolean).join(" ") || "—"}
              </td>
              <td className="px-4 py-3 text-zinc-300">{r.father_name ?? "—"}</td>
              <td className="whitespace-nowrap px-4 py-3 text-zinc-300">
                {r.mobile ? (
                  <a href={`tel:${r.mobile.replace(/\s+/g, "")}`} className="inline-flex items-center gap-1.5 hover:text-orange-300">
                    <Phone className="h-3 w-3 text-zinc-500" />
                    {r.mobile}
                  </a>
                ) : "—"}
              </td>
              <td className="px-4 py-3 text-zinc-300">
                {r.email ? (
                  <a href={`mailto:${r.email}`} className="inline-flex items-center gap-1.5 hover:text-orange-300">
                    <Mail className="h-3 w-3 text-zinc-500" />
                    {r.email}
                  </a>
                ) : "—"}
              </td>
              <td className="px-4 py-3 text-zinc-400">{r.occupation ?? "—"}</td>
              <td className="px-4 py-3 text-zinc-500">{r.source ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────

function fmtTs(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function downloadCsv(filenamePrefix: string, headers: string[], rows: (string | number)[][]) {
  const csv = [headers, ...rows]
    .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filenamePrefix}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
