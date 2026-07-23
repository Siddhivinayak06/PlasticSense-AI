export type Priority = 'critical' | 'high' | 'medium' | 'low';
export type HotspotStatus = 'pending' | 'in-progress' | 'resolved' | 'verified';

export interface Location {
  lat: number;
  lng: number;
  address: string;
  city: string;
}

export interface Hotspot {
  id: string;
  name: string;
  location: Location;
  reportCount: number;
  severityScore: number; // 0 to 100
  criticalReports: number;
  plasticTypes: string[];
  priority: Priority;
  status: HotspotStatus;
  lastUpdated: string;
  cleanupProgress: number; // 0 to 100
  riskLevel: 'extreme' | 'high' | 'moderate' | 'low';
  trend: 'increasing' | 'stable' | 'decreasing';
  nearbyWaterBody?: string;
  mostCommonPlastic: string;
  assignedTeam?: string;
  recommendedAction: string;
  notes?: string;
}

export interface HotspotFilters {
  severity?: string[];
  priority?: Priority[];
  city?: string[];
  status?: HotspotStatus[];
  dateRange?: { start: string; end: string };
  plasticType?: string[];
  assignedNgo?: string[];
}
