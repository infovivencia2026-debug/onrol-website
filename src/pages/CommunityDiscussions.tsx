import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useCommunityAuth } from "@/contexts/CommunityAuthContext";
import { communitySupabase as supabase } from "@/lib/communitySupabase";
import { CommunityLayout } from "@/components/community/CommunityLayout";
import { MessageSquare, Plus, Search, Filter, TrendingUp, Clock, Eye, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";

type DiscussionItem = {
  id: string;
  category: string;
  title: string;
  content: string;
  created_at: string;
  is_pinned?: boolean | null;
  comments_count?: number | null;
  views_count?: number | null;
  community_members?: { full_name?: string | null; avatar_url?: string | null } | null;
};

const Discussions = () => {
  const { isAdmin } = useCommunityAuth();
  const [discussions, setDiscussions] = useState<DiscussionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categories = [
    { id: "all", label: "All" },
    { id: "general", label: "General" },
    { id: "ai-news", label: "AI News" },
    { id: "projects", label: "Projects" },
    { id: "help", label: "Help" },
    { id: "jobs", label: "Jobs" },
    { id: "resources", label: "Resources" },
  ];

  const fetchDiscussions = useCallback(async () => {
    try {
      let query = supabase
        .from("discussions")
        .select(`
          *,
          community_members (
            full_name,
            avatar_url
          )
        `)
        .eq("is_hidden", false)
        .order("created_at", { ascending: false });

      if (selectedCategory !== "all") {
        query = query.eq("category", selectedCategory);
      }

      const { data } = await query;
      setDiscussions(data || []);
    } catch (error) {
      console.error("Error fetching discussions:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    void fetchDiscussions();
  }, [fetchDiscussions]);

  return (
    <CommunityLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#0B1640] flex items-center gap-3">
              <MessageSquare className="w-7 h-7 text-orange-600" />
              Discussions
            </h1>
            <p className="text-zinc-400 mt-1">Join conversations with the community</p>
          </div>
          {isAdmin ? (
            <Link
              to="/community/discussions/new"
              className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm text-[#0B1640] transition-all hover:scale-[1.02] hover:shadow-[0_0_24px_rgba(255,140,0,0.5)]"
              style={{ background: "linear-gradient(145deg, #ff9c30 0%, #ff5500 100%)" }}
            >
              <Plus className="w-4 h-4" />
              New Discussion
            </Link>
          ) : null}
        </div>

        {/* Categories */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? "bg-orange-500 text-white"
                  : "bg-white text-[#0B1640]/75 hover:text-[#0B1640] hover:bg-white/10"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Discussions List */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-12 text-zinc-400">Loading discussions...</div>
          ) : discussions.length === 0 ? (
            <div className="bg-[#232532] rounded-2xl border border-white/5 p-12 text-center">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 text-zinc-400/30" />
              <p className="text-zinc-400 mb-4">No discussions yet</p>
              <p className="text-sm text-zinc-500">Fresh admin-curated discussions will appear here.</p>
            </div>
          ) : (
            discussions.map((discussion) => (
              <motion.div
                key={discussion.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#232532] rounded-2xl border border-white/5 p-6 hover:border-orange-500/25 transition-all duration-300 group cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/30 to-orange-300/20 flex items-center justify-center shrink-0">
                    <span className="text-lg font-bold text-orange-600">
                      {discussion.community_members?.full_name?.charAt(0) || "M"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-500/15 text-orange-600 capitalize">
                        {discussion.category}
                      </span>
                      {discussion.is_pinned && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400">
                          Pinned
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-[#0B1640] mb-2 group-hover:text-orange-600 transition-colors">
                      {discussion.title}
                    </h3>
                    <p className="text-sm text-zinc-400 line-clamp-2 mb-4">
                      {discussion.content}
                    </p>
                    <div className="flex items-center gap-6 text-xs text-zinc-500">
                      <span className="flex items-center gap-1.5">
                        <MessageCircle className="w-4 h-4" />
                        {discussion.comments_count || 0} comments
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Eye className="w-4 h-4" />
                        {discussion.views_count || 0} views
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        {new Date(discussion.created_at).toLocaleDateString()}
                      </span>
                      <span className="text-zinc-400">
                        by {discussion.community_members?.full_name || "Member"}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </CommunityLayout>
  );
};

export default Discussions;

