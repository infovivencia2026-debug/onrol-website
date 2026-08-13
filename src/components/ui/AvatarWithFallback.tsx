import React, { useState } from "react";

interface AvatarWithFallbackProps {
  name: string;
  avatarUrl?: string | null;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const BG_COLORS = [
  "bg-violet-500",
  "bg-blue-500",
  "bg-emerald-500",
  "bg-rose-500",
  "bg-amber-500",
  "bg-cyan-500",
  "bg-pink-500",
  "bg-indigo-500",
];

function hashName(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return (parts[0]?.[0] ?? "?").toUpperCase();
}

const SIZE_CLASSES: Record<string, { container: string; text: string }> = {
  xs: { container: "w-6 h-6", text: "text-[10px]" },
  sm: { container: "w-8 h-8", text: "text-xs" },
  md: { container: "w-10 h-10", text: "text-sm" },
  lg: { container: "w-[52px] h-[52px]", text: "text-base" },
};

export default function AvatarWithFallback({
  name,
  avatarUrl,
  size = "md",
  className = "",
}: AvatarWithFallbackProps) {
  const [imgError, setImgError] = useState(false);

  const initials = getInitials(name);
  const bgColor = BG_COLORS[hashName(name) % BG_COLORS.length];
  const { container, text } = SIZE_CLASSES[size];

  const showInitials = !avatarUrl || imgError;

  return (
    <div
      className={`${container} rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center ${showInitials ? `${bgColor} text-white` : ""} ${className}`}
      aria-label={name}
    >
      {!showInitials ? (
        <img
          src={avatarUrl!}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <span className={`${text} font-semibold leading-none select-none`}>
          {initials}
        </span>
      )}
    </div>
  );
}
