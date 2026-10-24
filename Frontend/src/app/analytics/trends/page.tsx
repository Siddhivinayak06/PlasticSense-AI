'use client';

import { useQuery } from '@tanstack/react-query';
import { TimeSeriesChart } from '@/features/analytics/TimeSeriesChart';
import { SeverityAnalysisChart } from '@/features/analytics/SeverityAnalysisChart';
import { CleanupPerformanceChart } from '@/features/analytics/CleanupPerformanceChart';
import { fetchAnalytics } from '@/services/analytics';
import { useInsights, toCleanupPerformance } from '@/hooks/useInsights';
import { PageLoader } from '@/components/shared/PageLoader';
import { DataNote, QueryError } from '@/components/shared/QueryError';

export default function TrendsAnalysisPage() {
  const analytics = useQuery({ queryKey: ['analytics'], queryFn: fetchAnalytics });
  const insights = useInsights();

  if (analytics.isLoading || insights.isLoading) return <PageLoader label="Computing trends…" />;
  if (analytics.isError || insights.isError || !analytics.data || !insights.data) {
    return <QueryError onRetry={() => { analytics.refetch(); insights.refetch(); }} />;
  }

  const series = analytics.data.time_series.map((t) => ({
    date: t.date, isoDate: t.iso_date, total: t.total, resolved: t.resolved, critical: t.critical,
  }));
  const severity = insights.data.severity_timeline.map((s) => ({
    name: s.date, low: s.low, medium: s.medium, high: s.high, critical: s.critical,
  }));

  return (
    <div className="space-y-6">
      <DataNote>
        Trends are counted from upload and assessment dates. They describe when reports were submitted, which is not
        a forecast of future waste accumulation.
      </DataNote>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <TimeSeriesChart data={series} />
        <SeverityAnalysisChart data={severity} />
      </div>
      <CleanupPerformanceChart data={toCleanupPerformance(insights.data.cleanup_performance)} />
    </div>
  );
}
