import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useCommunityAuth } from "@/contexts/CommunityAuthContext";
import { communitySupabase as supabase } from "@/lib/communitySupabase";
import { CommunityLayout } from "@/components/community/CommunityLayout";
import { Rocket, Plus, Github, ExternalLink, Star, Eye, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";

type ProjectItem = {
  id: string;
  title: string;
  description: string;
  category: string;
  is_featured?: boolean | null;
  thumbnail_url?: string | null;
  tech_stack?: string[] | null;
  views_count?: number | null;
  comments_count?: number | null;
  github_url?: string | null;
  demo_url?: string | null;
  likes_count?: number | null;
};

const Projects = () => {
  const { isAdmin } = useCommunityAuth();
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data } = await supabase
        .from("projects")
        .select(`
          *,
          community_members (
            full_name,
            avatar_url
          )
        `)
        .eq("is_hidden", false)
        .order("created_at", { ascending: false });
      setProjects(data || []);
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <CommunityLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#0B1640] flex items-center gap-3">
              <Rocket className="w-7 h-7 text-orange-600" />
              Projects
            </h1>
            <p className="text-zinc-400 mt-1">Showcase your AI builds and collaborations</p>
          </div>
          {isAdmin ? (
            <Link
              to="/community/projects/new"
              className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm text-[#0B1640] transition-all hover:scale-[1.02] hover:shadow-[0_0_24px_rgba(255,140,0,0.5)]"
              style={{ background: "linear-gradient(145deg, #ff9c30 0%, #ff5500 100%)" }}
            >
              <Plus className="w-4 h-4" />
              Share Project
            </Link>
          ) : null}
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full text-center py-12 text-zinc-400">Loading projects...</div>
          ) : projects.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Rocket className="w-16 h-16 mx-auto mb-4 text-zinc-400/30" />
              <p className="text-zinc-400 mb-4">No projects yet</p>
              <p className="text-sm text-zinc-500 mb-6">Featured project showcases will be published by the ONROL team.</p>
              {isAdmin ? (
                <Link
                  to="/community/projects/new"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm text-[#0B1640]"
                  style={{ background: "linear-gradient(145deg, #ff9c30 0%, #ff5500 100%)" }}
                >
                  <Plus className="w-4 h-4" />
                  Share Your Project
                </Link>
              ) : null}
            </div>
          ) : (
            projects.map((project) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#232532] rounded-2xl border border-white/5 overflow-hidden hover:border-orange-500/25 transition-all duration-300 group"
              >
                {/* Thumbnail */}
                {project.thumbnail_url ? (
                  <div className="aspect-video bg-gradient-to-br from-primary/20 to-orange-300/10 relative overflow-hidden">
                    <img
                      src={project.thumbnail_url}
                      alt={project.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                ) : (
                  <div className="aspect-video bg-gradient-to-br from-primary/20 to-orange-300/10 flex items-center justify-center">
                    <Rocket className="w-16 h-16 text-orange-600/30" />
                  </div>
                )}

                {/* Content */}
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-500/15 text-orange-600 capitalize">
                      {project.category}
                    </span>
                    {project.is_featured && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-yellow-500/10 text-yellow-400 flex items-center gap-1">
                        <Star className="w-3 h-3" /> Featured
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-[#0B1640] mb-2 group-hover:text-orange-600 transition-colors">
                    {project.title}
                  </h3>

                  <p className="text-sm text-zinc-400 line-clamp-2 mb-4">
                    {project.description}
                  </p>

                  {/* Tech Stack */}
                  {(project.tech_stack ?? []).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {(project.tech_stack ?? []).slice(0, 4).map((tech: string, i: number) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white text-[#0B1640]/75 border border-white/5"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <div className="flex items-center gap-3 text-xs text-zinc-500">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" />
                        {project.views_count || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5" />
                        {project.likes_count || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-3.5 h-3.5" />
                        {project.comments_count || 0}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {project.github_url && (
                        <a
                          href={project.github_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg bg-white text-[#0B1640]/75 hover:text-[#0B1640] hover:bg-white/10 transition-colors"
                        >
                          <Github className="w-4 h-4" />
                        </a>
                      )}
                      {project.demo_url && (
                        <a
                          href={project.demo_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg bg-white text-[#0B1640]/75 hover:text-orange-600 hover:bg-orange-500/15 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
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

export default Projects;

