"use client";

import { useEffect, useState } from 'react';
import { fetchGlobalStat } from '../lib/accessibilityCloud';

interface StatItem {
  label: string;
  seriesName: string;
  value: number | null;
}

const SERIES: { label: string; seriesName: string }[] = [
  { label: 'Places tracked', seriesName: 'PlaceInfos.withoutDrafts.count' },
  { label: 'Data sources', seriesName: 'Sources.withoutDrafts.count' },
  { label: 'Broken elevators (live)', seriesName: 'EquipmentInfos.withoutDrafts.onlyBrokenElevators.count' },
];

export function StatsBar() {
  const [stats, setStats] = useState<StatItem[]>(SERIES.map((s) => ({ ...s, value: null })));

  useEffect(() => {
    let cancelled = false;
    SERIES.forEach((s, i) => {
      fetchGlobalStat(s.seriesName)
        .then((res) => {
          if (cancelled) return;
          const value = res.results[0]?.value ?? null;
          setStats((prev) => {
            const next = [...prev];
            next[i] = { ...s, value };
            return next;
          });
        })
        .catch((e) => console.warn('[fetchGlobalStat]', s.seriesName, e));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 px-4 py-2.5 flex gap-5">
      {stats.map((s) => (
        <div key={s.label} className="flex flex-col">
          <span className="text-[11px] uppercase tracking-wide text-gray-400 font-medium">{s.label}</span>
          <span className="text-lg font-semibold text-gray-900 tabular-nums">
            {s.value === null ? '—' : s.value.toLocaleString()}
          </span>
        </div>
      ))}
      <span className="text-[10px] text-gray-300 self-end pb-0.5">accessibility.cloud</span>
    </div>
  );
}