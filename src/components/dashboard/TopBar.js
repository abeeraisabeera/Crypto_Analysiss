"use client";

import { Moon, Sun } from "lucide-react";
import { ASSETS } from "../../utils/dataLoader";
import { formatDateTime } from "../../utils/format";

export default function TopBar({ selected, onSelect, theme, onToggleTheme, lastUpdated, mounted }) {
  return (
    <header className="sticky top-0 z-50 -mx-6 border-b border-border bg-bg/90 px-6 py-4 backdrop-blur-md">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <h1 className="text-[32px] font-semibold leading-tight tracking-tight text-primary">
          Cryptocurrency Analysis
        </h1>

        <nav
          className="flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1 lg:justify-center"
          aria-label="Asset selection"
        >
          {ASSETS.map((asset) => (
            <button
              key={asset}
              type="button"
              onClick={() => onSelect(asset)}
              className={`pill-btn shrink-0 snap-start ${asset === selected ? "pill-btn-active" : "pill-btn-inactive"}`}
              aria-pressed={asset === selected}
            >
              {asset}
            </button>
          ))}
        </nav>

        <div className="flex items-center justify-between gap-4 lg:justify-end">
          <button
            type="button"
            onClick={onToggleTheme}
            className="icon-btn"
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {mounted && theme === "dark" ? <Sun size={20} strokeWidth={1.75} /> : <Moon size={20} strokeWidth={1.75} />}
          </button>
          <p className="caption text-secondary whitespace-nowrap">
            Last updated{" "}
            <time dateTime={lastUpdated?.toISOString()}>{lastUpdated ? formatDateTime(lastUpdated) : "—"}</time>
          </p>
        </div>
      </div>
    </header>
  );
}
