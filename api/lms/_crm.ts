// Shared CRM client for the onrol.in LMS proxy handlers. All /api/lms/*
// server routes verify the Supabase JWT (via getAuthUserId) then call
// these functions to forward to the CRM with the shared service token.

function getCrmBase(): { base: string; secret: string } | null {
  const url = process.env.CRM_EVENT_URL;
  const secret = process.env.ONROL_EVENT_SECRET;
  if (!url || !secret) return null;
  try {
    const u = new URL(url);
    return { base: `${u.protocol}//${u.host}`, secret };
  } catch {
    return null;
  }
}

async function crmRequest(path: string, init: RequestInit): Promise<Response> {
  const cfg = getCrmBase();
  if (!cfg) throw new Error("CRM_EVENT_URL / ONROL_EVENT_SECRET not configured.");
  return fetch(`${cfg.base}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${cfg.secret}`,
      ...(init.headers ?? {}),
    },
  });
}

async function unwrap<T>(r: Response, path: string): Promise<T> {
  if (!r.ok) {
    const detail = await r.text().catch(() => "");
    const err = new Error(`CRM ${path} failed (${r.status}): ${detail.slice(0, 200)}`);
    (err as Error & { status?: number }).status = r.status;
    throw err;
  }
  return r.json() as Promise<T>;
}

// ── Courses ─────────────────────────────────────────────────────────────

export async function crmListCourses(opts: { publishedOnly?: boolean; createdBy?: string; limit?: number } = {}) {
  const params = new URLSearchParams();
  if (opts.publishedOnly) params.set("publishedOnly", "1");
  if (opts.createdBy) params.set("createdBy", opts.createdBy);
  if (opts.limit) params.set("limit", String(opts.limit));
  const r = await crmRequest(`/api/lms/courses?${params.toString()}`, { method: "GET" });
  const { courses } = await unwrap<{ ok: boolean; courses: Array<Record<string, unknown>> }>(r, "/api/lms/courses");
  return courses;
}

export async function crmGetCourse(opts: { slug?: string; id?: string; includeOutline?: boolean; userExternalId?: string }) {
  const params = new URLSearchParams();
  if (opts.slug) params.set("slug", opts.slug);
  if (opts.id) params.set("id", opts.id);
  if (opts.includeOutline) params.set("includeOutline", "1");
  if (opts.userExternalId) params.set("userExternalId", opts.userExternalId);
  const r = await crmRequest(`/api/lms/courses?${params.toString()}`, { method: "GET" });
  if (r.status === 404) return null;
  return unwrap<{
    ok: boolean;
    course: Record<string, unknown>;
    modules?: Array<Record<string, unknown>>;
    progress?: { totalLessons: number; completedLessons: number; percent: number } | null;
  }>(r, "/api/lms/courses");
}

export async function crmCreateCourse(payload: Record<string, unknown>) {
  const r = await crmRequest("/api/lms/courses", { method: "POST", body: JSON.stringify(payload) });
  const { course } = await unwrap<{ ok: boolean; course: Record<string, unknown> }>(r, "/api/lms/courses");
  return course;
}

export async function crmUpdateCourse(id: string, patch: Record<string, unknown>) {
  const r = await crmRequest(`/api/lms/courses/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ patch }),
  });
  const { course } = await unwrap<{ ok: boolean; course: Record<string, unknown> }>(r, "/api/lms/courses/[id]");
  return course;
}

export async function crmPublishCourse(id: string, publish: boolean) {
  const r = await crmRequest(`/api/lms/courses/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ action: "publish", publish }),
  });
  return unwrap<{ ok: boolean; course: Record<string, unknown> }>(r, "/api/lms/courses/[id]");
}

export async function crmDeleteCourse(id: string) {
  const r = await crmRequest(`/api/lms/courses/${encodeURIComponent(id)}`, { method: "DELETE" });
  return unwrap<{ ok: boolean }>(r, "/api/lms/courses/[id]");
}

// ── Modules + lessons ──────────────────────────────────────────────────

export async function crmCreateModule(input: { courseId: string; title: string; position?: number; summary?: string | null }) {
  const r = await crmRequest("/api/lms/modules", { method: "POST", body: JSON.stringify(input) });
  const { module: mod } = await unwrap<{ ok: boolean; module: Record<string, unknown> }>(r, "/api/lms/modules");
  return mod;
}

export async function crmUpdateModule(id: string, patch: { title?: string; summary?: string | null; position?: number }) {
  const r = await crmRequest("/api/lms/modules", { method: "POST", body: JSON.stringify({ action: "update", id, patch }) });
  const { module: mod } = await unwrap<{ ok: boolean; module: Record<string, unknown> }>(r, "/api/lms/modules update");
  return mod;
}

export async function crmDeleteModule(id: string) {
  const r = await crmRequest("/api/lms/modules", { method: "POST", body: JSON.stringify({ action: "delete", id }) });
  return unwrap<{ ok: boolean }>(r, "/api/lms/modules delete");
}

export async function crmReorderModules(courseId: string, orderedIds: string[]) {
  const r = await crmRequest("/api/lms/modules", { method: "POST", body: JSON.stringify({ action: "reorder", courseId, orderedIds }) });
  return unwrap<{ ok: boolean }>(r, "/api/lms/modules reorder");
}

export async function crmCreateLesson(payload: Record<string, unknown>) {
  const r = await crmRequest("/api/lms/lessons", { method: "POST", body: JSON.stringify(payload) });
  const { lesson } = await unwrap<{ ok: boolean; lesson: Record<string, unknown> }>(r, "/api/lms/lessons");
  return lesson;
}

export async function crmUpdateLesson(id: string, patch: Record<string, unknown>) {
  const r = await crmRequest("/api/lms/lessons", { method: "POST", body: JSON.stringify({ action: "update", id, patch }) });
  const { lesson } = await unwrap<{ ok: boolean; lesson: Record<string, unknown> }>(r, "/api/lms/lessons update");
  return lesson;
}

export async function crmDeleteLesson(id: string) {
  const r = await crmRequest("/api/lms/lessons", { method: "POST", body: JSON.stringify({ action: "delete", id }) });
  return unwrap<{ ok: boolean }>(r, "/api/lms/lessons delete");
}

export async function crmReorderLessons(moduleId: string, orderedIds: string[]) {
  const r = await crmRequest("/api/lms/lessons", { method: "POST", body: JSON.stringify({ action: "reorder", moduleId, orderedIds }) });
  return unwrap<{ ok: boolean }>(r, "/api/lms/lessons reorder");
}

export async function crmGetLesson(id: string) {
  const r = await crmRequest(`/api/lms/lessons?id=${encodeURIComponent(id)}`, { method: "GET" });
  if (r.status === 404) return null;
  const { lesson } = await unwrap<{ ok: boolean; lesson: Record<string, unknown> }>(r, "/api/lms/lessons get");
  return lesson;
}

// ── Enrollments ────────────────────────────────────────────────────────

export async function crmListEnrollmentsForUser(userExternalId: string) {
  const r = await crmRequest(`/api/lms/enrollments?userExternalId=${encodeURIComponent(userExternalId)}`, { method: "GET" });
  const { enrollments } = await unwrap<{ ok: boolean; enrollments: Array<Record<string, unknown>> }>(r, "/api/lms/enrollments");
  return enrollments;
}

export async function crmListEnrollmentsForCourse(courseId: string) {
  const r = await crmRequest(`/api/lms/enrollments?courseId=${encodeURIComponent(courseId)}`, { method: "GET" });
  const { enrollments } = await unwrap<{ ok: boolean; enrollments: Array<Record<string, unknown>> }>(r, "/api/lms/enrollments by course");
  return enrollments;
}

export async function crmCheckEnrolled(userExternalId: string, courseId: string) {
  const r = await crmRequest(
    `/api/lms/enrollments?check=1&userExternalId=${encodeURIComponent(userExternalId)}&courseId=${encodeURIComponent(courseId)}`,
    { method: "GET" },
  );
  const { enrolled } = await unwrap<{ ok: boolean; enrolled: boolean }>(r, "/api/lms/enrollments check");
  return enrolled;
}

export async function crmEnroll(input: {
  courseId: string;
  userExternalId: string;
  enrolledBy?: string | null;
  source?: string;
  externalPaymentId?: string | null;
  expiresAt?: string | null;
}) {
  const r = await crmRequest("/api/lms/enrollments", { method: "POST", body: JSON.stringify(input) });
  const { enrollment } = await unwrap<{ ok: boolean; enrollment: Record<string, unknown> }>(r, "/api/lms/enrollments POST");
  return enrollment;
}

export async function crmSetEnrollmentStatus(id: string, status: "active" | "expired" | "revoked" | "refunded") {
  const r = await crmRequest("/api/lms/enrollments", {
    method: "POST",
    body: JSON.stringify({ action: "setStatus", id, status }),
  });
  return unwrap<{ ok: boolean; enrollment: Record<string, unknown> }>(r, "/api/lms/enrollments setStatus");
}

// ── Progress ───────────────────────────────────────────────────────────

export async function crmUpsertProgress(input: {
  userExternalId: string;
  lessonId: string;
  courseId: string;
  watchedSec?: number;
  lastPositionSec?: number;
  completed?: boolean;
}) {
  const r = await crmRequest("/api/lms/progress", { method: "POST", body: JSON.stringify(input) });
  return unwrap<{ ok: boolean; progress: Record<string, unknown> | null }>(r, "/api/lms/progress");
}

export async function crmListProgress(userExternalId: string, courseId?: string) {
  const params = new URLSearchParams({ userExternalId });
  if (courseId) params.set("courseId", courseId);
  const r = await crmRequest(`/api/lms/progress?${params.toString()}`, { method: "GET" });
  const { progress } = await unwrap<{ ok: boolean; progress: Array<Record<string, unknown>> }>(r, "/api/lms/progress GET");
  return progress;
}
