import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { communitySupabase as supabase } from '@/lib/communitySupabase';
import ActivityFeed from './ActivityFeed';
import MemberDirectory from './MemberDirectory';
import Discussions from './Discussions';
import { Users, MessageSquare, Rocket, Briefcase, Calendar, TrendingUp, Trophy } from 'lucide-react';
import ProjectsList from './ProjectsList';
import JobsBoard from './JobsBoard';
import EventsCalendar from './EventsCalendar';
import LeaderboardList from './LeaderboardList';

const CommunityTab = () => {
  const [activeSection, setActiveSection] = useState('overview');
  const [stats, setStats] = useState({ members: 0, discussions: 0, projects: 0, jobs: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      const [members, discussions, projects, jobs] = await Promise.all([
        supabase.from('community_members').select('*', { count: 'exact', head: true }).eq('member_status', 'approved'),
        supabase.from('discussions').select('*', { count: 'exact', head: true }),
        supabase.from('projects').select('*', { count: 'exact', head: true }).eq('is_hidden', false),
        supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('is_active', true),
      ]);
      setStats({
        members: members.count || 0,
        discussions: discussions.count || 0,
        projects: projects.count || 0,
        jobs: jobs.count || 0,
      });
    };
    fetchStats();
  }, []);

  const sections = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'activity', label: 'Activity', icon: MessageSquare },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'discussions', label: 'Discussions', icon: MessageSquare },
    { id: 'projects', label: 'Projects', icon: Rocket },
    { id: 'jobs', label: 'Jobs', icon: Briefcase },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
  ];

  return (
    <div className="space-y-6">
      {/* Section Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              activeSection === section.id
                ? 'bg-primary/20 text-primary border border-primary/30'
                : 'bg-white text-[#0B1640]/75 hover:text-[#0B1640] hover:bg-white/10'
            }`}
          >
            <section.icon className="w-4 h-4" />
            {section.label}
          </button>
        ))}
      </div>

      {/* Section Content */}
      <AnimatePresence mode="wait">
        {activeSection === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Community Members', value: stats.members || '—', icon: Users, color: 'text-orange-400' },
                { label: 'Active Discussions', value: stats.discussions || '—', icon: MessageSquare, color: 'text-green-400' },
                { label: 'Projects Shared', value: stats.projects || '—', icon: Rocket, color: 'text-orange-400' },
                { label: 'Job Postings', value: stats.jobs || '—', icon: Briefcase, color: 'text-purple-400' },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.07 }}
                  className="glass-card rounded-2xl p-4 border border-border/30"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-xs font-body text-muted-foreground">{stat.label}</span>
                    <stat.icon size={14} className={stat.color} />
                  </div>
                  <p className={`text-lg font-display font-bold ${stat.color}`}>{stat.value}</p>
                </motion.div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { id: 'discussions', title: 'Discussions', desc: 'Join conversations', icon: MessageSquare, color: 'primary' },
                { id: 'members', title: 'Members', desc: 'Connect with peers', icon: Users, color: 'blue' },
                { id: 'projects', title: 'Projects', desc: 'Showcase your work', icon: Rocket, color: 'orange' },
                { id: 'jobs', title: 'Jobs', desc: 'Find opportunities', icon: Briefcase, color: 'purple' },
              ].map((action) => (
                <button
                  key={action.id}
                  onClick={() => setActiveSection(action.id)}
                  className="glass-card rounded-2xl p-5 border border-border/30 hover:border-primary/20 transition-all text-left"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-xl bg-${action.color}-500/10 border border-${action.color}-500/20 flex items-center justify-center`}>
                      <action.icon className={`w-5 h-5 text-${action.color}-400`} />
                    </div>
                    <div>
                      <h3 className="text-base font-display font-bold text-[#0B1640]">{action.title}</h3>
                      <p className="text-sm text-muted-foreground/80">{action.desc}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Recent Activity */}
            <div className="glass-card rounded-2xl p-5 border border-border/30">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-display font-bold text-[#0B1640]">Recent Activity</h3>
                <button
                  onClick={() => setActiveSection('activity')}
                  className="text-xs text-primary hover:text-primary/80 font-medium"
                >
                  View All →
                </button>
              </div>
              <ActivityFeed />
            </div>
          </motion.div>
        )}

        {activeSection === 'activity' && (
          <motion.div
            key="activity"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <ActivityFeed />
          </motion.div>
        )}

        {activeSection === 'members' && (
          <motion.div
            key="members"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <MemberDirectory />
          </motion.div>
        )}

        {activeSection === 'discussions' && (
          <motion.div
            key="discussions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Discussions />
          </motion.div>
        )}

        {activeSection === 'projects' && (
          <motion.div
            key="projects"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <ProjectsList />
          </motion.div>
        )}

        {activeSection === 'jobs' && (
          <motion.div
            key="jobs"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <JobsBoard />
          </motion.div>
        )}

        {activeSection === 'events' && (
          <motion.div
            key="events"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <EventsCalendar />
          </motion.div>
        )}

        {activeSection === 'leaderboard' && (
          <motion.div
            key="leaderboard"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <LeaderboardList />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CommunityTab;

