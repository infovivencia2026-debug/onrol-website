import { useEffect, useId } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { breadcrumbJsonLd, type Crumb } from "@/lib/structuredData";

interface BreadcrumbTrailProps {
  crumbs: Crumb[];
  variant?: "light" | "dark";
}

/**
 * Visual breadcrumb + BreadcrumbList JSON-LD. Pass an array of {name,href}
 * starting from "Home". The component prepends "Home → " automatically if
 * the first crumb isn't "/".
 */
export default function BreadcrumbTrail({ crumbs, variant = "dark" }: BreadcrumbTrailProps) {
  const id = useId();
  const trail: Crumb[] = crumbs[0]?.href === "/" ? crumbs : [{ name: "Home", href: "/" }, ...crumbs];

  useEffect(() => {
    const tag = `bc-jsonld-${id}`;
    document.head
      .querySelectorAll<HTMLScriptElement>(`script[data-bc-tag="${tag}"]`)
      .forEach((el) => el.remove());
    const s = document.createElement("script");
    s.type = "application/ld+json";
    s.dataset.bcTag = tag;
    s.text = JSON.stringify(breadcrumbJsonLd(trail));
    document.head.appendChild(s);
    return () => {
      document.head
        .querySelectorAll<HTMLScriptElement>(`script[data-bc-tag="${tag}"]`)
        .forEach((el) => el.remove());
    };
  }, [id, trail]);

  // The public site is light-themed, so breadcrumbs render dark navy text on
  // both variants. `variant="onDark"` is kept for any genuine dark surface
  // (renders near-white); legacy "dark"/"light" both map to dark-on-light.
  const onDark = (variant as string) === "onDark";
  return (
    <nav aria-label="Breadcrumb" className={`text-xs ${onDark ? "text-white/60" : "text-[#0B1640]/55"}`}>
      <ol className="flex flex-wrap items-center gap-1">
        {trail.map((c, i) => {
          const last = i === trail.length - 1;
          return (
            <li key={c.href} className="flex items-center gap-1">
              {last ? (
                <span aria-current="page" className={`font-semibold ${onDark ? "text-white" : "text-[#0B1640]"}`}>
                  {c.name}
                </span>
              ) : (
                <>
                  <Link to={c.href} className={`transition hover:underline ${onDark ? "hover:text-white" : "hover:text-orange-600"}`}>
                    {c.name}
                  </Link>
                  <ChevronRight className="h-3 w-3 opacity-60" />
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
