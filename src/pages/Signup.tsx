import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import Logo from "@/components/shared/Logo"

const INTERESTS = [
  { id: 'ai_career',    label: 'AI Career' },
  { id: 'freelancing',  label: 'Freelancing' },
  { id: 'startup',      label: 'Startup' },
  { id: 'automation',   label: 'Automation' },
]

const GRAD_YEARS = Array.from({ length: 8 }, (_, i) => 2024 + i)

const steps = ['Account', 'Profile', 'Interests']

export default function Signup() {
  const navigate   = useNavigate()
  const [step, setStep] = useState(0)
  const [gLoading, setGLoading] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [showPw, setShowPw]     = useState(false)

  const [form, setForm] = useState({
    email: '', password: '', confirmPassword: '',
    fullName: '', phone: '', college: '', course: '', gradYear: '',
    interests: [] as string[],
  })

  const set = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }))

  const toggleInterest = (id: string) => {
    setForm(f => ({
      ...f,
      interests: f.interests.includes(id) ? f.interests.filter(x => x !== id) : [...f.interests, id],
    }))
  }

  const handleGoogle = async () => {
    setGLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/portal` },
    })
    if (error) { toast.error(error.message); setGLoading(false) }
  }

  const nextStep = () => {
    if (step === 0) {
      if (!form.email || !form.password) { toast.error('Please fill in email and password.'); return }
      if (form.password !== form.confirmPassword) { toast.error('Passwords do not match.'); return }
      if (form.password.length < 8) { toast.error('Password must be at least 8 characters.'); return }
    }
    if (step === 1) {
      if (!form.fullName || !form.phone || !form.college || !form.course || !form.gradYear) {
        toast.error('Please complete all profile fields.'); return
      }
    }
    setStep(s => s + 1)
  }

  const handleSubmit = async () => {
    if (form.interests.length === 0) { toast.error('Pick at least one interest.'); return }
    setLoading(true)

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.fullName } },
    })

    if (authError || !authData.user) {
      toast.error(authError?.message ?? 'Signup failed. Try again.')
      setLoading(false)
      return
    }

    const { error: dbError } = await supabase.from('students').insert({
      id: authData.user.id,
      full_name: form.fullName,
      email: form.email,
      phone: form.phone,
      college_name: form.college,
      course_branch: form.course,
      graduation_year: parseInt(form.gradYear),
      interested_in: form.interests,
    })

    setLoading(false)

    if (dbError) {
      toast.error('Profile save failed: ' + dbError.message)
      return
    }

    toast.success('Account created! Welcome to ONROL.')
    navigate('/portal')
  }

  const inputClass =
    'w-full px-4 py-3 rounded-xl bg-card border border-border/50 text-foreground placeholder:text-muted-foreground/65 text-sm font-body focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-all duration-200'

  return (
    <div className="min-h-screen bg-background flex">
      {/* ── Left panel ── */}
      <div className="hidden lg:flex flex-col justify-between w-[42%] min-h-screen relative overflow-hidden px-12 py-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-background pointer-events-none" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] rounded-full bg-primary/[0.07] blur-3xl pointer-events-none" />

        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <Logo variant="light" className="h-14 w-auto object-contain" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="relative z-10"
        >
          <p className="text-[11px] font-body font-bold tracking-[0.28em] uppercase text-primary mb-4">Free to join</p>
          <h1 className="text-4xl xl:text-5xl font-display font-bold text-foreground leading-tight mb-6">
            Start your<br />AI-first career<br />today.
          </h1>
          <p className="text-muted-foreground font-body text-base mb-10 max-w-xs leading-relaxed">
            Join 247+ builders from colleges across India who are building AI skills, portfolios, and income streams with ONROL.
          </p>

          {/* Step preview */}
          <div className="space-y-3">
            {steps.map((s, i) => (
              <div key={i} className={`flex items-center gap-3 transition-all duration-300 ${step >= i ? 'opacity-100' : 'opacity-30'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all duration-300 ${step > i ? 'bg-primary border-primary text-white' : step === i ? 'border-primary text-primary' : 'border-border text-muted-foreground'}`}>
                  {step > i ? <CheckCircle2 size={12} /> : i + 1}
                </div>
                <span className={`text-sm font-body font-medium ${step >= i ? 'text-foreground/80' : 'text-muted-foreground/65'}`}>{s}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="relative z-10 glass-card rounded-2xl p-5 border border-border/40"
        >
          <p className="text-sm font-body text-foreground/75 italic leading-relaxed mb-3">
            "I was just a curious engineering student. ONROL helped me build an AI resume tool that got shared by 400+ people on LinkedIn."
          </p>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/40 to-orange-300/20 flex items-center justify-center text-[11px] font-bold text-primary">PS</div>
            <div>
              <p className="text-xs font-semibold text-foreground/90">Priya Sharma</p>
              <p className="text-[10px] text-muted-foreground">3rd Year CSE, Bengaluru — AI Portfolio Builder</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 flex justify-center">
            <Logo variant="light" className="h-12 w-auto object-contain" />
          </div>

          {/* Step indicator (mobile) */}
          <div className="flex items-center gap-2 mb-6 lg:hidden">
            {steps.map((_, i) => (
              <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-500 ${step >= i ? 'bg-primary' : 'bg-border/40'}`} />
            ))}
          </div>

          <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-1">
            {step === 0 && 'Create account'}
            {step === 1 && 'Your profile'}
            {step === 2 && 'Your interests'}
          </h2>
          <p className="text-sm text-muted-foreground font-body mb-8">
            {step === 0 && 'Step 1 of 3 — start with your credentials'}
            {step === 1 && 'Step 2 of 3 — tell us about yourself'}
            {step === 2 && 'Step 3 of 3 — what are you building towards?'}
          </p>

          {/* ─── Step 0: Credentials ─── */}
          {step === 0 && (
            <div className="space-y-4">
              <button
                onClick={handleGoogle}
                disabled={gLoading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-border/60 bg-card hover:bg-card/80 hover:border-primary/40 transition-all duration-300 text-sm font-semibold text-foreground mb-2 disabled:opacity-60"
              >
                {gLoading ? (
                  <span className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )}
                <span>{gLoading ? 'Redirecting…' : 'Sign up with Google'}</span>
              </button>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border/40" />
                <span className="text-[11px] text-muted-foreground font-body uppercase tracking-wider">or email</span>
                <div className="flex-1 h-px bg-border/40" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground/70 mb-1.5 tracking-wide">Email ID</label>
                <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@example.com" className={inputClass} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground/70 mb-1.5 tracking-wide">Password</label>
                <div className="relative">
                  <input type={showPw ? 'text' : 'password'} value={form.password} onChange={e => set('password', e.target.value)} placeholder="Min. 8 characters" className={`${inputClass} pr-11`} />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/70 hover:text-foreground/70 transition-colors">
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground/70 mb-1.5 tracking-wide">Confirm Password</label>
                <input type="password" value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} placeholder="Re-enter password" className={inputClass} />
              </div>

              <button onClick={nextStep} className="w-full py-3 rounded-xl text-sm font-bold text-[#0B1640] tracking-wide transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_24px_rgba(225,120,0,0.45)] mt-1" style={{ background: 'linear-gradient(135deg, #ff8c00 0%, #ff5500 100%)' }}>
                Continue →
              </button>
            </div>
          )}

          {/* ─── Step 1: Profile ─── */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground/70 mb-1.5 tracking-wide">Full Name</label>
                <input type="text" value={form.fullName} onChange={e => set('fullName', e.target.value)} placeholder="Arjun Mehta" className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground/70 mb-1.5 tracking-wide">Phone Number</label>
                <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 98765 43210" className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground/70 mb-1.5 tracking-wide">College Name</label>
                <input type="text" value={form.college} onChange={e => set('college', e.target.value)} placeholder="Your college / university name" className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground/70 mb-1.5 tracking-wide">Course / Branch</label>
                  <input type="text" value={form.course} onChange={e => set('course', e.target.value)} placeholder="B.Tech CSE" className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground/70 mb-1.5 tracking-wide">Graduation Year</label>
                  <select value={form.gradYear} onChange={e => set('gradYear', e.target.value)} className={inputClass}>
                    <option value="">Year</option>
                    {GRAD_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button onClick={() => setStep(0)} className="flex-1 py-3 rounded-xl text-sm font-bold border border-border/50 text-foreground/70 hover:border-primary/40 hover:text-foreground transition-all duration-300">
                  ← Back
                </button>
                <button onClick={nextStep} className="flex-[2] py-3 rounded-xl text-sm font-bold text-[#0B1640] tracking-wide transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_24px_rgba(225,120,0,0.45)]" style={{ background: 'linear-gradient(135deg, #ff8c00 0%, #ff5500 100%)' }}>
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* ─── Step 2: Interests ─── */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <p className="text-xs font-semibold text-foreground/70 tracking-wide mb-3">I'm interested in <span className="text-primary">(select all that apply)</span></p>
                <div className="grid grid-cols-2 gap-3">
                  {INTERESTS.map(item => {
                    const active = form.interests.includes(item.id)
                    return (
                      <button
                        key={item.id}
                        onClick={() => toggleInterest(item.id)}
                        className={`py-3 px-4 rounded-xl text-sm font-semibold border transition-all duration-200 text-left ${
                          active
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border/50 bg-card text-foreground/60 hover:border-primary/30 hover:text-foreground/80'
                        }`}
                      >
                        <span className="mr-2">{active ? '✓' : '+'}</span>{item.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl text-sm font-bold border border-border/50 text-foreground/70 hover:border-primary/40 hover:text-foreground transition-all duration-300">
                  ← Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-[2] py-3 rounded-xl text-sm font-bold text-[#0B1640] tracking-wide transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_24px_rgba(225,120,0,0.45)] disabled:opacity-60 disabled:scale-100"
                  style={{ background: 'linear-gradient(135deg, #ff8c00 0%, #ff5500 100%)' }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      Creating account…
                    </span>
                  ) : 'Join ONROL →'}
                </button>
              </div>
            </div>
          )}

          <p className="text-center text-sm font-body text-muted-foreground mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-semibold hover:underline">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}

