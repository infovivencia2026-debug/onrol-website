import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { communitySupabase as supabase } from '@/lib/communitySupabase';
import { useCommunityAuth } from '@/contexts/CommunityAuthContext';
import { MessageSquare, Plus, Eye, MessageCircle, X } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES = ['all', 'general', 'ai-news', 'projects', 'help', 'jobs'];

type DiscussionItem = {
  id: string;
  category: string;
  title: string;
  content: string;
  comments_count?: number | null;
  views_count?: number | null;
  community_members?: { full_name?: string | null } | null;
};

const Discussions = () => {
  const { member } = useCommunityAuth();
  const [discussions, setDiscussions] = useState<DiscussionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [posting, setPosting] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', category: 'general' });

  const fetchDiscussions = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('discussions')
        .select('*, community_members (full_name)')
        .order('created_at', { ascending: false });

      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory);
      }

      const { data } = await query;
      if (data) setDiscussions(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    void fetchDiscussions();
  }, [fetchDiscussions]);

  const handlePost = async () => {
    if (!member?.id) { toast.error('Please log in'); return; }
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    if (!form.content.trim()) { toast.error('Content is required'); return; }
    setPosting(true);
    const { error } = await supabase.from('discussions').insert({
      title: form.title.trim(),
      content: form.content.trim(),
      category: form.category,
      member_id: member.id,
    });
    setPosting(false);
    if (error) { toast.error('Failed: ' + error.message); return; }
    toast.success('Discussion posted!');
    setShowModal(false);
    setForm({ title: '', content: '', category: 'general' });
    void fetchDiscussions();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-display font-bold text-[#0B1640] flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-primary" />
          Discussions
        </h2>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-[#0B1640] text-sm font-bold hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Discussion
        </button>
      </div>

      {/* Categories */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap capitalize transition-all ${
              selectedCategory === cat
                ? 'bg-primary text-white'
                : 'bg-white text-[#0B1640]/75 hover:text-[#0B1640] hover:bg-white/10'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Discussions List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12 text-muted-foreground/70">Loading...</div>
        ) : discussions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground/70">No discussions yet — start one!</div>
        ) : (
          discussions.map((d) => (
            <motion.div
              key={d.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-xl p-5 border border-white/5 hover:border-primary/20 transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary capitalize">
                      {d.category}
                    </span>
                  </div>
                  <h3 className="text-lg font-display font-bold text-[#0B1640] mb-2">{d.title}</h3>
                  <p className="text-sm text-muted-foreground/80 line-clamp-2">{d.content}</p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground/65">
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-3.5 h-3.5" />
                      {d.comments_count || 0} comments
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      {d.views_count || 0} views
                    </span>
                    <span>by {d.community_members?.full_name || 'Member'}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* New Discussion Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-lg bg-[hsl(20_10%_6%)] border border-[#0B1640]/10 rounded-2xl p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-display font-bold text-[#0B1640]">New Discussion</h3>
                <button onClick={() => setShowModal(false)} className="text-[#0B1640]/70 hover:text-[#0B1640] transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Category */}
                <div>
                  <label className="block text-xs font-semibold text-[#0B1640]/75 mb-1.5">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#0B1640]/10 text-[#0B1640] text-sm focus:outline-none focus:border-primary/50 capitalize"
                  >
                    {CATEGORIES.filter(c => c !== 'all').map(cat => (
                      <option key={cat} value={cat} className="bg-background capitalize">{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold text-[#0B1640]/75 mb-1.5">Title</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="What do you want to discuss?"
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#0B1640]/10 text-[#0B1640] placeholder:text-white/30 text-sm focus:outline-none focus:border-primary/50 transition-all"
                  />
                </div>

                {/* Content */}
                <div>
                  <label className="block text-xs font-semibold text-[#0B1640]/75 mb-1.5">Content</label>
                  <textarea
                    value={form.content}
                    onChange={(e) => setForm(f => ({ ...f, content: e.target.value }))}
                    placeholder="Share your thoughts..."
                    rows={5}
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#0B1640]/10 text-[#0B1640] placeholder:text-white/30 text-sm focus:outline-none focus:border-primary/50 transition-all resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[#0B1640]/10 text-[#0B1640]/75 hover:text-[#0B1640] hover:bg-white text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePost}
                  disabled={posting}
                  className="flex-1 py-2.5 rounded-xl font-bold text-sm text-[#0B1640] disabled:opacity-60 transition-all"
                  style={{ background: 'linear-gradient(145deg, #ff9c30 0%, #ff5500 100%)' }}
                >
                  {posting ? 'Posting...' : 'Post Discussion'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Discussions;

