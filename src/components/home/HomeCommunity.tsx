import { Hash, Send } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { Label } from "@/components/system/grid";

const CHAT = [
  { name: "Arjun", time: "10:32 AM", msg: "Just shipped my first n8n automation!" },
  { name: "Neha", time: "10:33 AM", msg: "Amazing! Which tools did you stack?" },
  { name: "Arjun", time: "10:34 AM", msg: "Make.com + Claude API + Notion" },
  { name: "Ravi", time: "10:35 AM", msg: "Drop the loom in #wins, I want to study it." },
];
const CHANNELS = ["resources", "ai-tools", "projects", "wins", "voice-chat"];

export default function HomeCommunity() {
  return (
    <>
      {/* Community — 2-col row: pitch | chat mockup */}
      <section id="community-join" className="onrol-lazy-section border-b border-black/10 bg-[#F6F5F2] text-[#0A0A0A]">
        <div className="grid lg:grid-cols-2 lg:items-stretch">
          {/* Left — pitch */}
          <div className="flex flex-col justify-center border-b border-black/10 px-6 py-10 md:px-10 md:py-14 lg:border-b-0 lg:border-r">
            <Label>ONROL Community</Label>
            <h2 className="mt-3 font-extrabold leading-[1.05] tracking-[-0.02em]" style={{ fontSize: "clamp(28px, 4vw, 46px)" }}>
              Join the ONROL community
            </h2>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-black/65">
              Connect with builders shipping AI products every week, share tools, get unstuck, and grow together.
            </p>
            <div className="mt-7">
              <a href="https://chat.whatsapp.com/ChxiriuqKJODmrdF9ItMvt" target="_blank" rel="noreferrer" className="inline-flex min-h-[44px] items-center gap-2 border border-black/15 bg-white px-5 text-[14px] font-bold text-[#0A0A0A] transition hover:bg-black/[0.03]">
                <FaWhatsapp className="h-4 w-4 text-emerald-600" /> Join WhatsApp
              </a>
            </div>
            <div className="mt-7 inline-flex w-fit items-center gap-3 border border-black/10 bg-white px-4 py-3">
              <div className="flex -space-x-2">
                {["#22D3EE", "#A78BFA", "#F472B6", "#FB923C"].map((c) => (
                  <span key={c} className="h-8 w-8 rounded-full border-2 border-white" style={{ background: c }} />
                ))}
              </div>
              <div>
                <p className="text-[16px] font-extrabold tracking-[-0.01em] text-[#0A0A0A]">10K+</p>
                <p className="-mt-0.5 text-[11px] uppercase tracking-[0.16em] text-black/55">Active members</p>
              </div>
            </div>
          </div>

          {/* Right — chat mockup */}
          <div className="flex items-center px-6 py-10 md:px-10 md:py-14">
            <div className="w-full overflow-hidden border border-black/10 bg-white">
              <div className="flex items-center justify-between border-b border-black/10 bg-[#FAF8F4] px-4 py-3">
                <div className="flex items-center gap-2 text-[12.5px] font-semibold text-[#0A0A0A]">
                  <span className="grid h-7 w-7 place-items-center bg-[#f46718] text-[11px] font-black text-[#0A0A0A]">O</span>
                  onrol-community
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-black/60"><Hash className="h-3 w-3" /> general</div>
              </div>
              <div className="grid grid-cols-[84px_1fr] sm:grid-cols-[110px_1fr]">
                <div className="border-r border-black/10 bg-[#FAF8F4] p-3">
                  {CHANNELS.map((ch, i) => (
                    <div key={ch} className={`mt-1 flex items-center gap-1.5 px-2 py-1.5 text-[11px] ${i === 0 ? "bg-white font-semibold text-[#0A0A0A]" : "text-black/60"}`}>
                      <Hash className="h-3 w-3" />{ch}
                    </div>
                  ))}
                </div>
                <div className="space-y-3 p-4">
                  {CHAT.map((m) => (
                    <div key={m.msg} className="flex items-start gap-2.5">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#f46718] text-[10px] font-black text-[#0A0A0A]">{m.name[0]}</span>
                      <div className="min-w-0">
                        <p className="text-[12px] font-semibold text-[#0A0A0A]">{m.name}<span className="ml-1 text-[10px] font-normal text-black/55">{m.time}</span></p>
                        <p className="text-[12.5px] leading-snug text-black/65">{m.msg}</p>
                      </div>
                    </div>
                  ))}
                  <div className="!mt-4 flex items-center gap-2 border border-black/10 bg-white px-3 py-2">
                    <span className="text-[12px] text-black/55">Type a message...</span>
                    <span className="ml-auto grid h-6 w-6 place-items-center bg-[#f46718]/20 text-[#f46718]"><Send className="h-3 w-3" /></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
