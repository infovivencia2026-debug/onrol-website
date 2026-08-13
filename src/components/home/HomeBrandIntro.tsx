import { Fragment } from "react";
import { ArrowRight, Bot, Code2, GraduationCap, Rocket, Wallet, Workflow, Zap } from "lucide-react";
import { Frame, Label, Tick, OrangeButton } from "@/components/system/grid";

const skills = [
  { title: "AI Automations", desc: "Automate workflows, lead routing, research, follow-ups, and daily operations.", Icon: Zap },
  { title: "AI Agents", desc: "Build tool-using agents that reason, call APIs, and complete multi-step tasks.", Icon: Bot },
  { title: "Vibe-Coded Websites", desc: "Ship polished pages and apps with AI-assisted coding, deployment, and iteration.", Icon: Code2 },
];

const steps = ["Prompt", "Automate", "Deploy"];

const journey = [
  { label: "Learn", desc: "Master AI tools", Icon: GraduationCap },
  { label: "Build", desc: "Create real projects", Icon: Workflow },
  { label: "Launch", desc: "Ship to the web", Icon: Rocket },
  { label: "Earn", desc: "Monetize your skills", Icon: Wallet },
];

/** What you'll build (white) + Execution OS highlight + Your journey timeline (tint). */
const HomeBrandIntro = () => {
  return (
    <>
      {/* ── What you'll build (white) ─────────────────────────────── */}
      <section id="about" className="onrol-lazy-section border-b border-black/10 bg-white text-[#0A0A0A]">
        <Frame>
          <div className="border-b border-black/10 px-6 py-9 md:px-10 md:py-12">
            <Label>What you&apos;ll build</Label>
            <h2 className="mt-3 max-w-2xl font-extrabold leading-[1.04] tracking-[-0.02em]" style={{ fontSize: "clamp(28px, 4vw, 46px)" }}>
              Build in-demand AI skills.
            </h2>
            <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-black/70">
              ONROL is built around execution: learn the tool, build the system, ship the result.
            </p>
          </div>

          {/* 3 skill cells — orange icon tiles to lift them off the page */}
          <div className="grid md:grid-cols-3">
            {skills.map((s, i) => (
              <div key={s.title} className={`px-6 py-8 md:px-8 md:py-10 ${i < 2 ? "border-b border-black/10 md:border-b-0 md:border-r" : ""}`}>
                <span className="grid h-12 w-12 place-items-center bg-[#f46718] text-[#0A0A0A]">
                  <s.Icon className="h-6 w-6" strokeWidth={2.2} />
                </span>
                <h3 className="mt-5 text-[19px] font-extrabold tracking-[-0.01em]">{s.title}</h3>
                <p className="mt-2.5 text-[14px] leading-relaxed text-black/65">{s.desc}</p>
              </div>
            ))}
          </div>

          {/* Execution OS — highlighted orange band (the centerpiece) */}
          <div className="border-t border-black/10 bg-[#FFF4EA] px-6 py-9 md:px-10 md:py-11">
            <div className="flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
              <div className="max-w-md">
                <Label>The Execution OS</Label>
                <h3 className="mt-3 text-[22px] font-extrabold leading-tight tracking-[-0.02em] md:text-[28px]">
                  Learn the tool. Build the workflow. Ship the proof.
                </h3>
              </div>
              {/* Prompt → Automate → Deploy flow */}
              <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-2.5">
                {steps.map((step, i) => (
                  <Fragment key={step}>
                    <div className="border border-black/10 bg-white px-3 py-3 text-center sm:min-w-[112px] sm:px-5 sm:py-3.5 sm:text-left">
                      <span className="text-[12px] font-black text-[#f46718]">0{i + 1}</span>
                      <p className="mt-0.5 text-[15px] font-extrabold">{step}</p>
                    </div>
                    {i < steps.length - 1 ? <ArrowRight className="hidden h-5 w-5 shrink-0 text-[#f46718] sm:block" /> : null}
                  </Fragment>
                ))}
              </div>
            </div>

            {/* Outcome focus — inline chips */}
            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-black/10 pt-6">
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-black/55">Outcome focus</span>
              {["No passive watching", "Daily build decisions", "Portfolio-ready outputs"].map((item) => (
                <span key={item} className="flex items-center gap-1.5 text-[13.5px] font-semibold text-[#0A0A0A]">
                  <Tick />{item}
                </span>
              ))}
            </div>
          </div>
        </Frame>
      </section>

      {/* ── Your journey (tint band → distinct from the white block above) ── */}
      <section id="journey" className="onrol-lazy-section border-b border-black/10 bg-[#F6F5F2] text-[#0A0A0A]">
        <Frame>
          <div className="flex flex-col gap-4 border-b border-black/10 px-6 py-8 md:flex-row md:items-end md:justify-between md:px-10">
            <div>
              <Label>Your journey</Label>
              <h2 className="mt-2 text-[26px] font-extrabold tracking-[-0.02em] md:text-[38px]">From learning to execution to impact.</h2>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-4">
            {journey.map((j, i) => (
              <div
                key={j.label}
                className="relative border-b border-black/10 px-6 py-8 sm:[&:nth-child(odd)]:border-r md:border-r md:py-10 md:px-8 md:[&:nth-child(4)]:border-r-0"
              >
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#f46718] text-[13px] font-black text-[#0A0A0A]">{i + 1}</span>
                  <span className="grid h-10 w-10 place-items-center border border-black/15 text-[#0A0A0A]">
                    <j.Icon className="h-5 w-5" strokeWidth={2} />
                  </span>
                </div>
                <p className="mt-4 text-[17px] font-extrabold tracking-[-0.01em]">{j.label}</p>
                <p className="mt-1 text-[12.5px] text-black/60">{j.desc}</p>
              </div>
            ))}
          </div>
        </Frame>
      </section>
    </>
  );
};

export default HomeBrandIntro;
