"use client";

import * as d3 from "d3";
import { useEffect, useRef } from "react";
import { filterByRange } from "../../utils/dataLoader";
import { enrichRiskRewardPoints, computeRiskPercentile } from "../../utils/metrics";
import { formatDate, formatPercent, formatVolume } from "../../utils/format";

const QUADRANTS = [
  { label: "High Risk / High Reward", x: "end", y: "start" },
  { label: "High Risk / Low Reward", x: "end", y: "end" },
  { label: "Low Risk / High Reward", x: "start", y: "start" },
  { label: "Low Risk / Low Reward", x: "start", y: "end" },
];

export default function RiskRewardChart({ data, asset, allVolatilities = [], range = "1Y", loading }) {
  const svgRef = useRef(null);
  const tooltipRef = useRef(null);

  useEffect(() => {
    if (loading || !data.length || !svgRef.current) return;

    const filtered = enrichRiskRewardPoints(filterByRange(data, range));
    const width = 420;
    const height = 320;
    const margin = { top: 28, right: 24, bottom: 48, left: 56 };

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("viewBox", `0 0 ${width} ${height}`);

    const x = d3
      .scaleLinear()
      .domain(d3.extent(filtered, (d) => d.volatility))
      .nice()
      .range([margin.left, width - margin.right]);

    const y = d3
      .scaleLinear()
      .domain(d3.extent(filtered, (d) => d.returnPct))
      .nice()
      .range([height - margin.bottom, margin.top]);

    const medianVol = d3.median(filtered, (d) => d.volatility) ?? 0;
    const maxVol = d3.max(filtered, (d) => d.volume) ?? 1;
    const rScale = d3.scaleSqrt().domain([0, maxVol]).range([3, 18]);

    const g = svg.append("g");
    const gridColor = getComputedStyle(document.documentElement).getPropertyValue("--chart-grid").trim();

    g.append("line")
      .attr("x1", x(medianVol))
      .attr("x2", x(medianVol))
      .attr("y1", margin.top)
      .attr("y2", height - margin.bottom)
      .attr("stroke", gridColor)
      .attr("stroke-dasharray", "4,4");

    g.append("line")
      .attr("x1", margin.left)
      .attr("x2", width - margin.right)
      .attr("y1", y(0))
      .attr("y2", y(0))
      .attr("stroke", gridColor)
      .attr("stroke-dasharray", "4,4");

    QUADRANTS.forEach((q) => {
      g.append("text")
        .attr("x", q.x === "end" ? width - margin.right - 4 : margin.left + 4)
        .attr("y", q.y === "start" ? margin.top + 14 : height - margin.bottom - 8)
        .attr("text-anchor", q.x === "end" ? "end" : "start")
        .attr("class", "quadrant-label")
        .text(q.label);
    });

    g.selectAll("circle")
      .data(filtered.filter((_, i) => i % 3 === 0))
      .join("circle")
      .attr("cx", (d) => x(d.volatility))
      .attr("cy", (d) => y(d.returnPct))
      .attr("r", (d) => rScale(d.volume))
      .attr("fill", (d) => (d.returnPct >= 0 ? "var(--positive)" : "var(--negative)"))
      .attr("opacity", 0.65)
      .attr("stroke", "var(--card-bg)")
      .attr("stroke-width", 1)
      .on("mouseover", function (event, d) {
        d3.select(this).attr("opacity", 0.95);
        d3.select(tooltipRef.current)
          .style("opacity", 1)
          .html(
            `${formatDate(d.date)}<br/>
            Volatility $${d.volatility.toFixed(2)}<br/>
            Return ${formatPercent(d.returnPct)}<br/>
            Volume ${formatVolume(d.volume)}`
          );
      })
      .on("mouseout", function () {
        d3.select(this).attr("opacity", 0.65);
        d3.select(tooltipRef.current).style("opacity", 0);
      });

    g.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(5))
      .call((sel) => sel.selectAll("text").attr("class", "axis-label"));

    g.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(5).tickFormat((d) => `${d}%`))
      .call((sel) => sel.selectAll("text").attr("class", "axis-label"));

    g.append("text")
      .attr("x", width / 2)
      .attr("y", height - 8)
      .attr("text-anchor", "middle")
      .attr("class", "axis-title")
      .text("Volatility (High − Low)");

    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", 16)
      .attr("text-anchor", "middle")
      .attr("class", "axis-title")
      .text("Return %");

    const avgVol = d3.mean(filtered, (d) => d.volatility) ?? 0;
    const pct = computeRiskPercentile(allVolatilities, avgVol);

    g.append("text")
      .attr("x", margin.left + 4)
      .attr("y", margin.top + 4)
      .attr("class", "corr-badge")
      .text(`Safer than ${pct}% of assets`);
  }, [data, range, loading, asset, allVolatilities]);

  return (
    <section className="card flex min-h-[360px] flex-col p-5" aria-label={`${asset} risk-reward bubble chart`}>
      <h2 className="section-title mb-4">Risk–Reward</h2>
      <div className="relative flex-1">
        {loading ? (
          <div className="skeleton-shimmer absolute inset-0 rounded-md" />
        ) : (
          <>
            <svg ref={svgRef} className="h-auto w-full max-w-full" role="img" aria-label="Volatility versus return bubble chart" />
            <div ref={tooltipRef} className="chart-tooltip pointer-events-none absolute left-4 top-4 opacity-0" />
          </>
        )}
      </div>
    </section>
  );
}
