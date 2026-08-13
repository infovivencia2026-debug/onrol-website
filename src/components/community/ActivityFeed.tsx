import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { communitySupabase as supabase } from '@/lib/communitySupabase';
import { Users, MessageSquare, Rocket, Briefcase, Calendar, Filter } from 'lucide-react';

interface Activity {
  id: string;
  member_id: string;
  activity_type: string;
  content: { title?: string; text?: string };
  created_at: string;
  community_members?: { full_name: string; avatar_url?: string };
}

const ActivityFeed = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
    
    // Real-time subscription
    const channel = supabase
      .channel('activity-feed')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'activity_feed' },
        (payload) => {
          fetchActivities();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('activity_feed')
        .select(`
          *,
          community_members (
            full_name,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (data) setActivities(data);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredActivities = filter === 'all' 
    ? activities 
    : activities.filter(a => a.activity_type === filter);

  const getActivityIcon = (type: string) => {
    switch(type) {
      case 'post': return MessageSquare;
      case 'project': return Rocket;
      case 'job': return Briefcase;
      case 'event': return Calendar;
      default: return Users;
    }
  };

  const getActivityColor = (type: string) => {
    switch(type) {
      case 'post': return 'text-orange-400 bg-orange-500/10';
      case 'project': return 'text-orange-400 bg-orange-500/10';
      case 'job': return 'text-purple-400 bg-purple-500/10';
      case 'event': return 'text-green-400 bg-green-500/10';
      default: return 'text-gray-400 bg-gray-500/10';
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-muted-foreground/80" />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-1.5 rounded-lg bg-white border border-[#0B1640]/10 text-sm text-[#0B1640] focus:outline-none focus:border-primary/50"
        >
          <option value="all" className="bg-background">All Activity</option>
          <option value="post" className="bg-background">Posts</option>
          <option value="project" className="bg-background">Projects</option>
          <option value="job" className="bg-background">Jobs</option>
          <option value="event" className="bg-background">Events</option>
        </select>
      </div>

      {/* Activity List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground/70">Loading activity...</div>
        ) : filteredActivities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground/70">No activity yet</div>
        ) : (
          filteredActivities.map((activity) => {
            const Icon = getActivityIcon(activity.activity_type);
            const color = getActivityColor(activity.activity_type);
            
            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass-card rounded-xl p-4 border border-white/5 hover:border-[#0B1640]/10 transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-[#0B1640]/75">
                      <span className="font-semibold text-[#0B1640]">
                        {activity.community_members?.full_name || 'Member'}
                      </span>
                      {' '}{activity.content.title}
                    </p>
                    {activity.content.text && (
                      <p className="text-xs text-muted-foreground/80 mt-1">
                        {activity.content.text}
                      </p>
                    )}
                    <p className="text-[10px] text-muted-foreground/65 mt-2">
                      {new Date(activity.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ActivityFeed;

