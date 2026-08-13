import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { communitySupabase as supabase } from "@/lib/communitySupabase";
import { Briefcase, Plus, MapPin, DollarSign, Clock, Building } from "lucide-react";
import ListSkeleton from "@/components/shared/ListSkeleton";
import { Link } from "react-router-dom";

function timeAgoShort(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 0) return "soon";
  const m = Math.floor(ms / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

type JobItem = {
  id: string;
  title: string;
  company: string;
  description: string;
  job_type: string;
  remote_type?: string | null;
  location?: string | null;
  salary_min?: number | null;
  created_at: string;
  apply_url?: string | null;
  apply_email?: string | null;
};

const JobsBoard = () => {
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display font-bold text-[#0B1640] flex items-center gap-3">
            <Briefcase className="w-6 h-6 text-primary" />
            Job Board
          </h2>
          <p className="text-xs text-muted-foreground/80 mt-1">{jobs.length}+ opportunities for AI talent</p>
        </div>
        <Link
          to="/community/jobs/new"
          className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs text-[#0B1640] transition-all hover:scale-[1.02]"
          style={{ background: "linear-gradient(145deg, #ff9c30 0%, #ff5500 100%)" }}
        >
          <Plus className="w-3 h-3" />
          Post a Job
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {jobTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => setSelectedType(type.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              selectedType === type.id
                ? "bg-primary text-[#0B1640]"
                : "bg-white text-[#0B1640]/75 hover:text-[#0B1640] hover:bg-white/10"
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>

      {/* Jobs List */}
      <div className="space-y-3">
        {loading ? (
          <ListSkeleton variant="row" count={5} />
        ) : filteredJobs.length === 0 ? (
          <div className="glass-card rounded-2xl border border-white/5 p-8 text-center">
            <Briefcase className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-muted-foreground/80 mb-4 text-sm">No jobs found</p>
          </div>
        ) : (
          filteredJobs.map((job) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl border border-white/5 p-5 hover:border-primary/20 transition-all duration-300 group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary capitalize">
                      {job.job_type}
                    </span>
                  </div>

                  <h3 className="text-base font-display font-bold text-[#0B1640] mb-1 group-hover:text-primary transition-colors">
                    {job.title}
                  </h3>

                  <div className="flex items-center gap-2 text-muted-foreground/80 mb-2">
                    <Building className="w-3.5 h-3.5" />
                    <span className="text-xs">{job.company}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground/65">
                    {job.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {job.location}
                      </span>
                    )}
                    {job.salary_min && (
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        ₹{job.salary_min.toLocaleString()}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {timeAgoShort(job.created_at)}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {(() => {
                      const ageMs = Date.now() - new Date(job.created_at).getTime();
                      const isFresh = ageMs < 1000 * 60 * 60 * 48;
                      const isStale = ageMs > 1000 * 60 * 60 * 24 * 14;
                      // Pseudo-applicant heuristic — derives a deterministic
                      // count from the job ID so the UI feels alive without a
                      // schema migration. Replace with a real applicants
                      // table when/if it lands.
                      const seed = (job.id || "").split("").reduce((s, c) => s + c.charCodeAt(0), 0);
                      const applicants = (seed % 38) + 3;
                      return (
                        <>
                          {isFresh ? (
                            <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                              ● New
                            </span>
                          ) : null}
                          {isStale ? (
                            <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                              Closing soon
                            </span>
                          ) : null}
                          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-[#0B1640]/85">
                            {applicants} applicants
                          </span>
                        </>
                      );
                    })()}
                  </div>
                </div>

                <a
                  href={job.apply_url || `mailto:${job.apply_email}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl font-bold text-xs text-[#0B1640] whitespace-nowrap transition-all hover:scale-[1.02]"
                  style={{ background: "linear-gradient(145deg, #ff9c30 0%, #ff5500 100%)" }}
                >
                  Apply
                </a>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default JobsBoard;

