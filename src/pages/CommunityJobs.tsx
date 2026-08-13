import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useCommunityAuth } from "@/contexts/CommunityAuthContext";
import { communitySupabase as supabase } from "@/lib/communitySupabase";
import { CommunityLayout } from "@/components/community/CommunityLayout";
import { Briefcase, Plus, MapPin, DollarSign, Clock, Building, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

type JobItem = {
  id: string;
  title: string;
  company: string;
  description: string;
  job_type: string;
  remote_type?: string | null;
  location?: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
  created_at: string;
  apply_url?: string | null;
  apply_email?: string | null;
  is_featured?: boolean | null;
  is_verified?: boolean | null;
};

const Jobs = () => {
  const { isAdmin } = useCommunityAuth();
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState("all");

  const jobTypes = [
    { id: "all", label: "All Jobs" },
    { id: "full-time", label: "Full-time" },
    { id: "part-time", label: "Part-time" },
    { id: "internship", label: "Internship" },
    { id: "freelance", label: "Freelance" },
  ];

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const { data } = await supabase
        .from("jobs")
        .select(`
          *,
          community_members (
            full_name,
            company
          )
        `)
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      setJobs(data || []);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = selectedType === "all" ? jobs : jobs.filter((j) => j.job_type === selectedType);

  return (
    <CommunityLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#0B1640] flex items-center gap-3">
              <Briefcase className="w-7 h-7 text-orange-600" />
              Job Board
            </h1>
            <p className="text-zinc-400 mt-1">{jobs.length}+ opportunities for AI talent</p>
          </div>
          {isAdmin ? (
            <Link
              to="/community/jobs/new"
              className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm text-[#0B1640] transition-all hover:scale-[1.02] hover:shadow-[0_0_24px_rgba(255,140,0,0.5)]"
              style={{ background: "linear-gradient(145deg, #ff9c30 0%, #ff5500 100%)" }}
            >
              <Plus className="w-4 h-4" />
              Post a Job
            </Link>
          ) : null}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {jobTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                selectedType === type.id
                  ? "bg-orange-500 text-white"
                  : "bg-white text-[#0B1640]/75 hover:text-[#0B1640] hover:bg-white/10"
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>

        {/* Jobs List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12 text-zinc-400">Loading jobs...</div>
          ) : filteredJobs.length === 0 ? (
            <div className="bg-[#232532] rounded-2xl border border-white/5 p-12 text-center">
              <Briefcase className="w-16 h-16 mx-auto mb-4 text-zinc-400/30" />
              <p className="text-zinc-400 mb-4">No jobs found</p>
              <p className="text-sm text-zinc-500">Check back later for new opportunities</p>
            </div>
          ) : (
            filteredJobs.map((job) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#232532] rounded-2xl border border-white/5 p-6 hover:border-orange-500/25 transition-all duration-300 group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-500/15 text-orange-600 capitalize">
                        {job.job_type}
                      </span>
                      {job.remote_type && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-500/10 text-green-400 capitalize">
                          {job.remote_type}
                        </span>
                      )}
                      {job.is_featured && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-yellow-500/10 text-yellow-400">
                          Featured
                        </span>
                      )}
                    </div>

                    <h3 className="text-xl font-bold text-[#0B1640] mb-2 group-hover:text-orange-600 transition-colors">
                      {job.title}
                    </h3>

                    <div className="flex items-center gap-2 text-zinc-400 mb-3">
                      <Building className="w-4 h-4" />
                      <span className="text-sm">{job.company}</span>
                    </div>

                    <p className="text-sm text-zinc-400 line-clamp-2 mb-4">
                      {job.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500">
                      {job.location && (
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5" />
                          {job.location}
                        </span>
                      )}
                      {job.salary_min && job.salary_max && (
                        <span className="flex items-center gap-1.5">
                          <DollarSign className="w-3.5 h-3.5" />
                          ₹{job.salary_min.toLocaleString()} - ₹{job.salary_max.toLocaleString()}
                        </span>
                      )}
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(job.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <a
                      href={job.apply_url || `mailto:${job.apply_email}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-5 py-2.5 rounded-xl font-bold text-sm text-[#0B1640] whitespace-nowrap transition-all hover:scale-[1.02]"
                      style={{ background: "linear-gradient(145deg, #ff9c30 0%, #ff5500 100%)" }}
                    >
                      Apply Now
                    </a>
                    {job.is_verified && (
                      <span className="text-xs text-green-400 text-center font-medium">Verified</span>
                    )}
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

export default Jobs;

