import { getAuthUserId, getErrorMessage } from "../meetings/_utils";
import { getOfficeRole, isAdmin } from "./_utils";
import {
  crmListCourses, crmGetCourse, crmCreateCourse, crmCheckEnrolled,
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
      const slug = stringQ(req.query?.slug);
      const id = stringQ(req.query?.id);
      const includeOutline = req.query?.includeOutline === "1";
      if (slug || id) {
        const result = await crmGetCourse({ slug, id, includeOutline, userExternalId: userId });
        if (!result) return res.status(404).json({ error: "Course not found" });
        // Strip lesson video URLs for non-enrolled, non-preview lessons.
        const role = await getOfficeRole(userId);
        const courseId = String((result.course as { id?: unknown }).id ?? "");
        const allowAll = isAdmin(role) || role === "mentor"
          || (courseId ? await crmCheckEnrolled(userId, courseId) : false);
        if (!allowAll && result.modules) {
          result.modules = result.modules.map((m) => ({
            ...m,
            lessons: ((m as { lessons?: Array<Record<string, unknown>> }).lessons ?? []).map((l) => {
              const free = Boolean(l.is_free_preview);
              if (free) return l;
              return { ...l, video_url: null, body_md: null, attachments: [] };
            }),
          }));
        }
        return res.status(200).json({ ...result, enrolled: allowAll });
      }
      const publishedOnly = req.query?.publishedOnly === "1";
      const courses = await crmListCourses({
        publishedOnly,
        createdBy: stringQ(req.query?.createdBy),
        limit: Number(stringQ(req.query?.limit) ?? "200"),
      });
      return res.status(200).json({ ok: true, courses });
    }

    if (req.method === "POST") {
      const role = await getOfficeRole(userId);
      if (!isAdmin(role) && role !== "mentor") {
        return res.status(403).json({ error: "Admins or mentors only" });
      }
      const body = (typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {})) as Record<string, unknown>;
      body.created_by = userId;
      const course = await crmCreateCourse(body);
      return res.status(200).json({ ok: true, course });
    }
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error: unknown) {
    const status = (error as Error & { status?: number })?.status ?? 500;
    return res.status(status).json({ error: getErrorMessage(error, "Courses request failed") });
  }
}
