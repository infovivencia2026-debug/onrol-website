import React from "react";
import { Inbox } from "lucide-react";

export interface EmptyStateProps {
  /** Optional lucide icon component. Defaults to Inbox. */
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
  /** Optional CTA button rendered below the subtitle. */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Pass "dark" to get the dark-mode variant (fallback: auto via Tailwind dark:). */
  uiTheme?: "light" | "dark";
  /** Override vertical density. Default is comfortable; "compact" halves the padding. */
  size?: "compact" | "comfortable";
  className?: string;
}

/**
 * Consistent empty/loading placeholder used across admin and employee surfaces.
 * Replaces one-off "No X found" lines that had inconsistent spacing, colors, and
 * no optional action.
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title,
  subtitle,
  action,
  uiTheme,
  size = "comfortable",
  className = "",
}) => {
  const dark = uiTheme === "dark";
  const pad = size === "compact" ? "py-4" : "py-8";
  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed ${pad} px-4 text-center ${
        dark ? "border-[#454545] bg-[#f3f5f8]/40" : "border-slate-200 bg-slate-50/80"
      } ${className}`}
    >
      <Icon className={`h-8 w-8 ${dark ? "text-slate-600" : "text-slate-300"}`} />
      <p className={`text-sm font-semibold ${dark ? "text-slate-200" : "text-slate-700"}`}>{title}</p>
      {subtitle ? (
        <p className={`max-w-xs text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>{subtitle}</p>
      ) : null}
      {action ? (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-1 inline-flex items-center gap-1.5 rounded-lg border border-indigo-300 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-700 dark:bg-[#f3f5f8]/30 dark:text-indigo-200"
        >
          {action.label}
        </button>
      ) : null}
    </div>
  );
};

export default EmptyState;
