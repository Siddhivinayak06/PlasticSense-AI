'use client';

import { AIAnalyticsGrid } from '@/features/analytics/AIAnalyticsGrid';
import { CleanupPerformanceChart } from '@/features/analytics/CleanupPerformanceChart';
import { mockAIAnalytics, mockCleanupPerformance } from '@/mock/analytics';

export default function PerformanceMetricsPage() {
  return (
    <div className="space-y-6">
      <AIAnalyticsGrid data={mockAIAnalytics} />
      
      <div className="grid grid-cols-1">
        <CleanupPerformanceChart data={mockCleanupPerformance} />
      </div>
    </div>
  );
}
