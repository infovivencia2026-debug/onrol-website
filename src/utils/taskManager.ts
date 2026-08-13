import type { User } from "@supabase/supabase-js";
import type {
  Status,
  VisitStatus,
  VisitOutcome,
  FollowUpType,
  FollowUpStatus,
  Priority,
  OfficeUser,
  OfficeTask,
  InstitutionDraft,
  ImportRow,
} from "@/types/taskManager";

export const statusLabels: Record<Status, string> = {
  not_started: "Not Started",
  ongoing: "Ongoing",
  completed: "Completed",
  delayed: "Delayed",
};

export const visitStatusLabels: Record<VisitStatus, string> = {
  planned: "Planned",
  reached: "Reached",
  in_meeting: "In Meeting",
  completed: "Completed",
  followup_pending: "Follow-up Pending",
  rescheduled: "Rescheduled",
  closed_lost: "Closed Lost",
};

export const canAccessJourneyPlanner = (user: OfficeUser | null | undefined) => {
  if (!user) return false;
  if (user.role === "admin") return true;
  const department = (user.department || "").toLowerCase();
  return department.includes("sales") || department.includes("trainee");
};

export const getVisitStatusLabelForTask = (task: OfficeTask) => {
  if (task.status === "ongoing" && (task.visit_status || "planned") === "planned") {
    return task.started_at ? "Started" : "Planned";
  }
  return visitStatusLabels[(task.visit_status || "planned") as VisitStatus] || "Planned";
};

export const getJourneyStageIndex = (task: OfficeTask) => {
  if (task.status === "completed" || task.visit_status === "completed" || task.visit_status === "closed_lost") return 4;
  if (task.visit_status === "followup_pending") return 4;
  if (task.visit_status === "in_meeting") return 3;
  if (task.visit_status === "reached") return 2;
  if (task.status === "ongoing" || Boolean(task.started_at)) return 1;
  return 0;
};

export const visitOutcomeLabels: Record<VisitOutcome, string> = {
  interested: "Interested",
  need_proposal: "Need Proposal",
  need_demo: "Need Demo",
  call_later: "Call Later",
  not_interested: "Not Interested",
  revisit_required: "Revisit Required",
  met_wrong_person: "Met Wrong Person",
  decision_maker_not_available: "DM Not Available",
};

export const followUpTypeLabels: Record<FollowUpType, string> = {
  call: "Call",
  whatsapp: "WhatsApp",
  email: "Email",
  visit: "Visit",
  demo: "Demo",
  proposal: "Proposal",
};

export const followUpStatusLabels: Record<FollowUpStatus, string> = {
  pending: "Pending",
  done: "Done",
  missed: "Missed",
  rescheduled: "Rescheduled",
};

export const brandFieldConfig = {
  Vivencia: {
    title: "Vivencia Interest",
    programInterest: ["entrepreneurship", "financial_literacy", "ai_robotics", "workshop", "teacher_training", "curriculum_integration"],
    audienceType: ["students", "teachers", "school_management", "parents"],
    groupField: "class_group" as const,
    groupLabel: "Class Group",
    groupOptions: ["grades_1_5", "grades_6_8", "grades_9_10", "grades_11_12"],
    discussionStage: ["introduction_done", "concept_explained", "proposal_expected", "pilot_discussed", "followup_needed"],
    flagsField: "special_flags" as const,
    flagsLabel: "Special Opportunity Flags",
    flagsOptions: ["guest_talk_interest", "parent_session_interest", "lab_interest", "teacher_training_interest", "exhibition_interest"],
  },
  ONROL: {
    title: "ONROL Interest",
    programInterest: ["ai_workshop", "bootcamp", "masterclass", "placement_program", "faculty_session", "campus_partnership"],
    audienceType: ["students", "faculty", "tpo", "hod", "management"],
    groupField: "department_group" as const,
    groupLabel: "Department / Target Group",
    groupOptions: ["cse", "it", "ai_ml", "data_science", "ece", "all_departments"],
    discussionStage: ["introduction_done", "workshop_discussed", "proposal_expected", "partnership_discussed", "followup_needed"],
    flagsField: "opportunity_flags" as const,
    flagsLabel: "Opportunity Flags",
    flagsOptions: ["bootcamp_interest", "masterclass_interest", "placement_support_interest", "faculty_enablement_interest", "campus_activation_interest"],
  },
} as const;

export const formatChipLabel = (value: string) =>
  value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());

export const formatNotificationTypeLabel = (value: string) => {
  const normalized = (value || "").toLowerCase();
  if (normalized === "task") return "Message";
  if (normalized === "visit") return "Visit";
  if (normalized === "follow_up") return "Follow-up";
  if (normalized === "admin_alert") return "Admin Alert";
  if (normalized === "system_suggestion") return "Suggestion";
  if (normalized === "automation") return "Automation";
  if (normalized === "system") return "System";
  return formatChipLabel(value || "notification");
};

export const normalizeInstitutionName = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const normalizeIsoDateInput = (value: string | null | undefined): string => {
  const raw = String(value || "").trim();
  if (!raw) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  const slashMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const day = Number(slashMatch[1]);
    const month = Number(slashMatch[2]);
    const year = Number(slashMatch[3]);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
  }

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, "0");
    const day = String(parsed.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  return "";
};

export const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return fallback;
};

export const isMessengerSchemaMissingError = (error: unknown): boolean => {
  if (!error || typeof error !== "object") return false;

  const maybeCode = "code" in error ? (error as { code?: unknown }).code : undefined;
  if (typeof maybeCode === "string" && maybeCode.toUpperCase() === "42P01") return true;

  const maybeMessage = "message" in error ? (error as { message?: unknown }).message : undefined;
  if (typeof maybeMessage !== "string") return false;

  const lower = maybeMessage.toLowerCase();
  return (
    lower.includes("relation") &&
    lower.includes("does not exist") &&
    (lower.includes("conversation_members") || lower.includes("conversations") || lower.includes("messages"))
  );
};

export const createDefaultInstitutionDraft = (): InstitutionDraft => ({
  name: "",
  institutionType: "School",
  city: "",
  area: "",
  address: "",
  contactName: "",
  contactPhone: "",
  brandRelevance: "both",
});

export const ensureInstitutionDraft = (draft?: InstitutionDraft): InstitutionDraft => draft ?? createDefaultInstitutionDraft();

export const statusClass: Record<Status, string> = {
  not_started: "bg-slate-100 text-slate-700 border-slate-200",
  ongoing: "bg-blue-100 text-orange-700 border-orange-200",
  completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
  delayed: "bg-rose-100 text-rose-700 border-rose-200",
};

export const priorityClass: Record<Priority, string> = {
  high: "bg-rose-100 text-rose-700 border-rose-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  low: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

export const resolveDisplayName = (user: User) => {
  return (
    (typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null) ||
    (typeof user.user_metadata?.name === "string" ? user.user_metadata.name : null) ||
    user.email?.split("@")[0] ||
    "ONROL User"
  );
};

export const raceWithTimeout = async <T,>(promise: PromiseLike<T>, timeoutMs: number, timeoutLabel: string): Promise<T> => {
  let timer: ReturnType<typeof setTimeout> | null = null;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(timeoutLabel)), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
};

export const expectedHeaders = [
  "Date",
  "Weekday",
  "Theme",
  "9:45-10:15",
  "10:20-12:20",
  "2:00-3:00",
  "3:00-5:30 (Heavy Ops Work)",
  "5:30-6:00",
  "Evening",
  "Key Deliverables / Notes",
];

export const normalizeHeader = (value: string) =>
  value
    .toLowerCase()
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();

export const parseCsvLine = (line: string) => {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];
    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      i += 1;
      continue;
    }
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }
  result.push(current.trim());
  return result;
};

export const parseScheduleText = (rawText: string) => {
  const text = rawText.replace(/\r\n/g, "\n").trim();
  if (!text) return { rows: [] as ImportRow[], error: "Empty file." };

  const lines = text.split("\n").filter((line) => line.trim().length > 0);
  if (!lines.length) return { rows: [] as ImportRow[], error: "No rows found." };

  const headerLine = lines[0];
  const delimiter = headerLine.includes("\t") ? "\t" : ",";
  const split = (line: string) => (delimiter === "\t" ? line.split("\t").map((v) => v.trim()) : parseCsvLine(line));
  const headers = split(headerLine);

  const headerMap = headers.map(normalizeHeader);
  const missingHeaders = expectedHeaders.filter((h) => !headerMap.includes(normalizeHeader(h)));
  if (missingHeaders.length) {
    return { rows: [] as ImportRow[], error: `Missing headers: ${missingHeaders.join(", ")}` };
  }

  const findIdx = (name: string) => headerMap.findIndex((h) => h === normalizeHeader(name));
  const idx = {
    date: findIdx("Date"),
    weekday: findIdx("Weekday"),
    theme: findIdx("Theme"),
    slot9451015: findIdx("9:45-10:15"),
    slot10201220: findIdx("10:20-12:20"),
    slot200300: findIdx("2:00-3:00"),
    slot300530: findIdx("3:00-5:30 (Heavy Ops Work)"),
    slot530600: findIdx("5:30-6:00"),
    evening: findIdx("Evening"),
    notes: findIdx("Key Deliverables / Notes"),
  };

  const rows: ImportRow[] = [];
  for (let i = 1; i < lines.length; i += 1) {
    const cols = split(lines[i]);
    const date = cols[idx.date] ?? "";
    const theme = cols[idx.theme] ?? "";
    if (!date || !theme) continue;
    rows.push({
      date,
      weekday: cols[idx.weekday] ?? "",
      theme,
      slot9451015: cols[idx.slot9451015] ?? "",
      slot10201220: cols[idx.slot10201220] ?? "",
      slot200300: cols[idx.slot200300] ?? "",
      slot300530: cols[idx.slot300530] ?? "",
      slot530600: cols[idx.slot530600] ?? "",
      evening: cols[idx.evening] ?? "",
      notes: cols[idx.notes] ?? "",
    });
  }

  return { rows };
};
