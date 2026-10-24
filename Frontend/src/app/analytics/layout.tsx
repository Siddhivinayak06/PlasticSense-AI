'use client';

import { AnalyticsHeader } from '@/features/analytics/AnalyticsHeader';
import { AnalyticsTabs } from '@/features/analytics/AnalyticsTabs';

export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-[1600px] mx-auto pb-10 space-y-6">
      <AnalyticsHeader 
        title="Analytics & Insights" 
        description="Figures computed from stored reports, risk assessments and cleanup assignments." 
      />
      <AnalyticsTabs />
      
      <div className="pt-2">
        {children}
      </div>
    </div>
  );
}
