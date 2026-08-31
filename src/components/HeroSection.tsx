import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import heroVideo from "@/assets/hero-video.mp4";
import heroWorldMap from "@/assets/hero-world-map.jpg";
import { Volume2, VolumeX } from "lucide-react";

const stats = [
  { value: "3-Month", label: "AI Generalist Program" },
  { value: "3", label: "Specialization Tracks" },
  { value: "4", label: "Income Pathways" },
  { value: "ONROL Community", label: "Builder Community" },
];

const tickerItems = [
  "AI Automation Engineer",
  "Forward Deployed Engineer",
  "AI Product Manager",
  "Freelancing",
  "Agency Building",
  "AI Startup",
  "High-Paying Jobs",
  "Portfolio-First Learning",
  "Live Projects",
  "Real-World Execution",
];

const HeroSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasUserInteractedRef = useRef(false);
  const [muted, setMuted] = useState(false);
  const [showTapHint, setShowTapHint] = useState(true);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "12%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  // Start video with sound on first tap/click anywhere.
  useEffect(() => {
    hasUserInteractedRef.current = false;
    const v = videoRef.current;
    if (!v) return undefined;

    v.defaultMuted = false;
    v.muted = false;
    v.volume = 1;
    setMuted(false);

    let unlocked = false;
    let starting = false;

    const cleanup = () => {
      window.removeEventListener("pointerdown", onTapAnywhere);
      window.removeEventListener("touchend", onTapAnywhere);
      window.removeEventListener("click", onTapAnywhere);
    };

    const attemptStart = () => {
      if (unlocked || starting) return;
      starting = true;

      hasUserInteractedRef.current = true;
      v.defaultMuted = false;
      v.muted = false;
      v.volume = 1;
      setMuted(false);
      if (v.ended) v.currentTime = 0;

      const playAttempt = v.play();
      if (!playAttempt) {
        setShowTapHint(false);
        unlocked = true;
        cleanup();
        starting = false;
        return;
      }

      playAttempt
        .then(() => {
          v.defaultMuted = false;
          v.muted = false;
          v.volume = 1;
          setMuted(false);
          setShowTapHint(false);
          unlocked = true;
          cleanup();
        })
        .catch(() => {
          // Keep listeners active and retry on next tap/click.
        })
        .finally(() => {
          starting = false;
        });
    };

    const onTapAnywhere = () => {
      attemptStart();
    };

    window.addEventListener("pointerdown", onTapAnywhere, { passive: true });
    window.addEventListener("touchend", onTapAnywhere, { passive: true });
    window.addEventListener("click", onTapAnywhere, { passive: true });

    return () => {
      cleanup();
    };
  }, []);

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    hasUserInteractedRef.current = true;
    setShowTapHint(false);
    v.muted = !v.muted;
    setMuted(v.muted);

    // After user gesture, browser allows play with audio if unmuted.
    if (!v.muted) {
      v.play().catch(() => {});
    }
  };

  return (
    <section
      id="home"
      ref={containerRef}
      className="relative flex flex-col overflow-hidden h-[min(100vh,720px)] md:h-screen"
    >
      {/* Background Layer Group - World Map + Video */}
      <div className="absolute inset-0 overflow-hidden">
        {/* World Map Background - Responsive for all devices */}
        <div
          className="absolute inset-0 w-full h-full"
          style={{
            backgroundImage: `url(${heroWorldMap})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        />

        {/* Dark overlay for world map to ensure text readability */}
        <div className="absolute inset-0 bg-black/60" />
      </div>

      {/* Full-cover video — sits directly in the absolute container, no transform */}
      <video
        ref={videoRef}
        src={heroVideo}
        muted={muted}
        loop={false}
        preload="metadata"
        playsInline
        className="absolute inset-0 w-full h-full object-cover object-[65%_center] sm:object-center scale-110 opacity-50"
      />

      {/* Parallax overlay layers */}
      <motion.div className="absolute inset-0" style={{ y: bgY }}>
        {/* Multi-layer veil */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        {/* Top glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-transparent to-transparent" />
      </motion.div>

      {/* Mute / Unmute toggle */}
      <button
        type="button"
        onClick={toggleMute}
        className="absolute top-24 right-6 z-[70] pointer-events-auto flex items-center gap-2 px-3 py-2 rounded-full bg-black/40 border border-white/20 text-white/70 hover:text-white hover:bg-black/60 backdrop-blur-sm transition-all duration-200 text-xs font-medium"
        aria-label={muted ? "Unmute video" : "Mute video"}
      >
        {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        {muted ? "Unmute" : "Mute"}
      </button>

      {showTapHint && (
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 z-[70] pointer-events-none flex items-center justify-center"
        >
          <div className="relative h-14 w-14 rounded-full border border-cyan-100/40 bg-cyan-300/20 backdrop-blur-md shadow-[0_8px_30px_rgba(34,211,238,0.28)] flex items-center justify-center">
            <span className="absolute inset-0 rounded-full border border-cyan-100/40 animate-ping" />
            <span className="absolute inset-1 rounded-full border border-cyan-50/40" />
            <span className="text-[9px] font-bold tracking-[0.08em] uppercase text-orange-100/95 text-center leading-tight">Tap Here</span>
          </div>
        </motion.div>
      )}

      {/* Floating orbs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 orb bg-primary/10 float-slow" />
      <div className="absolute top-1/2 right-1/3 w-48 h-48 orb bg-primary/8 float-medium" />
      <div className="absolute bottom-1/3 left-1/3 w-32 h-32 orb bg-orange-300/10 float-fast" />

      {/* Content */}
      <motion.div
        style={{ y: contentY, opacity }}
        className="relative z-10 flex flex-col items-start justify-center flex-1 w-full px-6 sm:px-10 md:px-16 lg:px-24 xl:px-32 pt-[12vh] pb-4 max-w-full lg:max-w-[60rem] xl:max-w-[68rem] 2xl:max-w-[80rem]"
      >
        {/* Live badge */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="mb-5"
        >
          <span className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-white/20 bg-black/30 text-white/75 text-[10px] sm:text-[11px] font-bold tracking-[0.22em] uppercase backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white/40 opacity-50" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white/70" />
            </span>
            India's FIRST AI Talent-to-Income Engine
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 48 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="text-[2.1rem] sm:text-5xl md:text-6xl lg:text-[3.6rem] xl:text-[4.2rem] 2xl:text-[5.5rem] font-display font-bold leading-[1.07] tracking-tight mb-4 drop-shadow-[0_4px_32px_rgba(0,0,0,0.95)] text-white"
        >
          Stop Using AI.
          <br />
          <span className="text-gradient-animated drop-shadow-[0_0_60px_rgba(255,140,0,0.45)] filter brightness-110">
            Start Owning It.
          </span>
        </motion.h1>

        {/* Sub-headline */}
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="text-base sm:text-lg md:text-xl lg:text-lg text-white/70 max-w-md mb-6 md:mb-8 font-body font-light leading-relaxed drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]"
        >
          ONROL transforms your AI skills into income, real projects, and a
          career that no one can take from you.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, scale: 0.93 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto mb-6 md:mb-8"
        >
          <a
            href="#apply"
            className="group relative px-8 md:px-9 py-3.5 rounded-xl overflow-hidden font-bold text-sm md:text-base text-white text-center transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_20px_60px_-10px_rgba(70,70,70,0.55)]"
            style={{ background: "linear-gradient(145deg, hsl(var(--cta-button-from)) 0%, hsl(var(--cta-button-to)) 100%)" }}
          >
            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/15 transition-colors duration-300 rounded-xl" />
            <span className="absolute inset-x-0 top-0 h-px bg-white/30 rounded-t-xl" />
            <span className="relative z-10 flex items-center justify-center gap-2">
              Begin Your Journey
              <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
            </span>
          </a>
          <a
            href="#about"
            className="px-8 md:px-9 py-3.5 rounded-xl border border-white/20 bg-white/5 text-white font-bold text-sm md:text-base transition-all duration-300 hover:bg-white/10 hover:border-white/35 hover:scale-[1.03] backdrop-blur-sm text-center"
          >
            See How It Works
          </a>
        </motion.div>

        {/* Divider */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.8, delay: 0.85, ease: [0.22, 1, 0.36, 1] }}
          className="w-16 h-[1px] bg-primary/50 mb-5 origin-left"
        />

        {/* Tags */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.95 }}
          className="flex flex-wrap gap-2"
        >
          {["3-Month AI Generalist Program", "Live Projects", "Elite Career Paths", "Portfolio-First", "ONROL Community"].map((tag) => (
            <span
              key={tag}
              className="px-3.5 py-1.5 rounded-full border border-white/12 bg-white/5 text-[11px] sm:text-xs text-white/55 font-body backdrop-blur-sm hover:border-primary/35 hover:text-white/80 transition-colors duration-300 cursor-default"
            >
              {tag}
            </span>
          ))}
        </motion.div>
      </motion.div>

      {/* Stats row */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 1.1, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full border-t border-white/10 bg-black/50 backdrop-blur-md shrink-0"
      >
        <div className="container mx-auto px-6 py-2 md:py-4 grid grid-cols-2 sm:grid-cols-4 divide-x divide-white/10">
          {stats.map((s, i) => (
            <div key={i} className="flex flex-col items-center py-2 px-4 gap-0.5">
              <span className="text-lg sm:text-2xl font-display font-bold text-white stat-number">{s.value}</span>
              <span className="text-[10px] sm:text-xs text-white/45 uppercase tracking-[0.18em] font-body text-center">{s.label}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Ticker tape */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.3 }}
        className="relative z-10 w-full bg-primary/10 border-t border-primary/20 py-2 overflow-hidden shrink-0"
      >
        <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-background/80 to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-background/80 to-transparent z-10 pointer-events-none" />
        <div className="ticker-wrap">
          <div className="ticker-track">
            {[...tickerItems, ...tickerItems].map((item, i) => (
              <span key={i} className="inline-flex items-center gap-3 mx-6 text-[11px] font-bold uppercase tracking-[0.22em] text-primary/80 whitespace-nowrap">
                <span className="h-1 w-1 rounded-full bg-primary/60" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
