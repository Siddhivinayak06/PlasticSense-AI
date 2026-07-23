'use client';

import { AnalyticsHeader } from '@/features/analytics/AnalyticsHeader';
import { AnalyticsFilters } from '@/features/analytics/AnalyticsFilters';
import { AnalyticsTabs } from '@/features/analytics/AnalyticsTabs';

export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-[1600px] mx-auto pb-10 space-y-6">
      <AnalyticsHeader 
        title="Analytics & Insights" 
        description="Comprehensive dashboard for monitoring pollution trends and cleanup operations." 
      />
      <AnalyticsFilters />
      <AnalyticsTabs />
      
      <div className="pt-2">
        {children}
      </div>
    </div>
  );
}
