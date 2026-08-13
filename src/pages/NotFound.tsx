import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { ArrowRight, Home, Search, Sparkles, Users } from "lucide-react";
import Container from "@/components/shared/Container";
import SEO from "@/components/seo/SEO";

const INTER_STACK = `"Fira Sans", Figtree, system-ui, -apple-system, "Segoe UI", sans-serif`;

const SUGGESTIONS = [
  { to: "/", label: "Homepage", description: "Start over from the beginning", icon: Home },
  { to: "/programs/", label: "Programs", description: "AI Generalist + AI Architect", icon: Sparkles },
  { to: "/community/", label: "Community", description: "Daily AI updates by category", icon: Users },
  { to: "/blog/", label: "Blog", description: "Long-form guides + AI playbooks", icon: Search },
];

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.warn("[404]", location.pathname);
  }, [location.pathname]);

  return (
    <main
      className="min-h-screen bg-[#f3f5f8] pt-28 text-white"
      style={{ fontFamily: INTER_STACK }}
    >
      <SEO
        title="Page not found — ONROL"
        description="That URL doesn't exist on ONROL. Browse programs, community, blog, or jump back to the homepage."
        path={location.pathname}
        noindex
      />
      <section className="relative overflow-hidden pb-16 pt-10 md:pb-24 md:pt-16">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[radial-gradient(70%_50%_at_18%_15%,rgba(255,107,71,0.18),transparent_60%),radial-gradient(55%_40%_at_85%_25%,rgba(56,189,248,0.10),transparent_65%),linear-gradient(180deg,#f3f5f8,#f3f5f8_55%,#2d2d2d)]"
        />
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <p
              className="text-orange-300"
              style={{
                fontSize: "clamp(80px, 14vw, 140px)",
                fontWeight: 800,
                letterSpacing: "-0.06em",
                lineHeight: 1,
              }}
            >
              404
            </p>
            <h1
              className="mt-2 text-white"
              style={{
                fontSize: "clamp(28px, 4.4vw, 44px)",
                fontWeight: 800,
                letterSpacing: "-0.025em",
                lineHeight: 1.1,
              }}
            >
              That page isn't here.
            </h1>
            <p className="mx-auto mt-4 max-w-lg text-[15px] leading-relaxed text-slate-300 md:text-[16px]">
              The URL <code className="rounded bg-white/8 px-1.5 py-0.5 text-[13px] text-orange-200">{location.pathname}</code> doesn't exist on ONROL.
              Either it moved, it was renamed, or you typed it wrong. Try one of these instead.
            </p>

            <div className="mt-10 grid gap-3 sm:grid-cols-2">
              {SUGGESTIONS.map(({ to, label, description, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className="group flex items-center gap-3 rounded-2xl border border-white/12 bg-[#3f3f3f] p-5 text-left transition hover:-translate-y-0.5 hover:border-orange-300/40"
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-orange-500/15 text-orange-300">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      className="text-white"
                      style={{ fontSize: "15px", fontWeight: 700, letterSpacing: "-0.005em" }}
                    >
                      {label}
                    </p>
                    <p className="mt-0.5 text-[12.5px] text-slate-400">{description}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-1 group-hover:text-orange-300" />
                </Link>
              ))}
            </div>

            <div className="mt-10">
              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-400 px-6 py-3 text-[13.5px] font-bold uppercase tracking-wider text-white shadow-[0_14px_28px_-12px_rgba(255,107,71,0.55)] transition hover:brightness-110"
              >
                <Home className="h-4 w-4" />
                Back to homepage
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
};

export default NotFound;
