'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchAssignments, toCleanupAssignment } from '@/services/assignments';
import { QueryError } from '@/components/shared/QueryError';
import { CleanupDashboard } from '@/features/assignments/CleanupDashboard';
import { ClipboardList, CalendarDays, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CreateAssignmentDialog } from '@/features/assignments/CreateAssignmentDialog';
import type { CleanupAssignment } from '@/types/assignment';
import { useMemo } from 'react';

export default function AssignmentsPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['assignments'],
    queryFn: () => fetchAssignments(),
  });

  const assignments: CleanupAssignment[] = useMemo(() => {
    if (!data) return [];
    return data.map(toCleanupAssignment);
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
            Track cleanup assignments from creation to AI-verified completion.
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

      {isError ? (
        <QueryError onRetry={() => refetch()} />
      ) : isLoading ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-border/50 bg-muted/20">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <CleanupDashboard assignments={assignments} />
      )}
    </div>
  );
}