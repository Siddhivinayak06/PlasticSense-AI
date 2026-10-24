'use client';

import { useMemo } from 'react';
import { PlasticDistributionChart } from '@/features/analytics/PlasticDistributionChart';
import { LocationAnalyticsChart } from '@/features/analytics/LocationAnalyticsChart';
import { HotspotRankingTable } from '@/features/analytics/HotspotRankingTable';
import { useInsights, toLocationData } from '@/hooks/useInsights';
import { PageLoader } from '@/components/shared/PageLoader';
import { DataNote, QueryError } from '@/components/shared/QueryError';
import type { PlasticDistributionData } from '@/types/analytics';

const PALETTE = ['#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6', '#94a3b8'];
const GROUP_COLORS: Record<string, string> = {
  plastic: '#0ea5e9', glass: '#10b981', metal: '#64748b', paper: '#f59e0b',
  cardboard: '#f97316', hazardous: '#ef4444', other: '#9ca3af',
};

function prettify(label: string) {
  return label.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function toShares(raw: [string, number][], top = 7): PlasticDistributionData[] {
  // Older records stored the same class with different casing ("plastic" vs "Plastic").
  const merged = new Map<string, [string, number]>();
  for (const [name, n] of raw) {
    const key = name.trim().toLowerCase();
    const prev = merged.get(key);
    merged.set(key, [prev?.[0] ?? name, (prev?.[1] ?? 0) + n]);
  }
  const entries = [...merged.values()];
  const total = entries.reduce((a, [, n]) => a + n, 0);
  if (!total) return [];
  const sorted = [...entries].sort((a, b) => b[1] - a[1]);
  const head = sorted.slice(0, top);
  const rest = sorted.slice(top).reduce((a, [, n]) => a + n, 0);
  const rows = head.map(([name, n], i) => ({ name: prettify(name), value: Math.round((n / total) * 1000) / 10, fill: PALETTE[i % PALETTE.length] }));
  if (rest) rows.push({ name: 'All other classes', value: Math.round((rest / total) * 1000) / 10, fill: '#cbd5e1' });
  return rows;
}

export default function MaterialInsightsPage() {
  const { data, isLoading, isError, refetch } = useInsights();

  const plasticClasses = useMemo(
    () => toShares((data?.class_distribution ?? []).filter((c) => c.waste_group === 'plastic').map((c) => [c.class_name, c.count])),
    [data],
  );
  const groups = useMemo(() => {
    const totals = new Map<string, number>();
    for (const c of data?.class_distribution ?? []) totals.set(c.waste_group, (totals.get(c.waste_group) ?? 0) + c.count);
    const total = [...totals.values()].reduce((a, b) => a + b, 0);
    return [...totals.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([g, n]) => ({ name: prettify(g), value: total ? Math.round((n / total) * 1000) / 10 : 0, fill: GROUP_COLORS[g] ?? '#94a3b8' }));
  }, [data]);

  if (isLoading) return <PageLoader label="Computing material insights…" />;
  if (isError || !data) return <QueryError onRetry={() => refetch()} />;

  const locations = toLocationData(data.locations);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PlasticDistributionChart
          data={groups}
          title="Material Composition"
          description="Share of all detected objects by material group."
        />
        <PlasticDistributionChart
          data={plasticClasses}
          title="Plastic Items by Detector Class"
          description="Share of plastic detections by the class label the detector assigned."
        />
      </div>
      <DataNote>
        Class labels are the object categories the detection model was trained on (e.g. bottle, bag, cup). They describe
        object type, not a laboratory-verified polymer or resin identification.
      </DataNote>
      <LocationAnalyticsChart data={locations} />
      <HotspotRankingTable data={locations} />
    </div>
  );
}
