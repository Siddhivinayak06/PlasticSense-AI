'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchAssignments, type AssignmentItem } from '@/services/assignments';
import { CleanupDashboard } from '@/features/assignments/CleanupDashboard';
import { ClipboardList, CalendarDays, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CreateAssignmentDialog } from '@/features/assignments/CreateAssignmentDialog';
import type { CleanupAssignment, AssignmentStatus } from '@/types/assignment';
import type { Priority } from '@/types/hotspot';
import { useMemo } from 'react';

function mapBackendToCleanupAssignment(item: AssignmentItem): CleanupAssignment {
  const statusMap: Record<string, AssignmentStatus> = {
    'pending': 'pending',
    'assigned': 'assigned',
    'in_progress': 'in-progress',
    'completed': 'completed',
    'verified': 'verified',
    'rejected': 'closed',
  };

  const status: AssignmentStatus = statusMap[item.status] || 'pending';
  const priority: Priority = ['critical', 'high', 'medium', 'low'].includes(item.priority)
    ? (item.priority as Priority)
    : 'medium';

  const progress = status === 'verified' || status === 'completed'
    ? 100
    : status === 'in-progress'
    ? 50
    : status === 'assigned'
    ? 25
    : 0;

  return {
    id: item.id,
    hotspotId: item.hotspot_id || item.detection_id || 'HS-2026-01',
    hotspotName: item.location_name || item.title,
    assignedNgo: item.ngo_team_name || 'Pending Assignment',
    team: {
      id: item.ngo_team_id || 'team-default',
      name: item.ngo_team_name || 'Volunteers',
      ngo: item.ngo_team_name || 'Pending NGO',
      volunteers: [
        { id: 'v1', name: 'Field Supervisor', role: 'leader' },
        { id: 'v2', name: 'Logistics Lead', role: 'member' },
      ],
    },
    assignedDate: item.created_at,
    scheduledDate: item.scheduled_date || item.created_at,
    completionDate: item.completed_date || undefined,
    status,
    priority,
    progress,
    equipmentChecklist: [
      { id: 'eq-1', label: 'Heavy Duty Waste Bags & Gloves', completed: status !== 'pending' },
      { id: 'eq-2', label: 'Tongs / Debris Pickers', completed: status !== 'pending' },
      { id: 'eq-3', label: 'Safety Vests & First Aid Kit', completed: true },
      { id: 'eq-4', label: 'Transport / Collection Truck', completed: status === 'in-progress' || status === 'completed' },
    ],
    timeline: [
      { id: 'tl-1', stage: 'reported', label: 'Pollution Reported & Assessed', date: item.created_at, completed: true },
      { id: 'tl-2', stage: 'assigned', label: `Assigned to ${item.ngo_team_name || 'NGO Partner'}`, date: item.scheduled_date || item.created_at, completed: status !== 'pending' },
      { id: 'tl-3', stage: 'started', label: 'Cleanup Crew Deployed', date: item.scheduled_date || item.created_at, completed: status === 'in-progress' || status === 'completed' || status === 'verified' },
      { id: 'tl-4', stage: 'completed', label: 'Field Cleanup Concluded', date: item.completed_date || item.created_at, completed: status === 'completed' || status === 'verified' },
      { id: 'tl-5', stage: 'inspection', label: 'AI Post-Cleanup Inspection', date: item.completed_date || item.created_at, completed: status === 'verified' },
    ],
    estimatedDurationHours: 4,
    imagesBefore: item.before_image_url ? [item.before_image_url] : undefined,
    imagesAfter: item.after_image_url ? [item.after_image_url] : undefined,
    supervisorNotes: item.notes || `Risk Score: ${item.risk_score}/100. Target waste count: ${item.waste_count} items.`,
  };
}

export default function AssignmentsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['assignments'],
    queryFn: () => fetchAssignments(),
  });

  const assignments: CleanupAssignment[] = useMemo(() => {
    if (!data) return [];
    return data.map(mapBackendToCleanupAssignment);
  }, [data]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ClipboardList className="w-8 h-8 text-blue-500" />
            Cleanup Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage real cleanup assignments, monitor progress, and coordinate with NGOs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href="/assignments/calendar">
            <Button variant="outline" className="gap-2 bg-background/50">
              <CalendarDays className="w-4 h-4" />
              Calendar View
            </Button>
          </Link>
          <CreateAssignmentDialog />
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-border/50 bg-muted/20">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <CleanupDashboard assignments={assignments} />
      )}
    </div>
  );
}