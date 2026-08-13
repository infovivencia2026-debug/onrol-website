import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

type SparklineColor = "emerald" | "amber" | "rose" | "blue" | "violet";

interface SparklineKpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  sparklineData?: number[];
  color?: SparklineColor;
  icon?: React.ReactNode;
  onClick?: () => void;
}

const colorMap: Record<SparklineColor, { stroke: string; chip: string; flat: string }> = {
  emerald: { stroke: "#10b981", chip: "bg-emerald-50 text-emerald-700 border-emerald-200", flat: "#10b981" },
  amber:   { stroke: "#f59e0b", chip: "bg-amber-50 text-amber-700 border-amber-200",       flat: "#f59e0b" },
  rose:    { stroke: "#f43f5e", chip: "bg-rose-50 text-rose-700 border-rose-200",           flat: "#f43f5e" },
  blue:    { stroke: "#3b82f6", chip: "bg-blue-50 text-orange-700 border-orange-200",           flat: "#3b82f6" },
  violet:  { stroke: "#8b5cf6", chip: "bg-violet-50 text-violet-700 border-violet-200",     flat: "#8b5cf6" },
};

const trendChipMap = {
  up:      "bg-emerald-50 text-emerald-700 border border-emerald-200",
  down:    "bg-rose-50 text-rose-700 border border-rose-200",
  neutral: "bg-slate-50 text-slate-600 border border-slate-200",
};

function buildPolylinePoints(data: number[], width: number, height: number): string {
  if (!data || data.length === 0) return `0,${height / 2} ${width},${height / 2}`;
  if (data.length === 1) return `0,${height / 2} ${width},${height / 2}`;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min === 0 ? 1 : max - min;
  const padding = 3;

  return data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - padding - ((v - min) / range) * (height - padding * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

export default function SparklineKpiCard({
  title,
  value,
  subtitle,
  trend,
  trendValue,
  sparklineData,
  color = "emerald",
  icon,
  onClick,
}: SparklineKpiCardProps) {
  const palette = colorMap[color];
  const svgWidth = 200;
  const svgHeight = 36;
  const points = buildPolylinePoints(sparklineData ?? [], svgWidth, svgHeight);

  return (
    <div
      onClick={onClick}
      className={[
        "bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col",
        onClick ? "cursor-pointer hover:bg-slate-50 transition-colors" : "",
      ].join(" ")}
    >
      {/* Top row: icon + trend chip */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center justify-center h-8 w-8 rounded-xl bg-slate-100 text-slate-600 flex-shrink-0">
          {icon ?? <TrendingUp size={15} />}
        </div>

        {trendValue && trend && (
          <span
            className={[
              "flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border",
              trendChipMap[trend],
            ].join(" ")}
          >
            {trend === "up" && <TrendingUp size={10} />}
            {trend === "down" && <TrendingDown size={10} />}
            {trend === "neutral" && <Minus size={10} />}
            {trendValue}
          </span>
        )}
      </div>

      {/* Value */}
      <p className="text-3xl font-bold text-slate-900 mt-2 leading-none">{value}</p>

      {/* Title */}
      <p className="text-sm font-medium text-slate-600 mt-0.5">{title}</p>

      {/* Subtitle */}
      {subtitle && (
        <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
      )}

      {/* Sparkline */}
      <div className="mt-3 w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          width="100%"
          height={svgHeight}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <polyline
            points={points}
            fill="none"
            stroke={palette.stroke}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}
