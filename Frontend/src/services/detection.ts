import type { DetectionEnvelope, RiskEnvelope, Detection, MapDetectionEnvelope, RiskAssessment } from '@/types/detection';
import { api, resolveImageUrl } from '@/lib/api';
import type { HealthData } from '@/services/analytics';

export interface PaginatedDetections {
  data: Detection[];
  meta: {
    page: number;
    limit: number;
    total_items: number;
    total_pages: number;
  };
  error: string | null;
}

export { resolveImageUrl };

/**
 * Submit an image + GPS coordinates to the detection endpoint.
 * Returns the full detection result (completed or failed).
 */
export async function submitDetection(
  file: File,
  latitude: number | null,
  longitude: number | null,
): Promise<Detection> {
  const form = new FormData();
  form.append('image', file);
  form.append('file', file);
  if (latitude !== null) form.append('latitude', String(latitude));
  if (longitude !== null) form.append('longitude', String(longitude));

  const { data } = await api.post<Detection>('/detections/detect', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

/**
 * Fetch the risk assessment for a completed detection.
 */
export async function fetchRiskAssessment(detectionId: string): Promise<RiskEnvelope> {
  const { data } = await api.get<RiskEnvelope>(`/risk/${detectionId}`);
  return data;
}

/**
 * Fetch a paginated list of detections.
 */
export async function fetchDetections(page = 1, limit = 10): Promise<PaginatedDetections> {
  const { data } = await api.get<PaginatedDetections>('/detections', {
    params: { page, limit },
  });
  return data;
}

/**
 * Fetch a single detection by ID.
 */
export async function fetchDetection(id: string): Promise<DetectionEnvelope> {
  const { data } = await api.get<DetectionEnvelope>(`/detections/${id}`);
  return data;
}

/**
 * Fetch detections for the map view (only those with coordinates).
 */
export async function fetchMapDetections(): Promise<MapDetectionEnvelope> {
  const { data } = await api.get<MapDetectionEnvelope>('/detections/map');
  return data;
}

/**
 * Fetch system health status
 */
export async function fetchSystemHealth(): Promise<HealthData> {
  const { data } = await api.get<HealthData>('/health');
  return data;
}

export interface SystemConfig {
  waste_groups: Record<string, { color: string; hex: string }>;
}

/**
 * Fetch system UI configuration
 */
export async function fetchSystemConfig(): Promise<SystemConfig> {
  const { data } = await api.get<SystemConfig>('/health/config');
  return data;
}

const RISK_LEVELS = ['low', 'medium', 'high', 'critical'] as const;

/** Normalise the risk block embedded in a detection into a RiskAssessment. */
export function riskFromDetection(det: Detection): RiskAssessment | null {
  if (!det.risk) return null;
  const raw = det.risk.level?.toLowerCase();
  const level = (RISK_LEVELS as readonly string[]).includes(raw) ? (raw as RiskAssessment['level']) : 'medium';
  return {
    id: det.risk.id,
    detection_id: det.id,
    score: det.risk.score,
    level,
    severity: det.risk.severity,
    cleanup_priority: det.risk.cleanup_priority,
    explanation: det.risk.explanation,
    strategy_breakdown: det.risk.strategy_breakdown ?? {},
    computed_at: det.created_at,
  };
}
