import { useQuery } from '@tanstack/react-query';
import { fetchInsights } from '@/services/analytics';
import type { LocationData } from '@/types/analytics';
import type { InsightsData } from '@/services/analytics';

export function useInsights() {
  return useQuery({ queryKey: ['analytics-insights'], queryFn: fetchInsights });
}

export function toLocationData(locations: InsightsData['locations']): LocationData[] {
  return locations.map((l) => ({
    hotspotId: l.hotspot_id,
    name: l.name,
    reports: l.reports,
    wasteObjects: l.waste_objects,
    avgRisk: l.avg_risk_score,
    maxRisk: l.max_risk_score,
    severity: l.severity,
    cleanupsCompleted: l.cleanups_completed,
  }));
}

export function toCleanupPerformance(rows: InsightsData['cleanup_performance']) {
  return rows.map((r) => ({
    month: r.month,
    created: r.created,
    completed: r.completed,
    completionRate: r.completion_rate,
  }));
}
