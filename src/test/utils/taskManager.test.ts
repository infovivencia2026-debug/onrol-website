import { describe, it, expect } from "vitest";

import {
  statusLabels,
  visitOutcomeLabels,
  followUpTypeLabels,
  statusClass,
  priorityClass,
  formatChipLabel,
  formatNotificationTypeLabel,
  normalizeInstitutionName,
  getErrorMessage,
  isMessengerSchemaMissingError,
  createDefaultInstitutionDraft,
  ensureInstitutionDraft,
  resolveDisplayName,
  raceWithTimeout,
  normalizeHeader,
  parseCsvLine,
  parseScheduleText,
  getJourneyStageIndex,
  getVisitStatusLabelForTask,
  canAccessJourneyPlanner,
  expectedHeaders,
} from "@/utils/taskManager";

import type { OfficeTask, OfficeUser } from "@/types/taskManager";
import type { User } from "@supabase/supabase-js";

/* ------------------------------------------------------------------ */
/*  Helper factories                                                   */
/* ------------------------------------------------------------------ */

const makeTask = (overrides: Partial<OfficeTask> = {}): OfficeTask =>
  ({
    id: "t1",
    user_id: "u1",
    task_title: "Test",
    description: "",
    task_type: "planned",
    priority: "medium",
    status: "not_started",
    assigned_date: "2026-01-01",
    due_date: null,
    started_at: null,
    completed_at: null,
    remarks: null,
    blockers: null,
    completion_note: null,
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
    ...overrides,
  }) as OfficeTask;

const makeUser = (overrides: Partial<OfficeUser> = {}): OfficeUser => ({
  id: "u1",
  full_name: "Test User",
  email: "test@example.com",
  role: "employee",
  department: null,
  is_active: true,
  ...overrides,
});

const makeSupabaseUser = (meta: Record<string, unknown> = {}, email?: string): User =>
  ({
    id: "su1",
    app_metadata: {},
    user_metadata: meta,
    aud: "authenticated",
    created_at: "",
    email,
  }) as unknown as User;

/* ------------------------------------------------------------------ */
/*  formatChipLabel                                                    */
/* ------------------------------------------------------------------ */

describe("formatChipLabel", () => {
  it("converts snake_case to Title Case", () => {
    expect(formatChipLabel("hello_world")).toBe("Hello World");
  });

  it("capitalises single word", () => {
    expect(formatChipLabel("pending")).toBe("Pending");
  });

  it("handles multiple underscores", () => {
    expect(formatChipLabel("a_b_c_d")).toBe("A B C D");
  });

  it("handles already capitalised input", () => {
    expect(formatChipLabel("Already_Good")).toBe("Already Good");
  });
});

/* ------------------------------------------------------------------ */
/*  formatNotificationTypeLabel                                        */
/* ------------------------------------------------------------------ */

describe("formatNotificationTypeLabel", () => {
  it('returns "Message" for "task"', () => {
    expect(formatNotificationTypeLabel("task")).toBe("Message");
  });

  it('returns "Visit" for "visit"', () => {
    expect(formatNotificationTypeLabel("visit")).toBe("Visit");
  });

  it('returns "Follow-up" for "follow_up"', () => {
    expect(formatNotificationTypeLabel("follow_up")).toBe("Follow-up");
  });

  it('returns "Admin Alert" for "admin_alert"', () => {
    expect(formatNotificationTypeLabel("admin_alert")).toBe("Admin Alert");
  });

  it('returns "Suggestion" for "system_suggestion"', () => {
    expect(formatNotificationTypeLabel("system_suggestion")).toBe("Suggestion");
  });

  it('returns "Automation" for "automation"', () => {
    expect(formatNotificationTypeLabel("automation")).toBe("Automation");
  });

  it('returns "System" for "system"', () => {
    expect(formatNotificationTypeLabel("system")).toBe("System");
  });

  it("falls back to formatChipLabel for unknown types", () => {
    expect(formatNotificationTypeLabel("custom_type")).toBe("Custom Type");
  });

  it('falls back to "Notification" for empty string', () => {
    expect(formatNotificationTypeLabel("")).toBe("Notification");
  });
});

/* ------------------------------------------------------------------ */
/*  normalizeInstitutionName                                           */
/* ------------------------------------------------------------------ */

describe("normalizeInstitutionName", () => {
  it("lowercases the input", () => {
    expect(normalizeInstitutionName("ABC")).toBe("abc");
  });

  it("replaces special characters with spaces", () => {
    expect(normalizeInstitutionName("St.Mary's")).toBe("st mary s");
  });

  it("collapses multiple whitespace", () => {
    expect(normalizeInstitutionName("  hello   world  ")).toBe("hello world");
  });

  it("handles combined scenarios", () => {
    expect(normalizeInstitutionName("Delhi Public School (R.K. Puram)")).toBe(
      "delhi public school r k puram"
    );
  });
});

/* ------------------------------------------------------------------ */
/*  getErrorMessage                                                    */
/* ------------------------------------------------------------------ */

describe("getErrorMessage", () => {
  it("returns message from Error instance", () => {
    expect(getErrorMessage(new Error("boom"), "fallback")).toBe("boom");
  });

  it("returns message from plain object with message property", () => {
    expect(getErrorMessage({ message: "oops" }, "fallback")).toBe("oops");
  });

  it("returns fallback when error is null", () => {
    expect(getErrorMessage(null, "fallback")).toBe("fallback");
  });

  it("returns fallback when error is a string", () => {
    expect(getErrorMessage("str", "fallback")).toBe("fallback");
  });

  it("returns fallback when message is empty string", () => {
    expect(getErrorMessage({ message: "  " }, "fallback")).toBe("fallback");
  });

  it("returns fallback for Error with empty message", () => {
    expect(getErrorMessage(new Error(""), "fallback")).toBe("fallback");
  });
});

/* ------------------------------------------------------------------ */
/*  isMessengerSchemaMissingError                                      */
/* ------------------------------------------------------------------ */

describe("isMessengerSchemaMissingError", () => {
  it("returns true for code 42P01", () => {
    expect(isMessengerSchemaMissingError({ code: "42P01" })).toBe(true);
  });

  it("returns true for lowercase code 42p01", () => {
    expect(isMessengerSchemaMissingError({ code: "42p01" })).toBe(true);
  });

  it("returns true when message mentions conversations does not exist", () => {
    expect(
      isMessengerSchemaMissingError({
        message: 'relation "conversations" does not exist',
      })
    ).toBe(true);
  });

  it("returns true when message mentions messages does not exist", () => {
    expect(
      isMessengerSchemaMissingError({
        message: 'relation "messages" does not exist',
      })
    ).toBe(true);
  });

  it("returns true when message mentions conversation_members does not exist", () => {
    expect(
      isMessengerSchemaMissingError({
        message: 'relation "conversation_members" does not exist',
      })
    ).toBe(true);
  });

  it("returns false for unrelated error", () => {
    expect(isMessengerSchemaMissingError({ message: "syntax error" })).toBe(false);
  });

  it("returns false for null", () => {
    expect(isMessengerSchemaMissingError(null)).toBe(false);
  });

  it("returns false for non-object", () => {
    expect(isMessengerSchemaMissingError("string")).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/*  createDefaultInstitutionDraft                                      */
/* ------------------------------------------------------------------ */

describe("createDefaultInstitutionDraft", () => {
  it("returns correct default values", () => {
    const draft = createDefaultInstitutionDraft();
    expect(draft).toEqual({
      name: "",
      institutionType: "School",
      city: "",
      area: "",
      address: "",
      contactName: "",
      contactPhone: "",
      brandRelevance: "both",
    });
  });

  it("returns a new object each call", () => {
    const a = createDefaultInstitutionDraft();
    const b = createDefaultInstitutionDraft();
    expect(a).not.toBe(b);
  });
});

/* ------------------------------------------------------------------ */
/*  ensureInstitutionDraft                                             */
/* ------------------------------------------------------------------ */

describe("ensureInstitutionDraft", () => {
  it("returns default when undefined", () => {
    expect(ensureInstitutionDraft(undefined)).toEqual(createDefaultInstitutionDraft());
  });

  it("returns provided draft when given", () => {
    const custom = {
      name: "Test",
      institutionType: "College" as const,
      city: "Hyderabad",
      area: "Madhapur",
      address: "123 St",
      contactName: "Alice",
      contactPhone: "9999999999",
      brandRelevance: "onrol" as const,
    };
    expect(ensureInstitutionDraft(custom)).toBe(custom);
  });
});

/* ------------------------------------------------------------------ */
/*  resolveDisplayName                                                 */
/* ------------------------------------------------------------------ */

describe("resolveDisplayName", () => {
  it("returns full_name when present", () => {
    expect(resolveDisplayName(makeSupabaseUser({ full_name: "Alice B" }))).toBe("Alice B");
  });

  it("returns name when full_name is absent", () => {
    expect(resolveDisplayName(makeSupabaseUser({ name: "Bob" }))).toBe("Bob");
  });

  it("returns email prefix when no name metadata", () => {
    expect(resolveDisplayName(makeSupabaseUser({}, "charlie@example.com"))).toBe("charlie");
  });

  it('returns "ONROL User" as ultimate fallback', () => {
    expect(resolveDisplayName(makeSupabaseUser({}))).toBe("ONROL User");
  });
});

/* ------------------------------------------------------------------ */
/*  raceWithTimeout                                                    */
/* ------------------------------------------------------------------ */

describe("raceWithTimeout", () => {
  it("resolves when promise finishes before timeout", async () => {
    const result = await raceWithTimeout(Promise.resolve("ok"), 1000, "timed out");
    expect(result).toBe("ok");
  });

  it("rejects when promise exceeds timeout", async () => {
    const slow = new Promise<string>((resolve) => setTimeout(() => resolve("late"), 500));
    await expect(raceWithTimeout(slow, 10, "timed out")).rejects.toThrow("timed out");
  });
});

/* ------------------------------------------------------------------ */
/*  normalizeHeader                                                    */
/* ------------------------------------------------------------------ */

describe("normalizeHeader", () => {
  it("lowercases input", () => {
    expect(normalizeHeader("HELLO")).toBe("hello");
  });

  it("normalises en-dash and em-dash to hyphen", () => {
    expect(normalizeHeader("9:45\u201310:15")).toBe("9:45-10:15");
    expect(normalizeHeader("9:45\u201410:15")).toBe("9:45-10:15");
  });

  it("collapses whitespace and trims", () => {
    expect(normalizeHeader("  a   b  ")).toBe("a b");
  });
});

/* ------------------------------------------------------------------ */
/*  parseCsvLine                                                       */
/* ------------------------------------------------------------------ */

describe("parseCsvLine", () => {
  it("splits simple comma-separated values", () => {
    expect(parseCsvLine("a,b,c")).toEqual(["a", "b", "c"]);
  });

  it("handles quoted fields containing commas", () => {
    expect(parseCsvLine('"hello, world",b')).toEqual(["hello, world", "b"]);
  });

  it("handles escaped quotes inside quoted fields", () => {
    expect(parseCsvLine('"say ""hi""",b')).toEqual(['say "hi"', "b"]);
  });

  it("trims whitespace around values", () => {
    expect(parseCsvLine(" a , b , c ")).toEqual(["a", "b", "c"]);
  });
});

/* ------------------------------------------------------------------ */
/*  parseScheduleText                                                  */
/* ------------------------------------------------------------------ */

describe("parseScheduleText", () => {
  const headerLine = expectedHeaders.join(",");

  it("parses valid CSV input", () => {
    const data = `${headerLine}\n2026-01-01,Monday,Theme A,slot1,slot2,slot3,slot4,slot5,eve,notes`;
    const result = parseScheduleText(data);
    expect(result.error).toBeUndefined();
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].date).toBe("2026-01-01");
    expect(result.rows[0].theme).toBe("Theme A");
  });

  it("returns error for empty input", () => {
    const result = parseScheduleText("");
    expect(result.error).toBe("Empty file.");
    expect(result.rows).toEqual([]);
  });

  it("returns error for missing headers", () => {
    const result = parseScheduleText("Col1,Col2\ndata1,data2");
    expect(result.error).toContain("Missing headers");
  });

  it("skips rows missing date or theme", () => {
    const data = `${headerLine}\n,Monday,,slot1,slot2,slot3,slot4,slot5,eve,notes`;
    const result = parseScheduleText(data);
    expect(result.rows).toHaveLength(0);
  });

  it("handles tab-delimited input", () => {
    const tabHeader = expectedHeaders.join("\t");
    const data = `${tabHeader}\n2026-01-01\tMonday\tTheme B\ts1\ts2\ts3\ts4\ts5\teve\tnotes`;
    const result = parseScheduleText(data);
    expect(result.error).toBeUndefined();
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].theme).toBe("Theme B");
  });
});

/* ------------------------------------------------------------------ */
/*  getJourneyStageIndex                                               */
/* ------------------------------------------------------------------ */

describe("getJourneyStageIndex", () => {
  it("returns 3 for completed status", () => {
    expect(getJourneyStageIndex(makeTask({ status: "completed" }))).toBe(3);
  });

  it("returns 3 for visit_status completed", () => {
    expect(getJourneyStageIndex(makeTask({ visit_status: "completed" }))).toBe(3);
  });

  it("returns 3 for visit_status closed_lost", () => {
    expect(getJourneyStageIndex(makeTask({ visit_status: "closed_lost" }))).toBe(3);
  });

  it("returns 2 for in_meeting", () => {
    expect(getJourneyStageIndex(makeTask({ visit_status: "in_meeting" }))).toBe(2);
  });

  it("returns 1 for reached", () => {
    expect(getJourneyStageIndex(makeTask({ visit_status: "reached" }))).toBe(1);
  });

  it("returns 0 for ongoing status", () => {
    expect(getJourneyStageIndex(makeTask({ status: "ongoing" }))).toBe(0);
  });

  it("returns -1 for not_started with no visit_status", () => {
    expect(getJourneyStageIndex(makeTask({ status: "not_started" }))).toBe(-1);
  });
});

/* ------------------------------------------------------------------ */
/*  getVisitStatusLabelForTask                                         */
/* ------------------------------------------------------------------ */

describe("getVisitStatusLabelForTask", () => {
  it('returns "Going To School" when ongoing + planned', () => {
    expect(
      getVisitStatusLabelForTask(makeTask({ status: "ongoing", visit_status: "planned" }))
    ).toBe("Going To School");
  });

  it('returns "Going To School" when ongoing + no visit_status', () => {
    expect(
      getVisitStatusLabelForTask(makeTask({ status: "ongoing" }))
    ).toBe("Going To School");
  });

  it("returns visit status label for non-ongoing task", () => {
    expect(
      getVisitStatusLabelForTask(makeTask({ status: "completed", visit_status: "completed" }))
    ).toBe("Completed");
  });

  it("returns mapped label for reached", () => {
    expect(
      getVisitStatusLabelForTask(makeTask({ status: "ongoing", visit_status: "reached" }))
    ).toBe("Reached");
  });
});

/* ------------------------------------------------------------------ */
/*  canAccessJourneyPlanner                                            */
/* ------------------------------------------------------------------ */

describe("canAccessJourneyPlanner", () => {
  it("returns true for admin", () => {
    expect(canAccessJourneyPlanner(makeUser({ role: "admin" }))).toBe(true);
  });

  it("returns true for sales department", () => {
    expect(canAccessJourneyPlanner(makeUser({ department: "Sales" }))).toBe(true);
  });

  it("returns true for trainee department", () => {
    expect(canAccessJourneyPlanner(makeUser({ department: "Trainee" }))).toBe(true);
  });

  it("returns false for other roles/departments", () => {
    expect(canAccessJourneyPlanner(makeUser({ department: "engineering" }))).toBe(false);
  });

  it("returns false for null user", () => {
    expect(canAccessJourneyPlanner(null)).toBe(false);
  });

  it("returns false for undefined user", () => {
    expect(canAccessJourneyPlanner(undefined)).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/*  Const exports - verify shapes                                      */
/* ------------------------------------------------------------------ */

describe("statusLabels", () => {
  it("has 4 entries", () => {
    expect(Object.keys(statusLabels)).toHaveLength(4);
  });

  it("maps not_started to 'Not Started'", () => {
    expect(statusLabels.not_started).toBe("Not Started");
  });
});

describe("visitOutcomeLabels", () => {
  it("has 8 entries", () => {
    expect(Object.keys(visitOutcomeLabels)).toHaveLength(8);
  });

  it("maps decision_maker_not_available to 'DM Not Available'", () => {
    expect(visitOutcomeLabels.decision_maker_not_available).toBe("DM Not Available");
  });
});

describe("followUpTypeLabels", () => {
  it("has 6 entries", () => {
    expect(Object.keys(followUpTypeLabels)).toHaveLength(6);
  });

  it("maps whatsapp to 'WhatsApp'", () => {
    expect(followUpTypeLabels.whatsapp).toBe("WhatsApp");
  });
});

describe("statusClass", () => {
  it("has 4 entries", () => {
    expect(Object.keys(statusClass)).toHaveLength(4);
  });

  it("contains class strings for each status", () => {
    expect(statusClass.ongoing).toContain("bg-blue-100");
  });
});

describe("priorityClass", () => {
  it("has 3 entries", () => {
    expect(Object.keys(priorityClass)).toHaveLength(3);
  });

  it("contains class strings for high priority", () => {
    expect(priorityClass.high).toContain("bg-rose-100");
  });
});
