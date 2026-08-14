import { api } from '@/lib/api';

export interface DashboardSummary {
  total_detections: number;
  total_objects_detected: number;
  recyclable_percentage: number;
  breakdown: Record<string, number>;
}

export interface Statistics {
  total_detections: number;
  waste_breakdown: Record<string, number>;
}

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const { data } = await api.get<DashboardSummary>('/statistics/dashboard/summary');
  return data;
}

export async function fetchStatistics(): Promise<Statistics> {
  const { data } = await api.get<Statistics>('/statistics');
  return data;
}
