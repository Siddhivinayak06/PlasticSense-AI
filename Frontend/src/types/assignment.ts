import { Priority } from './hotspot';

export type AssignmentStatus = 'pending' | 'assigned' | 'in-progress' | 'completed' | 'verified' | 'closed';

export interface Volunteer {
  id: string;
  name: string;
  role: 'leader' | 'member';
  avatar?: string;
}

export interface Team {
  id: string;
  name: string;
  ngo: string;
  volunteers: Volunteer[];
}

export interface TaskItem {
  id: string;
  label: string;
  completed: boolean;
}

export interface TimelineEvent {
  id: string;
  stage: 'reported' | 'verified' | 'assigned' | 'accepted' | 'started' | 'completed' | 'inspection' | 'closed';
  label: string;
  date: string;
  description?: string;
  completed: boolean;
}

export interface CleanupAssignment {
  id: string;
  hotspotId: string;
  hotspotName: string;
  assignedNgo: string;
  team: Team;
  assignedDate: string;
  scheduledDate: string;
  completionDate?: string;
  status: AssignmentStatus;
  priority: Priority;
  progress: number; // 0 to 100
  equipmentChecklist: TaskItem[];
  timeline: TimelineEvent[];
  estimatedDurationHours: number;
  imagesBefore?: string[];
  imagesAfter?: string[];
  supervisorNotes?: string;
}
