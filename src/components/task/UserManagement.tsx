import React, { useState, useMemo, useCallback } from "react";
import { Users, Edit3, Check, X, Power, Shield, RotateCcw, AlertTriangle, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { tmGetOfficeUserByEmail, tmUpsertOfficeUser, tmUpdateTask } from "@/lib/tmClient";
import { msgRemoveUserFromAllConversations } from "@/lib/messengerClient";
import type { OfficeUser, OfficeTask, Role } from "@/types/taskManager";

interface UserManagementProps {
  uiTheme: "dark" | "light";
  officeUser: OfficeUser;
  teamMembers: OfficeUser[];
  tasks: OfficeTask[];
  refreshTasks: () => Promise<void>;
}

type DraftEdit = { id: string; full_name: string; role: Role; department: string };

const UserManagement: React.FC<UserManagementProps> = ({
  uiTheme, officeUser, teamMembers, tasks, refreshTasks,
}) => {
  const dark = uiTheme === "dark";
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [editing, setEditing] = useState<DraftEdit | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reassignFor, setReassignFor] = useState<{ user: OfficeUser; openTasks: OfficeTask[] } | null>(null);
  const [reassignTo, setReassignTo] = useState<string>("");
  // New-user creation modal state.
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState<{ full_name: string; email: string; role: Role; department: string; phone: string }>({
    full_name: "", email: "", role: "member" as Role, department: "", phone: "",
  });
  const [creating, setCreating] = useState(false);

  const createUser = useCallback(async () => {
    const email = newUser.email.trim().toLowerCase();
    const name = newUser.full_name.trim();
    if (!email || !name) { toast.error("Name + email are required."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast.error("Invalid email."); return; }
    setCreating(true);
    try {
      const existing = await tmGetOfficeUserByEmail(email);
      if (existing) {
        if ((existing as { is_active?: boolean }).is_active === false) {
          await tmUpsertOfficeUser({ email, isActive: true });
          toast.success(`Reactivated existing user ${email}.`);
        } else {
          toast.error("A user with that email already exists and is active.");
          return;
        }
      } else {
        // Insert new active user via upsert. Auth account is created on
        // first sign-in via the standard signup / magic-link flow — the
        // office_users row sits ready for them to claim.
        await tmUpsertOfficeUser({
          email,
          fullName: name,
          role: newUser.role,
          department: newUser.department.trim() || undefined,
          phone: newUser.phone.trim() || undefined,
          isActive: true,
        });
        toast.success(`User ${email} added. Share the signup link so they can set their password.`);
      }
      setShowAddUser(false);
      setNewUser({ full_name: "", email: "", role: "member" as Role, department: "", phone: "" });
      await refreshTasks();
    } catch (error: unknown) {
      toast.error((error as Error)?.message || "Failed to add user.");
    } finally {
      setCreating(false);
    }
  }, [newUser, refreshTasks]);

  // Per-user open task counts for the deactivate-with-reassign flow.
  const openTasksByUser = useMemo(() => {
    const map = new Map<string, OfficeTask[]>();
    for (const t of tasks) {
      if (!t.user_id) continue;
      if (t.status === "completed") continue;
      const list = map.get(t.user_id) ?? [];
      list.push(t);
      map.set(t.user_id, list);
    }
    return map;
  }, [tasks]);

  const visibleMembers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return teamMembers
      .filter((m) => showInactive ? true : m.is_active !== false)
      .filter((m) => !q || (m.full_name || "").toLowerCase().includes(q) || m.email.toLowerCase().includes(q) || (m.department || "").toLowerCase().includes(q))
      .sort((a, b) => (a.full_name || a.email).localeCompare(b.full_name || b.email));
  }, [teamMembers, showInactive, search]);

  const startEdit = (u: OfficeUser) => {
    setEditing({ id: u.id, full_name: u.full_name || "", role: u.role, department: u.department || "" });
  };

  const saveEdit = useCallback(async () => {
    if (!editing) return;
    if (editing.id === officeUser.id && editing.role !== "admin") {
      toast.error("You cannot demote yourself.");
      return;
    }
    setBusyId(editing.id);
    try {
      const target = teamMembers.find((m) => m.id === editing.id);
      if (!target) throw new Error("User not found in roster.");
      await tmUpsertOfficeUser({
        email: target.email,
        userExternalId: target.id,
        fullName: editing.full_name.trim() || undefined,
        role: editing.role,
        department: editing.department.trim() || undefined,
      });
      toast.success("User updated.");
      setEditing(null);
      await refreshTasks();
    } catch (error: unknown) {
      toast.error((error as Error)?.message || "Update failed.");
    } finally {
      setBusyId(null);
    }
  }, [editing, officeUser.id, refreshTasks, teamMembers]);

  const deactivate = useCallback(async (u: OfficeUser) => {
    if (u.id === officeUser.id) {
      toast.error("You cannot deactivate yourself.");
      return;
    }
    const openTasks = openTasksByUser.get(u.id) ?? [];
    if (openTasks.length > 0) {
      // Open reassignment dialog first.
      setReassignFor({ user: u, openTasks });
      setReassignTo("");
      return;
    }
    // No open tasks — deactivate directly.
    const confirmed = window.confirm(`Deactivate ${u.full_name || u.email}? They will be removed from every group chat, hidden from directories, and lose access.`);
    if (!confirmed) return;
    setBusyId(u.id);
    try {
      await tmUpsertOfficeUser({ email: u.email, userExternalId: u.id, isActive: false });
      // Remove from every conversation so messenger / group lists hide them instantly.
      await msgRemoveUserFromAllConversations(u.id).catch(() => undefined);
      toast.success(`${u.full_name || u.email} deactivated and removed from all chats.`);
      await refreshTasks();
    } catch (error: unknown) {
      toast.error((error as Error)?.message || "Deactivation failed.");
    } finally {
      setBusyId(null);
    }
  }, [officeUser.id, openTasksByUser, refreshTasks]);

  const confirmReassignAndDeactivate = useCallback(async () => {
    if (!reassignFor) return;
    setBusyId(reassignFor.user.id);
    try {
      if (reassignTo) {
        // Reassign all open tasks to the chosen employee.
        for (const task of reassignFor.openTasks) {
          await tmUpdateTask(task.id, { user_id: reassignTo });
        }
      }
      await tmUpsertOfficeUser({
        email: reassignFor.user.email,
        userExternalId: reassignFor.user.id,
        isActive: false,
      });
      // Also remove from every conversation so they vanish from directories.
      await msgRemoveUserFromAllConversations(reassignFor.user.id).catch(() => undefined);
      toast.success(`${reassignFor.user.full_name || reassignFor.user.email} deactivated${reassignTo ? ` — ${reassignFor.openTasks.length} tasks reassigned` : ""} and removed from all chats.`);
      setReassignFor(null);
      setReassignTo("");
      await refreshTasks();
    } catch (error: unknown) {
      toast.error((error as Error)?.message || "Deactivation failed.");
    } finally {
      setBusyId(null);
    }
  }, [reassignFor, reassignTo, refreshTasks]);

  const reactivate = useCallback(async (u: OfficeUser) => {
    setBusyId(u.id);
    try {
      await tmUpsertOfficeUser({ email: u.email, userExternalId: u.id, isActive: true });
      toast.success(`${u.full_name || u.email} reactivated.`);
      await refreshTasks();
    } catch (error: unknown) {
      toast.error((error as Error)?.message || "Reactivation failed.");
    } finally {
      setBusyId(null);
    }
  }, [refreshTasks]);

  const resetPassword = useCallback(async (u: OfficeUser) => {
    if (!window.confirm(`Send password reset email to ${u.email}?`)) return;
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(u.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success(`Reset email sent to ${u.email}.`);
    } catch (error: unknown) {
      toast.error((error as Error)?.message || "Reset failed.");
    }
  }, []);

  if (officeUser.role !== "admin") {
    return <div className="p-6 text-sm text-slate-500">Admin access required.</div>;
  }

  const cellBorder = dark ? "border-[#454545]" : "border-slate-200";
  const inputCls = `h-8 rounded-md border px-2 text-xs ${dark ? "border-slate-600 bg-[#404040] text-slate-100" : "border-slate-300 bg-white text-slate-900"}`;

  return (
    <section className="space-y-3 pb-24 sm:pb-6">
      {/* Header */}
      <div className={`rounded-xl border p-4 shadow-sm ${dark ? "border-[#454545] bg-[#f3f5f8]" : "border-slate-200 bg-white"}`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-indigo-500" />
            <h2 className={`text-base font-bold ${dark ? "text-slate-100" : "text-slate-900"}`}>User Management</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name / email / department"
              className={`${inputCls} w-52`}
            />
            <label className={`flex items-center gap-1.5 text-xs ${dark ? "text-slate-300" : "text-slate-700"}`}>
              <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
              Show inactive
            </label>
            <button
              type="button"
              onClick={() => setShowAddUser(true)}
              className="inline-flex h-8 items-center gap-1.5 rounded-md bg-indigo-600 px-3 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
            >
              <UserPlus className="h-3.5 w-3.5" /> Add user
            </button>
          </div>
        </div>
        <p className={`mt-1 text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>
          {visibleMembers.length} user{visibleMembers.length !== 1 ? "s" : ""} · deactivating preserves audit history and is reversible.
        </p>
      </div>

      {/* Table */}
      <div className={`overflow-x-auto rounded-xl border shadow-sm ${dark ? "border-[#454545] bg-[#f3f5f8]" : "border-slate-200 bg-white"}`}>
        <table className="min-w-full text-sm">
          <thead>
            <tr className={`text-left text-[11px] font-semibold uppercase tracking-wide ${dark ? "text-slate-400" : "text-slate-500"}`}>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Role</th>
              <th className="px-3 py-2">Department</th>
              <th className="px-3 py-2">Open tasks</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleMembers.map((u) => {
              const isEditing = editing?.id === u.id;
              const openCount = (openTasksByUser.get(u.id) ?? []).length;
              const isSelf = u.id === officeUser.id;
              return (
                <tr key={u.id} className={`border-t ${cellBorder} ${busyId === u.id ? "opacity-50" : ""}`}>
                  <td className="px-3 py-2 font-medium text-slate-900 dark:text-slate-100">
                    {isEditing ? (
                      <input className={inputCls} value={editing.full_name} onChange={(e) => setEditing({ ...editing, full_name: e.target.value })} />
                    ) : (u.full_name || "—")}
                    {isSelf ? <span className="ml-1 rounded bg-indigo-100 px-1 py-0.5 text-[10px] font-semibold text-indigo-700">you</span> : null}
                  </td>
                  <td className={`px-3 py-2 ${dark ? "text-slate-400" : "text-slate-600"}`}>{u.email}</td>
                  <td className="px-3 py-2">
                    {isEditing ? (
                      <select className={inputCls} value={editing.role} onChange={(e) => setEditing({ ...editing, role: e.target.value as Role })}>
                        <option value="employee">Employee</option>
                        <option value="admin">Admin</option>
                      </select>
                    ) : (
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${u.role === "admin" ? "bg-indigo-100 text-indigo-700" : "bg-emerald-100 text-emerald-700"}`}>
                        {u.role}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-slate-700 dark:text-slate-300">
                    {isEditing ? (
                      <input className={inputCls} value={editing.department} onChange={(e) => setEditing({ ...editing, department: e.target.value })} />
                    ) : (u.department || "—")}
                  </td>
                  <td className={`px-3 py-2 ${openCount > 0 ? "font-semibold text-amber-600" : "text-slate-500"}`}>{openCount}</td>
                  <td className="px-3 py-2">
                    {u.is_active === false ? (
                      <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-700">Inactive</span>
                    ) : (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">Active</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {isEditing ? (
                        <>
                          <button onClick={() => void saveEdit()} disabled={busyId === u.id} className="rounded-md bg-indigo-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"><Check className="h-3 w-3 inline" /> Save</button>
                          <button onClick={() => setEditing(null)} className="rounded-md border border-slate-300 px-2 py-1 text-[11px] font-semibold text-slate-700"><X className="h-3 w-3 inline" /></button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEdit(u)} title="Edit" className="rounded-md border border-slate-300 bg-white px-1.5 py-1 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-[#404040] dark:text-slate-200"><Edit3 className="h-3 w-3" /></button>
                          <button onClick={() => void resetPassword(u)} title="Send reset email" className="rounded-md border border-slate-300 bg-white px-1.5 py-1 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-[#404040] dark:text-slate-200"><Shield className="h-3 w-3" /></button>
                          {u.is_active === false ? (
                            <button onClick={() => void reactivate(u)} title="Reactivate" className="rounded-md border border-emerald-300 bg-emerald-50 px-1.5 py-1 text-emerald-700 hover:bg-emerald-100"><RotateCcw className="h-3 w-3" /></button>
                          ) : (
                            <button onClick={() => void deactivate(u)} disabled={isSelf} title={isSelf ? "Can't deactivate self" : "Deactivate"} className="rounded-md border border-rose-300 bg-rose-50 px-1.5 py-1 text-rose-700 hover:bg-rose-100 disabled:opacity-40"><Power className="h-3 w-3" /></button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {visibleMembers.length === 0 ? (
              <tr><td colSpan={7} className="px-3 py-10 text-center text-sm text-slate-500">No users match.</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-500">
        Use <span className="font-semibold">Add user</span> to create a new active office_users row. Tell the new user to sign up at /login with the same email — they'll inherit the role you set here. Existing inactive accounts auto-reactivate.
      </p>

      {/* Add-user modal */}
      {showAddUser ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className={`w-full max-w-md rounded-xl border p-5 shadow-2xl ${dark ? "border-[#454545] bg-[#f3f5f8]" : "border-slate-200 bg-white"}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2">
                <UserPlus className="h-5 w-5 shrink-0 text-indigo-500" />
                <div>
                  <h3 className={`text-sm font-bold ${dark ? "text-slate-100" : "text-slate-900"}`}>Add new user</h3>
                  <p className="mt-1 text-xs text-slate-500">Activates immediately. They'll sign in via the standard /login flow.</p>
                </div>
              </div>
              <button onClick={() => setShowAddUser(false)} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-2.5 text-xs">
              <div>
                <label className={`block font-semibold ${dark ? "text-slate-300" : "text-slate-700"}`}>Full name *</label>
                <input value={newUser.full_name} onChange={(e) => setNewUser((p) => ({ ...p, full_name: e.target.value }))}
                  placeholder="e.g. Aarav Sharma"
                  className={`mt-1 w-full ${inputCls}`} autoFocus />
              </div>
              <div>
                <label className={`block font-semibold ${dark ? "text-slate-300" : "text-slate-700"}`}>Email *</label>
                <input type="email" value={newUser.email} onChange={(e) => setNewUser((p) => ({ ...p, email: e.target.value }))}
                  placeholder="user@onrol.in"
                  className={`mt-1 w-full ${inputCls}`} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={`block font-semibold ${dark ? "text-slate-300" : "text-slate-700"}`}>Role</label>
                  <select value={newUser.role} onChange={(e) => setNewUser((p) => ({ ...p, role: e.target.value as Role }))}
                    className={`mt-1 w-full ${inputCls}`}>
                    <option value="member">Member</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className={`block font-semibold ${dark ? "text-slate-300" : "text-slate-700"}`}>Department</label>
                  <input value={newUser.department} onChange={(e) => setNewUser((p) => ({ ...p, department: e.target.value }))}
                    placeholder="Sales / Ops / …"
                    className={`mt-1 w-full ${inputCls}`} />
                </div>
              </div>
              <div>
                <label className={`block font-semibold ${dark ? "text-slate-300" : "text-slate-700"}`}>Phone (optional)</label>
                <input value={newUser.phone} onChange={(e) => setNewUser((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="+91…"
                  className={`mt-1 w-full ${inputCls}`} />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button onClick={() => setShowAddUser(false)}
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
              <button onClick={() => void createUser()} disabled={creating}
                className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
                {creating ? <RotateCcw className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                {creating ? "Adding…" : "Add user"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Reassign modal */}
      {reassignFor ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className={`w-full max-w-md rounded-xl border p-5 shadow-2xl ${dark ? "border-[#454545] bg-[#f3f5f8]" : "border-slate-200 bg-white"}`}>
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Deactivate {reassignFor.user.full_name || reassignFor.user.email}?</h3>
                <p className="mt-1 text-xs text-slate-500">
                  They have <span className="font-semibold">{reassignFor.openTasks.length} open task{reassignFor.openTasks.length !== 1 ? "s" : ""}</span>. Choose what to do with them.
                </p>
              </div>
            </div>
            <div className="mt-4 space-y-2 text-xs">
              <label className="block font-semibold text-slate-700 dark:text-slate-300">Reassign to:</label>
              <select value={reassignTo} onChange={(e) => setReassignTo(e.target.value)} className={`w-full ${inputCls}`}>
                <option value="">— Leave tasks unassigned (keep on deactivated user) —</option>
                {teamMembers
                  .filter((m) => m.id !== reassignFor.user.id && m.is_active !== false)
                  .map((m) => (
                    <option key={m.id} value={m.id}>{m.full_name || m.email} ({m.role})</option>
                  ))}
              </select>
              <p className="text-slate-500">
                Leaving unassigned is fine if you plan to reactivate them. Reassign if they're gone for good.
              </p>
            </div>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button onClick={() => { setReassignFor(null); setReassignTo(""); }} className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700">Cancel</button>
              <button onClick={() => void confirmReassignAndDeactivate()} disabled={busyId === reassignFor.user.id} className="rounded-md bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-500 disabled:opacity-50">
                Deactivate{reassignTo ? " + reassign" : ""}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
};

export default UserManagement;
