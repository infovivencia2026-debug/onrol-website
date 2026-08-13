/**
 * UserGuide — in-app help & documentation panel
 *
 * Covers: Web, Android, Admin, Employee, File Transfer, AI, Journey Planner,
 * Developer setup (keystore, APK builds, Edge Functions, Supabase secrets).
 */

import React, { useState } from "react";
import {
  X, BookOpen, Smartphone, Globe, Shield, Terminal, Users, Map, BrainCircuit,
  FolderOpen, ChevronRight, ChevronDown, CheckCircle2, Copy, Check, Bell,
  Zap, Lock, Database, Key, AlertTriangle, Info, Settings,
} from "lucide-react";

interface UserGuideProps {
  uiTheme: "dark" | "light";
  userRole: "admin" | "employee";
  onClose: () => void;
}

interface Section {
  id: string;
  label: string;
  icon: React.FC<{ className?: string }>;
  color: string;
  audience: "all" | "admin" | "employee" | "dev";
}

const SECTIONS: Section[] = [
  { id: "getting-started",  label: "Getting Started",      icon: Zap,          color: "from-amber-500 to-orange-500",  audience: "all" },
  { id: "web",              label: "Web / PWA",            icon: Globe,         color: "from-orange-500 to-orange-500",     audience: "all" },
  { id: "android",          label: "Android App",          icon: Smartphone,    color: "from-emerald-500 to-green-500", audience: "all" },
  { id: "admin-guide",      label: "Admin Guide",          icon: Users,         color: "from-violet-500 to-purple-500", audience: "admin" },
  { id: "employee-guide",   label: "Employee Guide",       icon: CheckCircle2,  color: "from-teal-500 to-orange-500",     audience: "employee" },
  { id: "journey-planner",  label: "Journey Planner",      icon: Map,           color: "from-indigo-500 to-orange-500",   audience: "all" },
  { id: "file-transfer",    label: "File Transfer",        icon: FolderOpen,    color: "from-pink-500 to-rose-500",     audience: "all" },
  { id: "ai-assistant",     label: "Xulo AI Assistant",    icon: BrainCircuit,  color: "from-fuchsia-500 to-violet-500",audience: "all" },
  { id: "notifications",    label: "Push Notifications",   icon: Bell,          color: "from-yellow-500 to-amber-500",  audience: "all" },
  { id: "security",         label: "Security & Certs",     icon: Shield,        color: "from-rose-500 to-red-500",      audience: "dev" },
  { id: "developer",        label: "Developer Setup",      icon: Terminal,      color: "from-slate-500 to-[#454545]",   audience: "dev" },
  { id: "data",             label: "Data & Privacy",       icon: Database,      color: "from-orange-500 to-teal-500",     audience: "all" },
];

function CodeBlock({ children, dark }: { children: string; dark: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className={`relative my-2 rounded-xl border text-xs font-mono ${dark ? "border-[#454545] bg-[#f3f5f8]" : "border-slate-200 bg-[#1a1a1a]"}`}>
      <pre className="overflow-x-auto px-4 py-3 text-emerald-400 leading-relaxed">{children.trim()}</pre>
      <button
        onClick={() => { void navigator.clipboard.writeText(children.trim()); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
        className="absolute right-2 top-2 rounded p-1 text-slate-500 hover:text-slate-300 transition-colors"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}

function Step({ n, title, children, dark }: { n: number; title: string; children: React.ReactNode; dark: boolean }) {
  return (
    <div className="flex gap-3">
      <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white mt-0.5" style={{ background: "linear-gradient(135deg,#6366f1,#7c3aed)" }}>{n}</div>
      <div className="min-w-0 flex-1">
        <p className={`font-semibold text-sm ${dark ? "text-slate-100" : "text-slate-900"}`}>{title}</p>
        <div className={`mt-1 text-xs leading-relaxed ${dark ? "text-slate-400" : "text-slate-600"}`}>{children}</div>
      </div>
    </div>
  );
}

function Note({ type = "info", children, dark }: { type?: "info" | "warn" | "success"; children: React.ReactNode; dark: boolean }) {
  const cfg = {
    info:    { icon: Info,          border: "border-blue-500/30",   bg: dark ? "bg-orange-500/10"   : "bg-blue-50",   text: dark ? "text-orange-300"   : "text-orange-700" },
    warn:    { icon: AlertTriangle, border: "border-amber-500/30",  bg: dark ? "bg-amber-500/10"  : "bg-amber-50",  text: dark ? "text-amber-300"  : "text-amber-700" },
    success: { icon: CheckCircle2,  border: "border-emerald-500/30",bg: dark ? "bg-emerald-500/10": "bg-emerald-50", text: dark ? "text-emerald-300": "text-emerald-700" },
  }[type];
  const Icon = cfg.icon;
  return (
    <div className={`flex items-start gap-2.5 rounded-xl border px-3.5 py-3 my-2 ${cfg.border} ${cfg.bg}`}>
      <Icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${cfg.text}`} />
      <p className={`text-xs leading-relaxed ${cfg.text}`}>{children}</p>
    </div>
  );
}

function Heading({ children, dark }: { children: React.ReactNode; dark: boolean }) {
  return <h3 className={`mt-5 mb-2 text-sm font-bold uppercase tracking-wide ${dark ? "text-slate-300" : "text-slate-700"}`}>{children}</h3>;
}

// ─── Section content renderers ───────────────────────────────────────────────

function GettingStarted({ dark }: { dark: boolean }) {
  return (
    <div className="space-y-4">
      <p className={`text-sm leading-relaxed ${dark ? "text-slate-300" : "text-slate-700"}`}>
        ONROL Task Manager is a field sales CRM for daily visit execution, pipeline tracking, team coordination, and reporting. Here's the 5-minute orientation.
      </p>
      <Heading dark={dark}>Core Concepts</Heading>
      <div className="grid gap-2 sm:grid-cols-2">
        {[
          { icon: "🗺️", title: "Journey Planner", desc: "Daily visit roadmap — plan, check in, record outcomes" },
          { icon: "📋", title: "Task Dashboard", desc: "All tasks in one view — create, assign, track status" },
          { icon: "🏫", title: "Institution CRM", desc: "School/college pipeline — lead stages, conversion tracking" },
          { icon: "📹", title: "Live Meetings", desc: "Instant video calls with your team — no external tool needed" },
          { icon: "📁", title: "File Transfer", desc: "Send files device-to-device over WebRTC — no cloud needed" },
          { icon: "🤖", title: "Xulo AI", desc: "AI assistant — summarize visits, draft follow-ups, analyze pipeline" },
        ].map((item) => (
          <div key={item.title} className={`rounded-xl border p-3 ${dark ? "border-[#454545] bg-[#404040]/60" : "border-slate-200 bg-slate-50"}`}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base">{item.icon}</span>
              <span className={`text-xs font-semibold ${dark ? "text-slate-100" : "text-slate-800"}`}>{item.title}</span>
            </div>
            <p className={`text-[11px] ${dark ? "text-slate-400" : "text-slate-600"}`}>{item.desc}</p>
          </div>
        ))}
      </div>
      <Heading dark={dark}>User Roles</Heading>
      <div className="space-y-2">
        <div className={`rounded-xl border p-3 ${dark ? "border-violet-500/30 bg-violet-500/10" : "border-violet-200 bg-violet-50"}`}>
          <p className={`text-xs font-bold ${dark ? "text-violet-300" : "text-violet-700"}`}>👑 Admin</p>
          <p className={`text-xs mt-0.5 ${dark ? "text-slate-400" : "text-slate-600"}`}>Full access — create/assign tasks, view all team activity, manage institutions, send notifications, export reports.</p>
        </div>
        <div className={`rounded-xl border p-3 ${dark ? "border-teal-500/30 bg-teal-500/10" : "border-teal-200 bg-teal-50"}`}>
          <p className={`text-xs font-bold ${dark ? "text-teal-300" : "text-teal-700"}`}>👤 Employee</p>
          <p className={`text-xs mt-0.5 ${dark ? "text-slate-400" : "text-slate-600"}`}>Own tasks only — manage daily visits, check in/out with GPS, update task status, use File Transfer and AI.</p>
        </div>
      </div>
    </div>
  );
}

function WebGuide({ dark }: { dark: boolean }) {
  return (
    <div className="space-y-3">
      <p className={`text-sm ${dark ? "text-slate-300" : "text-slate-600"}`}>
        The web version works on any modern browser. You can also install it as a PWA (Progressive Web App) for offline support and a native-like experience.
      </p>
      <Heading dark={dark}>Access</Heading>
      <div className="space-y-3">
        <Step n={1} title="Open in browser" dark={dark}>
          Navigate to your ONROL URL. Use <strong>Chrome</strong> or <strong>Edge</strong> on desktop for the best experience.
        </Step>
        <Step n={2} title="Log in" dark={dark}>
          Enter your email and password. New users should use the <strong>Activate</strong> tab with the email your admin invited.
        </Step>
        <Step n={3} title="Install as PWA (optional)" dark={dark}>
          Click the <strong>Install App</strong> button in the top bar. On mobile Chrome: browser menu → "Add to Home Screen". This enables offline access.
        </Step>
      </div>
      <Heading dark={dark}>Install Android APK from Top Bar</Heading>
      <Note type="info" dark={dark}>
        When an APK is available, a green <strong>Android APK</strong> button appears in the top navigation bar. Tap it to download and install the native app.
      </Note>
      <div className="space-y-3">
        <Step n={1} title="Tap Android APK in the top bar" dark={dark}>The button appears only when your admin has published a new build.</Step>
        <Step n={2} title="Allow unknown sources" dark={dark}>Android Settings → Security → <strong>Install unknown apps</strong> → allow your browser.</Step>
        <Step n={3} title="Install and open" dark={dark}>Tap the downloaded .apk file and install. Log in with your existing credentials.</Step>
      </div>
      <Heading dark={dark}>Keyboard Shortcuts (Desktop)</Heading>
      <div className={`rounded-xl border p-3 space-y-1.5 ${dark ? "border-[#454545] bg-[#404040]/60" : "border-slate-200 bg-slate-50"}`}>
        {[
          ["Ctrl + K", "Command palette"],
          ["Ctrl + N", "New task"],
          ["Ctrl + R", "Refresh workspace"],
          ["Esc",      "Close modal / panel"],
        ].map(([key, desc]) => (
          <div key={key} className="flex items-center gap-3">
            <code className={`rounded px-2 py-0.5 text-[11px] font-mono ${dark ? "bg-[#454545] text-slate-200" : "bg-slate-200 text-slate-800"}`}>{key}</code>
            <span className={`text-xs ${dark ? "text-slate-400" : "text-slate-600"}`}>{desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AndroidGuide({ dark }: { dark: boolean }) {
  return (
    <div className="space-y-3">
      <Note type="info" dark={dark}>
        The Android APK is built with Capacitor 8 and wraps the same web interface. All features work natively — GPS, camera, push notifications.
      </Note>
      <Heading dark={dark}>Install from APK (Sideload)</Heading>
      <div className="space-y-3">
        <Step n={1} title="Enable unknown sources" dark={dark}>
          Settings → Apps → Special app access → <strong>Install unknown apps</strong> → allow Chrome or Files app.
        </Step>
        <Step n={2} title="Download the APK" dark={dark}>
          Open the web app on your phone → tap <strong>Android APK</strong> in the top bar. Or use the link shared by your admin.
        </Step>
        <Step n={3} title="Install and grant permissions" dark={dark}>
          Tap the .apk file in your Downloads → Install. On first launch, grant: <strong>Location</strong>, <strong>Camera</strong>, <strong>Notifications</strong>.
        </Step>
        <Step n={4} title="Log in" dark={dark}>
          Use your regular email and password. The app navigates directly to your dashboard.
        </Step>
      </div>
      <Heading dark={dark}>Enable Push Notifications (Android 13+)</Heading>
      <div className="space-y-3">
        <Step n={1} title="Grant notification permission" dark={dark}>
          On first login in the Android app, a permission dialog appears. Tap <strong>Allow</strong>.
        </Step>
        <Step n={2} title="If you missed it" dark={dark}>
          Settings → Apps → ONROL → Notifications → enable <strong>All ONROL notifications</strong>.
        </Step>
      </div>
      <Heading dark={dark}>Keyboard Not Pushing Content</Heading>
      <Note type="success" dark={dark}>
        Fixed in the latest build. The app uses <code>adjustPan</code> mode so the keyboard never shrinks the screen or resets form fields.
      </Note>
      <Heading dark={dark}>Deep Links</Heading>
      <p className={`text-xs ${dark ? "text-slate-400" : "text-slate-600"}`}>
        Links like <code className={`px-1 rounded ${dark ? "bg-[#454545]" : "bg-slate-200"}`}>onrol://app/task/journey</code> open the Android app directly to the right section.
      </p>
    </div>
  );
}

function AdminGuide({ dark }: { dark: boolean }) {
  return (
    <div className="space-y-3">
      <Heading dark={dark}>Dashboard Overview</Heading>
      <div className="space-y-2 text-xs">
        {[
          ["My / Team toggle", "Switch between your own tasks and all team tasks"],
          ["+ Add Task",       "Create a task and assign it to any team member"],
          ["Advanced Filters", "Filter by employee, status, type, category, priority, date range"],
          ["Calendar view",    "Switch to date-based calendar layout for team scheduling"],
        ].map(([label, desc]) => (
          <div key={label} className={`flex items-start gap-2 rounded-lg border p-2.5 ${dark ? "border-[#454545] bg-[#404040]/50" : "border-slate-200 bg-slate-50"}`}>
            <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-indigo-400" />
            <span>
              <strong className={dark ? "text-slate-200" : "text-slate-800"}>{label}</strong>
              <span className={dark ? " text-slate-400" : " text-slate-600"}> — {desc}</span>
            </span>
          </div>
        ))}
      </div>
      <Heading dark={dark}>Inviting Team Members</Heading>
      <div className="space-y-3">
        <Step n={1} title="Go to Settings" dark={dark}>Click your avatar or Settings in the sidebar.</Step>
        <Step n={2} title="Admin Tools → Invite" dark={dark}>Enter the employee's email and department. Click Send Invite.</Step>
        <Step n={3} title="Employee activates" dark={dark}>They visit the app, go to Activate tab, enter their email + create a password. Role is auto-assigned.</Step>
      </div>
      <Heading dark={dark}>Sending Push Notifications</Heading>
      <p className={`text-xs ${dark ? "text-slate-400" : "text-slate-600"}`}>
        When you create a task and assign it to an employee, they automatically receive a push notification (Android) or browser notification (web) — no extra steps needed.
      </p>
      <Heading dark={dark}>Exporting Reports</Heading>
      <div className="space-y-3">
        <Step n={1} title="Go to Dashboard → ••• menu" dark={dark}>The overflow menu has Export options.</Step>
        <Step n={2} title="Choose format" dark={dark}>CSV or Excel. Exports all visible tasks with current filters applied.</Step>
      </div>
      <Heading dark={dark}>Institution CRM</Heading>
      <div className="space-y-2 text-xs">
        <p className={dark ? "text-slate-400" : "text-slate-600"}>Import institutions via Excel. Template columns: Name, Type, City, Area, Phone, Contact Name, Lead Stage.</p>
        <Note type="info" dark={dark}>Admins can import up to 3000+ institutions at once. Visit history is automatically tracked per institution as employees check in.</Note>
      </div>
    </div>
  );
}

function EmployeeGuide({ dark }: { dark: boolean }) {
  return (
    <div className="space-y-3">
      <Heading dark={dark}>Your Daily Workflow</Heading>
      <div className="space-y-3">
        <Step n={1} title="Open Journey Planner" dark={dark}>Tap Journey in the bottom nav. You'll see today's visits planned by your admin.</Step>
        <Step n={2} title="Start your day" dark={dark}>Tap the first institution → tap <strong>Start</strong> to begin the visit journey.</Step>
        <Step n={3} title="Check In with GPS" dark={dark}>When you arrive, tap <strong>Check In</strong>. Your GPS location is recorded automatically.</Step>
        <Step n={4} title="Record the meeting" dark={dark}>Tap <strong>Meeting Started</strong> when discussion begins, <strong>Meeting Completed</strong> when done.</Step>
        <Step n={5} title="Check Out & Post-Visit" dark={dark}>Tap <strong>Check Out</strong>. A post-visit wizard opens — fill in outcome, follow-up required, notes.</Step>
      </div>
      <Heading dark={dark}>Task Status Meaning</Heading>
      <div className="grid grid-cols-2 gap-2 text-[11px]">
        {[
          ["🔵 Planned", "Scheduled but not started"],
          ["🟡 Ongoing", "Started, in progress"],
          ["🟠 Delayed", "Overdue start date"],
          ["🔴 Overdue", "Past due date"],
          ["✅ Completed", "All steps done"],
          ["🔁 Follow-up", "Needs follow-up action"],
        ].map(([status, desc]) => (
          <div key={status} className={`rounded-lg border p-2 ${dark ? "border-[#454545] bg-[#404040]/50" : "border-slate-200 bg-slate-50"}`}>
            <p className={`font-medium ${dark ? "text-slate-200" : "text-slate-800"}`}>{status}</p>
            <p className={dark ? "text-slate-500" : "text-slate-600"}>{desc}</p>
          </div>
        ))}
      </div>
      <Heading dark={dark}>Offline Mode</Heading>
      <Note type="success" dark={dark}>
        You can check in, update tasks, and log activity with no internet. Actions are queued and sync automatically when you reconnect.
      </Note>
    </div>
  );
}

function JourneyGuide({ dark }: { dark: boolean }) {
  return (
    <div className="space-y-3">
      <p className={`text-sm ${dark ? "text-slate-300" : "text-slate-600"}`}>The Journey Planner organizes your daily field visits into a structured workflow.</p>
      <Heading dark={dark}>Tabs Explained</Heading>
      <div className="space-y-2 text-xs">
        {[
          ["Today",    "Visits scheduled for today only"],
          ["Upcoming", "Future visits in the next 7 days"],
          ["All",      "Every visit task regardless of date"],
        ].map(([tab, desc]) => (
          <div key={tab} className={`flex gap-2 items-start rounded-lg border p-2.5 ${dark ? "border-[#454545] bg-[#404040]/50" : "border-slate-200 bg-slate-50"}`}>
            <span className={`font-semibold ${dark ? "text-slate-200" : "text-slate-800"}`}>{tab}:</span>
            <span className={dark ? "text-slate-400" : "text-slate-600"}>{desc}</span>
          </div>
        ))}
      </div>
      <Heading dark={dark}>Visit Status Flow</Heading>
      <div className={`flex flex-wrap items-center gap-2 text-[11px] rounded-xl border p-3 ${dark ? "border-[#454545] bg-[#404040]/40" : "border-slate-200 bg-slate-50"}`}>
        {["Planned", "→", "Started", "→", "Reached", "→", "In Meeting", "→", "Completed", "→", "Check Out"].map((s, i) => (
          <span key={i} className={s === "→" ? (dark ? "text-slate-600" : "text-slate-400") : `rounded-full px-2 py-0.5 font-medium ${dark ? "bg-[#454545] text-slate-200" : "bg-slate-200 text-slate-700"}`}>{s}</span>
        ))}
      </div>
      <Heading dark={dark}>Daily Progress Widget</Heading>
      <p className={`text-xs ${dark ? "text-slate-400" : "text-slate-600"}`}>
        The right panel shows GOING / ACTIVE / DONE counts. DONE only increments when you complete the full check-out flow.
      </p>
    </div>
  );
}

function FileTransferGuide({ dark }: { dark: boolean }) {
  return (
    <div className="space-y-3">
      <Note type="info" dark={dark}>File Transfer uses peer-to-peer WebRTC — files go directly between devices, no cloud storage needed. Works on the same WiFi and across networks (4G ↔ WiFi) via TURN relay.</Note>
      <Heading dark={dark}>How to Send a File</Heading>
      <div className="space-y-3">
        <Step n={1} title="Both users must be online" dark={dark}>Open the File Transfer section on both devices. Both must be logged in to the same workspace.</Step>
        <Step n={2} title="Select a file" dark={dark}>Click/tap the file drop zone or browse. Any file type, any size.</Step>
        <Step n={3} title="Choose recipient" dark={dark}>Pick a device from the <strong>Online</strong> list. Your own other devices appear under <strong>My Devices</strong>.</Step>
        <Step n={4} title="Wait for acceptance" dark={dark}>The recipient sees an incoming file prompt and taps Accept.</Step>
        <Step n={5} title="Download completes automatically" dark={dark}>The browser saves the file to Downloads once transfer finishes.</Step>
      </div>
      <Heading dark={dark}>Troubleshooting</Heading>
      <div className="space-y-2 text-xs">
        <Note type="warn" dark={dark}><strong>Online list shows 0:</strong> Make sure both devices are on the File Transfer section and logged in. Presence only works while the section is open or the global hook is active.</Note>
        <Note type="warn" dark={dark}><strong>Transfer failed / Error:</strong> If on different networks (4G ↔ WiFi), TURN relay is used. If TURN is blocked by firewall, try switching to the same WiFi.</Note>
        <Note type="info" dark={dark}><strong>Self-transfer:</strong> Log into two devices/browsers with the same account. Your second device appears under "My Devices" in green.</Note>
      </div>
    </div>
  );
}

function AIGuide({ dark }: { dark: boolean }) {
  return (
    <div className="space-y-3">
      <p className={`text-sm ${dark ? "text-slate-300" : "text-slate-600"}`}>Xulo is your AI sales assistant — it understands your pipeline context and can answer questions, draft messages, and generate reports.</p>
      <Heading dark={dark}>Opening Xulo</Heading>
      <p className={`text-xs ${dark ? "text-slate-400" : "text-slate-600"}`}>Tap the pulsing <strong>✦ button</strong> in the bottom-right corner of any screen.</p>
      <Heading dark={dark}>Quick Actions</Heading>
      <div className="grid grid-cols-2 gap-2 text-[11px]">
        {[
          ["Today's summary",     "Overview of visit progress"],
          ["Follow-up email",     "Drafts a follow-up template"],
          ["Suggest next actions","Priority recommendations"],
          ["Weekly report",       "Activity report for the week"],
          ["Pipeline analysis",   "Hot leads and conversion stats"],
          ["Overdue review",      "Lists and prioritizes overdue tasks"],
          ["Schedule optimize",   "Best time slots for your visits"],
          ["Conversion insights", "What to focus on to close deals"],
        ].map(([a, d]) => (
          <div key={a} className={`rounded-lg border p-2 ${dark ? "border-[#454545] bg-[#404040]/50" : "border-slate-200 bg-slate-50"}`}>
            <p className={`font-medium ${dark ? "text-slate-200" : "text-slate-800"}`}>{a}</p>
            <p className={dark ? "text-slate-500" : "text-slate-600"}>{d}</p>
          </div>
        ))}
      </div>
      <Heading dark={dark}>Custom Questions</Heading>
      <p className={`text-xs ${dark ? "text-slate-400" : "text-slate-600"}`}>Type any question in the chat box. Examples:</p>
      <div className={`space-y-1 rounded-xl border p-3 ${dark ? "border-[#454545] bg-[#404040]/40" : "border-slate-200 bg-slate-50"}`}>
        {["Which schools haven't been visited in 2 weeks?", "Draft a proposal email for Delhi Public School", "What's my conversion rate this month?"].map((q) => (
          <p key={q} className={`text-[11px] pl-2 border-l-2 border-indigo-500 ${dark ? "text-slate-400" : "text-slate-600"}`}>{q}</p>
        ))}
      </div>
    </div>
  );
}

function NotificationsGuide({ dark }: { dark: boolean }) {
  return (
    <div className="space-y-3">
      <Heading dark={dark}>Web Push (VAPID)</Heading>
      <div className="space-y-3">
        <Step n={1} title="Allow notifications in browser" dark={dark}>Settings → Notifications & Smart Reminders → toggle Push Reminders → browser prompts for permission → click Allow.</Step>
        <Step n={2} title="Test it works" dark={dark}>Settings → click <strong>Send Test Notification</strong>. You should receive a notification immediately.</Step>
      </div>
      <Note type="warn" dark={dark}>Web push requires the VAPID key to be configured. If your admin hasn't set up VITE_VAPID_PUBLIC_KEY, the button will show an error — contact your system admin.</Note>
      <Heading dark={dark}>Android FCM Push</Heading>
      <div className="space-y-3">
        <Step n={1} title="Install the Android app" dark={dark}>See Android App section.</Step>
        <Step n={2} title="Log in and allow notifications" dark={dark}>On first login, tap Allow in the notification permission dialog. Your FCM token is registered automatically.</Step>
        <Step n={3} title="Receive task assignments" dark={dark}>When an admin assigns a task to you, you receive a push notification — even with the app closed.</Step>
      </div>
    </div>
  );
}

function SecurityGuide({ dark }: { dark: boolean }) {
  return (
    <div className="space-y-3">
      <Heading dark={dark}>Security Headers (Added Automatically)</Heading>
      <p className={`text-xs ${dark ? "text-slate-400" : "text-slate-600"}`}>The web server (.htaccess) includes these headers on every response:</p>
      <div className={`rounded-xl border p-3 space-y-2 text-xs ${dark ? "border-[#454545] bg-[#404040]/60" : "border-slate-200 bg-slate-50"}`}>
        {[
          ["HSTS",              "Forces HTTPS for 1 year. No HTTP downgrade attacks."],
          ["X-Frame-Options",   "Blocks the site from being embedded in iframes (clickjacking protection)."],
          ["X-Content-Type",    "Prevents MIME-sniffing attacks."],
          ["Referrer-Policy",   "Controls what referrer is sent when navigating away."],
          ["Permissions-Policy","Restricts camera/microphone/location to same origin only."],
          ["CSP",               "Content Security Policy — allows only trusted script/style sources."],
        ].map(([h, d]) => (
          <div key={h}>
            <span className={`font-mono font-semibold ${dark ? "text-emerald-400" : "text-emerald-700"}`}>{h}:</span>
            <span className={dark ? " text-slate-400" : " text-slate-600"}> {d}</span>
          </div>
        ))}
      </div>
      <Heading dark={dark}>Android Release Keystore</Heading>
      <Note type="info" dark={dark}>Run this once to generate a signing key. Keep the .keystore file safe — you can never change it after publishing to Play Store.</Note>
      <CodeBlock dark={dark}>{`keytool -genkey -v \\
  -keystore android/onrol-release.keystore \\
  -alias onrol \\
  -keyalg RSA -keysize 2048 -validity 10000`}</CodeBlock>
      <p className={`text-xs ${dark ? "text-slate-400" : "text-slate-600"}`}>Run this in your project root terminal (Command Prompt / PowerShell / bash). Then create <code>android/keystore.properties</code>:</p>
      <CodeBlock dark={dark}>{`ONROL_KEYSTORE_PATH=../onrol-release.keystore
ONROL_KEY_ALIAS=onrol
ONROL_STORE_PASSWORD=yourpassword
ONROL_KEY_PASSWORD=yourpassword`}</CodeBlock>
      <Note type="warn" dark={dark}>Never commit keystore.properties or the .keystore file to git. They are already in .gitignore.</Note>
      <Heading dark={dark}>Build Signed APK</Heading>
      <CodeBlock dark={dark}>{`npm run android:release`}</CodeBlock>
      <p className={`text-xs ${dark ? "text-slate-400" : "text-slate-600"}`}>Output APK: <code>android/app/build/outputs/apk/release/app-release.apk</code></p>
      <Heading dark={dark}>Supabase RLS</Heading>
      <p className={`text-xs ${dark ? "text-slate-400" : "text-slate-600"}`}>Every table uses Row Level Security. Users can only read/write their own rows. Admins and service roles have elevated access via separate policies.</p>
    </div>
  );
}

function DeveloperGuide({ dark }: { dark: boolean }) {
  return (
    <div className="space-y-3">
      <Heading dark={dark}>Where to Run Commands</Heading>
      <Note type="info" dark={dark}>
        All commands run in a <strong>terminal</strong> (Command Prompt, PowerShell, or VS Code terminal) opened at the project root folder — the folder that contains package.json.
      </Note>
      <Heading dark={dark}>Environment Variables</Heading>
      <p className={`text-xs ${dark ? "text-slate-400" : "text-slate-600"}`}>Create a <code>.env</code> file in the project root (copy from .env.example):</p>
      <CodeBlock dark={dark}>{`VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_VAPID_PUBLIC_KEY=your_vapid_public_key
VITE_APK_DOWNLOAD_URL=https://your-url/app-release.apk

# Server-side (for push API)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_SUBJECT=mailto:info@onrol.in`}</CodeBlock>
      <Heading dark={dark}>Deploy Edge Function</Heading>
      <p className={`text-xs ${dark ? "text-slate-400" : "text-slate-600"}`}>Run in project root terminal (requires Supabase CLI installed):</p>
      <CodeBlock dark={dark}>{`supabase functions deploy send-push
supabase secrets set FCM_SERVER_KEY=your_firebase_server_key`}</CodeBlock>
      <Heading dark={dark}>Run Database Migrations</Heading>
      <CodeBlock dark={dark}>{`supabase db push
# or manually run each .sql file in the Supabase SQL editor`}</CodeBlock>
      <Heading dark={dark}>Development Server</Heading>
      <CodeBlock dark={dark}>{`npm install        # first time only
npm run dev        # starts at http://localhost:8080`}</CodeBlock>
      <Heading dark={dark}>Android Development Build</Heading>
      <CodeBlock dark={dark}>{`npm run android:build    # build + sync to Android
npm run android:open     # open in Android Studio
npm run android:run      # build + sync + run on device`}</CodeBlock>
      <Heading dark={dark}>Web Deployment</Heading>
      <CodeBlock dark={dark}>{`npm run build      # builds to dist/
npm run deploy     # build + deploy via deploy.ps1`}</CodeBlock>
      <Heading dark={dark}>Required Android SDK Components</Heading>
      <CodeBlock dark={dark}>{`set JAVA_HOME=C:\\Program Files\\Eclipse Adoptium\\jdk-21.0.10.7-hotspot
set ANDROID_HOME=C:\\android

C:\\android\\cmdline-tools\\latest\\bin\\sdkmanager.bat ^
  "platform-tools" ^
  "platforms;android-35" ^
  "build-tools;35.0.0"`}</CodeBlock>
      <Note type="info" dark={dark}>Use <strong>JDK 21 LTS</strong> only. Capacitor's Gradle 8.x does not support JDK 25.</Note>
    </div>
  );
}

function DataGuide({ dark }: { dark: boolean }) {
  return (
    <div className="space-y-3">
      <Heading dark={dark}>What Data Is Stored</Heading>
      <div className="space-y-2 text-xs">
        {[
          ["Tasks & visits",         "Your task titles, dates, statuses, visit check-in GPS coordinates"],
          ["Institutions",           "School/college names, contact info, lead stage, visit history"],
          ["Profile",                "Name, department, email, role, profile photo URL"],
          ["Push tokens",            "FCM token (Android) or VAPID subscription (web) for notifications"],
          ["Activity events",        "Audit trail of task changes, check-ins, completions"],
          ["Messages",               "Messenger conversations and attachments (stored in Supabase)"],
          ["Offline queue",          "Pending actions stored in your browser's IndexedDB (local only)"],
        ].map(([type, desc]) => (
          <div key={type} className={`rounded-lg border p-2.5 ${dark ? "border-[#454545] bg-[#404040]/50" : "border-slate-200 bg-slate-50"}`}>
            <span className={`font-semibold ${dark ? "text-slate-200" : "text-slate-800"}`}>{type}: </span>
            <span className={dark ? "text-slate-400" : "text-slate-600"}>{desc}</span>
          </div>
        ))}
      </div>
      <Heading dark={dark}>Data Rights</Heading>
      <Note type="info" dark={dark}>
        You can request export or deletion of your data at any time. Contact <strong>info@onrol.in</strong>. Admins can delete employees from the workspace which removes their task records.
      </Note>
      <Heading dark={dark}>Where Data Lives</Heading>
      <p className={`text-xs ${dark ? "text-slate-400" : "text-slate-600"}`}>
        All production data is stored in <strong>Supabase</strong> (PostgreSQL) hosted on AWS infrastructure in the selected region. Data is encrypted at rest and in transit (TLS 1.2+).
      </p>
    </div>
  );
}

const CONTENT_MAP: Record<string, (dark: boolean) => React.ReactNode> = {
  "getting-started":  (d) => <GettingStarted dark={d} />,
  "web":              (d) => <WebGuide dark={d} />,
  "android":          (d) => <AndroidGuide dark={d} />,
  "admin-guide":      (d) => <AdminGuide dark={d} />,
  "employee-guide":   (d) => <EmployeeGuide dark={d} />,
  "journey-planner":  (d) => <JourneyGuide dark={d} />,
  "file-transfer":    (d) => <FileTransferGuide dark={d} />,
  "ai-assistant":     (d) => <AIGuide dark={d} />,
  "notifications":    (d) => <NotificationsGuide dark={d} />,
  "security":         (d) => <SecurityGuide dark={d} />,
  "developer":        (d) => <DeveloperGuide dark={d} />,
  "data":             (d) => <DataGuide dark={d} />,
};

export default function UserGuide({ uiTheme, userRole, onClose }: UserGuideProps) {
  const dark = uiTheme === "dark";
  const [activeSection, setActiveSection] = useState("getting-started");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const visibleSections = SECTIONS.filter(
    (s) => s.audience === "all" || s.audience === userRole || s.audience === "dev",
  );

  const current = visibleSections.find((s) => s.id === activeSection) ?? visibleSections[0];

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div
        className={`relative z-10 flex w-full max-w-4xl rounded-3xl border shadow-2xl overflow-hidden ${dark ? "border-[#454545] bg-[#1a1a1a]" : "border-slate-200 bg-white"}`}
        style={{ height: "min(90vh, 680px)" }}
      >
        {/* Left nav */}
        <div className={`hidden md:flex w-52 flex-shrink-0 flex-col border-r ${dark ? "border-[#404040] bg-[#f3f5f8]/80" : "border-slate-200 bg-slate-50"}`}>
          <div className="flex items-center gap-2.5 px-4 py-4 border-b flex-shrink-0" style={{ borderColor: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}>
            <BookOpen className={`h-4 w-4 ${dark ? "text-indigo-400" : "text-indigo-600"}`} />
            <span className={`text-sm font-bold ${dark ? "text-slate-100" : "text-slate-900"}`}>User Guide</span>
          </div>
          <div className="flex-1 overflow-y-auto py-2 px-2">
            {visibleSections.map((s) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-medium transition-all ${
                    activeSection === s.id
                      ? dark
                        ? "bg-indigo-600/20 text-indigo-300"
                        : "bg-indigo-50 text-indigo-700"
                      : dark
                      ? "text-slate-400 hover:bg-[#404040] hover:text-slate-200"
                      : "text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                  }`}
                >
                  <div className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md bg-gradient-to-br ${s.color}`}>
                    <Icon className="h-2.5 w-2.5 text-white" />
                  </div>
                  {s.label}
                </button>
              );
            })}
          </div>
          <div className={`px-4 py-3 border-t text-[10px] ${dark ? "border-[#404040] text-slate-600" : "border-slate-200 text-slate-400"}`}>
            ONROL v1.0 · Last updated Apr 2026
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-1 flex-col min-w-0">
          {/* Header */}
          <div className={`flex flex-shrink-0 items-center justify-between border-b px-5 py-3.5 ${dark ? "border-[#404040]" : "border-slate-200"}`}>
            <div className="flex items-center gap-3">
              {/* Mobile section picker */}
              <button
                onClick={() => setMobileMenuOpen((v) => !v)}
                className={`md:hidden flex items-center gap-1.5 text-sm font-semibold ${dark ? "text-slate-200" : "text-slate-800"}`}
              >
                {current && <current.icon className="h-4 w-4 text-indigo-400" />}
                {current?.label}
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${mobileMenuOpen ? "rotate-180" : ""}`} />
              </button>
              <div className="hidden md:flex items-center gap-2.5">
                {current && (
                  <>
                    <div className={`flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-br ${current.color}`}>
                      <current.icon className="h-3.5 w-3.5 text-white" />
                    </div>
                    <h2 className={`text-base font-bold ${dark ? "text-slate-100" : "text-slate-900"}`}>{current.label}</h2>
                  </>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className={`rounded-xl p-2 transition-colors ${dark ? "text-slate-400 hover:bg-[#404040] hover:text-slate-200" : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"}`}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Mobile section picker dropdown */}
          {mobileMenuOpen && (
            <div className={`absolute top-16 left-0 right-0 z-20 border-b shadow-lg md:hidden ${dark ? "border-[#454545] bg-[#f3f5f8]" : "border-slate-200 bg-white"}`}>
              {visibleSections.map((s) => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.id}
                    onClick={() => { setActiveSection(s.id); setMobileMenuOpen(false); }}
                    className={`flex w-full items-center gap-3 px-5 py-3 text-left text-sm ${
                      activeSection === s.id
                        ? dark ? "bg-indigo-600/20 text-indigo-300" : "bg-indigo-50 text-indigo-700"
                        : dark ? "text-slate-300 hover:bg-[#404040]" : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <div className={`flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-br ${s.color}`}>
                      <Icon className="h-2.5 w-2.5 text-white" />
                    </div>
                    {s.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {CONTENT_MAP[activeSection]?.(dark)}
          </div>

          {/* Footer */}
          <div className={`flex flex-shrink-0 items-center justify-between border-t px-5 py-3 ${dark ? "border-[#404040]" : "border-slate-200"}`}>
            <p className={`text-[10px] ${dark ? "text-slate-600" : "text-slate-400"}`}>
              ONROL Task Manager · Field Sales CRM
            </p>
            <a href="mailto:info@onrol.in" className="text-[10px] text-indigo-400 hover:text-indigo-300 transition-colors">
              info@onrol.in
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
