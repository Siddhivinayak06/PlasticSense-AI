'use client';

import { AIAnalyticsGrid } from '@/features/analytics/AIAnalyticsGrid';
import { CleanupPerformanceChart } from '@/features/analytics/CleanupPerformanceChart';
import { mockAIAnalytics, mockCleanupPerformance } from '@/mock/analytics';
import { PrototypeBanner } from '@/components/shared/PrototypeBanner';

export default function PerformanceMetricsPage() {
  return (
    <div className="space-y-6">
      <PrototypeBanner
        feature="AI performance and cleanup-completion history"
        requirement="Model accuracy metrics require a labelled evaluation set; cleanup history requires completed assignment records."
      />
      <AIAnalyticsGrid data={mockAIAnalytics} />
      
      <div className="grid grid-cols-1">
        <CleanupPerformanceChart data={mockCleanupPerformance} />
      </div>
    </div>
  );
}
