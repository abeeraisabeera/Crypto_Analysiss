"use client";

import { useEffect, useMemo, useState } from "react";
import CorrelationHeatmap from "../components/dashboard/CorrelationHeatmap";
import HeroSection from "../components/dashboard/HeroSection";
import MainChart from "../components/dashboard/MainChart";
import MetricsGrid from "../components/dashboard/MetricsGrid";
import RiskRewardChart from "../components/dashboard/RiskRewardChart";
import TopBar from "../components/dashboard/TopBar";
import { ASSETS, loadAsset } from "../utils/dataLoader";
import { computeHeroStats, computeMetricCards } from "../utils/metrics";
import { useTheme } from "../hooks/useTheme";
import * as d3 from "d3";

export default function CryptoDashboard() {
  const { theme, toggle, mounted } = useTheme();
  const [selectedCrypto, setSelectedCrypto] = useState("BTC-USD");
  const [data, setData] = useState([]);
  const [allData, setAllData] = useState({});
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const entries = await Promise.all(ASSETS.map(async (asset) => [asset, await loadAsset(asset)]));
      if (!cancelled) setAllData(Object.fromEntries(entries));
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const rows = allData[selectedCrypto];
    if (!rows?.length) return;

    let cancelled = false;
    setLoading(true);
    setFade(false);

    const show = () => {
      if (cancelled) return;
      setData(rows);
      setLastUpdated(new Date());
      setLoading(false);
      requestAnimationFrame(() => !cancelled && setFade(true));
    };

    const t = setTimeout(show, 50);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [selectedCrypto, allData]);

  const marketYtdAvg = useMemo(() => {
    const values = ASSETS.map((a) => allData[a]?.[allData[a]?.length - 1]?.ytdGain).filter((v) => v != null);
    return values.length ? d3.mean(values) : 0;
  }, [allData]);

  const allVolatilities = useMemo(() => {
    return ASSETS.map((a) => {
      const rows = allData[a];
      if (!rows?.length) return 0;
      const last = rows[rows.length - 1];
      return last.high - last.low;
    }).filter(Boolean);
  }, [allData]);

  const heroStats = useMemo(() => (data.length ? computeHeroStats(data) : null), [data]);
  const metrics = useMemo(
    () => (data.length ? computeMetricCards(data, marketYtdAvg) : null),
    [data, marketYtdAvg]
  );

  const handleSelect = (asset) => {
    if (asset === selectedCrypto) return;
    setFade(false);
    setSelectedCrypto(asset);
  };

  return (
    <div className="dashboard-shell min-h-screen bg-bg text-primary">
      <div className="mx-auto max-w-[1600px] px-6 py-6">
        <TopBar
          selected={selectedCrypto}
          onSelect={handleSelect}
          theme={theme}
          onToggleTheme={toggle}
          lastUpdated={lastUpdated}
          mounted={mounted}
        />

        <main className={`mt-6 flex flex-col gap-6 transition-opacity duration-300 ${fade ? "opacity-100" : "opacity-0"}`}>
          <HeroSection asset={selectedCrypto} stats={heroStats} loading={loading} />
          <MetricsGrid metrics={metrics} loading={loading} />
          <MainChart data={data} asset={selectedCrypto} loading={loading} />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <CorrelationHeatmap data={data} asset={selectedCrypto} loading={loading} />
            <RiskRewardChart
              data={data}
              asset={selectedCrypto}
              allVolatilities={allVolatilities}
              loading={loading}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
