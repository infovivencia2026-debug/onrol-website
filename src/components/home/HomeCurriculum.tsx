import { motion } from "framer-motion";
import { ArrowRight, Check, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { CURRICULUM_MODULES } from "@/lib/curriculumModules";
import { Label } from "@/components/system/grid";

export default function HomeCurriculum() {
  return (
    <section id="curriculum" className="onrol-lazy-section border-b border-black/10 bg-[#0b0b0b] text-white">
      <div className="grid border-b border-white/12 lg:grid-cols-[1.05fr_.95fr]">
        <div className="px-6 py-10 md:px-10 md:py-14 lg:border-r lg:border-white/12">
          <Label>Inside the cohort</Label>
          <h2 className="mt-4 max-w-3xl text-balance font-extrabold leading-[.98] tracking-[-0.045em]" style={{ fontSize: "clamp(36px, 5.8vw, 72px)" }}>
            Every week ends with something <span className="text-[#ff7a2f]">real.</span>
          </h2>
        </div>
        <div className="flex flex-col justify-end px-6 py-9 md:px-10 md:py-12">
          <p className="max-w-xl text-[15px] leading-relaxed text-white/65 md:text-base">
            Learn the tool, apply it with a practitioner, then turn it into portfolio proof. No passive certificate collecting.
          </p>
          <div className="mt-5 flex w-fit items-center gap-2 border border-white/15 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-white/65">
            <Clock className="h-3.5 w-3.5 text-[#f46718]" /> Live learning + guided building
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-5">
        {CURRICULUM_MODULES.map((mod, i) => (
          <motion.article
            key={mod.day}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.45, delay: i * 0.05 }}
            className="group flex min-h-[330px] flex-col border-b border-white/12 p-6 transition hover:bg-white/[0.045] sm:border-r lg:min-h-[390px] lg:p-7"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-[0.22em] text-[#f46718]">Day {mod.day}</span>
              <span className="text-[11px] font-bold text-white/35">0{mod.day}</span>
            </div>
            <h3 className="mt-7 text-[20px] font-extrabold leading-tight tracking-[-0.025em]">{mod.title}</h3>
            <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#ff9a62]">{mod.tag}</p>
            <ul className="mt-6 space-y-3 text-[13px] leading-relaxed text-white/60">
              {mod.details.slice(0, 3).map((detail) => (
                <li key={detail} className="flex items-start gap-2.5">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#f46718]" />
                  <span>{detail}</span>
                </li>
              ))}
            </ul>
            <div className="mt-auto border-t border-white/12 pt-5 text-[12px] leading-relaxed text-white/55">
              <strong className="block text-[10px] uppercase tracking-[0.16em] text-white/35">You ship</strong>
              <span className="mt-1.5 block text-white/75">{mod.output}</span>
            </div>
          </motion.article>
        ))}
      </div>

      <div className="flex flex-col gap-5 border-t border-white/12 px-6 py-7 sm:flex-row sm:items-center sm:justify-between md:px-10">
        <p className="text-[13px] text-white/55">Your portfolio grows while you learn.</p>
        <Link to="/programs/" className="group inline-flex min-h-11 items-center justify-center gap-2 bg-[#f46718] px-5 text-[12px] font-extrabold uppercase tracking-[0.15em] text-black transition hover:bg-[#ff8442]">
          See the full program <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </section>
  );
}
