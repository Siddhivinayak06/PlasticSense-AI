'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CleanupCalendar } from '@/features/assignments/CleanupCalendar';
import { fetchAssignments, toCleanupAssignment } from '@/services/assignments';
import { PageLoader } from '@/components/shared/PageLoader';
import { QueryError } from '@/components/shared/QueryError';

export default function CalendarPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['assignments'],
    queryFn: () => fetchAssignments(),
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div className="flex items-center gap-4">
        <Link href="/assignments" aria-label="Back to assignments">
          <Button variant="outline" size="icon" className="w-8 h-8 rounded-full">
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <CalendarDays className="w-7 h-7 text-blue-500" aria-hidden="true" />
            Cleanup Calendar
          </h1>
          <p className="text-muted-foreground mt-1">Scheduled cleanup operations by date.</p>
        </div>
      </div>

      {isLoading ? (
        <PageLoader label="Loading assignments…" />
      ) : isError ? (
        <QueryError onRetry={() => refetch()} />
      ) : (
        <CleanupCalendar assignments={(data ?? []).map(toCleanupAssignment)} />
      )}
    </div>
  );
}
