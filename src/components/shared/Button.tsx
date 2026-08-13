import { ReactNode } from "react";
import { Link } from "react-router-dom";

type ButtonVariant = "primary" | "secondary" | "ghost";

type ButtonProps = {
  children: ReactNode;
  to?: string;
  href?: string;
  variant?: ButtonVariant;
  className?: string;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
};

const base =
  "inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-[13px] font-semibold transition-all duration-300 ease-out-premium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f3f5f8] active:scale-[0.985] sm:px-5 sm:py-3 sm:text-sm";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-r from-[#F8FAFC] via-[#E2E8F0] to-[#C7D2FE] text-[#f3f5f8] hover:-translate-y-0.5 hover:brightness-105",
  secondary:
    "border border-white/35 bg-white/10 text-[#0B1640] hover:-translate-y-0.5 hover:border-slate-200/70 hover:bg-white/20 hover:text-[#0B1640]",
  ghost: "text-[#0B1640] hover:-translate-y-0.5 hover:text-[#0B1640] hover:bg-white/10",
};

const Button = ({ children, to, href, variant = "primary", className = "", type = "button", onClick }: ButtonProps) => {
  const classes = `${base} ${variants[variant]} ${className}`;

  if (to) {
    return (
      <Link to={to} className={classes}>
        {children}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} className={classes}>
        {children}
      </a>
    );
  }

  return (
    <button type={type} onClick={onClick} className={classes}>
      {children}
    </button>
  );
};

export default Button;
