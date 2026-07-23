'use client';

import { PlasticDistributionChart } from '@/features/analytics/PlasticDistributionChart';
import { LocationAnalyticsChart } from '@/features/analytics/LocationAnalyticsChart';
import { HotspotRankingTable } from '@/features/analytics/HotspotRankingTable';
import { mockPlasticDistribution, mockLocationData } from '@/mock/analytics';

export default function PlasticInsightsPage() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PlasticDistributionChart data={mockPlasticDistribution} />
        <LocationAnalyticsChart data={mockLocationData} />
      </div>
      
      <HotspotRankingTable data={mockLocationData} />
    </div>
  );
}
