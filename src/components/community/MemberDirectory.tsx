import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { communitySupabase as supabase } from '@/lib/communitySupabase';
import { useCommunityAuth } from '@/contexts/CommunityAuthContext';
import { Search, MapPin, Briefcase, Github, Linkedin, Twitter, UserCheck, UserPlus } from 'lucide-react';
import ListSkeleton from "@/components/shared/ListSkeleton";
import { toast } from 'sonner';

interface Member {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  current_role?: string;
  company?: string;
  skills: string[];
  points: number;
  level: number;
  linkedin_url?: string;
  github_url?: string;
  twitter_url?: string;
}

const MemberDirectory = () => {
  const { member: currentMember } = useCommunityAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [connectedIds, setConnectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const { data } = await supabase
        .from('community_members')
        .select('*')
        .eq('member_status', 'approved')
        .order('points', { ascending: false })
        .limit(50);

      if (data) setMembers(data);

      // Hydrate "currently building" — pull each member's most recent project
      // title from the projects table. Best-effort: silently ignored if the
      // table doesn't exist or the user has no projects yet.
      const memberIds = (data || []).map((m) => m.id).filter(Boolean);
      if (memberIds.length) {
        const { data: projects } = await supabase
          .from('projects')
          .select('owner_id, title, deploy_url, created_at')
          .in('owner_id', memberIds)
          .order('created_at', { ascending: false });
        if (projects?.length) {
          const latestByOwner = new Map<string, { title: string; deploy_url?: string }>();
          for (const p of projects) {
            if (!latestByOwner.has(p.owner_id)) {
              latestByOwner.set(p.owner_id, { title: p.title, deploy_url: p.deploy_url });
            }
          }
          setMembers((prev) =>
            prev.map((m) => ({
              ...m,
              currently_building: latestByOwner.get(m.id),
            }))
          );
        }
      }
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (targetId: string) => {
    if (!currentMember?.id) { toast.error('Please log in'); return; }
    if (targetId === currentMember.id) { toast.info("That's you!"); return; }
    if (connectedIds.has(targetId)) { toast.info('Already connected'); return; }
    setConnecting(targetId);
    const { error } = await supabase.from('member_connections').upsert(
      { follower_id: currentMember.id, following_id: targetId },
      { onConflict: 'follower_id,following_id' }
    );
    setConnecting(null);
    if (error) { toast.error('Connect failed: ' + error.message); return; }
    setConnectedIds(prev => new Set(prev).add(targetId));
    toast.success('Connected! ðŸ¤');
  };

  const filteredMembers = members.filter(m =>
    m.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.skills?.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };


  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/65" />
        <input
          type="text"
          placeholder="Search members by name or skills..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 rounded-xl bg-white border border-[#0B1640]/10 text-[#0B1640] placeholder:text-muted-foreground/65 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
        />
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full"><ListSkeleton variant="card" count={6} /></div>
        ) : filteredMembers.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground/70">No members found</div>
        ) : (
          filteredMembers.map((member) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card rounded-2xl border border-white/5 p-6 hover:border-primary/20 transition-all duration-300"
            >
              {/* Header */}
              <div className="flex items-start gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/30 to-orange-300/20 flex items-center justify-center shrink-0 ring-2 ring-white/10">
                  <span className="text-xl font-bold text-primary">
                    {getInitials(member.full_name || member.email)}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-display font-bold text-[#0B1640] group-hover:text-primary transition-colors">
                    {member.full_name || 'Member'}
                  </h3>
                  <p className="text-sm text-muted-foreground/70">{member.bio || 'AI Builder'}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary">
                      Lvl {member.level || 1}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-yellow-500/10 text-yellow-400">
                      {member.points || 0} pts
                    </span>
                  </div>
                </div>
              </div>

              {/* Currently building — Phase 1 enhancement */}
              {(member as { currently_building?: { title: string; deploy_url?: string } }).currently_building?.title ? (
                <div className="mb-3 flex items-start gap-2 rounded-lg border border-emerald-400/20 bg-emerald-500/[0.06] px-3 py-2">
                  <span aria-hidden className="mt-0.5 inline-block h-2 w-2 shrink-0 animate-pulse rounded-full bg-emerald-400" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">Currently building</p>
                    <p className="truncate text-sm font-semibold text-[#0B1640]">
                      {(member as { currently_building: { title: string; deploy_url?: string } }).currently_building.title}
                    </p>
                  </div>
                </div>
              ) : null}

              {/* Info */}
              <div className="space-y-2 mb-4">
                {member.current_role && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground/80">
                    <Briefcase className="w-4 h-4 shrink-0" />
                    <span className="truncate">{member.current_role} {member.company && `at ${member.company}`}</span>
                  </div>
                )}
                {member.location && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground/80">
                    <MapPin className="w-4 h-4 shrink-0" />
                    <span>{member.location}</span>
                  </div>
                )}
              </div>

              {/* Skills */}
              {member.skills?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {member.skills.slice(0, 5).map((skill, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white text-[#0B1640]/75 border border-white/5"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}

              {/* Social Links */}
              <div className="flex items-center gap-2 pt-4 border-t border-white/5">
                {member.linkedin_url && (
                  <a
                    href={member.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-white text-[#0B1640]/75 hover:text-orange-400 hover:bg-orange-500/10 transition-colors"
                  >
                    <Linkedin className="w-4 h-4" />
                  </a>
                )}
                {member.github_url && (
                  <a
                    href={member.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-white text-[#0B1640]/75 hover:text-[#0B1640] hover:bg-white/10 transition-colors"
                  >
                    <Github className="w-4 h-4" />
                  </a>
                )}
                {member.twitter_url && (
                  <a
                    href={member.twitter_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-white text-[#0B1640]/75 hover:text-orange-400 hover:bg-orange-500/10 transition-colors"
                  >
                    <Twitter className="w-4 h-4" />
                  </a>
                )}
                <button
                  onClick={() => handleConnect(member.id)}
                  disabled={connecting === member.id || connectedIds.has(member.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-colors ml-auto disabled:cursor-not-allowed ${
                    connectedIds.has(member.id)
                      ? 'bg-green-500/10 text-green-400'
                      : 'bg-primary/10 text-primary hover:bg-primary/20'
                  }`}
                >
                  {connectedIds.has(member.id) ? (
                    <><UserCheck className="w-3.5 h-3.5" /> Following</>
                  ) : connecting === member.id ? (
                    <span className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <><UserPlus className="w-3.5 h-3.5" /> Connect</>
                  )}
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default MemberDirectory;

