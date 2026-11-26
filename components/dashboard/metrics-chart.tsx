"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface MetricsChartProps {
  metric: "wpm" | "latency" | "viSegments" | "lifeline";
  title: string;
  data: { date: string; value: number }[];
}

const METRIC_CONFIG = {
  wpm: { color: "rgb(59 130 246)", target: 100, higherIsBetter: true, unit: "wpm" },
  latency: { color: "rgb(16 185 129)", target: 500, higherIsBetter: false, unit: "ms" },
  viSegments: { color: "rgb(245 158 11)", target: 2, higherIsBetter: false, unit: "/day" },
  lifeline: { color: "rgb(168 85 247)", target: 20, higherIsBetter: false, unit: "%" },
};

export function MetricsChart({ metric, title, data }: MetricsChartProps) {
  const config = METRIC_CONFIG[metric];
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.map((d, i) => ({
      x: i,
      y: d.value,
      label: d.date,
    }));
  }, [data]);

  const maxY = useMemo(() => {
    if (chartData.length === 0) return config.target * 1.5;
    const maxData = Math.max(...chartData.map(d => d.y));
    return Math.max(maxData * 1.2, config.target * 1.2);
  }, [chartData, config.target]);

  const minY = useMemo(() => {
    if (chartData.length === 0) return 0;
    const minData = Math.min(...chartData.map(d => d.y));
    return Math.max(0, minData * 0.8);
  }, [chartData]);

  const width = 100;
  const height = 100;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="font-medium mb-4">{title}</h3>
      <div className="relative h-48">
        <svg className="w-full h-full" viewBox="0 0 300 200" preserveAspectRatio="none">
          <defs>
            <linearGradient id={`gradient-${metric}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={config.color} stopOpacity="0.3" />
              <stop offset="100%" stopColor={config.color} stopOpacity="0" />
            </linearGradient>
          </defs>
          
          {/* Grid lines */}
          <g stroke="#e5e7eb" strokeWidth="0.5">
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
              <line
                key={ratio}
                x1={40}
                y1={20 + 160 * ratio}
                x2={280}
                y2={20 + 160 * ratio}
              />
            ))}
          </g>

          {/* Target line */}
          {chartData.length > 0 && (
            <line
              x1={40}
              y1={20 + 160 * (1 - (config.target - minY) / (maxY - minY))}
              x2={280}
              y2={20 + 160 * (1 - (config.target - minY) / (maxY - minY))}
              stroke={config.higherIsBetter ? "rgb(16 185 129)" : "rgb(239 68 68)"}
              strokeWidth="1.5"
              strokeDasharray="4,4"
              opacity="0.7"
            />
          )}

          {/* Area */}
          {chartData.length > 1 && (
            <path
              d={[
                `M${40},${180}`,
                ...chartData.map((d, i) => {
                  const x = 40 + (240 * i) / (chartData.length - 1);
                  const y = 180 - 160 * ((d.y - minY) / (maxY - minY));
                  return i === 0 ? `L${x},${y}` : `L${x},${y}`;
                }),
                `L${280},${180} Z`,
              ].join(" ")}
              fill={`url(#gradient-${metric})`}
            />
          )}

          {/* Line */}
          {chartData.length > 1 && (
            <path
              d={chartData
                .map((d, i) => {
                  const x = 40 + (240 * i) / (chartData.length - 1);
                  const y = 180 - 160 * ((d.y - minY) / (maxY - minY));
                  return `${i === 0 ? "M" : "L"}${x},${y}`;
                })
                .join(" ")}
              stroke={config.color}
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Dots */}
          {chartData.map((d, i) => (
            <circle
              key={i}
              cx={40 + (240 * i) / Math.max(1, chartData.length - 1)}
              cy={180 - 160 * ((d.y - minY) / (maxY - minY))}
              r={4}
              fill={config.color}
              stroke="white"
              strokeWidth={2}
            />
          ))}
        </svg>

        {/* Y-axis labels */}
        <div className="absolute left-0 top-4 bottom-12 flex flex-col justify-between pr-2 text-xs text-muted-foreground">
          <span>{Math.round(maxY)}</span>
          <span>{Math.round((maxY + minY) / 2)}</span>
          <span>{Math.round(minY)}</span>
        </div>

        {/* X-axis labels */}
        <div className="absolute bottom-0 left-10 right-0 flex justify-between text-xs text-muted-foreground">
          {chartData.length > 0 && [
            chartData[0].label,
            chartData[Math.floor(chartData.length / 2)]?.label,
            chartData[chartData.length - 1].label,
          ].map((label, i) => (
            <span key={i}>{label}</span>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="mt-4 flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-medium",
              config.higherIsBetter ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
            )}
          >
            Mục tiêu: {config.higherIsBetter ? "≥" : "≤"} {config.target}{config.unit}
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          {chartData.length > 0 && (
            <>
              <span>Trung bình: {Math.round(chartData.reduce((a, b) => a + b.y, 0) / chartData.length)}{config.unit}</span>
              <span>Mới nhất: {chartData[chartData.length - 1].y}{config.unit}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}