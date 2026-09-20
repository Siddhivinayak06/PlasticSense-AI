import { api } from '@/lib/api';

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
}

export async function fetchAssignments(statusFilter?: string): Promise<AssignmentItem[]> {
  const url = statusFilter ? `/assignments?status_filter=${statusFilter}` : '/assignments';
  const { data } = await api.get<AssignmentItem[]>(url);
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

export async function updateAssignment(id: string, payload: Partial<AssignmentItem>): Promise<AssignmentItem> {
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
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return data;
}
