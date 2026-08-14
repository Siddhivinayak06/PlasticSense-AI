import type { DetectionEnvelope, RiskEnvelope, Detection, MapDetectionEnvelope } from '@/types/detection';
import { api, resolveImageUrl } from '@/lib/api';

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
