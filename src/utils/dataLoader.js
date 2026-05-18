import Papa from "papaparse";

export const ASSETS = ["BTC-USD", "ETH-USD", "ADA-USD", "LTC-USD", "XRP-USD", "BCH-USD"];

const SERIES_START = new Date(2014, 0, 1);

export function normalizeRows(rows) {
  return rows
    .map((row, index) => {
      const date = new Date(SERIES_START);
      date.setDate(date.getDate() + index);

      return {
        date,
        open: Number(row.Open ?? row.open),
        high: Number(row.High ?? row.high),
        low: Number(row.Low ?? row.low),
        close: Number(row.Close ?? row.close),
        volume: Number(row.Volume ?? row.volume),
        year: Number(row.Year ?? row.year),
        ytdGain: Number(row["YTD Gain"] ?? row.ytdGain ?? 0),
      };
    })
    .filter((d) => !Number.isNaN(d.close) && d.close > 0);
}

export const loadCSV = async (filePath) => {
  const response = await fetch(filePath);
  if (!response.ok) throw new Error(`Failed to load ${filePath}`);
  const csvData = await response.text();

  return new Promise((resolve, reject) => {
    Papa.parse(csvData, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (result) => resolve(normalizeRows(result.data)),
      error: (error) => reject(error),
    });
  });
};

export const loadAsset = (asset) => loadCSV(`/data/${asset}.csv`);

export function filterByRange(data, range) {
  if (!data.length || range === "ALL") return data;
  const last = data[data.length - 1].date;
  const days = { "1M": 30, "3M": 90, "6M": 180, "1Y": 365 }[range] ?? 365;
  const cutoff = new Date(last);
  cutoff.setDate(cutoff.getDate() - days);
  return data.filter((d) => d.date >= cutoff);
}
