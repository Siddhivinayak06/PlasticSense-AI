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
  iso_date: string;
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
  /** Null until at least one cleanup has been AI-verified. */
  avg_waste_reduction: number | null;
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

export interface InsightsData {
  class_distribution: { class_name: string; waste_group: string; count: number; avg_confidence: number }[];
  model_performance: {
    has_accuracy_metrics: false;
    accuracy_note: string;
    confidence_by_group: {
      waste_group: string;
      count: number;
      avg_confidence: number;
      min_confidence: number;
      max_confidence: number;
    }[];
    confidence_histogram: { bucket: string; count: number }[];
    latency_ms: { samples: number; mean: number | null; p50: number | null; p95: number | null };
    status_counts: Record<string, number>;
    with_location: number;
    location_sources: Record<string, number>;
  };
  cleanup_performance: { month: string; created: number; completed: number; completion_rate: number | null }[];
  open_assignments: number;
  severity_timeline: { date: string; iso_date: string; low: number; medium: number; high: number; critical: number }[];
  locations: {
    hotspot_id: string;
    name: string;
    reports: number;
    waste_objects: number;
    avg_risk_score: number | null;
    max_risk_score: number | null;
    severity: string;
    cleanups_completed: number;
    status: string;
  }[];
}

export async function fetchInsights(): Promise<InsightsData> {
  const { data } = await api.get<InsightsData>('/statistics/insights');
  return data;
}

export interface ModelInfo {
  device: string;
  image_size: number;
  detector: { name: string; architecture: string; classes: Record<string, string>; confidence_threshold: number };
  segmenter: { name: string; architecture: string; classes: Record<string, string>; confidence_threshold: number };
}

export async function fetchModelInfo(): Promise<ModelInfo> {
  const { data } = await api.get<ModelInfo>('/model/info');
  return data;
}

export interface HealthData {
  status: 'ok' | 'degraded';
  database: {
    status: string;
    backend?: string;
    provider?: string;
    using_fallback?: boolean;
    fallback_reason?: string | null;
    host?: string | null;
    latency_ms?: number;
  };
  models: { loaded: boolean; detector_weights_present: boolean; segmenter_weights_present: boolean };
}

export async function fetchHealth(): Promise<HealthData> {
  const { data } = await api.get<HealthData>('/health');
  return data;
}
