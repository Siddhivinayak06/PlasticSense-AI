'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchAnalytics } from '@/services/analytics';
import { TimeSeriesChart } from '@/features/analytics/TimeSeriesChart';
import type { TimeSeriesData } from '@/types/analytics';
import { useMemo } from 'react';

export function DashboardTrends() {
  const { data } = useQuery({
    queryKey: ['analytics'],
    queryFn: fetchAnalytics,
  });

  const chartData: TimeSeriesData[] = useMemo(
    () => (data?.time_series ?? []).map((t) => ({ date: t.date, isoDate: t.iso_date, total: t.total, resolved: t.resolved, critical: t.critical })),
    [data],
  );

  if (data && chartData.length === 0) {
    return (
      <div className="glass rounded-3xl p-6 text-center text-sm text-muted-foreground">
        Report volume trends appear after the first image is analysed.
      </div>
    );
  }

  return <TimeSeriesChart data={chartData} />;
}
