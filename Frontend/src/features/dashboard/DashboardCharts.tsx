'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchDashboardSummary } from '@/services/analytics';
import { WasteDistributionChart } from '@/features/analytics/WasteDistributionChart';
import { Loader2 } from 'lucide-react';

export function DashboardCharts() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboardSummary'],
    queryFn: fetchDashboardSummary,
  });

  if (isLoading) {
    return (
      <div className="flex h-[350px] items-center justify-center rounded-2xl border border-border/50 bg-muted/20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <WasteDistributionChart breakdown={data.breakdown} />
  );
}
