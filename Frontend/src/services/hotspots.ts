import { api } from '@/lib/api';
import type { Hotspot, HotspotStatus, Priority } from '@/types/hotspot';

export interface HotspotBackendItem {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
  report_count: number;
  total_waste_objects: number;
  avg_risk_score: number | null;
  max_risk_score: number | null;
  severity: 'low' | 'medium' | 'high' | 'critical' | 'unknown';
  priority: 'low' | 'medium' | 'high' | 'urgent' | 'unranked';
  dominant_materials: string[];
  most_common_material: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'verified';
  assigned_team?: string | null;
  assignment_ids: string[];
  last_updated: string;
  detection_ids: string[];
}

export interface HotspotsResponse {
  hotspots: HotspotBackendItem[];
  total_hotspots: number;
  is_forecast: false;
  methodology: string;
}

export async function fetchHotspots(): Promise<HotspotsResponse> {
  const { data } = await api.get<HotspotsResponse>('/detections/hotspots');
  return data;
}

export async function fetchHotspot(id: string): Promise<HotspotBackendItem> {
  const { data } = await api.get<HotspotBackendItem>(`/detections/hotspots/${encodeURIComponent(id)}`);
  return data;
}

const STATUS: Record<HotspotBackendItem['status'], HotspotStatus> = {
  pending: 'pending',
  in_progress: 'in-progress',
  resolved: 'resolved',
  verified: 'verified',
};

export function toHotspot(h: HotspotBackendItem): Hotspot {
  const coords = `${h.latitude.toFixed(4)}, ${h.longitude.toFixed(4)}`;
  return {
    id: h.id,
    name: h.name,
    location: { lat: h.latitude, lng: h.longitude, address: coords, city: coords },
    radiusM: h.radius,
    reportCount: h.report_count,
    wasteObjects: h.total_waste_objects,
    severityScore: h.max_risk_score === null ? null : Math.round(h.max_risk_score),
    avgRiskScore: h.avg_risk_score,
    severity: h.severity,
    priority: h.severity === 'unknown' ? null : (h.severity as Priority),
    plasticTypes: h.dominant_materials,
    mostCommonPlastic: h.most_common_material,
    status: STATUS[h.status] ?? 'pending',
    assignedTeam: h.assigned_team ?? undefined,
    lastUpdated: h.last_updated,
    detectionIds: h.detection_ids,
    assignmentIds: h.assignment_ids ?? [],
  };
}
