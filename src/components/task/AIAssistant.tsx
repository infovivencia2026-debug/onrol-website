"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  BrainCircuit, X, Send, Loader2, Bot, User, Sparkles, Copy, Check,
  Trash2, ChevronDown, BarChart2, MessageSquare, Lightbulb, FileText, Target,
  TrendingUp, Calendar, AlertCircle, Users, Award, AlertTriangle,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface AIAssistantProps {
  uiTheme: "dark" | "light";
  officeUser: { id?: string; full_name?: string | null; email: string; role: string };
  tasks?: Array<{
    task_title?: string | null;
    institution_name?: string | null;
    visit_status?: string | null;
    visit_date?: string | null;
    status?: string | null;
    priority?: string | null;
    task_category?: string | null;
    user_id?: string | null;
  }>;
  institutions?: Array<{
    institution_name?: string | null;
    city?: string | null;
    lead_stage?: string | null;
    conversion_status?: string | null;
  }>;
  teamMembers?: Array<{ id: string; full_name?: string | null; email?: string; role?: string }>;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  ts: number;
}

const QUICK_ACTIONS_BASE = [
  { label: "Today's visit summary",   key: "summarize",  icon: BarChart2,    color: "from-orange-500 to-orange-500", roles: ["admin", "employee"] as string[] },
  { label: "Draft follow-up email",   key: "followup",   icon: MessageSquare, color: "from-violet-500 to-purple-500", roles: ["admin", "employee"] as string[] },
  { label: "Suggest next actions",    key: "suggest",    icon: Lightbulb,    color: "from-amber-500 to-orange-500", roles: ["admin", "employee"] as string[] },
  { label: "Weekly report draft",     key: "weekly",     icon: FileText,     color: "from-emerald-500 to-teal-500", roles: ["admin", "employee"] as string[] },
  { label: "Pipeline analysis",       key: "pipeline",   icon: TrendingUp,   color: "from-rose-500 to-pink-500", roles: ["admin", "employee"] as string[] },
  { label: "Overdue task review",     key: "overdue",    icon: AlertCircle,  color: "from-red-500 to-rose-500", roles: ["admin", "employee"] as string[] },
  { label: "Schedule optimization",   key: "schedule",   icon: Calendar,     color: "from-indigo-500 to-orange-500", roles: ["admin", "employee"] as string[] },
  { label: "Conversion insights",     key: "conversion", icon: Target,       color: "from-teal-500 to-green-500", roles: ["admin", "employee"] as string[] },
  // Admin-only:
  { label: "Team performance leaderboard", key: "leaderboard",   icon: Award,         color: "from-amber-500 to-yellow-500", roles: ["admin"] as string[] },
  { label: "Underperforming employees",    key: "underperformers", icon: AlertTriangle, color: "from-rose-500 to-red-500", roles: ["admin"] as string[] },
  { label: "Per-employee weekly report",   key: "employee_weekly", icon: Users,         color: "from-indigo-500 to-violet-500", roles: ["admin"] as string[] },
] as const;

function buildContext(
  officeUser: AIAssistantProps["officeUser"],
  tasks?: AIAssistantProps["tasks"],
  institutions?: AIAssistantProps["institutions"],
  scope?: { kind: "self" | "all_team" | "single_employee"; targetName?: string; targetId?: string },
): string {
  const baseName = officeUser.full_name || officeUser.email.split("@")[0];
  const name = scope?.kind === "single_employee" && scope.targetName
    ? scope.targetName
    : scope?.kind === "all_team" ? "Team (all employees)" : baseName;
  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const todayISO = new Date().toISOString().slice(0, 10);

  const visitTasks = (tasks ?? []).filter((t) => t.task_category === "visit");
  const todayVisits = visitTasks.filter((t) => t.visit_date === todayISO);
  const completedToday = todayVisits.filter((t) => t.visit_status === "completed" || t.visit_status === "closed_won");
  const followupToday = todayVisits.filter((t) => t.visit_status === "followup_pending");
  const inProgressToday = todayVisits.filter((t) => t.visit_status === "reached" || t.visit_status === "in_meeting");
  const plannedToday = todayVisits.filter((t) => !t.visit_status || t.visit_status === "planned");
  const overdueCount = (tasks ?? []).filter((t) => t.status === "overdue" || t.status === "delayed").length;
  const highPriority = (tasks ?? []).filter((t) => t.priority === "high" || t.priority === "critical").length;
  const instCount = (institutions ?? []).length;
  const hotLeads = (institutions ?? []).filter((i) => i.lead_stage === "demo" || i.lead_stage === "proposal").length;

  const scopeLine = scope?.kind === "all_team"
    ? `Reporting scope: TEAM-WIDE (all employees)`
    : scope?.kind === "single_employee"
      ? `Reporting scope: SINGLE EMPLOYEE — ${name}`
      : `Reporting scope: ${name} (self)`;

  return `You are Xulo, an intelligent AI assistant for ONROL Field Sales CRM.
Viewer: ${baseName} (${officeUser.role})
${scopeLine}
Date: ${today}
Today's visit breakdown (use these EXACT numbers — never invent):
- Total scheduled today: ${todayVisits.length}
- Planned (not yet started): ${plannedToday.length}
- In progress (reached / in meeting): ${inProgressToday.length}
- Completed today: ${completedToday.length}
- Follow-up pending (visit done, next visit scheduled): ${followupToday.length}
Other context:
- Total tasks (all categories): ${(tasks ?? []).length}
- Overdue tasks: ${overdueCount} | High priority: ${highPriority}
- Institutions in CRM: ${instCount} | Hot leads (demo/proposal): ${hotLeads}
IMPORTANT: The sum of Planned + In progress + Completed + Follow-up pending must equal Total scheduled today. Do not omit the Follow-up pending bucket. Respond concisely, professionally, with actionable advice for field sales.`;
}

function buildLocalResponse(
  key: string,
  officeUser: AIAssistantProps["officeUser"],
  tasks?: AIAssistantProps["tasks"],
  institutions?: AIAssistantProps["institutions"],
  teamMembers?: AIAssistantProps["teamMembers"],
  scope?: { kind: "self" | "all_team" | "single_employee"; targetName?: string; targetId?: string },
): string {
  const baseName = officeUser.full_name || officeUser.email.split("@")[0];
  const name = scope?.kind === "single_employee" && scope.targetName
    ? scope.targetName
    : scope?.kind === "all_team" ? "the team" : baseName;
  const todayISO = new Date().toISOString().slice(0, 10);
  const visitTasks = (tasks ?? []).filter((t) => t.task_category === "visit");
  const todayVisits = visitTasks.filter((t) => t.visit_date === todayISO);
  const completed = todayVisits.filter((t) => t.visit_status === "completed" || t.visit_status === "closed_won").length;
  const reached = todayVisits.filter((t) => t.visit_status === "reached").length;
  const inMeeting = todayVisits.filter((t) => t.visit_status === "in_meeting").length;
  const followupPending = todayVisits.filter((t) => t.visit_status === "followup_pending").length;
  const planned = todayVisits.filter((t) => t.visit_status === "planned" || !t.visit_status).length;
  const inProgress = reached + inMeeting;
  // Completion = visits that are effectively done (submitted DSR OR waiting on follow-up)
  const effectivelyDone = completed + followupPending;
  const overdue = (tasks ?? []).filter((t) => t.status === "overdue" || t.status === "delayed");
  const highP = (tasks ?? []).filter((t) => t.priority === "high" || t.priority === "critical");
  const hotLeads = (institutions ?? []).filter((i) => i.lead_stage === "demo" || i.lead_stage === "proposal");

  switch (key) {
    case "summarize": {
      const pct = todayVisits.length > 0 ? Math.round((effectivelyDone / todayVisits.length) * 100) : 0;
      const lines: string[] = [];
      lines.push(`📊 Today's Visit Summary for ${name}`);
      lines.push("");
      lines.push(`Total scheduled: ${todayVisits.length}`);
      lines.push(`✅ Completed: ${completed}   ⏳ Follow-up pending: ${followupPending}`);
      lines.push(`📍 In progress: ${inProgress}   📌 Planned: ${planned}`);
      lines.push(`Progress: ${pct}% (counts completed + follow-up pending)`);
      lines.push("");
      if (completed > 0) lines.push(`✅ ${completed} visit${completed > 1 ? "s" : ""} closed today — nice work.`);
      if (followupPending > 0) lines.push(`⏳ ${followupPending} visit${followupPending > 1 ? "s are" : " is"} waiting on a scheduled follow-up.`);
      if (inProgress > 0) lines.push(`🔄 ${inProgress} visit${inProgress > 1 ? "s" : ""} in progress right now.`);
      if (planned > 0) lines.push(`📌 ${planned} visit${planned > 1 ? "s" : ""} still planned — stay on track.`);
      if (todayVisits.length === 0) lines.push("No visits scheduled for today. Check your journey planner.");
      else lines.push("");
      if (todayVisits.length > 0) lines.push("Keep going — every visit builds your pipeline.");
      return lines.join("\n");
    }

    case "followup":
      return `📧 Follow-up Email Template

Subject: Following up on our meeting — ONROL Solutions

Dear [Contact Name],

Thank you for taking the time to meet with me${todayVisits.length > 0 ? " today" : " recently"}. It was a pleasure discussing how ONROL can support your institution's goals.

As promised, here's a quick summary of what we covered:
• [Key point 1 from your meeting]
• [Key point 2 / demo highlights]

Next steps:
→ I'll send over the proposal by [date]
→ Scheduled follow-up call: [date/time]

Please don't hesitate to reach out with any questions.

Best regards,
${name}
ONROL Field Representative`;

    case "suggest":
      return `💡 Recommended Next Actions

${highP.length > 0 ? `🔴 **${highP.length} high-priority task${highP.length > 1 ? "s" : ""} need attention** — address these first.\n` : ""}${overdue.length > 0 ? `⚠️ **${overdue.length} overdue item${overdue.length > 1 ? "s" : ""}** — reschedule or escalate immediately.\n` : ""}
1. Follow up with institutions visited in the last 48 hours
2. Update visit outcomes and notes while memory is fresh
3. ${hotLeads.length > 0 ? `Move ${hotLeads.length} hot lead${hotLeads.length > 1 ? "s" : ""} (demo/proposal stage) forward` : "Identify and qualify new leads from recent visits"}
4. Sync pipeline status with your admin
5. Plan tomorrow's journey route for efficiency

Pro tip: Focus on the ${Math.min(3, planned)} highest-potential visits still pending today.`;

    case "weekly":
      return `📋 Weekly Activity Report — ${name}

Period: ${new Date(Date.now() - 6 * 86400000).toLocaleDateString("en-IN", { month: "short", day: "numeric" })} – ${new Date().toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}

📊 Activity Summary
• Total tasks in pipeline: ${(tasks ?? []).length}
• Visit tasks: ${visitTasks.length}
• Completed visits: ${visitTasks.filter((t) => t.visit_status === "completed" || t.visit_status === "closed_won").length}
• Institutions in CRM: ${(institutions ?? []).length}

🏆 Key Highlights
• Pipeline coverage across ${new Set((visitTasks ?? []).map((t) => t.institution_name)).size} unique institutions
• Hot leads in demo/proposal stage: ${hotLeads.length}

📋 Next Week Focus
• Target ${Math.max(3, Math.ceil((tasks ?? []).length / 5))} visits per day
• Follow up on all pending proposals
• Update lead stages for converted prospects`;

    case "pipeline":
      return `📈 Pipeline Analysis

Total institutions tracked: ${(institutions ?? []).length}
Hot leads (demo/proposal): ${hotLeads.length}
${hotLeads.length > 0 ? hotLeads.slice(0, 3).map((i) => `  • ${i.institution_name ?? "Unknown"} — ${i.lead_stage}`).join("\n") : ""}

Conversion opportunities:
• ${(institutions ?? []).filter((i) => i.lead_stage === "reached").length} institutions at "Reached" — ready to pitch
• ${(institutions ?? []).filter((i) => i.conversion_status === "not_converted").length} not yet converted — re-engagement potential

💡 Focus on moving demo-stage leads to proposals this week for the best conversion impact.`;

    case "overdue":
      return overdue.length === 0
        ? `✅ Great news! No overdue tasks found.\n\nYour task management is on point. Keep up the consistent follow-through and proactive scheduling.`
        : `⚠️ Overdue Task Review — ${overdue.length} item${overdue.length > 1 ? "s" : ""}

${overdue.slice(0, 5).map((t, i) => `${i + 1}. ${t.task_title ?? t.institution_name ?? "Task"} (${t.priority ?? "normal"} priority)`).join("\n")}
${overdue.length > 5 ? `...and ${overdue.length - 5} more` : ""}

Recommended actions:
→ Reschedule if genuinely delayed
→ Mark complete if already done offline
→ Escalate critical items to your admin`;

    case "schedule":
      return `📅 Schedule Optimization Tips

Based on your current workload (${(tasks ?? []).length} tasks, ${todayVisits.length} visits today):

🌅 Morning (9–11 AM): New visit check-ins — energy is highest
☀️ Midday (11 AM–2 PM): In-person meetings and demos
🌆 Afternoon (3–5 PM): Follow-ups, calls, admin updates
🌙 End of day: Log outcomes, plan tomorrow

Top priority for today:
${todayVisits.slice(0, 3).map((t, i) => `${i + 1}. ${t.institution_name ?? t.task_title ?? "Visit"}`).join("\n") || "• No visits scheduled — add to journey planner"}

💡 Cluster nearby institutions to minimize travel time.`;

    case "conversion":
      return `🎯 Conversion Insights

Pipeline overview:
• Total tracked: ${(institutions ?? []).length} institutions
• Demo/proposal stage: ${hotLeads.length} (highest conversion potential)
• Not yet converted: ${(institutions ?? []).filter((i) => i.conversion_status === "not_converted").length}

Key conversion drivers:
1. Speed — follow up within 24h of first contact
2. Personalization — reference specific pain points from your visit
3. Social proof — mention similar institutions you've helped
4. Urgency — offer time-limited demos or proposals

Top 3 to prioritize:
${hotLeads.slice(0, 3).map((i, idx) => `${idx + 1}. ${i.institution_name ?? "Unknown"} (${i.city ?? ""}) — ${i.lead_stage}`).join("\n") || "• No hot leads yet — keep building your pipeline"}`;

    case "leaderboard": {
      // Aggregate per-employee from full task list (assumes admin passed team-wide tasks)
      const sevenDayCutoff = Date.now() - 7 * 86400_000;
      const byUser = new Map<string, { name: string; total: number; visits: number; completed: number; followups: number; overdue: number }>();
      for (const m of (teamMembers ?? [])) byUser.set(m.id, { name: m.full_name || m.email || m.id.slice(0, 6), total: 0, visits: 0, completed: 0, followups: 0, overdue: 0 });
      for (const t of (tasks ?? [])) {
        if (!t.user_id) continue;
        const created = t.visit_date ? new Date(t.visit_date).getTime() : 0;
        if (created && created < sevenDayCutoff) continue;
        const slot = byUser.get(t.user_id);
        if (!slot) continue;
        slot.total += 1;
        if (t.task_category === "visit") slot.visits += 1;
        if (t.visit_status === "completed") slot.completed += 1;
        if (t.visit_status === "followup_pending") slot.followups += 1;
        if (t.status === "overdue" || t.status === "delayed") slot.overdue += 1;
      }
      const ranked = Array.from(byUser.values())
        .filter((r) => r.total > 0)
        .sort((a, b) => (b.completed + b.followups) - (a.completed + a.followups))
        .slice(0, 10);
      if (ranked.length === 0) return "🏆 Team Leaderboard\n\nNo activity in the last 7 days.";
      return `🏆 Team Performance — Last 7 Days\n\n${ranked.map((r, i) => {
        const score = r.completed + r.followups;
        const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;
        return `${medal} ${r.name} — ${score} closed (${r.completed} done · ${r.followups} f/u) · ${r.visits} visits${r.overdue ? ` · ${r.overdue} overdue` : ""}`;
      }).join("\n")}\n\nRanked by completed + follow-up-pending visits.`;
    }

    case "underperformers": {
      const sevenDayCutoff = Date.now() - 7 * 86400_000;
      const byUser = new Map<string, { name: string; total: number; completed: number; overdue: number; lastActivity: number }>();
      for (const m of (teamMembers ?? [])) byUser.set(m.id, { name: m.full_name || m.email || m.id.slice(0, 6), total: 0, completed: 0, overdue: 0, lastActivity: 0 });
      for (const t of (tasks ?? [])) {
        if (!t.user_id) continue;
        const slot = byUser.get(t.user_id);
        if (!slot) continue;
        const ts = t.visit_date ? new Date(t.visit_date).getTime() : 0;
        if (ts > slot.lastActivity) slot.lastActivity = ts;
        if (ts && ts >= sevenDayCutoff) {
          slot.total += 1;
          if (t.visit_status === "completed") slot.completed += 1;
        }
        if (t.status === "overdue" || t.status === "delayed") slot.overdue += 1;
      }
      const flagged = Array.from(byUser.values())
        .filter((r) => r.overdue >= 3 || r.total === 0 || (r.total > 0 && r.completed === 0))
        .sort((a, b) => b.overdue - a.overdue)
        .slice(0, 10);
      if (flagged.length === 0) return "✅ No underperformers flagged this week — full team is producing.";
      return `⚠️ Employees Needing Attention\n\n${flagged.map((r, i) => {
        const reasons: string[] = [];
        if (r.overdue >= 3) reasons.push(`${r.overdue} overdue`);
        if (r.total === 0) reasons.push("no activity in 7d");
        else if (r.completed === 0) reasons.push("0 closed of " + r.total);
        const lastDays = r.lastActivity ? Math.round((Date.now() - r.lastActivity) / 86400_000) : null;
        if (lastDays != null && lastDays > 7) reasons.push(`last active ${lastDays}d ago`);
        return `${i + 1}. ${r.name} — ${reasons.join(" · ") || "low output"}`;
      }).join("\n")}\n\nConsider 1-on-1 check-ins or workload rebalancing.`;
    }

    case "employee_weekly": {
      // If a single-employee scope is active, build a focused weekly report for that user.
      // Otherwise list each employee's one-line weekly summary.
      const sevenDayCutoff = Date.now() - 7 * 86400_000;
      const filterByUser = (uid?: string) => (tasks ?? []).filter((t) => uid ? t.user_id === uid : true);
      const summarize = (rows: NonNullable<AIAssistantProps["tasks"]>) => {
        const visits = rows.filter((t) => t.task_category === "visit");
        const week = visits.filter((t) => t.visit_date && new Date(t.visit_date).getTime() >= sevenDayCutoff);
        const closed = week.filter((t) => t.visit_status === "completed").length;
        const followup = week.filter((t) => t.visit_status === "followup_pending").length;
        const overdue = rows.filter((t) => t.status === "overdue" || t.status === "delayed").length;
        return { weekVisits: week.length, closed, followup, overdue, total: rows.length };
      };
      if (scope?.kind === "single_employee" && scope.targetId) {
        const s = summarize(filterByUser(scope.targetId));
        return `📋 Weekly Report — ${scope.targetName}\n\n• Visits this week: ${s.weekVisits}\n• Closed: ${s.closed}\n• Follow-up pending: ${s.followup}\n• Overdue tasks: ${s.overdue}\n• Total tasks owned: ${s.total}\n\n${s.closed === 0 && s.weekVisits > 0 ? "⚠️ Visits made but none closed — coaching opportunity." : s.closed > 0 ? "✅ Closing visits — keep momentum." : "ℹ️ No visit activity this week."}`;
      }
      const lines = (teamMembers ?? []).map((m) => {
        const s = summarize(filterByUser(m.id));
        if (s.weekVisits === 0 && s.overdue === 0 && s.total === 0) return null;
        return `• ${m.full_name || m.email}: ${s.weekVisits} visits, ${s.closed} closed, ${s.followup} f/u${s.overdue ? `, ${s.overdue} overdue` : ""}`;
      }).filter(Boolean) as string[];
      if (!lines.length) return "📋 Per-Employee Weekly Report\n\nNo activity recorded this week.";
      return `📋 Per-Employee Weekly Report — Last 7 Days\n\n${lines.join("\n")}\n\nTip: select a single employee from the header dropdown for a focused report.`;
    }

    default:
      return `I've analyzed your CRM data. You have ${(tasks ?? []).length} active tasks and ${(institutions ?? []).length} institutions in your pipeline. Is there something specific you'd like help with?`;
  }
}

// Typing animation effect
function useTypingEffect(text: string, speed = 12) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    setDisplayed("");
    setDone(false);
    if (!text) return;
    let i = 0;
    const interval = setInterval(() => {
      i += Math.ceil(speed / 4);
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        setDisplayed(text);
        setDone(true);
        clearInterval(interval);
      }
    }, 16);
    return () => clearInterval(interval);
  }, [text, speed]);
  return { displayed, done };
}

function CopyButton({ text, dark }: { text: string; dark: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        void navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className={`rounded p-1 transition-colors ${dark ? "text-slate-500 hover:text-slate-300" : "text-slate-400 hover:text-slate-600"}`}
      title="Copy response"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

function MessageBubble({ msg, dark, isLast }: { msg: ChatMessage; dark: boolean; isLast: boolean }) {
  const { displayed, done } = useTypingEffect(msg.role === "assistant" ? msg.content : "", 8);
  const content = msg.role === "assistant" ? (isLast ? displayed : msg.content) : msg.content;

  if (msg.role === "user") {
    return (
      <div className="flex justify-end gap-2 group">
        <div
          className="max-w-[80%] rounded-2xl rounded-tr-sm px-3.5 py-2.5 text-xs leading-relaxed text-white"
          style={{ background: "linear-gradient(135deg,#6366f1,#7c3aed)" }}
        >
          {msg.content}
        </div>
        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white" style={{ background: "linear-gradient(135deg,#6366f1,#7c3aed)" }}>
          <User className="h-3.5 w-3.5" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2 group">
      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full flex-shrink-0" style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)" }}>
        <Bot className="h-3.5 w-3.5 text-white" />
      </div>
      <div className={`flex-1 min-w-0 rounded-2xl rounded-tl-sm px-3.5 py-2.5 ${dark ? "bg-[#404040] border border-[#454545]" : "bg-slate-100 border border-slate-200"}`}>
        <pre className={`whitespace-pre-wrap font-sans text-xs leading-relaxed ${dark ? "text-slate-200" : "text-slate-700"}`}>
          {content}
          {!done && isLast && <span className="inline-block h-3 w-0.5 ml-0.5 bg-indigo-400 animate-pulse" />}
        </pre>
        {(done || !isLast) && (
          <div className="mt-1.5 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
            <CopyButton text={msg.content} dark={dark} />
          </div>
        )}
      </div>
    </div>
  );
}

const AIAssistant: React.FC<AIAssistantProps> = ({ uiTheme, officeUser, tasks, institutions, teamMembers }) => {
  const dark = uiTheme === "dark";
  const isAdmin = officeUser.role === "admin";
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [showQuickActions, setShowQuickActions] = useState(true);
  // Admin-only scope: "" = all team, otherwise specific employee id. Self for non-admin.
  const [scopeUserId, setScopeUserId] = useState<string>("");

  const currentScope = (() => {
    if (!isAdmin) return { kind: "self" as const };
    if (!scopeUserId) return { kind: "all_team" as const };
    const m = (teamMembers ?? []).find((u) => u.id === scopeUserId);
    return { kind: "single_employee" as const, targetId: scopeUserId, targetName: m?.full_name || m?.email || "Employee" };
  })();
  // Filter tasks for the active scope. Non-admin always gets their own tasks (props already filtered by API).
  const scopedTasks = (() => {
    if (!isAdmin) return tasks;
    if (currentScope.kind === "single_employee") return (tasks ?? []).filter((t) => t.user_id === currentScope.targetId);
    return tasks; // all_team
  })();
  // Visible quick actions for current role
  const quickActions = QUICK_ACTIONS_BASE.filter((a) => a.roles.includes(officeUser.role));
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }, []);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const name = officeUser.full_name || officeUser.email.split("@")[0];
      const todayISO = new Date().toISOString().slice(0, 10);
      const todayVisits = (scopedTasks ?? []).filter((t) => t.task_category === "visit" && t.visit_date === todayISO).length;
      const scopeNote = isAdmin
        ? currentScope.kind === "single_employee"
          ? `Currently focused on **${currentScope.targetName}** — switch from the header dropdown.`
          : `Currently in **team-wide** view — pick an employee from the header dropdown for a focused report.`
        : "";
      setMessages([{
        id: "welcome",
        role: "assistant",
        content: `Hi ${name}! 👋 I'm Xulo, your AI sales assistant.\n\n${(scopedTasks ?? []).length} tasks in scope${todayVisits > 0 ? ` · ${todayVisits} visit${todayVisits > 1 ? "s" : ""} today` : ""}.${scopeNote ? `\n\n${scopeNote}` : ""}\n\nHow can I help you?`,
        ts: Date.now(),
      }]);
    }
  }, [isOpen, officeUser, scopedTasks, isAdmin, currentScope, messages.length]);

  const addMessage = useCallback((role: "user" | "assistant", content: string) => {
    const msg: ChatMessage = { id: `${Date.now()}-${Math.random().toString(36).slice(2,6)}`, role, content, ts: Date.now() };
    setMessages((prev) => [...prev, msg]);
    scrollToBottom();
    return msg;
  }, [scrollToBottom]);

  const askRag = useCallback(async (prompt: string): Promise<string | null> => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) return null;
      const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? "";
      const res = await fetch(`${supabaseUrl}/functions/v1/rag-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ question: prompt }),
        signal: AbortSignal.timeout(20000),
      });
      if (!res.ok) return null;
      const json = await res.json() as { answer?: string };
      return json.answer ?? null;
    } catch {
      return null;
    }
  }, []);

  const handleSend = useCallback(async (promptText?: string) => {
    const text = (promptText ?? input).trim();
    if (!text || loading) return;
    setInput("");
    setShowQuickActions(false);
    addMessage("user", text);
    setLoading(true);
    scrollToBottom();

    try {
      // Try RAG first, fall back to local logic
      let response = await askRag(buildContext(officeUser, scopedTasks, institutions, currentScope) + "\n\nUser question: " + text);
      if (!response) {
        await new Promise((r) => setTimeout(r, 600));
        response = buildLocalResponse("custom", officeUser, scopedTasks, institutions, teamMembers, currentScope);
      }
      addMessage("assistant", response);
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  }, [input, loading, addMessage, askRag, officeUser, scopedTasks, institutions, teamMembers, currentScope, scrollToBottom]);

  const handleQuickAction = useCallback(async (label: string, key: string) => {
    setShowQuickActions(false);
    addMessage("user", label);
    setLoading(true);
    scrollToBottom();
    try {
      // Admin team-aggregate actions need ALL tasks regardless of single-employee scope.
      const teamActions = ["leaderboard", "underperformers", "employee_weekly"];
      const useFullTeam = teamActions.includes(key) && isAdmin && currentScope.kind !== "single_employee";
      const tasksForAction = useFullTeam ? tasks : scopedTasks;
      const context = buildContext(officeUser, tasksForAction, institutions, useFullTeam ? { kind: "all_team" } : currentScope);
      let response = await askRag(`${context}\n\nUser request: ${label}`);
      if (!response) {
        await new Promise((r) => setTimeout(r, 700));
        response = buildLocalResponse(key, officeUser, tasksForAction, institutions, teamMembers, useFullTeam ? { kind: "all_team" } : currentScope);
      }
      addMessage("assistant", response);
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  }, [addMessage, askRag, officeUser, scopedTasks, tasks, institutions, teamMembers, currentScope, isAdmin, scrollToBottom]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setShowQuickActions(true);
    setTimeout(() => {
      const name = officeUser.full_name || officeUser.email.split("@")[0];
      setMessages([{
        id: "welcome2",
        role: "assistant",
        content: `Chat cleared. Hi again, ${name}! What can I help you with?`,
        ts: Date.now(),
      }]);
    }, 100);
  }, [officeUser]);

  return (
    <>
      {/* Floating trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        aria-label="Open Xulo AI"
        className="fixed bottom-6 right-4 z-[55] flex h-12 w-12 items-center justify-center rounded-full shadow-xl shadow-indigo-500/30 transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 active:scale-95"
        style={{ background: "linear-gradient(135deg,#6366f1,#7c3aed)" }}
      >
        {isOpen ? <X className="h-5 w-5 text-white" /> : <Sparkles className="h-5 w-5 text-white" />}
        {!isOpen && (
          <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-70" />
            <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-violet-400" />
          </span>
        )}
      </button>

      {/* Side panel */}
      <div
        className={`fixed bottom-0 right-0 top-0 z-[54] flex w-[340px] max-w-full flex-col border-l shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        } ${dark ? "border-[#454545]/60 bg-[#1a1a1a]" : "border-slate-200 bg-white"}`}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between px-4 py-3.5" style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)" }}>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/15">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-none">Xulo AI</p>
              <p className="text-[10px] text-indigo-200 mt-0.5">Field Sales Assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={clearChat}
              className="rounded-lg p-1.5 text-white/60 hover:bg-white/10 hover:text-white transition-colors"
              title="Clear chat"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1.5 text-white/60 hover:bg-white/10 hover:text-white transition-colors"
              aria-label="Close Xulo"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Context bar */}
        <div className={`flex items-center gap-3 px-4 py-2 text-[10px] border-b ${dark ? "border-[#404040] bg-[#f3f5f8]/60 text-slate-500" : "border-slate-100 bg-slate-50 text-slate-400"}`}>
          <span>{(scopedTasks ?? []).length} tasks</span>
          <span className="h-1 w-1 rounded-full bg-current opacity-40" />
          <span>{(institutions ?? []).length} institutions</span>
          <span className="h-1 w-1 rounded-full bg-current opacity-40" />
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Live
          </span>
          <button
            onClick={() => setShowQuickActions((v) => !v)}
            className="ml-auto flex items-center gap-0.5 text-current opacity-60 hover:opacity-100 transition-opacity"
          >
            Actions <ChevronDown className={`h-3 w-3 transition-transform ${showQuickActions ? "rotate-180" : ""}`} />
          </button>
        </div>

        {/* Admin-only: employee scope selector */}
        {isAdmin ? (
          <div className={`flex items-center gap-2 px-4 py-2 text-[11px] border-b ${dark ? "border-[#404040] bg-[#f3f5f8]/40 text-slate-400" : "border-slate-100 bg-white text-slate-500"}`}>
            <Users className="h-3 w-3" />
            <span>Scope:</span>
            <select
              value={scopeUserId}
              onChange={(e) => { setScopeUserId(e.target.value); setMessages([]); setShowQuickActions(true); }}
              className={`min-w-0 flex-1 rounded-md border px-1.5 py-0.5 text-[11px] ${dark ? "border-[#454545] bg-[#404040] text-slate-200" : "border-slate-300 bg-white text-slate-700"}`}
            >
              <option value="">All Team (aggregate)</option>
              {(teamMembers ?? []).map((m) => (
                <option key={m.id} value={m.id}>{m.full_name || m.email}</option>
              ))}
            </select>
          </div>
        ) : null}

        {/* Quick actions (collapsible) */}
        {showQuickActions && (
          <div className={`shrink-0 border-b px-3 py-3 ${dark ? "border-[#404040] bg-[#f3f5f8]/40" : "border-slate-100 bg-slate-50/80"}`}>
            <div className="grid grid-cols-2 gap-1.5">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.key}
                    type="button"
                    onClick={() => void handleQuickAction(action.label, action.key)}
                    disabled={loading}
                    className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 text-left text-[11px] font-medium transition-all active:scale-95 disabled:opacity-40 ${
                      dark
                        ? "border-[#454545] bg-[#404040]/80 text-slate-300 hover:bg-[#454545]"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100 shadow-sm"
                    }`}
                  >
                    <div className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md bg-gradient-to-br ${action.color}`}>
                      <Icon className="h-2.5 w-2.5 text-white" />
                    </div>
                    <span className="leading-tight">{action.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
          {messages.map((msg, idx) => (
            <MessageBubble
              key={msg.id}
              msg={msg}
              dark={dark}
              isLast={idx === messages.length - 1}
            />
          ))}
          {loading && (
            <div className="flex gap-2">
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full" style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)" }}>
                <Bot className="h-3.5 w-3.5 text-white" />
              </div>
              <div className={`rounded-2xl rounded-tl-sm px-3.5 py-3 ${dark ? "bg-[#404040] border border-[#454545]" : "bg-slate-100 border border-slate-200"}`}>
                <div className="flex gap-1 items-center">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div className={`shrink-0 border-t p-3 ${dark ? "border-[#404040] bg-[#f3f5f8]/60" : "border-slate-200 bg-white"}`}>
          <div className={`flex items-end gap-2 rounded-xl border px-3 py-2 ${dark ? "border-[#454545] bg-[#404040]" : "border-slate-300 bg-slate-50 focus-within:border-indigo-400"}`}>
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = `${Math.min(e.target.scrollHeight, 100)}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void handleSend();
                }
              }}
              placeholder="Ask anything about your pipeline…"
              disabled={loading}
              className={`flex-1 resize-none bg-transparent text-xs outline-none placeholder:text-slate-500 disabled:opacity-50 ${dark ? "text-slate-100" : "text-slate-900"}`}
              style={{ minHeight: "20px", maxHeight: "100px" }}
            />
            <button
              onClick={() => void handleSend()}
              disabled={loading || !input.trim()}
              className="mb-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-white transition-all active:scale-90 disabled:opacity-40"
              style={{ background: "linear-gradient(135deg,#6366f1,#7c3aed)" }}
              aria-label="Send"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className={`mt-1.5 text-center text-[10px] ${dark ? "text-slate-600" : "text-slate-400"}`}>
            Shift+Enter for new line · Powered by Xulo AI
          </p>
        </div>
      </div>

      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[53] bg-black/40 backdrop-blur-sm sm:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default AIAssistant;
