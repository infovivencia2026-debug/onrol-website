import { Navigate, useLocation } from "react-router-dom";
import PillarPageLayout from "@/components/seo/PillarPageLayout";
import { pillarPages } from "@/lib/pillarContent";

/**
 * SEO pillar page renderer. Each pillar slug has its own explicit route in
 * App.tsx (so it doesn't shadow /programs/* etc), but the rendering is
 * delegated here. We resolve the slug from the current URL pathname.
 */
export default function PillarPage({ slugOverride }: { slugOverride?: string } = {}) {
  const location = useLocation();
  // slugOverride lets a "-classic" route render a specific pillar even though
  // its own pathname (…-classic) isn't a real pillar slug.
  const slug = slugOverride ?? location.pathname.replace(/^\/+|\/+$/g, "");
  const page = pillarPages.find((p) => p.slug === slug);
  if (!page) return <Navigate to="/404" replace />;
  return <PillarPageLayout page={page} />;
}
