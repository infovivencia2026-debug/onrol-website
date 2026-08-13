import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { tmUpsertOfficeUser } from "@/lib/tmClient";
import { ensureWebPushRegistered } from "@/lib/pushNotifications";
import { ensureCapacitorPushRegistered, isNativeApp } from "@/lib/capacitorPush";
import type { OfficeUser, Role } from "@/types/taskManager";
import { resolveDisplayName, getErrorMessage, raceWithTimeout } from "@/utils/taskManager";

export interface ProfileDraft {
  fullName: string;
  department: string;
  avatarUrl?: string | null;
  phone?: string;
  bio?: string;
  statusMessage?: string;
  linkedin?: string;
}

export interface UseAuthReturn {
  session: Session | null;
  authUser: User | null;
  officeUser: OfficeUser | null;
  loading: boolean;
  pageLoading: boolean;
  authBootError: string | null;
  bootStep: "idle" | "session" | "profile" | "tasks" | "ready";
  profileDraft: ProfileDraft;
  setProfileDraft: React.Dispatch<React.SetStateAction<ProfileDraft>>;
  profileSaving: boolean;
  updateProfile: () => Promise<void>;
  setBootStep: React.Dispatch<React.SetStateAction<"idle" | "session" | "profile" | "tasks" | "ready">>;
  setAuthBootError: React.Dispatch<React.SetStateAction<string | null>>;
  setPageLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

const withUiTimeout = async <T,>(promise: PromiseLike<T>, timeoutMs: number, timeoutLabel: string): Promise<T> => {
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

export default function useAuth(): UseAuthReturn {
  const navigate = useNavigate();
  const location = useLocation();

  const [session, setSession] = useState<Session | null>(null);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [officeUser, setOfficeUser] = useState<OfficeUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(false);
  const [authBootError, setAuthBootError] = useState<string | null>(null);
  const [bootStep, setBootStep] = useState<"idle" | "session" | "profile" | "tasks" | "ready">("idle");
  const [profileDraft, setProfileDraft] = useState<ProfileDraft>({ fullName: "", department: "", phone: "", bio: "", statusMessage: "", linkedin: "" });
  const [profileSaving, setProfileSaving] = useState(false);

  // Sync profileDraft from officeUser (DB is source of truth) with localStorage as a fallback
  // for legacy users whose extended fields haven't yet been saved to the DB.
  useEffect(() => {
    if (!officeUser) return;
    const extKey = `profile-ext-${officeUser.id}`;
    let ext: Partial<ProfileDraft> = {};
    try { ext = JSON.parse(localStorage.getItem(extKey) ?? "{}") as Partial<ProfileDraft>; } catch { /* ignore */ }
    setProfileDraft({
      fullName: officeUser.full_name || "",
      department: officeUser.department || "",
      avatarUrl: officeUser.avatar_url || ext.avatarUrl || "",
      phone: officeUser.phone || ext.phone || "",
      bio: officeUser.bio || ext.bio || "",
      statusMessage: officeUser.status_message || ext.statusMessage || "",
      linkedin: officeUser.linkedin || ext.linkedin || "",
    });
  }, [officeUser]);

  // Redirect based on pathname for admin/employee
  useEffect(() => {
    if (!officeUser) return;
    if (location.pathname === "/task/app") {
      if (officeUser.role === "admin") {
        navigate("/admin/dashboard", { replace: true });
      } else {
        navigate("/task/journey", { replace: true });
      }
    }
  }, [officeUser, location.pathname, navigate]);

  // Redirect if not loading and no session
  useEffect(() => {
    if (!loading && !session) {
      navigate("/task", { replace: true });
    }
  }, [loading, session, navigate]);

  const ensureOfficeUser = useCallback(async (user: User): Promise<OfficeUser> => {
    const { data, error } = await supabase
      .from("office_users")
      .select("id,full_name,email,role,department,is_active,phone,bio,status_message,linkedin,avatar_url")
      .eq("id", user.id)
      .maybeSingle();

    if (!error && data) return data as OfficeUser;

    let role: Role = "employee";
    let department = "Operations";
    const email = (user.email || "").toLowerCase();
    // Admin safeguard: if this auth user exists in admins table,
    // keep role as admin even when office_users row is missing.
    try {
      const { data: adminById } = await supabase
        .from("admins")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();
      if (adminById?.id) {
        role = "admin";
      } else if (email) {
        const { data: adminByEmail } = await supabase
          .from("admins")
          .select("id")
          .ilike("email", email)
          .maybeSingle();
        if (adminByEmail?.id) role = "admin";
      }
    } catch {
      // Ignore when admins table/policy is unavailable in a given environment.
    }
    if (email) {
      try {
        const { data: inviteMatch } = await supabase
          .from("office_user_invites")
          .select("id,role,department,status")
          .eq("email", email)
          .eq("status", "pending")
          .maybeSingle();
        if (inviteMatch) {
          // Never downgrade an admin confirmed via the admins table.
          const inviteRole = (inviteMatch.role as Role) || "employee";
          if (role !== "admin") role = inviteRole;
          department = inviteMatch.department || department;
          await supabase
            .from("office_user_invites")
            .update({ status: "accepted" })
            .eq("id", inviteMatch.id);
        }
      } catch {
        // Invite table might not be migrated yet; continue with employee defaults.
      }
    }

    const payload = {
      id: user.id,
      full_name: resolveDisplayName(user),
      email: user.email || "",
      role,
      department,
      is_active: true,
    };

    const { data: created, error: createErr } = await supabase
      .from("office_users")
      .upsert(payload, { onConflict: "id" })
      .select("id,full_name,email,role,department,is_active,phone,bio,status_message,linkedin,avatar_url")
      .single();

    if (createErr) throw createErr;
    return created as OfficeUser;
  }, []);

  const updateProfile = useCallback(async () => {
    if (!officeUser) return;
    const trimmedName = profileDraft.fullName.trim();
    const trimmedDepartment = profileDraft.department.trim();
    if (!trimmedName) {
      toast.error("Name cannot be empty.");
      return;
    }
    // Save extended fields (including avatar) to localStorage
    const extKey = `profile-ext-${officeUser.id}`;
    try {
      localStorage.setItem(extKey, JSON.stringify({
        phone: profileDraft.phone ?? "",
        bio: profileDraft.bio ?? "",
        statusMessage: profileDraft.statusMessage ?? "",
        linkedin: profileDraft.linkedin ?? "",
        avatarUrl: profileDraft.avatarUrl ?? "",
      }));
    } catch { /* ignore */ }

    setProfileSaving(true);
    const savingWatchdog = setTimeout(() => {
      setProfileSaving(false);
      toast.error("Profile save timed out. Please check connection and try again.");
    }, 15000);
    try {
      // Full profile payload — includes extended fields now persisted in the DB.
      // Run the migration at supabase/migrations/20260417_office_users_profile.sql first.
      const updates: Record<string, unknown> = {
        full_name: trimmedName,
        department: trimmedDepartment || null,
        phone: profileDraft.phone?.trim() || null,
        bio: profileDraft.bio?.trim() || null,
        status_message: profileDraft.statusMessage?.trim() || null,
        linkedin: profileDraft.linkedin?.trim() || null,
        avatar_url: profileDraft.avatarUrl?.trim() || null,
      };

      // Optimistic UI update so button never feels stuck.
      const previousOfficeUser = officeUser;
      setOfficeUser((prev) =>
        prev
          ? {
              ...prev,
              full_name: updates.full_name as string,
              department: (updates.department as string) ?? null,
              phone: updates.phone as string | null,
              bio: updates.bio as string | null,
              status_message: updates.status_message as string | null,
              linkedin: updates.linkedin as string | null,
              avatar_url: updates.avatar_url as string | null,
            }
          : prev,
      );

      let updateError: string | null = null;
      try {
        await withUiTimeout(
          tmUpsertOfficeUser({
            email: officeUser.email,
            userExternalId: officeUser.id,
            fullName: trimmedName,
            department: trimmedDepartment || undefined,
            phone: profileDraft.phone?.trim() || undefined,
            bio: profileDraft.bio?.trim() || null,
            statusMessage: profileDraft.statusMessage?.trim() || null,
            linkedin: profileDraft.linkedin?.trim() || null,
            avatarUrl: profileDraft.avatarUrl?.trim() || null,
            role: officeUser.role,
            isActive: officeUser.is_active ?? true,
          }),
          8000,
          "Profile save timed out. Please check connection and try again.",
        );
      } catch (error: unknown) {
        updateError = getErrorMessage(error, "Unable to update profile settings.");
      }

      if (updateError) {
        // Revert optimistic state only when the DB write failed.
        setOfficeUser(previousOfficeUser);
        throw new Error(updateError);
      }

      // Auth metadata sync is best-effort and should not block user save flow.
      void withUiTimeout(
        supabase.auth.updateUser({
          data: {
            full_name: trimmedName,
            department: trimmedDepartment || null,
          },
        }),
        5000,
        "Profile metadata sync timed out.",
      ).catch(() => {
        // Ignore metadata sync errors; office_users remains source of truth.
      });

      toast.success("Profile settings updated.");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Unable to update profile settings."));
    } finally {
      clearTimeout(savingWatchdog);
      setProfileSaving(false);
    }
  }, [officeUser, profileDraft]);

  // Main auth boot useEffect
  useEffect(() => {
    let mounted = true;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    // Track the user ID that boot() has already loaded a profile for.
    // onAuthStateChange skips profile loading for the same user to prevent
    // the SIGNED_IN event racing with boot() and overwriting the admin role.
    let profileLoadedForUserId: string | null = null;

    const ensureOfficeUserWithFallback = async (user: User): Promise<OfficeUser> => {
      const fallbackRole =
        typeof user.user_metadata?.role === "string" && user.user_metadata.role === "admin"
          ? "admin"
          : "employee";
      const fallbackProfile: OfficeUser = {
        id: user.id,
        full_name: resolveDisplayName(user),
        email: user.email || "",
        role: fallbackRole,
        department: "Operations",
        is_active: true,
      };

      try {
        return await Promise.race<OfficeUser>([
          ensureOfficeUser(user),
          new Promise<OfficeUser>((resolve) => {
            setTimeout(() => resolve(fallbackProfile), 12000);
          }),
        ]);
      } catch {
        return fallbackProfile;
      }
    };

    const boot = async () => {
      try {
        setBootStep("session");
        const { data } = await raceWithTimeout(
          supabase.auth.getSession(),
          10000,
          "Session check timed out.",
        );
        if (!mounted) return;
        setSession(data?.session ?? null);
        setAuthUser(data?.session?.user ?? null);
        if (!data?.session?.user) {
          setBootStep("ready");
          return;
        }
        setBootStep("profile");
        // Mark the user ID *before* the async fetch so that any concurrent
        // SIGNED_IN / USER_UPDATED event from onAuthStateChange sees it and
        // skips a duplicate profile load — preventing the admin→employee race.
        profileLoadedForUserId = data.session.user.id;
        const profile = await ensureOfficeUserWithFallback(data.session.user);
        if (!mounted) return;
        setOfficeUser(profile);
        // Silent push re-subscribe on cold boot. Native apps use FCM; web uses Web Push.
        if (isNativeApp()) {
          void ensureCapacitorPushRegistered().catch(() => {});
        } else {
          void ensureWebPushRegistered().catch(() => {});
        }
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        setLoading(false);
        return;
      } catch (error: unknown) {
        setAuthBootError(getErrorMessage(error, "Unable to initialize task manager."));
        toast.error(getErrorMessage(error, "Unable to initialize task manager."));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    timeoutId = setTimeout(() => {
      if (!mounted) return;
      setAuthBootError((prev) => prev ?? "Initialization timeout while connecting to Supabase. Please check network and retry.");
      setLoading(false);
    }, 15000);

    boot();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
      if (!mounted) return;
      setSession(nextSession ?? null);
      setAuthUser(nextSession?.user ?? null);

      if (!nextSession?.user) {
        setBootStep("session");
        setOfficeUser(null);
        setLoading(false);
        return;
      }

      // TOKEN_REFRESHED and INITIAL_SESSION don't change profile data.
      // Any other event (SIGNED_IN, USER_UPDATED, etc.) for the same user ID
      // is also skipped if boot() already loaded their profile — this is the
      // primary guard against the race that overwrites admin → employee.
      if (event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION") {
        return;
      }
      if (profileLoadedForUserId === nextSession.user.id) {
        // boot() already handled this user; no reload needed.
        return;
      }

      // Different user (account switch) — load their profile.
      try {
        setBootStep("profile");
        const profile = await ensureOfficeUserWithFallback(nextSession.user);
        if (!mounted) return;
        profileLoadedForUserId = nextSession.user.id;
        setOfficeUser(profile);
        // Silent push re-subscribe on auth state change (login / account switch).
        if (isNativeApp()) {
          void ensureCapacitorPushRegistered().catch(() => {});
        } else {
          void ensureWebPushRegistered().catch(() => {});
        }
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        setLoading(false);
      } catch (error: unknown) {
        setAuthBootError(getErrorMessage(error, "Unable to load task profile."));
        toast.error(getErrorMessage(error, "Unable to load task profile."));
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [ensureOfficeUser]);

  return {
    session,
    authUser,
    officeUser,
    loading,
    pageLoading,
    authBootError,
    bootStep,
    profileDraft,
    setProfileDraft,
    profileSaving,
    updateProfile,
    setBootStep,
    setAuthBootError,
    setPageLoading,
  };
}
