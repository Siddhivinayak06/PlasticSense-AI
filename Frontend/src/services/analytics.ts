import { api } from '@/lib/api';

export interface DashboardSummary {
  total_detections: number;
  total_objects_detected: number;
  recyclable_percentage: number;
  breakdown: Record<string, number>;
  critical_hotspots?: number;
  pending_cleanups?: number;
  active_ngos?: number;
  completed_cleanups?: number;
  verified_cleanups?: number;
}

export interface Statistics {
  total_detections: number;
  waste_breakdown: Record<string, number>;
}

export interface AnalyticsTimeSeriesItem {
  date: string;
  total: number;
  resolved: number;
  critical: number;
}

export interface WasteCompositionItem {
  type: string;
  count: number;
  percentage: number;
}

export interface DynamicInsight {
  id: string;
  title: string;
  description: string;
  type: 'info' | 'warning' | 'success';
  impact: string;
}

export interface AnalyticsData {
  time_series: AnalyticsTimeSeriesItem[];
  severity_breakdown: Record<string, number>;
  risk_distribution: Record<string, number>;
  waste_composition: WasteCompositionItem[];
  insights: DynamicInsight[];
}

export interface ImpactCategoryItem {
  category: string;
  collected: number;
  percentage: number;
}

export interface ImpactData {
  total_detections: number;
  total_objects_detected: number;
  high_risk_sites: number;
  completed_cleanups: number;
  verified_cleanups: number;
  avg_waste_reduction: number;
  active_ngos: number;
  category_impact: ImpactCategoryItem[];
}

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const { data } = await api.get<DashboardSummary>('/statistics/dashboard/summary');
  return data;
}

export async function fetchStatistics(): Promise<Statistics> {
  const { data } = await api.get<Statistics>('/statistics');
  return data;
}

export async function fetchAnalytics(): Promise<AnalyticsData> {
  const { data } = await api.get<AnalyticsData>('/statistics/analytics');
  return data;
}

export async function fetchImpact(): Promise<ImpactData> {
  const { data } = await api.get<ImpactData>('/statistics/impact');
  return data;
}
