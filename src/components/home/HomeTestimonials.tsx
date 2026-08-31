import { Quote, Star } from "lucide-react";
import { Label } from "@/components/system/grid";
import { homeData } from "@/lib/homeData";

/** Learner testimonials — disciplined hairline grid (cells share borders). */
const HomeTestimonials = () => {
  const items = homeData.testimonials.items;
  return (
    <section id="testimonials" className="onrol-lazy-section border-b border-black/10 bg-white text-[#0A0A0A]">
      <div className="border-b border-black/10 px-6 py-9 md:px-10 md:py-12">
        <Label>From learners</Label>
        <h2 className="mt-3 max-w-2xl font-extrabold leading-[1.04] tracking-[-0.02em]" style={{ fontSize: "clamp(28px, 4vw, 46px)" }}>
          {homeData.testimonials.title}
        </h2>
      </div>

      <div className="grid sm:grid-cols-2 md:grid-cols-3">
        {items.map((item) => {
          const photo = (item as { photo?: string }).photo;
          return (
            <article key={item.name} className="relative flex flex-col border-b border-r border-black/10 p-6 md:p-8">
              <Quote aria-hidden className="absolute right-5 top-5 h-7 w-7 text-[#f46718]/15" />
              <div className="flex gap-0.5 text-[#f46718]">
                {[0, 1, 2, 3, 4].map((i) => <Star key={i} className="h-3.5 w-3.5 fill-current" />)}
              </div>
              <p className="mt-4 flex-1 text-[14.5px] leading-relaxed text-black/70">&ldquo;{item.quote}&rdquo;</p>
              <div className="mt-6 flex items-center gap-3">
                {photo ? (
                  <img src={photo} alt={`${item.name} headshot`} loading="lazy" width={44} height={44} className="h-11 w-11 shrink-0 rounded-full object-cover" />
                ) : (
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#f46718] text-[14px] font-black text-[#0A0A0A]">{item.name[0]}</div>
                )}
                <div className="min-w-0">
                  <p className="text-[14px] font-bold text-[#0A0A0A]">{item.name}</p>
                  <p className="text-[12px] text-black/60">{item.background}</p>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <p className="border-t border-black/10 px-6 py-5 text-[12px] text-black/55 md:px-10">
        Quotes shown represent past learner outcomes. Illustrative headshots are used until verified alumni photos roll in.
      </p>
    </section>
  );
};

export default HomeTestimonials;
