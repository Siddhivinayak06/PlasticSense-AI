/** Observed cluster as drawn on the map (see services/hotspots.ts). */
export interface Hotspot {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radius: number; // in meters
  totalReports: number;
  wasteObjects: number;
  averageSeverity: 'low' | 'medium' | 'high' | 'critical' | 'unknown';
  maxRiskScore: number | null;
  lastUpdated: string;
  priorityBadge: string;
  plasticTypes: string[];
  status: 'pending' | 'in_progress' | 'resolved' | 'verified';
  assignedTeam?: string;
}

export interface MapOverlayState {
  showMarkers: boolean;
  showHeatmap: boolean;
  showHotspots: boolean;
  showClusters: boolean;
}
