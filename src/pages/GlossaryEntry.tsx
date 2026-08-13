import { Navigate, useLocation } from "react-router-dom";
import GlossaryEntryLayout from "@/components/seo/GlossaryEntryLayout";
import { glossary } from "@/lib/glossaryData";

export default function GlossaryEntry() {
  const location = useLocation();
  const slug = location.pathname.replace(/^\/glossary\//, "").replace(/\/+$/, "");
  const entry = glossary.find((g) => g.slug === slug);
  if (!entry) return <Navigate to="/404" replace />;
  return <GlossaryEntryLayout entry={entry} />;
}
