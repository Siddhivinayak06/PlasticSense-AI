'use client';

import { use } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { fetchHotspot, toHotspot } from '@/services/hotspots';
import { fetchMapDetections } from '@/services/detection';
import { fetchAssignments } from '@/services/assignments';
import { HotspotDetail } from '@/features/hotspots/HotspotDetail';
import { PageLoader } from '@/components/shared/PageLoader';
import { QueryError } from '@/components/shared/QueryError';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';

export default function HotspotDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const hotspotId = decodeURIComponent(id);

  const hotspot = useQuery({ queryKey: ['hotspot', hotspotId], queryFn: () => fetchHotspot(hotspotId), retry: false });
  const members = useQuery({ queryKey: ['map-detections'], queryFn: fetchMapDetections });
  const assignments = useQuery({ queryKey: ['assignments'], queryFn: () => fetchAssignments() });

  if (hotspot.isLoading) return <PageLoader label="Loading hotspot…" />;

  if (hotspot.isError) {
    if (isAxiosError(hotspot.error) && hotspot.error.response?.status === 404) {
      return (
        <div className="max-w-xl mx-auto pt-10 space-y-4">
          <EmptyState
            title="Hotspot not found"
            description="Hotspot IDs come from the cluster centre, so this one may have changed after new reports were added nearby."
          />
          <div className="flex justify-center">
            <Link href="/hotspots"><Button variant="outline">View current hotspots</Button></Link>
          </div>
        </div>
      );
    }
    return <QueryError onRetry={() => hotspot.refetch()} />;
  }

  return (
    <HotspotDetail
      hotspot={toHotspot(hotspot.data!)}
      members={members.data?.detections ?? []}
      assignments={assignments.data ?? []}
    />
  );
}
