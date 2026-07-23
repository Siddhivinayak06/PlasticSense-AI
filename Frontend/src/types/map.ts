export interface Hotspot {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radius: number; // in meters
  totalReports: number;
  averageSeverity: 'low' | 'medium' | 'high' | 'critical';
  criticalReports: number;
  lastUpdated: string;
  priorityBadge: string;
  plasticTypes: string[];
  cleanupProgress: number; // 0-100
  assignedTeam: string;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface MapOverlayState {
  showMarkers: boolean;
  showHeatmap: boolean;
  showHotspots: boolean;
  showClusters: boolean;
}
