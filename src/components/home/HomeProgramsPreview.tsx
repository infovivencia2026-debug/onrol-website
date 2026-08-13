import { ArrowRight } from "lucide-react";
import { homeData } from "@/lib/homeData";
import { Frame, Label, Tick, OrangeButton, Shell } from "@/components/system/grid";

/**
 * Programs preview — disciplined hairline grid (orange/white/black).
 * Two program cells sharing a border: AI Generalist (3-month) + AI Architect
 * (6-month). "Start as a builder, grow into an architect." Built on the system
 * primitives so it matches the Why-ONROL tile + the rest of the site.
 */
const HomeProgramsPreview = () => {
  const cards = homeData.programsPreview.cards.slice(0, 2);
  const programName = (t: string) => t.replace(" Program", "");
  const slash = (h: string) => (h.endsWith("/") ? h : `${h}/`);

  return (
    <section id="programs" className="onrol-lazy-section border-b border-black/10 bg-white text-[#0A0A0A]">
        <Frame className="grid md:grid-cols-2">
          {/* Header spans both columns */}
          <div className="border-b border-black/10 px-6 py-9 md:col-span-2 md:px-10 md:py-12">
            <Label>Two paths · one execution school</Label>
            <h2 className="mt-3 max-w-2xl font-extrabold leading-[1.05] tracking-[-0.02em]" style={{ fontSize: "clamp(28px, 4vw, 46px)" }}>
              Start as a builder. Grow into an architect.
            </h2>
            <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-black/70">
              Pick the program that matches where you are &mdash; ship your first AI products in 3 months, or master full-stack AI systems over 6 months.
            </p>
          </div>

          {/* Two program cells */}
          {cards.map((card, i) => (
            <div key={card.title} className={`flex flex-col px-6 py-8 md:px-10 md:py-10 ${i === 0 ? "border-b border-black/10 md:border-b-0 md:border-r" : ""}`}>
              <div className="flex items-center justify-between gap-3">
                <p className="text-[12px] font-bold uppercase tracking-[0.2em] text-black/65">{programName(card.title)}</p>
                <span className="border border-black/15 px-2 py-[3px] text-[10px] font-bold uppercase tracking-[0.12em] text-black/65">{card.duration}</span>
              </div>
              <p className="mt-3 text-[14px] font-semibold text-[#0A0A0A]">{card.subtitle}</p>
              <p className="mt-3 text-[13.5px] leading-relaxed text-black/65">{card.description}</p>

              <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.2em] text-black/60">You ship</p>
              <ul className="mt-3 space-y-2.5">
                {card.outputs.map((output) => (
                  <li key={output} className="flex items-start gap-2.5 text-[14px] leading-snug text-[#0A0A0A]">
                    <Tick className="mt-[1px]" /><span>{output}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto pt-7">
                <OrangeButton to={slash(card.cta.href)} className="w-full sm:w-auto">
                  Register for {programName(card.title)} <ArrowRight className="h-4 w-4" />
                </OrangeButton>
              </div>
            </div>
          ))}
        </Frame>
    </section>
  );
};

export default HomeProgramsPreview;
