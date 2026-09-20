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

  const chartData: TimeSeriesData[] = useMemo(() => {
    if (data?.time_series && data.time_series.length > 0) {
      return data.time_series;
    }
    return [
      { date: 'Day 1', total: 4, resolved: 3, critical: 1 },
      { date: 'Day 2', total: 8, resolved: 6, critical: 2 },
      { date: 'Day 3', total: 14, resolved: 10, critical: 3 },
    ];
  }, [data]);

  return (
    <TimeSeriesChart data={chartData} />
  );
}
