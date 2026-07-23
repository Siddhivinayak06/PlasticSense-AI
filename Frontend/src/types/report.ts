// ─── Plastic Types ──────────────────────────────────────────────

export type PlasticType = 'bottle' | 'bag' | 'wrapper' | 'styrofoam' | 'multilayer' | 'other';

// ─── Severity ───────────────────────────────────────────────────

export type ReportSeverity = 'low' | 'medium' | 'high' | 'critical';

// ─── Status ─────────────────────────────────────────────────────

export type FullReportStatus =
  | 'pending'
  | 'verified'
  | 'assigned'
  | 'in-progress'
  | 'resolved'
  | 'rejected';

// ─── Cleanup Priority ───────────────────────────────────────────

export type CleanupPriority = 'low' | 'medium' | 'high' | 'urgent';

// ─── Sort Options ───────────────────────────────────────────────

export type ReportSortOption =
  | 'newest'
  | 'oldest'
  | 'severity'
  | 'confidence'
  | 'priority'
  | 'status';

// ─── View Mode ──────────────────────────────────────────────────

export type ReportViewMode = 'table' | 'card';

// ─── Status History Entry ───────────────────────────────────────

export interface StatusHistoryEntry {
  id: string;
  status: FullReportStatus;
  timestamp: string;
  note: string;
  user: string;
}

// ─── Report Comment ─────────────────────────────────────────────

export interface ReportComment {
  id: string;
  user: string;
  avatar: string;
  role: string;
  content: string;
  timestamp: string;
}

// ─── Full Report ────────────────────────────────────────────────

export interface Report {
  id: string;
  imageUrl: string;
  plasticType: PlasticType;
  plasticTypeLabel: string;
  confidence: number;
  detectedObjects: number;
  severity: ReportSeverity;
  cleanupPriority: CleanupPriority;
  status: FullReportStatus;
  reportedDate: string;
  lat: number;
  lng: number;
  city: string;
  address: string;
  assignedTeam: string;
  description: string;
  nearbyWaterBody: string;
  disposalMethod: string;
  statusHistory: StatusHistoryEntry[];
  comments: ReportComment[];
}

// ─── Filter State ───────────────────────────────────────────────

export interface ReportFilters {
  search: string;
  severity: ReportSeverity[];
  plasticType: PlasticType[];
  status: FullReportStatus[];
  cleanupPriority: CleanupPriority[];
  dateFrom: string;
  dateTo: string;
  location: string;
}

// ─── Status Stage (for timeline) ────────────────────────────────

export interface StatusStage {
  status: FullReportStatus;
  label: string;
  description: string;
}
