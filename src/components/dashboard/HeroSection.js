"use client";

import { Activity, TrendingDown, TrendingUp } from "lucide-react";
import { useCountUp } from "../../hooks/useCountUp";
import { formatPercent, formatPrice } from "../../utils/format";
import Sparkline from "./Sparkline";

export default function HeroSection({ asset, stats, loading }) {
  const animatedPrice = useCountUp(stats?.price ?? 0, 600, !loading && stats != null);
  const positive = (stats?.changePct ?? 0) >= 0;

  if (loading || !stats) {
    return (
      <section className="card hero-card min-h-[200px] p-5 md:p-6" aria-busy="true">
        <div className="skeleton-shimmer mb-3 h-5 w-28 rounded-md" />
        <div className="skeleton-shimmer mb-4 h-12 w-72 rounded-md md:h-14" />
        <div className="skeleton-shimmer h-12 w-36 rounded-full" />
      </section>
    );
  }

  const label = asset.replace("-USD", "");

  return (
    <section
      className="card hero-card flex flex-col justify-between gap-6 p-5 md:flex-row md:items-center md:p-6"
      aria-label={`${label} price overview`}
    >
      <div>
        <p className="caption mb-1 flex items-center gap-2 text-secondary">
          <Activity size={14} strokeWidth={1.75} aria-hidden />
          {label} / USD
        </p>
        <p className="price-display text-primary">${formatPrice(animatedPrice)}</p>
        <span
          className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ${
            positive ? "badge-positive" : "badge-negative"
          }`}
        >
          {positive ? <TrendingUp size={16} strokeWidth={1.75} /> : <TrendingDown size={16} strokeWidth={1.75} />}
          24h {formatPercent(stats.changePct)}
        </span>
      </div>
      <div className="flex flex-col items-start md:items-end">
        <p className="caption mb-2 text-secondary">Last 30 sessions</p>
        <Sparkline data={stats.sparkline} positive={positive} width={200} height={56} />
      </div>
    </section>
  );
}
