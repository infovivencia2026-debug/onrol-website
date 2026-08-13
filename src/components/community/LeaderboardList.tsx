import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useCommunityAuth } from "@/contexts/CommunityAuthContext";
import { communitySupabase as supabase } from "@/lib/communitySupabase";
import { Trophy, TrendingUp, Star, Zap, Crown, Medal } from "lucide-react";

type LeaderItem = {
  id: string;
  full_name: string | null;
  level: number;
  points: number;
  streak_days?: number | null;
};

const LeaderboardList = () => {
  const { member } = useCommunityAuth();
  const [leaders, setLeaders] = useState<LeaderItem[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<"all" | "week" | "month">("all");

  const fetchLeaderboard = useCallback(async () => {
    try {
      let query = supabase
        .from("community_members")
        .select("*")
        .eq("member_status", "approved")
        .order("points", { ascending: false })
        .limit(50);

      if (timeframe !== "all") {
        const now = new Date();
        const since = new Date();
        if (timeframe === "week") since.setDate(now.getDate() - 7);
        else if (timeframe === "month") since.setMonth(now.getMonth() - 1);
        query = query.gte("updated_at", since.toISOString());
      }

      const { data } = await query;
      setLeaders(data || []);

      const userIndex = data?.findIndex((m) => m.id === member?.id);
      if (userIndex !== undefined && userIndex !== -1) {
        setUserRank(userIndex + 1);
      }
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    } finally {
      setLoading(false);
    }
  }, [member?.id, timeframe]);

  useEffect(() => {
    void fetchLeaderboard();
  }, [fetchLeaderboard]);

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown className="w-5 h-5 text-yellow-400" />;
    if (index === 1) return <Medal className="w-5 h-5 text-gray-400" />;
    if (index === 2) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="text-xs font-bold text-muted-foreground/80">{index + 1}</span>;
  };

  const getLevelBadge = (level: number) => {
    if (level >= 20) return { color: "from-purple-500 to-pink-500", label: "Legend" };
    if (level >= 15) return { color: "from-red-500 to-orange-500", label: "Expert" };
    if (level >= 10) return { color: "from-orange-500 to-yellow-500", label: "Pro" };
    if (level >= 5) return { color: "from-green-500 to-orange-500", label: "Builder" };
    return { color: "from-gray-500 to-gray-600", label: "Newcomer" };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-display font-bold text-[#0B1640] flex items-center gap-3">
          <Trophy className="w-6 h-6 text-yellow-400" />
          Rankings
        </h2>
        <div className="flex gap-1.5 p-1 rounded-xl bg-white border border-[#0B1640]/10">
          {(["all", "week", "month"] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1 rounded-lg text-[10px] font-bold capitalize transition-all ${
                timeframe === tf
                  ? "bg-primary text-[#0B1640]"
                  : "text-[#0B1640]/75 hover:text-[#0B1640]"
              }`}
            >
              {tf === "all" ? "All Time" : tf}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
        <div className="divide-y divide-white/5">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground/70">Loading leaderboard...</div>
          ) : leaders.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground/70">No rankings yet</div>
          ) : (
            leaders.map((leader, index) => (
              <motion.div
                key={leader.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`p-4 flex items-center gap-4 hover:bg-white transition-colors ${
                  leader.id === member?.id ? 'bg-primary/5 border-l-2 border-primary' : ''
                }`}
              >
                <div className="w-6 text-center">{getRankIcon(index)}</div>
                <div className="flex-1 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/30 to-orange-300/20 flex items-center justify-center text-xs font-bold text-primary">
                    {leader.full_name?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#0B1640]">{leader.full_name}</p>
                    <p className="text-[10px] text-muted-foreground/70">Level {leader.level}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-primary">{leader.points}</p>
                  <p className="text-[10px] text-muted-foreground/70">pts</p>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default LeaderboardList;

