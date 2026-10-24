'use client';

import { useQuery } from '@tanstack/react-query';
import { KPIGrid } from '@/features/analytics/KPIGrid';
import { InsightCards } from '@/features/analytics/InsightCards';
import { TimeSeriesChart } from '@/features/analytics/TimeSeriesChart';
import { WasteDistributionChart } from '@/features/analytics/WasteDistributionChart';
import { fetchStatistics, fetchAnalytics } from '@/services/analytics';
import { fetchHotspots } from '@/services/hotspots';
import { EmptyState } from '@/components/shared/EmptyState';
import { QueryError } from '@/components/shared/QueryError';
import { Loader2, ShieldAlert, BarChart3 } from 'lucide-react';
import type { KPI, Insight, TimeSeriesData } from '@/types/analytics';
import { useMemo } from 'react';

/** Last 7 days vs the 7 before, from real daily counts. Null without enough history. */
function weekOverWeek(series: { total: number }[]): { change: number | null; trend: KPI['trend'] } {
  if (series.length < 14) return { change: null, trend: 'neutral' };
  const last = series.slice(-7).reduce((a, d) => a + d.total, 0);
  const prev = series.slice(-14, -7).reduce((a, d) => a + d.total, 0);
  if (prev === 0) return { change: null, trend: 'neutral' };
  const change = Math.round(((last - prev) / prev) * 1000) / 10;
  return { change, trend: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral' };
}

export default function AnalyticsOverviewPage() {
  const statsQuery = useQuery({ queryKey: ['statistics'], queryFn: fetchStatistics });
  const analyticsQuery = useQuery({ queryKey: ['analytics'], queryFn: fetchAnalytics });
  const hotspotsQuery = useQuery({ queryKey: ['hotspots'], queryFn: fetchHotspots });
  const stats = statsQuery.data;
  const analytics = analyticsQuery.data;
  const isStatsLoading = statsQuery.isLoading;
  const isAnalyticsLoading = analyticsQuery.isLoading;

  const totalDetections = stats?.total_detections ?? 0;
  const totalObjects = stats ? Object.values(stats.waste_breakdown).reduce((a, b) => a + b, 0) : 0;
  const plasticCount = stats?.waste_breakdown?.plastic ?? 0;
  const series = useMemo(() => analytics?.time_series ?? [], [analytics]);
  const { change, trend } = weekOverWeek(series);

  const kpis: KPI[] = [
    {
      id: 'total',
      title: 'Total Reports',
      value: totalDetections.toLocaleString(),
      percentageChange: change,
      trend,
      sparklineData: series.slice(-14).map((d) => ({ date: d.date, value: d.total })),
      hint: 'Images analysed and stored',
    },
    {
      id: 'objects',
      title: 'Waste Objects Detected',
      value: totalObjects.toLocaleString(),
      percentageChange: null,
      trend: 'neutral',
      sparklineData: [],
      hint: totalDetections ? `${(totalObjects / totalDetections).toFixed(1)} per report on average` : undefined,
    },
    {
      id: 'plastic',
      title: 'Plastic Items',
      value: plasticCount.toLocaleString(),
      percentageChange: null,
      trend: 'neutral',
      sparklineData: [],
      hint: totalObjects ? `${((plasticCount / totalObjects) * 100).toFixed(1)}% of all objects` : undefined,
    },
    {
      id: 'hotspots',
      title: 'Observed Hotspots',
      value: hotspotsQuery.data ? hotspotsQuery.data.total_hotspots.toString() : '—',
      percentageChange: null,
      trend: 'neutral',
      sparklineData: [],
      hint: 'Clusters of geolocated reports',
    },
  ];

  const timeSeriesData: TimeSeriesData[] = useMemo(
    () => series.map((ts) => ({ date: ts.date, isoDate: ts.iso_date, total: ts.total, resolved: ts.resolved, critical: ts.critical })),
    [series],
  );

  const insights: Insight[] = useMemo(
    () =>
      (analytics?.insights ?? []).map((ins) => ({
        id: ins.id,
        type: ins.type === 'warning' ? 'alert' : ins.type === 'success' ? 'positive' : 'neutral',
        message: `${ins.title} — ${ins.description}`,
        timestamp: 'Live',
      })),
    [analytics?.insights],
  );

  if (statsQuery.isError || analyticsQuery.isError) {
    return <QueryError onRetry={() => { statsQuery.refetch(); analyticsQuery.refetch(); }} />;
  }

  if (isStatsLoading && isAnalyticsLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      <KPIGrid kpis={kpis} />

      {totalDetections === 0 && (
        <EmptyState
          title="No reports analysed yet"
          description="Upload an image on the Detect page; analytics are computed from stored results."
        />
      )}

      {/* Insights computed from database state */}
      {insights.length > 0 && <InsightCards insights={insights} />}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <TimeSeriesChart data={timeSeriesData} />
        </div>
        <div>
          {stats && <WasteDistributionChart breakdown={stats.waste_breakdown} />}
        </div>
      </div>

      {/* Severity & Risk Score Distribution from DB */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <ShieldAlert className="size-4 text-orange-500" />
              Pollution Severity Breakdown
            </h3>
            <div className="grid grid-cols-4 gap-3 text-center">
              {Object.entries(analytics.severity_breakdown).map(([level, count]) => (
                <div key={level} className="bg-muted/30 rounded-xl p-3">
                  <p className="text-[10px] uppercase font-semibold text-muted-foreground">{level}</p>
                  <p className="text-xl font-bold text-foreground mt-1">{count}</p>
                  <p className="text-[10px] text-muted-foreground">sites</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <BarChart3 className="size-4 text-primary" />
              Risk Score Distribution
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              {Object.entries(analytics.risk_distribution).map(([bucket, count]) => (
                <div key={bucket} className="bg-muted/30 rounded-xl p-3">
                  <p className="text-[10px] uppercase font-semibold text-muted-foreground">{bucket.split(' ')[0]}</p>
                  <p className="text-xl font-bold text-foreground mt-1">{count}</p>
                  <p className="text-[10px] text-muted-foreground">{bucket.split(' ')[1]}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}