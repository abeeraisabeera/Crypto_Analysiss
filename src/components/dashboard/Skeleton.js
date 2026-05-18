export function HeroSkeleton() {
  return (
    <div className="card hero-card min-h-[180px] p-5">
      <div className="skeleton-shimmer mb-4 h-6 w-32 rounded-md" />
      <div className="skeleton-shimmer mb-3 h-12 w-64 rounded-md" />
      <div className="skeleton-shimmer h-10 w-24 rounded-full" />
    </div>
  );
}

export function MetricSkeleton() {
  return (
    <div className="card metric-card p-5">
      <div className="skeleton-shimmer mb-3 h-7 w-28 rounded-md" />
      <div className="skeleton-shimmer mb-2 h-4 w-20 rounded-md" />
      <div className="skeleton-shimmer h-3 w-32 rounded-md" />
    </div>
  );
}

export function ChartSkeleton({ tall = false }) {
  return (
    <div className={`card p-5 ${tall ? "min-h-[50vh] md:min-h-[60vh]" : "min-h-[320px]"}`}>
      <div className="skeleton-shimmer mb-4 h-6 w-40 rounded-md" />
      <div className="skeleton-shimmer min-h-[240px] w-full rounded-md" />
    </div>
  );
}
