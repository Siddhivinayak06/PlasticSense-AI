import axios from 'axios';
import type { DetectionEnvelope, RiskEnvelope } from '@/types/detection';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8000';

const api = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  timeout: 120_000, // 2 min — YOLO inference can be slow on CPU
});

/**
 * Submit an image + GPS coordinates to the detection endpoint.
 * Returns the full detection result (completed or failed).
 */
export async function submitDetection(
  file: File,
  latitude: number,
  longitude: number,
): Promise<DetectionEnvelope> {
  const form = new FormData();
  form.append('image', file);
  form.append('file', file);
  form.append('latitude', String(latitude));
  form.append('longitude', String(longitude));

  const { data } = await api.post<DetectionEnvelope>('/detections', form, {
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
 * Build a URL that resolves the backend-relative image path to a full URL.
 */
export function resolveImageUrl(imagePath: string): string {
  if (!imagePath) return '';
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  const path = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  return `${BASE_URL}${path}`;
}

