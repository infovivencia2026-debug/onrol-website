// HomePersonas — "Who is this for" — disciplined checkerboard grid (logo motif).
import { ArrowRight, Briefcase, Building2, GraduationCap, Home, Megaphone, PenTool, Rocket, School, UserCheck, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { PERSONAS } from "@/lib/personas";
import { Frame, Label } from "@/components/system/grid";

const PERSONA_ICONS = [GraduationCap, School, Briefcase, Rocket, Megaphone, Home, UserCheck, Users, PenTool, Building2, Users, Briefcase];

type Persona = (typeof PERSONAS)[number];

function PersonaTile({ persona, idx, light }: { persona: Persona; idx: number; light: boolean }) {
  const Icon = PERSONA_ICONS[idx % PERSONA_ICONS.length];
  return (
    <Link
      to="/programs/"
      className={`group flex min-h-[176px] flex-col border-b border-r border-black/10 p-4 transition sm:min-h-[210px] sm:p-5 lg:min-h-[230px] ${light ? "bg-white hover:bg-black/[0.03]" : "bg-[#ECEAE4] hover:bg-[#E4E1D9]"}`}
    >
      <div className="flex items-center justify-between">
        <span className="grid h-10 w-10 place-items-center border border-black/15 text-[#0A0A0A] sm:h-11 sm:w-11">
          <Icon className="h-5 w-5" strokeWidth={2} />
        </span>
        <span className="text-[11px] font-black uppercase tracking-[0.18em] text-[#f46718]">{String(idx + 1).padStart(2, "0")}</span>
      </div>
      <h3 className="mt-4 text-[15px] font-extrabold leading-snug tracking-[-0.01em] text-[#0A0A0A] sm:text-[15.5px]">{persona.title}</h3>
      <p className="mt-2 line-clamp-2 text-[12.5px] leading-relaxed text-black/60 sm:line-clamp-3">{persona.projectsAtOnrol}</p>
      <div className="mt-auto inline-flex items-center gap-1.5 pt-4 text-[11px] font-bold uppercase tracking-[0.16em] text-[#0A0A0A] transition-all group-hover:gap-2.5">
        Register now <ArrowRight className="h-3.5 w-3.5 text-[#f46718]" />
      </div>
    </Link>
  );
}

const HomePersonas = () => {
  return (
    <section id="who-is-this-for" className="onrol-lazy-section border-b border-black/10 bg-[#F6F5F2] text-[#0A0A0A]">
      <Frame>
        {/* Header */}
        <div className="border-b border-black/10 px-6 py-9 md:px-10 md:py-12">
          <Label>Who is this for</Label>
          <h2 className="mt-3 max-w-2xl font-extrabold leading-[1.04] tracking-[-0.02em]" style={{ fontSize: "clamp(28px, 4vw, 46px)" }}>
            ONROL fits {PERSONAS.length} kinds of Indians.
          </h2>
          <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-black/70">
            Not just &ldquo;aspiring data scientists.&rdquo; ONROL builds engineers, students, teachers, founders, sales pros, real-estate agents, working professionals, job-seekers, freelancers, content creators, SMB owners, and women returning to work &mdash; each with their own project track and mentors.
          </p>
          <div className="mt-6 flex max-w-md border border-black/10 text-center">
            {[["12", "personas"], ["3", "projects"], ["30", "days"]].map(([v, l], i) => (
              <div key={l} className={`flex-1 px-4 py-3 ${i < 2 ? "border-r border-black/10" : ""}`}>
                <div className="text-[22px] font-black tracking-[-0.02em] text-[#0A0A0A]">{v}</div>
                <div className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-black/55">{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile / tablet: 2-col true checker */}
        <div className="grid grid-cols-2 lg:hidden">
          {PERSONAS.map((p, i) => (
            <PersonaTile key={p.slug} persona={p} idx={i} light={(Math.floor(i / 2) + (i % 2)) % 2 === 0} />
          ))}
        </div>
        {/* Desktop: 4-col true checker */}
        <div className="hidden grid-cols-4 lg:grid">
          {PERSONAS.map((p, i) => (
            <PersonaTile key={p.slug} persona={p} idx={i} light={(Math.floor(i / 4) + (i % 4)) % 2 === 0} />
          ))}
        </div>

        <p className="border-t border-black/10 px-6 py-5 text-[12.5px] text-black/55 md:px-10">
          Persona-specific landing pages with full AI use-cases per industry are coming soon (engineers, real-estate, sales/marketing, teachers, founders, and more).
        </p>
      </Frame>
    </section>
  );
};

export default HomePersonas;
