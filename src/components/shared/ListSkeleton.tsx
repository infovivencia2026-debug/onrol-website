import { Skeleton } from "@/components/ui/skeleton";

interface ListSkeletonProps {
  count?: number;
  variant?: "card" | "row" | "tile";
  className?: string;
}

/**
 * Drop-in replacement for "Loading..." text. Renders shimmering placeholder
 * cards that match the rough shape of the real content beneath. Used across
 * JobsBoard, MemberDirectory, CommunityProjects, etc.
 */
export default function ListSkeleton({ count = 6, variant = "card", className = "" }: ListSkeletonProps) {
  if (variant === "row") {
    return (
      <div className={`space-y-3 ${className}`}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-4">
            <Skeleton className="h-12 w-12 shrink-0 rounded-full bg-white/10" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3 bg-white/10" />
              <Skeleton className="h-3 w-2/3 bg-white/8" />
            </div>
            <Skeleton className="h-9 w-20 shrink-0 rounded-lg bg-white/10" />
          </div>
        ))}
      </div>
    );
  }
  if (variant === "tile") {
    return (
      <div className={`grid grid-cols-2 gap-3 sm:grid-cols-4 ${className}`}>
        {Array.from({ length: count }).map((_, i) => (
          <Skeleton key={i} className="aspect-[4/5] w-full rounded-xl bg-white/8" />
        ))}
      </div>
    );
  }
  return (
    <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full bg-white/10" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-2/3 bg-white/10" />
              <Skeleton className="h-3 w-1/3 bg-white/8" />
            </div>
          </div>
          <Skeleton className="h-3 w-full bg-white/8" />
          <Skeleton className="h-3 w-5/6 bg-white/8" />
          <div className="flex gap-2 pt-1">
            <Skeleton className="h-6 w-14 rounded-full bg-white/8" />
            <Skeleton className="h-6 w-14 rounded-full bg-white/8" />
          </div>
        </div>
      ))}
    </div>
  );
}
