import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import Container from "@/components/shared/Container";
import SEO from "@/components/seo/SEO";
import BreadcrumbTrail from "@/components/seo/BreadcrumbTrail";
import { blogPosts } from "@/lib/blogContent";
import { breadcrumbJsonLd } from "@/lib/structuredData";

const INTER_STACK = `"Fira Sans", Figtree, system-ui, -apple-system, "Segoe UI", sans-serif`;

export default function BlogIndex() {
  const [filter, setFilter] = useState<string>("All");
  const categories = useMemo(() => {
    const cats = Array.from(new Set(blogPosts.map((p) => p.category)));
    return ["All", ...cats];
  }, []);
  const visible = useMemo(
    () => (filter === "All" ? blogPosts : blogPosts.filter((p) => p.category === filter)),
    [filter],
  );

  return (
    <main
      className="bg-white pt-24 text-[#0A0A0A] md:pt-28"
      style={{ fontFamily: INTER_STACK }}
    >
      <SEO
        title="ONROL Blog — Practical AI guides for India"
        description="The ONROL blog: practical AI playbooks for students, working professionals, freelancers, business owners, content creators, and teachers in India."
        path="/blog/"
        image="https://onrol.in/og/blog.png"
        jsonLd={breadcrumbJsonLd([
          { name: "Home", href: "/" },
          { name: "Blog", href: "/blog/" },
        ])}
      />
      <section className="relative bg-white py-12 md:py-16">
        <div aria-hidden className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-orange-500 via-violet-400 to-pink-500" />
        <Container>
          <BreadcrumbTrail crumbs={[{ name: "Blog", href: "/blog/" }]} variant="dark" />
          <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.3em] text-orange-600">— ONROL Blog</p>
          <h1
            className="mt-3 max-w-4xl text-[#0A0A0A]"
            style={{
              fontSize: "clamp(38px, 6vw, 72px)",
              lineHeight: 0.98,
              letterSpacing: "-0.035em",
              fontWeight: 800,
            }}
          >
            Practical AI playbooks <span className="text-orange-400">for India.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-[#0A0A0A]/75">
            How to learn AI, earn from AI, grow with AI — written for Indian students, freelancers, working professionals, business owners, creators, and teachers.
          </p>

          <div className="mt-7 flex flex-wrap gap-2">
            {categories.map((c) => {
              const active = c === filter;
              return (
                <button
                  key={c}
                  onClick={() => setFilter(c)}
                  className={`rounded-full px-3.5 py-1.5 text-[12px] font-bold transition ${
                    active
                      ? "bg-orange-500 text-[#0A0A0A]"
                      : "border border-[#0B1640]/10 bg-white/[0.03] text-[#0A0A0A]/75 hover:border-orange-300/40 hover:bg-white/8 hover:text-[#0A0A0A]"
                  }`}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </Container>
      </section>

      <section className="bg-white py-16 md:py-24">
        <Container>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((p) => (
              <Link
                key={p.slug}
                to={`/blog/${p.slug}/`}
                className="group flex flex-col  border border-[#0B1640]/10 bg-white p-6 transition hover:-translate-y-1 hover:border-orange-300/40"
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-orange-600">{p.category}</p>
                <h2
                  className="mt-3 line-clamp-3 text-[#0A0A0A]"
                  style={{
                    fontSize: "clamp(18px, 2.4vw, 22px)",
                    lineHeight: 1.18,
                    fontWeight: 800,
                    letterSpacing: "-0.015em",
                  }}
                >
                  {p.h1}
                </h2>
                <p className="mt-3 line-clamp-3 text-[13.5px] leading-relaxed text-[#0A0A0A]/75">{p.hook}</p>
                <div className="mt-auto flex items-center justify-between pt-5 text-[11.5px] text-[#0A0A0A]/55">
                  <span>{new Date(p.publishedAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}</span>
                  <span className="inline-flex items-center gap-1 font-bold uppercase tracking-wider text-orange-600">
                    {p.readMinutes}m read <ArrowUpRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </Container>
      </section>
    </main>
  );
}
