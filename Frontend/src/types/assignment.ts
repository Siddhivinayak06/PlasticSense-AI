export type AssignmentStatus = 'pending' | 'assigned' | 'in-progress' | 'completed' | 'verified' | 'rejected';
export type AssignmentPriority = 'urgent' | 'high' | 'medium' | 'low';

/** UI view of a cleanup assignment. Every field comes from the API; nothing is filled in. */
export interface CleanupAssignment {
  id: string;
  title: string;
  locationName: string;
  detectionId: string | null;
  hotspotId: string | null;
  lat: number | null;
  lng: number | null;
  ngoTeamId: string | null;
  ngoTeamName: string | null;
  status: AssignmentStatus;
  priority: AssignmentPriority;
  severity: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  wasteBefore: number;
  wasteAfter: number | null;
  wasteReductionPercent: number | null;
  createdAt: string;
  updatedAt: string;
  scheduledDate: string | null;
  completedDate: string | null;
  beforeImageUrl: string | null;
  afterImageUrl: string | null;
  notes: string | null;
  isSample: boolean;
  /** Position in the workflow (0-100), derived from status. Not a measured completion. */
  workflowStage: number;
}

export interface TimelineEvent {
  id: string;
  label: string;
  date: string | null;
  completed: boolean;
  description?: string;
}
