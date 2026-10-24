import { api } from '@/lib/api';
import type { AssignmentStatus, CleanupAssignment, TimelineEvent } from '@/types/assignment';

export interface AssignmentItem {
  id: string;
  title: string;
  detection_id?: string | null;
  hotspot_id?: string | null;
  location_name: string;
  latitude?: number | null;
  longitude?: number | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  severity: 'low' | 'medium' | 'high' | 'critical';
  risk_score: number;
  waste_count: number;
  waste_before: number;
  waste_after?: number | null;
  waste_reduction_percent?: number | null;
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'verified' | 'rejected';
  ngo_team_id?: string | null;
  ngo_team_name?: string | null;
  scheduled_date?: string | null;
  completed_date?: string | null;
  notes?: string | null;
  before_image_url?: string | null;
  after_image_url?: string | null;
  created_at: string;
  updated_at: string;
  /** Seeded demonstration record. */
  is_sample: boolean;
}

export async function fetchAssignments(statusFilter?: string): Promise<AssignmentItem[]> {
  const { data } = await api.get<AssignmentItem[]>('/assignments', {
    params: statusFilter ? { status_filter: statusFilter } : undefined,
  });
  return data;
}

export async function fetchAssignment(id: string): Promise<AssignmentItem> {
  const { data } = await api.get<AssignmentItem>(`/assignments/${id}`);
  return data;
}

export async function createAssignment(payload: Partial<AssignmentItem>): Promise<AssignmentItem> {
  const { data } = await api.post<AssignmentItem>('/assignments', payload);
  return data;
}

export interface AssignmentUpdate {
  status?: 'pending' | 'assigned' | 'in_progress' | 'completed';
  ngo_team_id?: string;
  notes?: string;
  scheduled_date?: string;
}

export async function updateAssignment(id: string, payload: AssignmentUpdate): Promise<AssignmentItem> {
  const { data } = await api.patch<AssignmentItem>(`/assignments/${id}`, payload);
  return data;
}

export async function verifyAssignment(id: string, file: File, notes?: string): Promise<AssignmentItem> {
  const formData = new FormData();
  formData.append('file', file);
  if (notes) {
    formData.append('notes', notes);
  }

  const { data } = await api.post<AssignmentItem>(`/assignments/${id}/verify`, formData, {
  });
  return data;
}

const STATUS: Record<AssignmentItem['status'], AssignmentStatus> = {
  pending: 'pending',
  assigned: 'assigned',
  in_progress: 'in-progress',
  completed: 'completed',
  verified: 'verified',
  rejected: 'rejected',
};

const STAGE: Record<AssignmentStatus, number> = {
  pending: 0,
  assigned: 25,
  'in-progress': 50,
  completed: 75,
  rejected: 75,
  verified: 100,
};

export function toCleanupAssignment(item: AssignmentItem): CleanupAssignment {
  const status = STATUS[item.status] ?? 'pending';
  return {
    id: item.id,
    title: item.title,
    locationName: item.location_name,
    detectionId: item.detection_id ?? null,
    hotspotId: item.hotspot_id ?? null,
    lat: item.latitude ?? null,
    lng: item.longitude ?? null,
    ngoTeamId: item.ngo_team_id ?? null,
    ngoTeamName: item.ngo_team_name ?? null,
    status,
    priority: item.priority,
    severity: item.severity,
    riskScore: item.risk_score,
    wasteBefore: item.waste_before,
    wasteAfter: item.waste_after ?? null,
    wasteReductionPercent: item.waste_reduction_percent ?? null,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
    scheduledDate: item.scheduled_date ?? null,
    completedDate: item.completed_date ?? null,
    beforeImageUrl: item.before_image_url ?? null,
    afterImageUrl: item.after_image_url ?? null,
    notes: item.notes ?? null,
    isSample: !!item.is_sample,
    workflowStage: STAGE[status],
  };
}

/** Timeline built only from stored timestamps; steps without a date show as not reached. */
export function assignmentTimeline(a: CleanupAssignment): TimelineEvent[] {
  const reached = (s: AssignmentStatus[]) => s.includes(a.status);
  return [
    { id: 'created', label: 'Assignment created', date: a.createdAt, completed: true },
    {
      id: 'assigned',
      label: a.ngoTeamName ? `Assigned to ${a.ngoTeamName}` : 'Team assigned',
      date: null,
      completed: reached(['assigned', 'in-progress', 'completed', 'verified', 'rejected']),
    },
    { id: 'scheduled', label: 'Scheduled', date: a.scheduledDate, completed: !!a.scheduledDate },
    { id: 'started', label: 'Cleanup in progress', date: null, completed: reached(['in-progress', 'completed', 'verified', 'rejected']) },
    { id: 'completed', label: 'Cleanup completed', date: a.completedDate, completed: reached(['completed', 'verified', 'rejected']) },
    {
      id: 'verified',
      label: a.status === 'rejected' ? 'AI verification failed' : 'AI verification passed',
      date: a.status === 'verified' || a.status === 'rejected' ? a.completedDate : null,
      completed: reached(['verified', 'rejected']),
      description:
        a.wasteReductionPercent !== null
          ? `${a.wasteBefore} → ${a.wasteAfter} detected objects (${a.wasteReductionPercent}% reduction)`
          : undefined,
    },
  ];
}
