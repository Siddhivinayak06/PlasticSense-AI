'use client';

import { useQuery } from '@tanstack/react-query';
import { KPIGrid } from '@/features/analytics/KPIGrid';
import { InsightCards } from '@/features/analytics/InsightCards';
import { TimeSeriesChart } from '@/features/analytics/TimeSeriesChart';
import { WasteDistributionChart } from '@/features/analytics/WasteDistributionChart';
import { mockInsights, mockTimeSeriesData } from '@/mock/analytics';
import { fetchStatistics } from '@/services/analytics';
import { Loader2 } from 'lucide-react';
import type { KPI } from '@/types/analytics';

export default function AnalyticsOverviewPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['statistics'],
    queryFn: fetchStatistics,
  });

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const kpis: KPI[] = data ? [
    {
      id: 'total',
      title: 'Total Detections',
      value: data.total_detections.toLocaleString(),
      percentageChange: 0,
      trend: 'neutral',
      sparklineData: [{ date: '1', value: 0 }, { date: '2', value: 0 }],
    },
    {
      id: 'objects',
      title: 'Total Objects',
      value: Object.values(data.waste_breakdown).reduce((a, b) => a + b, 0).toLocaleString(),
      percentageChange: 0,
      trend: 'neutral',
      sparklineData: [{ date: '1', value: 0 }, { date: '2', value: 0 }],
    },
    {
      id: 'plastic',
      title: 'Plastic Waste',
      value: (data.waste_breakdown.plastic || 0).toLocaleString(),
      percentageChange: 0,
      trend: 'neutral',
      sparklineData: [{ date: '1', value: 0 }, { date: '2', value: 0 }],
    }
  ] : [];

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      <KPIGrid kpis={kpis} />
      
      {/* InsightCards and TimeSeriesChart left mocked until backend adds time-series endpoint */}
      <InsightCards insights={mockInsights} />
      
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <TimeSeriesChart data={mockTimeSeriesData} />
        </div>
        <div>
          {data && <WasteDistributionChart breakdown={data.waste_breakdown} />}
        </div>
      </div>
    </div>
  );
}