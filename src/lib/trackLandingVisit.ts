// Hidden visit counter for marketing landing pages.
//
// Fires once per page-load (not per render) by POSTing to /api/intake
// with formType: "page_visit". Counts live in landing_page_visit_counts
// on the CRM Postgres (own-DB) and are admin-readable only.
//
// Usage in a page component:
//   useEffect(() => { void trackLandingVisit("/career-catalyst/"); }, []);

export { trackLandingVisit } from "@/lib/intake";
