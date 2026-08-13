import React from "react";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export default function SectionHeader({
  title,
  subtitle,
  icon,
  actions,
  className = "",
}: SectionHeaderProps) {
  return (
    <div
      className={`flex items-start justify-between border-b border-slate-200 pb-4 mb-4 md:mb-6 ${className}`}
    >
      <div className="flex items-start gap-2 min-w-0">
        {icon && (
          <span className="text-slate-400 flex-shrink-0 mt-0.5 w-5 h-5 flex items-center justify-center">
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-slate-900 leading-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-shrink-0 ml-4">
          {actions}
        </div>
      )}
    </div>
  );
}
