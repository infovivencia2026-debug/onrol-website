// Browser-side LMS client (learn.onrol.in / /learn routes).
//
// Every call goes cross-origin directly to the CRM at go.onrol.in, carrying
// our native LMS session JWT in `Authorization: Bearer …`. The CRM resolves
// the caller via `resolveLmsCaller` (lib/lms-auth.ts) — service token,
// admin cookie, mentor, or learner — and CORS headers are set per response.
//
// `credentials: "omit"` because we deliberately do NOT want the browser to
// send the CRM admin cookie from go.onrol.in; learner identity comes only
// from the JWT bearer.

import { getLmsToken } from "@/lib/lmsAuth";

const CRM_BASE = (import.meta.env.VITE_CRM_BASE as string | undefined) ?? "https://go.onrol.in";

function authHeader(): Record<string, string> {
  const t = getLmsToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

async function lmsFetch(path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`${CRM_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...authHeader(),
      ...(init.headers ?? {}),
    },
    credentials: "omit",
  });
}

// Back-compat alias — older callers used crmLmsFetch for cross-origin
// endpoints. Both helpers are now identical.
const crmLmsFetch = lmsFetch;

async function lmsJson<T>(r: Response, label: string): Promise<T> {
  const text = await r.text();
  let parsed: unknown = null;
  try { parsed = text ? JSON.parse(text) : null; } catch { /* leave null */ }
  if (!r.ok) {
    const message = (parsed && typeof parsed === "object" && "error" in parsed && typeof (parsed as { error?: unknown }).error === "string")
      ? (parsed as { error: string }).error
      : `${label} failed (${r.status})`;
    const err = new Error(message);
    (err as Error & { status?: number }).status = r.status;
    throw err;
  }
  return (parsed ?? {}) as T;
}

// ── Types ──────────────────────────────────────────────────────────────

export interface LmsCourse {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  description_md: string | null;
  thumbnail_url: string | null;
  trailer_url: string | null;
  level: "beginner" | "intermediate" | "advanced";
  duration_minutes: number | null;
  language: string;
  category: string | null;
  price_inr: number | null;
  is_published: boolean;
  published_at: string | null;
  created_by: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface LmsLesson {
  id: string;
  module_id: string;
  course_id: string;
  position: number;
  title: string;
  kind: "video" | "text" | "pdf" | "live" | "quiz" | "assignment";
  body_md: string | null;
  video_url: string | null;
  video_provider: string;
  video_public_id: string | null;
  attachments: unknown[];
  duration_sec: number | null;
  is_free_preview: boolean;
  metadata: Record<string, unknown>;
}

export interface LmsModule {
  id: string;
  course_id: string;
  position: number;
  title: string;
  summary: string | null;
  lessons: LmsLesson[];
}

export interface LmsEnrollment {
  id: string;
  course_id: string;
  user_external_id: string;
  enrolled_at: string;
  source: string;
  status: string;
  expires_at: string | null;
  course_slug?: string;
  course_title?: string;
  thumbnail_url?: string;
  summary?: string | null;
}

export interface LmsCourseDetail {
  course: LmsCourse;
  modules?: LmsModule[];
  progress?: { totalLessons: number; completedLessons: number; percent: number } | null;
  enrolled?: boolean;
}

// ── Public catalog (no auth) ───────────────────────────────────────────

// Reduced shape returned by /api/lms/public/courses. Non-preview lesson
// bodies/videos are stripped server-side.
export interface PublicCatalogCourse {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  description_md: string | null;
  thumbnail_url: string | null;
  trailer_url: string | null;
  level: string;
  duration_minutes: number | null;
  language: string;
  category: string | null;
  price_inr: number | null;
  published_at: string | null;
}

export interface PublicCatalogLesson {
  id: string;
  module_id: string;
  position: number;
  title: string;
  kind: string;
  is_free_preview: boolean;
  duration_sec: number | null;
  body_md: string | null;
  video_url: string | null;
}

export interface PublicCatalogModule {
  id: string;
  title: string;
  summary: string | null;
  position: number;
  lessons: PublicCatalogLesson[];
}

export interface PublicCatalogCourseDetail {
  course: PublicCatalogCourse;
  modules: PublicCatalogModule[];
}

export async function lmsListPublicCourses(opts: { limit?: number } = {}): Promise<PublicCatalogCourse[]> {
  const params = new URLSearchParams();
  if (opts.limit) params.set("limit", String(opts.limit));
  const r = await fetch(`${CRM_BASE}/api/lms/public/courses?${params.toString()}`, { credentials: "omit" });
  const { courses } = await lmsJson<{ ok: boolean; courses: PublicCatalogCourse[] }>(r, "list public courses");
  return courses;
}

export async function lmsGetPublicCourse(slug: string): Promise<PublicCatalogCourseDetail | null> {
  const r = await fetch(`${CRM_BASE}/api/lms/public/courses?slug=${encodeURIComponent(slug)}`, { credentials: "omit" });
  if (r.status === 404) return null;
  return lmsJson<PublicCatalogCourseDetail>(r, "get public course");
}

export interface EnrollmentRequestPayload {
  courseSlug: string;
  email: string;
  fullName?: string;
  phone?: string;
  message?: string;
  userExternalId?: string;
}

export async function lmsSubmitEnrollmentRequest(
  payload: EnrollmentRequestPayload,
): Promise<{ ok: true; requestId: string; message: string }> {
  const r = await fetch(`${CRM_BASE}/api/lms/public/enrollment-request`, {
    method: "POST",
    credentials: "omit",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return lmsJson<{ ok: true; requestId: string; message: string }>(r, "submit enrollment request");
}

// ── Lesson discussions (Q&A under each lesson) ────────────────────────
//
// Per-lesson threaded discussions. Mentor-moderated: any caller can
// post / reply, but only the author or staff (mentor/admin) can delete.
// Reads are auth-gated via /api/lms/discussions which respects the
// learner JWT or office user session.

export interface LmsDiscussion {
  id: string;
  lesson_id: string;
  course_id: string;
  author_external_id: string;
  author_kind: "learner" | "mentor" | "admin";
  author_display_name: string;
  parent_id: string | null;
  kind: "discussion" | "question" | "answer" | "reply";
  body_md: string;
  is_resolved: boolean;
  is_pinned: boolean;
  is_hidden: boolean;
  reaction_count: number;
  created_at: string;
  updated_at: string;
}

export async function lmsListDiscussionsForLesson(lessonId: string): Promise<LmsDiscussion[]> {
  try {
    const r = await lmsFetch(`/api/lms/discussions?lessonId=${encodeURIComponent(lessonId)}`);
    if (!r.ok) return [];
    const body = await r.json() as { discussions?: LmsDiscussion[] };
    return body.discussions ?? [];
  } catch {
    return [];
  }
}

export async function lmsCreateDiscussionPost(input: {
  lessonId: string;
  bodyMd: string;
  parentId?: string | null;
  kind?: "discussion" | "question" | "answer" | "reply";
}): Promise<LmsDiscussion | null> {
  const r = await lmsFetch(`/api/lms/discussions`, {
    method: "POST",
    body: JSON.stringify({
      lessonId: input.lessonId,
      bodyMd: input.bodyMd,
      parentId: input.parentId ?? null,
      kind: input.kind,
    }),
  });
  if (!r.ok) {
    const msg = await r.json().then((b) => (b as { message?: string }).message ?? "Post failed").catch(() => "Post failed");
    throw new Error(msg);
  }
  const body = await r.json() as { discussion?: LmsDiscussion };
  return body.discussion ?? null;
}

export async function lmsDeleteDiscussionPost(id: string): Promise<boolean> {
  const r = await lmsFetch(`/api/lms/discussions?id=${encodeURIComponent(id)}`, { method: "DELETE" });
  return r.ok;
}

/**
 * Aggregate Q&A across every lesson in a course. Used by the course-level
 * Discussions tab. Returns posts with `lesson_title` populated so we can
 * group / link back to the source lesson.
 */
export async function lmsListDiscussionsForCourse(
  lessons: Array<{ id: string; title: string }>,
): Promise<Array<LmsDiscussion & { lesson_title: string }>> {
  const entries = await Promise.all(
    lessons.map(async (l) => {
      const posts = await lmsListDiscussionsForLesson(l.id);
      return posts.map((p) => ({ ...p, lesson_title: l.title }));
    }),
  );
  return entries.flat();
}

// ── Announcements (admin → learners) ──────────────────────────────────
//
// Posted from the CRM admin (go.onrol.in → LMS → Announcements). Learners
// only see ones scoped to their enrolled courses/cohorts (or "all").
// Until the backend endpoint ships, this returns []; the UI degrades
// gracefully to "No announcements yet" empty state.

export interface LmsAnnouncement {
  id: string;
  title: string;
  body: string;
  author_name: string | null;
  scope: "all" | "course" | "cohort";
  scope_id: string | null;
  pinned: boolean;
  created_at: string;
}

export async function lmsListAnnouncements(): Promise<LmsAnnouncement[]> {
  try {
    const r = await lmsFetch("/api/lms/announcements");
    if (!r.ok) return [];
    const data = await r.json() as { announcements?: LmsAnnouncement[] };
    return data.announcements ?? [];
  } catch {
    return [];
  }
}

// ── Courses ────────────────────────────────────────────────────────────

export async function lmsListCourses(opts: { publishedOnly?: boolean; limit?: number } = {}): Promise<LmsCourse[]> {
  const params = new URLSearchParams();
  if (opts.publishedOnly) params.set("publishedOnly", "1");
  if (opts.limit) params.set("limit", String(opts.limit));
  const r = await lmsFetch(`/api/lms/courses?${params.toString()}`);
  const { courses } = await lmsJson<{ ok: boolean; courses: LmsCourse[] }>(r, "list courses");
  return courses;
}

export async function lmsGetCourse(slug: string, opts: { includeOutline?: boolean } = {}): Promise<LmsCourseDetail | null> {
  const params = new URLSearchParams({ slug });
  if (opts.includeOutline) params.set("includeOutline", "1");
  const r = await lmsFetch(`/api/lms/courses?${params.toString()}`);
  if (r.status === 404) return null;
  return lmsJson<LmsCourseDetail>(r, "get course");
}

export async function lmsCreateCourse(payload: Partial<LmsCourse>): Promise<LmsCourse> {
  const r = await lmsFetch("/api/lms/courses", { method: "POST", body: JSON.stringify(payload) });
  const { course } = await lmsJson<{ ok: boolean; course: LmsCourse }>(r, "create course");
  return course;
}

export async function lmsUpdateCourse(id: string, patch: Partial<LmsCourse>): Promise<LmsCourse> {
  const r = await lmsFetch(`/api/lms/courses/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ patch }),
  });
  const { course } = await lmsJson<{ ok: boolean; course: LmsCourse }>(r, "update course");
  return course;
}

export async function lmsPublishCourse(id: string, publish: boolean): Promise<void> {
  const r = await lmsFetch(`/api/lms/courses/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ action: "publish", publish }),
  });
  await lmsJson(r, "publish course");
}

export async function lmsDeleteCourse(id: string): Promise<void> {
  const r = await lmsFetch(`/api/lms/courses/${encodeURIComponent(id)}`, { method: "DELETE" });
  await lmsJson(r, "delete course");
}

// ── Modules + lessons ──────────────────────────────────────────────────

export async function lmsCreateModule(input: { courseId: string; title: string; summary?: string | null; position?: number }) {
  const r = await lmsFetch("/api/lms/modules", { method: "POST", body: JSON.stringify(input) });
  const { module: mod } = await lmsJson<{ ok: boolean; module: LmsModule }>(r, "create module");
  return mod;
}

export async function lmsUpdateModule(id: string, patch: Partial<LmsModule>) {
  const r = await lmsFetch("/api/lms/modules", {
    method: "POST",
    body: JSON.stringify({ action: "update", id, patch }),
  });
  const { module: mod } = await lmsJson<{ ok: boolean; module: LmsModule }>(r, "update module");
  return mod;
}

export async function lmsDeleteModule(id: string) {
  const r = await lmsFetch("/api/lms/modules", { method: "POST", body: JSON.stringify({ action: "delete", id }) });
  await lmsJson(r, "delete module");
}

export async function lmsReorderModules(courseId: string, orderedIds: string[]) {
  const r = await lmsFetch("/api/lms/modules", {
    method: "POST",
    body: JSON.stringify({ action: "reorder", courseId, orderedIds }),
  });
  await lmsJson(r, "reorder modules");
}

export async function lmsCreateLesson(payload: Partial<LmsLesson> & { module_id: string; course_id: string; title: string }) {
  const r = await lmsFetch("/api/lms/lessons", { method: "POST", body: JSON.stringify(payload) });
  const { lesson } = await lmsJson<{ ok: boolean; lesson: LmsLesson }>(r, "create lesson");
  return lesson;
}

export async function lmsUpdateLesson(id: string, patch: Partial<LmsLesson>) {
  const r = await lmsFetch("/api/lms/lessons", {
    method: "POST",
    body: JSON.stringify({ action: "update", id, patch }),
  });
  const { lesson } = await lmsJson<{ ok: boolean; lesson: LmsLesson }>(r, "update lesson");
  return lesson;
}

export async function lmsDeleteLesson(id: string) {
  const r = await lmsFetch("/api/lms/lessons", { method: "POST", body: JSON.stringify({ action: "delete", id }) });
  await lmsJson(r, "delete lesson");
}

export async function lmsReorderLessons(moduleId: string, orderedIds: string[]) {
  const r = await lmsFetch("/api/lms/lessons", {
    method: "POST",
    body: JSON.stringify({ action: "reorder", moduleId, orderedIds }),
  });
  await lmsJson(r, "reorder lessons");
}

export async function lmsGetLesson(id: string): Promise<LmsLesson | null> {
  const r = await lmsFetch(`/api/lms/lessons?id=${encodeURIComponent(id)}`);
  if (r.status === 404) return null;
  const { lesson } = await lmsJson<{ ok: boolean; lesson: LmsLesson }>(r, "get lesson");
  return lesson;
}

// ── Enrollments ────────────────────────────────────────────────────────

export async function lmsListMyEnrollments(): Promise<LmsEnrollment[]> {
  const r = await lmsFetch(`/api/lms/enrollments`);
  const { enrollments } = await lmsJson<{ ok: boolean; enrollments: LmsEnrollment[] }>(r, "list enrollments");
  return enrollments;
}

export async function lmsListEnrollmentsForCourse(courseId: string): Promise<LmsEnrollment[]> {
  const r = await lmsFetch(`/api/lms/enrollments?courseId=${encodeURIComponent(courseId)}`);
  const { enrollments } = await lmsJson<{ ok: boolean; enrollments: LmsEnrollment[] }>(r, "list course enrollments");
  return enrollments;
}

export async function lmsCheckEnrolled(courseId: string): Promise<boolean> {
  const r = await lmsFetch(`/api/lms/enrollments?check=1&courseId=${encodeURIComponent(courseId)}`);
  const { enrolled } = await lmsJson<{ ok: boolean; enrolled: boolean }>(r, "check enrolled");
  return enrolled;
}

export async function lmsEnroll(input: { courseId: string; userExternalId: string; source?: string; expiresAt?: string | null }): Promise<LmsEnrollment> {
  const r = await lmsFetch("/api/lms/enrollments", { method: "POST", body: JSON.stringify(input) });
  const { enrollment } = await lmsJson<{ ok: boolean; enrollment: LmsEnrollment }>(r, "enroll");
  return enrollment;
}

export async function lmsSetEnrollmentStatus(id: string, status: "active" | "expired" | "revoked" | "refunded") {
  const r = await lmsFetch("/api/lms/enrollments", {
    method: "POST",
    body: JSON.stringify({ action: "setStatus", id, status }),
  });
  await lmsJson(r, "set enrollment status");
}

// ── Progress ───────────────────────────────────────────────────────────

export async function lmsSaveProgress(input: { lessonId: string; courseId: string; watchedSec?: number; lastPositionSec?: number; completed?: boolean }) {
  const r = await lmsFetch("/api/lms/progress", { method: "POST", body: JSON.stringify(input) });
  await lmsJson(r, "save progress");
}

// ── Lesson resources ──────────────────────────────────────────────────
// External links + attached files for a lesson, displayed under the
// learner's "Resources" tab. Admin-only writes; learners just read.

export interface LmsLessonResource {
  id: string;
  lessonId: string;
  courseId: string;
  label: string;
  url: string;
  kind: "link" | "file" | "video" | "code" | "doc";
  position: number;
  createdAt: string;
}

export async function lmsListLessonResources(lessonId: string): Promise<LmsLessonResource[]> {
  const r = await lmsFetch(`/api/lms/lessons/${encodeURIComponent(lessonId)}/resources`);
  const { resources } = await lmsJson<{ ok: boolean; resources: LmsLessonResource[] }>(r, "list lesson resources");
  return resources ?? [];
}

export interface LmsLessonNote { body: string; updatedAt: string | null }

export async function lmsGetLessonNote(lessonId: string): Promise<LmsLessonNote> {
  const r = await lmsFetch(`/api/lms/lessons/${encodeURIComponent(lessonId)}/notes`);
  if (!r.ok) return { body: "", updatedAt: null };
  const data = await lmsJson<{ ok: boolean; body: string; updatedAt: string | null }>(r, "get lesson note");
  return { body: data.body ?? "", updatedAt: data.updatedAt ?? null };
}

export async function lmsSaveLessonNote(lessonId: string, body: string): Promise<{ updatedAt: string | null }> {
  const r = await lmsFetch(`/api/lms/lessons/${encodeURIComponent(lessonId)}/notes`, {
    method: "PUT",
    body: JSON.stringify({ body }),
  });
  if (!r.ok) return { updatedAt: null };
  const data = await lmsJson<{ ok: boolean; updatedAt: string | null }>(r, "save lesson note");
  return { updatedAt: data.updatedAt ?? null };
}

// ── Quizzes + assignments (Session 3) ──────────────────────────────────

export interface LmsQuizChoice {
  id: string;
  text: string;
  correct?: boolean;
}

export interface LmsQuizQuestion {
  id: string;
  quiz_id: string;
  position: number;
  kind: "single_choice" | "multi_choice" | "true_false" | "short_text";
  prompt: string;
  explanation: string | null;
  choices: LmsQuizChoice[];
  points: number;
}

export interface LmsQuiz {
  id: string;
  lesson_id: string;
  course_id: string;
  title: string;
  description_md: string | null;
  passing_score_pct: number;
  attempts_allowed: number | null;
  time_limit_sec: number | null;
  shuffle_questions: boolean;
  show_correct_after: boolean;
  is_published: boolean;
}

export interface LmsQuizAttempt {
  id: string;
  quiz_id: string;
  user_external_id: string;
  started_at: string;
  submitted_at: string | null;
  answers: Record<string, { selected?: string[]; text?: string }>;
  score_pct: number | null;
  passed: boolean | null;
  time_taken_sec: number | null;
}

export async function lmsGetQuizForLesson(lessonId: string): Promise<{ quiz: LmsQuiz; questions: LmsQuizQuestion[] } | null> {
  const r = await lmsFetch(`/api/lms/quizzes?lessonId=${encodeURIComponent(lessonId)}&hideCorrect=1`);
  if (r.status === 404) return null;
  return lmsJson<{ ok: boolean; quiz: LmsQuiz; questions: LmsQuizQuestion[] }>(r, "get quiz")
    .then(({ quiz, questions }) => ({ quiz, questions }));
}

export async function lmsStartQuizAttempt(quizId: string, userExternalId: string): Promise<LmsQuizAttempt> {
  const r = await lmsFetch("/api/lms/attempts", {
    method: "POST",
    body: JSON.stringify({ action: "start", quizId, userExternalId }),
  });
  const { attempt } = await lmsJson<{ ok: boolean; attempt: LmsQuizAttempt }>(r, "start quiz attempt");
  return attempt;
}

export async function lmsSubmitQuizAttempt(input: {
  attemptId: string;
  userExternalId: string;
  answers: Record<string, { selected?: string[]; text?: string }>;
}): Promise<LmsQuizAttempt> {
  const r = await lmsFetch("/api/lms/attempts", {
    method: "POST",
    body: JSON.stringify({ action: "submit", ...input }),
  });
  const { attempt } = await lmsJson<{ ok: boolean; attempt: LmsQuizAttempt }>(r, "submit quiz attempt");
  return attempt;
}

/** Attempt with the related quiz + course context joined for the
 *  /learn/me/exams list. Server denormalises so we don't N+1 from the
 *  client. */
export interface LmsQuizAttemptWithContext extends LmsQuizAttempt {
  quiz_title?: string | null;
  lesson_title?: string | null;
  course_id?: string | null;
  course_title?: string | null;
  course_slug?: string | null;
  pass_pct?: number | null;
}

export async function lmsListMyAttempts(userExternalId: string, quizId?: string): Promise<LmsQuizAttemptWithContext[]> {
  const qs = new URLSearchParams({ userExternalId });
  if (quizId) qs.set("quizId", quizId);
  const r = await lmsFetch(`/api/lms/attempts?${qs.toString()}`);
  if (!r.ok) return [];
  const data = await lmsJson<{ ok: boolean; attempts: LmsQuizAttemptWithContext[] }>(r, "list attempts");
  return data.attempts ?? [];
}

export interface LmsAssignment {
  id: string;
  lesson_id: string;
  course_id: string;
  title: string;
  instructions_md: string | null;
  rubric_md: string | null;
  due_at: string | null;
  allow_late: boolean;
  max_points: number;
  is_published: boolean;
}

export interface LmsSubmission {
  id: string;
  assignment_id: string;
  user_external_id: string;
  body_md: string | null;
  attachments: Array<{ url: string; name?: string; type?: string }>;
  submitted_at: string;
  is_late: boolean;
  status: "submitted" | "graded" | "returned" | "resubmit_requested";
  grade_points: number | null;
  grade_feedback_md: string | null;
  graded_at: string | null;
}

export async function lmsGetAssignmentForLesson(lessonId: string, userExternalId: string): Promise<{ assignment: LmsAssignment; submission: LmsSubmission | null } | null> {
  const params = new URLSearchParams({ lessonId, userExternalId });
  const r = await lmsFetch(`/api/lms/assignments?${params.toString()}`);
  if (r.status === 404) return null;
  return lmsJson<{ ok: boolean; assignment: LmsAssignment; submission: LmsSubmission | null }>(r, "get assignment")
    .then(({ assignment, submission }) => ({ assignment, submission }));
}

export async function lmsSubmitAssignment(input: {
  assignmentId: string;
  userExternalId: string;
  bodyMd?: string | null;
  attachments?: Array<{ url: string; name?: string; type?: string }>;
}): Promise<LmsSubmission> {
  const r = await lmsFetch("/api/lms/submissions", {
    method: "POST",
    body: JSON.stringify({ action: "submit", ...input }),
  });
  const { submission } = await lmsJson<{ ok: boolean; submission: LmsSubmission }>(r, "submit assignment");
  return submission;
}

// ── Live sessions + certificates (Session 4) ────────────────────────────

export interface LmsLiveSession {
  id: string;
  lesson_id: string;
  course_id: string;
  cohort_id: string | null;
  meeting_id: string | null;
  meeting_code: string | null;
  title: string;
  scheduled_start: string | null;
  scheduled_end: string | null;
  status: "scheduled" | "live" | "ended" | "cancelled";
  // Bunny / multi-provider extensions (added in migration 0129). Secrets
  // (rtmp_stream_key, rtmp_ingest_url) are stripped by the server before
  // reaching learners.
  provider?: "manual" | "bunny" | "youtube" | "zoom" | "livekit";
  playback_hls_url?: string | null;
  playback_iframe?: string | null;
  recording_video_id?: string | null;
  went_live_at?: string | null;
  ended_at?: string | null;
  peak_viewers?: number;
  /** Admin toggles (default true). When false, the SPA suppresses Zoho
   *  JIT-register / hides the per-lesson discussion thread respectively. */
  attendees_enabled?: boolean;
  comments_enabled?: boolean;
}

/** Heartbeat from the live-lesson player — keeps lms_live_attendance fresh. */
export async function lmsLiveAttendanceHeartbeat(sessionId: string): Promise<void> {
  await lmsFetch("/api/lms/live-attendance", {
    method: "POST",
    body: JSON.stringify({ sessionId }),
  }).catch(() => undefined);
}

/** Just-in-time per-learner Zoho registration. Called by <LearnLive> when
 *  the session's provider is 'zoho'. Returns the unique per-attendee join
 *  URL we render in the iframe. Idempotent server-side (cached in
 *  lms_live_session_registrations), so calling twice is cheap. */
export async function lmsRegisterZohoSession(sessionId: string): Promise<string | null> {
  const r = await lmsFetch(`/api/lms/live-sessions/${encodeURIComponent(sessionId)}/zoho-register`, {
    method: "POST",
    body: "{}",
  });
  if (!r.ok) return null;
  const data = await lmsJson<{ ok: boolean; joinUrl?: string }>(r, "zoho register");
  return data.joinUrl ?? null;
}

// ── Live engagement: chat / polls / Q&A ──────────────────────────────

export interface LiveChatMessage {
  id: string; sessionId: string; userExternalId: string;
  displayName: string | null; message: string;
  isPinned: boolean; isModerator: boolean; createdAt: string;
}

export async function lmsListChat(sessionId: string, since?: string): Promise<LiveChatMessage[]> {
  const qs = since ? `?since=${encodeURIComponent(since)}` : "";
  const r = await lmsFetch(`/api/lms/live-sessions/${encodeURIComponent(sessionId)}/chat${qs}`);
  if (!r.ok) return [];
  const data = await lmsJson<{ ok: boolean; messages: LiveChatMessage[] }>(r, "list chat");
  return data.messages ?? [];
}

export async function lmsPostChat(sessionId: string, message: string, displayName?: string | null): Promise<LiveChatMessage | null> {
  const r = await lmsFetch(`/api/lms/live-sessions/${encodeURIComponent(sessionId)}/chat`, {
    method: "POST",
    body: JSON.stringify({ message, displayName }),
  });
  if (!r.ok) return null;
  const data = await lmsJson<{ ok: boolean; message: LiveChatMessage }>(r, "post chat");
  return data.message ?? null;
}

export interface LivePoll {
  id: string; sessionId: string; question: string;
  choices: { id: string; text: string }[];
  isOpen: boolean; resultsVisible: boolean;
  createdAt: string; closedAt: string | null;
  totalVotes?: number; results?: Record<string, number>; myVote?: string | null;
}

export async function lmsListPolls(sessionId: string): Promise<LivePoll[]> {
  const r = await lmsFetch(`/api/lms/live-sessions/${encodeURIComponent(sessionId)}/polls`);
  if (!r.ok) return [];
  const data = await lmsJson<{ ok: boolean; polls: LivePoll[] }>(r, "list polls");
  return data.polls ?? [];
}

export async function lmsVotePoll(sessionId: string, pollId: string, choiceId: string): Promise<boolean> {
  const r = await lmsFetch(`/api/lms/live-sessions/${encodeURIComponent(sessionId)}/polls`, {
    method: "POST",
    body: JSON.stringify({ action: "vote", pollId, choiceId }),
  });
  return r.ok;
}

export interface LiveQa {
  id: string; sessionId: string; userExternalId: string;
  displayName: string | null; question: string; upvoteCount: number;
  isAnswered: boolean; isPinned: boolean;
  answerText: string | null; answeredAt: string | null; createdAt: string;
  myUpvoted?: boolean;
}

export async function lmsListQa(sessionId: string): Promise<LiveQa[]> {
  const r = await lmsFetch(`/api/lms/live-sessions/${encodeURIComponent(sessionId)}/qa`);
  if (!r.ok) return [];
  const data = await lmsJson<{ ok: boolean; qa: LiveQa[] }>(r, "list qa");
  return data.qa ?? [];
}

export async function lmsAskQa(sessionId: string, question: string, displayName?: string | null): Promise<LiveQa | null> {
  const r = await lmsFetch(`/api/lms/live-sessions/${encodeURIComponent(sessionId)}/qa`, {
    method: "POST",
    body: JSON.stringify({ action: "ask", question, displayName }),
  });
  if (!r.ok) return null;
  const data = await lmsJson<{ ok: boolean; qa: LiveQa }>(r, "ask qa");
  return data.qa ?? null;
}

export async function lmsUpvoteQa(sessionId: string, qaId: string): Promise<number | null> {
  const r = await lmsFetch(`/api/lms/live-sessions/${encodeURIComponent(sessionId)}/qa`, {
    method: "POST",
    body: JSON.stringify({ action: "upvote", qaId }),
  });
  if (!r.ok) return null;
  const data = await lmsJson<{ ok: boolean; upvoteCount: number }>(r, "upvote qa");
  return data.upvoteCount;
}

// ── Moderator-only helpers ───────────────────────────────────────────

export async function lmsGetLivePermissions(sessionId: string): Promise<{ canModerate: boolean }> {
  const r = await lmsFetch(`/api/lms/live-sessions/${encodeURIComponent(sessionId)}/permissions`);
  if (!r.ok) return { canModerate: false };
  const data = await lmsJson<{ canModerate: boolean }>(r, "get live permissions");
  return { canModerate: Boolean(data.canModerate) };
}

export async function lmsDeleteChat(sessionId: string, messageId: string): Promise<boolean> {
  const r = await lmsFetch(`/api/lms/live-sessions/${encodeURIComponent(sessionId)}/chat?messageId=${encodeURIComponent(messageId)}`, { method: "DELETE" });
  return r.ok;
}

export async function lmsPinChat(sessionId: string, messageId: string, pinned: boolean): Promise<boolean> {
  const r = await lmsFetch(`/api/lms/live-sessions/${encodeURIComponent(sessionId)}/chat?messageId=${encodeURIComponent(messageId)}&pin=${pinned ? 1 : 0}`, { method: "DELETE" });
  return r.ok;
}

export async function lmsLaunchPoll(sessionId: string, question: string, choices: { id: string; text: string }[]): Promise<LivePoll | null> {
  const r = await lmsFetch(`/api/lms/live-sessions/${encodeURIComponent(sessionId)}/polls`, {
    method: "POST",
    body: JSON.stringify({ action: "create", question, choices }),
  });
  if (!r.ok) return null;
  const data = await lmsJson<{ ok: boolean; poll: LivePoll }>(r, "launch poll");
  return data.poll ?? null;
}

export async function lmsSetPollState(sessionId: string, pollId: string, patch: { isOpen?: boolean; resultsVisible?: boolean }): Promise<boolean> {
  const r = await lmsFetch(`/api/lms/live-sessions/${encodeURIComponent(sessionId)}/polls`, {
    method: "POST",
    body: JSON.stringify({ action: "setState", pollId, ...patch }),
  });
  return r.ok;
}

export async function lmsAnswerQa(sessionId: string, qaId: string, answerText: string): Promise<boolean> {
  const r = await lmsFetch(`/api/lms/live-sessions/${encodeURIComponent(sessionId)}/qa`, {
    method: "POST",
    body: JSON.stringify({ action: "answer", qaId, answerText }),
  });
  return r.ok;
}

export async function lmsPinQa(sessionId: string, qaId: string, pinned: boolean): Promise<boolean> {
  const r = await lmsFetch(`/api/lms/live-sessions/${encodeURIComponent(sessionId)}/qa`, {
    method: "POST",
    body: JSON.stringify({ action: "pin", qaId, pinned }),
  });
  return r.ok;
}

// ── Reactions + raise-hand ───────────────────────────────────────────

export interface LiveReaction { id: number; emoji: string; createdAt: string }

export async function lmsListReactions(sessionId: string, seconds = 60): Promise<LiveReaction[]> {
  const r = await lmsFetch(`/api/lms/live-sessions/${encodeURIComponent(sessionId)}/reactions?seconds=${seconds}`);
  if (!r.ok) return [];
  const data = await lmsJson<{ ok: boolean; reactions: LiveReaction[] }>(r, "list reactions");
  return data.reactions ?? [];
}

export async function lmsPostReaction(sessionId: string, emoji: string): Promise<boolean> {
  const r = await lmsFetch(`/api/lms/live-sessions/${encodeURIComponent(sessionId)}/reactions`, {
    method: "POST",
    body: JSON.stringify({ emoji }),
  });
  return r.ok;
}

export interface RaisedHand { userExternalId: string; displayName: string | null; raisedAt: string; resolvedAt: string | null }

export async function lmsListRaisedHands(sessionId: string): Promise<{ hands?: RaisedHand[]; raised?: boolean }> {
  const r = await lmsFetch(`/api/lms/live-sessions/${encodeURIComponent(sessionId)}/raise-hand`);
  if (!r.ok) return {};
  const data = await lmsJson<{ ok: boolean; hands?: RaisedHand[]; raised?: boolean }>(r, "raise-hand list");
  return { hands: data.hands, raised: data.raised };
}

export async function lmsToggleRaiseHand(sessionId: string, raise: boolean, displayName?: string | null): Promise<boolean> {
  const r = await lmsFetch(`/api/lms/live-sessions/${encodeURIComponent(sessionId)}/raise-hand`, {
    method: "POST",
    body: JSON.stringify({ action: raise ? "raise" : "lower", displayName }),
  });
  return r.ok;
}

export async function lmsCallOnHand(sessionId: string, userExternalId: string): Promise<boolean> {
  const r = await lmsFetch(`/api/lms/live-sessions/${encodeURIComponent(sessionId)}/raise-hand`, {
    method: "POST",
    body: JSON.stringify({ action: "lower", userExternalId }),
  });
  return r.ok;
}

export async function lmsRefreshLiveSign(sessionId: string): Promise<{ iframeUrl?: string; hlsUrl?: string; signed?: boolean }> {
  const r = await lmsFetch(`/api/lms/live-sessions/${encodeURIComponent(sessionId)}/sign`);
  if (!r.ok) return {};
  const data = await lmsJson<{ ok: boolean; iframeUrl?: string; hlsUrl?: string; signed?: boolean }>(r, "refresh sign");
  return data;
}

export interface LiveTranscriptCue { start: number; end: number; text: string }
export interface LiveTranscriptPayload {
  status: "none" | "requested" | "processing" | "ready" | "error";
  url: string | null;
  lang: string;
  text: string | null;
  cues: LiveTranscriptCue[];
}

export async function lmsGetLiveTranscript(sessionId: string): Promise<LiveTranscriptPayload> {
  const r = await lmsFetch(`/api/lms/live-sessions/${encodeURIComponent(sessionId)}/transcript`);
  if (!r.ok) return { status: "none", url: null, lang: "en", text: null, cues: [] };
  const data = await lmsJson<LiveTranscriptPayload & { ok: boolean }>(r, "get transcript");
  return {
    status: data.status ?? "none",
    url: data.url ?? null,
    lang: data.lang ?? "en",
    text: data.text ?? null,
    cues: data.cues ?? [],
  };
}

export async function lmsGetLiveSessionForLesson(lessonId: string): Promise<LmsLiveSession | null> {
  const r = await crmLmsFetch(`/api/lms/live-sessions?lessonId=${encodeURIComponent(lessonId)}`);
  const { session } = await lmsJson<{ ok: boolean; session: LmsLiveSession | null }>(r, "get live session");
  return session;
}

// ── Comfort features (Phase 16) ──────────────────────────────────────

export async function lmsGetAlias(sessionId: string): Promise<string | null> {
  const r = await lmsFetch(`/api/lms/live-sessions/${encodeURIComponent(sessionId)}/alias`);
  if (!r.ok) return null;
  const data = await lmsJson<{ alias: string | null }>(r, "get alias");
  return data.alias ?? null;
}

export async function lmsSetAlias(sessionId: string, alias: string): Promise<string | null> {
  const r = await lmsFetch(`/api/lms/live-sessions/${encodeURIComponent(sessionId)}/alias`, {
    method: "POST",
    body: JSON.stringify({ alias }),
  });
  if (!r.ok) return null;
  const data = await lmsJson<{ alias: string }>(r, "set alias");
  return data.alias ?? null;
}

export interface LiveBookmark { id: string; positionSeconds: number; note: string | null; createdAt: string }

export async function lmsListBookmarks(sessionId: string): Promise<LiveBookmark[]> {
  const r = await lmsFetch(`/api/lms/live-sessions/${encodeURIComponent(sessionId)}/bookmarks`);
  if (!r.ok) return [];
  const data = await lmsJson<{ bookmarks: LiveBookmark[] }>(r, "list bookmarks");
  return data.bookmarks ?? [];
}

export async function lmsCreateBookmark(sessionId: string, positionSeconds: number, note?: string | null): Promise<LiveBookmark | null> {
  const r = await lmsFetch(`/api/lms/live-sessions/${encodeURIComponent(sessionId)}/bookmarks`, {
    method: "POST",
    body: JSON.stringify({ positionSeconds, note: note ?? null }),
  });
  if (!r.ok) return null;
  const data = await lmsJson<{ bookmark: LiveBookmark }>(r, "create bookmark");
  return data.bookmark ?? null;
}

export async function lmsDeleteBookmark(sessionId: string, bookmarkId: string): Promise<boolean> {
  const r = await lmsFetch(`/api/lms/live-sessions/${encodeURIComponent(sessionId)}/bookmarks?bookmarkId=${encodeURIComponent(bookmarkId)}`, { method: "DELETE" });
  return r.ok;
}

export type PaceVote = "slow" | "perfect" | "fast";
export interface PaceTally { slow: number; perfect: number; fast: number; total: number }

export async function lmsGetPace(sessionId: string): Promise<PaceTally> {
  const r = await lmsFetch(`/api/lms/live-sessions/${encodeURIComponent(sessionId)}/pace`);
  if (!r.ok) return { slow: 0, perfect: 0, fast: 0, total: 0 };
  const data = await lmsJson<{ tally: PaceTally }>(r, "pace pulse");
  return data.tally ?? { slow: 0, perfect: 0, fast: 0, total: 0 };
}

export async function lmsVotePace(sessionId: string, vote: PaceVote): Promise<boolean> {
  const r = await lmsFetch(`/api/lms/live-sessions/${encodeURIComponent(sessionId)}/pace`, {
    method: "POST",
    body: JSON.stringify({ vote }),
  });
  return r.ok;
}

export interface LateJoinerSummary {
  summaryReady: boolean;
  bullets: string[];
  recentMessages?: { name: string | null; text: string }[];
  generatedAt?: string;
  reason?: string;
}

export async function lmsGetChatSummary(sessionId: string): Promise<LateJoinerSummary> {
  const r = await lmsFetch(`/api/lms/live-sessions/${encodeURIComponent(sessionId)}/chat-summary`);
  if (!r.ok) return { summaryReady: false, bullets: [] };
  return await lmsJson<LateJoinerSummary>(r, "chat summary");
}

// ── Phase 17 maximum-interaction helpers ─────────────────────────────

export async function lmsFlagDoubt(sessionId: string): Promise<boolean> {
  const r = await lmsFetch(`/api/lms/live-sessions/${encodeURIComponent(sessionId)}/doubts`, { method: "POST", body: "{}" });
  return r.ok;
}
export async function lmsGetDoubtTally(sessionId: string): Promise<{ count: number; total: number }> {
  const r = await lmsFetch(`/api/lms/live-sessions/${encodeURIComponent(sessionId)}/doubts`);
  if (!r.ok) return { count: 0, total: 0 };
  const data = await lmsJson<{ tally: { count: number; total: number } }>(r, "doubt tally");
  return data.tally ?? { count: 0, total: 0 };
}

export interface CodeShare { id: string; sessionId: string; userExternalId: string; displayName: string | null; language: string; code: string; isFeatured: boolean; createdAt: string }

export async function lmsListCodeShares(sessionId: string): Promise<CodeShare[]> {
  const r = await lmsFetch(`/api/lms/live-sessions/${encodeURIComponent(sessionId)}/code-shares`);
  if (!r.ok) return [];
  const data = await lmsJson<{ shares: CodeShare[] }>(r, "list code shares");
  return data.shares ?? [];
}
export async function lmsPostCodeShare(sessionId: string, code: string, language: string, displayName?: string | null): Promise<CodeShare | null> {
  const r = await lmsFetch(`/api/lms/live-sessions/${encodeURIComponent(sessionId)}/code-shares`, {
    method: "POST",
    body: JSON.stringify({ code, language, displayName }),
  });
  if (!r.ok) return null;
  const data = await lmsJson<{ share: CodeShare }>(r, "post code share");
  return data.share ?? null;
}
export async function lmsFeatureCodeShare(sessionId: string, shareId: string, featured: boolean): Promise<boolean> {
  const r = await lmsFetch(`/api/lms/live-sessions/${encodeURIComponent(sessionId)}/code-shares`, {
    method: "POST",
    body: JSON.stringify({ action: "feature", shareId, featured }),
  });
  return r.ok;
}

export interface QaDraft { id: string; qaId: string; drafterUid: string; drafterName: string | null; draftText: string; approvedAt: string | null; createdAt: string }
export async function lmsListQaDrafts(sessionId: string, qaId: string): Promise<QaDraft[]> {
  const r = await lmsFetch(`/api/lms/live-sessions/${encodeURIComponent(sessionId)}/qa-drafts?qaId=${encodeURIComponent(qaId)}`);
  if (!r.ok) return [];
  const data = await lmsJson<{ drafts: QaDraft[] }>(r, "list qa drafts");
  return data.drafts ?? [];
}
export async function lmsDraftQaAnswer(sessionId: string, qaId: string, text: string, drafterName?: string | null): Promise<QaDraft | null> {
  const r = await lmsFetch(`/api/lms/live-sessions/${encodeURIComponent(sessionId)}/qa-drafts`, {
    method: "POST",
    body: JSON.stringify({ action: "create", qaId, text, drafterName }),
  });
  if (!r.ok) return null;
  const data = await lmsJson<{ draft: QaDraft }>(r, "draft qa");
  return data.draft ?? null;
}
export async function lmsApproveQaDraft(sessionId: string, draftId: string): Promise<boolean> {
  const r = await lmsFetch(`/api/lms/live-sessions/${encodeURIComponent(sessionId)}/qa-drafts`, {
    method: "POST",
    body: JSON.stringify({ action: "approve", draftId }),
  });
  return r.ok;
}

export interface LeaderboardRow {
  userExternalId: string;
  displayName: string | null;
  chatCount: number;
  questionsAsked: number;
  questionsAnswered: number;
  upvotesReceived: number;
  pollsVoted: number;
  reactionsSent: number;
  totalPoints: number;
}
export async function lmsGetLeaderboard(sessionId: string, limit = 20): Promise<LeaderboardRow[]> {
  const r = await lmsFetch(`/api/lms/live-sessions/${encodeURIComponent(sessionId)}/leaderboard?limit=${limit}`);
  if (!r.ok) return [];
  const data = await lmsJson<{ leaderboard: LeaderboardRow[] }>(r, "leaderboard");
  return data.leaderboard ?? [];
}

export async function lmsTranslate(sessionId: string, text: string, targetLang: string): Promise<string> {
  const r = await lmsFetch(`/api/lms/live-sessions/${encodeURIComponent(sessionId)}/translate`, {
    method: "POST",
    body: JSON.stringify({ text, targetLang }),
  });
  if (!r.ok) return text;
  const data = await lmsJson<{ text: string }>(r, "translate");
  return data.text ?? text;
}

export async function lmsListCohortLiveSessions(cohortId: string): Promise<LmsLiveSession[]> {
  const r = await crmLmsFetch(`/api/lms/live-sessions?cohortId=${encodeURIComponent(cohortId)}`);
  const { sessions } = await lmsJson<{ ok: boolean; sessions: LmsLiveSession[] }>(r, "list cohort live sessions");
  return sessions;
}

export async function lmsScheduleLiveSession(input: {
  lessonId: string;
  courseId: string;
  cohortId?: string | null;
  title: string;
  scheduledStart?: string | null;
  scheduledEnd?: string | null;
}): Promise<LmsLiveSession> {
  const r = await crmLmsFetch("/api/lms/live-sessions", {
    method: "POST",
    body: JSON.stringify({ action: "schedule", ...input }),
  });
  const { session } = await lmsJson<{ ok: boolean; session: LmsLiveSession }>(r, "schedule live session");
  return session;
}

export interface LmsCertificate {
  id: string;
  course_id: string;
  user_external_id: string;
  verification_code: string;
  full_name_snapshot: string | null;
  course_title_snapshot: string | null;
  pdf_url: string | null;
  issued_at: string;
}

export async function lmsListMyCertificates(): Promise<LmsCertificate[]> {
  // CRM resolves the caller from the Supabase token; no need to pass id.
  const r = await crmLmsFetch(`/api/lms/certificates`);
  const { certificates } = await lmsJson<{ ok: boolean; certificates: LmsCertificate[] }>(r, "list certificates");
  return certificates;
}

export async function lmsGetCertificateForCourse(courseId: string): Promise<LmsCertificate | null> {
  const r = await crmLmsFetch(`/api/lms/certificates?courseId=${encodeURIComponent(courseId)}`);
  const { certificate } = await lmsJson<{ ok: boolean; certificate: LmsCertificate | null }>(r, "get certificate");
  return certificate;
}

// Kept for backwards compat with callers that still pass userExternalId.
export async function lmsGetCertificateForUserCourse(_userExternalId: string, courseId: string): Promise<LmsCertificate | null> {
  return lmsGetCertificateForCourse(courseId);
}

export async function lmsRenderCertificatePdf(code: string): Promise<string | null> {
  const r = await crmLmsFetch("/api/lms/certificates", {
    method: "PATCH",
    body: JSON.stringify({ code }),
  });
  const { pdfUrl } = await lmsJson<{ ok: boolean; pdfUrl: string | null }>(r, "render certificate pdf");
  return pdfUrl;
}

export async function lmsListMyProgress(userExternalId: string, courseId?: string): Promise<Array<Record<string, unknown>>> {
  const params = new URLSearchParams({ userExternalId });
  if (courseId) params.set("courseId", courseId);
  const r = await lmsFetch(`/api/lms/progress?${params.toString()}`);
  const { progress } = await lmsJson<{ ok: boolean; progress: Array<Record<string, unknown>> }>(r, "list progress");
  return progress;
}

export interface CourseProgressSummary {
  totalLessons: number;
  completedLessons: number;
  percent: number;
}

/**
 * Per-course completion % for the signed-in learner. Uses the server's
 * pre-aggregated summary — one round-trip per course.
 */
export async function lmsGetCourseProgressSummary(userExternalId: string, courseId: string): Promise<CourseProgressSummary> {
  try {
    const r = await lmsFetch(`/api/lms/progress?userExternalId=${encodeURIComponent(userExternalId)}&courseId=${encodeURIComponent(courseId)}&summary=1`);
    if (!r.ok) return { totalLessons: 0, completedLessons: 0, percent: 0 };
    const body = await r.json() as { summary?: CourseProgressSummary };
    return body.summary ?? { totalLessons: 0, completedLessons: 0, percent: 0 };
  } catch {
    return { totalLessons: 0, completedLessons: 0, percent: 0 };
  }
}

/**
 * Bulk: fetch progress summaries for every enrolled course in parallel.
 * Returns a map { [courseId]: summary }.
 */
export async function lmsGetProgressMap(userExternalId: string, courseIds: string[]): Promise<Record<string, CourseProgressSummary>> {
  const entries = await Promise.all(
    courseIds.map(async (cid) => [cid, await lmsGetCourseProgressSummary(userExternalId, cid)] as const),
  );
  const map: Record<string, CourseProgressSummary> = {};
  for (const [cid, s] of entries) map[cid] = s;
  return map;
}

// ── Mentors ────────────────────────────────────────────────────────────

export interface LmsMentor {
  user_external_id: string;
  bio: string | null;
  headline: string | null;
  specialization: string[];
  hourly_rate_inr: number | null;
  is_active: boolean;
  full_name?: string;
  email?: string;
  avatar_url?: string | null;
  department?: string | null;
}

export async function lmsListMentors(activeOnly = true): Promise<LmsMentor[]> {
  const params = new URLSearchParams();
  if (activeOnly) params.set("activeOnly", "1");
  const r = await lmsFetch(`/api/lms/mentors?${params.toString()}`);
  const { mentors } = await lmsJson<{ ok: boolean; mentors: LmsMentor[] }>(r, "list mentors");
  return mentors;
}

export async function lmsGetMentor(userExternalId: string): Promise<LmsMentor | null> {
  const r = await lmsFetch(`/api/lms/mentors?userExternalId=${encodeURIComponent(userExternalId)}`);
  if (r.status === 404) return null;
  const { mentor } = await lmsJson<{ ok: boolean; mentor: LmsMentor }>(r, "get mentor");
  return mentor;
}

export async function lmsUpsertMentor(input: {
  userExternalId?: string;
  bio?: string | null;
  headline?: string | null;
  specialization?: string[];
  hourlyRateInr?: number | null;
  isActive?: boolean;
}): Promise<LmsMentor> {
  const r = await lmsFetch("/api/lms/mentors", { method: "PUT", body: JSON.stringify(input) });
  const { mentor } = await lmsJson<{ ok: boolean; mentor: LmsMentor }>(r, "upsert mentor");
  return mentor;
}

// ── Cohorts ────────────────────────────────────────────────────────────

export interface LmsCohort {
  id: string;
  course_id: string;
  name: string;
  description: string | null;
  mentor_external_id: string | null;
  conversation_id: string | null;
  start_date: string | null;
  end_date: string | null;
  capacity: number | null;
  status: "draft" | "active" | "completed" | "archived";
  created_by: string | null;
  created_at: string;
  updated_at: string;
  course_slug?: string;
  course_title?: string;
  mentor_name?: string | null;
  mentor_email?: string | null;
  member_count?: number;
  my_role?: "learner" | "co_mentor" | "observer";
}

export interface LmsCohortMember {
  cohort_id: string;
  user_external_id: string;
  role: "learner" | "co_mentor" | "observer";
  joined_at: string;
  full_name?: string;
  email?: string;
  avatar_url?: string | null;
}

export interface LmsCohortLearnerProgress {
  user_external_id: string;
  full_name: string | null;
  email: string | null;
  completed: number;
  total: number;
}

export async function lmsListMyCohorts(): Promise<LmsCohort[]> {
  const r = await lmsFetch("/api/lms/cohorts?mine=1");
  const { cohorts } = await lmsJson<{ ok: boolean; cohorts: LmsCohort[] }>(r, "list my cohorts");
  return cohorts;
}

export async function lmsListCohorts(opts: { courseId?: string; mentorExternalId?: string; status?: string } = {}): Promise<LmsCohort[]> {
  const params = new URLSearchParams();
  if (opts.courseId) params.set("courseId", opts.courseId);
  if (opts.mentorExternalId) params.set("mentorExternalId", opts.mentorExternalId);
  if (opts.status) params.set("status", opts.status);
  const r = await lmsFetch(`/api/lms/cohorts?${params.toString()}`);
  const { cohorts } = await lmsJson<{ ok: boolean; cohorts: LmsCohort[] }>(r, "list cohorts");
  return cohorts;
}

export async function lmsGetCohort(id: string, include?: "members" | "progress"): Promise<{
  cohort: LmsCohort;
  members?: LmsCohortMember[];
  progress?: LmsCohortLearnerProgress[];
} | null> {
  const params = new URLSearchParams();
  if (include) params.set("include", include);
  const r = await lmsFetch(`/api/lms/cohorts/${encodeURIComponent(id)}?${params.toString()}`);
  if (r.status === 404) return null;
  return lmsJson(r, "get cohort");
}

export async function lmsCreateCohort(input: {
  courseId: string;
  name: string;
  description?: string | null;
  mentorExternalId?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  capacity?: number | null;
}): Promise<LmsCohort> {
  const r = await lmsFetch("/api/lms/cohorts", { method: "POST", body: JSON.stringify(input) });
  const { cohort } = await lmsJson<{ ok: boolean; cohort: LmsCohort }>(r, "create cohort");
  return cohort;
}

export async function lmsUpdateCohort(id: string, patch: Partial<LmsCohort>): Promise<LmsCohort> {
  const r = await lmsFetch(`/api/lms/cohorts/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ patch }),
  });
  const { cohort } = await lmsJson<{ ok: boolean; cohort: LmsCohort }>(r, "update cohort");
  return cohort;
}

export async function lmsAddCohortMembers(id: string, memberIds: string[], role: "learner" | "co_mentor" | "observer" = "learner") {
  const r = await lmsFetch(`/api/lms/cohorts/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ action: "addMembers", memberIds, role }),
  });
  await lmsJson(r, "add cohort members");
}

export async function lmsRemoveCohortMember(id: string, userExternalId: string) {
  const r = await lmsFetch(`/api/lms/cohorts/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ action: "removeMember", userExternalId }),
  });
  await lmsJson(r, "remove cohort member");
}

export async function lmsDeleteCohort(id: string) {
  const r = await lmsFetch(`/api/lms/cohorts/${encodeURIComponent(id)}`, { method: "DELETE" });
  await lmsJson(r, "delete cohort");
}

// ── Mentor scheduling ──────────────────────────────────────────────────

export interface LmsMentorAvailabilityRule {
  id: string;
  mentorExternalId: string;
  cohortId: string | null;
  dayOfWeek: number;
  startMinute: number;
  endMinute: number;
  slotMinutes: number;
  timezone: string;
  isActive: boolean;
}

export interface LmsMentorSlot {
  startAt: string;
  endAt: string;
  slotMinutes: number;
}

export interface LmsMentorBooking {
  id: string;
  mentorExternalId: string;
  learnerExternalId: string;
  cohortId: string | null;
  courseId: string | null;
  startAt: string;
  endAt: string;
  status: "confirmed" | "cancelled" | "completed" | "no_show";
  topic: string | null;
  meetingUrl: string | null;
  notesLearner: string | null;
  notesMentor: string | null;
  cancelledBy: "mentor" | "learner" | "admin" | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  createdAt: string;
}

export async function lmsListMentorAvailability(mentorExternalId: string): Promise<LmsMentorAvailabilityRule[]> {
  const r = await lmsFetch(`/api/lms/mentors/${encodeURIComponent(mentorExternalId)}/availability`);
  const { rules } = await lmsJson<{ rules: LmsMentorAvailabilityRule[] }>(r, "list availability");
  return rules ?? [];
}

export async function lmsUpsertMentorAvailability(
  mentorExternalId: string,
  input: Partial<LmsMentorAvailabilityRule> & {
    dayOfWeek: number; startMinute: number; endMinute: number;
  },
): Promise<LmsMentorAvailabilityRule> {
  const r = await lmsFetch(`/api/lms/mentors/${encodeURIComponent(mentorExternalId)}/availability`, {
    method: "POST",
    body: JSON.stringify(input),
  });
  const { rule } = await lmsJson<{ rule: LmsMentorAvailabilityRule }>(r, "save availability");
  return rule;
}

export async function lmsDeleteMentorAvailability(mentorExternalId: string, ruleId: string): Promise<void> {
  const r = await lmsFetch(
    `/api/lms/mentors/${encodeURIComponent(mentorExternalId)}/availability?ruleId=${encodeURIComponent(ruleId)}`,
    { method: "DELETE" },
  );
  await lmsJson(r, "delete availability");
}

export async function lmsListMentorSlots(
  mentorExternalId: string,
  opts: { cohortId?: string | null; days?: number } = {},
): Promise<LmsMentorSlot[]> {
  const params = new URLSearchParams();
  if (opts.cohortId) params.set("cohortId", opts.cohortId);
  if (opts.days) params.set("days", String(opts.days));
  const r = await lmsFetch(
    `/api/lms/mentors/${encodeURIComponent(mentorExternalId)}/slots${params.toString() ? `?${params}` : ""}`,
  );
  const { slots } = await lmsJson<{ slots: LmsMentorSlot[] }>(r, "list slots");
  return slots ?? [];
}

export async function lmsCreateBooking(input: {
  mentorExternalId: string;
  startAt: string;
  endAt: string;
  cohortId?: string | null;
  courseId?: string | null;
  topic?: string | null;
  notesLearner?: string | null;
}): Promise<LmsMentorBooking> {
  const r = await lmsFetch("/api/lms/bookings", {
    method: "POST",
    body: JSON.stringify(input),
  });
  const { booking } = await lmsJson<{ booking: LmsMentorBooking }>(r, "create booking");
  return booking;
}

export async function lmsListMyBookings(opts: { role?: "mentor" | "learner"; upcoming?: boolean } = {}): Promise<LmsMentorBooking[]> {
  const params = new URLSearchParams();
  if (opts.role) params.set("role", opts.role);
  if (opts.upcoming === false) params.set("upcoming", "false");
  const r = await lmsFetch(`/api/lms/bookings${params.toString() ? `?${params}` : ""}`);
  const { bookings } = await lmsJson<{ bookings: LmsMentorBooking[] }>(r, "list bookings");
  return bookings ?? [];
}

export async function lmsCancelBooking(id: string, reason?: string): Promise<LmsMentorBooking> {
  const r = await lmsFetch(`/api/lms/bookings/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ action: "cancel", reason }),
  });
  const { booking } = await lmsJson<{ booking: LmsMentorBooking }>(r, "cancel booking");
  return booking;
}

export interface LmsCohortCalendar {
  cohort: {
    id: string; name: string;
    mentorExternalId: string | null; mentorName: string | null;
    courseId: string; courseTitle: string; courseSlug: string;
    conversationId: string | null;
    startDate: string | null; endDate: string | null;
  };
  liveSessions: Array<{
    id: string; title: string; scheduledStart: string | null;
    meetingCode: string | null; status: string; lessonId: string;
  }>;
  bookings: Array<{
    id: string; startAt: string; endAt: string; status: string;
    learnerExternalId: string; learnerName: string | null;
    topic: string | null; meetingUrl: string | null;
  }>;
}

export async function lmsGetCohortCalendar(cohortId: string): Promise<LmsCohortCalendar> {
  const r = await lmsFetch(`/api/lms/cohorts/${encodeURIComponent(cohortId)}/calendar`);
  return await lmsJson<LmsCohortCalendar>(r, "cohort calendar");
}

/* ─── Learner-scoped calendar — events authored by admin for this user's
 * enrolled cohorts/courses + workspace-wide announcements. */
export type LmsCalendarEventKind = "class" | "exam" | "assignment" | "holiday" | "event";
export interface LmsCalendarEvent {
  id: string;
  kind: LmsCalendarEventKind;
  title: string;
  description: string | null;
  startsAt: string;
  endsAt: string | null;
  cohortId: string | null;
  courseId: string | null;
  url: string | null;
  color: string | null;
  cohortName?: string | null;
  courseTitle?: string | null;
}

export async function lmsGetMyCalendar(opts: { fromIso: string; toIso: string }): Promise<LmsCalendarEvent[]> {
  const r = await lmsFetch(`/api/lms/me/calendar?from=${encodeURIComponent(opts.fromIso)}&to=${encodeURIComponent(opts.toIso)}`);
  const { events } = await lmsJson<{ events: LmsCalendarEvent[] }>(r, "my calendar");
  return events ?? [];
}

export async function lmsSetBookingMeetingUrl(id: string, meetingUrl: string): Promise<LmsMentorBooking> {
  const r = await lmsFetch(`/api/lms/bookings/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ action: "setMeetingUrl", meetingUrl }),
  });
  const { booking } = await lmsJson<{ booking: LmsMentorBooking }>(r, "set meeting url");
  return booking;
}
