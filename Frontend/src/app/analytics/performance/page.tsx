'use client';

import { useQuery } from '@tanstack/react-query';
import { ModelPerformanceGrid } from '@/features/analytics/ModelPerformanceGrid';
import { CleanupPerformanceChart } from '@/features/analytics/CleanupPerformanceChart';
import { fetchModelInfo } from '@/services/analytics';
import { useInsights, toCleanupPerformance } from '@/hooks/useInsights';
import { PageLoader } from '@/components/shared/PageLoader';
import { QueryError } from '@/components/shared/QueryError';

export default function PerformanceMetricsPage() {
  const insights = useInsights();
  const modelInfo = useQuery({ queryKey: ['model-info'], queryFn: fetchModelInfo, staleTime: 5 * 60_000 });

  if (insights.isLoading) return <PageLoader label="Computing performance metrics…" />;
  if (insights.isError || !insights.data) return <QueryError onRetry={() => insights.refetch()} />;

  return (
    <div className="space-y-6">
      <ModelPerformanceGrid performance={insights.data.model_performance} modelInfo={modelInfo.data} />
      <CleanupPerformanceChart data={toCleanupPerformance(insights.data.cleanup_performance)} />
    </div>
  );
}
