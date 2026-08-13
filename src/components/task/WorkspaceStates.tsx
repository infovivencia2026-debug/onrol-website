import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UiTheme } from "@/types/taskManager";

type ThemeProps = {
  uiTheme: UiTheme;
};

type EmptyStateProps = ThemeProps & {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  emoji?: string;
};

type InlineNoticeProps = ThemeProps & {
  children: React.ReactNode;
  tone?: "neutral" | "warning" | "positive";
  className?: string;
};

type SkeletonProps = ThemeProps & {
  lines?: number;
  className?: string;
};

type GreetingProps = ThemeProps & {
  name: string;
  taskCount: number;
  overdueCount?: number;
};

export function WorkspaceInlineNotice({
  uiTheme,
  children,
  tone = "neutral",
  className,
}: InlineNoticeProps) {
  const toneClass =
    tone === "warning"
      ? uiTheme === "dark"
        ? "border-amber-800 bg-amber-900/25 text-amber-300"
        : "border-amber-200 bg-amber-50 text-amber-800"
      : tone === "positive"
        ? uiTheme === "dark"
          ? "border-emerald-800 bg-emerald-900/25 text-emerald-300"
          : "border-emerald-200 bg-emerald-50 text-emerald-800"
        : uiTheme === "dark"
          ? "border-[#454545] bg-[#404040] text-slate-300"
          : "border-slate-200 bg-slate-50 text-slate-600";

  return (
    <div className={cn("rounded-xl border px-3 py-2 text-xs", toneClass, className)}>
      {children}
    </div>
  );
}

export function WorkspaceEmptyState({
  uiTheme,
  title,
  description,
  actionLabel,
  onAction,
  className,
  emoji = "📭",
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-8 text-center",
        uiTheme === "dark"
          ? "border-[#454545]/60 bg-[#404040]/40"
          : "border-slate-200 bg-slate-50/60",
        className,
      )}
    >
      <div className="mb-3 text-4xl">{emoji}</div>
      <p className={cn("text-sm font-semibold", uiTheme === "dark" ? "text-slate-100" : "text-slate-800")}>
        {title}
      </p>
      <p className={cn("mt-1 text-xs leading-relaxed", uiTheme === "dark" ? "text-slate-400" : "text-slate-500")}>
        {description}
      </p>
      {actionLabel && onAction ? (
        <button
          onClick={onAction}
          className={cn(
            "mt-4 inline-flex items-center justify-center rounded-xl px-4 py-2 text-xs font-semibold transition-all active:scale-95",
            uiTheme === "dark"
              ? "bg-indigo-600 text-white hover:bg-indigo-500"
              : "bg-indigo-600 text-white hover:bg-indigo-500",
          )}
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

export function WorkspacePageSkeleton({ uiTheme, lines = 5, className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-xl border p-4 shadow-sm",
        uiTheme === "dark" ? "border-[#454545] bg-[#f3f5f8]" : "border-slate-200 bg-white",
        className,
      )}
    >
      <div className="mb-3 flex items-center gap-2 text-xs font-semibold">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading workspace...
      </div>
      <div className="space-y-2.5">
        {Array.from({ length: lines }).map((_, idx) => (
          <div
            key={`skeleton-line-${idx}`}
            className={cn(
              "h-10 animate-pulse rounded-lg",
              uiTheme === "dark" ? "bg-[#404040]" : "bg-slate-100",
            )}
          />
        ))}
      </div>
    </div>
  );
}

export function WorkspaceGreeting({ uiTheme, name, taskCount, overdueCount = 0 }: GreetingProps) {
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const emoji =
    hour < 12 ? "🌅" : hour < 17 ? "☀️" : "🌙";

  const firstName = name.split(" ")[0];

  const message =
    taskCount === 0 && overdueCount === 0
      ? "All caught up. Nothing pending today."
      : overdueCount > 0
        ? `${overdueCount} overdue task${overdueCount > 1 ? "s" : ""} — let's tackle them first.`
        : `${taskCount} active task${taskCount > 1 ? "s" : ""} today.`;
  return (
    <div
      className={cn(
        "self-start rounded-xl border px-4 py-3 shadow-sm fade-up",
        uiTheme === "dark"
          ? "border-[#454545] bg-[#f3f5f8]"
          : "border-indigo-100 bg-gradient-to-r from-indigo-50/80 to-white",
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg",
          uiTheme === "dark" ? "bg-[#404040] text-slate-200" : "bg-indigo-100 text-indigo-700",
        )}>
          {taskCount === 0 ? "✅" : overdueCount > 0 ? "⚡" : taskCount}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className={cn("truncate text-sm font-semibold leading-tight", uiTheme === "dark" ? "text-slate-50" : "text-slate-900")}>
            {emoji} {greeting}, {firstName}
          </h2>
          <p className={cn("mt-0.5 truncate text-[12px]", uiTheme === "dark" ? "text-slate-400" : "text-slate-500")}>
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}
