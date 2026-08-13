import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { programsDropdownData } from "@/lib/programData";

type ProgramsDropdownProps = {
  activePath: string;
  onNavigate?: () => void;
  compact?: boolean;
};

const ProgramsDropdown = ({ activePath, onNavigate, compact = false }: ProgramsDropdownProps) => {
  return (
    <div
      className={`${
        compact ? "w-full shadow-none" : "w-[470px] shadow-[0_20px_60px_rgba(2,6,23,0.55)]"
      } rounded-2xl border border-orange-300/20 bg-[linear-gradient(140deg,rgba(10,22,40,0.98),rgba(16,33,58,0.98))] p-3`}
    >
      <div className="mb-2 flex items-center justify-between px-3 py-2">
        <p className="text-xs uppercase tracking-[0.14em] text-orange-200">Programs</p>
        <p className="text-[10px] uppercase tracking-[0.14em] text-slate-100">Execution tracks</p>
      </div>
      <div className="space-y-2">
        {programsDropdownData.map((program) => {
          const isActive = activePath === program.href;
          return (
            <Link
              key={program.slug}
              to={program.href}
              onClick={onNavigate}
              className={`group block rounded-xl border ${compact ? "p-3" : "p-4"} transition-all duration-300 ease-out-premium active:scale-[0.985] ${
                isActive
                  ? "border-orange-300/55 bg-orange-500/10"
                  : "border-white/10 bg-white/[0.03] hover:-translate-y-0.5 hover:border-orange-300/40 hover:bg-orange-500/10 hover:shadow-[0_14px_30px_rgba(2,6,23,0.35)]"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className={`${compact ? "text-base" : "text-lg"} font-display text-white`}>{program.title}</h3>
                  <p className={`${compact ? "text-xs" : "text-sm"} mt-1 leading-relaxed text-white`}>{program.description}</p>
                </div>
                <ChevronRight
                  className="mt-1 text-white transition-transform group-hover:translate-x-0.5 group-hover:text-orange-200"
                  size={16}
                />
              </div>
              <div className="mt-3 flex items-center gap-2">
                <div className="inline-flex rounded-full border border-orange-300/35 bg-orange-500/10 px-2.5 py-1 text-xs text-orange-200">
                  {program.duration}
                </div>
                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] uppercase tracking-[0.08em] text-white">
                  Cohort
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default ProgramsDropdown;
