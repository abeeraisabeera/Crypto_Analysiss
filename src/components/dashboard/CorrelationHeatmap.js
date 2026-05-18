"use client";

import * as d3 from "d3";
import { useEffect, useRef } from "react";
import { filterByRange } from "../../utils/dataLoader";
import { formatDate, formatPrice } from "../../utils/format";
import { pearsonCorrelation } from "../../utils/metrics";

function build2DBins(points, n = 12) {
  const xExt = d3.extent(points, (d) => d.high);
  const yExt = d3.extent(points, (d) => d.low);
  const [x0, x1] = xExt;
  const [y0, y1] = yExt;
  const xStep = (x1 - x0) / n || 1;
  const yStep = (y1 - y0) / n || 1;
  const cells = [];

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      cells.push({
        x0: x0 + i * xStep,
        x1: x0 + (i + 1) * xStep,
        y0: y0 + j * yStep,
        y1: y0 + (j + 1) * yStep,
        count: 0,
      });
    }
  }

  points.forEach((p) => {
    const i = Math.min(n - 1, Math.floor((p.high - x0) / xStep));
    const j = Math.min(n - 1, Math.floor((p.low - y0) / yStep));
    cells[i * n + j].count += 1;
  });

  return cells.filter((c) => c.count > 0);
}

export default function CorrelationHeatmap({ data, asset, range = "1Y", loading }) {
  const svgRef = useRef(null);
  const tooltipRef = useRef(null);

  useEffect(() => {
    if (loading || !data.length || !svgRef.current) return;

    const filtered = filterByRange(data, range);
    const width = 420;
    const height = 320;
    const margin = { top: 24, right: 24, bottom: 48, left: 56 };

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("viewBox", `0 0 ${width} ${height}`);

    const highs = filtered.map((d) => d.high);
    const lows = filtered.map((d) => d.low);
    const r = pearsonCorrelation(highs, lows);

    const x = d3.scaleLinear().domain(d3.extent(highs)).nice().range([margin.left, width - margin.right]);
    const y = d3.scaleLinear().domain(d3.extent(lows)).nice().range([height - margin.bottom, margin.top]);

    const bins = build2DBins(filtered);
    const maxCount = d3.max(bins, (b) => b.count) || 1;
    const color = d3
      .scaleSequential()
      .domain([0, maxCount])
      .interpolator(d3.interpolateRgbBasis(["#67e8f9", "#f59e0b", "#ef4444"]));

    const g = svg.append("g");

    g.selectAll("rect")
      .data(bins)
      .join("rect")
      .attr("x", (d) => x(d.x0))
      .attr("y", (d) => y(d.y1))
      .attr("width", (d) => Math.max(1, x(d.x1) - x(d.x0) - 1))
      .attr("height", (d) => Math.max(1, y(d.y0) - y(d.y1) - 1))
      .attr("fill", (d) => color(d.count))
      .attr("opacity", 0.88)
      .attr("rx", 2);

    g.selectAll(".point")
      .data(filtered.filter((_, i) => i % 8 === 0))
      .join("circle")
      .attr("class", "point")
      .attr("cx", (d) => x(d.high))
      .attr("cy", (d) => y(d.low))
      .attr("r", 3)
      .attr("fill", "var(--accent)")
      .attr("opacity", 0.45)
      .on("mouseover", function (event, d) {
        d3.select(this).attr("r", 6).attr("opacity", 1);
        d3.select(tooltipRef.current)
          .style("opacity", 1)
          .html(`${formatDate(d.date)}<br/>High $${formatPrice(d.high)}<br/>Low $${formatPrice(d.low)}`);
      })
      .on("mouseout", function () {
        d3.select(this).attr("r", 3).attr("opacity", 0.45);
        d3.select(tooltipRef.current).style("opacity", 0);
      });

    g.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat((d) => d3.format(".2s")(d)))
      .call((sel) => sel.selectAll("text").attr("class", "axis-label"));

    g.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(5).tickFormat((d) => d3.format(".2s")(d)))
      .call((sel) => sel.selectAll("text").attr("class", "axis-label"));

    g.append("text")
      .attr("x", width / 2)
      .attr("y", height - 8)
      .attr("text-anchor", "middle")
      .attr("class", "axis-title")
      .text("High Value");

    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", 16)
      .attr("text-anchor", "middle")
      .attr("class", "axis-title")
      .text("Low Value");

    g.append("text")
      .attr("x", width - margin.right)
      .attr("y", margin.top + 4)
      .attr("text-anchor", "end")
      .attr("class", "corr-badge")
      .text(`r = ${r.toFixed(3)}`);
  }, [data, range, loading, asset]);

  return (
    <section className="card flex min-h-[360px] flex-col p-5" aria-label={`${asset} high-low correlation heatmap`}>
      <h2 className="section-title mb-4">Correlation Heatmap</h2>
      <div className="relative flex-1">
        {loading ? (
          <div className="skeleton-shimmer absolute inset-0 rounded-md" />
        ) : (
          <>
            <svg ref={svgRef} className="h-auto w-full max-w-full" role="img" aria-label="High versus low price correlation density" />
            <div ref={tooltipRef} className="chart-tooltip pointer-events-none absolute left-4 top-4 opacity-0" />
          </>
        )}
      </div>
    </section>
  );
}
