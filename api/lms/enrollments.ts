import { getAuthUserId, getErrorMessage } from "../meetings/_utils";
import { getOfficeRole, isAdmin, isMentorOrAdmin } from "./_utils";
import {
  crmListEnrollmentsForUser, crmListEnrollmentsForCourse, crmCheckEnrolled,
  crmEnroll, crmSetEnrollmentStatus,
} from "./_crm";

type ApiRequest = {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
  query?: Record<string, string | string[] | undefined>;
  body?: unknown;
};

type ApiResponse = {
  status: (code: number) => { json: (payload: unknown) => unknown };
};

function stringQ(v: string | string[] | undefined): string | undefined {
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v[0];
  return undefined;
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    const userId = await getAuthUserId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    if (req.method === "GET") {
      const check = req.query?.check === "1";
      const courseId = stringQ(req.query?.courseId);
      const otherUserId = stringQ(req.query?.userExternalId);
      if (check && courseId) {
        // Check-mode: a learner asks "am I enrolled in X?"
        const target = otherUserId && (await getOfficeRole(userId), true) ? otherUserId : userId;
        const enrolled = await crmCheckEnrolled(target, courseId);
        return res.status(200).json({ ok: true, enrolled });
      }
      // List-by-course: admin/mentor only.
      if (courseId && !otherUserId) {
        const role = await getOfficeRole(userId);
        if (!isMentorOrAdmin(role)) return res.status(403).json({ error: "Admins or mentors only" });
        const rows = await crmListEnrollmentsForCourse(courseId);
        return res.status(200).json({ ok: true, enrollments: rows });
      }
      // List-by-user: caller can see their own; admin can see anyone's.
      const target = otherUserId || userId;
      if (target !== userId) {
        const role = await getOfficeRole(userId);
        if (!isMentorOrAdmin(role)) return res.status(403).json({ error: "Admins or mentors only" });
      }
      const rows = await crmListEnrollmentsForUser(target);
      return res.status(200).json({ ok: true, enrollments: rows });
    }

    if (req.method === "POST") {
      const role = await getOfficeRole(userId);
      if (!isAdmin(role)) return res.status(403).json({ error: "Admins only" });
      const body = (typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {})) as {
        action?: string;
        id?: string;
        status?: "active" | "expired" | "revoked" | "refunded";
        courseId?: string;
        userExternalId?: string;
        source?: string;
        expiresAt?: string | null;
      };
      if (body.action === "setStatus" && body.id && body.status) {
        return res.status(200).json(await crmSetEnrollmentStatus(body.id, body.status));
      }
      if (!body.courseId || !body.userExternalId) {
        return res.status(400).json({ error: "courseId + userExternalId required" });
      }
      const enrollment = await crmEnroll({
        courseId: body.courseId,
        userExternalId: body.userExternalId,
        enrolledBy: userId,
        source: body.source,
        expiresAt: body.expiresAt ?? null,
      });
      return res.status(200).json({ ok: true, enrollment });
    }
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error: unknown) {
    const status = (error as Error & { status?: number })?.status ?? 500;
    return res.status(status).json({ error: getErrorMessage(error, "Enrollments request failed") });
  }
}
