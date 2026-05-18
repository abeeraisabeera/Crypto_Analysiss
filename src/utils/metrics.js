import * as d3 from "d3";

export function pearsonCorrelation(xs, ys) {
  const n = Math.min(xs.length, ys.length);
  if (n < 2) return 0;
  const meanX = d3.mean(xs);
  const meanY = d3.mean(ys);
  let num = 0;
  let denX = 0;
  let denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - meanX;
    const dy = ys[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }
  const den = Math.sqrt(denX * denY);
  return den === 0 ? 0 : num / den;
}

export function computeHeroStats(data) {
  if (!data.length) return null;
  const latest = data[data.length - 1];
  const prev = data.length > 1 ? data[data.length - 2] : latest;
  const changePct = prev.close ? ((latest.close - prev.close) / prev.close) * 100 : 0;
  const sparkline = data.slice(-30).map((d) => d.close);

  return {
    price: latest.close,
    changePct,
    sparkline,
    date: latest.date,
  };
}

export function computeMetricCards(data, marketYtdAvg = 0) {
  if (!data.length) return null;

  const totalVolume = d3.sum(data, (d) => d.volume);
  const highest = d3.max(data, (d) => d.high);
  const lowest = d3.min(data, (d) => d.low);
  const latestYtd = data[data.length - 1].ytdGain;

  const recent = data.slice(-30);
  const prior = data.slice(-60, -30);
  const recentVol = d3.mean(recent, (d) => d.volume) ?? 0;
  const priorVol = d3.mean(prior, (d) => d.volume) ?? recentVol;
  const volChange = priorVol ? ((recentVol - priorVol) / priorVol) * 100 : 0;

  const yearlyAvgVol = d3.mean(data, (d) => d.volume) ?? 1;
  const volVsYearly = (recentVol / yearlyAvgVol) * 100;

  const athThreshold = highest * 0.95;
  const atlThreshold = lowest * 1.05;
  const nearAth = data[data.length - 1].high >= athThreshold;
  const nearAtl = data[data.length - 1].low <= atlThreshold;

  const currentYear = data[data.length - 1].year;
  const yearStart = data.find((d) => d.year === currentYear);
  const ytdFromPrice = yearStart
    ? ((data[data.length - 1].close - yearStart.open) / yearStart.open) * 100
    : latestYtd;

  const benchmarkDelta = latestYtd - marketYtdAvg;

  return {
    totalVolume: { value: totalVolume, context: volChange >= 0 ? `vs last period ${volChange >= 0 ? "+" : ""}${volChange.toFixed(1)}%` : `vs last period ${volChange.toFixed(1)}%`, trend: volChange },
    highest: { value: highest, context: nearAth ? "All-time high" : "52-week peak zone", badge: nearAth ? "All-time high" : null },
    lowest: { value: lowest, context: nearAtl ? "All-time low" : "Historical floor zone", badge: nearAtl ? "All-time low" : null },
    ytd: { value: ytdFromPrice, context: `vs market avg: ${benchmarkDelta >= 0 ? "+" : ""}${benchmarkDelta.toFixed(1)}%`, trend: ytdFromPrice },
    volumeLabel: volVsYearly >= 100 ? "Above average" : `${volVsYearly.toFixed(0)}% of yearly avg`,
  };
}

export function computeRiskPercentile(assetVolatilities, currentVol) {
  if (!assetVolatilities.length) return 50;
  const sorted = [...assetVolatilities].sort((a, b) => a - b);
  const rank = sorted.filter((v) => v > currentVol).length;
  return Math.round((rank / sorted.length) * 100);
}

export function enrichRiskRewardPoints(data) {
  return data.map((d) => ({
    ...d,
    volatility: d.high - d.low,
    returnPct: d.open ? ((d.close - d.open) / d.open) * 100 : 0,
  }));
}
