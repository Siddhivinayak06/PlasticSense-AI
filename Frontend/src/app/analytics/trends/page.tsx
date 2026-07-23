'use client';

import { TimeSeriesChart } from '@/features/analytics/TimeSeriesChart';
import { SeverityAnalysisChart } from '@/features/analytics/SeverityAnalysisChart';
import { CleanupPerformanceChart } from '@/features/analytics/CleanupPerformanceChart';
import { mockTimeSeriesData, mockSeverityData, mockCleanupPerformance } from '@/mock/analytics';

export default function TrendsAnalysisPage() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <TimeSeriesChart data={mockTimeSeriesData} />
        <CleanupPerformanceChart data={mockCleanupPerformance} />
      </div>
      
      <div className="grid grid-cols-1">
        <SeverityAnalysisChart data={mockSeverityData} />
      </div>
    </div>
  );
}
