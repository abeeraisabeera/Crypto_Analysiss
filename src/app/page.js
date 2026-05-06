

"use client";
import { useEffect, useState } from "react";
import * as d3 from "d3";
import { loadCSV } from "../utils/dataLoader"; // Utility for loading data
const cryptocurrencies = ["BTC-USD", "ETH-USD", "ADA-USD", "LTC-USD", "XRP-USD", "BCH-USD"];

function Frame({ options, selected, onSelect }) {
  return (
    <div className="frame">
      {options.map((option) => (
        <button
          key={option}
          className={`crypto-tab ${option === selected ? "active-tab" : ""}`}
          onClick={() => onSelect(option)}
        >
          {option}
        </button>
      ))}
    </div>
  );

}


export default function CryptoDashboard() {
  const [data, setData] = useState([]);
  const [selectedCrypto, setSelectedCrypto] = useState("BTC-USD");

  useEffect(() => {
    console.log(`Loading data for ${selectedCrypto}...`);
    loadCSV(`/data/${selectedCrypto}.csv`).then((data) => {
      console.log(`Data loaded for ${selectedCrypto}:`, data);
      setData(data);
    });
  }, [selectedCrypto]);

  useEffect(() => {
    if (data.length > 0) {
      console.log("Data received, creating visualizations...");
      createLineChart(data);
      createBarChart(data);
      createScatterPlot(data);
      createCandlestickChart(data); // New
      createRiskRewardChart(data); // New
    }
  }, [data]);
// Create Line Chart
const createLineChart = (data) => {
  console.log("Creating Line Chart...");
  const svg = d3.select("#lineChart");
  svg.selectAll("*").remove();

  const width = 600,
    height = 300,
    margin = { top: 20, right: 30, bottom: 30, left: 70 };

  // Filter the data to include only years between 2017 and 2023
  const filteredData = data.filter((d) => d.Year >= 2017 && d.Year <= 2023);

  const x = d3.scaleBand() // Use scaleBand for discrete years on the x-axis
    .domain(filteredData.map((d) => d.Year))
    .range([margin.left, width - margin.right])
    .padding(0.1);

  const y = d3.scaleLinear()
    .domain([0, d3.max(filteredData, (d) => d.Close)])
    .range([height - margin.bottom, margin.top]);

  const line = d3.line()
    .x((d) => x(d.Year) + x.bandwidth() / 2) // Adjust for scaleBand
    .y((d) => y(d.Close));

  // Tooltip for interactivity
  const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("background-color", "#333")
    .style("color", "#fff")
    .style("border-radius", "5px")
    .style("padding", "5px")
    .style("opacity", 0);

  // Append x-axis (using year as categories)
  svg.append("g")
    .attr("transform", `translate(0, ${height - margin.bottom})`)
    .call(d3.axisBottom(x));

  // Append y-axis
  svg.append("g")
    .attr("transform", `translate(${margin.left}, 0)`)
    .call(d3.axisLeft(y));

  // Append the line path
  svg.append("path")
    .datum(filteredData)
    .attr("fill", "none")
    .attr("stroke", "#00b4d8") // Pacific Cyan line
    .attr("stroke-width", 2)
    .attr("d", line);

  // Add circles for data points
  svg.selectAll(".dot")
    .data(filteredData)
    .join("circle")
    .attr("class", "dot")
    .attr("cx", (d) => x(d.Year) + x.bandwidth() / 2)
    .attr("cy", (d) => y(d.Close))
    .attr("r", 4)
    .attr("fill", "#00b4d8") // Same as line color
    .attr("opacity", 0.7)
    .attr("stroke", "#333")
    // Show tooltip on mouseover
    .on("mouseover", function(event, d) {
      tooltip.transition().duration(200).style("opacity", .9); // Show tooltip
      tooltip.html(`Year: ${d.Year}<br>Close: ${d.Close}`)
        .style("left", `${event.pageX + 5}px`)
        .style("top", `${event.pageY - 28}px`);
    })
    .on("mouseout", function() {
      tooltip.transition().duration(200).style("opacity", 0); // Hide tooltip
    });

  // Add zoom functionality
  const zoom = d3.zoom()
    .scaleExtent([1, 5]) // Set the zoom scale range
    .translateExtent([[0, 0], [width, height]]) // Set the translate extent
    .on("zoom", (event) => {
      svg.selectAll("g").attr("transform", event.transform);
      svg.select("path").attr("d", line.x((d) => event.transform.applyX(x(d.Year) + x.bandwidth() / 2)));
      svg.selectAll(".dot")
        .attr("cx", (d) => event.transform.applyX(x(d.Year) + x.bandwidth() / 2));
    });

  svg.call(zoom);
   // Add x-axis label
svg.append("text")
.attr("class", "x-axis-label")
.attr("text-anchor", "middle")
.attr("x", width / 2)
.attr("y", height - margin.bottom + 30) // Adjust to place below the axis
.attr("fill", "black")
.style("font-size", "12px")
.text("Year");

// Add y-axis label
svg.append("text")
.attr("class", "y-axis-label")
.attr("text-anchor", "middle")
.attr("x", -height / 2)
.attr("y", margin.left-50) // Adjust to place to the left of the axis
.attr("transform", "rotate(-90)") // Rotate for vertical text
.attr("fill", "black")
.style("font-size", "12px")
.text("Close Price");


  console.log("Line Chart created!");
};




 // Create Bar Chart
const createBarChart = (data) => {
  console.log("Creating Bar Chart...");
  const svg = d3.select("#barChart");
  svg.selectAll("*").remove();

  const width = 600,
    height = 300,
    margin = { top: 20, right: 30, bottom: 50, left: 80 };

  // Filter data for years between 2017 and 2023
  const filteredData = data.filter(d => d.Year >= 2017 && d.Year <= 2023);

  const volumeByYear = d3.rollup(
    filteredData,
    (v) => d3.sum(v, (d) => d.Volume),
    (d) => d.Year
  );
  console.log("Volume by Year (filtered):", volumeByYear);

  const x = d3.scaleBand()
    .domain(Array.from(volumeByYear.keys()))
    .range([margin.left, width - margin.right])
    .padding(0.2);

  const y = d3.scaleLinear()
    .domain([0, d3.max(volumeByYear.values())])
    .nice()
    .range([height - margin.bottom, margin.top]);

  svg.append("g")
    .attr("transform", `translate(0, ${height - margin.bottom})`)
    .call(d3.axisBottom(x).tickSizeOuter(0));

  
  svg.append("g")
    .attr("transform", `translate(${margin.left}, 0)`)
    .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format(".2s"))); // Format Y-axis to scale down large numbers

  // Tooltip for displaying the volume on hover
  const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("background-color", "#333")
    .style("color", "#fff")
    .style("border-radius", "5px")
    .style("padding", "5px")
    .style("opacity", 0);

  // Create bars with hover interactions
  svg.selectAll(".bar")
    .data(Array.from(volumeByYear))
    .join("rect")
    .attr("x", ([year]) => x(year))
    .attr("y", ([, volume]) => y(volume))
    .attr("height", ([, volume]) => height - margin.bottom - y(volume))
    .attr("width", x.bandwidth())
    .attr("fill", "#48cae4") // Vivid Sky Blue bars
    .on("mouseover", function(event, d) {
      tooltip.transition().duration(200).style("opacity", .9); // Show tooltip
      tooltip.html(`Year: ${d[0]}<br>Volume: ${d[1]}`) // Display year and volume in tooltip
        .style("left", `${event.pageX + 5}px`)
        .style("top", `${event.pageY - 28}px`);
    })
    .on("mouseout", function() {
      tooltip.transition().duration(200).style("opacity", 0); // Hide tooltip
    });
    // Add x-axis label
svg.append("text")
.attr("class", "x-axis-label")
.attr("text-anchor", "middle")
.attr("x", width / 2)
.attr("y", height - margin.bottom + 30)
.attr("fill", "black")
.style("font-size", "12px")
.text("Year");

// Add y-axis label
svg.append("text")
.attr("class", "y-axis-label")
.attr("text-anchor", "middle")
.attr("x", -height / 2)
.attr("y", margin.left - 50)
.attr("transform", "rotate(-90)")
.attr("fill", "black")
.style("font-size", "12px")
.text("Total Volume");

  console.log("Bar Chart created!");
};


  // Create Candlestick Chart
const createCandlestickChart = (data) => {
  console.log("Creating Candlestick Chart...");
  const svg = d3.select("#candlestickChart");
  svg.selectAll("*").remove();

  const width = 600,
    height = 300,
    margin = { top: 20, right: 30, bottom: 50, left: 80 };

  // Filter data for years between 2017 and 2023
  const filteredData = data.filter(d => d.Year >= 2017 && d.Year <= 2023);

  // Set up the X and Y scales
  const x = d3.scaleBand()
    .domain(filteredData.map((d) => d.Year))
    .range([margin.left, width - margin.right])
    .padding(0.2);

  const y = d3.scaleLinear()
    .domain([d3.min(filteredData, (d) => d.Low), d3.max(filteredData, (d) => d.High)])
    .nice()
    .range([height - margin.bottom, margin.top]);

  // Add X and Y axis
  svg.append("g")
    .attr("transform", `translate(0, ${height - margin.bottom})`)
    .call(d3.axisBottom(x).tickSizeOuter(0));

  svg.append("g")
    .attr("transform", `translate(${margin.left}, 0)`)
    .call(d3.axisLeft(y));

  // Tooltip for displaying information on hover
  const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("background-color", "#333")
    .style("color", "#fff")
    .style("border-radius", "5px")
    .style("padding", "5px")
    .style("opacity", 0);

  // Draw candlesticks: lines for highs and lows, rectangles for open/close
  svg.selectAll(".candle")
    .data(filteredData)
    .join("line")
    .attr("class", "candle")
    .attr("x1", (d) => x(d.Year) + x.bandwidth() / 2)
    .attr("x2", (d) => x(d.Year) + x.bandwidth() / 2)
    .attr("y1", (d) => y(d.Low))
    .attr("y2", (d) => y(d.High))
    .attr("stroke", "#0077b6")
    .attr("stroke-width", 2)
    .on("mouseover", function(event, d) {
      tooltip.transition().duration(200).style("opacity", .9); // Show tooltip
      tooltip.html(`Year: ${d.Year}<br>Open: ${d.Open}<br>Close: ${d.Close}<br>High: ${d.High}<br>Low: ${d.Low}`)
        .style("left", `${event.pageX + 5}px`)
        .style("top", `${event.pageY - 28}px`);
    })
    .on("mouseout", function() {
      tooltip.transition().duration(200).style("opacity", 0); // Hide tooltip
    });

  svg.selectAll(".rect")
    .data(filteredData)
    .join("rect")
    .attr("class", "rect")
    .attr("x", (d) => x(d.Year))
    .attr("y", (d) => y(Math.max(d.Open, d.Close)))
    .attr("width", x.bandwidth())
    .attr("height", (d) => Math.abs(y(d.Open) - y(d.Close)))
    .attr("fill", (d) => (d.Close > d.Open ? "#48cae4" : "#ff6f61"))
    .attr("stroke", "#333")
    .on("mouseover", function(event, d) {
      tooltip.transition().duration(200).style("opacity", .9); // Show tooltip
      tooltip.html(`Year: ${d.Year}<br>Open: ${d.Open}<br>Close: ${d.Close}<br>High: ${d.High}<br>Low: ${d.Low}`)
        .style("left", `${event.pageX + 5}px`)
        .style("top", `${event.pageY - 28}px`);
    })
    .on("mouseout", function() {
      tooltip.transition().duration(200).style("opacity", 0); // Hide tooltip
    });
    // Add x-axis label
svg.append("text")
.attr("class", "x-axis-label")
.attr("text-anchor", "middle")
.attr("x", width / 2)
.attr("y", height - margin.bottom + 30)
.attr("fill", "black")
.style("font-size", "12px")
.text("Year");

// Add y-axis label
svg.append("text")
.attr("class", "y-axis-label")
.attr("text-anchor", "middle")
.attr("x", -height / 2)
.attr("y", margin.left - 50)
.attr("transform", "rotate(-90)")
.attr("fill", "black")
.style("font-size", "12px")
.text("Price Range (High-Low)");


  console.log("Candlestick Chart created!");
};

// Create Risk-Reward Chart
const createRiskRewardChart = (data) => {
  console.log("Creating Risk-Reward Chart...");
  const svg = d3.select("#riskRewardChart");
  svg.selectAll("*").remove();

  const width = 600,
    height = 300,
    margin = { top: 20, right: 30, bottom: 50, left: 80 };

  // Filter data for years between 2017 and 2023
  const filteredData = data.filter(d => d.Year >= 2017 && d.Year <= 2023);

  // Prepare the risk-reward data
  const riskRewardData = filteredData.map((d) => ({
    year: d.Year,
    range: d.High - d.Low,
    gain: d.Close - d.Open,
  }));

  // Set up the X and Y scales
  const x = d3.scaleBand()
    .domain(riskRewardData.map((d) => d.year))
    .range([margin.left, width - margin.right])
    .padding(0.2);

  const y = d3.scaleLinear()
    .domain([0, d3.max(riskRewardData, (d) => d.range)]) // Adjusted to ensure Y-axis doesn't go below 0
    .nice()
    .range([height - margin.bottom, margin.top]);

  // Add X and Y axis
  svg.append("g")
    .attr("transform", `translate(0, ${height - margin.bottom})`)
    .call(d3.axisBottom(x).tickSizeOuter(0));

  svg.append("g")
    .attr("transform", `translate(${margin.left}, 0)`)
    .call(d3.axisLeft(y));

  // Tooltip for displaying information on hover
  const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("background-color", "#333")
    .style("color", "#fff")
    .style("border-radius", "5px")
    .style("padding", "5px")
    .style("opacity", 0);

  // Draw bars for risk-reward data
  svg.selectAll(".bar")
    .data(riskRewardData)
    .join("rect")
    .attr("class", "bar")
    .attr("x", (d) => x(d.year))
    .attr("y", (d) => y(d.range))
    .attr("height", (d) => height - margin.bottom - y(d.range))
    .attr("width", x.bandwidth())
    .attr("fill", (d) => (d.gain > 0 ? "#00e0c7" : "#ff6f61")) // Green for gain, red for loss
    .on("mouseover", function(event, d) {
      tooltip.transition().duration(200).style("opacity", .9); // Show tooltip
      tooltip.html(`Year: ${d.year}<br>Range: ${d.range.toFixed(2)}<br>Gain: ${d.gain.toFixed(2)}`)
        .style("left", `${event.pageX + 5}px`)
        .style("top", `${event.pageY - 28}px`);
    })
    .on("mouseout", function() {
      tooltip.transition().duration(200).style("opacity", 0); // Hide tooltip
    });
    // Add x-axis label
svg.append("text")
.attr("class", "x-axis-label")
.attr("text-anchor", "middle")
.attr("x", width / 2)
.attr("y", height - margin.bottom + 30)
.attr("fill", "black")
.style("font-size", "12px")
.text("Year");

// Add y-axis label
svg.append("text")
.attr("class", "y-axis-label")
.attr("text-anchor", "middle")
.attr("x", -height / 2)
.attr("y", margin.left - 50)
.attr("transform", "rotate(-90)")
.attr("fill", "black")
.style("font-size", "12px")
.text("Risk-Reward Range");

  console.log("Risk-Reward Chart created!");
};

    
  // Create Scatter Plot
const createScatterPlot = (data) => {
  console.log("Creating Scatter Plot...");
  const svg = d3.select("#scatterPlot");
  svg.selectAll("*").remove();

  const width = 600,
    height = 300,
    margin = { top: 20, right: 30, bottom: 50, left: 80 };

  // Define scales for X and Y axes
  const x = d3.scaleLinear()
    .domain(d3.extent(data, (d) => d.High))
    .nice()
    .range([margin.left, width - margin.right]);

  const y = d3.scaleLinear()
    .domain(d3.extent(data, (d) => d.Low))
    .nice()
    .range([height - margin.bottom, margin.top]);

  // Add X and Y axis
  svg.append("g")
    .attr("transform", `translate(0, ${height - margin.bottom})`)
    .call(d3.axisBottom(x));

  svg.append("g")
    .attr("transform", `translate(${margin.left}, 0)`)
    .call(d3.axisLeft(y));
    // Add x-axis label
    svg.append("text")
      .attr("class", "x-axis-label")
      .attr("text-anchor", "middle")
      .attr("x", width / 2)
      .attr("y", height - margin.bottom + 40) // Adjust for spacing
      .attr("fill", "black")
      .style("font-size", "12px")
      .text("High Value");
  
    // Add y-axis label
    svg.append("text")
      .attr("class", "y-axis-label")
      .attr("text-anchor", "middle")
      .attr("x", -(height / 2))
      .attr("y", margin.left - 50) // Adjust for spacing
      .attr("transform", "rotate(-90)")
      .attr("fill", "black")
      .style("font-size", "12px")
      .text("Low Value");
  // Tooltip for interactivity
  const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("background-color", "#333")
    .style("color", "#fff")
    .style("border-radius", "5px")
    .style("padding", "5px")
    .style("opacity", 0);

  // Add circles for scatter plot points
  svg.selectAll(".dot")
    .data(data)
    .join("circle")
    .attr("class", "dot")
    .attr("cx", (d) => x(d.High))
    .attr("cy", (d) => y(d.Low))
    .attr("r", 4)
    .attr("fill", "#0077b6") // Honolulu Blue
    .attr("opacity", 0.7)
    .attr("stroke", "#333")
    // Show tooltip on mouseover
    .on("mouseover", function(event, d) {
      tooltip.transition().duration(200).style("opacity", .9); // Show tooltip
      tooltip.html(`High: ${d.High}<br>Low: ${d.Low}`)
        .style("left", `${event.pageX + 5}px`)
        .style("top", `${event.pageY - 28}px`);
    })
    .on("mouseout", function() {
      tooltip.transition().duration(200).style("opacity", 0); // Hide tooltip
    });
    

  console.log("Scatter Plot created!");
};


  return (
   
      <div className="dashboard-container">
      <h1 className="dashboard-title">Cryptocurrency Analysis</h1>
      <div className="p-4">
      <Frame
        options={cryptocurrencies}
        selected={selectedCrypto}
        onSelect={setSelectedCrypto}
      />
       {/* KPI CARDs */}
      <div className="kpi-cards-container mb-8 flex justify-between space-x-4">
              {/* Total Volume */}
                  <div className="kpi-card">
                    <h3>Total Volume</h3>
                    <p>
                      {d3.sum(data, (d) => d.Volume) ? d3.sum(data, (d) => d.Volume).toLocaleString() : "N/A"}
                    </p>
                  </div>
          
                {/* Highest Price */}
                <div className="kpi-card">
                  <h3>Highest Price</h3>
                  <p>
                    {d3.max(data, (d) => d.High) ? d3.max(data, (d) => d.High).toLocaleString() : "N/A"}
                  </p>
                </div>
                
                {/* Lowest Price */}
                <div className="kpi-card">
                  <h3>Lowest Price</h3>
                  <p>
                    {d3.min(data, (d) => d.Low) ? d3.min(data, (d) => d.Low).toLocaleString() : "N/A"}
                  </p>
                </div>
                
                {/* Average Price */}
                <div className="kpi-card">
                  <h3>Average Price</h3>
                  <p>
                    {d3.mean(data, (d) => d.Close) ? d3.mean(data, (d) => d.Close).toLocaleString() : "N/A"}
                  </p>
                </div>
                
                {/* Year-to-Date Gain */}
                <div className="kpi-card">
                  <h3>YTD Gain</h3>
                  <p>
                    {d3.mean(data, (d) => d["YTD Gain"]) ? d3.mean(data, (d) => d["YTD Gain"]).toLocaleString() : "N/A"}
                  </p>
                </div>

                {/* Open Price */}
                <div className="kpi-card">
                  <h3>Open Price</h3>
                  <p>
                    {d3.mean(data, (d) => d.Open) ? d3.mean(data, (d) => d.Open).toLocaleString() : "N/A"}
                  </p>
                </div>
                {/* Close Price */}
                <div className="kpi-card">
                  <h3>Close Price</h3>
                  <p>
                    {d3.mean(data, (d) => d.Close) ? d3.mean(data, (d) => d.Close).toLocaleString() : "N/A"}
                  </p>
                </div>
      </div>
      {/* Main Charts Grid */}
      <div className="grid grid-cols-5 gap-2">
                <div className="relative bg-white shadow-md p-4 rounded">
                  <h2 className="text-xl font-semibold text-gray-700 mb-4">Price Over Time</h2>
                  <svg id="lineChart" width={600} height={300}></svg>
                  <p className="text-sm text-gray-500 mt-2">
                  The line chart displays the annual closing prices of cryptocurrencies from 2017 to 2023. By analyzing the trends,
                   viewers can identify periods of growth and decline, helping to understand the market's overall performance and
                    stability over the years.</p>

                </div>
                <div className="relative bg-white shadow-md p-4 rounded">
                  <h2 className="text-xl font-semibold text-gray-700 mb-4">Volume by Year</h2>
                  <svg id="barChart" width={600} height={300}></svg>
                  <p className="text-sm text-gray-500 mt-2">
                    This chart shows the total trading volume of the cryptocurrency for each year. High trading volumes indicate strong investor interest and liquidity, suggesting a healthier market for investment opportunities.
                  </p>
                </div>
                <div className="relative bg-white shadow-md p-4 rounded">
                  <h2 className="text-xl font-semibold text-gray-700 mb-4">Price vs. Low</h2>
                  <svg id="scatterPlot" width={600} height={300}></svg>
                  <p className="text-sm text-gray-500 mt-2">
                    This scatter plot visualizes the relationship between the high and low prices of the cryptocurrency over time. It helps in understanding the price fluctuations, which can signal market volatility, a key factor in investment decisions.
                  </p>
                </div>
                <div className="relative bg-white shadow-md p-4 rounded">
                  <h2 className="text-xl font-semibold text-gray-700 mb-4">Candlestick Chart</h2>
                  <svg id="candlestickChart" width={600} height={300}></svg>
                  <p className="text-sm text-gray-500 mt-2">
                    This chart shows the volatility of the cryptocurrency by visualizing the open, high, low, and close prices for each year. Higher volatility can indicate greater risk, which is crucial when determining the safety of an investment.
                  </p>
                </div>
                <div className="relative bg-white shadow-md p-4 rounded">
                  <h2 className="text-xl font-semibold text-gray-700 mb-4">Risk-Reward Chart</h2>
                  <svg id="riskRewardChart" width={600} height={300}></svg>
                  <p className="text-sm text-gray-500 mt-2">
                    This chart evaluates the risk and reward by comparing the range of price movement and the net gain or loss for each year. A higher reward with lower risk suggests a safer investment, while a higher risk may indicate less favorable conditions for long-term investment.
                    </p>
                </div>
        </div>
      </div>
    </div>
  );
};
