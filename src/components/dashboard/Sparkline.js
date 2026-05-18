"use client";

import { useMemo } from "react";

export default function Sparkline({ data = [], positive = true, width = 160, height = 48 }) {
  const path = useMemo(() => {
    if (!data.length) return "";
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const step = width / Math.max(data.length - 1, 1);

    return data
      .map((v, i) => {
        const x = i * step;
        const y = height - ((v - min) / range) * (height - 4) - 2;
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  }, [data, width, height]);

  const areaPath = path ? `${path} L${width},${height} L0,${height} Z` : "";

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-visible"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={positive ? "var(--positive)" : "var(--negative)"} stopOpacity="0.35" />
          <stop offset="100%" stopColor={positive ? "var(--positive)" : "var(--negative)"} stopOpacity="0" />
        </linearGradient>
      </defs>
      {areaPath && <path d={areaPath} fill="url(#sparkFill)" />}
      {path && (
        <path
          d={path}
          fill="none"
          stroke={positive ? "var(--positive)" : "var(--negative)"}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}
