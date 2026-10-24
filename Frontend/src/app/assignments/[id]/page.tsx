'use client';

import { use } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { fetchAssignment, toCleanupAssignment } from '@/services/assignments';
import { CleanupDetail } from '@/features/assignments/CleanupDetail';
import { PageLoader } from '@/components/shared/PageLoader';
import { QueryError } from '@/components/shared/QueryError';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';

export default function AssignmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['assignment', id],
    queryFn: () => fetchAssignment(id),
    retry: false,
  });

  if (isLoading) return <PageLoader label="Loading assignment…" />;

  if (isError || !data) {
    if (isAxiosError(error) && error.response?.status === 404) {
      return (
        <div className="max-w-xl mx-auto pt-10 space-y-4">
          <EmptyState title="Assignment not found" description={`No cleanup assignment exists with ID ${id}.`} />
          <div className="flex justify-center">
            <Link href="/assignments"><Button variant="outline">Back to Assignments</Button></Link>
          </div>
        </div>
      );
    }
    return <QueryError onRetry={() => refetch()} />;
  }

  // Keyed by id only: re-keying on every save would remount the form and discard
  // anything the user is still typing. Local fields already hold the saved values.
  return <CleanupDetail key={data.id} assignment={toCleanupAssignment(data)} />;
}
