type BadgeProps = {
  children: string;
  className?: string;
};

const Badge = ({ children, className = "" }: BadgeProps) => {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-orange-300/60 bg-sky-100/80 px-3 py-1 text-xs font-semibold tracking-[0.12em] text-orange-800 uppercase ${className}`}
    >
      {children}
    </span>
  );
};

export default Badge;
