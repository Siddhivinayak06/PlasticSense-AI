'use client';

import { KPIGrid } from '@/features/analytics/KPIGrid';
import { InsightCards } from '@/features/analytics/InsightCards';
import { TimeSeriesChart } from '@/features/analytics/TimeSeriesChart';
import { PlasticDistributionChart } from '@/features/analytics/PlasticDistributionChart';
import { mockKPIs, mockInsights, mockTimeSeriesData, mockPlasticDistribution } from '@/mock/analytics';

export default function AnalyticsOverviewPage() {
  return (
    <div className="space-y-6">
      <KPIGrid kpis={mockKPIs} />
      
      <InsightCards insights={mockInsights} />
      
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <TimeSeriesChart data={mockTimeSeriesData} />
        </div>
        <div>
          <PlasticDistributionChart data={mockPlasticDistribution} />
        </div>
      </div>
    </div>
  );
}