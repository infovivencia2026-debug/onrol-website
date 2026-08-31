import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Shell } from "@/components/system/grid";
import { homeData } from "@/lib/homeData";

/**
 * "Why ONROL" — disciplined hairline-grid prototype (orange / white / black).
 * Apple/Linear/Swiss aesthetic: 1px hairline borders, sharp corners, shared
 * cell edges, corner "+" crosshairs, plain ALL-CAPS labels. The ONROL
 * difference is shown THROUGH the two programs — what you actually ship.
 * Orange (#f46718) is used only for the one CTA per cell + tiny "+" markers.
 */
const HomeDifferenceTable = () => {
  const [gen, arch] = homeData.programsPreview.cards; // AI Generalist, AI Architect
  const callout = homeData.comparison.callout;
  const guarantees = [
    "1-year ONROL Community",
    "Practitioner mentors",
    "Real shipped projects",
    "No coding prerequisites",
  ];
  const programName = (t: string) => t.replace(" Program", "");
  const slash = (h: string) => (h.endsWith("/") ? h : `${h}/`);

  return (
    <section id="difference" className="onrol-lazy-section border-b border-black/10 bg-[#F6F5F2] text-[#0A0A0A]">
        {/* Framed hairline grid — the "outer lines" */}
        <div className="relative border border-black/10">
          {/* corner crosshairs (Apple/Linear detail) */}
          {["-left-[7px] -top-[7px]", "-right-[7px] -top-[7px]", "-bottom-[7px] -left-[7px]", "-bottom-[7px] -right-[7px]"].map((pos) => (
            <span key={pos} aria-hidden className={`pointer-events-none absolute ${pos} select-none text-[14px] leading-none text-black/30`}>+</span>
          ))}

          {/* Header cell */}
          <div className="border-b border-black/10 px-6 py-9 md:px-10 md:py-12">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#f46718]">Two paths &middot; one execution school</p>
            <h2 className="mt-3 max-w-2xl font-extrabold leading-[1.05] tracking-[-0.02em]" style={{ fontSize: "clamp(28px, 4vw, 46px)" }}>
              Start as a builder. Grow into an architect.
            </h2>
            <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-black/70">
              Pick the path that matches where you are &mdash; ship your first AI products in 3 months, or master full-stack AI systems over 6 months. The ONROL difference isn&apos;t lectures; it&apos;s what you walk away with: deployed, real products you own.
            </p>
          </div>

          {/* Two program cells sharing a 1px border */}
          <div className="grid md:grid-cols-2">
            {[gen, arch].map((p, i) => (
              <div
                key={p.title}
                className={`px-6 py-8 md:px-10 md:py-10 ${i === 0 ? "border-b border-black/10 md:border-b-0 md:border-r" : ""}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[12px] font-bold uppercase tracking-[0.2em] text-black/65">{programName(p.title)}</p>
                  <span className="border border-black/15 px-2 py-[3px] text-[10px] font-bold uppercase tracking-[0.12em] text-black/65">{p.duration}</span>
                </div>
                <p className="mt-3 text-[14px] font-semibold text-[#0A0A0A]">{p.subtitle}</p>
                <p className="mt-3 text-[13.5px] leading-relaxed text-black/65">{p.description}</p>

                <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.2em] text-black/60">You ship</p>
                <ul className="mt-3 space-y-2.5">
                  {p.outputs.map((o) => (
                    <li key={o} className="flex items-start gap-2.5 text-[14px] leading-snug text-[#0A0A0A]">
                      <span aria-hidden className="mt-[1px] font-black leading-none text-[#f46718]">+</span>
                      <span>{o}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  to={slash(p.cta.href)}
                  className="mt-7 inline-flex min-h-[44px] items-center gap-2 bg-[#f46718] px-5 text-[13px] font-medium uppercase tracking-wide text-[#0A0A0A] transition hover:bg-[#ff7f33] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f46718]"
                >
                  Register for {programName(p.title)} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>

          {/* Shared "the difference" band — both programs guarantee these */}
          <div className="border-t border-black/10 px-6 py-5 md:px-10">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-black/60">Every ONROL program</span>
              {guarantees.map((g) => (
                <span key={g} className="flex items-center gap-1.5 text-[13px] font-semibold text-[#0A0A0A]">
                  <span aria-hidden className="font-black text-[#f46718]">+</span>
                  {g}
                </span>
              ))}
            </div>
          </div>
        </div>

        <p className="mt-5 text-[12px] font-bold uppercase tracking-[0.18em] text-black/60">{callout}</p>
    </section>
  );
};

export default HomeDifferenceTable;
