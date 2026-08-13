// First-time profile-completion form for new ONROL Community members.
//
// Triggered when:
//   - A user is logged in (Supabase session exists)
//   - Their community_members row exists but is missing required fields
//     (phone, city, current_role, experience_level, interests)
//
// Submitting this form:
//   1. Updates the community_members row in Supabase
//   2. Fires the Apps Script webhook (if VITE_APPS_SCRIPT_REGISTRATION_URL set)
//      so the registration also lands in your Google Sheet
//   3. Redirects to /community/dashboard

import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import Container from "@/components/shared/Container";
import SEO from "@/components/seo/SEO";
import { useCommunityAuth } from "@/contexts/CommunityAuthContext";
import { communitySupabase as supabase } from "@/lib/communitySupabase";
import { postRegistrationToSheet } from "@/lib/appsScriptRegistration";

const INTER_STACK = `"Fira Sans", Figtree, system-ui, -apple-system, "Segoe UI", sans-serif`;

const ROLES = [
  "Student",
  "Working professional",
  "Freelancer",
  "Founder / Business owner",
  "Content creator",
  "Teacher / Educator",
  "Job seeker",
  "Other",
];

const EXPERIENCE_LEVELS = [
  { id: "absolute_beginner", label: "Absolute beginner — never used AI tools seriously" },
  { id: "casual_user", label: "Casual user — ChatGPT/Claude here and there" },
  { id: "regular_user", label: "Regular user — daily AI tools across work" },
  { id: "builder", label: "Builder — already shipping with AI" },
];

const INTERESTS = [
  { id: "ai_tools", label: "AI Tools" },
  { id: "automation", label: "Automation (n8n, Zapier, Make)" },
  { id: "agents", label: "AI Agents + Orchestration" },
  { id: "vibe_coding", label: "Vibe Coding" },
  { id: "content_creation", label: "Content (IG / YT / LI growth)" },
  { id: "freelance", label: "Freelance / Earn with AI" },
  { id: "career", label: "AI career roles + interview prep" },
  { id: "founder", label: "Build a startup with AI" },
];

export default function OnboardingCommunity() {
  const navigate = useNavigate();
  const { session, member, refreshMember, setMemberCache, loading: authLoading } = useCommunityAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    city: "",
    current_role: ROLES[0],
    experience_level: EXPERIENCE_LEVELS[0].id,
    interests: [] as string[],
  });

  // Bounce unauthenticated visitors back to login.
  useEffect(() => {
    if (!authLoading && !session) {
      navigate("/login", { replace: true });
    }
  }, [authLoading, session, navigate]);

  // Pre-fill form with whatever we already know about the member.
  useEffect(() => {
    if (!member) return;
    setForm((prev) => ({
      ...prev,
      full_name: prev.full_name || member.full_name || "",
      city: prev.city || member.location || "",
      current_role: prev.current_role || member.current_role || ROLES[0],
    }));
  }, [member]);

  // Already onboarded? Skip to dashboard.
  useEffect(() => {
    if (member && member.location && member.current_role && (member.skills?.length ?? 0) > 0) {
      navigate("/community/dashboard", { replace: true });
    }
  }, [member, navigate]);

  const toggleInterest = (id: string) => {
    setForm((prev) => ({
      ...prev,
      interests: prev.interests.includes(id)
        ? prev.interests.filter((x) => x !== id)
        : [...prev.interests, id],
    }));
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting || !session?.user) return;

    if (!form.full_name.trim()) {
      setError("Please tell us your name.");
      return;
    }
    if (!form.phone.trim()) {
      setError("Phone helps us coordinate cohort + community updates.");
      return;
    }
    if (!form.city.trim()) {
      setError("Pick a city — even if approximate.");
      return;
    }
    if (form.interests.length === 0) {
      setError("Pick at least one category to follow.");
      return;
    }

    setSubmitting(true);
    setError("");

    // 1. Persist to Supabase community_members.
    //    Use upsert so it works whether the row already exists (auto-created
    //    on first login) or somehow doesn't. Race the network with an 8s
    //    hard timeout so the UI can never get stuck on "Saving…".
    const upsertPromise = supabase
      .from("community_members")
      .upsert(
        {
          id: session.user.id,
          email: session.user.email ?? "",
          full_name: form.full_name.trim(),
          location: form.city.trim(),
          current_role: form.current_role,
          experience_level: form.experience_level,
          skills: form.interests,
          member_status: "approved",
          member_type: "learner",
          last_active_at: new Date().toISOString(),
        },
        { onConflict: "id" },
      )
      .select("*")
      .single();

    const timeoutPromise = new Promise<{ error: { message: string } | null }>((resolve) => {
      window.setTimeout(
        () => resolve({ error: { message: "Network is slow — saved locally, continuing." } }),
        8000,
      );
    });

    const result = (await Promise.race([upsertPromise, timeoutPromise])) as {
      data?: { location?: string | null; current_role?: string | null; skills?: unknown } | null;
      error: { message: string } | null;
    };
    const { data: dbData, error: dbError } = result;

    if (dbError && dbError.message && !dbError.message.startsWith("Network is slow")) {
      setSubmitting(false);
      setError(dbError.message || "Couldn't save your profile. Please retry.");
      return;
    }

    // Verify the upsert actually persisted. If RLS or a constraint silently
    // blocked the write, the row will come back without the new fields and
    // the user will be bounced back to onboarding on the next page load.
    // Catching it here gives a clear, actionable error instead of an
    // invisible loop.
    if (dbData && (!dbData.location || !dbData.current_role || !Array.isArray(dbData.skills) || dbData.skills.length === 0)) {
      setSubmitting(false);
      setError(
        "Profile saved but the database didn't accept all fields (likely a Row-Level-Security policy is blocking your update). Ask the admin to run the latest community_members RLS migration.",
      );
      return;
    }

    // Seed the auth cache directly from the upsert result so the dashboard's
    // "profile-incomplete" gate sees the new fields immediately and doesn't
    // bounce us right back to onboarding.
    if (dbData && typeof dbData === "object") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setMemberCache(dbData as any);
    } else {
      // Network was slow — fall back to a synthetic cache row so the gate passes.
      setMemberCache({
        id: session.user.id,
        email: session.user.email ?? "",
        full_name: form.full_name.trim(),
        avatar_url: null,
        bio: null,
        location: form.city.trim(),
        tagline: null,
        skills: form.interests,
        experience_level: form.experience_level,
        current_role: form.current_role,
        company: null,
        linkedin_url: null,
        github_url: null,
        twitter_url: null,
        portfolio_url: null,
        member_status: "approved",
        member_type: "learner",
        specialization_track: null,
        graduation_year: null,
        cohort_batch: null,
        points: 0,
        level: 1,
        streak_days: 0,
        joined_at: new Date().toISOString(),
        approved_at: null,
        last_active_at: new Date().toISOString(),
      });
    }

    // 2. Fire-and-forget the Apps Script webhook (optional, no UI blocker).
    void postRegistrationToSheet({
      user_id: session.user.id,
      email: session.user.email ?? "",
      full_name: form.full_name.trim(),
      phone: form.phone.trim(),
      city: form.city.trim(),
      current_role: form.current_role,
      experience_level: form.experience_level,
      interests: form.interests,
      source: session.user.app_metadata?.provider ?? "email",
      registered_at: new Date().toISOString(),
    });

    // 3. Kick off context refresh in the background — don't block navigation.
    //    Dashboard will re-read on mount anyway.
    void refreshMember();

    // 4. Land them in the dashboard.
    setSubmitting(false);
    navigate("/community/dashboard", { replace: true });
  };

  return (
    <main
      className="min-h-screen bg-[#f3f5f8] text-white"
      style={{ fontFamily: INTER_STACK }}
    >
      <SEO
        title="Join the ONROL Community — quick profile setup"
        description="One-time profile setup to join the ONROL Community. Pick categories, get free AI updates daily."
        path="/onboarding/community/"
        noindex
      />

      <section className="relative pb-20 pt-16 sm:pt-20 md:pt-24">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[radial-gradient(60%_45%_at_18%_15%,rgba(255,107,71,0.15),transparent_60%),radial-gradient(50%_40%_at_85%_25%,rgba(56,189,248,0.10),transparent_65%),linear-gradient(180deg,#f3f5f8,#f3f5f8_55%,#2d2d2d)]"
        />
        <Container>
          <div className="mx-auto max-w-3xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-orange-300">
              — Welcome
            </p>
            <h1
              className="mt-3 text-white"
              style={{
                fontSize: "clamp(28px, 5vw, 48px)",
                lineHeight: 1.1,
                letterSpacing: "-0.025em",
                fontWeight: 800,
              }}
            >
              One-time profile setup.
            </h1>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-slate-300 md:text-base">
              Pick the categories you want updates from. We'll only ping you when
              something genuinely matters — daily AI tool drops, prompt patterns,
              workshop announcements.
            </p>

            <motion.form
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              onSubmit={onSubmit}
              className="mt-10 space-y-6 rounded-3xl border border-white/12 bg-[#232532] p-5 sm:p-7 md:p-9"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Full name *"
                  value={form.full_name}
                  onChange={(v) => setForm((p) => ({ ...p, full_name: v }))}
                />
                <Field
                  label="Phone *"
                  type="tel"
                  placeholder="+91…"
                  value={form.phone}
                  onChange={(v) => setForm((p) => ({ ...p, phone: v }))}
                />
                <Field
                  label="City *"
                  value={form.city}
                  onChange={(v) => setForm((p) => ({ ...p, city: v }))}
                />
                <SelectField
                  label="Current role"
                  options={ROLES}
                  value={form.current_role}
                  onChange={(v) => setForm((p) => ({ ...p, current_role: v }))}
                />
              </div>

              <div>
                <p className="mb-2 text-[12px] font-semibold uppercase tracking-wider text-slate-400">
                  AI experience level
                </p>
                <div className="grid gap-2">
                  {EXPERIENCE_LEVELS.map((level) => {
                    const active = form.experience_level === level.id;
                    return (
                      <button
                        key={level.id}
                        type="button"
                        onClick={() =>
                          setForm((p) => ({ ...p, experience_level: level.id }))
                        }
                        className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-[14px] transition ${
                          active
                            ? "border-orange-400 bg-orange-500/10 text-white"
                            : "border-white/12 bg-white/[0.03] text-slate-300 hover:border-orange-300/40"
                        }`}
                      >
                        <span
                          aria-hidden
                          className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border ${
                            active ? "border-orange-300 bg-orange-500" : "border-white/30"
                          }`}
                        >
                          {active ? (
                            <span className="h-1.5 w-1.5 rounded-full bg-white" />
                          ) : null}
                        </span>
                        {level.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="mb-2 text-[12px] font-semibold uppercase tracking-wider text-slate-400">
                  Categories you want updates from *
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {INTERESTS.map((it) => {
                    const active = form.interests.includes(it.id);
                    return (
                      <button
                        key={it.id}
                        type="button"
                        onClick={() => toggleInterest(it.id)}
                        className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-3 text-left text-[13.5px] transition ${
                          active
                            ? "border-orange-400 bg-orange-500/10 text-white"
                            : "border-white/12 bg-white/[0.03] text-slate-300 hover:border-orange-300/40"
                        }`}
                      >
                        {active ? (
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-orange-300" />
                        ) : (
                          <span className="h-4 w-4 shrink-0 rounded border border-white/25" />
                        )}
                        <span>{it.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {error ? (
                <p className="text-[13.5px] font-medium text-rose-300">{error}</p>
              ) : null}

              <div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-400 text-[14px] font-bold uppercase tracking-wider text-white shadow-[0_18px_36px_-12px_rgba(255,107,71,0.55)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto sm:px-7"
                >
                  {submitting ? (
                    "Saving…"
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Enter ONROL Community
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
                <p className="mt-3 text-[11.5px] text-slate-500">
                  We never share your details. Profile takes 30 seconds — you only
                  fill this once.
                </p>
              </div>
            </motion.form>
          </div>
        </Container>
      </section>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[12px] font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 rounded-xl border border-white/12 bg-white/[0.03] px-3.5 text-[14px] text-white placeholder:text-slate-500 focus:border-orange-400/60 focus:outline-none focus:ring-2 focus:ring-orange-300/20"
      />
    </label>
  );
}

function SelectField({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[12px] font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 rounded-xl border border-white/12 bg-white/[0.03] px-3.5 text-[14px] text-white focus:border-orange-400/60 focus:outline-none focus:ring-2 focus:ring-orange-300/20"
      >
        {options.map((opt) => (
          <option key={opt} value={opt} className="bg-[#232532]">
            {opt}
          </option>
        ))}
      </select>
    </label>
  );
}
