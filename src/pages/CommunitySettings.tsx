import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useCommunityAuth } from "@/contexts/CommunityAuthContext";
import { CommunityLayout } from "@/components/community/CommunityLayout";
import { Settings, User, Bell, Shield, Eye, Mail, Globe, MapPin, Briefcase, Link as LinkIcon, Github, Twitter, Linkedin } from "lucide-react";
import { communitySupabase as supabase } from "@/lib/communitySupabase";
import { toast } from "sonner";

const CommunitySettings = () => {
  const { member, updateMember } = useCommunityAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "notifications" | "privacy">("profile");
  type SettingsTabId = "profile" | "notifications" | "privacy";
  const settingsTabs: Array<{ id: SettingsTabId; label: string; icon: typeof User }> = [
    { id: "profile", label: "Profile", icon: User },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "privacy", label: "Privacy", icon: Shield },
  ];
  
  const [formData, setFormData] = useState({
    full_name: member?.full_name || "",
    tagline: member?.tagline || "",
    bio: member?.bio || "",
    location: member?.location || "",
    current_role: member?.current_role || "",
    company: member?.company || "",
    linkedin_url: member?.linkedin_url || "",
    github_url: member?.github_url || "",
    twitter_url: member?.twitter_url || "",
    portfolio_url: member?.portfolio_url || "",
    skills: member?.skills?.join(", ") || "",
    email_notifications: member?.email_notifications !== false,
    push_notifications: member?.push_notifications !== false,
    profile_visibility: member?.profile_visibility || "members",
  });

  useEffect(() => {
    if (member) {
      setFormData({
        full_name: member.full_name || "",
        tagline: member.tagline || "",
        bio: member.bio || "",
        location: member.location || "",
        current_role: member.current_role || "",
        company: member.company || "",
        linkedin_url: member.linkedin_url || "",
        github_url: member.github_url || "",
        twitter_url: member.twitter_url || "",
        portfolio_url: member.portfolio_url || "",
        skills: member.skills?.join(", ") || "",
        email_notifications: member.email_notifications !== false,
        push_notifications: member.push_notifications !== false,
        profile_visibility: member.profile_visibility || "members",
      });
    }
  }, [member]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const skillsArray = formData.skills.split(",").map(s => s.trim()).filter(s => s);
      
      await updateMember({
        full_name: formData.full_name,
        tagline: formData.tagline,
        bio: formData.bio,
        location: formData.location,
        current_role: formData.current_role,
        company: formData.company,
        linkedin_url: formData.linkedin_url,
        github_url: formData.github_url,
        twitter_url: formData.twitter_url,
        portfolio_url: formData.portfolio_url,
        skills: skillsArray,
        email_notifications: formData.email_notifications,
        push_notifications: formData.push_notifications,
        profile_visibility: formData.profile_visibility,
      });
      toast.success("Settings saved successfully.");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <CommunityLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-[#0B1640] flex items-center gap-3">
            <Settings className="w-7 h-7 text-orange-600" />
            Settings
          </h1>
          <p className="text-zinc-400 mt-1">Manage your profile and preferences</p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 border-b border-white/5">
          {settingsTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-orange-500 text-orange-600"
                  : "border-transparent text-[#0B1640]/75 hover:text-[#0B1640]"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Profile Card */}
            <div className="bg-[#232532] rounded-2xl border border-white/5 p-6">
              <h2 className="text-lg font-bold text-[#0B1640] mb-6">Profile Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                    <input
                      type="text"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 rounded-xl bg-white border border-[#0B1640]/10 text-[#0B1640] placeholder:text-zinc-500 focus:outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/20 transition-all"
                      placeholder="Your name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                    Tagline
                  </label>
                  <input
                    type="text"
                    value={formData.tagline}
                    onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-[#0B1640]/10 text-[#0B1640] placeholder:text-zinc-500 focus:outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/20 transition-all"
                    placeholder="AI Builder | Automation Expert"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                    Bio
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-[#0B1640]/10 text-[#0B1640] placeholder:text-zinc-500 focus:outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/20 transition-all resize-none"
                    rows={4}
                    placeholder="Tell us about yourself..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                      Location
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-white border border-[#0B1640]/10 text-[#0B1640] placeholder:text-zinc-500 focus:outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/20 transition-all"
                        placeholder="Bengaluru, India"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                      Skills (comma separated)
                    </label>
                    <input
                      type="text"
                      value={formData.skills}
                      onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-white border border-[#0B1640]/10 text-[#0B1640] placeholder:text-zinc-500 focus:outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/20 transition-all"
                      placeholder="AI, Python, Automation"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                      Current Role
                    </label>
                    <div className="relative">
                      <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                      <input
                        type="text"
                        value={formData.current_role}
                        onChange={(e) => setFormData({ ...formData, current_role: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-white border border-[#0B1640]/10 text-[#0B1640] placeholder:text-zinc-500 focus:outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/20 transition-all"
                        placeholder="AI Engineer"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                      Company
                    </label>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-white border border-[#0B1640]/10 text-[#0B1640] placeholder:text-zinc-500 focus:outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/20 transition-all"
                      placeholder="Company name"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className="bg-[#232532] rounded-2xl border border-white/5 p-6">
              <h2 className="text-lg font-bold text-[#0B1640] mb-6">Social Links</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-2">
                    <Linkedin className="w-4 h-4" /> LinkedIn URL
                  </label>
                  <input
                    type="url"
                    value={formData.linkedin_url}
                    onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-[#0B1640]/10 text-[#0B1640] placeholder:text-zinc-500 focus:outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/20 transition-all"
                    placeholder="https://linkedin.com/in/yourprofile"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-2">
                    <Github className="w-4 h-4" /> GitHub URL
                  </label>
                  <input
                    type="url"
                    value={formData.github_url}
                    onChange={(e) => setFormData({ ...formData, github_url: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-[#0B1640]/10 text-[#0B1640] placeholder:text-zinc-500 focus:outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/20 transition-all"
                    placeholder="https://github.com/yourusername"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-2">
                    <Twitter className="w-4 h-4" /> Twitter URL
                  </label>
                  <input
                    type="url"
                    value={formData.twitter_url}
                    onChange={(e) => setFormData({ ...formData, twitter_url: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-[#0B1640]/10 text-[#0B1640] placeholder:text-zinc-500 focus:outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/20 transition-all"
                    placeholder="https://twitter.com/yourusername"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-2">
                    <Globe className="w-4 h-4" /> Portfolio URL
                  </label>
                  <input
                    type="url"
                    value={formData.portfolio_url}
                    onChange={(e) => setFormData({ ...formData, portfolio_url: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-[#0B1640]/10 text-[#0B1640] placeholder:text-zinc-500 focus:outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/20 transition-all"
                    placeholder="https://yourportfolio.com"
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={loading}
              className="w-full py-4 rounded-xl font-bold text-[#0B1640] transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(145deg, #ff9c30 0%, #ff5500 100%)" }}
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </motion.div>
        )}

        {/* Notifications Tab */}
        {activeTab === "notifications" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#232532] rounded-2xl border border-white/5 p-6"
          >
            <h2 className="text-lg font-bold text-[#0B1640] mb-6">Notification Preferences</h2>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-xl bg-white border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-500/15">
                    <Mail className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-medium text-[#0B1640]">Email Notifications</p>
                    <p className="text-sm text-zinc-400">Receive updates via email</p>
                  </div>
                </div>
                <button
                  onClick={() => setFormData({ ...formData, email_notifications: !formData.email_notifications })}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    formData.email_notifications ? "bg-orange-500" : "bg-white/10"
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                    formData.email_notifications ? "translate-x-6" : "translate-x-0.5"
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-white border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-500/15">
                    <Bell className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-medium text-[#0B1640]">Push Notifications</p>
                    <p className="text-sm text-zinc-400">Receive in-app notifications</p>
                  </div>
                </div>
                <button
                  onClick={() => setFormData({ ...formData, push_notifications: !formData.push_notifications })}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    formData.push_notifications ? "bg-orange-500" : "bg-white/10"
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                    formData.push_notifications ? "translate-x-6" : "translate-x-0.5"
                  }`} />
                </button>
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={loading}
              className="w-full mt-6 py-4 rounded-xl font-bold text-[#0B1640] transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(145deg, #ff9c30 0%, #ff5500 100%)" }}
            >
              {loading ? "Saving..." : "Save Preferences"}
            </button>
          </motion.div>
        )}

        {/* Privacy Tab */}
        {activeTab === "privacy" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#232532] rounded-2xl border border-white/5 p-6"
          >
            <h2 className="text-lg font-bold text-[#0B1640] mb-6">Privacy Settings</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-2">
                  <Eye className="w-4 h-4" /> Profile Visibility
                </label>
                <select
                  value={formData.profile_visibility}
                  onChange={(e) => setFormData({ ...formData, profile_visibility: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-[#0B1640]/10 text-[#0B1640] focus:outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/20 transition-all"
                >
                  <option value="public" className="bg-background">Public - Anyone can view</option>
                  <option value="members" className="bg-background">Members Only - Approved members only</option>
                  <option value="private" className="bg-background">Private - Only you can view</option>
                </select>
                <p className="text-xs text-zinc-400 mt-2">
                  Control who can see your profile information
                </p>
              </div>

              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <p className="text-sm text-amber-400 font-medium">
                  ⚠️ Your data is encrypted and stored securely. We never sell your personal information to third parties.
                </p>
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={loading}
              className="w-full mt-6 py-4 rounded-xl font-bold text-[#0B1640] transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(145deg, #ff9c30 0%, #ff5500 100%)" }}
            >
              {loading ? "Saving..." : "Save Privacy Settings"}
            </button>
          </motion.div>
        )}
      </div>
    </CommunityLayout>
  );
};

export default CommunitySettings;

