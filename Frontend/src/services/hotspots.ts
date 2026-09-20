import { api } from '@/lib/api';

export interface HotspotBackendItem {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
  report_count: number;
  total_waste_objects: number;
  avg_risk_score: number;
  max_risk_score: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dominant_materials: string[];
  most_common_material: string;
  status: string;
  last_updated: string;
  detection_ids: string[];
}

export interface HotspotsResponse {
  hotspots: HotspotBackendItem[];
  total_hotspots: number;
}

export async function fetchHotspots(): Promise<HotspotsResponse> {
  const { data } = await api.get<HotspotsResponse>('/detections/hotspots');
  return data;
}
