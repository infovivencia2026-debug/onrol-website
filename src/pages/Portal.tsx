import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home, Zap, Newspaper, Lightbulb, MessageSquare, Video, Calendar, CalendarDays, GraduationCap, Briefcase, FolderOpen, Users, Bookmark,
  Search, Bell, ChevronDown, LogOut, Menu, X, Heart, MessageCircle, Share2, MoreHorizontal, TrendingUp, Eye, Save,
  ChevronRight, Sparkles, Clock, ExternalLink, CheckCircle, Lock, Download, Play, FileText, LayoutTemplate, Star, Award,
  ArrowRight, Filter, ThumbsUp, Flag, Bookmark as BookmarkIcon, Send, BarChart3, List, Image, Link2, Copy, Twitter, Linkedin, Phone,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase, type Student } from '@/lib/supabase'
import { toast } from 'sonner'
import onrolLogo from '@/assets/onrol-logo.png'

// ── Types ──────────────────────────────────────────────
interface Post {
  id: string
  title: string
  description: string
  category: string
  thumbnail_emoji?: string
  thumbnail_url?: string
  cta_text?: string
  cta_link?: string
  likes_count: number
  comments_count: number
  saves_count: number
  views_count: number
  shares_count: number
  created_at: string
  isLiked?: boolean
  isSaved?: boolean
}

interface Resource {
  id: string
  title: string
  resource_type: 'PDF' | 'Video' | 'Tool' | 'Template' | 'Pack'
  description: string
  is_free: boolean
  is_premium: boolean
  download_count: number
}

interface Workshop {
  id: string
  title: string
  description: string
  event_date: string
  location_type: string
  meeting_url?: string
  registration_count: number
  attendee_limit?: number
  isRegistered?: boolean
}

interface Poll {
  id: string
  question: string
  options: { id: string; text: string; votes: number }[]
  total_votes: number
  hasVoted?: boolean
  selectedOption?: string
}

interface Notification {
  id: string
  notification_type: string
  title: string
  message: string
  created_at: string
  is_read: boolean
}

// ── Category Config ──────────────────────────────────────────────
const CATEGORY_CONFIG: Record<string, { color: string; bgColor: string; icon: LucideIcon }> = {
  'AI Tools': { color: 'text-orange-400', bgColor: 'bg-orange-400/10', icon: Zap },
  'AI News': { color: 'text-green-400', bgColor: 'bg-green-400/10', icon: Newspaper },
  'Daily Hacks': { color: 'text-yellow-400', bgColor: 'bg-yellow-400/10', icon: Lightbulb },
  'Prompts': { color: 'text-purple-400', bgColor: 'bg-purple-400/10', icon: MessageSquare },
  'Training Videos': { color: 'text-red-400', bgColor: 'bg-red-400/10', icon: Video },
  'Workshops': { color: 'text-orange-400', bgColor: 'bg-orange-400/10', icon: Calendar },
  'Courses': { color: 'text-orange-400', bgColor: 'bg-orange-400/10', icon: GraduationCap },
  'Opportunities': { color: 'text-pink-400', bgColor: 'bg-pink-400/10', icon: Briefcase },
  'Resources': { color: 'text-emerald-400', bgColor: 'bg-emerald-400/10', icon: FolderOpen },
  'Beginner Corner': { color: 'text-indigo-400', bgColor: 'bg-indigo-400/10', icon: Users },
}

const NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'ai-tools', label: 'AI Tools', icon: Zap },
  { id: 'ai-news', label: 'AI News', icon: Newspaper },
  { id: 'daily-hacks', label: 'Daily Hacks', icon: Lightbulb },
  { id: 'prompts', label: 'Prompts', icon: MessageSquare },
  { id: 'training-videos', label: 'Training Videos', icon: Video },
  { id: 'workshops', label: 'Workshops', icon: Calendar },
  { id: 'courses', label: 'Courses', icon: GraduationCap },
  { id: 'opportunities', label: 'Opportunities', icon: Briefcase },
  { id: 'resources', label: 'Resources', icon: FolderOpen },
  { id: 'beginner-corner', label: 'Beginner Corner', icon: Users },
  { id: 'saved-posts', label: 'Saved Posts', icon: Bookmark },
  { id: 'polls', label: 'Polls', icon: BarChart3 },
  { id: 'my-activity', label: 'My Activity', icon: List },
]

const GRAD_YEARS = Array.from({ length: 8 }, (_, i) => 2024 + i)
const INTERESTS_MAP: Record<string, string> = {
  ai_career: 'AI Career', freelancing: 'Freelancing', startup: 'Startup', automation: 'Automation',
}

// ── Helper Functions ──────────────────────────────────────────────
const formatTimestamp = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

const formatTime = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })
}

// ── CompleteProfile Modal ──────────────────────────────────────────────
function CompleteProfileModal({ userId, email, onComplete }: { userId: string; email: string; onComplete: (s: Student) => void }) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    fullName: '', phone: '', college: '', course: '', gradYear: '',
    interests: [] as string[],
  })
  const INTERESTS = [
    { id: 'ai_career', label: 'AI Career' },
    { id: 'freelancing', label: 'Freelancing' },
    { id: 'startup', label: 'Startup' },
    { id: 'automation', label: 'Automation' },
  ]
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  const toggle = (id: string) => setForm(f => ({ ...f, interests: f.interests.includes(id) ? f.interests.filter(x => x !== id) : [...f.interests, id] }))

  const inputClass = 'w-full px-4 py-2.5 rounded-xl bg-background border border-border/50 text-foreground placeholder:text-muted-foreground/65 text-sm font-body focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-all duration-200'

  const handleSave = async () => {
    if (!form.fullName || !form.phone || !form.college || !form.course || !form.gradYear) { toast.error('Fill in all fields'); return }
    if (form.interests.length === 0) { toast.error('Pick at least one interest'); return }
    setLoading(true)
    const { data, error } = await supabase.from('students').insert({
      id: userId, full_name: form.fullName, email, phone: form.phone,
      college_name: form.college, course_branch: form.course,
      graduation_year: parseInt(form.gradYear), interested_in: form.interests,
    }).select().single()
    setLoading(false)
    if (error) { toast.error('Save failed: ' + error.message); return }
    toast.success('Profile saved!')
    onComplete(data as Student)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md bg-card border border-border/50 rounded-3xl p-7 shadow-2xl overflow-y-auto max-h-[90vh]"
      >
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-display font-bold text-foreground">Complete your profile</h3>
            <p className="text-xs text-muted-foreground font-body">Just a few details to personalise your experience</p>
          </div>
        </div>

        <div className="space-y-3 mt-5">
          <div><label className="block text-xs font-semibold text-foreground/70 mb-1.5">Full Name</label><input type="text" value={form.fullName} onChange={e => set('fullName', e.target.value)} placeholder="Arjun Mehta" className={inputClass} /></div>
          <div><label className="block text-xs font-semibold text-foreground/70 mb-1.5">Phone Number</label><input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 98765 43210" className={inputClass} /></div>
          <div><label className="block text-xs font-semibold text-foreground/70 mb-1.5">College Name</label><input type="text" value={form.college} onChange={e => set('college', e.target.value)} placeholder="VIT Vellore, BITS Pilani…" className={inputClass} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-semibold text-foreground/70 mb-1.5">Course / Branch</label><input type="text" value={form.course} onChange={e => set('course', e.target.value)} placeholder="B.Tech CSE" className={inputClass} /></div>
            <div>
              <label className="block text-xs font-semibold text-foreground/70 mb-1.5">Graduation Year</label>
              <select value={form.gradYear} onChange={e => set('gradYear', e.target.value)} className={inputClass}>
                <option value="">Year</option>
                {GRAD_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-foreground/70 mb-2">Interested in</label>
            <div className="grid grid-cols-2 gap-2">
              {INTERESTS.map(item => {
                const active = form.interests.includes(item.id)
                return (
                  <button key={item.id} onClick={() => toggle(item.id)} className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all duration-200 ${active ? 'border-primary bg-primary/10 text-primary' : 'border-border/50 bg-background text-foreground/60 hover:border-primary/30'}`}>
                    {active ? '✓ ' : '+ '}{item.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <button onClick={handleSave} disabled={loading} className="w-full mt-5 py-3 rounded-xl text-sm font-bold text-white tracking-wide transition-all duration-300 hover:shadow-[0_0_20px_rgba(225,120,0,0.4)] disabled:opacity-60" style={{ background: 'linear-gradient(135deg, #ff8c00 0%, #ff5500 100%)' }}>
          {loading ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />Saving…</span> : 'Save & Enter Portal →'}
        </button>
      </motion.div>
    </div>
  )
}

// ── Post Card Component ──────────────────────────────────────────────
function PostCard({ 
  post, 
  onLike, 
  onSave, 
  onComment, 
  onShare,
  onView 
}: { 
  post: Post; 
  onLike: (id: string) => void; 
  onSave: (id: string) => void; 
  onComment: (id: string) => void; 
  onShare: (post: Post) => void;
  onView: (post: Post) => void;
}) {
  const categoryConfig = CATEGORY_CONFIG[post.category] || { color: 'text-gray-400', bgColor: 'bg-gray-400/10', icon: Zap }
  const CategoryIcon = categoryConfig.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-5 border border-gray-200 hover:border-orange-300 transition-all duration-300 group shadow-sm"
    >
      <div className="flex items-start gap-4">
        {/* Thumbnail */}
        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-orange-100 to-orange-50 border border-orange-200 flex items-center justify-center text-2xl shrink-0">
          {post.thumbnail_emoji || '📄'}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Category & Timestamp */}
          <div className="flex items-center gap-2 mb-2">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${categoryConfig.bgColor} ${categoryConfig.color} border border-current/20`}>
              <CategoryIcon size={10} />
              {post.category}
            </span>
            <span className="text-[10px] text-gray-500 font-body flex items-center gap-1">
              <Clock size={10} />
              {formatTimestamp(post.created_at)}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-sm font-display font-bold text-gray-900 mb-1.5 line-clamp-2 group-hover:text-orange-600 transition-colors cursor-pointer" onClick={() => onView(post)}>
            {post.title}
          </h3>

          {/* Description */}
          <p className="text-xs text-gray-600 font-body line-clamp-2 mb-3">
            {post.description}
          </p>

          {/* CTA */}
          {post.cta_text && (
            <button
              onClick={() => onView(post)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:shadow-[0_0_15px_rgba(249,115,22,0.3)] transition-all duration-300 mb-3"
            >
              {post.cta_text}
              <ArrowRight size={12} />
            </button>
          )}

          {/* Actions */}
          <div className="flex items-center gap-4 pt-3 border-t border-gray-100">
            <button
              onClick={() => onLike(post.id)}
              className={`flex items-center gap-1.5 text-xs transition-colors ${post.isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}
            >
              <Heart size={14} className={post.isLiked ? 'fill-current' : ''} />
              {post.likes_count}
            </button>
            <button
              onClick={() => onComment(post.id)}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-orange-600 transition-colors"
            >
              <MessageCircle size={14} />
              {post.comments_count}
            </button>
            <button
              onClick={() => onSave(post.id)}
              className={`flex items-center gap-1.5 text-xs transition-colors ${post.isSaved ? 'text-orange-600' : 'text-gray-500 hover:text-orange-600'}`}
            >
              <BookmarkIcon size={14} className={post.isSaved ? 'fill-current' : ''} />
              {post.saves_count}
            </button>
            <button
              onClick={() => onShare(post)}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 transition-colors ml-auto"
            >
              <Share2 size={14} />
              Share
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ── Resource Card Component ──────────────────────────────────────────────
function ResourceCard({ resource, onDownload }: { resource: Resource; onDownload: (id: string) => void }) {
  const typeConfig: Record<string, { color: string; icon: LucideIcon }> = {
    'PDF': { color: 'text-red-400', icon: FileText },
    'Video': { color: 'text-orange-400', icon: Play },
    'Tool': { color: 'text-green-400', icon: Zap },
    'Template': { color: 'text-purple-400', icon: LayoutTemplate },
    'Pack': { color: 'text-orange-400', icon: FolderOpen },
  }
  const config = typeConfig[resource.resource_type] || { color: 'text-gray-400', icon: FileText }
  const TypeIcon = config.icon

  const icons: Record<string, string> = {
    'PDF': '📄',
    'Video': '🎬',
    'Tool': '🛠️',
    'Template': '📊',
    'Pack': '📦',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-2xl p-5 border transition-all duration-300 group shadow-sm ${resource.is_premium ? 'border-gray-200 opacity-70' : 'border-orange-200 hover:border-orange-300 hover:shadow-md'}`}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-2xl">{icons[resource.resource_type] || '📄'}</span>
        <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full border ${resource.is_premium ? 'bg-gray-100 text-gray-500 border-gray-200' : 'bg-green-50 text-green-600 border-green-200'}`}>
          {resource.is_premium ? 'Premium' : 'Free'}
        </span>
      </div>
      <h4 className="text-sm font-display font-bold text-gray-900 mb-1">{resource.title}</h4>
      <p className="text-xs text-gray-600 font-body mb-3">{resource.description}</p>
      <div className="flex items-center justify-between">
        <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${config.color}`}>
          <TypeIcon size={10} />
          {resource.resource_type}
        </span>
        {resource.is_premium ? (
          <button className="flex items-center gap-1 text-[10px] font-bold text-gray-500">
            <Lock size={10} />
            Premium
          </button>
        ) : (
          <button
            onClick={() => onDownload(resource.id)}
            className="flex items-center gap-1 text-[10px] font-bold text-orange-600 hover:underline"
          >
            <Download size={10} />
            Download
          </button>
        )}
      </div>
    </motion.div>
  )
}

// ── Poll Card Component ──────────────────────────────────────────────
function PollCard({ poll, onVote }: { poll: Poll; onVote: (pollId: string, optionId: string) => void }) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [hasVoted, setHasVoted] = useState(poll.hasVoted || false)
  const [localOptions, setLocalOptions] = useState(poll.options)
  const [totalVotes, setTotalVotes] = useState(poll.total_votes)

  const handleVote = (optionId: string) => {
    if (hasVoted) return
    setSelectedOption(optionId)
    setHasVoted(true)
    setLocalOptions(prev => prev.map(o => o.id === optionId ? { ...o, votes: o.votes + 1 } : o))
    setTotalVotes(prev => prev + 1)
    onVote(poll.id, optionId)
  }

  const getPercentage = (votes: number) => {
    if (totalVotes === 0) return 0
    return Math.round((votes / totalVotes) * 100)
  }

  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-xl bg-orange-100 border border-orange-200 flex items-center justify-center">
          <BarChart3 className="w-4 h-4 text-orange-600" />
        </div>
        <h3 className="text-sm font-display font-bold text-gray-900">Community Poll</h3>
      </div>

      <p className="text-sm font-semibold text-gray-900 mb-4">{poll.question}</p>

      <div className="space-y-2">
        {localOptions.map((option) => (
          <button
            key={option.id}
            onClick={() => handleVote(option.id)}
            disabled={hasVoted}
            className={`w-full relative overflow-hidden rounded-xl p-3 text-left transition-all ${
              hasVoted
                ? selectedOption === option.id
                  ? 'bg-orange-100 border-2 border-orange-500'
                  : 'bg-gray-50 border border-gray-200'
                : 'bg-white border border-gray-300 hover:border-orange-400'
            }`}
          >
            {hasVoted && (
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${getPercentage(option.votes)}%` }}
                className="absolute inset-0 bg-orange-200/30"
                transition={{ duration: 0.5 }}
              />
            )}
            <span className="relative z-10 flex items-center justify-between text-xs font-medium">
              <span className="text-gray-900">{option.text}</span>
              {hasVoted && (
                <span className="text-gray-500">{getPercentage(option.votes)}%</span>
              )}
            </span>
          </button>
        ))}
      </div>

      <p className="text-[10px] text-gray-500 mt-3 text-center">
        {totalVotes.toLocaleString()} votes • {hasVoted ? 'Thanks for voting!' : 'Click to vote'}
      </p>
    </div>
  )
}

// ── Share Modal Component ──────────────────────────────────────────────
function ShareModal({ post, onClose }: { post: Post; onClose: () => void }) {
  const shareUrl = typeof window !== 'undefined' ? window.location.href + `?post=${post.id}` : ''

  const handleShare = async (platform: string) => {
    const text = encodeURIComponent(`Check out: ${post.title}`)
    const url = encodeURIComponent(shareUrl)
    
    let shareLink = ''
    switch (platform) {
      case 'twitter':
        shareLink = `https://twitter.com/intent/tweet?text=${text}&url=${url}`
        break
      case 'linkedin':
        shareLink = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`
        break
      case 'whatsapp':
        shareLink = `https://wa.me/?text=${text}%20${url}`
        break
      case 'copy':
        await navigator.clipboard.writeText(shareUrl)
        toast.success('Link copied to clipboard!')
        onClose()
        return
    }
    
    if (shareLink) {
      window.open(shareLink, '_blank', 'width=600,height=400')
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-md bg-white rounded-2xl border border-gray-200 p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-display font-bold text-foreground">Share this post</h3>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors">
            <X size={18} />
          </button>
        </div>

        <p className="text-xs text-muted-foreground mb-4 line-clamp-2">{post.title}</p>

        <div className="grid grid-cols-4 gap-3">
          <button
            onClick={() => handleShare('twitter')}
            className="flex flex-col items-center gap-2 p-3 rounded-xl bg-[#1DA1F2]/10 border border-[#1DA1F2]/20 hover:bg-[#1DA1F2]/20 transition-colors"
          >
            <Twitter size={20} className="text-[#1DA1F2]" />
            <span className="text-[10px] font-medium text-foreground">Twitter</span>
          </button>
          <button
            onClick={() => handleShare('linkedin')}
            className="flex flex-col items-center gap-2 p-3 rounded-xl bg-[#0A66C2]/10 border border-[#0A66C2]/20 hover:bg-[#0A66C2]/20 transition-colors"
          >
            <Linkedin size={20} className="text-[#0A66C2]" />
            <span className="text-[10px] font-medium text-foreground">LinkedIn</span>
          </button>
          <button
            onClick={() => handleShare('whatsapp')}
            className="flex flex-col items-center gap-2 p-3 rounded-xl bg-[#25D366]/10 border border-[#25D366]/20 hover:bg-[#25D366]/20 transition-colors"
          >
            <Phone size={20} className="text-[#25D366]" />
            <span className="text-[10px] font-medium text-foreground">WhatsApp</span>
          </button>
          <button
            onClick={() => handleShare('copy')}
            className="flex flex-col items-center gap-2 p-3 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-colors"
          >
            <Copy size={20} className="text-primary" />
            <span className="text-[10px] font-medium text-foreground">Copy</span>
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ── Post Detail Modal ──────────────────────────────────────────────
function PostDetailModal({ post, onClose }: { post: Post; onClose: () => void }) {
  const [comment, setComment] = useState('')
  const [isLiked, setIsLiked] = useState(post.isLiked)
  const [isSaved, setIsSaved] = useState(post.isSaved)
  const [likes, setLikes] = useState(post.likes_count)
  const [saves, setSaves] = useState(post.saves_count)
  const [showShareModal, setShowShareModal] = useState(false)

  const handleLike = async () => {
    const newIsLiked = !isLiked
    setIsLiked(newIsLiked)
    setLikes(newIsLiked ? likes + 1 : likes - 1)
    
    // Database update
    const { error } = await supabase.from('post_likes').upsert({
      post_id: post.id,
      user_id: (await supabase.auth.getUser()).data.user?.id,
      reaction_type: 'like'
    }, { onConflict: 'post_id,user_id' })
    
    if (error) {
      setIsLiked(!newIsLiked)
      setLikes(!newIsLiked ? likes + 1 : likes - 1)
      toast.error('Failed to update like')
    }
  }

  const handleSave = async () => {
    const newIsSaved = !isSaved
    setIsSaved(newIsSaved)
    setSaves(newIsSaved ? saves + 1 : saves - 1)
    
    if (newIsSaved) {
      await supabase.from('post_saves').insert({ post_id: post.id, user_id: (await supabase.auth.getUser()).data.user?.id })
    } else {
      await supabase.from('post_saves').delete().match({ post_id: post.id, user_id: (await supabase.auth.getUser()).data.user?.id })
    }
  }

  const handleCommentSubmit = async () => {
    if (!comment.trim()) return
    
    const { error } = await supabase.from('post_comments').insert({
      post_id: post.id,
      user_id: (await supabase.auth.getUser()).data.user?.id,
      content: comment
    })
    
    if (error) {
      toast.error('Failed to post comment')
      return
    }
    
    setComment('')
    toast.success('Comment posted!')
  }

  const categoryConfig = CATEGORY_CONFIG[post.category] || { color: 'text-gray-400', bgColor: 'bg-gray-400/10', icon: Zap }
  const CategoryIcon = categoryConfig.icon

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto" onClick={onClose}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-2xl bg-card border border-border/50 rounded-3xl p-6 shadow-2xl my-8"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${categoryConfig.bgColor} ${categoryConfig.color} border border-current/20`}>
                <CategoryIcon size={10} />
                {post.category}
              </span>
              <span className="text-[10px] text-muted-foreground font-body flex items-center gap-1">
                <Clock size={10} />
                {formatTimestamp(post.created_at)}
              </span>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Thumbnail */}
          {post.thumbnail_emoji && (
            <div className="w-full h-32 rounded-2xl bg-gradient-to-br from-primary/10 to-orange-300/10 border border-primary/20 flex items-center justify-center text-5xl mb-4">
              {post.thumbnail_emoji}
            </div>
          )}

          {/* Title */}
          <h2 className="text-lg font-display font-bold text-foreground mb-3">{post.title}</h2>

          {/* Content */}
          <div className="prose prose-sm prose-invert max-w-none mb-4">
            <p className="text-sm text-muted-foreground font-body leading-relaxed">{post.description}</p>
            <h4 className="text-sm font-bold text-foreground mt-4 mb-2">What it is</h4>
            <p className="text-xs text-muted-foreground font-body">A comprehensive guide to help you leverage this AI tool/technique effectively.</p>
            <h4 className="text-sm font-bold text-foreground mt-4 mb-2">Why it matters</h4>
            <p className="text-xs text-muted-foreground font-body">This can significantly improve your productivity and help you stay ahead in the AI-powered world.</p>
            <h4 className="text-sm font-bold text-foreground mt-4 mb-2">How to use</h4>
            <p className="text-xs text-muted-foreground font-body">Follow the steps mentioned in the resource link or try the hands-on examples provided.</p>
          </div>

          {/* CTA */}
          {post.cta_text && (
            <a
              href={post.cta_link || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-primary to-orange-500 hover:shadow-[0_0_20px_rgba(225,120,0,0.4)] transition-all duration-300 mb-4"
            >
              {post.cta_text}
              <ExternalLink size={14} />
            </a>
          )}

          {/* Actions */}
          <div className="flex items-center gap-4 py-3 border-t border-border/20">
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${isLiked ? 'text-red-400 bg-red-400/10' : 'text-muted-foreground hover:text-red-400 hover:bg-red-400/10'}`}
            >
              <Heart size={14} className={isLiked ? 'fill-current' : ''} />
              {likes}
            </button>
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
              <MessageCircle size={14} />
              {post.comments_count}
            </button>
            <button
              onClick={handleSave}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${isSaved ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-primary hover:bg-primary/10'}`}
            >
              <BookmarkIcon size={14} className={isSaved ? 'fill-current' : ''} />
              {saves}
            </button>
            <button 
              onClick={() => setShowShareModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors ml-auto"
            >
              <Share2 size={14} />
              Share
            </button>
          </div>

          {/* Comments Section */}
          <div className="mt-4 pt-4 border-t border-border/20">
            <h4 className="text-xs font-bold text-foreground mb-3">Comments ({post.comments_count})</h4>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                U
              </div>
              <div className="flex-1">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="w-full px-3 py-2 rounded-xl bg-background border border-border/50 text-foreground text-xs font-body focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-all resize-none"
                  rows={2}
                />
                <div className="flex items-center justify-end gap-2 mt-2">
                  <button
                    onClick={handleCommentSubmit}
                    disabled={!comment.trim()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-primary to-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <Send size={12} />
                    Post
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && (
          <ShareModal post={post} onClose={() => setShowShareModal(false)} />
        )}
      </AnimatePresence>
    </>
  )
}

// ── Main Portal ──────────────────────────────────────────────────
export default function Portal() {
  const { user, signOut, loading } = useAuth()
  const navigate = useNavigate()
  const [activeNav, setActiveNav] = useState('home')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [student, setStudent] = useState<Student | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [showCompleteProfile, setShowCompleteProfile] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loadingPosts, setLoadingPosts] = useState(true)
  const [poll, setPoll] = useState<Poll | null>(null)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [resources, setResources] = useState<Resource[]>([])
  const [workshops, setWorkshops] = useState<Workshop[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])

  // Auth guard - wait for both auth and profile to load
  useEffect(() => {
    console.log('Auth state:', { loading, profileLoading, user: user?.email })
    if (!loading && !profileLoading) {
      if (!user) {
        console.log('No user, redirecting to login')
        navigate('/login')
      }
    }
  }, [user, loading, profileLoading, navigate])

  // Load student profile
  useEffect(() => {
    if (loading) return // Wait for auth to initialize

    if (!user) {
      setProfileLoading(false)
      return
    }

    const load = async () => {
      try {
        console.log('Loading student profile for:', user.id)
        const { data, error } = await supabase.from('students').select('*').eq('id', user.id).single()
        if (error && error.code !== 'PGRST116') {
          console.error('Error loading student:', error)
        }
        if (data) {
          console.log('Student loaded:', data.full_name)
          setStudent(data as Student)
        } else {
          console.log('No student record, showing complete profile modal')
          setShowCompleteProfile(true)
        }
      } catch (err) {
        console.error('Failed to load profile:', err)
        setShowCompleteProfile(true)
      } finally {
        setProfileLoading(false)
        console.log('Profile loading complete')
      }
    }
    load()
  }, [user, loading])

  // Load posts from database
  useEffect(() => {
    const loadPosts = async () => {
      if (!user) return
      
      setLoadingPosts(true)
      
      // Fetch posts
      let query = supabase
        .from('posts')
        .select('*')
        .eq('is_published', true)
        .eq('is_hidden', false)
        .order('created_at', { ascending: false })
        .limit(20)

      if (activeCategory) {
        query = query.eq('category', activeCategory)
      }

      const { data: postsData, error } = await query

      if (error) {
        console.error('Error loading posts:', error)
        setLoadingPosts(false)
        return
      }

      // Fetch user's likes and saves
      const { data: likesData } = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('user_id', user.id)

      const { data: savesData } = await supabase
        .from('post_saves')
        .select('post_id')
        .eq('user_id', user.id)

      const likedPostIds = new Set(likesData?.map(l => l.post_id))
      const savedPostIds = new Set(savesData?.map(s => s.post_id))

      const postsWithUserState = postsData?.map(post => ({
        ...post,
        isLiked: likedPostIds.has(post.id),
        isSaved: savedPostIds.has(post.id),
      })) || []

      setPosts(postsWithUserState)
      setLoadingPosts(false)
    }

    loadPosts()
  }, [user, activeCategory])

  // Load resources
  useEffect(() => {
    const loadResources = async () => {
      const { data } = await supabase
        .from('resources')
        .select('*')
        .eq('is_published', true)
        .eq('is_hidden', false)
        .limit(6)
      
      if (data) setResources(data)
    }
    loadResources()
  }, [])

  // Load workshops
  useEffect(() => {
    const loadWorkshops = async () => {
      const { data } = await supabase
        .from('workshops')
        .select('*')
        .eq('is_active', true)
        .order('event_date', { ascending: true })
        .limit(2)
      
      if (data) setWorkshops(data)
    }
    loadWorkshops()
  }, [])

  // Load poll
  useEffect(() => {
    const loadPoll = async () => {
      try {
      const { data: pollsData } = await supabase
        .from('polls')
        .select('*')
        .eq('is_active', true)
        .eq('is_published', true)
        .maybeSingle()

      if (pollsData) {
        // Only check if user is logged in and has an id
        let voteData: { option_id: string } | null = null;
        if (user && user.id) {
          const { data } = await supabase
            .from('poll_votes')
            .select('option_id')
            .eq('poll_id', pollsData.id)
            .eq('user_id', user.id)
            .single();
          voteData = data;
        }
        setPoll({
          id: pollsData.id,
          question: pollsData.question,
          options: pollsData.options,
          total_votes: pollsData.total_votes,
          hasVoted: !!voteData,
          selectedOption: voteData?.option_id,
        });
      }
      } catch { /* poll loading is best-effort */ }
    };
    loadPoll();
  }, [user]);

  // Load notifications
  useEffect(() => {
    const loadNotifications = async () => {
      if (!user) return
      const { data } = await supabase
        .from('portal_notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)
      
      if (data) setNotifications(data)
    }
    loadNotifications()
  }, [user])

  const handleSignOut = async () => {
    try {
      await signOut()
      // Clear any local state
      setPosts([])
      setStudent(null)
      setNotifications([])
      // Navigate to home
      window.location.href = '/'
    } catch (error) {
      console.error('Sign out error:', error)
      toast.error('Failed to sign out')
    }
  }

  const handleLike = async (postId: string) => {
    const post = posts.find(p => p.id === postId)
    if (!post || !user) return

    const newIsLiked = !post.isLiked
    
    // Optimistic update
    setPosts(prev => prev.map(p => p.id === postId ? { 
      ...p, 
      isLiked: newIsLiked, 
      likes_count: newIsLiked ? p.likes_count + 1 : p.likes_count - 1 
    } : p))

    if (newIsLiked) {
      await supabase.from('post_likes').insert({ post_id: postId, user_id: user.id })
    } else {
      await supabase.from('post_likes').delete().match({ post_id: postId, user_id: user.id })
    }
  }

  const handleSave = async (postId: string) => {
    const post = posts.find(p => p.id === postId)
    if (!post || !user) return

    const newIsSaved = !post.isSaved
    
    // Optimistic update
    setPosts(prev => prev.map(p => p.id === postId ? { 
      ...p, 
      isSaved: newIsSaved, 
      saves_count: newIsSaved ? p.saves_count + 1 : p.saves_count - 1 
    } : p))

    if (newIsSaved) {
      await supabase.from('post_saves').insert({ post_id: postId, user_id: user.id })
    } else {
      await supabase.from('post_saves').delete().match({ post_id: postId, user_id: user.id })
    }
  }

  const handleComment = (postId: string) => {
    const post = posts.find(p => p.id === postId)
    if (post) setSelectedPost(post)
  }

  const handleViewPost = (post: Post) => {
    setSelectedPost(post)
    // Increment view count
    supabase.rpc('increment_view_count', { post_id: post.id })
  }

  const handleShare = (post: Post) => {
    setSelectedPost(post)
  }

  const handleVote = async (pollId: string, optionId: string) => {
    if (!user) {
      toast.error('Please login to vote')
      return
    }

    const { error } = await supabase.from('poll_votes').insert({
      poll_id: pollId,
      user_id: user.id,
      option_id: optionId
    })

    if (error) {
      toast.error('Failed to vote')
      return
    }

    toast.success('Vote recorded!')
    
    // Reload poll to get updated data
    const { data: pollsData } = await supabase
      .from('polls')
      .select('*')
      .eq('id', pollId)
      .single()
    
    if (pollsData) {
      setPoll({
        id: pollsData.id,
        question: pollsData.question,
        options: pollsData.options,
        total_votes: pollsData.total_votes,
        hasVoted: true,
        selectedOption: optionId,
      })
    }
  }

  const handleDownloadResource = async (resourceId: string) => {
    toast.success('Download started!')
    // Track download
    await supabase.from('portal_analytics').insert({
      event_type: 'download_resource',
      user_id: user?.id,
      metadata: { resource_id: resourceId }
    })
  }

  const displayName = student?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Student'
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

  let filteredPosts = searchQuery
    ? posts.filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.description.toLowerCase().includes(searchQuery.toLowerCase()))
    : posts

  if (activeNav === 'saved-posts') {
    filteredPosts = filteredPosts.filter(p => p.isSaved)
  }

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <span className="w-10 h-10 rounded-full border-4 border-orange-200 border-t-orange-500 animate-spin" />
          <p className="text-sm text-gray-600 font-body">Loading your portal…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex">
      {showCompleteProfile && user && (
        <CompleteProfileModal
          userId={user.id}
          email={user.email ?? ''}
          onComplete={(s) => { setStudent(s); setShowCompleteProfile(false) }}
        />
      )}

      {/* Post Detail & Share Modal */}
      <AnimatePresence>
        {selectedPost && (
          <PostDetailModal post={selectedPost} onClose={() => setSelectedPost(null)} />
        )}
      </AnimatePresence>

      {/* ── Left Sidebar ── */}
      <>
        {/* Mobile overlay */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 z-50 bg-black/60 lg:hidden"
            />
          )}
        </AnimatePresence>

        <motion.aside
          className={`fixed top-0 left-0 h-full z-[60] w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 shadow-xl`}
        >
          {/* Logo */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
            <Link to="/" className="flex flex-col gap-1">
              <img src={onrolLogo} alt="ONROL" className="h-16 w-auto object-contain" style={{ height: '64px' }} />
              <span className="text-[9px] font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full w-fit">AI PORTAL</span>
            </Link>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-500 hover:text-gray-800 p-1">
              <X size={18} />
            </button>
          </div>

          {/* User badge */}
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-orange-50 border border-orange-100">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-orange-300 flex items-center justify-center text-[11px] font-bold text-white shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-display font-bold text-gray-900 truncate">{displayName}</p>
                <p className="text-[9px] text-gray-500 truncate">{student?.college_name || 'Student'}</p>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
            {NAV_ITEMS.map(item => {
              const active = activeNav === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => { 
                    setActiveNav(item.id); 
                    setSidebarOpen(false);
                    // Update active category if the nav item corresponds to a category
                    if (CATEGORY_CONFIG[item.label]) {
                      setActiveCategory(item.label);
                    } else if (item.id === 'home') {
                      setActiveCategory(null);
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer ${active ? 'bg-orange-100 text-orange-600 border border-orange-200' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
                >
                  <item.icon size={14} className="shrink-0" />
                  <span>{item.label}</span>
                  {active && <ChevronRight size={10} className="ml-auto" />}
                </button>
              )
            })}
          </nav>

          {/* Sign out */}
          <div className="px-3 py-3 border-t border-gray-200">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 transition-all duration-200 cursor-pointer"
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </div>
        </motion.aside>
      </>

      {/* ── Main Content ── */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen bg-[#F8F9FA]">
        {/* Header */}
        <header className="sticky top-0 z-[55] flex items-center justify-between px-4 md:px-6 py-3 border-b border-gray-200 bg-white/95 backdrop-blur-md shadow-sm">
          <div className="flex items-center gap-3 flex-1">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-600 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100 transition-colors active:bg-gray-200 active:scale-95"
              style={{ minWidth: '44px', minHeight: '44px' }}
            >
              <Menu size={20} />
            </button>
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search AI tools, news, resources..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-white border border-gray-300 text-gray-900 text-sm font-body placeholder:text-gray-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setNotificationOpen(!notificationOpen)}
                className="p-2 rounded-xl hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors relative"
              >
                <Bell size={16} />
                {notifications.some(n => !n.is_read) && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-orange-500" />
                )}
              </button>
              <AnimatePresence>
                {notificationOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-72 bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b border-gray-200">
                      <h3 className="text-xs font-bold text-gray-900">Notifications</h3>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-6 text-center text-xs text-gray-500">No notifications</div>
                      ) : (
                        notifications.map((notif) => (
                          <div key={notif.id} className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${!notif.is_read ? 'bg-orange-50' : ''}`}>
                            <p className="text-xs font-semibold text-gray-900">{notif.title}</p>
                            <p className="text-[10px] text-gray-500">{notif.message}</p>
                            <p className="text-[9px] text-gray-400 mt-1">{formatTimestamp(notif.created_at)}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Profile */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-orange-300 flex items-center justify-center text-[11px] font-bold text-white">
                  {initials}
                </div>
                <ChevronDown size={14} className="text-gray-500 hidden sm:block" />
              </button>
              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b border-gray-200">
                      <p className="text-xs font-bold text-gray-900">{displayName}</p>
                      <p className="text-[10px] text-gray-500 truncate">{user?.email}</p>
                    </div>
                    <div className="py-2">
                      <button className="w-full px-4 py-2 text-left text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors">Profile Settings</button>
                      <button className="w-full px-4 py-2 text-left text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors">My Activity</button>
                      <button className="w-full px-4 py-2 text-left text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors">Saved Posts</button>
                    </div>
                    <div className="py-2 border-t border-gray-200">
                      <button
                        onClick={handleSignOut}
                        className="w-full px-4 py-2 text-left text-xs text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                      >
                        <LogOut size={12} />
                        Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 px-4 md:px-6 py-6 overflow-y-auto">
          <div className="flex gap-6">
            {/* Main Content Area */}
            <div className="flex-1 min-w-0 space-y-6">
              {/* SECTION 1: Hero Feature Strip - Only visible on Home */}
              {activeNav === 'home' && (
                <section>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Card 1: Featured Post */}
                  {posts.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-2xl p-5 border border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100/50 shadow-sm"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                          <Sparkles className="w-4 h-4 text-primary" />
                        </div>
                        <span className="text-[10px] font-bold text-primary uppercase tracking-wide">Featured Post</span>
                      </div>
                      <h3 className="text-sm font-display font-bold text-foreground mb-2 line-clamp-2">{posts[0]?.title}</h3>
                      <p className="text-xs text-muted-foreground font-body mb-3 line-clamp-2">{posts[0]?.description}</p>
                      <button
                        onClick={() => handleViewPost(posts[0])}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-primary to-orange-500 hover:shadow-[0_0_15px_rgba(225,120,0,0.3)] transition-all"
                      >
                        Read More
                        <ArrowRight size={12} />
                      </button>
                    </motion.div>
                  )}

                  {/* Card 2: Upcoming Workshop */}
                  {workshops.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 }}
                      className="bg-white rounded-2xl p-5 border border-orange-200 bg-gradient-to-br from-orange-50 to-red-50 shadow-sm"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-xl bg-orange-400/20 border border-orange-400/30 flex items-center justify-center">
                          <Calendar className="w-4 h-4 text-orange-400" />
                        </div>
                        <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wide">Upcoming Workshop</span>
                      </div>
                      <h3 className="text-sm font-display font-bold text-foreground mb-2 line-clamp-2">{workshops[0]?.title}</h3>
                      <p className="text-xs text-muted-foreground font-body mb-3">{formatDate(workshops[0]?.event_date)}</p>
                      <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-red-500 hover:shadow-[0_0_15px_rgba(255,100,50,0.3)] transition-all">
                        Register Now
                        <ArrowRight size={12} />
                      </button>
                    </motion.div>
                  )}

                  {/* Card 3: Free Resource */}
                  {resources.filter(r => !r.is_premium).length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="bg-white rounded-2xl p-5 border border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 shadow-sm"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-xl bg-green-400/20 border border-green-400/30 flex items-center justify-center">
                          <FolderOpen className="w-4 h-4 text-green-400" />
                        </div>
                        <span className="text-[10px] font-bold text-green-400 uppercase tracking-wide">Free Resource</span>
                      </div>
                      <h3 className="text-sm font-display font-bold text-foreground mb-2">{resources.find(r => !r.is_premium)?.title}</h3>
                      <p className="text-xs text-muted-foreground font-body mb-3">Download now</p>
                      <button 
                        onClick={() => handleDownloadResource(resources.find(r => !r.is_premium)?.id || '')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-green-500 to-emerald-500 hover:shadow-[0_0_15px_rgba(50,200,100,0.3)] transition-all"
                      >
                        Download
                        <Download size={12} />
                      </button>
                    </motion.div>
                  )}
                </div>
              </section>
              )}

              {/* SECTION 2: Latest Updates Feed */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-display font-bold text-foreground flex items-center gap-2">
                    <TrendingUp size={16} className="text-primary" />
                    Latest Updates
                  </h2>
                  {activeCategory && (
                    <button
                      onClick={() => setActiveCategory(null)}
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      Clear filter
                      <X size={12} />
                    </button>
                  )}
                </div>
                
                {loadingPosts ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="bg-white rounded-2xl p-5 border border-gray-200 animate-pulse shadow-sm">
                        <div className="flex items-start gap-4">
                          <div className="w-16 h-16 rounded-xl bg-border/50" />
                          <div className="flex-1 space-y-3">
                            <div className="h-4 bg-border/50 rounded w-3/4" />
                            <div className="h-3 bg-border/50 rounded w-full" />
                            <div className="h-3 bg-border/50 rounded w-2/3" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredPosts.length === 0 ? (
                  <div className="bg-white rounded-2xl p-8 border border-gray-200 text-center shadow-sm">
                    <Search size={32} className="mx-auto text-muted-foreground/70 mb-3" />
                    <p className="text-sm font-semibold text-foreground">No posts found</p>
                    <p className="text-xs text-muted-foreground">Check back later for new content</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredPosts.map((post, i) => (
                      <motion.div
                        key={post.id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <PostCard
                          post={post}
                          onLike={handleLike}
                          onSave={handleSave}
                          onComment={handleComment}
                          onShare={handleShare}
                          onView={handleViewPost}
                        />
                      </motion.div>
                    ))}
                  </div>
                )}
              </section>

              {/* SECTION 3: Category Quick Access - Only visible on Home or Categories */}
              {(activeNav === 'home' || CATEGORY_CONFIG[NAV_ITEMS.find(n => n.id === activeNav)?.label || '']) && (
              <section>
                <h2 className="text-sm font-display font-bold text-foreground mb-3 flex items-center gap-2">
                  <Filter size={14} className="text-primary" />
                  Browse by Category
                </h2>
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  <button
                    onClick={() => setActiveCategory(null)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${!activeCategory ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-background border border-border/50 text-muted-foreground hover:border-primary/40'}`}
                  >
                    All
                  </button>
                  {Object.entries(CATEGORY_CONFIG).map(([name, config]) => (
                    <button
                      key={name}
                      onClick={() => setActiveCategory(name)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${activeCategory === name ? `${config.bgColor} ${config.color} border ${config.color.replace('text', 'border')}/30` : 'bg-background border border-border/50 text-muted-foreground hover:border-primary/40'}`}
                    >
                      <config.icon size={12} />
                      {name}
                    </button>
                  ))}
                </div>
              </section>
              )}

              {/* SECTION 4: Trending This Week - Only visible on Home */}
              {activeNav === 'home' && posts.length > 0 && (
                <section>
                  <h2 className="text-sm font-display font-bold text-foreground mb-3 flex items-center gap-2">
                    <TrendingUp size={16} className="text-primary" />
                    Trending This Week
                  </h2>
                  <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                    {posts.slice(0, 4).sort((a, b) => b.likes_count - a.likes_count).map((post, i) => (
                      <div
                        key={post.id}
                        className="flex items-center gap-4 p-4 border-b border-border/20 last:border-b-0 hover:bg-white/5 transition-colors cursor-pointer"
                        onClick={() => handleViewPost(post)}
                      >
                        <span className="w-6 h-6 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">{post.title}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Heart size={10} />
                              {post.likes_count}
                            </span>
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Eye size={10} />
                              {post.views_count}
                            </span>
                            <span className="text-[10px] text-muted-foreground">{formatTimestamp(post.created_at)}</span>
                          </div>
                        </div>
                        <ChevronRight size={14} className="text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* SECTION 5: Workshop Spotlight - Only on Home or Workshops */}
              {(activeNav === 'home' || activeNav === 'workshops') && workshops.length > 0 && (
                <section>
                  <div className="bg-white rounded-2xl p-6 border border-orange-200 bg-gradient-to-br from-orange-50 to-red-50 relative overflow-hidden shadow-sm">
                    <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-orange-400/10 blur-3xl pointer-events-none" />
                    <div className="relative">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-400/20 border border-orange-400/30 flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-orange-400" />
                        </div>
                        <div>
                          <h2 className="text-base font-display font-bold text-foreground">Workshop Spotlight</h2>
                          <p className="text-xs text-muted-foreground">Don't miss out on this opportunity</p>
                        </div>
                      </div>
                      <h3 className="text-lg font-display font-bold text-foreground mb-2">{workshops[0]?.title}</h3>
                      <p className="text-sm text-muted-foreground font-body mb-4 max-w-lg">
                        {workshops[0]?.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-4 mb-4">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <CalendarDays size={14} />
                          {formatDate(workshops[0]?.event_date)}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock size={14} />
                          {formatTime(workshops[0]?.event_date)}
                        </div>
                      </div>
                      <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-orange-500 to-red-500 hover:shadow-[0_0_20px_rgba(255,100,50,0.4)] transition-all duration-300">
                        <Calendar className="w-4 h-4" />
                        Join Now
                      </button>
                    </div>
                  </div>
                </section>
              )}

              {/* SECTION 6: Resource Vault Preview - Only on Home or Resources */}
              {(activeNav === 'home' || activeNav === 'resources') && resources.length > 0 && (
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-display font-bold text-foreground flex items-center gap-2">
                      <FolderOpen size={16} className="text-primary" />
                      Resource Vault
                    </h2>
                    <button className="text-xs text-primary hover:underline font-semibold flex items-center gap-1">
                      View All
                      <ChevronRight size={12} />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {resources.slice(0, 6).map((resource) => (
                      <ResourceCard 
                        key={resource.id} 
                        resource={resource} 
                        onDownload={handleDownloadResource}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* SECTION 7: Poll Block - Visible on Home and Polls */}
              {(activeNav === 'home' || activeNav === 'polls') && poll && (
                <section>
                  <PollCard poll={poll} onVote={handleVote} />
                </section>
              )}
            </div>

            {/* Right Sidebar */}
            <aside className="hidden xl:block w-72 shrink-0 space-y-6">
              {/* Upcoming Workshops */}
              {workshops.length > 0 && (
                <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
                  <h3 className="text-xs font-bold text-foreground mb-3 flex items-center gap-2">
                    <Calendar size={14} className="text-primary" />
                    Upcoming Workshops
                  </h3>
                  <div className="space-y-3">
                    {workshops.map((workshop) => (
                      <div key={workshop.id} className="p-3 rounded-xl bg-background border border-border/30 hover:border-primary/20 transition-colors">
                        <h4 className="text-xs font-bold text-foreground mb-1 line-clamp-2">{workshop.title}</h4>
                        <p className="text-[9px] text-muted-foreground mb-2">{formatDate(workshop.event_date)}</p>
                        <button className="w-full py-1.5 rounded-lg text-[10px] font-bold text-white bg-gradient-to-r from-primary to-orange-500 hover:shadow-[0_0_10px_rgba(225,120,0,0.3)] transition-all">
                          Register
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Popular Posts */}
              {posts.length > 0 && (
                <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
                  <h3 className="text-xs font-bold text-foreground mb-3 flex items-center gap-2">
                    <TrendingUp size={14} className="text-primary" />
                    Popular Posts
                  </h3>
                  <div className="space-y-3">
                    {posts.slice(0, 4).sort((a, b) => b.likes_count - a.likes_count).map((post) => (
                      <div
                        key={post.id}
                        className="flex items-start gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
                        onClick={() => handleViewPost(post)}
                      >
                        <span className="text-lg">{post.thumbnail_emoji || '📄'}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-foreground line-clamp-2">{post.title}</p>
                          <p className="text-[9px] text-muted-foreground mt-1">{formatTimestamp(post.created_at)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended Categories */}
              <div className="glass-card rounded-2xl p-5 border border-border/30">
                <h3 className="text-xs font-bold text-foreground mb-3 flex items-center gap-2">
                  <Star size={14} className="text-yellow-400" />
                  Recommended For You
                </h3>
                <div className="flex flex-wrap gap-2">
                  {['AI Tools', 'Daily Hacks', 'Prompts', 'Courses'].map((cat) => {
                    const config = CATEGORY_CONFIG[cat] || { color: 'text-gray-400', bgColor: 'bg-gray-400/10', icon: Zap }
                    return (
                      <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all ${config.bgColor} ${config.color} border border-current/20 hover:border-current/40`}
                      >
                        <config.icon size={10} />
                        {cat}
                      </button>
                    )
                  })}
                </div>
              </div>
            </aside>
          </div>
        </main>
      </div>
    </div>
  )
}

