// /community/members — directory of approved community members.
// Polished to match the Discord-style theme: real avatar primitive,
// skeleton grid while loading, empty state when no matches.

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Briefcase, Github, Linkedin, Mail, MapPin, Search, Users } from "lucide-react";
import { communitySupabase as supabase } from "@/lib/communitySupabase";
import { CommunityLayout } from "@/components/community/CommunityLayout";
import {
  Badge,
  CommunityAvatar,
  EmptyState,
  PageHeader,
  SkeletonCard,
  Surface,
} from "@/components/community/CommunityPrimitives";

type MemberItem = {
  id: string;
  full_name?: string | null;
  email?: string | null;
  tagline?: string | null;
  level?: number | null;
  points?: number | null;
  current_role?: string | null;
  company?: string | null;
  location?: string | null;
  skills?: string[] | null;
  linkedin_url?: string | null;
  github_url?: string | null;
};

const Members = () => {
  const [members, setMembers] = useState<MemberItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase
          .from("community_members")
          .select("*")
          .eq("member_status", "approved")
          .order("points", { ascending: false });
        if (!cancelled) setMembers((data || []) as MemberItem[]);
      } catch (err) {
        console.error("[members] fetch failed:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredMembers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return members;
    return members.filter(
      (m) =>
        m.full_name?.toLowerCase().includes(q) ||
        m.email?.toLowerCase().includes(q) ||
        m.tagline?.toLowerCase().includes(q) ||
        m.current_role?.toLowerCase().includes(q) ||
        m.location?.toLowerCase().includes(q) ||
        m.skills?.some((s) => s.toLowerCase().includes(q)),
    );
  }, [members, searchQuery]);

  return (
    <CommunityLayout>
      <div className="space-y-5">
        <PageHeader
          eyebrow="Directory"
          title="Members"
          description={`${members.length} approved builder${members.length === 1 ? "" : "s"} across India.`}
        />

        {/* Search */}
        <div className="flex items-center gap-2 rounded-md border border-white/[0.06] bg-[#232532] px-3 py-2 focus-within:border-orange-500/60 focus-within:ring-2 focus-within:ring-orange-500/20">
          <Search className="h-3.5 w-3.5 text-zinc-500" />
          <input
            type="search"
            placeholder="Search by name, role, location, or skill…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-[13.5px] text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
          />
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filteredMembers.length === 0 ? (
          <EmptyState
            icon={Users}
            title={members.length === 0 ? "No approved members yet" : "No matches"}
            body={members.length === 0
              ? "When members complete onboarding, their profiles will show up here."
              : "Try a different name, role, location, or skill."
            }
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {filteredMembers.map((m, idx) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: Math.min(idx * 0.02, 0.3) }}
              >
                <Surface hover className="flex h-full flex-col p-4">
                  {/* Header */}
                  <div className="flex items-start gap-3">
                    <CommunityAvatar name={m.full_name} email={m.email} size="lg" status="online" />
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-[14.5px] font-semibold text-zinc-100">
                        {m.full_name || "Member"}
                      </h3>
                      <p className="truncate text-[12.5px] text-zinc-400">
                        {m.tagline || "AI Builder"}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <Badge tone="orange">Lvl {m.level || 1}</Badge>
                        <Badge tone="amber">{m.points || 0} pts</Badge>
                      </div>
                    </div>
                  </div>

                  {/* Info rows */}
                  <div className="mt-3 space-y-1.5 text-[12.5px]">
                    {m.current_role ? (
                      <div className="flex items-center gap-2 text-zinc-400">
                        <Briefcase className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
                        <span className="truncate">
                          {m.current_role}{m.company ? ` · ${m.company}` : ""}
                        </span>
                      </div>
                    ) : null}
                    {m.location ? (
                      <div className="flex items-center gap-2 text-zinc-400">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
                        <span>{m.location}</span>
                      </div>
                    ) : null}
                  </div>

                  {/* Skills */}
                  {(m.skills?.length ?? 0) > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {m.skills!.slice(0, 5).map((skill, i) => (
                        <span key={i} className="rounded bg-white px-1.5 py-0.5 text-[11px] text-zinc-300">
                          {skill}
                        </span>
                      ))}
                      {m.skills!.length > 5 ? (
                        <span className="rounded bg-white px-1.5 py-0.5 text-[11px] text-zinc-500">
                          +{m.skills!.length - 5}
                        </span>
                      ) : null}
                    </div>
                  ) : null}

                  {/* Actions */}
                  <div className="mt-auto flex items-center gap-1.5 border-t border-white/[0.05] pt-3">
                    <button className="flex-1 rounded-md bg-orange-500/15 px-3 py-1.5 text-[12px] font-semibold text-orange-600 transition hover:bg-orange-500/25">
                      Connect
                    </button>
                    {m.email ? (
                      <a
                        href={`mailto:${m.email}`}
                        className="grid h-7 w-7 place-items-center rounded-md bg-white text-zinc-400 transition hover:bg-white hover:text-zinc-100"
                        aria-label="Email"
                      >
                        <Mail className="h-3.5 w-3.5" />
                      </a>
                    ) : null}
                    {m.linkedin_url ? (
                      <a
                        href={m.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="grid h-7 w-7 place-items-center rounded-md bg-white text-zinc-400 transition hover:bg-orange-500/15 hover:text-orange-600"
                        aria-label="LinkedIn"
                      >
                        <Linkedin className="h-3.5 w-3.5" />
                      </a>
                    ) : null}
                    {m.github_url ? (
                      <a
                        href={m.github_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="grid h-7 w-7 place-items-center rounded-md bg-white text-zinc-400 transition hover:bg-white hover:text-zinc-100"
                        aria-label="GitHub"
                      >
                        <Github className="h-3.5 w-3.5" />
                      </a>
                    ) : null}
                  </div>
                </Surface>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </CommunityLayout>
  );
};

export default Members;
