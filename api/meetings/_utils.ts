import { createClient } from "@supabase/supabase-js";

type RequestLike = {
  headers?: Record<string, string | string[] | undefined>;
};

export function getAdminSupabase() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing SUPABASE_URL (or VITE/NEXT_PUBLIC fallback) or SUPABASE_SERVICE_ROLE_KEY.");
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function getAuthUserId(req: RequestLike) {
  const authHeader = req.headers?.authorization || req.headers?.Authorization;
  const normalizedHeader = Array.isArray(authHeader) ? authHeader[0] : authHeader;
  const token = typeof normalizedHeader === "string" && normalizedHeader.startsWith("Bearer ")
    ? normalizedHeader.slice("Bearer ".length)
    : null;
  if (!token) return null;

  const supabaseAdmin = getAdminSupabase();
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
}

export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return fallback;
}

// Generate unique 6-character meeting code
export function generateMeetingCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
