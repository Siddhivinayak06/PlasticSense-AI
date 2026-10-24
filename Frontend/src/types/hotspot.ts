export type Priority = 'critical' | 'high' | 'medium' | 'low';
/** Derived on the backend from linked cleanup assignments. */
export type HotspotStatus = 'pending' | 'in-progress' | 'resolved' | 'verified';
export type HotspotSeverity = Priority | 'unknown';

export interface Location {
  lat: number;
  lng: number;
  address: string;
  city: string;
}

/**
 * An observed cluster of geolocated reports (single-link grouping within 2.5 km).
 * Descriptive only: it summarises reports that exist, it does not forecast.
 */
export interface Hotspot {
  id: string;
  name: string;
  location: Location;
  radiusM: number;
  reportCount: number;
  wasteObjects: number;
  /** Peak risk score of member reports; null when none has been assessed. */
  severityScore: number | null;
  avgRiskScore: number | null;
  severity: HotspotSeverity;
  /** Null when severity is unknown. */
  priority: Priority | null;
  plasticTypes: string[];
  mostCommonPlastic: string;
  status: HotspotStatus;
  assignedTeam?: string;
  lastUpdated: string;
  detectionIds: string[];
  assignmentIds: string[];
}

export interface HotspotFilters {
  severity?: string[];
  priority?: Priority[];
  status?: HotspotStatus[];
}
