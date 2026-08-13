// /community/leaderboard — top builders by points, time-windowed.
// Polished to match the Discord-style theme: real avatar primitive, podium
// for top 3, table for the rest, skeleton + empty state.

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Crown, Flame, Medal, Trophy, Zap } from "lucide-react";
import { useCommunityAuth } from "@/contexts/CommunityAuthContext";
import { communitySupabase as supabase } from "@/lib/communitySupabase";
import { CommunityLayout } from "@/components/community/CommunityLayout";
import {
  Badge,
  CommunityAvatar,
  EmptyState,
  PageHeader,
  Skeleton,
  SkeletonRow,
  Surface,
} from "@/components/community/CommunityPrimitives";

type LeaderItem = {
  id: string;
  full_name?: string | null;
  email?: string | null;
  level: number;
  points: number;
  streak_days?: number | null;
};

function levelLabel(level: number) {
  if (level >= 20) return { label: "Legend",   tone: "orange" as const };
  if (level >= 15) return { label: "Expert",   tone: "rose" as const };
  if (level >= 10) return { label: "Pro",      tone: "amber" as const };
  if (level >= 5)  return { label: "Builder",  tone: "emerald" as const };
  return { label: "Newcomer", tone: "zinc" as const };
}

const POINT_RULES = [
  { action: "Complete your profile",         points: 50 },
  { action: "Start a discussion",            points: 20 },
  { action: "Share a project",               points: 50 },
  { action: "Receive an upvote",             points: 5 },
  { action: "Helpful answer (accepted)",     points: 25 },
  { action: "Daily login streak",            points: 10 },
  { action: "Attend an event",               points: 30 },
  { action: "Mentor a member",               points: 75 },
];

const Leaderboard = () => {
  const { member } = useCommunityAuth();
  const [leaders, setLeaders] = useState<LeaderItem[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<"all" | "week" | "month">("all");

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("community_members")
        .select("*")
        .eq("member_status", "approved")
        .order("points", { ascending: false })
        .limit(50);

      if (timeframe !== "all") {
        const since = new Date();
        if (timeframe === "week") since.setDate(since.getDate() - 7);
        else since.setMonth(since.getMonth() - 1);
        query = query.gte("updated_at", since.toISOString());
      }

      const { data } = await query;
      const list = (data || []) as LeaderItem[];
      setLeaders(list);

      const idx = list.findIndex((m) => m.id === member?.id);
      setUserRank(idx >= 0 ? idx + 1 : null);
    } catch (err) {
      console.error("[leaderboard] fetch failed:", err);
    } finally {
      setLoading(false);
    }
  }, [member?.id, timeframe]);

  useEffect(() => {
    void fetchLeaderboard();
  }, [fetchLeaderboard]);

  const rest = leaders.slice(3);

  return (
    <CommunityLayout>
      <div className="space-y-5">
        <PageHeader
          eyebrow="Rankings"
          title="Leaderboard"
          description="Top builders shaping the future of AI in India."
          actions={
            <div className="inline-flex rounded-md bg-white p-0.5">
              {(["all", "week", "month"] as const).map((tf) => (
                <button
                  key={tf}
                  type="button"
                  onClick={() => setTimeframe(tf)}
                  className={`rounded-[5px] px-3 py-1 text-[12px] font-medium capitalize transition ${
                    timeframe === tf
                      ? "bg-orange-500 text-white"
                      : "text-zinc-400 hover:text-zinc-100"
                  }`}
                >
                  {tf === "all" ? "All time" : tf}
                </button>
              ))}
            </div>
          }
        />

        {/* ── Podium (top 3) ─────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-3 gap-3">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
          </div>
        ) : leaders.length >= 3 ? (
          <div className="grid grid-cols-3 gap-3">
            <PodiumCard leader={leaders[1]} place={2} />
            <PodiumCard leader={leaders[0]} place={1} />
            <PodiumCard leader={leaders[2]} place={3} />
          </div>
        ) : null}

        {/* ── Rest of the table ───────────────────────────────────── */}
        <Surface className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/[0.05] px-4 py-3">
            <h2 className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-zinc-500">
              Rankings
            </h2>
            {userRank ? (
              <p className="text-[12px] text-zinc-400">
                Your rank: <span className="font-semibold text-orange-600">#{userRank}</span>
              </p>
            ) : null}
          </div>
          {loading ? (
            <div className="space-y-2 p-3">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}
            </div>
          ) : leaders.length === 0 ? (
            <EmptyState
              icon={Trophy}
              title="No rankings yet"
              body={timeframe === "all"
                ? "Once members start earning points, they'll appear here."
                : `No activity in the last ${timeframe}. Try a longer window.`
              }
            />
          ) : rest.length === 0 ? (
            <p className="px-4 py-6 text-center text-[13px] text-zinc-500">
              All ranked members shown above.
            </p>
          ) : (
            <ul className="divide-y divide-white/[0.04]">
              {rest.map((leader, idx) => {
                const lvl = levelLabel(leader.level);
                const isMe = leader.id === member?.id;
                return (
                  <motion.li
                    key={leader.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.22, delay: Math.min(idx * 0.02, 0.3) }}
                    className={`flex items-center gap-3 px-4 py-2.5 transition ${
                      isMe ? "bg-orange-500/[0.08]" : "hover:bg-white"
                    }`}
                  >
                    <span className="w-6 text-right text-[12.5px] font-mono font-semibold text-zinc-500">
                      {idx + 4}
                    </span>
                    <CommunityAvatar
                      name={leader.full_name}
                      email={leader.email}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-semibold text-zinc-100">
                        {leader.full_name || "Member"}
                        {isMe ? <span className="ml-2 text-[10.5px] font-bold uppercase tracking-wider text-orange-400">You</span> : null}
                      </p>
                      {leader.streak_days ? (
                        <p className="flex items-center gap-1 text-[11.5px] text-zinc-500">
                          <Flame className="h-3 w-3 text-amber-400" />
                          {leader.streak_days}-day streak
                        </p>
                      ) : null}
                    </div>
                    <Badge tone={lvl.tone}>Lvl {leader.level}</Badge>
                    <p className="w-16 text-right text-[13px] font-bold text-orange-600">
                      {(leader.points || 0).toLocaleString("en-IN")}
                    </p>
                  </motion.li>
                );
              })}
            </ul>
          )}
        </Surface>

        {/* ── How to earn points ─────────────────────────────────── */}
        <Surface className="p-5">
          <h3 className="flex items-center gap-2 text-[13.5px] font-semibold text-zinc-100">
            <Zap className="h-4 w-4 text-amber-400" />
            How to earn points
          </h3>
          <div className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {POINT_RULES.map((rule) => (
              <div
                key={rule.action}
                className="flex items-center justify-between rounded-md border border-white/[0.04] bg-white px-3 py-2 text-[12.5px]"
              >
                <span className="text-zinc-300">{rule.action}</span>
                <span className="font-bold text-orange-600">+{rule.points}</span>
              </div>
            ))}
          </div>
        </Surface>
      </div>
    </CommunityLayout>
  );
};

// ── Podium card ────────────────────────────────────────────────────────

function PodiumCard({ leader, place }: { leader?: LeaderItem; place: 1 | 2 | 3 }) {
  if (!leader) return null;
  const lvl = levelLabel(leader.level);
  const tier = place === 1 ? {
    border:   "border-amber-400/40",
    glow:     "shadow-[0_0_36px_-8px_rgba(251,191,36,0.45)]",
    bg:       "bg-gradient-to-b from-amber-500/[0.08] via-transparent to-transparent",
    icon:     <Crown className="h-5 w-5 text-amber-300" />,
    chipTone: "text-amber-300",
  } : place === 2 ? {
    border:   "border-zinc-400/30",
    glow:     "",
    bg:       "",
    icon:     <Medal className="h-4.5 w-4.5 text-zinc-300" />,
    chipTone: "text-zinc-300",
  } : {
    border:   "border-amber-700/40",
    glow:     "",
    bg:       "",
    icon:     <Medal className="h-4.5 w-4.5 text-amber-600" />,
    chipTone: "text-amber-500",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: place * 0.06 }}
      className={`relative flex flex-col items-center rounded-xl border bg-[#232532] px-3 py-5 text-center ${tier.border} ${tier.glow} ${tier.bg}`}
    >
      <div className="mb-2 flex items-center gap-1.5">
        {tier.icon}
        <span className={`text-[10.5px] font-bold uppercase tracking-wider ${tier.chipTone}`}>
          #{place}
        </span>
      </div>
      <CommunityAvatar
        name={leader.full_name}
        email={leader.email}
        size={place === 1 ? "xl" : "lg"}
      />
      <p className="mt-3 max-w-full truncate text-[13.5px] font-semibold text-zinc-100">
        {leader.full_name || "Member"}
      </p>
      <p className="mt-0.5 text-[12px] text-zinc-400">
        {(leader.points || 0).toLocaleString("en-IN")} pts
      </p>
      <div className="mt-2">
        <Badge tone={lvl.tone}>{lvl.label}</Badge>
      </div>
    </motion.div>
  );
}

export default Leaderboard;
