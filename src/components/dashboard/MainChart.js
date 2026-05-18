"use client";

import * as d3 from "d3";
import { useEffect, useRef, useState } from "react";
import { filterByRange } from "../../utils/dataLoader";
import { formatDate, formatPrice, formatVolume } from "../../utils/format";

const RANGES = ["1M", "3M", "6M", "1Y", "ALL"];

export default function MainChart({ data, asset, loading }) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const tooltipRef = useRef(null);
  const [range, setRange] = useState("1Y");
  const [dims, setDims] = useState({ width: 800, height: 480 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setDims({ width: Math.max(width, 300), height: Math.max(height, 300) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (loading || !data.length || !svgRef.current) return;

    const filtered = filterByRange(data, range);
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = dims.width;
    const height = dims.height;
    const margin = { top: 16, right: 56, bottom: 36, left: 64 };
    const priceHeight = height * 0.72;
    const volTop = priceHeight + 8;
    const volHeight = height - volTop - margin.bottom;

    const x = d3
      .scaleTime()
      .domain(d3.extent(filtered, (d) => d.date))
      .range([margin.left, width - margin.right]);

    const yPrice = d3
      .scaleLinear()
      .domain(d3.extent(filtered, (d) => d.close))
      .nice()
      .range([priceHeight, margin.top]);

    const yVol = d3
      .scaleLinear()
      .domain([0, d3.max(filtered, (d) => d.volume) * 1.1])
      .nice()
      .range([height - margin.bottom, volTop]);

    const g = svg.append("g");

    const gridColor = getComputedStyle(document.documentElement).getPropertyValue("--chart-grid").trim();

    g.append("g")
      .attr("class", "chart-grid")
      .attr("transform", `translate(0,${priceHeight})`)
      .call(d3.axisBottom(x).ticks(6).tickSize(-(priceHeight - margin.top)).tickFormat(""))
      .call((sel) => sel.select(".domain").remove())
      .call((sel) => sel.selectAll("line").attr("stroke", gridColor).attr("stroke-dasharray", "3,3").attr("opacity", 0.6));

    g.append("g")
      .attr("class", "chart-grid hidden md:block")
      .call(d3.axisLeft(yPrice).ticks(5).tickSize(-(width - margin.left - margin.right)).tickFormat(""))
      .call((sel) => sel.select(".domain").remove())
      .call((sel) => sel.selectAll("line").attr("stroke", gridColor).attr("stroke-dasharray", "3,3").attr("opacity", 0.6));

    const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim();

    const area = d3
      .area()
      .x((d) => x(d.date))
      .y0(priceHeight)
      .y1((d) => yPrice(d.close))
      .curve(d3.curveMonotoneX);

    const line = d3
      .line()
      .x((d) => x(d.date))
      .y((d) => yPrice(d.close))
      .curve(d3.curveMonotoneX);

    const gradId = `price-grad-${asset}`;
    const grad = svg.append("defs").append("linearGradient").attr("id", gradId).attr("x1", 0).attr("y1", 0).attr("x2", 0).attr("y2", 1);
    grad.append("stop").attr("offset", "0%").attr("stop-color", accent).attr("stop-opacity", 0.35);
    grad.append("stop").attr("offset", "100%").attr("stop-color", accent).attr("stop-opacity", 0);

    const chartG = g.append("g").attr("class", "chart-content");

    chartG
      .append("path")
      .datum(filtered)
      .attr("fill", `url(#${gradId})`)
      .attr("d", area)
      .attr("opacity", 0)
      .transition()
      .duration(400)
      .attr("opacity", 1);

    chartG
      .append("path")
      .datum(filtered)
      .attr("fill", "none")
      .attr("stroke", accent)
      .attr("stroke-width", 2)
      .attr("d", line);

    chartG
      .selectAll(".vol-bar")
      .data(filtered)
      .join("rect")
      .attr("class", "vol-bar")
      .attr("x", (d) => x(d.date) - 1)
      .attr("y", (d) => yVol(d.volume))
      .attr("width", 2)
      .attr("height", (d) => height - margin.bottom - yVol(d.volume))
      .attr("fill", "var(--volume-bar)")
      .attr("opacity", 0.3);

    g.append("g")
      .attr("transform", `translate(0,${priceHeight})`)
      .call(d3.axisBottom(x).ticks(6).tickSizeOuter(0))
      .call((sel) => sel.selectAll("text").attr("class", "axis-label"));

    g.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(yPrice).ticks(5).tickFormat((d) => `$${d3.format(".2s")(d)}`))
      .call((sel) => sel.selectAll("text").attr("class", "axis-label"));

    g.append("g")
      .attr("transform", `translate(${width - margin.right},0)`)
      .call(d3.axisRight(yVol).ticks(3).tickFormat((d) => d3.format(".2s")(d)))
      .call((sel) => sel.selectAll("text").attr("class", "axis-label"));

    const crosshair = g.append("line").attr("class", "crosshair").attr("y1", margin.top).attr("y2", height - margin.bottom).attr("opacity", 0);
    const overlay = g
      .append("rect")
      .attr("x", margin.left)
      .attr("y", margin.top)
      .attr("width", width - margin.left - margin.right)
      .attr("height", height - margin.top - margin.bottom)
      .attr("fill", "transparent")
      .style("cursor", "crosshair");

    const bisect = d3.bisector((d) => d.date).left;
    const tooltip = d3.select(tooltipRef.current);

    const showTip = (event) => {
      const [mx] = d3.pointer(event);
      const date = x.invert(mx);
      const idx = bisect(filtered, date);
      const d0 = filtered[Math.max(0, Math.min(idx, filtered.length - 1))];
      crosshair.attr("x1", x(d0.date)).attr("x2", x(d0.date)).attr("opacity", 1);
      tooltip
        .style("opacity", 1)
        .style("left", `${x(d0.date) + 12}px`)
        .style("top", `${margin.top + 8}px`)
        .html(
          `<strong>${formatDate(d0.date)}</strong><br/>
          O $${formatPrice(d0.open)} · H $${formatPrice(d0.high)}<br/>
          L $${formatPrice(d0.low)} · C $${formatPrice(d0.close)}<br/>
          Vol ${formatVolume(d0.volume)}`
        );
    };

    overlay.on("mousemove", showTip).on("mouseleave", () => {
      crosshair.attr("opacity", 0);
      tooltip.style("opacity", 0);
    });

    const zoomed = (event) => {
      const zx = event.transform.rescaleX(x);
      chartG.select("path:nth-child(2)").attr("d", line.x((d) => zx(d.date)).y((d) => yPrice(d.close)));
      chartG.select("path:first-child").attr("d", area.x((d) => zx(d.date)).y1((d) => yPrice(d.close)));
      chartG.selectAll(".vol-bar").attr("x", (d) => zx(d.date) - 1);
      g.select(".chart-grid").call(d3.axisBottom(zx).ticks(6).tickSize(-(priceHeight - margin.top)).tickFormat(""));
    };

    const zoom = d3.zoom().scaleExtent([1, 20]).translateExtent([[margin.left, 0], [width - margin.right, height]]).on("zoom", zoomed);
    overlay.call(zoom);
  }, [data, range, dims, loading, asset]);

  return (
    <section className="card chart-card flex min-h-[50vh] flex-col p-5 md:min-h-[60vh]" aria-label={`${asset} price and volume chart`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="section-title">Price & Volume</h2>
        <div className="flex gap-2" role="group" aria-label="Time range">
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`pill-btn text-xs ${range === r ? "pill-btn-active" : "pill-btn-inactive"}`}
              aria-pressed={range === r}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div ref={containerRef} className="relative min-h-[300px] flex-1 w-full">
        {loading ? (
          <div className="skeleton-shimmer absolute inset-0 rounded-md" />
        ) : (
          <>
            <svg
              ref={svgRef}
              width={dims.width}
              height={dims.height}
              className="w-full overflow-visible"
              role="img"
              aria-label={`${asset} closing price and trading volume from ${range} range`}
            />
            <div ref={tooltipRef} className="chart-tooltip pointer-events-none absolute opacity-0 transition-opacity duration-100" />
          </>
        )}
      </div>
    </section>
  );
}
