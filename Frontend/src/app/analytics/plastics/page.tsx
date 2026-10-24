'use client';

import { PlasticDistributionChart } from '@/features/analytics/PlasticDistributionChart';
import { LocationAnalyticsChart } from '@/features/analytics/LocationAnalyticsChart';
import { HotspotRankingTable } from '@/features/analytics/HotspotRankingTable';
import { mockPlasticDistribution, mockLocationData } from '@/mock/analytics';
import { PrototypeBanner } from '@/components/shared/PrototypeBanner';

export default function PlasticInsightsPage() {
  return (
    <div className="space-y-6">
      <PrototypeBanner
        feature="plastic-type distribution and per-location analytics"
        requirement="Polymer/resin breakdown is not produced by the current pipeline."
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PlasticDistributionChart data={mockPlasticDistribution} />
        <LocationAnalyticsChart data={mockLocationData} />
      </div>
      
      <HotspotRankingTable data={mockLocationData} />
    </div>
  );
}
