"use client";

import { TrendingDown, TrendingUp } from "lucide-react";
import { formatPercent, formatPrice, formatVolume } from "../../utils/format";
import { MetricSkeleton } from "./Skeleton";

function MetricCard({ title, value, formatted, context, badge, trend, loading }) {
  if (loading) return <MetricSkeleton />;

  const trendUp = (trend ?? 0) >= 0;

  return (
    <article className="card metric-card group p-5">
      <p className="metric-value text-primary">{formatted ?? value}</p>
      <h3 className="mt-1 text-caption text-secondary">{title}</h3>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {badge && <span className="context-badge">{badge}</span>}
        <span className="caption text-secondary">{context}</span>
        {trend != null && (
          <span className={`ml-auto inline-flex items-center gap-0.5 ${trendUp ? "text-positive" : "text-negative"}`}>
            {trendUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          </span>
        )}
      </div>
    </article>
  );
}

export default function MetricsGrid({ metrics, loading }) {
  const cards = metrics
    ? [
        {
          title: "Total Volume",
          formatted: formatVolume(metrics.totalVolume.value),
          context: metrics.volumeLabel || metrics.totalVolume.context,
          trend: metrics.totalVolume.trend,
        },
        {
          title: "Highest Price",
          formatted: `$${formatPrice(metrics.highest.value)}`,
          context: metrics.highest.context,
          badge: metrics.highest.badge,
        },
        {
          title: "Lowest Price",
          formatted: `$${formatPrice(metrics.lowest.value)}`,
          context: metrics.lowest.context,
          badge: metrics.lowest.badge,
        },
        {
          title: "YTD Gain",
          formatted: formatPercent(metrics.ytd.value),
          context: metrics.ytd.context,
          trend: metrics.ytd.trend,
        },
      ]
    : [];

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Key metrics">
      {(loading ? Array.from({ length: 4 }) : cards).map((card, i) =>
        loading ? (
          <MetricSkeleton key={i} />
        ) : (
          <MetricCard key={card.title} {...card} loading={false} />
        )
      )}
    </section>
  );
}
