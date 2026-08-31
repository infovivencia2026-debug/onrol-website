// Decorative architectural guide lines — thin vertical edges that frame the
// homepage content. Live at a low z-index so card backgrounds cover them
// (intended), but the line color is now saturated enough to read clearly in
// the gaps between cards on the new darker page background.
const HomeGuideLines = () => {
  const gradient =
    "linear-gradient(180deg, transparent 0%, rgba(11, 22, 64, 0.18) 6%, rgba(11, 22, 64, 0.28) 50%, rgba(11, 22, 64, 0.18) 94%, transparent 100%)";

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0"
      style={{ contain: "strict" }}
    >
      <div
        className="absolute inset-y-0"
        style={{
          left: "max(20px, calc((100vw - min(100vw - 40px, 1280px)) / 2))",
          width: "1px",
          background: gradient,
        }}
      />
      <div
        className="absolute inset-y-0"
        style={{
          right: "max(20px, calc((100vw - min(100vw - 40px, 1280px)) / 2))",
          width: "1px",
          background: gradient,
        }}
      />
    </div>
  );
};

export default HomeGuideLines;
